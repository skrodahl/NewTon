## NewTon DC Tournament Manager v4.2.1 Release Notes

**Release Date:** March 8, 2026
**Polish Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.1** focuses on visual polish and discoverability. Match cards receive subtle refinements, eliminated players are now visually marked with strikethrough text, and a new optional landing page improves SEO for self-hosted instances.

This release contains no breaking changes and is a drop-in replacement for v4.2.0.

**Key Highlights:**
- Eliminated player strikethrough on completed match cards
- Muted match card styling for a cleaner bracket appearance
- SEO meta tags added to the tournament app
- Optional landing page for Docker deployments

---

## Eliminated Player Strikethrough

Completed match cards now display the eliminated player's name in muted red with a slanted strikethrough line. This makes it immediately clear who has been knocked out of the tournament at a glance.

- Muted red text (`#b87070`) complements the green completed-match background
- Strikethrough appears only in the specific match where the player was eliminated
- Works correctly in both formats:
  - **SE**: every round loser is eliminated immediately
  - **DE**: frontside losers who continue to the backside show no strikethrough until their backside elimination match
- Walkover slots and match winners are never struck through

---

## Match Card Visual Tweaks

- **Muted "Started" button**: Live match button color changed from bright orange (`#ff6b35`) to a warmer, less distracting muted orange (`#e09060`)
- **Subtle dropdown backgrounds**: Lane and referee dropdowns on ready/live match cards now use a light gray (`#e8e9ec`) instead of pure white, blending better with the card footer

---

## SEO & Discoverability

### Meta Tags

The tournament app now includes `<meta name="description">` and `<meta name="keywords">` tags in the HTML head. This helps search engines accurately describe NewTon in search results, even without the landing page enabled.

### Landing Page

A new optional landing page can be enabled for Docker deployments. When enabled, visitors see a feature-rich page with descriptions, screenshots, and proper Open Graph / Twitter Card meta tags before entering the tournament app.

The landing page is embedded in `tournament.html` (which becomes `tournament.php` during Docker build) — no separate files needed.

**How to enable:**

```yaml
environment:
  - NEWTON_LANDING_PAGE=true
  - NEWTON_BASE_URL=https://your-domain.com  # Optional: for canonical URLs
```

**What it includes:**
- App header (centered logo + title, no menu or clock)
- Feature descriptions
- Screenshots from the repository
- "Launch Tournament Manager" button (`?launch` bypasses the landing page)
- Full Open Graph and Twitter Card meta tags for social sharing

**What it does NOT include:**
- The demo site banner (that remains exclusive to `NEWTON_DEMO_MODE`)

When `NEWTON_LANDING_PAGE` is not set (the default), visitors go straight to the tournament app as before.

---

## Docker Changes

### New Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEWTON_LANDING_PAGE` | `false` | Show SEO landing page at root URL |
| `NEWTON_BASE_URL` | *(empty)* | Canonical URL for Open Graph / Twitter Card meta tags |

### nginx Configuration

The nginx index directive serves `tournament.php` as the default document. No separate landing page file is needed.

---

## Migration from v4.2.0

### Automatic
- Fully compatible with all existing tournaments
- No data migration required
- All existing features are unchanged

### What's New After Upgrading
1. Eliminated players show strikethrough text on completed match cards
2. Slightly refined match card styling (muted button, dropdown backgrounds)
3. Search engines will see meta description and keywords on the tournament app
4. Optionally enable the landing page for public-facing Docker deployments

---

## Known Issues

None at time of release.

---

**NewTon DC Tournament Manager v4.2.1** — cleaner cards, clearer brackets, better discoverability.
