# PILGRIMAGE.md — ORACULON CT-64 Clew & Lost-Pages Architecture

The design record for the device's deepest discovery layer: the **clews**, the
**lost pages**, and the self-building causal chain that connects them. This
document captures not just *what* we decided but *why* — so future-you can see
the reasoning, not just the conclusions, and can extend the system without
re-deriving the principles. (See [QUIRKS-AND-EASTER-EGGS.md](QUIRKS-AND-EASTER-EGGS.md)
for shipped behaviour, [IDEAS.md](IDEAS.md) for the brainstorm trail, and
[PLAN.md](PLAN.md) for the roadmap.)

> **The soul, restated for this layer.** The device is a silent found object;
> the corporation is a verbose, incompetent institution. They are different
> channels with different voices and they are not aware of each other. The
> device leaks; the corporation documents. The user assembles meaning by
> moving between them. Nothing in this layer may make the device *want* the
> user to continue — the device shows you where you are, never that you should
> go on.

---

## 1. The two channels (the load-bearing separation)

Everything in this layer rests on one split:

- **The device** is the cursed object. It is silent about itself. It leaks —
  strains, dims, glitches, coughs up debug strings — but it never narrates,
  never explains, never acknowledges that a pilgrimage exists. The device's
  *entire* contribution to the pilgrimage is one leaked URL it doesn't know it
  dropped.
- **The corporation** (Sirius Cybernetics) is the verbose institution. It
  documents, cross-references, over-explains, and accidentally leaks the next
  secret while trying to explain the last. The corporation's surface lives on
  the web, at `lostpages.oraculon.biz` and the clew destinations.

**Why the split matters.** The verbosity that would be *fatal* on the device
is *in character* for the corporation. A device that said "there's more, keep
looking" would collapse the found-object spell instantly. A corporation that
says too much, points too eagerly, and documents things it shouldn't — that's
not a tonal error, it's characterisation. So the meta-signal we were worried
about overshooting doesn't live on the device at all. It lives on the website,
where loudness is appropriate, and the website is *allowed* to overshoot
because overshooting is what that corporation does.

This is also faithful to the source. The calculator in *The Long Dark Tea-Time
of the Soul* is mute and indifferent; the meaning is always assigned by the
world around it. We rebuilt that relationship as an architecture: dumb sincere
object, talkative unreliable maker, user walking between them.

---

## 2. The bootstrap: `CLEW #1/64` and `lostpages.oraculon.biz`

The device delivers exactly one clew: at boot, ~10% of the time, under cover
of the same `lcdPanic` glitch used everywhere else, it shows
`CLEW #1/64: https://lostpages.oraculon.biz/` and then never mentions the
pilgrimage again. (See QUIRKS POST section for the reveal machinery.)

### Why `lostpages` is the right subdomain

It is **retrodictable, not predictable.** Almost nobody guesses it cold — but
the instant they see CLEW #1, the reaction is "...of course it is," because the
missing pages have been the device's running confession from the beginning:

- `PAGE 4–11 MISSING` in the booklet.
- `MANUAL: PAGES 4-11 NOT FOUND` in the POST log.
- `LED_STATUS_GUIDE: SEE PAGE 7` — pointing at a page *inside* the missing range.

The device has been telling you the explanatory pages are gone, over and over.
CLEW #1 hands you the place they went. The subdomain is the answer to a
question the device has been asking the whole time without you noticing it was
a question.

**Why retrodictable beats guessable.** A guessable answer rewards cleverness in
the moment. A retrodictable one rewards everything you already absorbed — it
reaches back and makes every prior missing-pages mention retroactively
load-bearing. You thought "pages 4–11 missing" was flavour. It was an address.

### Why the bootstrap content is the manual, still incomplete

`lostpages.oraculon.biz` hosts the Owner Manual **with the missing pages still
missing.** The payoff for finding where the lost pages went is discovering
they're *still lost*. That's not an anticlimax — it's the thesis. The Wales-
pebbles bargain at structural level: the destination is real, reachable, and
exactly as unresolved as where you started. Of course it is. It's a Sirius
Cybernetics product; the corporation can no more produce the complete manual
than the device can count past four.

The symmetry: the device confesses the pages are missing, the corporation
hosts the place those pages would be, and the place is still missing them.
Both channels meet at exactly one point, and even at the meeting point neither
can produce the thing that's actually missing.

### Delivery asymmetry (noted, intentional)

CLEW #1 is **boot-delivered**; CLEW #2…#64 will be **cast-delivered** (glitch-
surfaced during use — see §4). The bootstrap is easier to reach than the body
of the pilgrimage. That asymmetry is correct: the front door should be more
findable than the corridor. But it *is* two mechanisms, not one extended across
64. Don't forget that when building #2+.

---

## 3. The `#1/64` fraction, and the lie inside it

The fraction does the heaviest semantic lifting in the whole reveal. Without
`/64`, the URL is "a hint." With `/64` it becomes "the first piece of an
assembly," and the user instantly knows three things: there is a series, they
have the first member, sixty-three more exist.

### But the fraction is also the device's first lie

The `/64` promises a **countable, closed set.** It will turn out not to be one
(see §6, the chase card). The denominator was the original sin: the device
states "64" as fact in its first leaked breath, and the truth is "64 and then
some." Discovering the fraction *lied* is itself the final, unannounced clew.

This is the only place the device makes a loud "there is more" claim — and even
here it reads as accidental (a debug variable that happened to carry `/64`, not
an announcement). **Budget: approximately one** overt seriality signal in the
whole device. It's spent here. Everything else stays below the threshold.

---

## 4. Clews as glitches, not oracle content

**Decision (supersedes the carrier-hexagram-content design).** A clew is not
part of what a hexagram *says*. The hexagram renders normally, completes, does
its job as itself. Then the device **glitches** and surfaces the clew as an
interruption — the same `lcdPanic` animation that serves boot, the deluxe
consult's 7th-line surprise, and the HINT/CLEW reveal.

### Why this is the right shape

- **It decouples the clew from the hexagram** instead of trading one for the
  other. The upper register keeps its standalone identity; clews ride on top.
  No trade made.
- **It relocates the clew into the correct category.** As oracle *content*, a
  clew was something the device *said*. As a *glitch*, it's the device
  *malfunctioning* — firmware coughing up something it wasn't asked for. That
  fits the soul: "the quirks are the device succeeding at its idea of helping,"
  "failures are sincere." A clew leaking is the same event-type as a warranty
  string leaking.
- **It gives a clean independent spawn dial.** The glitch is independent of cast
  outcome, so probability is tunable on its own axis — exactly the one part of
  the system that is legitimately ours to control (spawn rate, not spread).

### The governing rule for the glitch channel

Everything in the channel must obey **"this was not supposed to reach you."**
The glitch is the device *leaking*, never *performing*. What belongs: anything
internal, diagnostic, accidental, behind-the-curtain — warranty fine print,
manufacturing strings, debug variables, a clew. What does NOT belong: anything
composed-for-you, conversational, or fourth-wall-breaking. The leak is sincere
malfunction, never a wink.

---

## 5. The hint/flavour/clew pool — register by position

The glitch channel carries three job types sharing one surface: **flavour**
(generic firmware noise — camouflage), **hints** (pointers to real discoverable
mechanics), and **clews** (pilgrimage members). The implemented resolution is
elegant and worth preserving:

- A HINT line carries the **`HINT:` prefix only when it's the lingering last
  line** of a reveal (the device's deliberate invitation). The *same string*
  also mixes into the body of POST **un-prefixed**, where it reads as pure
  firmware leakage.
- So the disguise and the flag are the **same content in two positions.**
  Camouflaged when it scrolls past mid-boot; flagged when it lingers at the end.

**This settled the prefix-vs-disguise question we went back and forth on.** The
two behaviours aren't a contradiction to resolve — they're assigned to two
*positions* of one pool member. The correct mental model:

- **Legibility** (is it marked as meant-for-you?) — governed by the prefix.
  Loud once read. Yes.
- **Availability** (is it easy to catch?) — governed by timing (the 10-second
  ambush, the stray-keypress dismissal). Fleeting. Also yes.

These are different axes. A road sign is unmistakably a sign *and* easy to blow
past at speed. Resolve the expensive, fiction-level choice (prefix: yes) and
leave the cheap, reversible one (dismissal timing) as a live knob.

### Hints give away the *other* secrets, in the device's own debug voice

The HINT pool is a debug readout that happens to be a treasure map: `PI_ENGINE
= 22/7` leaks the wrong-constants family, `WIRING_C: OK [STREAK COUNTER]` leaks
the 5×-C egg, `KING_WEN_ORDER: NOT FOUND` confesses the hexagram subsystem is
incomplete. The device leaking its own variable names is the most in-character
possible way to hand out hints, because it's not *addressing* you — it's failing
to keep its internals private.

---

## 6. No conclusion — the pilgrimage is a distribution, not a structure

**Decision.** The pilgrimage does not need an ending, and should not have one.

### Why a conclusion is the enemy

A definite end (assemble all 64 → final reveal → done) creates a state called
"finished," and "finished" is the enemy of the found object. A finished thing is
solved, shelved, exhausted. A pilgrimage with no terminus is never solved, only
*travelled* — the same property as the ~6.6M unexhaustable readings, the same
"the device is always bigger than its current owner." No one ever holds the
whole thing, so the device stays larger than every explorer, forever. The Wales
pebbles don't have a last pebble. Arriving at the total would *ruin* it.

### Consequence: demote the former conclusion

The old design looped the pilgrimage back into the device as a final key-sequence
reveal. A reveal is a terminus. With no conclusion, the key-sequence reveal
becomes **one possible deep clew among many** — weighted however rare — rather
than THE END everyone grinds toward. The `%`-before-`Red` grand announcement
(§7) can *be* that demoted former-conclusion: a rare clew that hands you a
shortcut, no more final than any other.

### The chase card: `CLEW 82/64`

The platform is primed for this with zero structural change — adding a clew is
adding a string to a pool, same as the HINT pool. So: clews can exceed the
denominator. A pilgrim grinds to 64, feels the click of completion — and then
`82/64` surfaces. The denominator was a lie. Not a mysterious lie — a *Sirius
Cybernetics* lie, same species as "warranty valid until fate." Someone wrote 64
in a spec once and never reconciled it against what shipped.

The number of clews is the number of pebbles in Wales: you were told a figure,
you should have counted them yourself, and the figure was wrong **in the
specific direction of "there is always one more than you were promised."**

### "No conclusion" must read as abundance, not abandonment

The only failure mode. The difference is whether a pilgrim hits a wall that
feels like *the developer stopped here* versus a horizon that feels like
*there's always a bit more*. As long as new clews keep surfacing at some nonzero
rate no matter how deep someone goes, it reads as a world with no edge. The
moment someone can demonstrably say "there are exactly 64 and here they are,"
a conclusion has shipped by accident. The over-the-denominator clews are the
guarantee against that.

---

## 7. Clew registers — the working range

Clews can occupy a wide tonal range without breaking anything, because they're
all still *leakage*, just leaking different things. Two worked examples mark the
ends of the range:

### Lore clew — the solar strip (rewards with backstory)

The design notes for the solar strip and why the device needs no power button —
which then got value-engineered into the LED array. Its value is **retrodictive**:
a reader who's noticed the always-lit POWER LEDs, the missing power button, and
the `POWER · BUSY · ERR` legend that doesn't line up gets the document that
explains all three at once. The clew gives no mechanic — it gives the *why*, and
the why is "someone swapped the solar cell for LEDs to save money and didn't
update anything downstream." This makes the whole front panel retroactively
cohere. (Origin story for: no power button → because solar; no solar cell → it
became LEDs; always-lit POWER LEDs → vestigial evidence the device was meant to
never turn off; the failed-status legend → the LEDs wearing the solar cell's old
job. One botched substitution explains four surface features.)

### Mechanical clew — THE clew, grandly announced (rewards too late)

`%` before `Red` casts upper-register hexagrams faster — the efficiency trick
pilgrims "could have used all along." Delivered grandly, *after* the grind that
got you here. The pomp is inversely proportional to the timing: the shortcut is
trumpeted exactly too late to matter. Wales-pebbles posture sharpened — genuinely
useful info, delivered the moment it stops being useful, announced as a gift.

**Tone calibration (important):** it must play it **straight**, not wink. The
corporation sincerely presents the tip as a valuable service, oblivious to the
cruelty of the timing — like a manual finally explaining the feature on the last
page, proud of itself, unaware you needed it on page one. A knowing wink would
let the corporation off the hook by making it complicit in its own gag; the whole
conceit is that they're *sincere* and not in on it. The obliviousness is the joke.

### What unites the range (and the hard limit)

Both are sincere institutional incompetence — the channel's only voice. Neither
*encourages* continuation. Lore clews explain; mechanical clews inform-too-late.
Position, not cheerleading. **The device tells you where you are; it never tells
you to keep going.** A fraction is a coordinate, not a cheer.

---

## 8. The lost pages are diffuse by design

`lostpages` is a **container shape, not a content type.** Had it been named
`themissinghexagrams` or `theclews` it would be boxed into one payload. "Lost
pages" admits anything that could have fallen out of a Sirius Cybernetics binder:
construction notes, meeting minutes, internal memos, rejected hexagrams,
complaints-department auto-replies, expense reports for tea, a half-finished
design doc for the LED status system nobody completed. The name describes the
*condition* of the contents — detached, unfiled, should-have-been-somewhere-else
— and institutional debris is an infinite category.

### Meeting minutes are characterisation by accident

A spec sheet says what the device is; minutes say what the *people* were like —
and the people are the actual joke. Minutes leak arguments, confident bad
decisions, action items nobody actioned, the person who raised the solar-cell
cost concern and got overruled, items tabled to a meeting that never happened.
One line — *"ACTION: revisit power-button omission once solar yield confirmed —
CARRIED FORWARD (7th time)"* — implies six previous meetings and a yield that's
never coming. You imply an entire dysfunctional org through the residue of its
bureaucracy, and residue is cheap to produce and endlessly variable.

### This gives the corporation *internal* texture (a third register)

The device is the silent object; the website was "the corporation's voice" — but
that was monolithic. Diffuse lost pages let the corporation fracture into
departments that don't talk to each other: marketing (the bulletins),
engineering (construction notes — terse, technical, wrong), administration
(minutes — procedural, defeated). Sirius Cybernetics becomes a whole company of
mismatched departments, which is *why* the device shipped as it did. The
dysfunction you can only infer from the device gets documented in the lost
pages, in the departments' own incompatible voices.

### The discipline

Every lost page must read as something that **genuinely fell out of a real
binder** — made for an internal purpose by people who had no idea anyone would
read it — never as content written to entertain. The test: does it look like
boring institutional drudgery with the comedy living *inside* the tedium rather
than replacing it? The funniest lost page is 90% procedural drudgery with one
load-bearing line of catastrophe filed calmly under "Any Other Business," after
the parking discussion. That's how real institutional disaster reads.

---

## 9. The self-building chain — the engine

The lost pages can be **a pilgrimage that builds itself**, because each page
creates a problem the next page must respond to. You don't author independent
jokes (high inspiration cost, one funny idea per entry); you follow a *causal
chain* (low cost — the previous page hands you the problem, you file the next
person's sincere wrong response). Real institutional dysfunction is
deterministic: a problem lands on a desk, the desk does the locally-rational
thing, it compounds, someone three desks away inherits a glitch. You're not
being funny — you're being procedurally accurate about a bad company, which is
automatically funny.

### The master chain (worked example): the 7-bit register

1. This is a faithful I Ching calculator.
2. It should have a 6-bit register.
3. Somebody states only the new 7-bit registers are available (procurement).
4. Others try to "fix" the spare bit.
5. The fix turns into a glitch.
6. The glitch gets retroactively reframed as a feature (marketing).
7. The 7th bit isn't shown as often as the others → add a shortcut.
8. …and so on.

**Why this is the master chain.** The Rule of 4 needs only *three* bits (0–4).
A 7-bit register is more than twice as wide as the ceiling requires — four idle
bits the device is forbidden to use, because the answer can't exceed four. The
7-bit register is the hardware embodiment of the entire gag: a machine
constitutionally incapable of producing a number needing more than three bits,
fitted with seven, because seven was in the parts bin. Same species as the
always-lit POWER LEDs and the missing solar cell — *capacity that exists only as
evidence of a decision nobody finished.* The device could count to 127. It
refuses to count past 4. The gap is four idle bits and a corporation's worth of
meetings about what to do with them.

**It reconnects to the device.** Step 7's shortcut *is* `%`-before-`Red` (§7).
The lost-pages chain, following its own logic about a spare bit, arrives at a
mechanic already in the firmware. The construction notes explain the behaviour
the device actually has. The two pilgrimages — the device's clews and the lost
pages' chain — describe the *same artifact* from two directions: the device
shows the behaviour, the lost pages show the doomed meeting that produced it.
The interconnectedness becomes *causal*, not thematic. It closes.

### Craft note: separate the links by realistic institutional distance

The chain's links must NOT read as one person's coherent plan. Different
departments, different months, different people who never met, each solving a
local problem and unknowingly creating the next person's. The glitch-becomes-
feature step is the keystone: it's almost never a *decision*, it's a
*retroactive reframing* by someone in marketing who found the glitch already
shipped, couldn't recall it, and wrote a bulletin calling it intentional.
Engineering says *"anomaly in upper-bit display, root cause unconfirmed."*
Marketing says *"the CT-64's signature deep-register behaviour."* Same bit, two
departments, one covering the other's incomplete work — and neither knows it's
in a chain. **The reader is the only one who sees the whole thread**, because the
reader is the only one holding pages from every department at once. Holistic
detective: the connection is invisible to everyone inside the company and obvious
to the one person reading the scattered residue.

---

## 10. The practice — it becomes the lost pages, and the pebbles of Wales

The maintenance model is not a content pipeline; it's a **practice.** Every time
the device shows something that deserves a wilder description than it currently
has, write the clew; the pool grows by one. The pilgrimage isn't a feature with
a scope — it's the running record of you noticing your own device more closely
over time.

This makes the lost-pages metaphor **literally true.** Pages 4–11 aren't missing
because they were deleted — they're missing because the explanations *hadn't been
written yet*, and now they get written, one at a time, whenever something earns
one, forever. `lostpages.oraculon.biz` is, genuinely, where the missing
explanations accumulate. The booklet's apology for the missing pages turns out to
be an apology for the fact that the device's documentation is an open-ended,
lifelong project. Most Sirius Cybernetics thing imaginable: a product that ships
incomplete and stays incomplete, because completeness was never on the table —
only continuance.

And it's the number of pebbles in Wales in the truest sense: not a large fixed
number you wouldn't bother counting, but a number *that increases while you're
counting.* The act of attending to the set enlarges the set. The count can't
converge because looking closely makes more. That's not a bug in the metaphor —
it's the metaphor fully loaded.

---

## Open / deferred

- **CLEW #2…#64 delivery mechanic** — cast-time glitch across the upper register
  (all 64 upper hexagrams, per §4), spawn rate TBD. Not yet built.
- **Per-clew rarity weighting** — reuse the `pickOracle()` ~1/6 weighting trick.
  Rare clews (lore, the grand `%+Red`) become "events" pilgrims tell each other
  about; common ones keep the channel alive between rare hits. The rarity *curve*
  matters more than the endpoints.
- **The over-denominator clews** (`82/64`, and beyond) — exact contents,
  exact denominators, and how far past 64 to go. The denominator stays
  permanently, sincerely unreliable.
- **`lostpages` visual register** — own register to feel "elsewhere," or the
  device's existing CSS? (Carried over from IDEAS.)
- **Department voices** — settle the distinct registers for engineering vs
  marketing vs administration before writing many lost pages, so the chain's
  institutional distance (§9 craft note) reads consistently.
- **Source-code header comment** ("Sorry For the Inconvenience") — decided in
  IDEAS, still not committed to `js/oraculon.js`. Note: the HINT pool already
  winks at the code-reader (`NO USER-SERVICEABLE TRUTHS INSIDE`,
  `STATUS: FUNDAMENTALLY A PUZZLE`), which may make a dedicated header redundant.
  Reconsider.
- **`%`-before-`Red` as demoted former-conclusion vs the key-sequence reveal** —
  decide whether the reveal still exists at all, or whether the grand shortcut
  clew fully replaces it.
