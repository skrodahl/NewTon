# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Chalker Persistence

**Goal:** Match data survives page reload, history of past matches.

**Storage decision: IndexedDB**

Chose IndexedDB over localStorage for these reasons:
- Larger storage (~50MB+ vs ~5MB)
- Selective cleanup: can delete matches older than X days using indexes
- Potential to share unified database with Tournament Manager later
- Complexity is manageable with a thin wrapper (~40 lines)

**Database structure (draft):**
- Database: `newton`
- Stores: `chalker_current`, `chalker_history`

*Note: Tournament Manager stays on localStorage - storage needs are modest after optimization. No need for shared database.*

**Features to consider:**
- Auto-save current match on every score entry
- Resume unfinished match on page load
- History screen to view past matches
- Option to continue incomplete matches

**Open questions:**
- How much history to retain? (last 10? 50? configurable?)
- Cleanup threshold (delete matches older than X days?)

---

### Nginx: /chalker redirect issue

**Problem:** `/chalker` (without trailing slash) doesn't redirect to `/chalker/` when behind Nginx Proxy Manager.

**Attempted fixes:**
- `location = /chalker { return 301 /chalker/; }` — redirects to internal port 2020
- `location ~ ^/chalker$ { return 301 $uri/; }` — same issue
- `location ~ ^/chalker$ { return 301 chalker/; }` — relative redirect, still not working

**Status:** Deferred. `/chalker/` works fine, only the no-trailing-slash URL is broken.

**Workaround:** Use `/chalker/` URL directly.

---

### Chalker tablet scaling needs more work

**Problem:** Current 1.8x scaling at 768px+ breakpoint isn't noticeable enough on 9" tablets.

**Device details:**
- Lenovo 9" tablet: 1340x800 resolution
- Portrait mode: 800x1340 (800px width barely triggers 768px breakpoint)
- Also needs to work on iPad

**Current state:** v4.1.4 has ~1.8x scaling, but it's not dramatic enough for the screen size.

**Options to explore:**
- Increase scaling another 1.25x (total ~2.25x from phone)
- Use viewport-based units (`vh`/`vw`) for key elements
- Lower breakpoint to 600px
- Add a second breakpoint for larger tablets (1024px+)

**Status:** Deferred. Current scaling is functional, just not optimal.

---

## Next
*Ready for implementation when time permits*

*(empty)*

---

## Later
*Worth tracking but not urgent*

*(empty)*

---

## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** January 9, 2025
