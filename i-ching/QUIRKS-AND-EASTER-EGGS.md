# ORACULON CT-64 — Quirks & Easter Eggs

A catalogue of every intentional joke, hidden behaviour, and bit of flavour text baked into
[index.html](index.html). Nothing here is a bug — it is all on purpose.
If you edit the code, preserve these.

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
- **`ORACLES`** (41 phrases) — shown when an answer is simply *too big*. The first entry,
  `"A Suffusion of Yellow"`, is flagged in a comment as **"the canonical one"** and is **slightly
  weighted** (`pickOracle()` returns it ~1 in 6, vs ~1 in 41 for the rest) so a first-time user is
  likely to meet the famous phrase without it crowding out the others. The rest riff on the same
  deadpan-surreal register: *"An Onset of Tuesday," "A Modest Quantity of Soup," "Beige,"
  "Approximately a Hat," "Somewhere Between Six and a Llama," "Two-Thirds of an Apology,"
  "Greyish, with Ambitions,"* etc.
- **`VOID`** (11 phrases) — shown only for **non-finite or NaN** results, e.g. **divide by zero**.
  These are darker: *"The Void Gazes Back," "Division Is a Form of Loss,"
  "You Have Divided by the Abyss," "That Operation Was Frankly Rude,"
  "An Infinity, Politely Withheld."*

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
  That mismatch (8 in, 10 out) is a deliberate bit of confusion.
- **The readout is one fixed size in a fixed-height window.** Every phrase renders at the single
  `.out.phrase` size (24px); long ones **wrap** to a second line rather than shrinking. The `.out`
  box itself has a **fixed height** (56px — sized for the 48px number *and* a 2-line phrase) with
  content vertically centred, so the LCD never changes size between answers — whether `0`, `Beige`,
  or a two-line wrapper. Preserves the illusion of a fixed-segment LCD.
- **The error annunciator.** The `∞` symbol in the LCD status bar lights up **only** while a
  phrase is being displayed (it's the device's idea of an "error" light).

---

## 3. Scientific Function Quirks

- **Trig works in DEGREES, not radians** — like a real pocket calculator. There's a `D2R` (degrees-
  to-radians) conversion and the permanent **`DEG`** annunciator in the LCD. A code comment notes
  the device "thinks in degrees, like a polite calculator."
- **The functions are real and usable** — `sin cos tan √ x² 1/x log π` all compute correctly — but
  they still obey the Rule of 4. So `tan(74)=3.49` is allowed; `tan(80)=5.67` becomes an oracle.
- **`π` prints the real value** (3.141592654) and counts as a normal number you can keep computing
  with.
- **`log` is base-10** (`Math.log(x)/Math.LN10`), labelled `log` as on a classic calculator.

---

## 4. The Oracle — the blue button marked "Red"

A second, completely separate machine sharing the same screen.

- **The blue button marked "Red."** Straight from the book: *"There wasn't a red button, but there
  was a blue button marked 'Red', and this Dirk took to be the one."* The full-width oracle bar
  (`button.iching`) is therefore **blue** and reads **`易 Red`** — even though the manual tells you to
  "push the red button." The genuinely-red keys (`C`, `⌫`) make the gag sharper: there *are* red
  buttons, just not *the* red button. (The internal action is still `data-act="iching"`.)
- **The DELUXE 128-hexagram model.** The real I Ching has 64 hexagrams (six lines each). This cheap
  unit rolls a **seventh line** (`for i in 0..6`), so `bits` runs **0–127** and the hexagram is
  **`No. 1–128`** — the device boasts *twice the canonical wisdom*, blissfully unaware that a 7-line
  figure is not a hexagram at all. (The changing-line numbers therefore run **1–7**.)
- **A real(ish) cast, deterministically mapped.** `rollLine()` simulates the three-coin method:
  three flips of yin(2)/yang(3) sum to 6/7/8/9 → old-yin (changing), yang, yin, old-yang (changing).
  The seven lines form an index into **`HEXAGRAMS[bits]`**, so the *same roll always yields the same
  hexagram* — exactly like the real device, and a clean data table for the eventual hardware port.
- **The whole reading SCROLLS across the LCD — there is no printout.** Faithful to the book
  (*"the I Ching calculator then scrolled this text across its tiny LCD display"*), `consult()`
  composes the entire reading into one line and `marchReading()` runs it as a single right-to-left
  marquee (`.out.ticker` / `@keyframes march`). It is **unhurried on purpose** (duration scales with
  length, `text.length*0.08`s) — you have to watch the tiny screen, and if you miss it you consult
  again. When it finishes, the LCD **settles on the cast hexagram** (`易 No.N  NAME`). The earlier
  roll-out/tear-off paper receipt is gone (preserved in `i-ching-calculator - printout.html`).
- **The scrolled reading wears the book's robes (hybrid: fixed + random).** Composed in order:
  - **`易 No.N  NAME`** + **`※ IN MOTION`** / **`· AT REST`** — the named, numbered hexagram. Both
    come from `HEXAGRAMS[bits]` (`n` = garbled name, `j` = signature judgement); the number is a fake
    `bits + 1` (**not** King Wen order — *"a cheap model"*). 128 names: *"THE DAMP GOOSE," "SMALL
    TAMING OF THE BISCUIT," "A SUFFUSION OF BEIGE," "THE DELUXE HEXAGRAM."*
  - **`THE JUDGEMENT OF KING WEN:`** — the hexagram's **fixed signature line** (`hx.j`), then **one
    random `ADVICE`** line (25, each prefixed `ADVISE:`). Core judgement tied to the cast; advice
    keeps repeats fresh. (Many `j` lines are the old `OPENERS`/`MIDDLES`, rehoused so nothing was lost.)
  - **`LINE n CHANGES:`** → **`THE COMMENTARY OF THE DUKE OF CHOU:`** → a pick from **`CHGNOTES`**
    (16) — only when a line moves. Changing lines are **named by number** (1 = bottom, 7 = top);
    multiples read **`LINES 2 & 5 CHANGE:`**. If nothing changes, the fixed **`STILL`** line shows.
  - **The footer** always certifies itself: **"READING CERTIFIED 39% ACCURATE · 易經計算機 CT-64 ·
    NO REFUND."**
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
  *"across 128 hexagram"* (the deluxe-model boast) — but never says what it can or can't compute.
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

- **Brand name "ORACUL·O·N"** with the central **O** picked out in gold — a calculator-brand
  parody.
- **Model plate:** *CT-64 SCIENTIFIC / 易經計算機 / **MADE IN ELSEWHERE***. (易經計算機 = "I Ching
  Calculator"; the CT-**64** nods to the 64 hexagrams.)
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

---

## 7. Keyboard Easter Eggs / Shortcuts

The whole device is keyboard-drivable (`keydown` handler):

- `0–9` and `.` → digits; `+ - * /` → operators; **`x` or `X` also maps to ×**.
- `Enter` or `=` → equals; `Backspace` → delete; `Esc`, `c`, or `C` → clear (also closes the reading).
- **`?`, `i`, or `I` → consult the oracle** (press the blue "Red" button without the mouse).

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
| The **64 hexagrams** of the I Ching | Model name **CT-64** |
| **"Deluxe" 128 model** (a 7th line → twice the canon) | `for i in 0..6`, `bits` 0–127, `No. 1–128` |
| The **three-coin divination method** | `rollLine()` |
| **King Wen sequence** (and the joke of *not* using it) | Code comment in `consult()` |
| **Sellotaped-on back** ("the back had half fallen off") | `.tape` over the top-right corner |
| Manual ritual: **soulful / besieging / "push the red button"** | Booklet consult paragraph |
| Readings **"translated… by way of the Japanese"** | Booklet "any strangeness is not error but TRAVEL" |
| Dirk **pushes the button without waiting for harmony** | Booklet "press the button anyway" parenthetical |
| Cheap-calculator tropes (fake solar cell, "DEG", broken-English manual, missing warranty pages) | Throughout the UI and manual |

---

## 9. Buried Douglas Adams nods (rephrased — never verbatim)

A faint sprinkle of *Hitchhiker's* / *Dirk Gently* DNA, reworked into the device's broken, ALL-CAPS
voice so they read as the machine's own nonsense and reward a fan who looks twice. **If you edit
these, keep them rephrased — never restore the verbatim quotes.** Current nods:

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
| `CHGNOTES`: *"SO LONG — AND GRATITUDE FOR THE ABUNDANT FISH."* | "So long, and thanks for all the fish." |
| `CHGNOTES`: *"AGAINST OBSESSION ONE CANNOT WIN; THEY CARE, YOU DO NOT."* | "We can't win against obsession. They care, we don't." |

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
- **Rubbed-off printing** — the brand logo and model plate are dialled down in opacity, as if worn by
  years of thumbs.
- **Dirty, worn keys** — every key carries a faint grime `::before`; the most-pressed keys (`5`, `=`,
  `0`, and the oracle bar) also get a fingerprint-sheen `::after`. Several labels are **faded by use**
  (`0`, `5`, `8`, `2`, `=`, `+` are progressively more washed-out).
- **Keys working loose in their sockets** — a couple sit crooked: `9` is rotated and sits **proud**
  (raised shadow, lifted z-index, like it's popping out), `1` is rotated and sits **sunk/loose**, and
  `tan` is slightly askew. Pressing any of them momentarily reseats it (the `:active` transform wins).
- **A peeling price sticker** (`.sticker`) slapped on the case below the **ORACULON** logo, its lower
  edge grazing the solar strip — a faded thrift-shop tag reading **`£20`** (what Dirk paid in the book),
  rotated and with a curled, lifted corner. (Quiet joke: by its own Rule of 4 the device can't even
  display its own price — `20` would come out as "A Suffusion of Yellow.")
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
