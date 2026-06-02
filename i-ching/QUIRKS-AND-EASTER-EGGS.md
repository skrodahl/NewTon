# ORACULON CT-64 — Quirks & Easter Eggs

A catalogue of every intentional joke, hidden behaviour, and bit of flavour text baked into
[index.html](index.html). Nothing here is a bug — it is all on purpose.
If you edit the code, preserve these.

---

## Design Principle

The device is a calculator. It is not a chatbot, a game, a storytelling engine, or a character.
**No chat mode. No story mode. No achievement system. No NPC dialogue.**

It is annoyingly helpful. It keeps trying — sincerely — while failing at actually helping. Every
quirk is the device *succeeding at its idea of helping*: the silent π correction is the firmware
fixing your typo. "Cannot Operate on Soup" is an error message. The calibration notice is
aftermarket policy. The "BATTERY LOW" warning is a status indicator for a system that doesn't
exist. None of these are jokes from the device's perspective — they are the device doing its job,
as designed by a company whose products almost work.

Sirius Cybernetics products keep trying; their failures are sincere.

**Embrace any mistake.** This is the meta-principle that holds the whole device together:
nothing is admitted as a mistake. Every deviation, typo, regression, accidental leak, or
post-deploy oddity becomes part of the device's fiction rather than corrected against it.
A bug discovered after deploy isn't fixed — it's absorbed and explained. A typo in shipped
text becomes "the corporation's typo." A regression becomes "the device deteriorating." An
accidentally-shipped feature becomes "the device leaked it." A retroactively-edited
release notes file becomes "the corporation updating its records." The device's most
powerful defence is that *nothing* is unintentional — and the corporation behind it is
exactly the kind of organisation that would behave this way. Any future change to anything
already shipped should pass through this filter first: not "we made a mistake," but
"the device/corporation has revealed something new about itself."

**Interconnectedness is a design test.** New quirks should *connect* to existing ones — by
extending a family, sharing a principle, or building a bridge between previously-separate
pieces. The warranty's load-bearing line surfacing across three independent paths
(EAT-THE-DEVICE oracle reading, PI+PI=PIE, Calibration's closing line). The constants
forming a "two on the surface, three in total" wrong-constant family with a mirror
correction family. The Calibration mode pointing to a Complaints Department on Eadrax that
itself has a planned easter-egg surface. The 64-clew pilgrimage routing through hexagrams
whose existing judgements already speak the language of hiding. The discovery gradient
itself layering each user-type into a stack where every layer remains universally
functional. Isolated easter eggs are rejected; connected ones are kept. If a new addition
doesn't strengthen at least one existing thread, it probably doesn't belong on this
device. The web of references *is* the device's depth — not the count of features but the
graph between them.

The device has total freedom within severely restricted boundaries. It can do anything a cheap
1980s scientific calculator could do, and nothing else. The restrictions are the point: the
comedy lives in the gap between what the device *tries* to be (a helpful, professional instrument)
and what it *is* (a confidently broken £20 charity-shop find).

**The keypad is final.** The layout was carefully thought out, poorly executed, and shipped.
No buttons will be added — no `M+`, no `M-`, no `MR`, no `ANS`, no `EXP`. The keypad is a
physical artefact: what left the factory is what exists. Adding keys would break the fiction
that this is a found object. Hidden behaviours emulated through existing keys (double-press
gestures, key sequences, modifier combinations) are fair game — the firmware can be deeper
than the hardware suggests. But the hardware itself is frozen. It sort of works as a
calculator, fails at being a proper scientific calculator, in exactly the wrong and intended
way. The missing `e` key (§3) is not an oversight to fix; it's documentary evidence that
Sirius Cybernetics forgot to include it.

### The discovery gradient

People will see an innocent and flawed calculator that provides fortune telling. Those that
start exploring will start to discover things. Some are hidden in plain sight. Some appear by
virtue of time. Some by pure luck. Some are obvious for fans of calculators, Douglas Adams,
or mathematics. Some give hints to similar quirks. The grand, number-of-pebbles-in-Wales,
clew-hunting is for the relentless — in a way that makes oracle-fatigue look like child's play.

Concretely the layers run:

- **Surface** — innocent and flawed calculator. Everyone sees this.
- **Idle exploration** — quirks hidden in plain sight: the £20 sticker, the Sellotape
  holding on the back half, the soup-ERR LED off-by-one against its silkscreen label.
- **Time-based** — the `DEG`→`RAD` flicker, ambient corporate noise like the planned
  `SHARE AND ENJOY` flash.
- **Lucky** — the random oracle phrases, the flip-words spotted by accident.
- **Fan-shaped** — calculator nostalgia (`B00BIES`, the 8-digit input cap), Douglas Adams
  (Forty-two, Eadrax, the EAT THE DEVICE paths, Sirius Cybernetics, the warranty line),
  mathematics (22/7, 99/70, 19/7, π+π=pie, the silent constant correction, the 0 Kelvin gate).
- **Hint-bearing** — the shared `Calculating...` beat across three independent paths that
  reveals the device has *specific* ideas about *specific* numbers; the warranty's
  load-bearing line surfacing across three independent surfaces.
- **The relentless** — BATTERY LOW (21 consecutive oracle results, Dirk's tea-temperature
  and half-a-forty-two), the deepest reward currently implemented.
- **The pilgrimage** — the 64-clew assembly into a hidden companion-site URL (planned, see
  IDEAS): obsessive territory; Wales pebbles. The deepest legal depth.

Each layer is universally functional at every depth above it. A user who never goes past
"innocent calculator" still has a calculator. A user who collects flip-words still has a
fortune-teller. A user who finds BATTERY LOW has earned an exit no one demanded they take.
The clew-hunter is just the user at the deepest legal depth. **No layer is gated against
the layer above it; every layer is accessible to whoever finds it.** The device is
universally useless at every level, in increasingly satisfying ways.

> *A short variation of this section will likely become the public-facing description for
> the Play Store entry (Stage 0.5 distribution): same hierarchy, marketing register, fewer
> internal references. To be drafted closer to launch.*

---

## 1. The Central Conceit — "The Rule of 4"

The whole device is built around one gag, lifted from Douglas Adams' *The Long Dark Tea-Time of the
Soul* (the second Dirk Gently novel), where an electronic I Ching calculator answers any sum above
four with **"A Suffusion of Yellow."** Dirk pays £20 for one that can "handle any calculation which
returned an answer of anything up to '4'."

- **It accepts any input, but refuses any answer above 4.** You can type `74`, `9999`, anything.
  The catch is the *result*: if `Math.abs(result) > CEILING` (where `CEILING = 4`), the device
  "becomes philosophical" and prints an absurd phrase instead of a number.
  - `tan(74) = 3.49` → succeeds (the answer knows its place).
  - `2 + 3 = 5` → **"A Suffusion of Yellow"** (unforgivably large).
- The ceiling is a single named constant (`var CEILING = 4`). Raising it is, in-universe, the
  **"premium model" sold elsewhere** that "permit answer as high as 5, perhaps 6."
- This gate is enforced in **two** places: `doBinary()` (for +−×÷ and `=`) and `unary()`
  (for the scientific functions). Both check `Math.abs(r) > CEILING`.

### Two separate pools of nonsense
- **`ORACLES`** (60 phrases) — shown when an answer is simply *too big*. Two are **verbatim
  Adams canon** (the device's defining utterances, kept unaltered): *"A Suffusion of Yellow"*
  (flagged as **"the canonical one"** and **slightly weighted** — `pickOracle()` returns it ~1 in 6
  vs ~1 in 60 for the rest — so a first-time user is likely to meet the famous phrase), and
  *"The Number of Pebbles in Wales"* (also from the calculator scene, unweighted). The rest riff
  on the same deadpan-surreal register: *"An Onset of Tuesday," "A Modest Quantity of Soup,"
  "Beige," "Approximately a Hat," "Somewhere Between Six and a Llama," "Two-Thirds of an Apology,"
  "Greyish, with Ambitions," "The Number of Empty Chairs at a Library Closing," "Approximately
  Norwich," "Confidently Uncertain," "A Looming Sense of Thursday," "The Ghost of a Cold Cup of
  Tea," "A Decidedly Lukewarm Epiphany,"* etc.
- **`Q42`** (4 phrases) — a **sibling oracle pool**, exclusively shown when a hidden result equals
  exactly 42 (`suppressBig()` picks from `Q42` instead of `ORACLES` whenever `hidden === 42`).
  All four are verbatim canonical Adams material related to the Ultimate Question:
  *"How Many Roads Must a Man Walk Down?"* (Dylan via Adams),
  *"What Do You Get If You Multiply Six by Nine?"* (Adams; 6×9=54 in base 10 but 42 in base 13 —
  Adams' own joke about the Question, especially funny on a calculator that computes in base 10
  and so can never reach 42 via this path),
  *"What Is The Ultimate Question?"* (meta — the Question is itself the question), and
  *"Life, the Universe, and Everything"* (the canonical subject). When one of these surfaces, the
  user is seeing the device's "Question half" — and the lucid trigger is now armed, so the very
  next calc fires the bypass and reveals the Answer. The Question (`Q42`) and the Answer
  (lucid bypass) are **mechanically paired**: one always precedes the other.
- **`NAMED_NUMBERS`** (extensible dict) — Adams Easter-egg phrases for specific hidden values.
  `suppressBig()` checks this dict after the Q42 special case but before falling through to a
  random ORACLES phrase. Current entry: **`5760003`** → *"The Total Number of Irritated People"*
  (HHGTTG; the population of Brontitall, who became furious all at once). To reach it: type
  `5760003 + 0 =`, or any path that produces the value exactly. The display will read the phrase
  instead of a random oracle. Display-only — no lucid arming, no other mechanic triggered. Adding
  more named-number Easter eggs in the future is a single key-value addition to the dict.
- **`VOID`** (11 phrases) — shown only for **non-finite or NaN** results, e.g. **divide by zero**.
  These are darker: *"The Void Gazes Back," "Division Is a Form of Loss,"
  "You Have Divided by the Abyss," "That Operation Was Frankly Rude,"
  "An Infinity, Politely Withheld."*
- **`IMAGINARY`** (8 phrases) — dedicated pool for the specific case of **`sqrt` receiving a
  negative input** (mathematically: imaginary territory, undefined in reals). Sibling to VOID
  but for a different kind of impossibility: VOID is *divide-by-zero / infinity*, IMAGINARY is
  *below-the-number-line / undefined-in-reals*. Same register, different mathematical sin.
  Entries: *"Imaginary, Mostly," "An Imaginary Quantity, Politely Withheld" (paired with VOID's
  Infinity entry), "The Square Root of a Regret," "Below the Number Line, Dragons" (paired with
  VOID's "Here Be Dragons"), "The Root Exists, But Elsewhere," "The Number Line Refuses to Bend,"
  "Roots in Other Dimensions," "Negative, Confidently"* (paradoxical pair to ORACLES' "Confidently
  Uncertain"). Reachable casually via the **minus-as-sign quirk** (see §2): type `-5`, press `√`.

### The 42 lucid bypass — the Rule of 4 occasionally fails (Adams)

The Rule of 4 has one secret exception: if the **previous calculation's hidden (oracle-replaced)
result was exactly 42** (Douglas Adams' Answer to the Ultimate Question), the **next** calculation
bypasses the Rule of 4 — the device briefly remembers how to be a calculator and shows the real
answer, no matter how large. The user never sees the 42 that triggered it; they just see a number
where they expected a phrase.

- **Setting the trigger.** Any calc (binary op via `doBinary()` or scientific function via `unary()`)
  whose result is > 4 AND rounds to exactly 42 → `lastHiddenResult = 42`. Many paths: `6 × 7`,
  `21 × 2`, `84 ÷ 2`, `50 − 8`, `1764 √`, `42 + 0`, even `120 % 78` (modulo can set it too).
  When this fires, the user sees one of the four **`Q42`** phrases (see ORACLES intro above) —
  the device's "Question half" — instead of a random oracle. The visible Question and the hidden
  trigger are mechanically aligned: the device asks the Question; the next calc reveals the Answer.
- **The `6 × 9 =` special path (Adams base-13 joke).** `6 × 9` computes to 54 in base 10, not 42 —
  but Adams' joke was that in base 13, 6×9=42 (Mostly Harmless). The device honours the joke:
  when the operation is literally `6 × 9 =` (or `9 × 6 =`), the device displays the phrase
  **"Forty-two"** *and* sets `lastHiddenResult = 42` (overriding the actual 54). The next calc
  fires the lucid bypass and reveals its real answer. The device is *mechanically committed* to
  its base-13 claim for one beat. The phrase is hardcoded for the `6 × 9` path only — typing 54
  any other way (e.g. `50 + 4`) just oracles to a random ORACLES phrase. The Adams reference is
  owned by the literal operation, not by the result.
- **The `π + π =` special path (the homophone reading).** Sibling to `6 × 9`, same architectural
  slot: a hardcoded intercept in `doBinary()` that fires before `suppressBig()` and overrides the
  normal oracle. When *both operands are exactly the device's π value* (`3.142857143` =
  `22/7` rounded to 9 decimals, as `constPi()` produces) and the operator is `+`, the device
  scrolls the reading **`PI + PI = PIE. ORACULON IS NOW EDIBLE. THE WARRANTY DID WARN YOU.`**
  across the LCD (using `marchReading`, the same scroller as the consult flow) and finally
  settles on **`PIE.`** — the device's last word after the dramatic announcement. Three things
  happen in one line: the arithmetic is shown in homophone form (`PI + PI = PIE`), the device
  announces its transformation in matter-of-fact clinical voice (`IS NOW EDIBLE`), and the
  warranty's load-bearing line gets called back in past-tense reproof (`DID WARN YOU`).
  The scroll-delivery (rather than a static `showPhrase`) is the right register: the reading
  is too long to fit the LCD statically, AND conceptually this IS a tiny oracle, just triggered
  by an arithmetic gesture rather than the Red button. Treating it like a mini-consult honours
  what it actually is. The reading is non-trivial to reach: π is itself slow (~1s
  `Calculating...`), and a double-press of π gives e (19/7) instead — wrong pool. So the user
  must press π once, wait for it to settle, press `+`, press π once more, wait, press `=`. Each
  π must be the patient single-press kind. The operation rewards a calm, deliberate gesture,
  in keeping with the device's general policy of giving the most interesting things to the
  most patient users. The pie path *also* catches manually-typed `3.142857143 + 3.142857143` —
  anyone deliberately entering the device's exact π value knows what they're up to and gets the
  reading they earned. Companion to the consult-side EAT-THE-DEVICE reading (see §4): two
  completely independent surfaces — the arithmetic and the oracle — both arrive at the same
  load-bearing booklet callback. The warranty line was foreshadowing twice over.

  **The PIE symbol on the LCD.** While the reading scrolls (and after it settles on `PIE.`),
  the left-most LCD area — normally home to the hexagram graphic during a consult — fills with
  a small **pie pictogram**: a 3/4 circle with a wedge cut out, the universal "pie with a slice
  taken" image. Implies someone has already begun eating it, and pairs visually with the
  device's `NOW EDIBLE` announcement: *here is the pie, here is what a slice looks like, do
  the rest.* The symbol fades in alongside the scroll and clears on any subsequent action
  (including a fresh consult — the pie was a moment, not a persistent state, same logic as
  the hex graphic). Implemented as a `.pie` element styled with a `conic-gradient`, sharing
  the hex's coordinates so the calc-side oracle gets a visual that mirrors the consult-side
  oracle's hexagram. Two graphics in the same slot, mutually exclusive by trigger — one when
  the Red button cast says nourishment, one when the arithmetic says pie.
- **Firing the trigger.** The very next calc that produces a result > 4 — provided the operator
  isn't `%` — bypasses Rule of 4 and shows the actual number. Trigger is then consumed.
- **The crown jewel.** Type `6 × 7 =` twice in a row. First cast oracles (hidden 42, trigger set).
  Second 6×7 produces 42 again → > 4 → trigger fires → **shows `42`**. The device finally gives
  the answer to the ultimate question of life, the universe, and everything — but **only when
  asked twice in succession**.
- **"Unapproved Accuracy Mode Activated" flash.** Just before the lucid bypass reveals the real
  answer, the LCD flashes the phrase *"Unapproved Accuracy Mode Activated"* for **~1 second**,
  then transitions to the number. The device officially announces, in its own bureaucratic
  voice, that it's about to do something it shouldn't. The corporate phrasing — "Unapproved",
  "Mode", "Activated" — is **pure Sirius Cybernetics**: the manufacturer formally declaring
  that the device is operating outside its design specification, with the same earnest-but-wrong
  tone that runs through the rest of the manual. The flash gives the user a beat to catch the
  transgression in real time: **oracle phrase → "Unapproved Accuracy Mode Activated" → real
  number**. Implementation: `flashThenNumber(r)` calls `showPhrase()` immediately, then
  `setTimeout(() => showNumber(r), 1000)`. The brief window means a user pressing keys during
  the flash gets the usual soup-on-phrase behaviour for ops; new input is overridden when the
  number lands. Minor edge weirdness, acceptable for a ~1s window — the device is allowed to
  be a bit chaotic when it's confessing.
- **Strict reset.** The trigger is cleared by `clearAll` (`C`/`Esc`), `del` (`⌫`/`Backspace`), or
  `consult` (`Red`/`?`/`i`/`I`) — any action other than progressing to the next calc breaks it.
  It's also consumed by any successfully-displayed number (≤ 4 results clear it without firing),
  and overwritten if a different > 4 hidden result lands in between.
- **`%` is excluded from firing.** `%` can SET the trigger (via modulo producing 42) but never
  CONSUMES it as a lucid bypass — `%` stays `%`, all four layers of its weirdness preserved (§2).
  The `(o !== "%")` guard in `doBinary()` enforces this.
- **Discoverability — the fifth tier of curiosity.** Casual users will never see it. Patient users
  might encounter one inexplicable success and dismiss it as a glitch. Curious users who notice the
  pattern and try to reverse-engineer it might guess 42 eventually. Adams fans will guess 42 on
  the first try. Readers of this doc go straight to it. Each tier of attention gets the discovery
  they earn.

**One amplification worth flagging**: when lucid fires on a calc whose true result has a
non-terminating decimal expansion, the **"8 in / 10 out"** display mismatch (§2) extends further —
`100 ÷ 3` after a 42-trigger shows the **12-character `33.333333333`**, `1000 ÷ 3` shows the
**13-character `333.333333333`**. The display has no width limit on the result, only on the input.
Lucid + division = the device's silent commitment to showing the real answer regardless of how
ridiculous the digit count gets.

### BATTERY LOW — the 21st-consecutive-oracle fatigue

The deepest easter egg in the device. The Rule of 4 says: *the answer must stay below 4; bigger
results become an oracle phrase.* The user who insists on doing big calcs over and over earns
*nothing* from this — every result becomes a different oracle phrase, the device keeps
deflecting. There's no payoff for grinding the Rule of 4, **except** if you grind it long
enough.

After **21 consecutive oracle results** with no real number in between (and no `C` press to
break the streak), the 21st-would-be oracle is replaced by **BATTERY LOW**. The device's
pretend-energy-source — advertised by the `POWER · BUSY · ERR` legend that's been hanging
under the LED bar all along (see §6) — finally "gives out." The LCD displays the phrase
`BATTERY LOW` at full brightness, then *only the segments* fade — text, annunciators,
ghost-8, hex/pie graphics — along with the individual LEDs in the bar. The **green LCD
panel itself and the dark LED housing stay solid throughout**: this is a reflective LCD,
not a backlit one, so power loss kills the segments but the polarizer/reflector glass
remains visible. The segment fade runs over **9000–11500ms** (random per fire — never
exactly 10s) with an `ease-in` curve (battery-knee feel: slow plateau, accelerating drop).

**The wake-up has three stages:**
1. **Dead pause** equal in duration to the fade itself — another 9000–11500ms with the
   panel visibly still green but completely blank (no segments, no LEDs). The device is
   fully powered down; the panel just stares back. *Tense.*
2. **LED sputter** — in the final 2 seconds before LCD wake-up, the LEDs come back online
   alone, firing randomly via the `twinkle` pattern. Power returns to the easy-to-power
   bits first; the LCD is still dark. No SOS, no Morse — just chaotic LED noise as the
   device tries to power back up.
3. **LCD wake-up** — at the end of the LED sputter, the LCD content snaps to `0`, the
   `.dying-lcd` class is removed (segment opacity returns to full instantly), all session
   counters reset (lucid trigger, π press count, escape arm, C-mash streak, hex/pie
   graphics all cleared), LEDs return to idle. Like a fresh boot.

Total dead-time: **~18–23 seconds** (2 × fadeDuration). The two-stage wake-up (LEDs first,
then LCD) is in-character — a real cheap device coming back from a dead battery would
sputter on the easy bits before the demanding display started working again.

**The threshold of 21 has two simultaneous readings** — both pure Adams:

1. **Dirk Gently's tea-temperature commitment number** — Dirk's optimal tea temperature is
   room temperature, ~20–21°C; we settled on 21 deliberately.
2. **Half of forty-two** — exactly half of the Ultimate Answer. Adams numerologically: if
   42 is the device's most-canon-stacked number (Q42 pool, lucid bypass, base-13 path,
   PIE reading, 13-char display coincidence — §1, §3, §9), then 21 is its quiet other
   half. The user who has hit the Rule of 4 wall 21 times has, in a sense, accumulated
   *half an Answer's worth of failure* before the device gives up.

Both readings point to the same number; both are valid; either alone would justify the
choice. The device's deepest threshold is the intersection of "Dirk's room-temp tea" and
"half an Ultimate Answer" — exactly the kind of canon density the most-buried easter egg
deserves.

**Total input seal during the fade.** While `batteryDying` is true, the dispatchers refuse
every key, including `C`. The device is *dead* for the duration; no early recovery, no
short-circuit. The user who earned this by hitting the Rule of 4 wall 21 times in a row
accepts the full 10-second penalty. The fact that `C` doesn't bypass the death is itself a
piece of texture: a real cheap device with a dead battery doesn't respond to its power button
either.

**Why this is the most-hidden easter egg in the device.** It takes 21 consecutive Rule-of-4
results — every calc must produce a result with absolute value > 4, with no real number ever
intervening, and no `C` press to reset. That's a deliberate grind. Vanishingly few owners will
ever see it. The reward isn't a witty phrase or a hidden answer — it's the device giving up
on itself, fading away, and coming back. The user gets confirmation that even the Rule of 4
has a limit, and the limit is "the device is too cheap to handle being asked this many big
questions in a row."

**Implementation.** `oracleStreak` counter increments at the start of `suppressBig()`, resets
in `showNumber()` (real number shown) and `clearAll()` (`C` pressed). On streak reaching 21,
`fireBatteryLow()` runs instead of the oracle: sets `batteryDying = true`, sets the CSS
variable `--battery-die-duration` to the random duration, adds `.dying` class to body.
A keyframe `batteryDie` (opacity 1 → 0, ease-in, forwards) runs on `.lcd` and `.solar`.
After the duration, `setTimeout` clears `.dying`, resets all session state, calls
`endOracle()` and `clearAll()`. Repeatable: another 21-in-a-row will fire it again.

---

## 2. Calculator Behaviour Quirks

- **"You can't operate on soup."** Once the display is showing an oracle phrase
  (`settled === "phrase"`), most operations refuse it:
  - Pressing an operator (`+ − × ÷`) while a phrase is shown displays **"Cannot Operate on Soup"**
    (and lights the `∞` error light, and starts the 3rd-from-last LED twitching as a barely-working
    error indicator — see §6); the device won't proceed until you press `C`.
  - `equals` does nothing on a phrase.
  - A scientific function applied to a phrase just returns another `ORACLES` phrase.
- **8-digit input with dysfunctional overflow.** Input is capped at **8 digit positions** (the
  decimal point doesn't count, so `0.1234567` is full). Once full, typing more doesn't add a digit —
  the **last digit just keeps changing** (`inputDigit` rewrites the final digit via
  `disp.replace(/\d(?=\D*$)/, d)`), the classic broken-pocket-calculator behaviour.
- **…but results are NOT clamped — on purpose.** `showNumber` only trims float noise (rounds to 9
  decimals, `Math.round(n*1e9)/1e9`, so no `0.30000000000000004`); it leaves the digit count alone, so
  a result like `π` shows the **baffling 10-digit `3.141592654`** even though you can only *type* 8.
  That mismatch (8 in, 10 out) is a deliberate bit of confusion. **The 42 lucid bypass** (§1) can
  push this further: `1000 ÷ 3` under a fired trigger shows the **13-character `333.333333333`** —
  the display has no width limit on the result, only on the input. Lucid + a non-terminating
  decimal division = the device silently committing to showing the answer no matter the digit count.

- **The display width is secretly base-13.** An *accidental* structural coincidence worth
  noting: when the lucid bypass fires on a non-terminating decimal division, the LCD displays
  **up to 13 characters** (e.g. `1000 ÷ 3 = 333.333333333`, `1000 ÷ 7 = 142.857142857` — both
  3 integer digits + decimal point + 9 fractional digits, totalling 13). That number — **13** —
  is the same number as the base in Adams' famous joke that *6 × 9 = 42 in base 13* (which the
  Oraculon honours via the `6 × 9 =` → "Forty-two" path in `doBinary()`). The device's *maximum
  visible digit count* and the device's *Adams-canon mathematical reference* share the same
  number. Unplanned but perfect: **the medium itself nods at the message**. The Oraculon's
  display width is, accidentally, base-13 — the very base in which `6 × 9` finally equals what
  Adams said it should. The structural coincidence retroactively makes the design feel even
  more deliberate than it is.
- **The readout is one fixed size in a fixed-height window.** Every phrase renders at the single
  `.out.phrase` size (24px); long ones **wrap** to a second line rather than shrinking. The `.out`
  box itself has a **fixed height** (56px — sized for the 48px number *and* a 2-line phrase) with
  content vertically centred, so the LCD never changes size between answers — whether `0`, `Beige`,
  or a two-line wrapper. Preserves the illusion of a fixed-segment LCD.
- **The error annunciator.** The `∞` symbol in the LCD status bar lights up **only** while a
  phrase is being displayed (it's the device's idea of an "error" light).
- **`=` thinks for a moment** — ~0.5% of equals presses (1 in ~200), the device shows `"..."`
  for a brief moment (600–1000ms) before computing. Pure cheap-calculator hesitation, no actual
  reason. **Deliberately scarce** so it feels like a glitch the user catches once, not a feature
  they expect. Implementation: `equals()` rolls a 0.5% die and on hit, calls `showPhrase("...")`
  and defers the `doBinary` via `setTimeout`. Edge case during the think window: if the user
  presses another key, behaviour can briefly glitch (the device is allowed to). Skipped under
  `prefers-reduced-motion` to avoid surprise delays for users who didn't opt into animations.

  *(A slow-refresh ghost effect was prototyped here and removed: extending it consistently
  across every display path — digit input, operator, phrase, marquee scroll, hex draw, glitch
  overlay, settle — would have required coordinating with each rendering surface, and a partial
  implementation that only fired on `=` would have felt like a bug rather than a feature.)*

- **Minus-as-sign — two states.** The device has no dedicated `+/-` key; pressing `−` instead
  starts a negative-number entry in two distinct states:

  **State 1: default state.** Pressing `−` when the display reads exactly `"0"` and no
  operator is pending (just after `C`, or at first load) does NOT start a subtraction.
  The display becomes literally `−` and the next digit extends to `-5` (or `-0.5` for a
  decimal). Reachable accidentally by anyone who presses `−` first at the start; the `−`
  appearing on screen is the discovery cue. Opens the path to `sqrt(-x)` → IMAGINARY pool
  (§1).

  **State 2: after a non-minus operator (post-operator entry).** Pressing `−` when an
  operator is pending (`+`, `×`, `÷`, `%` — anything except `−` itself) AND `fresh === true`
  (no digit typed yet for the next operand) starts a *negative-operand* entry. The pending
  operator is preserved; the next operand becomes negative. Lets the user type `0 ÷ -273.15
  =` directly, and the more general case of `X op -Y` for any op except `−`. The op !== "−"
  guard preserves the existing double-minus behaviour for users who do that (`5 − − 3` still
  re-affirms subtraction).

  Both states emit `disp = "-"` until a digit comes in; the inputDigit `disp === "-"` branch
  then prepends the minus to the new digit. If the user presses something other than a digit
  while disp is `"-"`, parseFloat returns NaN, which propagates through doBinary to VOID —
  acceptable failure mode for a gesture the device wasn't expecting. State 2 is a deliberate
  extension that brings the device closer to a real calc (which would accept negative
  operands); without it, the 0 Kelvin gate (see §3) wouldn't be typeable.

- **The pending operator is NEVER shown.** Standard calculators display the pressed operator
  somewhere (usually a small status indicator near the LCD). The Oraculon **deliberately does
  not**. After you press `+` or `−` or `×` or `÷`, the display shows the same operand you
  typed — no visible indicator of what operator you've armed. The user has to remember. This
  is itself a design choice: the device shows you what you've fully *typed*; it never confirms
  what it half-*remembers*. Quiet but persistent low-grade unease — confidently uncertain.

- **`C` × 5 fast → *"YES, IT IS CLEAR. VERY CLEAR."*** Pressing the `C` (Clear / Escape /
  `c`) key **five times in rapid succession** (≤800ms between each press, uninterrupted by any
  other key) triggers an emphatic confirmation phrase. The device, asked five times whether it
  has cleared, finally responds with the most patient version of *yes*. Pure hidden discovery —
  **no visual buildup** during presses 1–4, just the sudden phrase on press 5. Each press still
  performs a normal clear (the easter egg is additive, not destructive). Implementation:
  `clearStreak` counter incremented by `trackClearStreak()` on every C; reset to 0 by any
  non-C key via `resetClearStreak()`; auto-expires after 800ms of C-inactivity. Discoverable
  by accidental mashing, satisfying when found.

- **The classic four-banger flip-word recognitions.** When the display reads one of these exact
  numbers (typed directly, or shown via lucid bypass), the LCD substitutes the flipped word —
  the visual swap real schoolchildren get by physically flipping their calculator upside down.
  Each entry is its own small mini-discovery.
  - `5318008` → **`B00BIES`** (every schoolchild's first calculator test)
  - `80085` → **`B00BIES`** (the abbreviated form — the device **refuses** the cruder
    abbreviation, "B00BS", and silently substitutes the polite full form instead. Sirius
    Cybernetics speaks Queen's English; the abbreviated form is not in the device's vocabulary.
    Two inputs converge on one output, and the user who tries both discovers the device's
    corporate propriety in action.)
  - `0.7734` → **`hELL.0`** (the classic "hello")
  - `7734` → **`hELL.`** (the shorter variant)
  - `35009` → **`G00SE`** (thematic — geese are a recurring oracle motif)
  - `5317704` → **`h0LLIES`** (The Hollies — the 1979 album *Five Three One – Double Seven O
    Four* encodes the band's name in calc spelling)
  - `14` → **`hi.`** (a tiny greeting that briefly appears whenever 14 surfaces in arithmetic)
  - `376616` → **`GIGGLE.`**
  - `7714` → **`hILL.`**
  - `53045` → **`Sh0ES`** (zero for O)
  - `38` → **`bE.`** (another tiny greeting mid-arithmetic)
  - `5338` → **`bEES.`**
  - `0.705` → **`S0L.0`** ("solo" — typed as `0.705` since that's how people start
    leading-zero numbers on a calc; the stray decimal preserves in the flipped position, same
    convention as `hELL.0`)
  - `616` → **`GIG.`**
  - `7108` → **`b0IL`** (zero for O)
  - `711` → **`7-Eleven.`** (brand recognition + British full stop — works in any language
    where the digits read as the same brand)
  - `999` → **`Toe Rag`** (doubly redundant — the Rule of 4 would oracle 999 the moment
    you tried to compute anything with it, AND you could just type `666` directly, which
    the device has no opinion about whatsoever. So typing `999` isn't a substitute for
    "I want to see 666"; it's specifically the schoolyard *ritual* of typing the number
    that becomes 666 when you flip the calc upside down. The device understands this
    intent precisely and rewards it by withholding the 666 entirely — substituting Odin's
    manservant from *The Long Dark Tea-Time of the Soul*. The most niche reference on the
    device, rewarding only the kind of reader the device was made for.)

  **Religious recognition, slightly off execution.** The device understands the trick well enough
  to recognise the inputs, but its rendering is *the flip-mechanic taken literally*: zeros for Os
  (matching the actual digit-as-letter substitution a flipped LCD would produce), decimals
  preserved in their wrong post-flip positions, stray punctuation. Sirius Cybernetics half-
  understood the joke — they implemented the recognition feature but never realised the user was
  supposed to *physically flip the calc* to do the rest. The device's render is what a flipped
  LCD would actually look like, *not* what someone reading it would say.

  Pure visual substitution: the underlying `disp` (state) is unchanged, so operators and
  `parseFloat` continue to work on the real number. Intercepted in `render()`: if `disp` matches
  a `FLIP_WORDS` key and we're not showing a phrase, substitute the flipped text. Adding more
  entries is a single line per Easter egg.

  **Bonus emergent property: typeable but not computable.** The Rule of 4 and the render-time
  substitution combine to create an unintended-but-perfectly-in-character third layer of
  "slightly off": the device **knows** the flip-words (recognises them on input), but a user
  trying to *compute* their way to one (e.g. `5318007 + 1 =` aiming for `5318008`) gets an
  oracle phrase instead — because the result of the calc is way over Rule of 4, so
  `suppressBig` intercepts before `showNumber` can ever set `disp` to the magic number. A real
  schoolchild four-banger lets you reach the flip-word via either typing OR computing; the
  Oraculon **only allows the typing path**, having half-implemented the recognition feature
  then half-disabled the computational route real calculators use. Only the lucid bypass
  (a deeply-buried mechanic) can produce a flip-word as a calculated result. Three nested
  "slightly off" layers on a single gag: *the device knows the trick, renders it literally
  wrong, AND prevents the normal path to reach it.*
- **The `%` key is the most-loaded button on the device — deliberately.** Real calculators have
  a `%` that does `a × b % → (a×b)/100`. The Oraculon's `%` is wired straight into `apply()` as
  `case "%": return a%b;` — JavaScript modulo. That one design choice opens **five** independent
  hidden behaviours, each rewarding a different kind of curiosity:
  - **Casual user** presses `4 × 51 %` expecting percentage. Instead the pending `×` completes first
    (`4 × 51 = 204`) and oracles out ("The Concept of Wednesday" or similar). The `%` itself never
    actually runs in this shape — what looks like erratic `%` behaviour is the `×` failing Rule of 4.
  - **Patient user** discovers the unfamiliar form: `51 % 4 =` returns `3` — real, deterministic
    modulo. And because modulo by small divisors reliably lands under the Rule of 4, this is in fact
    the **most predictable operator on the device** — quietly, the only key that almost always shows
    a number instead of a phrase.
  - **Curious user** notices that integer modulo always yields an integer, so `%` *never* produces
    a decimal — unless a non-integer was summoned into one of the operands first, via the `.` key or
    a scientific function. `π % 1 =` → `0.141592654`. `2 √ % 1 =` → `0.414213562`. The decimal world
    exists; it just stays hidden until the user deliberately calls it forth.
  - **Adventurous user** discovers `%` is also a **hidden modifier key**. Pressing it immediately
    before the oracle button (`Red`) bypasses the cast gate for one consult, opening the full 128
    hexagrams to that single roll — see §4 "The hidden escape." This compounds the `%` weirdness
    into a different mechanism entirely: it's both the wrong operator AND a modifier for the oracle
    system. One button, two completely separate undocumented behaviours, no UI hint for either.
  - **Bemused user** discovers a typed sequence: typing **`10`** and then pressing **`%`** displays
    the phrase ***"The Holistic Detective Agency Fee"*** — Dirk Gently's absurd invoice fee, from
    the eponymous novel. The Easter egg fires whenever the display reads exactly `"10"` at the
    moment `%` is pressed (whether typed directly or arrived at via earlier arithmetic) AND no
    operator is pending. The chained modulo path (`X % 10 =`) is unaffected; only the entry-level
    `10 %` sequence is hijacked. Display-only — no lucid arming, but `%` still arms `escapeArmed`
    via the dispatcher (so `%`+`Red` continues to bypass the cast gate per layer 4).
  Five mental models for five kinds of user, from one unchanged line of code plus two dispatcher
  checks (the escape arm and the "10 %" hijack). The `%` carries: **wrong operator**, **sneakable
  operator**, **decimal gatekeeper**, **gate bypass**, and **holistic invoice trigger**. **Do not
  "fix" this back to percentage** — the misnaming is the foundation; all five layers depend on it.

---

## 3. Scientific Function Quirks

- **Trig works in DEGREES, not radians** — like a real pocket calculator. There's a `D2R` (degrees-
  to-radians) conversion and the **`DEG`** annunciator in the LCD. A code comment notes the device
  "thinks in degrees, like a polite calculator." The annunciator is *almost* permanent — three
  distinct things can interrupt it:
  - **`B13`** (deliberate, signal): when the user computes `6 × 9 =` and the device asserts Adams'
    base-13 answer ("Forty-two"), the `DEG` text changes to `B13` for the duration of the
    "Forty-two" display. The next user action restores `DEG`. Tiny status-bar confession that the
    device is, for that beat only, *actually in base 13*. See §9.
  - **`RAD`** (random, noise): a `setInterval` rolls a ~1.5% die every 3.5 seconds; on hit, the
    `DEG` text flips to `RAD` for 110–210ms then reverts. No actual mode change — trig still
    computes in degrees. Pure LCD-driver glitch, the kind of thing a cheap display does at random
    intervals. Roughly once per ~4 minutes of session time. Skipped under `prefers-reduced-motion`.
    Skipped if the annunciator is currently overridden by `B13` (don't stomp the deliberate signal
    with random noise).
  - The `B13` and `RAD` mechanisms share the same annunciator surface but **never collide**, by
    design: the random flicker checks `degEl.textContent === "DEG"` before firing, so any
    deliberate override gets right-of-way.
- **The functions are real and usable** — `sin cos tan √ x² 1/x log π` all compute correctly — but
  they still obey the Rule of 4. So `tan(74)=3.49` is allowed; `tan(80)=5.67` becomes an oracle.
- **`π` is `22/7`.** Not a bug — pressing `π` prints `3.142857143`, the schoolroom
  approximation, not `3.141592654`. Correct to `3.14`, then diverges at the third decimal:
  `3.142857...` (22/7) vs `3.141592...` (π). Anyone who memorised more than `3.14` spots it
  instantly; everyone else thinks they're seeing π and goes about their day. Sirius Cybernetics'
  signature move — they bought a maths library, used the wrong constant, and never noticed. The
  result counts as a normal number you can keep computing with (still subject to the Rule of 4),
  so any derived calculation is silently 0.04% off forever. Those who know, know. Implemented in
  `constPi()` with a code comment that begs future maintainers not to "fix" it. The trig
  functions and `D2R` still use real `Math.PI` internally — the wrongness is restricted to the
  *displayed* constant, which is the only place a user can observe it. Half-implemented, in
  perfect character: the device is wrong loudly where you can see, correct quietly where you
  can't.
- **`√2` is `99/70`.** Sibling to the π gag. Type `2`, press `√`, get `1.4142857143` — the
  famous continued-fraction convergent — instead of the real `1.4142135624`. Correct to `1.414`,
  then diverges at the fourth decimal (`1.4142857...` vs `1.4142135...`). Same Sirius
  Cybernetics framing: the maths library "knows" the famous irrationals from a textbook table
  and serves the hardcoded rational; every other `√` input goes through real `Math.sqrt` as
  normal. So `√3`, `√5`, `√7` are all correct — only `√2` got the textbook treatment, because
  that's the one a schoolchild looks up first and the library author committed to memory.
  Implemented as a one-line guard inside the `sqrt` entry of `FN`. The "surface" family is
  therefore *exactly two members* (π and √2) — both are constants any mathematics-aware user
  tests on a new calculator within their first three minutes, and both fail that test in a way
  that only someone who memorised more than three decimals will notice. The two-member surface
  family is deliberate: a third would start to feel like a maths library; two feels like
  *hand-curated shortcuts by a fictional incompetent corporation*.
- **Hidden third constant: `e ≈ 19/7` via *true* double-pressing `π`.** The sci row deliberately
  *lacks* an `e` key — Sirius Cybernetics shipped a "SCIENTIFIC" calc that forgot Euler's
  number, which is itself a quirk (see §3). But `π` is also deliberately *slow*: pressing
  `π` shows `Calculating...` on the LCD for ~1 second before committing the value. If — and
  only if — you press `π` again **inside that window**, the device cancels the pending result,
  replaces the message with `Recalculating...`, restarts the wait, and commits e (19/7 =
  `2.714285714`) instead of π (22/7 = `3.142857143`). Wait for the value to settle on screen
  before pressing again, and the chain ends: the second press is a fresh consultation that
  gives π again. So this is a genuine **double-press gesture**, not just consecutive presses
  in any timing. The family is two members *on the surface* (π and √2, both reachable through
  normal calculator use) and three members *in total* (π, √2, e), with e buried behind a
  gesture the device never advertises. Same continued-fraction-convergent flavour as 22/7 —
  `19/7` has the same denominator, the same schoolroom-approximation feel, and matches `e =
  2.71828...` to `2.7` before diverging at the second decimal.

  **The slow calc IS the discovery mechanism.** This is the design point that makes the easter
  egg findable without instructions. Three things happen simultaneously when `π` is pressed:
  (1) the device performs a piece of in-character theatre — it pretends π is a real computation
  worth a beat of consideration, in keeping with Sirius Cybernetics' general "this is a serious
  machine, honestly" energy; (2) the user gets a *generous reaction window* in which a
  reflexive second press is naturally rewarded — anyone who finds the slow calc surprising
  enough to press again gets the e swap; (3) the `Recalculating...` line is a tiny piece of
  acknowledgement that the device knew its first answer was contestable. Rapid mashing keeps
  restarting the wait, so the device looks anxiously indecisive until you stop. Skipped under
  `prefers-reduced-motion`: commits immediately, but a 1-second decay timer preserves the
  double-press window so reduced-motion users still get the easter egg via timed double-press.

  **The input gate.** While `Calculating...` / `Recalculating...` is on screen, *every other
  key is silently ignored* — only `π` does anything. The device behaves as if it's actually
  busy doing slow work and cannot be distracted: digits don't enter, operators don't register,
  even `C` and the Red button are unresponsive. This serves two purposes simultaneously:
  (1) it sells the *calculating* illusion completely — the device isn't *pretending* to be
  busy, it is genuinely refusing input, which is what a busy calc would do; (2) it makes the
  double-press easter egg surface much cleaner — the only thing that does anything during the
  wait is pressing `π` again, which is exactly the gesture that reveals the toggle. Triple-
  pressing `π` still works fine (the gate explicitly lets `π` through; ping-pong continues:
  22/7 → 19/7 → 22/7 → 19/7 → ...). Skipped in reduced-motion mode (commit is instant; no
  phrase to gate around). State lives in `piCalcShowing` (set when the phrase displays, cleared
  on commit).

  Backing state: `piPressCount` (consecutive-press counter, reset on commit AND on any non-π
  action) plus `piCalcTimer`. The timer has a defensive guard that refuses to overwrite the
  display if state has somehow changed — belt-and-suspenders alongside the input gate. The
  commit itself resets the counter, enforcing the "true double-press" rule: once `22/7` is on
  screen, the next `π` press starts a fresh chain.
- **`log` is base-10** (`Math.log(x)/Math.LN10`), labelled `log` as on a classic calculator.
- **The device corrects your *correct* numbers — the polite-prude family extended.**
  The wrong-constants entries above describe how the device's `π`, `√2`, and `e` keys produce
  rational approximations. This entry is the *mirror image*: when the user manually enters one
  of the three real constants — to the longest precision the 8-digit input cap allows — the
  device launches its `Calculating...` routine and commits its own wrong value. Three
  correction rules:

  | What the user typed (real value, truncated to 8 digits) | What the device "calculates" to |
  |---|---|
  | `3.1415926` (real π to 7 decimals) | `3.142857143` (its 22/7) |
  | `1.4142135` (real √2 to 7 decimals) | `1.414285714` (its 99/70) |
  | `2.7182818` (real e to 7 decimals) | `2.714285714` (its 19/7) |

  Negative forms (`-3.1415926` etc.) correct identically, sign preserved. The user's last
  keystroke triggers the same ~1-second `Calculating...` beat that pressing the `π` key uses,
  and the corrected number appears when it commits. **The slow beat is the clue.** A
  mathematically-aware user who notices the consistent timing across `π`-key, `2, √`, and
  typed-real-constant paths starts to suspect the device has *specific* ideas about those
  specific numbers. The delay isn't disguise — it's pattern recognition for the patient.

  **`2, √` also goes through `Calculating...` for consistency.** Originally `√2` returned its
  99/70 instantly; now it fires the same slow routine as the typed-constant correction. Any
  production of a wrong constant takes the same beat, regardless of *how* the user arrived at
  it. Three independent paths (`π` key, `2, √`, typed real value) — one shared timing
  signature. Other `√` inputs (`√3`, `√4`, `√5`, ...) remain instant; the slow beat is reserved
  for the device's three textbook-table specials.

  **The whole conceit lives in the gap between cap and display.** The input is capped at 8
  digits (cheap calc), but the device's wrong constants display at 10 digits via the
  Calculating commit. So the user is **doubly wrong-helped**: first the cap denies them the
  precision they were reaching for, then the correction adds extra digits they didn't ask for.
  They typed too few decimals AND too many simultaneously, in the device's opinion. Sirius
  Cybernetics shipped a firmware that genuinely believes its rational approximations are the
  authoritative values and accurate decimals are typing noise; "correction" here is not
  censorship, it's *the firmware fixing what it perceives as user error*. Same family as the
  polite refusal of `80085` (rendered as the full `B00BIES` rather than the cruder
  abbreviation): the device is too well-bred to accept the input as given.

  **During the Calculating, the device refuses input.** The dispatchers gate on `calcKind`: when
  it's `"constant"` (the typed-correction or `√2` paths), *no* keys register, including `π`.
  When it's `"pi"` (the `π`-key path), only `π` is allowed through (for the double-press
  toggle). The two gating modes share a single mechanism but differ by exception: π-Calculating
  is permeable to π; constant-Calculating is totally sealed. The device is busy computing
  whichever wrong value it has decided you wanted, and will not be distracted.

  **Strict equality only.** Typing `3.1415` (incomplete) does nothing; only the full 8-digit
  truncation fires. The user must be *demonstrably trying* to type real-π before the device
  asserts. Anything shorter is ambiguous (could be any number), and the device, while
  opinionated, is not paranoid. Three-member correction family (π, √2, e) directly mirrors the
  three-member total wrong-constants family in the entries above (two surface + one hidden via
  π double-press). The constants are the device being wrong *quietly*; the correction is the
  device being wrong *assertively*; the Calculating wrapper turns the assertion into a *clue*.
  Implemented as `correctIfRealConstant()` (returns boolean) called at the end of every
  disp-mutating branch of `inputDigit()`, delegating to the shared `slowCalcConstant()` helper
  which also serves the `√2` path.

- **The 0 Kelvin gate — Calibration mode via misguided helpfulness.** The device works in
  degrees Celsius (the `DEG` annunciator is on at all times). Absolute zero — 0 Kelvin — is
  `-273.15°C`. So the conceptual gesture "divide by 0 Kelvin" is mathematically `divide by
  -273.15` in the device's units. *Not* divide by zero. The joke is that the user is
  *thinking* divide-by-zero (a real boundary condition), the device is *seeing* a perfectly
  ordinary division, and the device's helpful attempt to compute it sends the firmware over
  the edge anyway.

  **Trigger.** A division involving 0 and -273.15 in either direction:
  - `0 ÷ -273.15 =` — mathematically 0 (perfectly valid). The device "divided by zero"
    despite the divisor not being zero (in Celsius); it's now in an impossible state by its
    own logic.
  - `-273.15 ÷ 0 =` — mathematically -∞. The real division-by-zero, with the operand being
    absolute zero. Normally produces VOID; the gate intercepts before the VOID check.

  Either direction fires the same response. Detection happens at the top of `doBinary()`
  (before `isFinite`, before the lucid bypass, before `6×9`) so the gate has priority over
  every other special path.

  **Response: CALIBRATION mode.** The LCD scrolls the device's service-notice reading:

  > `Division by absolute zero: Calibration overdue · SIRIUS CYBERNETICS CORPORATION ·
  > RETURN UNIT TO COMPLAINTS DEPARTMENT OFFICES ON EADRAX (IF EXTANT) · IF UNREACHABLE
  > EATING THE DEVICE REMAIN A VALID OPTION`

  Then settles on `CAL.`. The opener names the diagnostic explicitly — "Division by
  absolute zero" — so the user (if they read it) learns exactly what they did. The body
  is Sirius Cybernetics officialese, with a direct Adams nod: the user is directed to
  return the unit to the corporation's **Complaints Department offices** (in Hitchhiker
  canon, the Complaints Department exists specifically to ignore complaints — routing
  the user there for a *broken device* is the most archetypal Sirius-Cybernetics move
  possible). The offices are on the planet **Eadrax**. The "**(IF EXTANT)**"
  parenthetical is the device politely acknowledging that the Complaints Department may
  no longer exist — galactic real estate being what it is — which in turn is why the
  warranty's third callback (eat the device) reads as the realistic fallback rather
  than absurd advice.

  **Background lore (not stated on-device).** The Complaints Department is the only
  profitable division of Sirius Cybernetics Corporation. The corporation makes such
  terrible products that the only arm turning a profit is the one processing the endless
  complaints about them — a perfect Adams catch-22. The Calibration reading doesn't
  *say* this; it just *routes the user there*. The reader of this document knows why
  that routing is funny; the device's user only knows they've been directed to file a
  complaint about a calculator that broke trying to do absolute-zero math.

  **The closing line is the device's THIRD warranty callback.** The booklet's *"Do not eat
  the device even if it advise so"* is now load-bearing across:
  - The consult-side **EAT-THE-DEVICE reading** (LESSER SOUP + line 6, §4)
  - The calc-side **`π + π = PIE`** path (§1)
  - The Calibration **service-mode closing line** (this entry)

  Three independent paths to the same booklet line. The device's own maintenance manual
  casually listing ingestion as an alternative to professional servicing is the most
  Sirius-Cybernetics line in the whole device: a corporation that ships eat-yourself as a
  documented fallback.

  **Why "Calibration via misguided helpfulness" is the right framing.** A real device would
  refuse to process absolute zero (range error, domain violation). The Oraculon, in
  keeping with the design principle (sincerely failing to help), *attempts* the math anyway
  — and the attempt destabilises it. Calibration is the recovery routine. The gate isn't a
  mode switch; it's a *consequence*. The user broke the device with a perfectly innocent
  arithmetic gesture, and the device responds with a bureaucratic service notice it
  shouldn't have firmware for. (See IDEAS for the original framing: this was the "simpler"
  of two paths to Calibration; the more convoluted Bambelweeny path involving Dirk's tea
  temperature was considered and dropped — one gate is enough.)

  Implementation: `fireCalibration()` adjacent to `fireBatteryLow()` in the source (both
  are end-of-pretend-system routines). Uses the same `marchReading` scroller as the
  consult flow. The `√2` Calculating, the BATTERY LOW fade, and the Calibration scroll all
  borrow from the device's existing visual vocabulary — the device knows how to do these
  things because it knows how to do consults; the only difference is what triggers them.

---

## 4. The Oracle — the blue button marked "Red"

A second, completely separate machine sharing the same screen.

- **The blue button marked "Red."** Straight from the book: *"There wasn't a red button, but there
  was a blue button marked 'Red', and this Dirk took to be the one."* The full-width oracle bar
  (`button.iching`) is therefore **blue** and reads **`易 Red`** — even though the manual tells you to
  "push the red button." The genuinely-red keys (`C`, `⌫`) make the gag sharper: there *are* red
  buttons, just not *the* red button. (The internal action is still `data-act="iching"`.)
- **A 64-hexagram device that occasionally overshoots.** The model name (CT-**64**) and the manual
  both claim 64 hexagrams — what a normal I Ching device has. But the cast mechanism rolls **seven**
  lines internally (`for i=0..6`), producing `bits` in **0–127**. A gate (see below) forces most casts
  to stay in 1–64. Once every ~14 casts, the result lands in the 65–128 **"overflow"** range and the
  device produces an impossible 7-line "hexagram" with a visibly broken extra line on top. The framing
  is **malfunction, not feature** — the device exceeding its own spec, not advertising a capability.
  The manual stays silent (it claims 64); the confession is purely visual (see "the crooked 7th line"
  below). Changing-line numbers run **1–7** in the source — line 7 only surfaces in overflow casts.

- **Bit ordering ties overflow to the top line.** `bits |= (L.yang?1:0) << i` puts `lines[0]`
  (bottom, "line 1") at the LSB and `lines[6]` (top, "line 7") at the MSB. So `bits >= 64` iff the
  top line is yang — meaning the overflow is always *the bonus top line being yang*, not some hidden
  middle bit. The gag is tied directly to the visible extra line that shouldn't be there.

- **A real(ish) cast, deterministically mapped.** `rollLine()` simulates the three-coin method:
  three flips of yin(2)/yang(3) sum to 6/7/8/9 → old-yin (changing), yang, yin, old-yang (changing).
  The seven lines form an index into **`HEXAGRAMS[bits]`**, so the *same roll always yields the same
  hexagram* — exactly like the real device. The gate's re-roll (below) preserves this property: the
  final accepted roll is the cast. A clean data table for the eventual hardware port.

- **The gate — "no glitch should be that perfect."** `gateCounter` keeps the first 6 casts of every
  cycle forced into 1–64 (re-rolled until they land there — invisible to the user, since only the
  FINAL roll is the cast). The 7th cast of each cycle is a natural 50/50. Counter then resets and
  the cycle repeats. Result: glitches happen ~7% of the time, **never two in a row**, with a
  guaranteed minimum gap of 6 normal casts between any two. Six was chosen for the "hex" — one
  stable cast per canonical hexagram line.

- **The hidden escape — `%` directly before `Red`.** Pressing `%` immediately before the oracle
  button bypasses the gate for one cast (natural 50/50 roll, all 128 hexagrams reachable). Any
  intervening key (digits, other ops, `=`, `C`) clears the arm via `escapeArmed = false`. The escape
  is **undocumented in the manual** — pure experimental discovery. Compounds the `%` key's hidden
  roles: **modulo** as an operator (see §2), **bypass** as a modifier — two undocumented behaviours
  on one key. The escape cast does NOT advance `gateCounter`; the bypass is out-of-band, so users
  can use it liberally without disrupting the gated rhythm.

- **The hexagram graphic.** During every consult, a small hexagram is drawn on the LEFT of the LCD:
  6 lines (or 7, for overflow casts) appear **bottom-up** at 160ms intervals — the traditional
  I Ching cast order. A small `No.N` label sits below in VT323. The hex slot ALWAYS reserves a 7-line
  height (33px) so the label position stays constant between normal and overflow casts. The graphic
  is positioned absolutely; `clip-path: inset(0 0 0 40px)` on the readout (`.lcd .out.ticker` and
  `.lcd.has-hex .out.phrase`) keeps both the marquee scroll AND the settled phrase from overrunning
  the hex. The graphic clears on any non-consult key (`hideHex()`).

- **The reading waits for the cast.** `renderHexagram()` takes an `onComplete` callback that fires
  only after the stack is fully drawn: **~1.2s** for normal casts (6 lines × 160ms + breath),
  **~2.5s** for overflow casts (the additional 1.2s LCD panic + 7th-line reveal). The marquee text
  only then starts scrolling. The reading isn't "read" until the device has finished pretending to
  cast it.

- **"Calculating..." appears on the LCD during the cast** (the right side, while the hex graphic
  draws on the left and the LEDs sweep). Faithful to the book — the I Ching calculator famously
  announces its thinking on the tiny LCD. Picked from the `CALC_PHRASES` pool — **deliberately
  a pool of one**. Marvin-style impressions and mock-mainframe boot messages were considered and
  rejected as too parodic: the device should *be* in Adams' universe (Sirius Cybernetics product,
  quiet book-faithful "Calculating..."), not *perform* it (Marvin impressions, fan-service boot
  text). The pool structure remains for symmetry with the other named pools (`ORACLES`, `Q42`,
  `NAMED_NUMBERS`), but the single entry is the design endpoint. Set directly via
  `outEl.textContent` (NOT `showPhrase`) so the device's `settled` state stays unaffected and a
  keypress can interrupt the cast cleanly. Replaced by the marquee when `renderHexagram()`
  completes.

- **The crooked 7th line — the device's visible confession.** When an overflow cast lands, after
  line 6 fades in there's a brief pause, then the LCD enters `.glitch` mode: 1.2s of scanline-y
  vertical jitter (`@keyframes lcdPanic` — a scanline overlay alternates opacity 0–0.85 with
  `translateY` drift). As the panic ends, the 7th line fades into its slot at the top with `.deluxe`
  styling: rotated **−3.5°** (crooked), translated **+1px** (off-grid), animated by `@keyframes
  lcdStruggle` (4.3s infinite, opacity oscillating between **0.08 and 0.70** with occasional CSS
  `blur` — like a finger pressed into the LCD where this line shouldn't exist). Three independent
  flaws compound — **crooked + faint + irregular blink** — making the line a visible confession that
  the device shouldn't be drawing it at all. The other 6 lines stay rock-solid for contrast.
  **Pairs with the soup LED** (§6) as the device's second "barely-managing" element: same posture
  (an element only just performing its assigned job), applied to a different component.

- **`HEXAGRAMS[101]` is the line-7 narrative companion.** When a 7th-line overflow happens to land
  on `bits=101` (hexagram **102**), the marquee scrolls *"易 No.102 THE UNINVITED SEVENTH"* with
  the judgement *"LINE SEVEN ARRIVE WITHOUT INVITATION. THE OUTCOME WILL END POORLY. THIS IS NOT
  UNUSUAL."* The visible glitch and the hexagram text are **mechanically self-referential**: the
  device's broken extra line is named, acknowledged, and fatalistically predicted within the
  reading the device delivers. Rare (one specific cast among 64 overflow possibilities, so ~0.5%
  of all gated casts) but lands hardest of all the meta-self-aware overflow entries when it does
  — the device finally describing in words exactly what the user is watching it do.

- **The whole reading SCROLLS across the LCD — there is no printout.** Faithful to the book
  (*"the I Ching calculator then scrolled this text across its tiny LCD display"*), `consult()`
  composes the entire reading into one line and `marchReading()` runs it as a single right-to-left
  marquee (`.out.ticker` / `@keyframes march`). It is **unhurried on purpose** (duration scales with
  length, `text.length*0.08`s) — you have to watch the tiny screen, and if you miss it you consult
  again. When it finishes, the LCD **settles on the cast hexagram** (`易 No.N  NAME`) — still
  alongside the hex graphic on the left, clipped clear. The earlier roll-out/tear-off paper receipt
  is gone (preserved in `i-ching-calculator - printout.html`).
- **The scrolled reading wears the book's robes (hybrid: fixed + random).** Composed in order:
  - **`易 No.N  NAME`** + **`※ IN MOTION`** / **`· AT REST`** — the named, numbered hexagram. Both
    come from `HEXAGRAMS[bits]` (`n` = garbled name, `j` = signature judgement); the number is a
    fake `bits + 1` (**not** King Wen order — *"a cheap model"*). The table has all 128 entries
    (1–64 reachable often, 65–128 reachable only via overflow + gate-release or the `%` escape):
    *"THE DAMP GOOSE," "SMALL TAMING OF THE BISCUIT," "A SUFFUSION OF BEIGE," "THE DELUXE HEXAGRAM."*
  - **`THE JUDGEMENT OF KING WEN:`** — the hexagram's **fixed signature line** (`hx.j`), then **one
    random `ADVICE`** line (25, each prefixed `ADVISE:`). Core judgement tied to the cast; advice
    keeps repeats fresh. (Many `j` lines are the old `OPENERS`/`MIDDLES`, rehoused so nothing was lost.)
  - **`LINE n CHANGES:`** → **`THE COMMENTARY OF THE DUKE OF CHOU:`** → a pick from **`CHGNOTES`**
    (16) — only when a line moves. Changing lines are **named by number** (1 = bottom, 7 = top);
    multiples read **`LINES 2 & 5 CHANGE:`**. If nothing changes, the fixed **`STILL`** line shows.
  - **The footer** always certifies itself with a randomised accuracy figure: **"READING
    CERTIFIED *N*% ACCURATE · 易經計算機 CT-64 · NO REFUND."** *N* is a uniform random integer
    `11–71` per reading — bounds chosen to avoid the comedy extremes (above 71 the device would
    be bragging; below 11 it would be admitting parody-level uselessness). Each reading gets a
    different specific-but-arbitrary corporate-certification percentage, which is the joke: the
    number sounds precise, looks measured, and is in fact pulled from nowhere.
- **The HEXAGRAMS array doesn't even pretend to follow King Wen ordering.** Classical I Ching
  has a canonical sequence (King Wen order) that every actual hexagram book uses; the device
  blithely indexes its 128 entries by the *raw bit pattern of the cast* (`bits = 0..127`,
  `lines[0]` = LSB). So `HEXAGRAMS[26]` is the device's "hexagram 27" but bears no relationship
  to the I Ching's hex 27 (頤 Yi / Nourishment) — it's whatever made-up name and judgement got
  slotted at array position 26 (in this case **"THE DEPARTING GEESE"**). The device's actual
  nourishment hex is `HEXAGRAMS[4]` ("LESSER SOUP"), purely because cast pattern 4 happens to
  match the made-up SOUP entry there. A code comment in `consult()` shrugs about this — *"1..128
  (not King Wen order — a cheap model)."* This is Sirius Cybernetics in archetypal form: a calc
  shipped with **"I·CHING"** silkscreened on the LCD, a 64-page manual on consultation, and a
  hexagram lookup table that doesn't bother with the one piece of I Ching anyone might verify.
  Even the cardinal scholarly conceit — the sequence itself — was cost-cut. The joke runs both
  ways: anyone who knows the I Ching spots the missing convention in three minutes; anyone who
  doesn't never notices and treats the device's invented sequence as authoritative. Both
  readings are correct. (The implementation also means: when implementing the rare
  EAT-THE-DEVICE reading below, the trigger had to be re-anchored to the device's own
  soup-themed nourishment hex, since the King Wen alignment doesn't exist to anchor to.)
- **The EAT-THE-DEVICE reading — the warranty's load-bearing line was always going to fire.**
  The booklet (§5) carries a deceptively casual line in the warranty: *"Do not eat the device
  even if it advise so."* Most owners file it under broken-English colour. But the device does,
  in fact, occasionally advise so — once in roughly **1 in 1000 consults**, via a vanishingly
  rare conjunction: the cast must land on **LESSER SOUP** (`bits = 4`, the device's nourishment
  hexagram, see entry above) AND exactly one line must change, AND that line must be **line 6**
  (the top of the 6-line hex — "nourishment from above"). When all three conditions align, the
  standard reading is *replaced entirely* with:
  > *易 No.5 LESSER SOUP · ※ IN MOTION · THE JUDGEMENT OF KING WEN: · THE MOUTH HAS SPOKEN.
  > NOURISHMENT IS REQUIRE. · EAT THE DEVICE. · LINE 6 CHANGES: · THE COMMENTARY OF THE DUKE
  > OF CHOU: · THE WARRANTY DOES NOT COVER THIS. THE WARRANTY DID WARN YOU.*

  The accuracy footer still appends after, completing the format. The whole reading is wired so
  the device isn't being random — it's giving the answer the *cast itself* demands: the
  nourishment hexagram, the top line moving, the source of food coming from above. The device,
  taking its own logic literally, suggests the only food within reach. The warranty callback in
  the closing commentary line is the keystone — the booklet was *waiting* for this to fire.
  Triggers via the standard consult flow (no special gate involvement); blocked from forced-
  normal repeats only insofar as line-6-alone is itself a ~6% event per cast. Vanishingly few
  owners will ever see it; the few who do can confirm they were warned, in writing, on page
  one of the manual.
- **The LEDs: a brief "doing something," then a misfire at exactly the wrong time.** At the **very
  start** of a consult the bar runs a quick Larson scan (`ledFor("cast")`) so it's clearly *casting
  the lines* — then it goes dark while the reading scrolls, and `marchReading` schedules a celebratory
  burst (`ledFor("consult")` — fill + random twinkle) to fire **partway through** (a random 32–70% in,
  via `ledMistimer`), so the lights party right over the grave bit. Pressing `C`/`Esc` (`endOracle()`)
  cancels both the scroll and the pending burst.
- **Recurring motifs** running through all the text banks: **soup, spoons, geese (especially "the
  third goose"), Tuesday, bicycles/buses, batteries, yellow, and doors that are actually push.**

---

## 5. Hidden Copy — The Instruction Booklet

Click **▸ READ INSTRUCTION BOOKLET ◂** to open the manual modal. It's written in deliberately
broken machine-translation English and is **deliberately unhelpful** — it gives away *none* of the
mechanics (no Rule of 4, no "which sums work" examples, no ceiling). The intent is **enigma + gibberish,
the rest left to exploration**; the one section that would explain anything is conveniently missing.

- **Header:** *"CONGRATULATION FOR YOUR PURCHASE OF FINE DEVICE."*
- Calls itself an **"electronic abacus of fortune"** that reckons sums, performs science, and foretells
  *"across 64 hexagram"* — the **canonical** number, what the device is supposed to be. The 65–128
  overflow range is **not advertised**, because the manual considers those casts malfunctions, not
  features. The device's own confession (the crooked 7th line) is therefore purely between the
  device and the user — the booklet doesn't acknowledge it can happen.
- **Enigmatic, not explanatory:** *"press what you wish; receive what you receive. Should the answer
  arrive instead as a colour, a mood, or a quantity of soup — this is not error, this is the device
  thinking. WHY it think so is explain upon the page that are missing (see below)."* — names the
  symptom (colour/mood/soup) without ever revealing the trigger.
- **The consult ritual:** concentrate **"SOULFULLY"** on the question that **"besiege"** you,
  **"enjoy the silence,"** and on reaching **"inner harmony"** press **the RED button** — earnestly so,
  even though the only such button is the *blue* one marked "Red."
- **"Translated… by way of the Japanese."** The manual blames the garbled readings on translation
  *"from the Chinese by way of the Japanese,"* having *"enjoy many adventure on the road; any
  strangeness is therefore not error but TRAVEL"* — the in-universe excuse for the broken voice.
- **The missing-pages gag** — a dashed warning box:
  **"⚠ PAGE 4–11 MISSING ⚠ (HOW TO INTERPRET THE ANSWER) · APOLOGISE FOR INCONVENIENCE ·"** — and now
  it does double duty: the section that *would* explain the device's behaviour is the one that's gone,
  so the Rule of 4 stays a thing you discover.
- **The warranty:** *"Device guarantee against everything except disappointment, water, fate, and
  the colour yellow. Battery not include. Future not include. Do not eat the device even if it
  advise so."*
- **The close button:** **"CLOSE BOOKLET (FATE IS SEALED)."**

---

## 6. Visual / Aesthetic Easter Eggs

- **Brand name "ORACULON"** as a heavy industrial wordmark — Arial Black italic 900 at 20px,
  near-black `#1a1a1a`, slight negative letter-spacing, white drop-shadow simulating engraving.
  The central **O** is picked out in gold (`var(--gold)` via `<b>` tag) — the classic calculator-
  brand parody, *now visible* against the black wordmark. The 易 glyph to the left sits in its own
  `<span class="cj">` in CJK serif (`Hiragino Mincho ProN`, `Songti SC`, `Noto Serif CJK SC`) at
  weight 900, deep red `#6e1810`, 1.15em — a coloured seal mark beside the industrial wordmark, the
  two-piece composition real product brands use. Line-height is locked at 1 to keep the brand area
  compact (the LED bar sits right below — without the locked line-height, italic-900's leading would
  push everything down by ~10px and the sticker would stop overlapping the LEDs). The whole
  wordmark went through three iterations earlier (Silkscreen pixel → too 8-bit-game; Helvetica-900
  → silently downgrades to Bold on most systems; Arial Black 28px → broke the brand-plate layout).
  The final Arial Black at 20px italic 900 fits the plate, renders heavy on every system, and
  reads as *"real product, printed on a cheap calculator."*
- **Model plate:** *CT-64 SCIENTIFIC / 易經計算機 / **MADE ON SIRIUS***. (易經計算機 = "I Ching
  Calculator"; the CT-**64** nods to the 64 hexagrams; **MADE ON SIRIUS** carries *two*
  compounded layers of corporate incompetence — Sirius is a star, so making anything *on* it is
  physically impossible, AND the preposition is wrong ("on" applies to planets, not stars). The
  Sirius Cybernetics labelling team didn't think it through. Pairs with the "Designed by the
  Sirius Cybernetics" credit line below the wordmark — the manufacturer is named both above and
  below the LCD.)
- **"Designed by the Sirius Cybernetics" credit line** sits below the ORACULON wordmark in 7px
  Silkscreen at ~72% opacity, absolutely positioned (`top: 38px`) **so the £20 sticker partially
  covers it** — the manufacturer credit half-obscured by the previous owner's price tag, exactly
  how second-hand things look. The full Adams reference is *Sirius Cybernetics Corporation*
  (HHGTTG) — Adams' fictional company famous for products that almost work, including Marvin the
  Paranoid Android, the elevators that pre-meditate, and the cruelly-cheerful customer service
  doors. Sirius Cybernetics is the **in-universe explanation for every defining wrongness** of
  the Oraculon: the committee-grade keypad layout, the broken-English manual, the deluxe-128
  overshoot, the barely-managing LED indicator, the crooked 7th line, the percentage key that's
  actually modulo. They all trace to the same fictional manufacturer. Absolute positioning means
  the credit doesn't push the LED strip down (preserving the sticker-over-LEDs overlap);
  `pointer-events: none` so it never blocks a button.
- **A "solar strip" that's secretly a green-LED bar** — what looks like the non-functional solar
  cells of a cheap calculator is actually a recessed row of 18 nostalgic green LEDs. They **rest dark
  and animate only on activity**, each kind of action getting its own **classic blinkenlights**
  signature (`ledFor`): a **chase** on digits, a **Larson scanner** (Knight Rider sweep) on operators,
  a longer sweep on `=`, an all-**blink** on clear, and — when you consult the oracle — a **fill that
  builds up, then a random twinkle** sparkle. Brightness drives a CSS glow per LED; one animation
  plays then the strip returns to dark. `prefers-reduced-motion` leaves a gentle static glow and skips
  the animation. (`aria-hidden` — purely decorative.) Each LED also gets a **fixed random brightness
  gain** (`ledGain`, ~0.7–1.0) at startup, so the bar is a row of slightly-mismatched cheap LEDs that
  never quite agree on how bright "on" is.
- **A barely-working error light.** While **"Cannot Operate on Soup"** is on the screen (`soupBlink`),
  the **3rd-from-last LED** blinks on its own — irregularly, like an error indicator that's only just
  managing it: mostly short pauses (1–5s) with the occasional long sulk (up to 20s), the rest of the
  bar dark. Any deliberate action (or `C`) stops it.
- **The silkscreen LED legend — keystone of the "failed status system" gag.** Beneath the LED bar
  sits a tiny line of faded Silkscreen text: **`POWER · BUSY · ERR`**. Three generic 1980s indicator
  labels — documentary evidence that someone at Sirius Cybernetics *meant* the LED bar to convey
  consistent status, designed a legend for it, then never quite finished the job. The labels are:
  - **Faded** (`opacity: 0.58`) — worn by years of thumbs
  - **Incomplete** — only 3 labels for 18 LEDs; the rest of the bar has no labels at all (the design
    was abandoned mid-job, not just worn away)
  - **Off by exactly one LED** — the `ERR` label sits over the SECOND-to-last LED (position 17),
    while the actual **soup ERR LED** is the THIRD-to-last (position 16). One LED width of
    misalignment, deliberately positioned. A user who triggers the soup state (oracle phrase →
    press any operator → soup LED twitches at position 16) and *then* looks at the legend below
    realises the `ERR` label is over the wrong LED. The "failed status system" framing crystallises
    in that one off-by-one discovery: the design specified labels, the labels were applied, the
    *alignment was wrong*. Sirius Cybernetics knew where the labels went; they just didn't know
    where the LEDs were. Pairs with the "LED STATUS GUIDE" mention in the manual (on a missing
    page, of course): the device *does* have documentation, you just can't read it, and even if you
    could it wouldn't match what's in front of you.
- **A strip of aging Sellotape** (`.tape`) lying **over the top-right corner** of the case — the
  book's *"the back had half fallen off and needed to be stuck back on with Sellotape."* A shiny,
  translucent yellowed strip with edge highlights and a diagonal glare; the case has `overflow:hidden`,
  so it's **clipped at the rounded silhouette** (it goes over the corner rather than floating in the
  background). `pointer-events:none` so it never blocks a button.
- **Sickly-green LCD** with a glass-sheen overlay and a faint desk-grain SVG-noise texture behind the
  whole device. The oracle's whole reading **scrolls across this screen** (no printout — see §4).
- **The open manual is rotated slightly** (`transform: rotate(-.4deg)`) so it looks like a real
  booklet tossed on a desk.
- **Retro pixel fonts:** Silkscreen (labels), VT323 (LCD), Special Elite (typewriter body text).
- **Committee-grade keypad layout.** Nothing is unusable; nothing quite makes sense. The **`%` key
  crashed the command row** (next to `C` and `⌫`) where `÷` used to live; the operator column starts
  late so **only `÷` sits at the top** and the rest (`×`, `−`, `+`) shifted down a row each; the
  oracle button is now **only 3 cells wide** (down from full width) and shares its row with the
  tall `=` button. No individual choice is obviously wrong, and the overall layout is still subtly
  off in a way no buyer would notice but every owner would feel. A calculator designed in a single
  afternoon by people who had stopped caring.

---

## 7. Keyboard Easter Eggs / Shortcuts

The whole device is keyboard-drivable (`keydown` handler):

- `0–9` and `.` → digits; `+ - * /` → operators; **`x` or `X` also maps to ×**.
- `Enter` or `=` → equals; `Backspace` → delete; `Esc`, `c`, or `C` → clear (also closes the reading).
- **`?`, `i`, or `I` → consult the oracle** (press the blue "Red" button without the mouse).
- **`%` → modulo operator** (Shift+5; the only operator that requires a modifier — fitting for the
  one that can sneak past the Rule of 4; see §2).
- **`%` directly followed by `?` / `i` / `I` → gate-bypass cast** (see §4 "The hidden escape"). Any
  intervening key (digit, other operator, `=`, `Backspace`, `Esc`/`C`) clears the arm. The escape
  arms in `keydown` and is consumed in `consult()` — works identically to the click-handler path,
  and works across input modes (e.g. click `%` button then press `?` key).

---

## 8. Cultural References, Summarised

| Reference | Where |
|---|---|
| *The Long Dark Tea-Time of the Soul* "A Suffusion of Yellow" calculator (Douglas Adams) | The Rule of 4; `ORACLES[0]` |
| **"A blue button marked 'Red'"** | The blue `易 Red` oracle bar (`button.iching`) |
| **King Wen's judgement** of the hexagram | `THE JUDGEMENT OF KING WEN:` block in `consult()` |
| **The Duke of Chou's** line commentary | `THE COMMENTARY OF THE DUKE OF CHOU:` + `LINE n CHANGES` |
| Hexagram shown as **"N : NAME"** (e.g. "3 : CHUN"), each with its own judgement | `HEXAGRAMS[bits]` (`{n, j}`) |
| Text **"scrolled across its tiny LCD display"** | `marchAcross()` / `@keyframes march` |
| The **64 hexagrams** of the I Ching | Model name **CT-64**; booklet claims 64; default cast range |
| The **overflow 65–128** (the device exceeding its own spec — a glitch, not a feature) | `for i=0..6`, `bits` 0–127; rendered with the crooked 7th line + LCD panic |
| The **gate** keeping overflow rare (~7%, never two in a row) | `gateCounter`, re-roll in `consult()` |
| The **hidden escape** (`%` immediately before `Red` bypasses the gate) | `escapeArmed` in both dispatchers, consumed in `consult()` |
| The **hexagram graphic** drawn bottom-up on the LCD during a consult | `.lcd .hex`, `renderHexagram()` |
| The **42 lucid bypass** — Rule of 4 fails when previous hidden result was 42 (Adams) | `lastHiddenResult` check in `doBinary()` / `unary()` |
| The **three-coin divination method** | `rollLine()` |
| **King Wen sequence** (and the joke of *not* using it) | Code comment in `consult()` |
| **Sellotaped-on back** ("the back had half fallen off") | `.tape` over the top-right corner |
| Manual ritual: **soulful / besieging / "push the red button"** | Booklet consult paragraph |
| Readings **"translated… by way of the Japanese"** | Booklet "any strangeness is not error but TRAVEL" |
| Dirk **pushes the button without waiting for harmony** | Booklet "press the button anyway" parenthetical |
| Cheap-calculator tropes (fake solar cell, "DEG", broken-English manual, missing warranty pages) | Throughout the UI and manual |
| **Sirius Cybernetics Corporation** (Adams' fictional company; Marvin's makers) | "Designed by the Sirius Cybernetics" credit line below the wordmark (partially covered by £20 sticker) AND the model plate's "MADE ON SIRIUS" line — manufacturer named both above and below the LCD |
| **"Calculating..." displayed on the I Ching calculator's LCD** (the book) | `CALC_PHRASES` pool, shown on the LCD during the cast (right side, while hex graphic draws on the left) |
| **`THE UNINVITED SEVENTH`** — the device's own commentary on the 7-line glitch | `HEXAGRAMS[101]`; rendered as hexagram 102's name + judgement when that specific overflow cast lands |

---

## 9. Buried Douglas Adams nods (rephrased — never verbatim)

A faint sprinkle of *Hitchhiker's* / *Dirk Gently* DNA, reworked into the device's broken, ALL-CAPS
voice so they read as the machine's own nonsense and reward a fan who looks twice. **If you edit
the rephrased entries, keep them rephrased — never restore the verbatim quotes.** The **verbatim
Adams canon** entries (`ORACLES[0]` *"A Suffusion of Yellow"*, `ORACLES[1]` *"The Number of Pebbles
in Wales"*, and all four `Q42` entries) are exceptions: they're the source material the device
**explicitly invokes**, kept unaltered because that's the point — the device IS the Adams calculator,
and these phrases ARE its defining utterances. Current nods:

| Where (search the source) | Echoes |
|---|---|
| `NEARLY A DUCK` → *"ONE IS NEVER TRULY ALONE WHO POSSESS A RUBBER DUCK."* | "One is never alone with a rubber duck." |
| `THE LONG PAUSE` → *"NOTHING HAPPEN. SHORTLY, NOTHING CONTINUE TO HAPPEN."* | "…nothing happened. Then…nothing continued to happen." |
| `GENTLE CONFUSION` → *"WHEN NO GOOD ANSWER EXIST, THE CAPITAL LETTER WILL SERVE."* | "Capital Letters Were Always The Best Way…" (and the device *is* all caps) |
| `THE WANDERING SANDWICH` → *"YOU GO NOT WHERE YOU INTEND, YET ARRIVE WHERE YOU WAS NEEDED."* | "I may not have gone where I intended…but…where I needed to be." |
| `ADVICE`: *"IN LARGE FRIENDLY LETTERS — DO NOT BE ALARMED."* | "Don't Panic" (the Guide's cover) |
| `ADVICE`: *"JUDGE ALL ADVICE BY THE LIFE OF THE ONE WHO GIVE IT…"* | "The quality of any advice…judged against the quality of life they lead." |
| `ADVICE`: *"PROCURE A STRONG DRINK AND, IDEALLY, A PEER GROUP."* | "What I need…is a strong drink and a peer group." |
| `ORACLES`: *"Reality, Frequently Approximate"* | "Reality is frequently inaccurate." |
| `ORACLES`: *"The Approximate Speed of Bad News"* | "…bad news, which obeys its own special laws." |
| `ORACLES`: *"Almost, but Not Quite, Entirely Unlike Wednesday"* | "Almost, but not quite, entirely unlike tea." (HHGTTG) |
| **`Q42` pool (verbatim, all 4 entries)** | The Adams Question-canon for the Answer 42: Dylan-as-Question (HHGTTG), the *6×9* base-13 joke (Mostly Harmless), "What Is The Ultimate Question?" (meta), and "Life, the Universe, and Everything" (the canonical subject). Verbatim because they're the device's defining Question utterances, mechanically paired with the lucid bypass. |
| **`6 × 9 =` displays "Forty-two"** (and arms the lucid trigger, and flips DEG → B13) | Adams' base-13 joke — `6 × 9 = 42` in base 13, the implicit Ultimate Question. The Oraculon computes in base 10 (gets 54) but *speaks* in base 13 (says "Forty-two"), *commits* to it mechanically (arms the lucid as if hidden were 42), AND *flips the DEG annunciator to B13* for the duration of the "Forty-two" display — a three-way confession (speech + state + status indicator) that the device is now in base 13. Next user action restores DEG. **Bonus accidental coincidence**: the device's max display width is exactly **13 characters** (see §2) — the same base. The screen size unintentionally encodes the Adams reference. The medium nods at the message. |
| **`NAMED_NUMBERS[5760003]`**: *"The Total Number of Irritated People"* | HHGTTG — the population of the planet Brontitall, who became furious all at once. Reached by typing the number directly (`5760003 + 0 =`) or any path producing exactly 5,760,003. |
| **Key sequence `10` then `%`**: *"The Holistic Detective Agency Fee"* | Dirk Gently's Holistic Detective Agency (Dirk Gently #1) — Dirk's absurd invoice fees, "10%" as the rate. The **first Dirk Gently nod outside the device's foundational premise** (the device is itself a Dirk Gently artefact, but this is the first explicit reference to the novel's contents). |
| **"Designed by the Sirius Cybernetics" credit line** (verbatim, partially covered by £20 sticker) **AND model plate's "MADE ON SIRIUS"** | Sirius Cybernetics Corporation (HHGTTG) — Adams' fictional company that built Marvin, the elevators, the cruelly-cheerful doors. Both labels name the in-universe manufacturer of *every* defining wrongness on the Oraculon (committee keypad, broken manual, 7-line overshoot, soup LED, % weirdness, etc.). "MADE ON SIRIUS" compounds two errors: Sirius is a *star* (so making anything *on* it is physically impossible), and "on" is the wrong preposition for a celestial object anyway. The labelling team didn't think it through. The sticker partially obscuring the designer credit is itself in-character — "a bunch of mindless jerks who'll be the first against the wall when the revolution comes" was Adams' description of the company; a thrift-shop owner sticking £20 over their credit line is the next-best thing. |
| `CHGNOTES`: *"SO LONG — AND GRATITUDE FOR THE ABUNDANT FISH."* | "So long, and thanks for all the fish." |
| `CHGNOTES`: *"AGAINST OBSESSION ONE CANNOT WIN; THEY CARE, YOU DO NOT."* | "We can't win against obsession. They care, we don't." |
| **The 42 lucid bypass** — `lastHiddenResult === 42` triggers a Rule-of-4 exception (the device "remembers" how to be a calculator after a hidden result of 42) | "42" as the Answer to the Ultimate Question of Life, the Universe, and Everything (HHGTTG). The mechanic itself is a nod: the device only works correctly after seeing the Answer. |

(The `ORACLES`/`ADVICE`/`CHGNOTES` additions are grouped under a short `// Douglas Adams nods,
rephrased` comment in the source; the four hexagram swaps sit inline in the `HEXAGRAMS` table at the
named entries above.)

---

## 10. Wear & tear (deliberately grubby)

The device is meant to look like it has lived a hard, cheap life. A `WEAR & TEAR` block of CSS layers
the grime on:

- **Grime & sun-yellowing** (`.device::before`, `mix-blend-mode:multiply`) — greasy darkening in the
  corners/edges plus blotchy yellow-brown stains across the case.
- **Dust, scuffs & hairline scratches** (`.device::after`, `mix-blend-mode:overlay`) — an inline SVG:
  a faint `feTurbulence` dust layer plus a handful of hand-placed white/dark scratch strokes.
- **Hazy screen** (`.lcd::before`, `soft-light`) — a greasy smudge, a corner stain, and a couple of
  fine scratches across the LCD.
- **Dead pixels** — a handful of pixels stuck permanently **off**. Rather than *drawing* dots (which
  would "light up"), the readout (`.lcd .out`) is given a **CSS `mask`** (an inline-SVG mask with tiny
  transparent circles) that punches little holes in the text — so it simply **never goes dark at those
  spots** and the real screen shows through. Invisible on a blank display; seen only as gaps where the
  dark digits/reading scroll under them. The holes are fixed in screen space while the text scrolls
  past, exactly like a real stuck pixel.
- **Rubbed-off printing** — the brand logo is at `opacity: .96` (very subtle wear — the bold italic
  wordmark needs to stay readable as a brand), and the model plate is at `opacity: .88` with a
  near-black ink colour `#1f1610` (originally `#6b5f44` at `.74`, which had compounded the muddy
  ink against the beige case to "effectively invisible" — dialled up for legibility while keeping
  the *aged* feel).
- **Dirty, worn keys** — every key carries a faint grime `::before`; the most-pressed keys (`5`, `=`,
  `0`, and the oracle bar) also get a fingerprint-sheen `::after`. Several labels are **faded by use**
  (`0`, `5`, `8`, `2`, `=`, `+` are progressively more washed-out).
- **Keys working loose in their sockets** — a couple sit crooked: `9` is rotated and sits **proud**
  (raised shadow, lifted z-index, like it's popping out), `1` is rotated and sits **sunk/loose**, and
  `tan` is slightly askew. Pressing any of them momentarily reseats it (the `:active` transform wins).
- **A peeling price sticker** (`.sticker`) slapped on the case below the **ORACULON** logo, its
  lower edge grazing the solar strip — a faded thrift-shop tag reading **`£20`** (what Dirk paid in
  the book), rotated and with a curled, lifted corner. **Aged on purpose**: yellow-brown base
  gradient (`#dccfa3` → `#b8a578`, replacing the previous clean cream), **three radial-gradient
  stain blotches** layered on top (different positions/depths, like accumulated finger oils), faded
  red-brown ink colour `#6d2417`, opacity `.82`, plus a subtle inset shadow (`inset 0 0 8px
  rgba(80,55,20,.10)`) for the cupped, dirty-edges look of an old label. The curled corner
  (`::after`) was re-tinted to match. Position: `top: 43px` (was 48px) so the bottom edge grazes
  the LED strip the way you'd expect a real sticker to sit. (Quiet joke: by its own Rule of 4 the
  device can't even display its own price — `20` would come out as "A Suffusion of Yellow.")
- **A tired LCD with a stuck segment** (`.lcd .stuck`) — a faint always-on "8" ghost (the classic
  not-quite-off look of a cheap LCD) with **one segment stuck dark**, sitting behind the live readout
  on the left so it never obscures the number.
- **A hairline crack across the LCD glass** (`.lcd .crack`) — an inline-SVG jagged fracture with a
  small branch, drawn as a dark split under a bright glint, sitting on top of the display (`z-index:5`)
  as if on the glass surface.

**Key trick — readability is protected:** the case grime layers sit at **`z-index:-1`** (the `.device`
is given `z-index:0` to form a stacking context), so they dirty the *bare case* but render **behind**
the keys, the LCD, and the rolled-out receipt. The screen and paper therefore stay legible; only the
LCD's own subtle `::before` haze touches the readout, kept faint on purpose.

---

## 11. The Install Banner — the device's voice in the browser chrome

Most PWAs treat the install banner as inviolable browser furniture — a system notification
about a technical capability. The Oraculon doesn't. Its install prompt speaks in the same
1970s-catalogue brochure voice as the rest of the device:

**"INSTALL ORACULON FOR PORTABLE FORTUNE"**

"Portable fortune" does double duty: the app is portable (installable on your phone), and
the I Ching fortune is now portable (it travels with you). The phrase could only have been
written by this device — no other PWA install banner reads like a product tagline from a
fictional Sirius Cybernetics mail-order catalogue.

- **The red INSTALL button.** The device's primary action is a blue button marked "Red"
  (§4). The device's *meta* primary action — installing itself onto your phone — is,
  correctly, a **red button marked "Install."** The device's own inverted-colour convention
  extends cleanly into the chrome around it: the in-universe action gets the wrong colour
  on purpose; the out-of-universe action gets the right colour by inheritance. Both are red
  in spirit; only one is red in practice.
- **The dark banner** (`#2a2418`, matching the desk surround) with a gold top border
  (`var(--gold)`) and Silkscreen monospace at 10px — same typographic register as the model
  plate and the LED legend. The banner looks like another piece of the device's case, not a
  browser notification.
- **Behaviour:** appears once (on `beforeinstallprompt`), dismissable (✕ persists to
  `oraculon_install_dismissed` in localStorage), never returns after install or dismissal.
  Never shown inside a TWA (Play Store install) — `beforeinstallprompt` doesn't fire in
  that context. The banner is a moment, not a feature — same transience as the pie symbol
  (§1) and the `B13` annunciator flash (§9).
- **Safe-area aware** — `padding-bottom: max(10px, env(safe-area-inset-bottom))` respects
  the home bar on devices with gesture navigation. The banner sits at the bottom of the
  viewport, below the device, in the desk-surround space — it belongs to the *room*, not
  the *calculator*, which is correct: installing is a decision made by the owner, not a
  function performed by the device.
