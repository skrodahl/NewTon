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

### Step 5 — Update version in `js/main.js` and `chalker/js/chalker.js`

Update the version string and comment in both files:

```js
// js/main.js
const APP_VERSION = '5.0.9'; // Leader of the Pack — Leaderboard, point toggles, averages

// chalker/js/chalker.js
const CHALKER_VERSION = '5.0.9';
```

`APP_VERSION` is displayed in the TM footer. `CHALKER_VERSION` is displayed in the Chalker's New Match modal. Both must match. Easy to forget.

**Version format note:** `APP_VERSION` and `CHALKER_VERSION` use the short form `b` instead of `beta` (e.g. `5.0.15-b.1`). The full word causes line-wrap in the UI. Everywhere else — release pages, CHANGELOG, filenames, git tags — uses the full `beta` (e.g. `v5.0.15-beta.1`).

### Step 6 — Increment the Chalker cache buster

Bump the `?v=N` query parameter on the chalker.js script tag in `chalker/index.html`:

```html
<script src="js/chalker.js?v=7"></script>
```

Increment by 1 with each release. This bypasses browser and PWA service worker caching, ensuring the new code loads immediately on devices that have the Chalker installed.

### Step 7 — Review `llms.txt`

Review `llms.txt` for accuracy against the new release. AI services use this file to describe NewTon — outdated or missing information means wrong answers across every AI model.

Check:
- New features mentioned (e.g. new Analytics views, new deployment options)
- Removed or changed features updated
- Version-tagged features still accurate (e.g. "v5.0.3+" for Analytics)
- "Do not invent" list still correct (no features listed that now exist)
- Deployment options, environment variables, and privacy model current

Not every release changes `llms.txt` — but every release should check.

### Step 8 — Review help system

Review `js/dynamic-help-system.js` for accuracy. The context-sensitive help (F1 / ℹ️ icon) describes features per page — new features should be mentioned, removed features should be cleaned up.

Doesn't need to be 100% current with every release, but should be reviewed regularly — especially after adding new UI elements, buttons, or workflows that users might press F1 to understand.

---

## Beta Releases

Betas follow the exact same process as full releases — release page, versioned page, sitemap, release notes markdown, version bump. A beta is a release.

**What's different:**

- **Version format:** `v5.0.15-beta.1` (file names, release pages, CHANGELOG, git tags). Short form `5.0.15-b.1` in `APP_VERSION` and `CHALKER_VERSION` only.
- **File naming:** `releases/v5.0.15-beta.1.html`
- **Previous Releases list:** betas appear alongside full releases, newest first. No special marking.
- **Feedback callout:** beta release notes include a line inviting feedback, typically linking to the relevant GitHub discussion:

```
*Beta — iOS QR decode improvements for iPhone. Feedback welcome via [GitHub discussion #4](https://github.com/skrodahl/NewTon/discussions/4).*
```

Everything else — tagline, release notes markdown in `Docs/ReleaseNotes/`, sitemap entry, canonical URL, download buttons — is identical.

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

## Fun Facts (optional)

Consider adding a short, wry one-liner near the closing line — a behind-the-scenes footnote on how the release came to be. Not required, and needs discussion before including. The best ones are skewed, honest, and make someone smile.

Examples:
- "Started as a mobile layout fix. Ended with four releases and an iOS beta."
- "This feature exists because someone asked 'what if the score isn't 501?'"
- "The absolute positioning hack survived 18 months before anyone's screen was the wrong width."
- "The config gap was found because the test instance had different point values. Production was fine. This time."

One sentence, placed just before or after the closing line. Should feel like a director's commentary, not a press release.

## Release Notes vs Changelog

Release notes (this folder + `Docs/ReleaseNotes/`) tell the **user's story** — what's new, what's better, why it matters. They are longer and more detailed than the changelog: full context, motivation, contributor credits, the narrative behind the changes.

The **changelog** (`CHANGELOG.md`) is the **developer's record** — concise entries covering what changed, why, and which files were affected. Every version entry should have a "Files changed" section.

When writing release notes, focus on value: what does the user see, what problem is solved, what's the experience. No file lists or function names unless required for the story.

## Notes

- **Detailed release notes** (markdown) are in [`Docs/ReleaseNotes/`](../Docs/ReleaseNotes/)
- All asset paths use `../` — the `releases/` folder is one level below the root
- The download button uses `class="btn-github"` — styling is handled by `.docs-content .btn-github` in `css/landing.css`
- The Previous Releases list grows with each release — newest first
- Versioned pages (e.g. `v4.2.11.html`) are permanent and should never be modified after publication
