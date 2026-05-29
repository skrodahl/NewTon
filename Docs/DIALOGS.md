# Dialog System (`.dlg`)

A unified pattern for modal dialogs, used alongside the legacy `.modal-content` pattern for visually consistent destructive confirmations, warnings, and any dialog where tournament metadata adds context. Introduced in v5.1.2.

---

## When to use which pattern

| Pattern | Use case |
|---|---|
| **`.dlg / .dlg--split`** (new) | Destructive confirmations, warnings, and dialogs where tournament metadata adds context. |
| **`.modal-content`** (legacy) | Anything not yet migrated. Match Controls and Developer Console intentionally stay on this pattern — they're content-dense and have their own custom layouts. |

The two patterns coexist freely. A dialog uses one or the other; never both.

---

## Anatomy

The `.dlg` sits **inside** an existing `.modal` element so the dialog stack (`pushDialog` / `popDialog`) and the dimmed backdrop continue to work unchanged.

```html
<div id="someModal" class="modal">
    <div class="dlg dlg--split">
        <div class="dlg__grid">
            <aside class="dlg__sidebar">
                <div class="dlg__sidebar-label">Name</div>
                <div class="dlg__sidebar-value" id="someName">-</div>
                <!-- more label/value pairs -->
            </aside>
            <div class="dlg__main">
                <span class="dlg__pill">Destructive</span>
                <h2 class="dlg__title">Action name</h2>
                <p class="dlg__desc">What this will do, in plain language.</p>
                <!-- optional inputs, additional paragraphs, etc. -->
            </div>
        </div>
        <div class="dlg__foot">
            <button class="btn" onclick="popDialog()">Cancel</button>
            <button class="btn btn-warning" onclick="confirmAction()">Action Name</button>
        </div>
    </div>
</div>
```

---

## Visual structure

Every dialog has two horizontal rules that create a consistent header / body / footer rhythm:

- **Under the title** — `.dlg__title` carries a `border-bottom: 1px solid #ecedf1; padding-bottom: 14px` that separates the title row (and the optional pill above it) from the body content.
- **Above the footer** — `.dlg__foot` carries the mirror `border-top: 1px solid #ecedf1` that separates the body from the action buttons.

You don't need to add either rule manually. Drop a `.dlg__title` and a `.dlg__foot` into your markup and the rhythm is automatic. Both rules use the same color (`#ecedf1`) and 14px of breathing room, so the dialog reads as one composition with three weighted regions.

---

## Two layouts

### Default — single column

Use when there's no metadata to display in a sidebar (pure information dialogs). Skip the `.dlg--split`, `.dlg__grid`, and `.dlg__sidebar`:

```html
<div class="dlg">
    <div class="dlg__main">
        <h2 class="dlg__title">Title</h2>
        <p class="dlg__desc">Description.</p>
    </div>
    <div class="dlg__foot">
        <button class="btn" onclick="popDialog()">Got It</button>
    </div>
</div>
```

`max-width: 580px`.

### Split — sidebar + main

Use when tournament metadata adds context. Adds `.dlg--split` (widens to 720px) and wraps everything in `.dlg__grid`.

```html
<div class="dlg dlg--split">
    <div class="dlg__grid">
        <aside class="dlg__sidebar">...</aside>
        <div class="dlg__main">...</div>
    </div>
    <div class="dlg__foot">...</div>
</div>
```

### Width modifier — `.dlg--wide`

Adds ~20% more width (880px). Stack it onto either layout when the content needs the extra room — long player names that wrap, a 3-button footer, or richer body content:

```html
<div class="dlg dlg--split dlg--wide">...</div>
```

Used sparingly. The default widths (580px / 720px) are intentional — they keep dialogs feeling like dialogs rather than pages. Reach for `.dlg--wide` only when you've seen the content crowd at the default width.

---

## Sidebar conventions

- Each field is a label + value pair.
- Labels are short, uppercase, letter-spaced (handled by `.dlg__sidebar-label`).
- Values are bold and compact: `8 of 8`, not `8 of 8 matches completed`. `6`, not `6 registered`. The label already says what the number means.
- Recommended field order, when applicable:
  1. **Name**
  2. **Date**
  3. **Tournament Status** — uses the `tournamentStatusLabel()` helper
  4. **Progress** — e.g. `8 of 8`
  5. **Players** — just the count

Every dialog using `.dlg--split` should include **Tournament Status** *when the dialog is about the tournament as a whole*. When the dialog is about a specific match (e.g. `undoConfirmModal`), the sidebar carries match metadata instead — `Match`, `Bracket`, `Players` — and Tournament Status is omitted (it would always be `Active` and adds no information).

---

## The intent pill

A small uppercase badge at the top of `.dlg__main` that conveys risk/intent at a glance. Optional — omit it when there's no risk to flag.

```html
<span class="dlg__pill">Destructive</span>          <!-- amber default -->
<span class="dlg__pill dlg__pill--danger">Destructive</span>  <!-- red -->
```

| Variant | Color | Use case |
|---|---|---|
| `.dlg__pill` (default) | amber | Warnings, recoverable destructive actions (uses `.btn-warning`) |
| `.dlg__pill--danger` | red | Permanent destructive actions (uses `.btn-danger`) |
| *no pill* | — | Pure information, non-destructive flows (e.g. Import is additive) |

Pill text is short and present-tense — typically "Destructive" or "Warning". Conditional pills are toggled via `style.display = isCondition ? '' : 'none'` in JS (see `importConfirmModal`'s old-format pill).

---

## Buttons

Always use existing `.btn` classes. **No dialog-specific button styles.**

- Cancel/back: plain `.btn`
- Warning/recoverable destructive: `.btn-warning`
- Hard destructive: `.btn-danger`
- Positive action (load, save): `.btn-primary` (currently visually identical to plain `.btn`; semantically marks intent)

The press-feedback rule applies automatically since `.btn` is in the unified `:active` selector list.

The `.dlg__foot` is right-aligned (`justify-content: flex-end`). For single-button dialogs, the button sits on the right — works fine.

---

## The `.dlg__note` panel

A subtle elevated panel for grouping body content that should read as "set apart" from the surrounding prose — typically a procedure, a callout, or a related cluster of steps. White background like the dialog itself, but with a 1px `#ecedf1` border and a soft shadow that lifts it off the surface. 8px radius, 14px/16px padding.

```html
<div class="dlg__note">
    <p class="dlg__desc">First step or paragraph.</p>
    <p class="dlg__desc">Second step or paragraph.</p>
</div>
```

Stacked children get automatic 10px vertical spacing via `.dlg__note > * + *`. Use sparingly — most dialogs don't need it. Reach for it when the body has both lead-in prose and a distinct grouped action set (as in `lateRegInfoModal`, where the first paragraph is the lead-in and the framed block contains the operator's steps and what to expect).

**Text color inside the panel:** `.dlg__note .dlg__desc` overrides the default muted `#6b7280` to the dialog body color `#2a2f3a`. The frame draws attention to the content inside it, so the text should read as primary, not as helper prose. Default `.dlg__desc` muted gray stays in effect outside the panel — useful for captions and lead-in prose elsewhere in the dialog.

---

## Helpers

### `tournamentStatusLabel(t)` — in `js/tournament-management.js`

Returns a capitalized status label (`Setup` / `Active` / `Completed`) for any tournament-shaped object: the active `tournament`, a saved tournament from localStorage, or imported file data.

- Prefers the explicit `status` field
- Falls back to deriving from `bracket` + `matches` state (covers older tournaments and old-format imports)

Use it for every Tournament Status sidebar field. Don't duplicate the logic inline.

---

## XSS safety

Always use `textContent` when injecting user-provided data into the DOM (tournament names, player names, dates). Tournament names can contain arbitrary text.

When you need light formatting (bold for emphasis), build with text nodes + `document.createElement` rather than using `innerHTML` with interpolation:

```js
// OK
desc.textContent = `Your current tournament "${tournament.name}" will be saved.`;

// NOT OK — XSS hole
desc.innerHTML = `Your current tournament <strong>${tournament.name}</strong> will be saved.`;
```

---

## Dialog stack integration

The `.dlg` is purely visual. The dialog stack still operates on the outer `.modal` element by ID:

```js
pushDialog('someModal', null, true);  // third arg enables Esc to close
popDialog();
```

Show/hide behavior, z-index management, and Esc support are unchanged from the legacy pattern.

---

## Migration status

### Migrated (16)

| Dialog | Modal ID | Layout | Pill |
|---|---|---|---|
| Reset Tournament Confirmation | `resetTournamentModal` | split | amber Destructive |
| Delete Tournament Confirmation | `deleteTournamentModal` | split | red Destructive |
| Import Tournament Overwrite | `importOverwriteModal` | split | amber Destructive |
| Tournament In Progress Warning | `tournamentProgressModal` | split | amber Warning |
| Import Tournament Confirmation | `importConfirmModal` | split | amber Old format (conditional) |
| Load Tournament Confirmation | `loadTournamentModal` | split | none |
| Undo Match Confirmation | `undoConfirmModal` | split (match metadata, not tournament) | amber Destructive |
| Analytics — Delete Tournament | `historyDeleteTournamentModal` | split | red Destructive |
| Late Registration Info | `lateRegInfoModal` | default + `.dlg__note` | none |
| Export Tournament Results | `exportConfirmModal` | split | amber Incomplete (conditional) |
| Confirm Match Winner | `winnerConfirmModal` | split + wide (match metadata, not tournament) | none |
| Player Statistics Editor | `statsModal` | default | none |
| Generate Bracket Confirmation | `bracketConfirmModal` | split + wide (bracket summary, not tournament status) | none |
| Backup to Server | `uploadToServerModal` | default | none |
| Import to Analytics | `analyticsImportModal` | split | amber Missing settings (conditional) |
| Result QR Preview | `qrResultPreviewModal` | default + wide | none |

### Not yet migrated (0)

All migrateable dialogs have been addressed.

### Intentionally excluded

- **`matchCommandCenterModal`** — Match Controls. Content-dense custom layout (live + ready + completed match panels, referee suggestions, lane controls); not a fit for the `.dlg` pattern. Received light-touch visual alignment.
- **`analyticsModal`** — Developer Console (the id is historical; the modal displays as "Developer Console" and opens via the version-number click when developer mode is enabled). Content-dense split view with commands and inspection panels. Received light-touch visual alignment.
- **`statisticsModal`** — Leaderboard. 1200px-wide table view — also a page-in-a-modal rather than a dialog. Received a **light-touch visual alignment** (see below) instead of a full migration.
- **`matchQRModal`** — Match assignment QR display. The QR image dominates and the rest is just a title, subtitle, and Close — restructuring into a `.dlg` layout wouldn't add value. Received the same light-touch visual alignment.
- **`qrResultScanModal`** — Camera viewport for scanning result QRs. The `<video>` element dominates; the rest is just a title, hint, and Cancel. Light-touch alignment, no restructuring.
- **`matchDetailModal`** — Match detail view from the History tab. Title + JS-populated body + Close. Content is a read-only summary of one completed match — restructuring into a `.dlg` sidebar layout wouldn't add meaningful structure. Light-touch alignment.

### Light-touch alignment

For non-`.dlg` modals (Match Controls, Analytics, Leaderboard, Developer Console) that stay on the legacy `.modal-content` pattern, small visual updates can be applied via scoped `#someModal .modal-content` overrides to keep them consistent with the `.dlg` aesthetic. The minimum useful set:

```css
#someModal .modal-content {
  border-radius: 10px;             /* matches .dlg */
  background-color: #ffffff;       /* solid white, not the legacy translucent rgba */
}
```

Plus drop decorative emojis from the `<h3>` title. That's enough to make them feel part of the same family without restructuring page-style content.

Already applied to: `statisticsModal`, `matchQRModal`, `qrResultScanModal`, `matchDetailModal`, `matchCommandCenterModal`, `analyticsModal` (Developer Console).

---

## Migrating an existing dialog — checklist

1. **Read the old markup** — note the modal ID, all inline-styled sections, all element IDs the JS touches.
2. **Read the JS that shows/populates it** — identify what data goes where.
3. **Decide layout** — split (has metadata) or default (pure info).
4. **Decide pill** — destructive (amber/red) or none (additive/positive).
5. **Rewrite the markup** using `.dlg` components. Preserve element IDs where possible to minimize JS churn.
6. **Update the JS** — trim verbose sidebar values (drop " players", " matches completed"), use `tournamentStatusLabel()` for status, use `textContent` for user data.
7. **Delete orphaned CSS** — inline styles disappear with the old markup, but check for selector overrides (e.g. `#someInput` in shared cascades).
8. **Update this file** — move the dialog from "Not yet migrated" to "Migrated".
