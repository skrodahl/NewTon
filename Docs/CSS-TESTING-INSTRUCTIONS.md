# CSS Usage Testing Instructions

## Quick Method: Use CSS Coverage Tracker (RECOMMENDED)

This is the best way to find truly unused CSS in your application.

### Setup (One-time):

1. Add this line to `tournament.html` at the end of the `<body>`, right before the closing `</body>` tag:
   ```html
   <script src="css-coverage-tracker.js"></script>
   ```

### Usage:

1. **Open tournament.html in your browser**
2. **Open browser console** (Cmd+Option+I on Mac, F12 on Windows/Linux)
3. **Use the application thoroughly:**
   - Visit all 4 pages: Tournament, Setup, Registration, Config
   - Open ALL modals: Match Controls, Stats, Analytics, Undo, Match Details, etc.
   - Interact with buttons, forms, dropdowns
   - Start a match, complete a match
   - Use the bracket zoom controls
   - Open the celebration view
   - Test referee assignments
   - Everything you can think of!

4. **Generate the report** by typing in console:
   ```javascript
   window.CSScoverage.report()
   ```

5. **You'll see output like:**
   ```
   ====================================
   CSS COVERAGE REPORT
   ====================================
   Total CSS Classes Defined: 248
   Classes Used in DOM: 185
   Potentially Unused: 63
   Coverage: 74.6%
   ====================================

   POTENTIALLY UNUSED CLASSES (63):
   .some-class
   .another-class
   ...
   ```

### Advanced Commands:

**Export to JSON file:**
```javascript
window.CSScoverage.report({ export: true })
```

**Show both used AND unused classes:**
```javascript
window.CSScoverage.report({ showUsed: true })
```

**Get grep pattern to find unused classes in styles.css:**
```javascript
window.CSScoverage.exportUnusedForGrep()
```

**Copy unused class list to clipboard:**
```javascript
window.CSScoverage.generateRemovalList()
```

## How It Works

The tracker:
1. **Extracts** all CSS class selectors from your stylesheets
2. **Monitors** the DOM continuously using MutationObserver
3. **Tracks** every class that appears in the DOM during your testing
4. **Reports** which CSS classes were defined but never appeared

## Important Notes

- **Some "unused" classes might actually be used** - they just weren't triggered during your testing session
- **Test thoroughly** - open every modal, visit every page, trigger every interaction
- **Classes added by JavaScript** are tracked automatically
- **The longer you test, the more accurate the results**

## Aggressive Cleanup Shortcuts

Based on current HTML/JS analysis, here are safe removal candidates:

### 1. Alert Styles (if using custom alerts)
If you're using browser-native `alert()` instead of styled alert boxes:
- `.alert-info`
- `.alert-success`
- `.alert-warning`

Check: Search for `alert-info`, `alert-success`, or `alert-warning` in your JS files.

### 2. Utility Classes
If these aren't used:
- `.text-center` (check if you're using this)
- `.mb-20`, `.mt-20` (margin utilities)
- `.d-flex`, `.justify-between`, `.align-center` (flexbox utilities)

### 3. Export/Analytics Classes
If certain export features aren't implemented:
- `.achievement-export-btn`
- `.achievement-export-section`

### 4. Bracket Lines
Already disabled in CSS:
```css
.bracket-line,
#bracketLines {
  display: none !important;
}
```
Could potentially remove these entirely if you're never bringing them back.

## Next Steps After Testing

1. Run the coverage report
2. Review the "Potentially Unused" list
3. Cross-reference with your JS files to confirm
4. Create a backup: `cp styles.css styles.css.backup-phase3`
5. Remove confirmed unused classes
6. Test again
7. Commit if everything works

## Browser Developer Tools Alternative

Modern browsers have built-in CSS coverage tools:

**Chrome DevTools:**
1. Open DevTools (Cmd+Option+I)
2. Press Cmd+Shift+P (Command Palette)
3. Type "Coverage" and select "Show Coverage"
4. Click the record button
5. Use your application thoroughly
6. Stop recording
7. Click on "styles.css" to see unused CSS highlighted in red

This shows unused CSS at the **rule** level, not just class level.
