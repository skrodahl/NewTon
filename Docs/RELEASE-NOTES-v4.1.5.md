## NewTon DC Tournament Manager v4.1.5 Release Notes

**Release Date:** January 9, 2025
**Patch Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.5** improves the Chalker chalkboard display by using viewport-based row heights. This ensures phones and tablets show approximately the same number of rounds, regardless of screen size.

This release contains no breaking changes and is a drop-in replacement for v4.1.4.

---

## Chalker Chalkboard Improvement

**Problem Solved:**

On the Lenovo Tab M9 (1340x800 in portrait), the chalkboard was showing 14 rounds instead of the expected 7-8 rounds visible on phones. The fixed pixel heights didn't scale proportionally with screen height.

**Solution:**

Switched from fixed pixel heights to viewport-relative units (`vh`). Now each row takes up 6% of the viewport height, ensuring consistent row count across all devices.

| Device | Screen Height | Row Height | Visible Rows |
|--------|---------------|------------|--------------|
| Phone (OnePlus 12 Pro) | ~670px | ~40px | ~7-8 |
| Tablet (Lenovo Tab M9) | ~1340px | ~80px | ~7-8 |

---

## Technical Details

- Changed `.chalk-table td` height from `44px` (phone) / `80px` (tablet) to `6vh`
- Removed the tablet media query override for row height (no longer needed)
- Font sizes remain scaled via media query for readability on larger screens

---

## Chalker Status

NewTon Chalker now provides a consistent visual experience across phones and tablets. The chalkboard adapts to any screen height while maintaining the same number of visible rounds.

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.1.4.md**: Tablet scaling (fonts, spacing, UI elements)
- **Docs/RELEASE-NOTES-v4.1.3.md**: PWA implementation
- **Docs/RELEASE-NOTES-v4.1.0.md**: NewTon Chalker introduction

---

**NewTon DC Tournament Manager v4.1.5** - Consistent chalkboard display across all devices.
