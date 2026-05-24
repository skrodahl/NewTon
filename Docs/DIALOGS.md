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

Every dialog using `.dlg--split` should include **Tournament Status**. This is true for migration *and* for any new dialog you build.

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

### Migrated (6)

| Dialog | Modal ID | Layout | Pill |
|---|---|---|---|
| Reset Tournament Confirmation | `resetTournamentModal` | split | amber Destructive |
| Delete Tournament Confirmation | `deleteTournamentModal` | split | red Destructive |
| Import Tournament Overwrite | `importOverwriteModal` | split | amber Destructive |
| Tournament In Progress Warning | `tournamentProgressModal` | split | amber Warning |
| Import Tournament Confirmation | `importConfirmModal` | split | amber Old format (conditional) |
| Load Tournament Confirmation | `loadTournamentModal` | split | none |

### Not yet migrated (16)

- `uploadToServerModal`
- `historyDeleteTournamentModal`
- `statsModal`
- `analyticsModal`
- `qrResultScanModal`
- `qrResultPreviewModal`
- `winnerConfirmModal`
- `matchDetailsModal`
- `statisticsModal`
- `undoConfirmModal`
- `bracketConfirmModal`
- `analyticsImportModal`
- `exportConfirmModal`
- `matchDetailModal`
- `matchQRModal`
- `lateRegInfoModal`

### Intentionally excluded

- **`matchCommandCenterModal`** — Match Controls. Content-dense custom layout; not a fit for the `.dlg` pattern.
- **Developer Console** — same rationale.

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
