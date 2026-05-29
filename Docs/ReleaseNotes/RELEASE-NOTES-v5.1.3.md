# Release Notes — v5.1.3 — Cannot Operate on Soup

**NewTon DC Tournament Manager v5.1.3 — May 29, 2026**

---

## Overview

A short, quiet release. A redundant helper line trimmed from the Confirm Winner dialog. The Late Arrival info dialog rebuilt so the actual operator steps get visual focus rather than dissolving into a wall of prose. A new reusable dialog component, `.dlg__note`, for grouping framed content inside any dialog. A JSON-LD fix on the landing page that quietly corrects a long-standing structured-data signal which had been telling Google (and AI services) that NewTon's canonical home was the GitHub repository instead of `newtondarts.com`.

The tagline is the only loud thing about this release, and it doesn't even explain itself.

---

## Confirm Winner — one fewer line for the eye to parse

The Final Score row in the Confirm Winner dialog had a small italic helper text: *"Winner must have more legs than loser."* The same message is raised dynamically by the form validator whenever the leg counts are actually inverted. The static helper was redundant — and worse, it added a third element to the row that had to be parsed before getting to the inputs. Gone now.

---

## Late Arrival info dialog — focus on the actual instructions

This dialog explains a small back-of-house operation (registering a player after the bracket has been drawn) by walking the operator through the Developer Console. It used to read as a wall of muted prose: three paragraphs of similar weight, with the actual operator steps buried in the middle.

Three changes:

**The first paragraph now adapts to the Developer Console setting.** When the operator already has the Developer Console enabled in Global Settings, the lead-in collapses to a single sentence: *"To register a late arrival, open the **Developer Console** by clicking the version number in the lower-right corner of the Tournament Bracket."* When the Developer Console is disabled, the original two-step instruction (enable, then open) is shown. Operators who've already opted in no longer have to skip past instructions for a setting they've already configured.

**The two action paragraphs are now wrapped in a `.dlg__note` framed panel.** Single shared frame, white background, soft elevation shadow, 1px border, 8px corner radius. The actual steps — what to type in the Developer Console, and what happens to the new player on the bracket — get the visual focus instead of dissolving into the surrounding prose. Text inside the panel is rendered in the dialog's primary body color rather than the muted helper-text gray, so the framed content reads as primary content.

**A new italic caption sits below the framed panel** explaining *why* this operation lives in the Developer Console rather than the main UI, in one line: *"The Developer Console is for changes made after a tournament has started — outside the normal workflow."* Muted gray so it reads as an aside rather than competing with the framed instructions above it.

The dialog now has three clearly weighted regions: lead-in prose, framed steps, italic aside. The procedure stops feeling like a footnote.

---

## New dialog component — `.dlg__note`

A small reusable building block added to the dialog system. White background like the surrounding dialog, 1px subtle border, 8px corner radius, soft elevation shadow. Stacked children get automatic 10px vertical spacing. Scoped text-color override so framed content reads as primary text. Currently used only by the Late Arrival dialog, but available to any future dialog that needs to group a procedure or callout inside its body.

Full reference in [`Docs/DIALOGS.md`](../DIALOGS.md), in the new "The `.dlg__note` panel" section.

---

## SEO / discoverability — JSON-LD canonical signal

A long-standing structured-data issue on the landing page has been quietly fixed.

The `SoftwareApplication` JSON-LD block on `landing-page.php` (the Docker-served landing page) had `"url"` pointing at the GitHub repository — explicitly telling Google and other JSON-LD consumers that the canonical home of the project lived on github.com. The static `landing.html` variant was silent on `url` altogether, which left Google falling back to link-structure heuristics and domain authority — both of which also favor GitHub by a wide margin. The result was visible in search results and AI summaries that kept pointing at `github.com/skrodahl/NewTon` as the project's home rather than `newtondarts.com`.

Both files now carry the right pair of signals:

- `"url"` — `https://newtondarts.com/` (canonical site)
- `"codeRepository"` — `https://github.com/skrodahl/NewTon` (source repo, where it actually belongs in Schema.org)

The PHP variant uses the same conditional-emission pattern as the existing `og:url` and `<link rel="canonical">` fragments — the `"url"` field is omitted entirely when `NEWTON_BASE_URL` is unset, so self-hosted deployments don't accidentally advertise empty strings as their canonical URL.

The other parts of the schema were already clean: the `offers` block correctly wraps price and currency, and `license` is already an SPDX URL. The two new properties were the only meaningful addition needed.

**Realistic expectations:** The structured-data fix tells Google what the canonical URL *should* be; it does not override GitHub's domain authority or backlink profile overnight. Correction will be gradual as Google re-indexes and as more references to `newtondarts.com` accumulate.

---

## Footer easter egg

A small `42` now trails the cheeky *"No popups? No cookies!"* line in the landing-page footer. Muted brown, monospaced, no underline — sits at the edge of attention. Hover firms it up to the standard footer-link brown. Clickable.

Where it goes is left as an exercise for the reader. Bonus points for anyone with *The Long Dark Tea-Time of the Soul* within arm's reach.

---

## Documentation

- **Updated:** [`Docs/DIALOGS.md`](../DIALOGS.md) — new "The `.dlg__note` panel" section between Buttons and Helpers, with anatomy, when-to-use guidance, and the text-color rationale. Migrated-dialogs table entry for Late Registration Info now reads `default + .dlg__note` so the use of the new component is discoverable from the index.

---

## Migration

**No data migration required.** All tournament data, history, transactions, and exports are fully compatible. CSS-only additions and a single conditional in the late-arrival dialog handler; all other dialogs are unaffected. The JSON-LD changes are HTML-level only — no server, database, or client behavior changes.

---

*NewTon DC Tournament Manager v5.1.3 — Cannot Operate on Soup.*
