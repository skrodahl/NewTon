## NewTon DC Tournament Manager v4.0.9 Release Notes

**Release Date:** November 3, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.9** adds a localStorage storage indicator to prevent critical storage situations and updates the demo site banner with more descriptive text.

This release contains no breaking changes and is a drop-in replacement for v4.0.8.

**Key Highlights:**
- Visible localStorage storage indicator prevents storage-full situations during tournaments
- Updated demo banner provides better project context for first-time visitors

---

## ✨ New Features

**localStorage Storage Indicator:**

A color-coded storage utilization indicator now appears in the Recent Tournaments header, preventing critical situations where localStorage fills up during tournaments.

**What's New:**
- Right-aligned "Storage: X%" link with click-to-view modal
- Color-coded thresholds:
  - **Green (<75%)**: Healthy storage usage
  - **Yellow (75-90%)**: Running low on space
  - **Amber (>90%)**: Almost full, action needed
- Interactive modal shows:
  - Horizontal progress bar matching color threshold
  - Current usage breakdown (Tournaments, History, Settings)
  - Non-technical instructions for freeing space
  - Optional advanced section for cleaning up history (when >1MB)
- Automatically updates after save/delete/import operations
- ESC key support via modal stack system

**Why It Matters:**
Proactive visibility prevents localStorage-full situations during tournaments. Clear, non-technical guidance helps operators manage storage without needing Developer Console access.

---

## 🎨 UI Improvements

**Updated Demo Site Banner:**

The demo-mode header banner now provides better context about the software itself, helping first-time visitors understand what NewTon is.

**What Changed:**
- **Before**: "Demo Site. Everything you do is stored locally in your browser. Your data never leaves your device."
- **After**: "Darts double elimination tournament software. Free, open-source, secure, offline first, self-hostable. 📍 Demo Site: Everything you do is stored locally in your browser. Your data never leaves your device."

**Why It Matters:**
First-time visitors immediately understand NewTon's purpose and key features (free, open-source, secure, offline-first, self-hostable) while maintaining privacy transparency.

---

## 🚀 Migration from v4.0.8

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to existing tournament behavior

### What's New
After upgrading to v4.0.9:
1. **Storage indicator appears automatically** in Recent Tournaments header
2. **Monitor storage usage** by clicking the "Storage: X%" link
3. **Follow clear instructions** in the modal to free up space when needed
4. **Demo site banner updated** (if using `NEWTON_DEMO_MODE=true`)

### Compatibility
- All v4.0.x tournaments work in v4.0.9
- Storage indicator works immediately (no configuration needed)
- Modal integrates with existing ESC key handling

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/RELEASE-NOTES-v4.0.8.md**: Docker documentation updates and Match Controls fix
- **Docs/RELEASE-NOTES-v4.0.7.md**: Security headers documentation and Docker Hub publishing
- **Docs/RELEASE-NOTES-v4.0.6.md**: Dynamic navigation menu enhancement
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.9** - Proactive storage monitoring and improved first-time user experience.
