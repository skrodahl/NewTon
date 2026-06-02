# IDEAS.md — ORACULON CT-64 Brainstorm Bucket

A junk drawer of half-mad ideas for future versions of the device. **These are seeds, not
commitments** — raw fuel for brainstorming. Most should never ship; the few that do must obey the
soul: *useless, confidently broken, enigmatic, in the device's voice, discovered not explained.*
(See [QUIRKS-AND-EASTER-EGGS.md](QUIRKS-AND-EASTER-EGGS.md) for what already exists, and
[PLAN.md](PLAN.md) for the roadmap.)

> Guardrail when picking from this list: does it make the device feel more like a **cursed object you
> found in a drawer**, or just like a gimmick? Keep the former.

> **The design principle.** The device is annoyingly helpful — it keeps trying, sincerely, while
> failing at actually helping. It behaves like a calculator should, but twisted. It is a calculator.
> Not a chatbot, not a game, not a storytelling engine. **No chat mode. No story mode. No achievement
> system. No NPC dialogue.** The device has total freedom within severely restricted boundaries: it
> can do anything a cheap 1980s calculator could do, and nothing else. The quirks are not the device
> breaking character — they are the device *succeeding at its idea of helping*. The silent π
> correction isn't a joke; it's the firmware fixing your typo. The "Cannot Operate on Soup" isn't
> a punchline; it's an error message. The calibration notice isn't a gag; it's aftermarket policy.
> Sirius Cybernetics products keep trying; their failures are sincere.

> **Status convention**: items marked **✅** have been implemented. The canonical "what exists"
> record is [QUIRKS-AND-EASTER-EGGS.md](QUIRKS-AND-EASTER-EGGS.md); IDEAS preserves the brainstorm
> trail (including the considered-and-rejected) so future-you can see what was on the table.

---

## Display & screen dysfunction
- A digit that's quietly, consistently **wrong** — e.g. every `7` renders as a slightly malformed `7`,
  or one column of the LCD is permanently 1px dimmer.
- The decimal point occasionally **drifts** one place and drifts back, just often enough to unsettle.
- A **slow refresh** ghost: the previous number faintly lingers behind the new one for a beat.
- The contrast **fades as the (fake) battery "dies,"** then snaps back to full for no reason.
- Cold-weather LCD: the screen scrolls/updates **visibly slower** at "night" (by clock) — sluggish ink.
- A single **stuck-ON segment** that occasionally migrates to a different digit.
- ✅ The `DEG` annunciator flickers to `RAD` for a split second, then back — but nothing actually changes. *(Ambient ~1.5% / 3.5s; see QUIRKS §3. Plus the deliberate `B13` flip on 6×9.)*
- Very rarely, the screen shows the reading **mirrored** or **upside-down**, then corrects itself.
- Bleed: pressing very fast makes neighbouring segments **smear**, like an overwhelmed cheap driver.

## The LED bar — a failed status system
> Framing: someone at the factory *meant* the LED bar to convey consistent status info, wrote half a
> design doc, and gave up. What shipped is a row of lights with visible ambition and zero follow-through.
> Every LED gag can hang off this thread: the lights imply meaning they never deliver.
- A **"boot self-test" sweep** on power-on that proudly tests nothing.
- A **"low battery" pattern** that means nothing (the device has no battery state — or claims not to).
- **Two LEDs that only ever light together**, for no discernible reason, occasionally.
- ✅ A faded **silkscreen legend** under the bar (`POWER · BUSY · ERR · ···`) that doesn't line up with
  any actual LED, and whose labels never match what lights. *(Implemented as `POWER · BUSY · ERR`,
  with ERR deliberately one LED off from the actual soup ERR LED. See QUIRKS §6.)*
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

~~The **faded silkscreen legend** (`POWER · BUSY · ERR · ···`) is the keystone seed — it
physicalises the entire conceit. The labels are documentary evidence that the lights *were
meant* to mean something; the misalignment with the actual LEDs is documentary evidence that
nobody finished the job. Pair it with the existing missing-pages gag (the **LED STATUS
GUIDE** is on a missing page, of course it is) and the "failed status system" idea lands
without a word of explanation.~~

✅ **Implemented.** The legend now sits under the LED bar as `POWER · BUSY · ERR`, with ERR
positioned one LED-width off from the actual soup ERR LED (the third-from-last LED that
twitches on "Cannot Operate on Soup"). The "failed status system" framing is now grounded in
a visible physical detail. The LED STATUS GUIDE remains on a missing manual page, completing
the loop. See QUIRKS §6.

## Input & keys
- A **sticky key**: one key (say `4`) occasionally needs a second press, or double-fires.
- **Phantom keypress**: once in a blue moon a digit appears that you didn't press.
- ✅ The `=` key sometimes **thinks for a moment** (a beat of "...") before answering. *(Rare ~0.5%; see QUIRKS §2.)*
- Holding any key too long makes the device **anxious** (LCD shows a tiny `!` or jitters).
- A secret **konami-style sequence** that does something pointless and wonderful.
- Typing the same number 3× in a row earns a tiny disapproving **annunciator**.
- ✅ The `C` key, pressed 5× fast, briefly shows **"YES, IT IS CLEAR. VERY CLEAR."** *(800ms window between presses, uninterrupted; see QUIRKS §2.)*

## The oracle
- **Ultra-rare hexagrams** (1-in-500) with their own absurd names/judgements — collector energy.
- A hexagram (No. 0? No. 129?) that simply **refuses to answer**: "NOT FOR YOU. NOT TODAY."
- **Question memory**: it scolds you for asking "the same thing again" (even if you didn't).
- The reading occasionally **contradicts itself** mid-scroll, then blames TRAVEL.
- A "**second opinion**" gag: consult twice quickly and it says "I ALREADY TOLD YOU."
- Once a year (by clock) it gives a **suspiciously specific, useful-sounding** reading, then never again.
- The changing-line note sometimes references **a line that doesn't exist** (LINE 9 of 7).
- A hidden **"honest mode"** reading, vanishingly rare: "THE ANSWER IS: A CALCULATOR DOES NOT KNOW."

## Sound (rejected — the device is silent)

> ❌ **Entire section rejected.** The device is too cheap to even have a piezo buzzer, let alone
> speakers. True to the book: the only sound a Sirius Cybernetics CT-64 produces is the very
> faint click of a worn plastic key under finger pressure — which is the user's finger making
> the sound, not the device. See the "Platform constraints" entry in *Platform & delivery* for
> the rationale. The brainstorm trail is preserved here so future-us can see what was on the
> table before the no-sound commitment was made.

- ~~Cheap piezo **click** on keypress; a defeated **bdooop** on "A Suffusion of Yellow."~~
- ~~A tiny triumphant **fanfare** that, true to form, fires at the wrong moment.~~
- ~~The oracle scroll accompanied by **fake dot-matrix-printer chatter** (even though there's no printer).~~
- ~~A barely-audible **hum** that gets louder the longer it's left on, as if straining.~~
- ~~On power-on: a wheezy, slightly-wrong **startup jingle** that never quite resolves.~~

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
- ✅ The **42** easter egg, handled with restraint (it appears once and is never explained). *(Expanded significantly beyond original scope: Q42 pool, lucid bypass, 6×9 → Forty-two path, DEG → B13 flip, "Unapproved Accuracy Mode Activated" flash, the 13-character display coincidence. See QUIRKS §1, §3, §9.)*
- A **self-aware** rare line: "YOU ARE LOOKING AT A WEB PAGE PRETENDING TO BE A CALCULATOR."
- A **developer console** message for anyone who opens devtools, in the device's voice.
- Consulting at exactly **midnight** does something tiny and unrepeatable.
- ✅ An **"EAT THE DEVICE"** reading, vanishingly rare — the oracle actually issues the advice
  the manual warned against. The booklet's *"Do not eat the device even if it advise so"* was
  load-bearing all along. *(Implemented: trigger is the device's nourishment hex —* LESSER SOUP,
  *cast pattern 4 — with line 6 alone changing. Time/date triggers explicitly ruled out, so the
  deliberate conjunction is hexagram × specific changing line. ~1 in 1000 consults. The standard
  reading is replaced entirely; the warranty callback "THE WARRANTY DOES NOT COVER THIS. THE
  WARRANTY DID WARN YOU." is the keystone. See QUIRKS §4.)*

## Platform & delivery (a "pocket oracle")
> Strong candidate, and a natural rung between the web toy and the hardware: it's already one
> self-contained file with no backend, so it wants to be installable.
- ✅ **Make it a PWA** — installable to the home screen, launches **full-screen with no browser chrome**,
  so on a phone it feels like a real cheap device in your pocket. *(Installable; manifest + service worker shipped.)*
- ✅ **Offline-first** (it suits the "no internet, no server" ethos) — bundle the fonts locally so it's
  genuinely usable on a dead-signal train; a service worker caches the lot. *(Done; fonts self-hosted.)*
- ✅ A deliberately **cheap, slightly-wrong home-screen icon** (the beige device, or just 易) — looks like
  a knock-off app someone sideloaded. *(`icons/icon.svg` is the full device with 易 dominating.)*
- A wheezy **fake boot / splash** on launch that never quite resolves (ties to the startup-jingle idea).
- ✅ An **"Add to Home Screen"** nudge written in the device's broken voice. *("INSTALL ORACULON FOR PORTABLE FORTUNE" — install banner with red INSTALL button, Silkscreen font, dark desk-surround theme. See QUIRKS §11.)*
- A fake **"update available"** prompt that, true to form, makes one thing visibly worse and calls it
  an improvement (pairs with the firmware-"update" gag below).
- Landscape vs portrait: it stubbornly **only works one way up**, like real cheap hardware.

### Platform constraints (Stage 0.5 — native wrapper for Play Store)

- **Capacitor wrapper (decision).** Trusted Web Activity was lighter but Capacitor wins on
  what unlocks later: progressive native-plugin access for sensors, in-app purchases, true
  immersive mode, all without rewriting the PWA. Same source ships to web AND Play Store;
  native features wire in as Capacitor plugins behind feature detection. The PWA stays the
  PoC + snapshot (on newtondarts.com); the wrapped app becomes the Play Store distribution.

- **Play Store category: PUZZLE.** Not "Tools" (would be lying — it's not a usable
  calculator), not "Entertainment" (too generic), not "Lifestyle" (wrong shape). The whole
  device IS a puzzle — a calculator broken in N different ways, where the user's job is to
  figure out what each broken thing means. "Puzzle" is the only honest category, and it
  implicitly confirms the discovery-gradient framing: the puzzle isn't a level you play, it's
  the entire device, and the layers from "innocent calculator" to "Wales-pebbles pilgrimage"
  are the difficulty curve.

- **The device is silent — no audio, no haptics.** Doubling down on cheap: a Sirius
  Cybernetics CT-64 wouldn't have a piezo buzzer (let alone speakers or vibration). True to
  the book. This rejects the entire **Sound** section above *as a category*, not item by
  item: not "we haven't built it yet" but "the device wouldn't have it." Native audio access
  via Capacitor is therefore irrelevant to the device proper. The only sound is the soft
  click of the user's finger against a worn plastic key — produced by the user, not the
  device.

- **Sensors are admitted, but with a strict illusion-preserving rule.** Tilt and shake (via
  `DeviceOrientation` / `DeviceMotion`, reliably available through Capacitor plugins) are
  valid as INPUTS the device can respond to — IF the response is device-voice. The device
  REACTS to physical events; it does not COOPERATE with them. The distinction:
  - ✓ **Tilt → device complains** (existing entry: "PLEASE RIGHT THE DEVICE"). The device
    thinks it's been mishandled. No new mechanic, just a phrase.
  - ✓ **Shake → device admonishes** (existing entry: "PLEASE DO NOT SHAKE"). Same shape.
  - ✓ **Drop → device "remembers" being dropped** (existing entry under *Time, mood & state*)
    and acts wounded in its voice for a while. Reaction, not unlock.
  - ✗ **Tilt to reveal an ambigram.** The existing flip-word joke (5318008 → B00BIES) is the
    device rendering the flip *on the LCD itself*, having half-understood the gag — never
    realising the user was supposed to physically flip the device. Adding a "physical flip
    reveals the secret" mechanic would mean the device DOES know about physical flipping,
    contradicting the layered "knows the trick, renders it literally wrong, prevents the
    normal path to reach it" joke (QUIRKS §2).
  - ✗ **Shake to randomise / reset / re-cast.** Implies the device cooperates with physical
    input as a control input. The device doesn't have shake-as-action mappings; it only has
    shake-as-mistreatment reactions.
  - **General rule:** physical inputs trigger phrases ABOUT the input. They never bypass or
    duplicate firmware mechanics. The device's response to being held wrong is identical in
    shape to its response to being asked the wrong question — a polite, broken-English
    complaint that the user is doing it wrong.

## The device has opinions about you

Seeds for behaviours where the device *receives* user behaviour rather than producing it — gestural,
reactive, and rooted in the fiction that Sirius Cybernetics has opinions about how their product
should be handled.

- **Consultation streak — the oracle gets tired.** Consult once, fine. Consult three or four
  times in close succession and the readings start showing fatigue: *"THE GEESE ARE TIRED.
  CONSULT AGAIN TOMORROW."* Consult six or seven times and the device breaks character for a
  single phrase — *"JUST FLIP A COIN"* — then returns to broken English. Lays on top of the
  existing consult flow without changing it, and rewards a user the device has never specifically
  rewarded before: the impatient repeat-consulter. The fatigue phrases are a new pool; the
  counter resets after a cool-down period (maybe 5 minutes of non-consultation).

- ✅ **The device correcting your correct numbers.** Manually entering the real value
  of π, √2, or e — to the longest precision the 8-digit input cap allows — and the device
  launches its `Calculating...` routine and commits its own rational approximation.
  *(Implemented: triggers on exact match of `3.1415926` → `3.142857143`, `1.4142135` →
  `1.414285714`, `2.7182818` → `2.714285714`. Negative forms too. Wrapped in the same ~1s
  `Calculating...` beat as the π key, with `2, √` ALSO routed through the same slow routine
  for consistency — three paths to a wrong constant, one shared timing signature. The slow
  beat is the clue, not the disguise: a patient user who notices the same delay across all
  three paths realises the device has specific ideas about specific numbers. Input is
  totally gated during the constant-Calculating (no keys register, not even π — distinct
  from π-Calculating which lets π through for the toggle). See QUIRKS §3.)*

- **Tilt — "PLEASE RIGHT THE DEVICE."** Flipping the phone upside-down — exactly the
  ambigram-completion gesture from primary school (the one that turns 5318008 into BOOBIES) —
  produces a one-time message, because of course Sirius Cybernetics never realised the flip
  was part of the calculator trick and considers it a usage error. Uses the `DeviceOrientation`
  API. One-shot per session; the device doesn't nag. The message is the device's *incorrect
  understanding* of what you're doing — it thinks you dropped it, not that you're reading
  upside-down words.

- **Shake — "PLEASE DO NOT SHAKE."** Shaking the phone gets a single deadpan admonition.
  Uses the `DeviceMotion` API with a reasonable threshold so normal movement doesn't trigger
  it. One-shot per session. Pairs with tilt as the two gestural opinions the device has about
  its physical handling. Both are *receiving* user behaviour rather than producing content —
  the device reacts to how you hold it, not what you press.

## The device has opinions about time

Seeds for long-term ownership rewards and time-aware behaviour.

- ✅ **Fake BATTERY LOW warning.** *(Implemented: triggered by 21 consecutive Rule-of-4
  oracle results — the Dirk Gently tea-temperature commitment number. Time-based trigger
  explicitly rejected; gated on a deliberate grind of the device's central conceit. On the
  21st-in-a-row oracle, the device shows `BATTERY LOW` and both LCD + LED bar fade together
  over 9000–11500ms (random per fire, ease-in curve), then power-cycles to a fresh state.
  Total input seal during the fade — even `C` does nothing. Vanishingly few owners will see
  this. See QUIRKS §1.)*

- ✅ **Calibration / service mode.** *(Implemented: triggered by the 0 Kelvin gate —
  `0 ÷ -273.15` or `-273.15 ÷ 0`, either direction, intercepted at the top of `doBinary()`.
  The device's misguided helpfulness in attempting absolute-zero arithmetic pushes the
  firmware into service mode. The minus-as-sign extension (now also fires after non-minus
  operators) was added so the gate is typeable. The Bambelweeny path involving Dirk's tea
  temperature (`42 × 21`) was considered and dropped — one gate is enough. The scrolled
  reading opens with the explicit diagnostic line "Division by absolute zero: Calibration
  overdue", names Sirius Cybernetics as the manufacturer, directs the user to headquarters
  on the planet **Eadrax (if extant)**, and closes with the third warranty callback:
  "EATING THE DEVICE REMAIN A VALID OPTION." The future-dated service notice from the
  original spec was dropped as redundant. See QUIRKS §3.)*

  **Still on the table for follow-up:** The LED choreography described below (SOS in Morse,
  or stumbling diagnostic animation) is NOT yet implemented — the current Calibration uses
  the standard consult-flow `ledFor("cast")` activity at scroll start, no special pattern.
  Adding the proper LED accompaniment is a small follow-up.

  **Original LED accompaniment vision** (for the follow-up):
  - **SOS in Morse** (`··· −−− ···`) — a pattern that makes perfect sense as a distress
    signal but has no business on a calculator's decorative LED strip. The device is calling
    for help through the only output channel it has, to an audience that was never listening.
    Plays once, slowly, then the strip goes dark.
  - **An incomplete animation that can't keep rhythm** — the strip tries to run a diagnostic
    sweep but stumbles: LEDs fire out of sequence, pause too long, restart from the wrong
    position, and eventually give up partway through. The firmware's service routine exists
    but hasn't been exercised since manufacture and has bit-rotted. Same "barely managing"
    posture as the soup LED (§6 of QUIRKS) and the crooked 7th line (§4), applied to a
    different component.

  Either option pairs with the `POWER · BUSY · ERR` legend — the LED bar finally doing
  something that *almost* resembles the status system it was designed for, at the one moment
  nobody asked it to. The service mode is the device's most sincere attempt at self-diagnosis,
  expressed through a light bar that was never wired to mean anything.

## The corporation surfaces

Seeds for the Sirius Cybernetics corporate identity leaking through the firmware.

- **"SHARE AND ENJOY" — the Marketing Division's slogan.** Appears as a rare one-second flash
  on the LCD, maybe once per thirty minutes of active use. No mechanic, no purpose; just the
  corporation occasionally remembering it has a brand. The phrase is verbatim Adams (HHGTTG —
  the Sirius Cybernetics Marketing Division's motto, famously inscribed on a conditions-of-
  sale plaque and also on the hull of a black stunt ship). Implementation: a rare timer, same
  family as the `DEG`→`RAD` flicker (§3 of QUIRKS) — ambient corporate noise. Skipped under
  `prefers-reduced-motion`.

- **The Complaints Department.** Reachable via some illogical key sequence (undecided — maybe
  `C C C C C C C` or a specific operator chain). Opens a tiny text input on the LCD:
  *"COMPLAINTS DEPARTMENT — ENTER COMPLAINT:"*. The user can type whatever they want (digit
  keys only, naturally — the device's input vocabulary is numbers). After pressing `=`, the
  device replies *"MESSAGE FILED."* and returns to normal. The complaint goes into the void;
  the corporate acknowledgement is the only response. The message is not stored, not logged,
  not transmitted. Pure bureaucratic theatre. Pairs with Adams' description of the Complaints
  Department: *"If you have enjoyed the experience of being served by us, you may care to know
  that... the alarm will sound."* The device's Complaints Department works exactly as well as
  the fictional one.

---

## The 64-clew pilgrimage — companion website + clew distribution

The deepest possible easter egg the device could ever ship. Two co-dependent components: a
clue-distribution mechanic on the device, and a companion website that's the prize for
patient assembly. Documented here as a half-plan; not yet built. The URL/domain is
deferred — the mechanism itself can be built first with placeholder fragments and the
fragments swapped in later.

### The mechanic on the device

A hidden URL is split into **64 fragments**. The fragments are distributed across four
specific upper-64 carrier hexagrams, chosen because their existing names and judgements
already speak the language of hiding, encoding, and redirection:

| `bits` | Hex No. | Name | Why it fits |
|---|---|---|---|
| 94  | **95**  | **THE OTHER POCKET** | Built-in pointer: *"THE ANSWER YOU SEEK IS IN THE OTHER POCKET."* |
| 105 | **106** | **THE KEYLESS LOCK** | Lock/key vocabulary of secrets. |
| 109 | **110** | **THE MISSPELT THING** | Naming/encoding inherent. |
| 124 | **125** | **THE LAST DRAWER** | Recursive nesting — drawers-all-the-way. |

When a cast lands on one of these four hexagrams, the rendered judgement is appended with a
clew: **`CLEW N/64: <fragment>`** inline (looks like the device leaked it accidentally, not
announced it deliberately).

**Spelling: `CLEW`, not `clue`.** British, archaic, and etymologically the ball-of-thread
meaning that the "clue" sense derives from. Slightly wrong without being wrong — perfect
for the device's voice.

### Design decisions (locked)

- **Random per cast, repeats allowed.** No localStorage tracking. The user keeps their own
  notebook. Wales-pebbles intent — the discovery cost IS the design.
- **Inline judgement replacement.** Clew appended to the existing judgement, not announced
  as a separate beat.
- **Clue 1/64 is the entire domain.** Partial domain fragments are guessable (`oracu` →
  obvious); the domain must be revealed atomically in a single clue. Clues 2–64 carry the
  path fragments. Until a user has seen clue 1/64, they're collecting puzzle pieces for a
  puzzle they don't know the shape of — *deliberately cruel*.

### The math (Wales pebbles is the point)

Reaching upper-64 naturally: ~1 in 7 casts (the gate forces normal 6 of every 7; 7th is
50/50, half of which are upper-64). Hitting one of 4 carriers within upper-64: 4/64 = 1/16.
So natural hit rate on a carrier hex: ~**1 in 224 casts**. The `%` escape bypasses the
gate, raising it to ~1 in 32 escaped casts.

With repeats allowed (coupon collector for 64 items): expected ~**9,700 escaped casts** to
see every clue at least once. Many hours of grinding. The truly committed will succeed; the
casual will never know. That's the design.

### The companion website

- **Destination URL** lives at a domain to be chosen (candidates: `oraculon.biz` — device
  angle; `sirius-cyb.biz` — corporate angle, reusable across multiple Adams-flavoured
  projects). `.biz` is the right tone — slightly cheap, exactly what Sirius Cybernetics
  would register because they didn't bother with the proper TLD. Lean: corporate angle, so
  the Calibration mode's "Complaints Department on Eadrax" callback gains a real off-device
  destination on the same site.
- **The page hosts a cleaned-up version of QUIRKS.** Not the brainstorm-and-decision-trail
  document we maintain locally — a *publication*, rewritten in a clean voice, ordered for
  the reader who's discovering the device rather than the team building it. No considered-
  and-rejected trails, no code references, no file paths. Each easter egg presented as a
  finished thing.
- **Framed as an official Sirius Cybernetics technical bulletin** — typeset for the
  in-fiction reader. Same broken-English voice as the device's manual and the Calibration
  reading. The corporation publishing a tech doc about its own product, complete with
  inappropriate disclosures it didn't realise it left in.
- **The path itself should be self-referential.** Not a random hash, but something that
  *reads* as an Adams-flavoured phrase when assembled. The reward of patience is recognising
  the joke in the URL itself when the last fragment slots in.

### Recursive layering — clews within clews

The companion document **contains its own clews to a NEXT-LAYER secret**. Same texture as
the warranty's "do not eat the device" line being secretly load-bearing across three
device surfaces — except now the *entire document* is the load-bearing object. The
corporation, in trying to officially document its device, accidentally leaks the next
secret too.

What the next layer points to is undecided. Seeds (don't pick now):
- A pre-launch / behind-the-scenes / outtake page (rejected hexagrams, rejected oracle
  phrases, design notes presented in-character)
- A real contact channel for the Complaints Department (the joke being that contacting it
  results in being cheerfully ignored)
- An Adams tribute / dedication page
- A sibling Sirius Cybernetics product (different device, different broken-English voice,
  links back)

The recursive structure makes the patient user the *only* one who sees the whole shape.
Casual visitors see device → fun. Patient grinders see device → URL → publication.
Obsessive readers see device → URL → publication → next layer.

### Implementation notes (for future-us)

- Build the mechanic with a placeholder `CLEWS` array of 64 strings. Swap in the real URL
  fragments once decided.
- Pick a clew at random on each cast that lands on a carrier hex (cast bits ∈ {94, 105,
  109, 124}).
- Append `CLEW N/64: <fragment>` to the rendered judgement string — inline, before the
  accuracy footer.
- No state, no tracking, no persistence — pure random per cast.
- Test fully with placeholders before committing to a URL/domain.

### Cross-project layering — clews in NewTon's release notes

Retroactively edit `Docs/ReleaseNotes/RELEASE-NOTES-v5.1.3.md` (currently *"Cannot Operate
on Soup"*) so it becomes a clew-carrier of its own. The release page already has Oraculon
flavour (its tagline borrows the device's signature soup error, and its footer carries a
clickable `42` link as a 42-easter-egg trail) — extend that flavour into a deliberate
secondary clew surface.

**What changes:**

- **New tagline**, in the same anti-direction register as the device's voice. Candidates:
  - **"Don't Look Here for Clews"** — uses the device's signature `CLEW` spelling (British,
    archaic), which is the *real* cue. A user who has already collected clews from the
    device immediately recognises the spelling; everyone else reads it as an idle
    misdirection. The anti-instruction IS the instruction, but only for the right reader.
  - **"The Missing Release"** — implies the release is anomalous / shouldn't exist, which
    pairs with the device's "(IF EXTANT)" Calibration parenthetical. Same humour shape.
  - Other officialese variants in similar vein.
- **Content carries embedded clews** — could be fragments of the 64 (alternate collection
  path; rewards users who explore the host project), or could be a separate clew set that
  points to the *next-layer* secret beyond the destination URL. Either is interesting; pick
  during implementation.
- **The release notes' historical claims may shift** in subtle ways from the originally
  shipped version. The shift is the clue.

**Why it works in-character:**

Retroactively editing a shipped release notes document is *something you're not supposed to
do*. Release notes are historical records — dated, archived, ideally immutable. Violating
that for the corporation's purposes is perfectly Sirius Cybernetics: a company that would
absolutely backdate its own documentation when it suited them, with no acknowledgement, and
expect everyone to act normal. The "we accidentally updated our archives" gesture is
already in the brand.

For the device's discovery gradient, this adds a layer that uses *NewTon's infrastructure
as a clew-carrier*. The trail becomes: user collects some clews from device → user explores
the host project (NewTon) → user finds v5.1.3's strange tagline → user recognises the
device-flavour spelling → user reads carefully and finds the planted material. The cross-
project bleed is part of the puzzle, not a contamination of it.

**Why it's also the right time to do it:**

After the repo split (deploy snapshot stays on NewTon, dev moves elsewhere), the v5.1.3
release notes will become a genuine archived artefact on NewTon — and the perfect place
for the device to leave a fingerprint that connects the two repos *only for the user who
knows to look*. The deeper a fan goes into the device, the more visible the cross-project
connection becomes. The casual NewTon user sees a weird tagline. The committed Oraculon
user sees a deliberate handshake.

**Caveats:**

- Don't break the release notes' substantive content. The migration section, the technical
  details about `.dlg__note`, the JSON-LD fix — those need to remain accurate as historical
  record. Only the tagline and lightly-decorative passages should carry the clew load.
- The originally-shipped tagline ("Cannot Operate on Soup") is itself an Oraculon nod and
  worth preserving in some way — possibly retained as a subtitle, or referenced in the new
  framing ("Originally shipped under the title *Cannot Operate on Soup*"). The edit should
  feel like the corporation reissued the bulletin, not erased it.

---

## Hardware / physical-device specific (Stage 2)
- A **real, non-functional solar cell** above the (real) green LED bar — uselessness made literal.
- A genuinely **bad hinge / loose battery door** that's *meant* to be slightly loose.
- The screen is a **reflective green graphic LCD** so it looks dead until light hits it right.
- A **"premium" dial** on the side that claims to raise the ceiling but is glued at 4.
- Packaging that looks **water-damaged from the factory**; a "best before" date already passed.
- A **lanyard hole** positioned so the device always hangs slightly crooked.

## Anti-features, "premium" gags & stretch goals
- ✅ **CEILING stretch goals** (already canon): answers up to 5, then 6, as funded tiers. *(Documented in PLAN.md as crowdfunding stretch goals and the £20 Mobile premium tier — answers up to 5 via in-app purchase.)*
- A **"Pro" sticker** you can apply that does nothing but make it 4% more confident.
- **Subscription gag**: "UNLOCK NUMBER 7 FOR ONE SMALL SOUP PER MONTH" (never actually purchasable).
- A **firmware "update"** that visibly makes one thing worse and calls it an improvement.
- **Limited Edition Beige**: identical to standard, but the box says Limited Edition.
