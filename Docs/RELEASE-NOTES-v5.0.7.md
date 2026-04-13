# Release Notes — v5.0.7 — The Offline Authority in Darts

**NewTon DC Tournament Manager v5.0.7 — April 13, 2026**

---

## Overview

The product outgrew its pitch. v5.0.7 rewrites the landing page to match what NewTon actually is now — not just an offline tournament manager, but a complete system that runs locally, syncs across devices, and builds your venue's stats over time.

New hero messaging. New story cards. Every "In Action" card rewritten with the same voice that powers the release taglines. Documentation updated to reflect the v5 reality — Analytics, server backup, IndexedDB, and the relay architecture.

---

## Landing Page

**Hero:**
- Tagline: "The Offline Authority in Darts."
- Subtitle: "Runs locally. Syncs across devices. Builds your venue's stats over time."

**Story cards** — three bare-text beats between the hero and the launch buttons:
- "Yours. Not theirs." — No signup, no subscription, no cloud. Works without asking permission.
- "Scan. Score. Done." — The Chalker handles the board. QR codes handle the rest.
- "Every match remembered." — Analytics that grow with your club.

**In Action cards** — all seven rewritten with titles, tighter body text, and italic closers:
- "The Bracket, Properly." → "A bracket you can trust."
- "From Board to Bracket in One Scan." → "No walking results across the room."
- "One Panel to Run the Night." → "Less admin. More darts."
- "Registration Without the Fuss." → "Because retyping names is not a sport."
- "From Zero to Bracket in 60 Seconds." → "No configuration rabbit holes."
- "BYEs Handled Like Adults." → "The bracket doesn't play favorites."
- "Give the Winner Their Moment." → "The night ends. The record doesn't."

**Meta tags** — description, Schema.org, Open Graph, and Twitter Card updated.

---

## Documentation Updates

- **llms.txt** — full refresh with new messaging, Analytics section, Server Backup section, updated privacy model, expanded architecture notes.
- **architecture.html** — Offline-First section updated to include IndexedDB and opt-in server backup. Single-user limitation reworded.
- **REST API docs** — relay endpoint, auto-backup, backup modal, and Global Settings config table added to both Markdown and HTML versions.
- **Design system** — feature card restyled (left border accent). Dark card and bare card variants documented.

---

## Migration

No migration required. This release contains no application logic changes — only landing page, documentation, and meta tag updates.

---

**NewTon DC Tournament Manager v5.0.7 — The Offline Authority in Darts.**
