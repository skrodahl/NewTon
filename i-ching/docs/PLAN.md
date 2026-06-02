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

2. **Stage 0.5 — Mobile app distribution** *(the missing rung)*
   Wrap the existing PWA as a Trusted Web Activity (via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap))
   and ship to the **Google Play Store** — one-time $25 developer fee. **Same codebase**; the app is a
   wrapper, not a port. Goal: build an audience and a press flywheel *before* Stage 1, so the eventual
   crowdfunder lands in a warm room — real install numbers are the most persuasive evidence a future
   Kickstarter can show. The store listing itself is an Oraculon artefact: description, screenshots,
   changelog, and dev replies to 1-star reviews all in the device's broken voice (the 1-star "doesn't
   calculate above 4, broken" reviews *are* the marketing — they prove the Rule is being discovered).
   Adjacent free venues optional: **F-Droid** (FOSS audience, zero fee), **Amazon Appstore** (zero
   friction). iOS deferred until Play numbers justify the $99/year cost.

3. **Stage 1 — Microcontroller + touchscreen prototype** *(first physical step)*
   Port the experience to an **M5Stack Tab5** (or similar). Goal: prove the whole thing in
   software/firmware on real hardware — feel, timing, the reading, the lights — *before* committing
   to any custom hardware. Essentially uses the prototype to write the spec for Stage 2.

4. **Stage 2 — Dedicated calculator device** *(end goal)*
   A real, molded calculator with physical keys — not a dev board with a screen. Intended to be
   **crowdfunded**.

## Product tiers & stretch goals *(concept only)*

- **Base model** — the standard ORACULON.
- **A premium "Oracle Edition"** — the deluxe experience (e.g. the tear-off paper reading) as a
  higher tier.
- **Stretch goals = a higher ceiling.** True to the manual's "premium model permits answers as high
  as 5, perhaps 6": unlocking **answers up to 5**, then **up to 6**, as funding stretch goals.
- **Mobile premium tier — answers up to 5, for £20.** A single optional in-app purchase on the
  Stage 0.5 release that raises the ceiling by exactly one number. The same gag as the hardware
  stretch goals, made daily and bite-sized: the free app caps at 4; one IAP unlocks 5. **The price
  must be £20** — what Dirk paid for the whole device in the book, and what the case's price
  sticker has always read. Paying £20 for permission to compute one digit higher is the joke; it's
  also a deliberately inappropriate IAP tier (real apps charge £0.99–£4.99 for unlocks — £20 is
  reserved for "Pro with cloud sync") which is itself part of the gag. Bonus recursion: the device
  can't display its own price (by its own Rule of 4, `20` becomes *"A Suffusion of Yellow"*), yet
  it charges that price to get the user one digit closer to it. The purchase screen itself stays
  in the device's voice — broken legal copy, a missing apology page, a confirmation button reading
  **"FATE IS PURCHASED."** **Up-to-6 stays hardware-only**, so the physical device remains the
  aspirational top tier — the app gets you halfway up the mountain, never to the peak.

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
- **Mostly silent — and pointedly so.** The book's calculator is silent. A real device will be
  tempted to bleep on keypress and chime on result; both undermine the cheap, beaten-up character.
  The intent: at most a single barely-audible click on keypress (cheapest possible piezo, deliberately
  too quiet to feel reassuring), and **nothing at all on a result**. The silence when *"A Suffusion of
  Yellow"* appears should be deafening — the device making no comment on what it just did. No startup
  tune, no error beep, no consult chime. (The *engineering* of "barely audible" is still deferred to
  Stage 1; the *intent* is set.)
- **It is meant to be a little inconvenient.** Slightly-awkward-to-use is part of the charm — e.g.
  the lights celebrating at exactly the wrong moment. Don't optimise the personality away.

## Deferred for now (intentionally undecided)

- Engineering choices (display, microcontroller, keys, power, sound, enclosure).
- Bill of materials and unit cost.
- Tooling approach, certification, fulfilment, and crowdfunding-campaign logistics.

These are deliberately left open until the relevant stage.
