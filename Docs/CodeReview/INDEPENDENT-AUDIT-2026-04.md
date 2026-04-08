# Independent Code Audit

**NewTon DC Tournament Manager v5.0.1**
*(Second Revision)*

April 2026

Prepared by: Claude (Anthropic)
Scope: Full codebase review — architecture, security, maintainability

---

## 1. Executive Summary

NewTon DC Tournament Manager is a well-engineered, offline-first darts tournament application. The codebase demonstrates strong architectural discipline in its core domain: bracket management, match progression, and scoring integrity. This audit examined ~15,000 lines across 20+ source files, including the Tournament Manager, Chalker scoring app, QR communication protocol, Docker deployment, and supporting documentation.

The application achieves its design goals with notable rigour. Bracket progression uses immutable lookup tables with a single code path for all match completions. The undo system is event-sourced with surgical rollback. The QR bridge protocol is well-specified with CRC integrity, replay protection, and TM-side score validation. Security is handled through a privacy-by-architecture model that neutralises traditional attack vectors by eliminating shared persistence, sessions, and external communication.

### Overall Grades

| Category | Grade | Notes |
|---|---|---|
| Architecture & Design | **A** | Lookup tables, single code path, event sourcing |
| Security | **A** | A+ / A on SecurityHeaders.com; privacy by architecture |
| Code Quality | **B+** | Good JSDoc, large files, global state fits design |
| Reliability & Data Integrity | **A** | Transaction log, undo cascade, QR validation |
| Testing | **C** | No automated tests; manual QA only |
| Documentation | **A** | 8 dedicated pages + release history; ships with app |

---

## 2. Architecture Strengths

### 2.1 Lookup-Table-Driven Bracket Progression

The bracket system is the centrepiece of the architecture. DE_MATCH_PROGRESSION and SE_MATCH_PROGRESSION are immutable, hardcoded lookup tables that map every match outcome to its winner and loser destinations for 8, 16, and 32-player brackets. This eliminates runtime bracket calculation entirely — every possible match result has a pre-computed destination. The approach trades code compactness for absolute determinism: there is no algorithm to get wrong.

### 2.2 Single Code Path Discipline

All match completions — manual entry, QR scan, walkover, auto-advancement — flow through completeMatch() → advancePlayer(). There is no alternative path for moving players between bracket positions. This is a deliberate and well-executed design choice that eliminates an entire class of state-consistency bugs.

### 2.3 Event-Sourced Undo System

Every match completion creates a transaction record. The undo system performs surgical rollback: it reverses bracket movements, restores player statistics (including achievements from QR-sourced results), and cascades through dependent matches. A rebuild-from-history mechanism with window.rebuildInProgress prevents side effects during replay. This is production-grade undo — rare in applications of this scale.

### 2.4 QR Bridge Protocol

The QR communication between Tournament Manager and Chalker is thoroughly specified in qr-protocol.html. The protocol uses compact field names to keep QR versions low, base64-encoded visit scores for ~45% size savings, CRC-32 integrity checking, replay protection via match state verification, and TM-side arithmetic validation that catches encoding bugs CRC cannot detect. The Chalker delivers raw facts; the TM derives all statistics. Separation of concerns is clean.

### 2.5 Hardcoded Ranking Logic

Each bracket size has its own ranking function (calculate8/16/32PlayerRankings for DE, calculateSERankings for SE). This mirrors the hardcoded bracket philosophy — rankings are as deterministic as the progression tables they complement. The apparent duplication is a deliberate design choice: each bracket size can encode its own ranking semantics without conditional branching or shared abstractions that might introduce edge-case errors.

### 2.6 Global State as Architectural Choice

The application uses global mutable state (tournament, players, matches, config) accessed from all modules. In a multi-user or multi-device application this would be a significant concern. NewTon is neither — it is a single-user, single-device application by design. localStorage and local execution enforce this naturally. The global state model is appropriate for the application's actual operating environment and avoids the accidental complexity that a state management framework would introduce for no benefit.

---

## 3. Security Assessment

### 3.1 Privacy-by-Architecture Security Model

NewTon's security model is its privacy model. The architecture eliminates traditional attack vectors by removing the preconditions they depend on:

- **No database** — no persistent shared storage means no stored XSS, no SQL injection, no data breach surface
- **No sessions** — no cookies, no tokens, nothing for an attacker to steal or hijack
- **No external communication** — connect-src 'self' CSP directive blocks data exfiltration to external servers
- **No user accounts** — no credentials to compromise, no privilege escalation possible
- **Read-only server surface** — static file delivery only; no write endpoints in default configuration

This is documented comprehensively in privacy.html. The model is not a mitigation — it is an elimination of attack surface.

### 3.2 Tiered CSP Strategy

The application implements a two-tier Content Security Policy, validated externally on a live Docker deployment:

- **A+ (landing page and all documentation)** — strict CSP with zero inline scripts or styles. Every inline handler and style attribute was extracted to external files in v4.2.13.
- **A (Tournament Manager and Chalker)** — unsafe-inline required for 93+ inline event handlers and 266+ inline style attributes, which are an architectural necessity for offline single-file deployment. External resource loading remains fully blocked (script-src 'self').

The tiered strategy was an explicit engineering goal: strict where possible, unsafe-inline only where architecturally required. Both tiers were graded by SecurityHeaders.com on a live deployment.

### 3.3 Security Headers

All six recommended security headers are present and correctly configured:

- Content-Security-Policy (tiered as described above)
- X-Frame-Options: SAMEORIGIN (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (disables geolocation, microphone, payment, USB, etc.)
- Strict-Transport-Security with preload (enforces HTTPS)

### 3.4 REST API Surface

The optional REST API (api/upload-tournament.php) is not available when running the application from tournament.html directly, and is disabled by default in Docker deployments (NEWTON_API_ENABLED=false). It must be explicitly enabled as an active choice for self-hosted instances. When enabled, the implementation includes proper security: basename() for path traversal prevention, .json extension validation, null byte checks, and 409 Conflict handling for overwrites. The CORS Access-Control-Allow-Origin: * header is a non-issue in practice given the API is opt-in and intended for trusted private networks.

### 3.5 CRC-32 Integrity (QR Protocol)

The QR protocol uses CRC-32 for payload integrity, implemented in newton-integrity.js (shared identically between TM and Chalker). CRC-32 is not a cryptographic hash — it is not intended to be. Its purpose is corruption detection during QR scanning, complementing the QR code's built-in error correction.

The practical barriers to tampering are high: an attacker would need to intercept and modify a QR code in real time during a live match, in a physical venue, between two devices communicating via camera. The protocol also includes replay protection (match state verification, tournament ID, server ID), and TM-side arithmetic validation that catches data errors CRC alone would miss. The verify() interface is algorithm-agnostic — a stronger algorithm could be swapped in without changing callers. At 8 hex characters versus SHA-256's 64, CRC-32 is the right trade-off for QR payload size.

### 3.6 On the XSS Question

The innerHTML usage with player names in match history rendering is the only potential XSS vector. However, in context this is a self-attack scenario: a user would need to inject malicious markup into their own player names in their own browser's localStorage. There is no shared persistence, no way for the injection to reach other users, and connect-src 'self' prevents exfiltration even if script execution occurred. Adopting textContent would be a hygiene improvement but the architectural risk is negligible. Severity: Minor/Hygiene.

---

## 4. Documentation

The project includes a comprehensive documentation suite of eight dedicated HTML pages plus a full release history, all shipping with the application itself:

- **privacy.html** — Privacy-by-architecture model, security headers, localStorage mechanics, FAQ
- **architecture.html** — System architecture and design principles
- **qr-protocol.html** — Full QR communication protocol specification: message schemas, score encoding, CRC-32 rationale, replay protection, TM-side validation, size analysis
- **rest-api.html** — REST API endpoint reference
- **docker-quickstart.html** — Three copy-paste-ready Docker Compose configurations (Mac/Windows, Linux with mDNS, reverse proxy) with environment variables, security guidance, and troubleshooting
- **userguide.html** — End-user guide for tournament operation
- **design-system.html** — Visual design reference
- **releases/** — Individual release notes for every version, documenting changes, rationale, and migration guidance

Each document serves a distinct audience without overlap: operators get the user guide and Docker quickstart, developers get the architecture and protocol specs, and privacy-conscious users get a thorough explanation of the data model. The documentation is not an afterthought — it directly informed this audit, and several initial findings were corrected by design rationale the author had already documented.

Notably, the documentation is HTML — consistent with the offline-first philosophy. It ships with the application, requires no external platform, and cannot go stale in a separate wiki. For a single-developer project, this level of documentation is exceptional.

---

## 5. Areas for Improvement

### 5.1 Automated Testing (Priority: High)

The codebase has no automated tests. For a tournament manager where bracket progression correctness is critical, this is the single most impactful improvement available. The lookup-table architecture is highly testable — each entry in DE_MATCH_PROGRESSION and SE_MATCH_PROGRESSION can be verified mechanically. The completeMatch → advancePlayer pipeline has clear inputs and outputs. A regression suite covering progression, undo/redo, and ranking calculations would significantly increase confidence during refactoring and feature additions.

### 5.2 File Size Management (Priority: Medium)

Several files exceed comfortable maintenance thresholds: bracket-rendering.js (~4,260 lines) and clean-match-progression.js (~2,530 lines) are the largest. The rendering file in particular contains hardcoded pixel positions for each bracket size — these could be split into per-format modules. The progression file is more defensible given the lookup-table architecture, but extracting the ranking functions into a separate module would improve navigability without changing the design philosophy.

### 5.3 textContent Adoption (Priority: Low)

Switching innerHTML to textContent where user-derived strings are inserted would be a low-effort hygiene improvement. While the architectural security model neutralises the practical risk, defence-in-depth is a sound principle and the change would be straightforward.

### 5.4 Magic Numbers in Rendering (Priority: Low)

bracket-rendering.js contains hardcoded pixel coordinates for bracket positioning. Named constants or a configuration object would improve readability. This is a cosmetic concern — the values work correctly and are tied to specific bracket sizes, but they require context to understand when reading the code.

---

## 6. Audit Corrections and Clarifications

*This section documents corrections made after discussion with the application's author, where the initial audit assessment was inaccurate or lacked context provided by the application's documentation.*

### 6.1 XSS Severity (First Revision)

The initial audit flagged innerHTML usage as a Major security vulnerability. After reviewing privacy.html, which documents the privacy-by-architecture model, this was downgraded to Minor/Hygiene. The absence of shared persistence, sessions, and external communication means traditional XSS attack chains cannot be constructed. See section 3.6.

### 6.2 REST API and CORS (Second Revision)

The initial audit flagged Access-Control-Allow-Origin: * as a security concern. In practice, the REST API is unavailable when running from tournament.html and disabled by default in Docker (NEWTON_API_ENABLED=false). It requires an explicit, active choice to enable. The CORS header is appropriate for its intended use in trusted private networks. See section 3.4.

### 6.3 CRC-32 Strength (Second Revision)

The initial audit noted CRC-32 is not cryptographic, which implied it was a weakness. The qr-protocol.html documentation clarifies the design rationale: CRC-32 is deliberately chosen for corruption detection (8 chars vs SHA-256's 64), the real-world tampering barriers are high, and the protocol includes additional protections (replay guard, score validation) that CRC alone would not provide. See section 3.5.

### 6.4 Global Mutable State (Second Revision)

The initial audit flagged global state as a scalability and maintainability concern. NewTon is a single-user, single-device application by design — localStorage and local execution enforce this. The global state model is appropriate for the actual operating environment and avoids unnecessary abstraction. See section 2.6.

### 6.5 Duplicated Ranking Logic (Second Revision)

The initial audit flagged per-bracket-size ranking functions as code duplication. This mirrors the hardcoded bracket philosophy: each bracket size encodes its own ranking semantics, just as it has its own progression table. The duplication is deliberate and eliminates conditional branching in ranking calculations. See section 2.5.

### 6.6 Inline Styles in JavaScript (Second Revision)

The initial audit flagged inline styles as a maintenance concern. The 93+ inline event handlers and 266+ inline style attributes are an architectural requirement for offline single-file deployment. This is documented in privacy.html and was the subject of deliberate engineering work in v4.2.13, which extracted all inlines from landing and documentation pages to achieve A+ CSP while consciously retaining them in the tournament app. See section 3.2.

### 6.7 SecurityHeaders.com Validation (Second Revision)

The initial audit did not include external validation. Live Docker deployment scans confirm A+ for landing page and documentation (strict CSP, zero inline code) and A for the Tournament Manager (unsafe-inline required, all other headers present). Both grades from SecurityHeaders.com on 8 April 2026. See section 3.2.

---

## 7. Conclusion

NewTon DC Tournament Manager is a thoughtfully designed application that makes deliberate architectural choices and follows through on them consistently. The lookup-table bracket system, single code path discipline, event-sourced undo, and privacy-by-architecture security model are each individually strong; together they create a cohesive and reliable tournament management platform.

The primary recommendation is automated testing — the architecture is highly testable and a regression suite would be the highest-value addition to the codebase. File size management is a secondary concern. Security is handled with a maturity that exceeds most applications in this category, validated by external tooling.

Several initial findings were corrected after discussion with the author, who provided documentation (privacy.html, qr-protocol.html, v4.2.13 release notes) that demonstrated deliberate design intent behind choices the audit had flagged as concerns. These corrections are documented transparently in section 6. The revised assessment reflects a more accurate understanding of the application's design philosophy.
