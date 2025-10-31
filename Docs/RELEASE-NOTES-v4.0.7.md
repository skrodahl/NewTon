## NewTon DC Tournament Manager v4.0.7 Release Notes

**Release Date:** October 31, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.7** enhances documentation and distribution channels for self-hosters. Security headers implemented in v4.0.0 are now fully documented across Docker deployment guides, and the Docker Hub publishing workflow enables broader discoverability for new users.

This release contains no breaking changes and is a drop-in replacement for v4.0.6.

**Key Highlights:**
- Security headers comprehensively documented in Docker deployment guides
- Docker Hub publishing workflow added alongside existing GHCR workflow
- Documentation now explains CSP rationale, HSTS guidance, and privacy enhancements
- Both distribution channels (GHCR and Docker Hub) automatically updated on version tags

---

## 📖 Documentation Enhancements

### Security Headers Documentation

**Context:**
Security headers were implemented in v4.0.0 (X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy, etc.) and achieved an A-grade security rating on [securityheaders.com](https://securityheaders.com). However, these features were not prominently documented in Docker deployment guides.

**What's New in v4.0.7:**
Comprehensive security headers documentation added to three key files with varying levels of detail appropriate for each audience.

---

#### DOCKER-QUICKSTART.md - Overview Style

**New Section:** "🛡️ Security Headers"

Added user-friendly overview covering:

**Headers Included by Default:**
- X-Frame-Options: SAMEORIGIN (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- Referrer-Policy: strict-origin-when-cross-origin (reduces data leakage)
- Permissions-Policy (disables unused browser features)
- Content-Security-Policy (blocks external resources)
- Server tokens hidden (nginx and PHP versions)

**Security Rating:**
- A grade on securityheaders.com
- Testing instructions with expected results

**Content Security Policy:**
- Configuration breakdown (default-src, script-src, style-src, img-src)
- Why 'unsafe-inline' is required for single-file architecture
- What CSP still protects against (external scripts, data exfiltration, iframes)

**HSTS Guidance:**
- Why HSTS is not included by default
- How to add HSTS at reverse proxy level (Nginx Proxy Manager, Caddy)
- Configuration examples for both platforms

**Impact Summary:**
- Security headers enabled by default (no configuration needed)
- A-grade security rating from day one
- Complements privacy-by-architecture model

**Why It Matters:**
Self-hosters can now quickly understand the security posture of their deployment without reading technical implementation details. The overview style matches the "Quick Start" nature of the document.

---

#### docker/README.md - Comprehensive Technical Documentation

**New Section:** "🛡️ Security Headers"

Added detailed technical documentation covering:

**Each Header Explained:**
- X-Frame-Options: Full explanation with attack vector description
- X-Content-Type-Options: Browser behavior and security implications
- Referrer-Policy: Privacy protection mechanisms
- Permissions-Policy: Complete list of disabled features with rationale
- Content-Security-Policy: Primary defense against XSS via external resources
- Server Tokens Hidden: Information disclosure prevention

**Content Security Policy Deep Dive:**
- Complete CSP configuration with all directives
- Why 'unsafe-inline' is Required section:
  - 68+ inline event handlers (onclick, onchange, onfocus)
  - 217+ inline style attributes
  - Architectural requirements (single-file deployment, offline operation, simplicity)
- What CSP Still Protects Against (5 specific protections listed)
- What 'unsafe-inline' Weakens (XSS via injected inline scripts)
- Why This is Acceptable (no user-generated content, no XSS attack vectors, refactoring impact)

**HSTS Configuration:**
- Detailed explanation of why not included by default
- Configuration examples for Nginx Proxy Manager and Caddy
- Why reverse proxy approach is better (SSL/TLS termination awareness, deployment flexibility)

**Testing Instructions:**
- Step-by-step verification process
- Expected results breakdown (grade, headers count, warnings)

**Impact Analysis:**
- For Self-Hosters: Default protection, A-grade rating, no breaking changes
- For Demo Site: Security improvements, visitor protection
- For Privacy: How headers complement privacy-by-architecture

**Why It Matters:**
Developers and security-conscious self-hosters get complete technical details explaining the security implementation, trade-offs, and rationale. This level of detail builds trust and enables informed decision-making.

---

#### Docs/PRIVACY.md - Privacy Integration

**New Subsection:** "Security Headers and Privacy" (under "Self-Hosting Considerations")

Added privacy-focused explanation covering:

**Privacy-Enhancing Headers:**
- Referrer-Policy: Reduces data leakage to external sites
- Content-Security-Policy: Prevents unauthorized network requests and data exfiltration
- Permissions-Policy: Disables privacy-invasive browser features (geolocation, microphone, camera)

**Additional Security Headers:**
- X-Frame-Options (clickjacking prevention)
- X-Content-Type-Options (MIME sniffing prevention)
- Server tokens hidden (information disclosure reduction)

**Privacy Context:**
- Headers enabled by default (no configuration required)
- A-grade security rating
- CSP prevents scripts from making unauthorized network requests
- Referrer-Policy limits information leakage when clicking links
- Multiple layers of privacy protection when combined with localhost-only storage

**Cross-Reference:**
Links to DOCKER-QUICKSTART.md for complete security headers documentation

**Why It Matters:**
Privacy-conscious users understand how security headers enhance the existing privacy-by-architecture model. The integration shows security and privacy working together, not as separate concerns.

---

## 🚢 Distribution Enhancements

### Docker Hub Publishing Workflow

**Previous Behavior:**
- Images published only to GitHub Container Registry (GHCR)
- Single workflow: `.github/workflows/docker-build.yml`
- Discoverability limited to GitHub ecosystem

**What's New:**
Separate Docker Hub publishing workflow added for broader distribution and discoverability.

**New Workflow:** `.github/workflows/docker-hub-publish.yml`

**Architecture:**
- **Independent from GHCR workflow** - No risk of disrupting existing publishing
- **Separate workflow file** - Clean separation of concerns
- **Same triggers** - Version tags (v4.0.7, etc.) automatically publish to both registries
- **Manual trigger available** - Can publish to Docker Hub independently via Actions tab

**Features:**
- **Multi-architecture support** - Builds for linux/amd64 and linux/arm64
- **Automatic tagging** - Creates latest, major.minor.patch, major.minor, and major tags
- **GitHub Actions cache** - Faster builds using cache-from/cache-to

**Pull from Either Registry:**
```bash
# GitHub Container Registry
docker pull ghcr.io/skrodahl/newton:latest

# Docker Hub
docker pull skrodahl/newton:latest
```

**Why It Matters:**

**For Discoverability:**
- Docker Hub is the default registry most users search
- Better SEO and visibility in Docker ecosystem
- Complements selfh.st newsletter feature with broader reach

**For Users:**
- Choice of registry (Docker Hub familiar to most users)
- No functional difference - same image, same tags, same multi-arch support
- Docker Hub may have better pull rate limits for some users

**For Maintainability:**
- Both workflows independent - failure in one doesn't affect the other
- Can publish to Docker Hub manually if needed
- GHCR remains primary with GitHub integration benefits

**For Trust:**
- Docker Hub presence signals established project
- Official Docker Hub listing increases legitimacy
- Broader distribution reduces single-point-of-failure concerns

---

### docker/README.md Distribution Documentation

**New Section:** "🚢 Publishing to Docker Registries"

Added comprehensive documentation covering both GHCR and Docker Hub publishing:

**GitHub Container Registry (GHCR):**
- Workflow file reference
- Published location (ghcr.io/skrodahl/newton)
- Trigger instructions (git tag commands)
- Pull examples

**Docker Hub:**
- Workflow file reference
- Published location (skrodahl/newton)
- Automatic and manual trigger methods
- Pull examples

**Setup Requirements:**
- Step-by-step Docker Hub setup (repository creation, token generation, secrets configuration)
- GHCR setup (automatic, no configuration needed)

**Multi-Architecture Support:**
- Both AMD64 and ARM64 explicitly listed

**Tagging Strategy:**
- Explains what tags are created from version tags
- Example: v4.0.7 creates latest, 4.0.7, 4.0, and 4 tags

**Why It Matters:**
Developers and maintainers have complete reference for both distribution channels, setup requirements, and publishing workflows. Documentation matches the actual implementation.

---

## 🚀 Migration from v4.0.6

### Automatic

- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to application behavior
- All tournament data, history, and settings preserved

### What's New

After upgrading to v4.0.7:
1. **Documentation updated** - Security headers now comprehensively documented
2. **Docker Hub available** - Images published to both GHCR and Docker Hub
3. **No visual changes** - Application appearance and behavior unchanged
4. **No new features** - This is a documentation and distribution release

### Compatibility

- All v4.0.x tournaments work in v4.0.7
- v4.0.7 exports identical to v4.0.6 exports
- No changes to core tournament functionality
- Docker images available from two registries (GHCR and Docker Hub)

### For Existing Deployments

**No action required:**
- Existing deployments continue working
- Update via standard process: `docker compose pull && docker compose up -d`
- Security headers already enabled (since v4.0.0)
- Documentation changes don't affect runtime behavior

**Optional - Switch to Docker Hub:**
```yaml
# Current (GHCR)
image: ghcr.io/skrodahl/newton:latest

# New option (Docker Hub)
image: skrodahl/newton:latest
```

Both point to identical images. Choice is user preference.

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **DOCKER-QUICKSTART.md**: Quick start guide with security headers overview
- **docker/README.md**: Comprehensive Docker documentation with security deep-dive
- **Docs/PRIVACY.md**: Privacy architecture with security integration
- **Docs/RELEASE-NOTES-v4.0.6.md**: Dynamic navigation menu enhancement
- **Docs/RELEASE-NOTES-v4.0.5.md**: UI terminology improvements
- **Docs/RELEASE-NOTES-v4.0.4.md**: Font system improvements and CSS variable control
- **Docs/RELEASE-NOTES-v4.0.3.md**: Developer Console placement rank enhancement
- **Docs/RELEASE-NOTES-v4.0.2.md**: Referee conflict detection and pre-v4.0 import optimization
- **Docs/RELEASE-NOTES-v4.0.1.md**: Documentation improvements and code cleanup
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.7** - Comprehensive security documentation and Docker Hub distribution for broader visibility and self-hoster confidence.
