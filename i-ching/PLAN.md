# PLAN.md — ORACULON CT-64

A forward-looking vision & roadmap for turning the ORACULON CT-64 from a web toy into a real object.
This is intentionally **high-level only** — no engineering choices, no code, no bill of materials yet.
Those come later, stage by stage.

*Loose feature/gag ideas for future versions live in [IDEAS.md](IDEAS.md) (a brainstorm bucket).*

---

## The vision

Make the ORACULON CT-64 — a deliberately useless Dirk Gently "Suffusion of Yellow" I Ching
calculator — into an **actual device people can own**. The joke *is* the product: a cheap-looking
fortune-telling calculator that refuses any answer above 4, tells garbled fortunes, and ships with a
manual that explains nothing.

## Why it could work

- **Deeply useless, lovingly made.** The obscurity and pointlessness are the whole appeal.
- **Press fit.** The kind of thing **Hackaday**, **MakeUseOf**, and **XDA** love — "totally useless,
  lovingly engineered." The niche reference is the hook, not a liability.
- **Giftable novelty.** An easy, memorable present; strong impulse-buy / conversation-piece energy.
- **Constraints as features.** "Won't compute above 4" and "a manual that tells you nothing" are
  selling points, not bugs to apologise for.

## Staged roadmap

1. **Stage 0 — Web proof of concept** *(done)*
   The `index.html` web build (now a split, installable PWA). Doubles as the reference prototype / living spec
   for everything that follows. (Quirks catalogued in [QUIRKS-AND-EASTER-EGGS.md](QUIRKS-AND-EASTER-EGGS.md).)

2. **Stage 1 — Microcontroller + touchscreen prototype** *(first physical step)*
   Port the experience to an **M5Stack Tab5** (or similar). Goal: prove the whole thing in
   software/firmware on real hardware — feel, timing, the reading, the lights — *before* committing
   to any custom hardware. Essentially uses the prototype to write the spec for Stage 2.

3. **Stage 2 — Dedicated calculator device** *(end goal)*
   A real, molded calculator with physical keys — not a dev board with a screen. Intended to be
   **crowdfunded**.

## Product tiers & stretch goals *(concept only)*

- **Base model** — the standard ORACULON.
- **A premium "Oracle Edition"** — the deluxe experience (e.g. the tear-off paper reading) as a
  higher tier.
- **Stretch goals = a higher ceiling.** True to the manual's "premium model permits answers as high
  as 5, perhaps 6": unlocking **answers up to 5**, then **up to 6**, as funding stretch goals.

## Guiding principles (keep the soul)

- It must stay **useless, and confidently so**.
- **The manual explains nothing** — the mechanics (the Rule of 4, etc.) are for the owner to
  discover. Enigma and gibberish, never instructions.
- Preserve the **cheap, beaten-up aesthetic** and every easter egg across each stage.
- Keep the **Douglas Adams nods a rare, rephrased sprinkle** — never verbatim, never heavy-handed.
- Keep content as **portable data** so it carries cleanly from web → prototype → device.
- **The instruction booklet ships as a real, physical mini-manual** — a cheaply-printed paper booklet
  in the box, in the device's broken voice. The **"PAGE 4–11 MISSING" gag becomes literal**: the
  printed booklet actually skips those pages, so the section that would explain anything is genuinely,
  physically absent.
- **No printout — the reading scrolls across the LCD.** Faithful to the book, the whole divination
  scrolls across the little screen (no thermal-printer receipt). This keeps the device cheap and
  practical to build, and embraces the **deliberate inconvenience** — you wait, you squint, you may
  miss it and have to consult again. *(The PoC also kept a richer roll-out/tear-off paper version,
  saved as `i-ching-calculator - printout.html`, in case a "deluxe" printing tier is ever wanted.)*
- **It is meant to be a little inconvenient.** Slightly-awkward-to-use is part of the charm — e.g.
  the lights celebrating at exactly the wrong moment. Don't optimise the personality away.

## Deferred for now (intentionally undecided)

- Engineering choices (display, microcontroller, keys, power, sound, enclosure).
- Bill of materials and unit cost.
- Tooling approach, certification, fulfilment, and crowdfunding-campaign logistics.

These are deliberately left open until the relevant stage.
