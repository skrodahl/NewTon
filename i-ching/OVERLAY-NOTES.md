# ORACULON CT-64 — Image Overlay Approach

## Concept

Replace the CSS-rendered calculator with a Nano Banana illustration as the base image, overlaying transparent HTML elements for interactive parts (LCD, keys, LEDs).

**Image provides:** case body, key shapes/depth/3D bevelling, LCD bezel, solar strip, brand plate, sticker, tape, wear/grime/scratches — everything that's "hardware."

**HTML provides:** LCD text (live display), clickable key hit targets (transparent, positioned over image keys), LED animations, hexagram graphic, install banner.

## Image

- **Source:** `oraculon-clean-straight-2.png` (Nano Banana, generated from `oraculon.png` reference)
- **Dimensions:** 1466 × 2912px (aspect ratio ~1:1.986)
- **Requirements:** perfectly straight-on view, empty LCD, key labels baked into the image, PNG with desk background
- **Quirk:** two LEDs permanently lit in the image — kept as a Sirius Cybernetics factory defect

## Prototype

`prototype.html` — alignment testbed with red-tinted overlay boxes on every interactive element. "Toggle Overlay" button (top right) hides/shows the debug outlines.

## Current alignment values — hybrid approach

The pure CSS grid couldn't account for the image's non-uniform bottom section. Solution: grid for the uniform rows, individual positioning for the irregular bottom keys.

### Grid section (rows 1-6: SIN through `1,2,3,+`)

```css
.device {
  max-width: 420px;
  aspect-ratio: 1466 / 2912;
  background: url('oraculon-clean-straight-2.png') center / 100% 100% no-repeat;
}

.lcd {
  top: 13%;  left: 7%;  width: 86%;  height: 8%;
}

.keys-grid {
  top: 30.8%;  left: 8%;  width: 85%;  height: 38%;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 2.3% 2%;
}

.solar (LED strip) {
  top: 10.2%;  left: 7%;  width: 86%;  height: 1.5%;
}

.manual-link {
  bottom: 1.2%;  left: 12%;  width: 76%;  height: 2%;
}
```

### Bottom section (individually positioned)

```css
.key-zero {
  top: 76.2%;  left: 8%;  width: 41.5%;  height: 4.5%;
}

.key-dot {
  top: 76.2%;  left: 51%;  width: 19.5%;  height: 4.5%;
}

.key-eq {
  top: 76.2%;  left: 73%;  width: 20%;  height: 12%;
}

.key-oracle {
  top: 82.2%;  left: 8%;  width: 62%;  height: 5.5%;
}
```

## Alignment status

**Good:**
- Rows 1-6 (SIN through `+`) — well aligned, grid approach works perfectly for the uniform section
- LCD position and size — good
- Column alignment — solid across all 4 columns
- LED strip — close
- Bottom keys (`0`, `.`, `=`, oracle) — close, independently adjustable

**Remaining fine-tuning needed:**
- The `0` and `.` overlays sit very slightly above the actual keys (~1-2px)
- The oracle bar overlay sits very slightly above the actual blue bar
- The `=` bottom edge could extend slightly further
- All within ~1% tolerance — good enough for hit targets, may need sub-percent tweaks during production integration

## Why hybrid

The image's key grid is not perfectly uniform:
- Larger gap between row 6 (`1,2,3,+`) and the `0` row
- The oracle bar is disproportionately tall
- The `=` key spans two non-uniform rows

A single CSS grid with uniform `1fr` rows can't model this. The hybrid gives the grid's efficiency for the 24 uniform keys, and pixel-level control for the 4 irregular bottom keys.

## Files

- `oraculon.png` — original Nano Banana reference illustration
- `oraculon-clean.png` — first straight-on attempt
- `oraculon-clean-straight.png` — second attempt
- `oraculon-clean-straight-2.png` — current working image (correct key layout: 0 double-wide, = double-tall, oracle 3-wide)
- `prototype.html` — alignment testbed (preserved, not the production file)
- `index.html` — production file (unchanged, still CSS-rendered)
- `OVERLAY-NOTES.md` — this file

## Key press feedback

Three approaches, in order of effort:

### Option 1 — CSS only (recommended starting point)
Apply `brightness(0.85)` filter and `translateY(1px)` to the hit target on `:active`. The image key underneath darkens slightly and shifts down. Won't look like a physical press, but feels responsive. The current CSS-rendered version already uses `transform` on `:active` — same pattern, applied to the transparent overlay. The image's existing 3D depth and texture mean even a simple darkening reads as "pressed" in context.

### Option 2 — Single overlay gradient
One semi-transparent dark gradient (CSS or image) positioned over the pressed key. Same shape for every key, moved to the right coordinates on press. One asset, reusable. More convincing than pure brightness but still generic.

### Option 3 — Individual pressed-key images (nuclear option)
Each key has a "pressed" variant rendered by Nano Banana with the 3D depth inverted (shadow on top, highlight on bottom, key face recessed). 28 separate images. Most convincing but significant asset work. Only worth pursuing when everything else is polished.

**Recommendation:** start with option 1. Upgrade to 2 if it feels too flat. Option 3 only if the app goes to the Play Store and the press feedback matters for the rating.

---

## Migration plan

Once alignment is finalised in `prototype.html`:
1. Update `index.html` to use the image background approach
2. Strip CSS that renders the case, keys, and LCD bezel (keep LCD text, LED animation, hexagram, modal styles)
3. Key buttons become transparent hit targets with the image's printed labels visible underneath
4. All JS (`oraculon.js`) stays unchanged — it operates on the same button elements
5. Keep the original CSS-rendered version in git history
