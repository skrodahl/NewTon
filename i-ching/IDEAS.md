# IDEAS.md — ORACULON CT-64 Brainstorm Bucket

A junk drawer of half-mad ideas for future versions of the device. **These are seeds, not
commitments** — raw fuel for brainstorming. Most should never ship; the few that do must obey the
soul: *useless, confidently broken, enigmatic, in the device's voice, discovered not explained.*
(See [QUIRKS-AND-EASTER-EGGS.md](QUIRKS-AND-EASTER-EGGS.md) for what already exists, and
[PLAN.md](PLAN.md) for the roadmap.)

> Guardrail when picking from this list: does it make the device feel more like a **cursed object you
> found in a drawer**, or just like a gimmick? Keep the former.

---

## Display & screen dysfunction
- A digit that's quietly, consistently **wrong** — e.g. every `7` renders as a slightly malformed `7`,
  or one column of the LCD is permanently 1px dimmer.
- The decimal point occasionally **drifts** one place and drifts back, just often enough to unsettle.
- A **slow refresh** ghost: the previous number faintly lingers behind the new one for a beat.
- The contrast **fades as the (fake) battery "dies,"** then snaps back to full for no reason.
- Cold-weather LCD: the screen scrolls/updates **visibly slower** at "night" (by clock) — sluggish ink.
- A single **stuck-ON segment** that occasionally migrates to a different digit.
- The `DEG` annunciator flickers to `RAD` for a split second, then back — but nothing actually changes.
- Very rarely, the screen shows the reading **mirrored** or **upside-down**, then corrects itself.
- Bleed: pressing very fast makes neighbouring segments **smear**, like an overwhelmed cheap driver.

## The LED bar — a failed status system
> Framing: someone at the factory *meant* the LED bar to convey consistent status info, wrote half a
> design doc, and gave up. What shipped is a row of lights with visible ambition and zero follow-through.
> Every LED gag can hang off this thread: the lights imply meaning they never deliver.
- A **"boot self-test" sweep** on power-on that proudly tests nothing.
- A **"low battery" pattern** that means nothing (the device has no battery state — or claims not to).
- **Two LEDs that only ever light together**, for no discernible reason, occasionally.
- A faded **silkscreen legend** under the bar (`POWER · BUSY · ERR · ···`) that doesn't line up with
  any actual LED, and whose labels never match what lights.
- The bar tries to show a **"progress" fill** during the oracle scroll, but fills the wrong direction
  / overshoots / finishes before the reading does.
- An **"ERR" LED** (the soup one, canonised) that's the *only* working indicator — and it only knows soup.
- A **Morse-ish stutter** that looks like it's spelling something; it isn't.
- One LED is **permanently half-on** (a stuck status), like the ghost-8 of the bar.
- A rare **"all systems nominal"** full sweep that fires at a completely meaningless moment.
- The manual references an **"LED STATUS GUIDE"** — on one of the missing pages, naturally.

### These seeds already cluster into a Stage 1 spec

If the entries above are sorted by *when* each fires, a coherent firmware table falls out:

| Moment | LED behaviour |
|---|---|
| Power-on | Failed self-test sweep that tests nothing |
| Idle (very rare) | "All systems nominal" full sweep at a meaningless time |
| Keypress / operator / equals / clear | Existing chase / Larson / sweep / blink |
| Consult cast | Existing Larson scan |
| Consult reading | Mistimed celebration + a lying progress fill |
| Soup error | The 3rd-from-last twitch, alone |
| Always-on background | One LED stuck half-on (the strip's ghost-8) |

Working channels do their job; failed-ambition channels fail visibly. The whole strip can be
specced from this one table when Stage 1 begins.

The **faded silkscreen legend** (`POWER · BUSY · ERR · ···`) is the keystone seed — it
physicalises the entire conceit. The labels are documentary evidence that the lights *were
meant* to mean something; the misalignment with the actual LEDs is documentary evidence that
nobody finished the job. Pair it with the existing missing-pages gag (the **LED STATUS
GUIDE** is on a missing page, of course it is) and the "failed status system" idea lands
without a word of explanation.

## Input & keys
- A **sticky key**: one key (say `4`) occasionally needs a second press, or double-fires.
- **Phantom keypress**: once in a blue moon a digit appears that you didn't press.
- The `=` key sometimes **thinks for a moment** (a beat of "...") before answering.
- Holding any key too long makes the device **anxious** (LCD shows a tiny `!` or jitters).
- A secret **konami-style sequence** that does something pointless and wonderful.
- Typing the same number 3× in a row earns a tiny disapproving **annunciator**.
- The `C` key, pressed 5× fast, briefly shows **"YES, IT IS CLEAR. VERY CLEAR."**

## The oracle
- **Ultra-rare hexagrams** (1-in-500) with their own absurd names/judgements — collector energy.
- A hexagram (No. 0? No. 129?) that simply **refuses to answer**: "NOT FOR YOU. NOT TODAY."
- **Question memory**: it scolds you for asking "the same thing again" (even if you didn't).
- The reading occasionally **contradicts itself** mid-scroll, then blames TRAVEL.
- A "**second opinion**" gag: consult twice quickly and it says "I ALREADY TOLD YOU."
- Once a year (by clock) it gives a **suspiciously specific, useful-sounding** reading, then never again.
- The changing-line note sometimes references **a line that doesn't exist** (LINE 9 of 7).
- A hidden **"honest mode"** reading, vanishingly rare: "THE ANSWER IS: A CALCULATOR DOES NOT KNOW."

## Sound (needs hardware/audio)
- Cheap piezo **click** on keypress; a defeated **bdooop** on "A Suffusion of Yellow."
- A tiny triumphant **fanfare** that, true to form, fires at the wrong moment.
- The oracle scroll accompanied by **fake dot-matrix-printer chatter** (even though there's no printer).
- A barely-audible **hum** that gets louder the longer it's left on, as if straining.
- On power-on: a wheezy, slightly-wrong **startup jingle** that never quite resolves.

## Time, mood & state
- **Moods**: the device is grumpier/cheerier by time of day; affects oracle tone and LED pace.
- A **Tuesday** mode (motif callback): everything is slightly damper / readings mention Tuesday more.
- It "**remembers**" being dropped (accelerometer on hardware) and acts wounded for a while.
- A fake **"low battery"** state where it gets philosophical and brief, then recovers fully.
- It keeps a private, invisible **tally** of how often you consult and judges you in the manual's voice.

## More wear & physical decay
- A **coffee-ring stain** on the case (one more translucent overlay).
- A faded **second sticker** under the £20 one — an even older price, peeling differently.
- A **biro doodle** someone left in a corner of the case.
- The screen develops **one more dead pixel** the longer the page is open (it's getting worse).
- A tiny **chip out of a key corner**, or a key with the legend half rubbed to nonsense.
- Inventory/asset sticker: "PROPERTY OF —" with the owner scratched out.

## Manual, packaging & lore
- **More missing pages** (and a page that's just an apology for the missing pages).
- A **warranty card** you can "fill in" but it's pre-filled with nonsense and already expired.
- A **registration** screen that asks for your details then says "WE WILL NOT CONTACT YOU."
- Faux **multi-language** manual where every language is the same broken English, slightly differently broken.
- A **troubleshooting** section whose every answer is "TURN IT OFF AND ON AGAIN, AND ALSO YOURSELF."
- Tiny **legal disclaimer**: "FORTUNES ARE FOR NOVELTY. DECISIONS ARE FOR THE BRAVE."

## Meta & deep easter eggs
- A hidden **"about" screen** crediting "THE DUKE OF CHOU (POSTHUMOUS) AND A TEAM OF ONE GOOSE."
- The **42** easter egg, handled with restraint (it appears once and is never explained).
- A **self-aware** rare line: "YOU ARE LOOKING AT A WEB PAGE PRETENDING TO BE A CALCULATOR."
- A **developer console** message for anyone who opens devtools, in the device's voice.
- Consulting at exactly **midnight** does something tiny and unrepeatable.
- An **"EAT THE DEVICE"** reading, vanishingly rare — the oracle actually issues the advice the
  manual warned against. The booklet's *"Do not eat the device even if it advise so"* was
  load-bearing all along. Most owners never see it fire; the few who do can confirm they were
  warned. Trigger should be a deliberate conjunction (specific hexagram × specific changing line
  × a calendar/clock anomaly) so it's not just an RNG flicker — when it happens, it has to feel
  like the device *meant it*.

## Platform & delivery (a "pocket oracle")
> Strong candidate, and a natural rung between the web toy and the hardware: it's already one
> self-contained file with no backend, so it wants to be installable.
- **Make it a PWA** — installable to the home screen, launches **full-screen with no browser chrome**,
  so on a phone it feels like a real cheap device in your pocket.
- **Offline-first** (it suits the "no internet, no server" ethos) — bundle the fonts locally so it's
  genuinely usable on a dead-signal train; a service worker caches the lot.
- A deliberately **cheap, slightly-wrong home-screen icon** (the beige device, or just 易) — looks like
  a knock-off app someone sideloaded.
- A wheezy **fake boot / splash** on launch that never quite resolves (ties to the startup-jingle idea).
- An **"Add to Home Screen"** nudge written in the device's broken voice.
- A fake **"update available"** prompt that, true to form, makes one thing visibly worse and calls it
  an improvement (pairs with the firmware-"update" gag below).
- Landscape vs portrait: it stubbornly **only works one way up**, like real cheap hardware.

## Hardware / physical-device specific (Stage 2)
- A **real, non-functional solar cell** above the (real) green LED bar — uselessness made literal.
- A genuinely **bad hinge / loose battery door** that's *meant* to be slightly loose.
- The screen is a **reflective green graphic LCD** so it looks dead until light hits it right.
- A **"premium" dial** on the side that claims to raise the ceiling but is glued at 4.
- Packaging that looks **water-damaged from the factory**; a "best before" date already passed.
- A **lanyard hole** positioned so the device always hangs slightly crooked.

## Anti-features, "premium" gags & stretch goals
- **CEILING stretch goals** (already canon): answers up to 5, then 6, as funded tiers.
- A **"Pro" sticker** you can apply that does nothing but make it 4% more confident.
- **Subscription gag**: "UNLOCK NUMBER 7 FOR ONE SMALL SOUP PER MONTH" (never actually purchasable).
- A **firmware "update"** that visibly makes one thing worse and calls it an improvement.
- **Limited Edition Beige**: identical to standard, but the box says Limited Edition.
