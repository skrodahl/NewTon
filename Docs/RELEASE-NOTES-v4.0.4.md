## NewTon DC Tournament Manager v4.0.4 Release Notes

**Release Date:** October 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.4** introduces a unified font architecture with CSS variable control, ensuring consistent cross-platform typography and providing centralized font management.

This release contains no breaking changes and is a drop-in replacement for v4.0.3.

**Key Highlights:**
- Centralized font control via CSS variables (`--font-body`, `--font-clock`)
- Consistent cross-platform font rendering (Mac, Windows, Linux)
- Standardized bracket and watermark fonts
- Distinctive Match Controls clock with modern monospace typography

---

## ✨ Enhancements

### Unified Font Architecture with CSS Variable Control

**Previous Behavior:**
- Fonts were inconsistently applied across the application
- Hardcoded inline styles (150+ character strings in JavaScript)
- Varying system font fallbacks created inconsistent rendering across platforms
- No centralized control for changing fonts

**What's New:**

**1. CSS Variables for Centralized Control**
- **`--font-body`**: Controls body text font (currently set to Manrope)
- **`--font-clock`**: Controls Match Controls clock font (Cascadia Code - distinctive modern monospace)
- Change fonts application-wide by editing a single CSS variable

**2. Font Standardization**
- **Bracket placement titles** ("7th-8th Place", "FRONTSIDE", "BACKSIDE") → Inter font
- **Watermarks** (left and center) → Inter font
- **Tournament header** (bracket page title and date) → Inter font (changed from Arial)
- **Match Controls clock** → Cascadia Code/SF Mono/Consolas (modern monospace, avoids console-style Courier)

**3. Code Quality Improvements**
- Created `.match-controls-clock` CSS class
- Replaced 150+ character inline style strings with clean CSS classes
- All bracket labels standardized in JavaScript (`js/bracket-lines.js`)

**Why It Matters:**
- Consistent typography across Mac, Windows, and Linux
- Single point of control: Change `--font-body` or `--font-clock` to update fonts everywhere
- Match Controls clock uses distinctive monospace (maintains consistent width while avoiding terminal aesthetic)
- Clean, maintainable code with CSS classes instead of inline strings
- CAD watermark preserves technical monospace aesthetic for engineering appearance

---

## 📊 Complete Font Architecture

The application now has a clear, intentional typographic hierarchy:

| Element | Font | Control Point | Purpose |
|---------|------|---------------|---------|
| **Body text** | Manrope | `--font-body` | Main UI consistency |
| **Bracket titles** | Inter | Hard-coded CSS | Structural elements |
| **Watermarks** | Inter | Hard-coded CSS | Tournament info |
| **Tournament header** | Inter | Hard-coded JS | Bracket page title |
| **Match Controls clock** | Cascadia Code | `--font-clock` | Distinctive monospace clockface numbers |
| **CAD watermark** | Courier/Monaco | Hard-coded CSS | Technical aesthetic |
| **Match IDs/Stats** | SF Mono stack | Hard-coded CSS | Data display |
| **Site header** | Droid Serif | Hard-coded CSS | Distinctive serif app title |

**Note:** The table shows default configuration. Users can customize `--font-body` and `--font-clock` by editing CSS variables in `css/styles.css`.

---

## 🎨 Customization Guide

### Changing the Body Font

Edit line 52 in `css/styles.css`:
```css
:root {
  --font-body: 'Your Font Name', sans-serif;
}
```

### Changing the Match Controls Clock Font

Edit line 53 in `css/styles.css`:
```css
:root {
  --font-clock: 'Your Monospace Font', monospace;
}
```

**Important:** The clock font MUST be monospace to maintain consistent width as time changes (otherwise "11:11" vs "00:00" would cause the clock frame to jump).

### Adding Custom Fonts

1. Place font files (.ttf, .woff2) in the `fonts/` folder
2. Add `@font-face` declaration in `css/styles.css` (see lines 26-48 for examples)
3. Reference the font name in CSS variables

**Example:**
```css
@font-face {
  font-family: 'My Custom Font';
  src: url('../fonts/MyCustomFont.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-body: 'My Custom Font', sans-serif;
}
```

---

## 🚀 Migration from v4.0.3

### Automatic
- Fully compatible with v4.0.3, v4.0.2, v4.0.1, and v4.0.0 tournaments
- No data migration required
- No functional changes to existing tournament behavior

### What's New
After upgrading to v4.0.4:
1. **Consistent fonts across all platforms** - Mac, Windows, Linux users see identical typography
2. **Modern Match Controls clock** - Cascadia Code replaces system monospace fonts
3. **Standardized bracket elements** - Inter font for all bracket titles, watermarks, and headers
4. **Easy customization** - Change `--font-body` or `--font-clock` in one place to update fonts everywhere

### Compatibility
- All v4.0.x tournaments work in v4.0.4
- v4.0.4 exports identical to v4.0.3 exports
- No changes to core tournament functionality

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/IMPORT_EXPORT.md**: Complete import/export specification
- **Docs/RELEASE-NOTES-v4.0.3.md**: Developer Console placement rank enhancement
- **Docs/RELEASE-NOTES-v4.0.2.md**: Referee conflict detection and pre-v4.0 import optimization
- **Docs/RELEASE-NOTES-v4.0.1.md**: Documentation improvements and code cleanup
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.4** - Unified font architecture with CSS variable control for consistent cross-platform typography.
