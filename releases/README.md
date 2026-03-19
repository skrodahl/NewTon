# Release Notes Pages

This folder contains HTML release notes pages for NewTon DC Tournament Manager, served at `https://newtondarts.com/releases/`.

## Structure

- `index.html` — always the **latest** release notes. Updated with every release.
- `v4.2.11.html`, `v4.2.10.html`, etc. — permanent pages for each previous release.

## Process for Each New Release

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

### Step 3 — Update `sitemap.xml` (always)

Add both the new versioned page and confirm `index.html` is already present. Both should have priority `0.6`:

```xml
<url>
    <loc>https://newtondarts.com/releases/vX.X.X.html</loc>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
</url>
```

The versioned page uses `changefreq: never` — it will never change after publication. `index.html` (`/releases/`) uses `changefreq: weekly` since it updates with every release.

---

## HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Release Notes vX.X.X — NewTon DC Tournament Manager</title>
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

    <a href="https://github.com/skrodahl/NewTon/releases/tag/vX.X.X" target="_blank" rel="noopener" class="btn-github" style="margin: 8px 0 24px;">Download vX.X.X</a>

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

    <a href="https://github.com/skrodahl/NewTon/releases/tag/vX.X.X" target="_blank" rel="noopener" class="btn-github" style="margin: 16px 0 40px;">Download vX.X.X</a>

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
    <p><em style="color: #a89080;">No popups? No cookies!</em></p>
</div>

</body>
</html>
```

## Notes

- All asset paths use `../` — the `releases/` folder is one level below the root
- The download button uses `class="btn-github"` — styling is handled by `.docs-content .btn-github` in `css/landing.css`
- The Previous Releases list grows with each release — newest first
- Versioned pages (e.g. `v4.2.11.html`) are permanent and should never be modified after publication
