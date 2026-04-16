# Release Notes Pages

This folder contains HTML release notes pages for NewTon DC Tournament Manager, served at `https://newtondarts.com/releases/`.

## Structure

- `index.html` — always the **latest** release notes. Updated with every release.
- `v4.2.11.html`, `v4.2.10.html`, etc. — permanent pages for each previous release.

## Process for Each New Release

The release notes index tell a story. Come up with a unique, cheeky or spectacular, or both, tagline for each release. Humorous and descriptive.

### Tagline Inspiration

Taglines should be cheeky, positive, and relevant to what the release actually does. Draw from:

- **Darts vocabulary** — board, oche, flight, checkout, double, treble, bullseye, leg, set, 180, ton, arrows, tungsten, shaft, barrel, throw line, madhouse (double 1), Shanghai
- **Tournament language** — bracket, elimination, seeding, walkover, bye, progression, finalist, podium, champion, round-robin, group stage
- **Scoring and points** — points, scoring, average, checkout percentage, three-dart average, high finish, bust
- **Match play** — game shot, match shot, best of, decider, sudden death, advantage, comeback
- **The oche experience** — the throw, the stance, the release, chalking, calling, marking, the board lights up
- **Success and winning** — glory, crown, trophy, top of the table, unbeaten, streak, personal best
- **Data and records** — the numbers, the stats, the history, the ledger, the record books

Tone: confident, witty, occasionally a pun. One short phrase — reads well as a headline and in the Previous Releases list. Avoid generic tech jargon ("improved performance", "bug fixes"). Every tagline should make someone curious about what changed.

Past examples for reference:
- "The Pointy End" — config in exports (points travel with data)
- "Clear Sight Lines" — table redesign and header layout fix
- "Leader of the Pack" — leaderboard feature
- "Choose Your Lens" — scope selector with composable filters
- "Game Shot, and the Match!" — major release with match completion flow
- "The Revolution Will Be Scanned" — QR code system launch
- "Nobody Leaves the Oche" — crash resilience improvements
- "Read Between the Lines" — bracket progression lines

### Step 1 — Create both files at the same time

Write `index.html` for the new release, then copy it immediately to its versioned page:

```
cp releases/index.html releases/vX.X.X.html
```

For example, for v4.2.12:
```
cp releases/index.html releases/v4.2.12.html
```

Both files are identical at release time. `index.html` will diverge over time as future releases update it; the versioned page is permanent.

### Step 2 — What to put in `index.html`

- `<title>` — version number
- `<meta name="description">` — one-line summary of the release
- `<h1>` — the release tagline
- `<p class="docs-subtitle">` — version and date
- Download button URLs — `https://github.com/skrodahl/NewTon/releases/tag/vX.X.X`
- TOC anchors — match the sections in this release
- All content sections
- "Previous Releases" index — includes this release as the first entry, plus all older ones

The Previous Releases list on `index.html` includes the current release linking to its own permanent page:

```html
<li><a href="v4.2.12.html">v4.2.12</a> — {Date} — {Tagline}.</li>
<li><a href="v4.2.11.html">v4.2.11</a> — March 18, 2026 — Shame has never looked better.</li>
```

The versioned page has a "Latest" link at the top of its Previous Releases list:

```html
<li><a href="/releases/">Latest release</a></li>
<li><a href="v4.2.11.html">v4.2.11</a> — March 18, 2026 — Shame has never looked better.</li>
```

### Step 3 — Set the canonical URL

Each release page must have a self-referencing canonical tag in `<head>`, immediately after the viewport meta:

```html
<link rel="canonical" href="https://newtondarts.com/releases/vX.X.X.html">
```

For `index.html`, use the trailing-slash URL:

```html
<link rel="canonical" href="https://newtondarts.com/releases/">
```

Use absolute URLs with the full protocol and domain. One tag per page, placed in `<head>`.

### Step 4 — Update `sitemap.xml` (always)

Add both the new versioned page and confirm `index.html` is already present. Both should have priority `0.6`:

```xml
<url>
    <loc>https://newtondarts.com/releases/vX.X.X.html</loc>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
</url>
```

The versioned page uses `changefreq: never` — it will never change after publication. `index.html` (`/releases/`) uses `changefreq: weekly` since it updates with every release.

### Step 5 — Update `APP_VERSION` in `js/main.js`

Update the version string and comment:

```js
const APP_VERSION = '5.0.9'; // Leader of the Pack — Leaderboard, point toggles, averages
```

This is displayed in the app footer. Easy to forget.

---

## HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="https://newtondarts.com/releases/vX.X.X.html">
    <title>vX.X.X — {Tagline}</title>
    <meta name="description" content="NewTon DC Tournament Manager vX.X.X release notes. {one-line summary}.">
    <link rel="icon" type="image/jpeg" href="../images/logo.jpg">
    <link rel="preload" href="../fonts/Insignia-Regular.otf" as="font" type="font/otf" crossorigin>
    <link rel="preload" href="../fonts/Manrope-VariableFont_wght.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="stylesheet" href="../css/landing.css">
</head>
<body>

<a class="docs-back-link" href="/">← NewTon DC Tournament Manager</a>

<div class="docs-content">

    <h1>{Tagline}</h1>
    <p class="docs-subtitle">NewTon DC Tournament Manager vX.X.X &mdash; {Date}</p>

    <a href="https://github.com/skrodahl/NewTon/releases/tag/vX.X.X" target="_blank" rel="noopener" class="btn-github btn-download-top">Download vX.X.X</a>

    <nav class="docs-toc">
        <h2>Contents</h2>
        <ol>
            <li><a href="#overview">Overview</a></li>
            <!-- add sections -->
            <li><a href="#files">Files Changed</a></li>
            <li><a href="#migration">Migration</a></li>
        </ol>
    </nav>

    <!-- content sections -->

    <hr>

    <p><em>NewTon DC Tournament Manager vX.X.X — {closing line}</em></p>

    <a href="https://github.com/skrodahl/NewTon/releases/tag/vX.X.X" target="_blank" rel="noopener" class="btn-github btn-download-bottom">Download vX.X.X</a>

    <hr>

    <h2>Previous Releases</h2>
    <ul>
        <!-- add entries here, newest first -->
    </ul>
    <p>For older releases, see the <a href="https://github.com/skrodahl/NewTon/releases" target="_blank" rel="noopener">GitHub releases page</a>.</p>

</div>

<div class="landing-footer docs-footer">
    <p>
        NewTon DC Tournament Manager &mdash; BSD-3-Clause License &mdash;
        <a href="https://github.com/skrodahl/NewTon" target="_blank" rel="noopener">GitHub</a> &mdash;
        <a href="/privacy.html">Privacy</a>
    </p>
    <p><em class="footer-cheeky">No popups? No cookies!</em></p>
</div>

</body>
</html>
```

## Migration Section

**Always included.** Every release has a Migration section after Files Changed, before the closing line. It reassures users about compatibility and documents any action needed.

When there are no breaking changes:
```
No migration required. Fully compatible with all existing tournament data and match history.
```

When there are optional steps or caveats, state them clearly and explain what the user gains:
```
Tournaments imported into Analytics before this version do not have placement data
in IndexedDB. To enable ranking points for these tournaments: delete from the Analytics
register, then re-add via "+ Analytics" in Recent Tournaments.

No other migration required. New localStorage keys and IndexedDB fields are created on first use.
```

Include this section for any of:
- Export format version bumped (e.g. v4.0 → v4.1)
- IndexedDB schema changes
- LocalStorage key changes or restructuring
- Backward-compatibility notes (e.g. "older exports still work but will show a warning")
- Or simply: nothing changed — say so explicitly

## Notes

- All asset paths use `../` — the `releases/` folder is one level below the root
- The download button uses `class="btn-github"` — styling is handled by `.docs-content .btn-github` in `css/landing.css`
- The Previous Releases list grows with each release — newest first
- Versioned pages (e.g. `v4.2.11.html`) are permanent and should never be modified after publication
