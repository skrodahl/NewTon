(function(){
  "use strict";

  /* === FAITHFUL BIT: it cannot produce an answer above 4 ===
     The CT-64 is a full scientific calculator and will accept any input
     you like — even 74. The catch is the ANSWER: if the result of a
     calculation exceeds 4 it gives up and emits an oracular phrase.
     So tan(74)=3.49 is fine, but 2+3=5 is "A Suffusion of Yellow".
     Raise CEILING for a more expensive model. */
  var CEILING = 4;

  var ORACLES = [
    "A Suffusion of Yellow",                  // canonical, verbatim Adams (weighted ~1/6 — see pickOracle)
    "The Number of Pebbles in Wales",         // also canonical, verbatim Adams (unweighted)
    // The Q42 pool (below) holds the device's exclusive oracles for any result that
    // secretly equals 42 — picked from when suppressBig() detects hidden === 42.
    // When one surfaces, the lucid trigger is armed and the next calc reveals the
    // Answer. The Question (Q42) and the Answer (lucid bypass) are mechanically paired.
    "An Onset of Tuesday",
    "The Faint Aroma of Regret",
    "Several Geese, Departing",
    "A Modest Quantity of Soup",
    "Beige",
    "A Reluctance Among the Spoons",
    "The Distant Sound of Filing",
    "Approximately a Hat",
    "Not at This Time, Thank You",
    "A Worrying Amount of Felt",
    "The Concept of Wednesday",
    "Mauve, but Anxious",
    "Three Owls and a Misunderstanding",
    "The Smell of a Library in Rain",
    "A Vague Sense of Cutlery",
    "Nearly, but Not Quite, a Duck",
    "The Number You Had in Mind, but Damp",
    "An Unspecified Quantity of Pigeons",
    "Lukewarm",
    "The Texture of a Forgotten Word",
    "A Polite Refusal, in Teal",
    "Somewhere Between Six and a Llama",
    "The Sound One Hears Before Sneezing",
    "A Drawer That Will Not Quite Close",
    "Ochre, and Slightly Disappointed",
    "The Feeling of a Loose Tooth",
    "Roughly Half a Cathedral",
    "A Long Pause, Then Gravel",
    "The Colour of a Dial Tone",
    "Two-Thirds of an Apology",
    "A Brief Outbreak of Wicker",
    "Damp Tuesday Energy",
    "The Quantity Known as 'Some'",
    "An Echo, Wearing a Cardigan",
    "The Aftertaste of a Decision",
    "Provisionally, a Spoon",
    "Greyish, with Ambitions",
    "A Faint Suggestion of Otters",
    "The Number of Umbrellas Forgotten in Sheffield",
    "The Number of Empty Chairs at a Library Closing",
    "The Number of Steps in a Sigh",
    "A Reluctant Quantity of Sock",
    "Half a Theological Argument",
    "Approximately Norwich",
    "Eleven Bees, Approximately",
    "Modestly Wrong",
    "The Sigh of a Tired Cabinet",
    "A Brisk Wind From the Wrong Direction",
    "Confidently Uncertain",
    "The Distant Echo of a Door Sighing",
    "A Looming Sense of Thursday",
    "The Ghost of a Cold Cup of Tea",
    "A Mild Disappointment in Algebra",
    "A Decidedly Lukewarm Epiphany",
    "The Lingering Taste of Static",
    // Douglas Adams nods, rephrased (never verbatim)
    "Reality, Frequently Approximate",
    "The Approximate Speed of Bad News",
    "Almost, but Not Quite, Entirely Unlike Wednesday"
  ];

  // Q42: a sibling oracle pool, exclusively shown when a hidden result equals exactly 42
  // (Adams' Answer to the Ultimate Question). suppressBig() picks from here instead of
  // ORACLES whenever the suppressed value is 42. All four are verbatim canonical Adams
  // material — the device's "Question half" of the Adams pair, mechanically partnered with
  // the lucid bypass (which then reveals the Answer on the very next calc).
  var Q42 = [
    "How Many Roads Must a Man Walk Down?",         // Dylan; Adams' candidate Ultimate Question
    "What Do You Get If You Multiply Six by Nine?", // Adams (Mostly Harmless): 6×9=54 base-10, but 42 base-13
    "What Is The Ultimate Question?",               // meta — the Question is itself the question
    "Life, the Universe, and Everything"            // verbatim Adams: the canonical subject of the Answer
  ];

  // Named Adams numbers: when a calc produces a hidden value matching one of these
  // keys, the device shows the specific Adams phrase instead of a random ORACLES
  // selection. Easter eggs for those who recognise the reference. Extensible — add
  // more numbers here as they come up. (42 is handled separately via the Q42 pool
  // and arms the lucid bypass; NAMED_NUMBERS entries are display-only, no trigger.)
  var NAMED_NUMBERS = {
    5760003: "The Total Number of Irritated People"  // HHGTTG: population of Brontitall, furious all at once
  };

  // CALC_PHRASES: shown on the right side of the LCD during the cast — while the
  // hexagram graphic draws on the left and the LEDs sweep. Replaced by the marquee
  // when renderHexagram completes. Faithful to the book's I Ching calculator, which
  // announces its thinking on the tiny LCD. Deliberately a pool of one — Marvin
  // impressions and mock-mainframe boot messages were considered and rejected as
  // too parodic (the device should BE in Adams' universe, not perform it).
  var CALC_PHRASES = [
    "Calculating..."   // book canon
  ];

  // FLIP_WORDS: the classic four-banger upside-down-calculator easter eggs. When
  // the display reads one of these exact numbers, the LCD substitutes the flipped
  // word — pure visual swap; underlying `disp` (the state) stays as the digits,
  // so operators and parseFloat continue to work on the real number. The device
  // "implemented" the gag religiously (it recognises the inputs) but SLIGHTLY OFF:
  // the rendered word uses digit-as-letter substitutions (zeros for Os, decimals
  // in wrong places) — the actual flip-mechanic rendered literally, never realising
  // the user was supposed to PHYSICALLY flip the calc. Sirius Cybernetics half-
  // understood the joke. Triggered in render() whenever disp matches a key.
  var FLIP_WORDS = {
    "5318008": "B00BIES",   // every schoolchild's first calculator test
    "80085":   "B00BIES",   // the abbreviated form — device refuses, gives the full Queen's
                            // English version instead. Two inputs → same polite output.
    "0.7734":  "hELL.0",    // classic "hello" — decimal misplaced + zero for O
    "7734":    "hELL.",     // shorter variant — stray period the device added
    "35009":   "G00SE",     // thematic: geese run throughout the oracle phrases
    "5317704": "h0LLIES",   // The Hollies — band name in calc spelling (1979 album)
    "14":      "hi.",       // a tiny greeting, mid-arithmetic
    "376616":  "GIGGLE.",
    "7714":    "hILL.",
    "53045":   "Sh0ES",     // zero for O
    "38":      "bE.",
    "5338":    "bEES.",
    "0.705":   "S0L.0",     // "solo" — typed as 0.705 (the way people explore leading-zero
                            // numbers on a calc); stray decimal preserved in flipped position
    "616":     "GIG.",
    "7108":    "b0IL",      // zero for O
    "711":     "7-Eleven.", // brand recognition + British full stop. "Sju Eleven" in Norway.
    "999":     "Toe Rag"    // 999 flipped is 666 — utterly redundant since the Rule of 4
                            // already oracles 999, but anyone who types it hoping for the
                            // beast gets Odin's manservant from Long Dark Tea-Time instead.
  };

  // IMAGINARY: shown when sqrt receives a negative input. Mathematically the device
  // is in imaginary-number territory — undefined in reals — but the response is
  // dedicated, not the generic VOID treatment. Reachable casually via the minus-as-sign
  // quirk: type "-5", press √. Sibling to ORACLES and VOID; same register, different sin.
  var IMAGINARY = [
    "Imaginary, Mostly",
    "An Imaginary Quantity, Politely Withheld",
    "The Square Root of a Regret",
    "Below the Number Line, Dragons",
    "The Root Exists, But Elsewhere",
    "The Number Line Refuses to Bend",
    "Roots in Other Dimensions",
    "Negative, Confidently"
  ];

  var VOID = [
    "The Void Gazes Back",
    "Division Is a Form of Loss",
    "Ask Again, but Quieter",
    "You Have Divided by the Abyss",
    "This Way Lies Madness, and Also Zero",
    "The Number Refuses to Be Born",
    "Nothing, Multiplied by Despair",
    "Here Be Dragons (Small Ones)",
    "The Universe Declines to Comment",
    "That Operation Was Frankly Rude",
    "An Infinity, Politely Withheld"
  ];

  // ---- calculator state ----
  var disp = "0", acc = null, op = null, fresh = true, settled = false;

  var outEl    = document.getElementById("out");
  var annIching= document.getElementById("ann-iching");
  var annErr   = document.getElementById("ann-err");
  var degEl    = document.querySelector(".lcd .status .deg");
  var lcdEl    = document.querySelector(".lcd");
  var hexEl    = document.querySelector(".lcd .hex");
  var hexLinesEl = hexEl ? hexEl.querySelector(".hex-lines") : null;
  var hexNumEl   = hexEl ? hexEl.querySelector(".hex-num")   : null;
  var pieEl    = document.querySelector(".lcd .pie");
  var hexTimers  = [];

  // The "deluxe glitch" gate: the first 6 consults of every cycle are FORCED
  // into the 1..64 range (re-rolled if they land deluxe). The 7th cast is a
  // natural 50/50 — that's the only place a glitch can fire. Counter then
  // resets and the cycle repeats. Result: ~1 glitch per 14 casts on average,
  // with a guaranteed minimum gap of 6 normal casts between glitches.
  // (Six was chosen because of the "hex" — one hexagram line per gated cast.)
  var gateCounter = 0;
  // Hidden escape hatch: pressing % immediately before the oracle button
  // (Red) bypasses the gate for that one cast — natural 50/50 roll, all 128
  // hexagrams reachable. Undocumented. Discovered by experimentation.
  var escapeArmed = false;

  // π double-press easter egg. The sci row deliberately lacks an `e` key — Sirius
  // Cybernetics shipped a "SCIENTIFIC" calc that forgot Euler's number — but
  // pressing π consecutively ping-pongs the constant: 1st press gives π (22/7),
  // 2nd gives e (19/7), 3rd back to π, etc. Any non-π action resets to π. Pure
  // hidden discovery: only an idle double-tap reveals it. The "wrong constants"
  // family is therefore still just two members on the surface, with the third
  // (e) buried behind a gesture the device never advertises.
  //
  // The press is also deliberately *slow*: π shows "Calculating..." for ~1s before
  // committing the value, and a second press within that window (or after settled,
  // as long as no non-π action intervened) replaces it with "Recalculating..." and
  // restarts the wait. This makes the double-press feel like an actual computation
  // the device is reconsidering, AND gives the user a generous window to discover
  // the second-press behaviour by reflexively pressing again. The counter tracks
  // consecutive π presses so the first says "Calculating" and any subsequent press
  // says "Recalculating".
  var piPressCount = 0;
  var piCalcTimer = null;
  // The Calculating gate. When non-null, a "Calculating..." (or "Recalculating...")
  // phrase is on screen and most input is refused. Two values:
  //   "pi"       — constPi's Calculating. The π key is allowed through so the
  //                double-press toggle (π → e) remains discoverable.
  //   "constant" — slowCalcConstant's Calculating, fired by typed-real-constant
  //                correction OR sqrt(2). NOTHING is allowed through; the device
  //                is "computing" its wrong value and refuses to be distracted.
  // null when no Calculating in progress. The dispatchers consult this to gate
  // input. NOT set under reduced-motion (commit is instant; no phrase to gate).
  // The shared ~1s beat across "pi", typed corrections, and sqrt(2) is the
  // recognition pattern: any production of a wrong constant looks the same.
  var calcKind = null;

  // BATTERY LOW — the consecutive-Rule-of-4 fatigue gate. The device keeps a count
  // of how many oracle phrases have fired in a row (any time the Rule of 4 has
  // intercepted a real result with a phrase instead). On the 21st consecutive
  // oracle, the device "loses power" — fires BATTERY LOW instead of the next
  // oracle phrase, then fades the LCD and LED bar together over ~10s before
  // power-cycling to default state. The streak resets on any real number shown
  // (via showNumber), on C/clearAll, and on the BATTERY LOW fire itself. The
  // threshold of 21 is the Dirk Gently tea-temperature commitment number —
  // room temperature in degrees Celsius, the temperature at which his tea is
  // optimal. (Note that Dirk's room temperature might also be 20°C; we settled
  // on 21 deliberately.) The number is deeply earned: 21 oracles in a row, with
  // no number result in between, no C press, no break in the streak. Vanishingly
  // few owners will ever see it. Those who do have committedly hit the device's
  // central conceit (the Rule of 4) 21 times without a break, and the device
  // finally gives up its pretend-energy-source rather than its pretend-rule.
  var oracleStreak = 0;
  // True while the BATTERY LOW fade is running. Total input seal — no keys
  // register, no C, no consult. The device is dead for the duration.
  var batteryDying = false;

  // The 42 lucid trigger: if the PREVIOUS calculation's hidden (oracle-replaced)
  // result was exactly 42 (Adams), the NEXT calculation bypasses Rule of 4
  // for one beat — the device briefly "wakes up" and shows the real answer.
  // One-shot per trigger: consumed by any calc completion. Cleared by C, ⌫,
  // or consult (no other user action may intervene). The % operator can SET
  // the trigger (via modulo) but never CONSUMES it for lucidity — % stays %.
  var lastHiddenResult = null;

  // C-mashing easter egg: 5 consecutive C presses, each within 800ms of the previous,
  // uninterrupted by any other key → the device emphatically agrees that yes, it is
  // clear. Pure hidden discovery — no visual buildup, just the sudden reveal on 5.
  var clearStreak = 0;
  var clearStreakTimer = null;
  function trackClearStreak(){
    if (clearStreakTimer){ clearTimeout(clearStreakTimer); clearStreakTimer = null; }
    clearStreak++;
    if (clearStreak >= 5){
      clearStreak = 0;
      showPhrase("YES, IT IS CLEAR. VERY CLEAR.");
      return;
    }
    clearStreakTimer = setTimeout(function(){
      clearStreak = 0;
      clearStreakTimer = null;
    }, 800);
  }
  function resetClearStreak(){
    clearStreak = 0;
    if (clearStreakTimer){ clearTimeout(clearStreakTimer); clearStreakTimer = null; }
  }

  // clear the hexagram graphic + any pending line/glitch timers (no-op if not shown).
  // Called by endOracle, and by any non-consult key press (so the hex doesn't linger
  // through subsequent calculations).
  function hideHex(){
    if (!hexEl || !hexEl.classList.contains("on")) return;
    hexEl.classList.remove("on");
    hexTimers.forEach(function(t){ clearTimeout(t); });
    hexTimers = [];
    if (lcdEl){
      lcdEl.classList.remove("glitch");
      lcdEl.classList.remove("has-hex");
    }
  }
  // Pie symbol show/hide. The pie is the calc-side companion to the hex graphic:
  // it occupies the same left-most LCD area, but fires only for the π+π = PIE
  // reading. Hidden by any subsequent action (mirroring the way the hex is hidden
  // by any non-consult key) — the pie is a moment, not a permanent state.
  function showPie(){ if (pieEl) pieEl.classList.add("on"); }
  function hidePie(){ if (pieEl) pieEl.classList.remove("on"); }

  // stop any reading in progress: cancel the (gloriously mistimed) LED burst,
  // drop the I·CHING annunciator, settle the LEDs back to dark, and clear
  // the hexagram graphic (with any pending line/glitch timers)
  function endOracle(){
    if (ledMistimer){ clearTimeout(ledMistimer); ledMistimer=null; }
    stopSoup();
    annIching.classList.remove("on");
    ledIdle();
    hideHex();
    hidePie();
  }

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  // "A Suffusion of Yellow" (ORACLES[0]) is THE canonical answer-too-big phrase.
  // Give it a slight edge (~1 in 6) so a first-time user is likely to meet it,
  // without it crowding out the other oracles.
  function pickOracle(){ return (Math.random() < 0.15) ? ORACLES[0] : pick(ORACLES); }

  function render(){
    outEl.classList.remove("phrase","ticker");
    // every oracle phrase uses ONE size — long ones wrap rather than shrink,
    // so the readout never changes size between answers (keeps the illusion)
    if (settled === "phrase") outEl.classList.add("phrase");
    // FLIP_WORDS visual substitution: if the display reads one of the classic
    // four-banger flip-word numbers, render the (slightly-off) flipped text
    // instead. Pure visual — `disp` itself is unchanged, so calc state continues
    // to work on the real number. Skipped when showing a phrase (don't override
    // intentional phrase output).
    outEl.textContent = (settled !== "phrase" && FLIP_WORDS[disp]) ? FLIP_WORDS[disp] : disp;
    annErr.classList.toggle("on", settled === "phrase");
  }

  function showNumber(n){
    // trim float noise (but DON'T clamp digit count — results may spill to a
    // baffling 10 digits even though input is capped at 8; that mismatch is the joke)
    var s = (Math.round(n*1e9)/1e9).toString();
    disp = s; settled = "num"; render();
    oracleStreak = 0;   // a real number breaks the consecutive-Rule-of-4 streak
  }
  function showPhrase(p){ disp = p; settled = "phrase"; render(); }

  function apply(a,o,b){
    switch(o){ case "+":return a+b; case "-":return a-b;
               case "*":return a*b; case "/":return a/b;
               case "%":return a%b; } return b;
  }

  // A calculation only succeeds if the ANSWER stays <= 4. Inputs may be anything.
  // Show an oracle phrase for a too-big result and remember the hidden value.
  // Special cases (checked in order):
  //   1. hidden === 42 → pick from Q42 (Adams' Question pool); arms lucid bypass.
  //   2. hidden in NAMED_NUMBERS → show that specific Adams phrase; no lucid arm.
  //   3. otherwise → random ORACLES phrase.
  function suppressBig(r){
    oracleStreak++;
    if (oracleStreak >= 21){   // Dirk's tea temperature, AND half-a-forty-two
      // 21st consecutive Rule-of-4 hit (Dirk's tea temperature) — the device's
      // pretend-energy-source gives out. BATTERY LOW replaces the oracle entirely;
      // no lastHiddenResult set (no lucid armed), no oracle phrase. Streak resets;
      // a new 21-in-a-row is required to fire again.
      oracleStreak = 0;
      return fireBatteryLow();
    }
    var hidden = Math.round(r*1e9)/1e9;
    lastHiddenResult = hidden;
    if (hidden === 42) return showPhrase(pick(Q42));
    if (NAMED_NUMBERS.hasOwnProperty(hidden)) return showPhrase(NAMED_NUMBERS[hidden]);
    return showPhrase(pickOracle());
  }

  // BATTERY LOW — the device "dies" for ~10 seconds. Shows the phrase on the LCD,
  // then fades both the LCD and the LED bar together (CSS keyframe + opacity
  // transition driven by --battery-die-duration). At the end of the fade, the
  // .dying class is removed (instant snap-back to default opacity) and the device
  // power-cycles to its default state: disp = "0", all session counters reset,
  // LEDs back to idle. During the fade, batteryDying is set; the dispatchers
  // refuse all input. The C key included — no early recovery. The duration
  // is randomized 9000–11500ms per fire so it's never exactly 10s (real
  // batteries don't keep schedule; neither does this fake one).
  function fireBatteryLow(){
    if (piCalcTimer){ clearTimeout(piCalcTimer); piCalcTimer = null; }
    calcKind = null;
    batteryDying = true;
    showPhrase("BATTERY LOW");
    var fadeDuration = 9000 + Math.random() * 2500;
    document.body.style.setProperty("--battery-die-duration", fadeDuration + "ms");
    document.body.classList.add("dying-lcd", "dying-leds");
    //
    // Timeline (pause = same as fade, so total dead time = 2 × fade):
    //   t = 0                   — BATTERY LOW shown, fade begins
    //   t = fadeDuration        — fade complete, everything at opacity 0
    //   t = 2*fade - 2000       — LEDs come back online (sputtering randomly via
    //                              the twinkle pattern for 2s) — "power returns"
    //                              before the LCD does. NO SOS — just chaos.
    //   t = 2*fade              — full wake-up: LCD resets to "0", hard reset
    //                              of session state, LEDs back to idle.
    //
    // The two-stage wake-up (LEDs first, then LCD) is in-character: a real cheap
    // device coming back from a dead battery would sputter on the easy-to-power
    // bits (LEDs) before the more demanding display starts working again.
    setTimeout(function(){
      document.body.classList.remove("dying-leds");
      ledPlay([["twinkle", 2000]]);   // random LED firing — the wake-up show
    }, 2 * fadeDuration - 2000);
    setTimeout(function(){
      // Hard reset BEFORE removing .dying-lcd: clearAll() sets disp="0" and
      // renders, but .dying-lcd keeps the segment opacity at 0 — so the user
      // never sees "BATTERY LOW" snap back to full brightness. Then removing
      // the class lets the new "0" content fade in instantly at full opacity.
      batteryDying = false;
      piPressCount = 0;
      escapeArmed = false;
      clearStreak = 0;
      if (clearStreakTimer){ clearTimeout(clearStreakTimer); clearStreakTimer = null; }
      hideHex();
      hidePie();
      endOracle();
      if (degEl) degEl.textContent = "DEG";
      clearAll();   // disp="0", op/acc/fresh/settled reset, lastHiddenResult cleared
      document.body.classList.remove("dying-lcd");
    }, 2 * fadeDuration);
  }

  // CALIBRATION mode — fired by the 0 Kelvin gate (see doBinary). The device's
  // misguided helpfulness in attempting absolute-zero arithmetic pushes the
  // firmware into a service-mode reading. Opens with the diagnostic line
  // ("Division by absolute zero: Calibration overdue") — cause-and-effect
  // bureaucracy, the device naming exactly what broke. The body is
  // Sirius-Cybernetics officialese: the user is directed to return the unit to
  // the corporation's COMPLAINTS DEPARTMENT (a direct Adams nod — the
  // Complaints Department in Hitchhiker canon exists primarily to ignore
  // complaints), located on the planet Eadrax. The "(IF EXTANT)" parenthetical
  // is the device politely acknowledging that the Complaints Department offices
  // may no longer exist — galactic real estate being what it is — which in turn
  // is why the warranty's third callback (eat the device) reads as the
  // realistic fallback rather than absurd advice. No service date — the
  // original IDEAS framing had one but it was redundant; the date pretended to
  // be useful and wasn't. Same scroll mechanism as the consult reading
  // (marchReading); after the scroll, disp settles on "CAL." until the user
  // clears or does another calc.
  function fireCalibration(){
    var reading = [
      "Division by absolute zero: Calibration overdue",
      "SIRIUS CYBERNETICS CORPORATION",
      "RETURN UNIT TO COMPLAINTS DEPARTMENT OFFICES ON EADRAX (IF EXTANT)",
      "IF UNREACHABLE EATING THE DEVICE REMAIN A VALID OPTION"
    ].join(" · ");
    endOracle();
    ledFor("cast");   // brief LED activity at scroll start, same as consult
    settled = "phrase";
    marchReading(reading, "CAL.");
  }

  // Lucid bypass announces itself first: ~1s flash of an official-sounding
  // confession ("Unapproved Accuracy Mode Activated"), then the real answer.
  // Bureaucratic phrasing — pure Sirius Cybernetics, the corporation formally
  // declaring that the device is operating outside its design specification.
  var lucidFlashTimer = null;
  function flashThenNumber(r){
    if (lucidFlashTimer){ clearTimeout(lucidFlashTimer); }
    showPhrase("Unapproved Accuracy Mode Activated");
    lucidFlashTimer = setTimeout(function(){
      lucidFlashTimer = null;
      showNumber(r);
    }, 1000);
  }

  function doBinary(a,o,b){
    // 0 Kelvin gate — a play on divide-by-zero, where the "zero" is absolute zero
    // expressed in degrees Celsius (-273.15). The device, working in Celsius (DEG
    // annunciator), is asked to divide using 0K as either dividend or divisor;
    // it attempts to comply (misguided helpfulness), and that attempt sends the
    // firmware into Calibration mode. Caught BEFORE the isFinite check so the
    // `-273.15 ÷ 0` direction (which produces -Infinity) is intercepted before
    // falling through to VOID. Both directions: `0 ÷ -273.15` (mathematically
    // 0, a perfectly valid division — the joke is "the device divided by zero
    // anyway, because the zero was in different units") and `-273.15 ÷ 0`
    // (mathematically -Infinity, the real division-by-zero — the joke is "the
    // device's helpful behaviour pushed it past a thermodynamic boundary").
    if (o === "/" && ((a === 0 && b === -273.15) || (a === -273.15 && b === 0))){
      lastHiddenResult = null;
      return fireCalibration();
    }
    var r = apply(a,o,b);
    if (!isFinite(r) || Number.isNaN(r)){
      lastHiddenResult = null;            // VOID also consumes the trigger
      return showPhrase(pick(VOID));
    }
    if (Math.abs(r) > CEILING){
      // Lucid: previous hidden was exactly 42 and this isn't %? Flash the device's
      // official confession ("Unapproved Accuracy Mode Activated") for ~1s, then
      // show the real answer. Bureaucratic phrasing is in-character for Sirius
      // Cybernetics — the corporation officially announcing the spec violation.
      if (o !== "%" && lastHiddenResult === 42){
        lastHiddenResult = null;
        return flashThenNumber(r);
      }
      // Adams' base-13 joke: 6×9 = 42 (the Ultimate Question's literal answer per Adams).
      // The device asserts 42 in words AND arms the lucid trigger as if hidden were 42.
      // Next calc reveals the real answer via lucid bypass — the device commits to its
      // base-13 claim mechanically, even though it computed 54 in base 10. The DEG
      // annunciator flips to "B13" for the duration of the "Forty-two" display — a
      // tiny status-bar confession that the device is, for this moment, in base 13.
      if (o === "*" && ((a === 6 && b === 9) || (a === 9 && b === 6))){
        lastHiddenResult = 42;
        showPhrase("Forty-two");
        if (degEl) degEl.textContent = "B13";
        return;
      }
      // π + π = pie. If both operands are the device's exact π value (3.142857143 =
      // 22/7 rounded to 9 decimals as `constPi` produces it) and the operator is +,
      // the device transforms: π plus π becomes pi-e becomes pie. Self-referentially
      // recommends being eaten, with a warranty callback — a second canon path to
      // the warranty's load-bearing line, separate from the EAT-THE-DEVICE consult
      // reading. To get here the user must press π once, +, π once, = (each π must
      // single-press / not toggle to e, since π is what makes pie). Non-trivial
      // gesture: π is slow, π double-presses give e (different pool). Both
      // deliberate paths are accessible from the calc surface; the device punctuates
      // the arithmetic with a homophone joke, a transformation, and a warranty
      // callback. Catches manually-typed `3.142857143 + 3.142857143` too, which is
      // fine — anyone typing that exact value knows what they're doing.
      //
      // Delivered via marchReading (the consult-flow scroller) rather than showPhrase
      // because the reading is too long to fit the LCD statically — and conceptually
      // this IS a tiny oracle, just triggered by an arithmetic gesture rather than
      // the Red button. After the scroll, the LCD settles on `PIE.` — the device's
      // final word, the dramatic announcement having been made. The `settled` global
      // is set to "phrase" up-front so the equals() cleanup (acc/op reset) sees a
      // consistent state during the async scroll.
      var DEV_PI = Math.round((22/7) * 1e9) / 1e9;   // 3.142857143
      if (o === "+" && a === DEV_PI && b === DEV_PI){
        lastHiddenResult = null;
        settled = "phrase";
        showPie();   // light up the left-most LCD area with the pie symbol
        marchReading(
          "PI + PI = PIE. ORACULON IS NOW EDIBLE. THE WARRANTY DID WARN YOU.",
          "PIE."
        );
        return;
      }
      return suppressBig(r);              // oracle (Q42 if hidden===42, else random ORACLES)
    }
    lastHiddenResult = null;              // showed a number — trigger consumed
    showNumber(r);
  }

  // Scientific functions: present, plausible, often usable (trig in DEGREES).
  var D2R = Math.PI/180;  // the device thinks in degrees, like a polite calculator
  var FN = {
    sin:function(x){return Math.sin(x*D2R);},
    cos:function(x){return Math.cos(x*D2R);},
    tan:function(x){return Math.tan(x*D2R);},
    // √2 is hardcoded to 99/70 — the famous continued-fraction convergent, sibling to
    // the π = 22/7 gag (see constPi). Sirius Cybernetics' maths library "knows" the
    // famous irrationals from a textbook table and serves the rational approximation;
    // every other input goes through real Math.sqrt. Correct to 1.414, diverges at the
    // fourth decimal (1.4142857... vs 1.4142135...). Do not "fix" — those who know, know.
    sqrt:function(x){return x === 2 ? 99/70 : Math.sqrt(x);}, sq:function(x){return x*x;},
    inv:function(x){return 1/x;}, log10:function(x){return Math.log(x)/Math.LN10;}
  };
  function unary(name){
    if (settled==="phrase") return showPhrase(pickOracle());
    var x = parseFloat(disp);
    if (Number.isNaN(x)) return showPhrase(pickOracle());
    // Special case: sqrt of a negative number is imaginary territory, not the
    // generic "void / divide-by-zero" failure. Dedicated phrase pool. Reachable
    // casually via the minus-as-sign quirk (type "-5", press √).
    if (name === "sqrt" && x < 0){
      fresh = true;
      lastHiddenResult = null;
      return showPhrase(pick(IMAGINARY));
    }
    // √2 → 99/70 routed through slowCalcConstant so it shares the ~1s
    // Calculating beat with constPi and the typed-real-constant correction.
    // Consistency across all three wrong-constant productions is the clue:
    // the same delay every time signals that the device has specific opinions
    // about these specific numbers.
    if (name === "sqrt" && x === 2){
      lastHiddenResult = null;
      return slowCalcConstant("1.414285714");
    }
    var r = FN[name](x);
    fresh = true;
    if (!isFinite(r) || Number.isNaN(r)){
      lastHiddenResult = null;
      return showPhrase(pick(VOID));
    }
    // Only the ANSWER must obey the Rule of 4: tan(74)=3.49 passes, tan(80)=5.67 does not.
    if (Math.abs(r) > CEILING){
      // Same 42-lucid bypass as doBinary. Sci functions can fire and arm it,
      // and they also get the "Unapproved Accuracy Mode Activated" flash.
      if (lastHiddenResult === 42){
        lastHiddenResult = null;
        return flashThenNumber(r);
      }
      return suppressBig(r);              // shared path: Q42 for 42, ORACLES otherwise
    }
    lastHiddenResult = null;
    showNumber(r);
  }
  // π is 22/7. Not a bug — Sirius Cybernetics bought a maths library, used the schoolroom
  // approximation, never noticed. Correct to 3.14, diverges at the third decimal (3.142857...
  // vs π's 3.141592...). Anyone who memorised more than "3.14" spots it instantly; everyone
  // else thinks they're seeing π. Do not "fix" — those who know, know.
  //
  // Bonus layer: consecutive presses ping-pong to e ≈ 19/7 = 2.7142857143 (continued-fraction
  // convergent, sibling to 22/7 — same denominator, same "schoolroom approximation" flavour).
  // The device has no e key, but the double-press surfaces the rational it would have used
  // had Sirius Cybernetics remembered Euler's number. See the `piPressCount` declaration above
  // for the slow-calculation / re-calculation theatrics; the value is committed ~1s after press.
  function constPi(){
    piPressCount++;
    var c = (piPressCount % 2 === 1) ? 22/7 : 19/7;
    var phrase = (piPressCount === 1) ? "Calculating..." : "Recalculating...";
    // Reduced-motion: skip the theatrics, commit immediately. To preserve the e
    // easter egg without a visible Calculating phase, use a short decay timer that
    // closes the double-press window after 1s. So reduced-motion users get the same
    // toggle behaviour — press twice fast for e, wait too long and the chain resets.
    if (ledReduce){
      disp = (Math.round(c*1e9)/1e9).toString(); settled="num"; fresh=true; render();
      if (piCalcTimer){ clearTimeout(piCalcTimer); }
      piCalcTimer = setTimeout(function(){ piCalcTimer = null; piPressCount = 0; }, 1000);
      return;
    }
    if (piCalcTimer){ clearTimeout(piCalcTimer); piCalcTimer = null; }
    showPhrase(phrase);
    calcKind = "pi";   // π Calculating — lets π through the gate for toggle access
    var myPhrase = phrase;
    piCalcTimer = setTimeout(function(){
      piCalcTimer = null;
      calcKind = null;
      // Defensive: only commit if the user is still looking at the phrase we set.
      // (With the input gate, no other action can intervene — this is belt-and-
      // suspenders.) If something somehow moved the device off this phrase, no-op.
      if (settled !== "phrase" || disp !== myPhrase) return;
      disp = (Math.round(c*1e9)/1e9).toString(); settled="num"; fresh=true; render();
      // Chain ends on successful commit — the next π press is fresh ("Calculating..."
      // → 22/7), so the double-press requirement is enforced: you must press again
      // BEFORE the value settles to trigger the e swap.
      piPressCount = 0;
    }, 1000);
  }

  // Shared slow-Calculating routine for the wrong-constants family. Used by:
  //   - correctIfRealConstant — when the user types real π/√2/e to the input cap
  //   - unary("sqrt") with x===2 — the device producing its own √2
  // Both fire the same ~1s "Calculating..." beat then commit the device's wrong
  // value. Single-shot (no toggle/ping-pong — that's constPi's territory). While
  // the routine runs, calcKind = "constant" — the dispatchers block ALL keys, no
  // exceptions. The device is "computing" and refuses to be distracted.
  //
  // The shared beat across constPi, correction, and sqrt(2) is the pattern
  // recognizer: any production of a wrong constant takes the same beat, and a
  // mathematically-aware user who notices the consistent timing realises the
  // device has SPECIFIC ideas about those specific numbers. The delay is the
  // clue, not just the disguise.
  function slowCalcConstant(targetStr){
    if (ledReduce){
      disp = targetStr; settled = "num"; fresh = true; render();
      return;
    }
    if (piCalcTimer){ clearTimeout(piCalcTimer); piCalcTimer = null; }
    showPhrase("Calculating...");
    calcKind = "constant";
    piCalcTimer = setTimeout(function(){
      piCalcTimer = null;
      calcKind = null;
      disp = targetStr; settled = "num"; fresh = true; render();
    }, 1000);
  }

  // Silent constant-correction. The device genuinely believes its rational
  // approximations are the correct values and your accurate decimals are the
  // error. If the user has typed the longest user-reachable form of one of the
  // three real constants — π, √2, e to 8 digits, the input cap — the device
  // launches a "Calculating..." routine and commits its own wrong value. From
  // the user's perspective: the last keystroke triggers a brief calculating
  // beat, and the corrected number appears. Same beat as pressing the π key
  // directly, which is the *intended clue*: the device treats these three
  // numbers as objects of computation, not as inputs to accept.
  //
  // Three-member correction family, mirroring the three-member surface family
  // of wrong constants in §3 (π = 22/7, √2 = 99/70, e = 19/7). The constants
  // are the device being wrong quietly; the correction is the device being
  // wrong assertively — and now the slow-Calculating wrapper makes the
  // assertion legible. Doubly wrong-helpful: first the device caps your input
  // at 8 digits (cheap calc), then it rewrites what you typed to its own
  // 10-digit value (polite prude). You typed too few decimals AND too many
  // simultaneously, in the device's opinion.
  //
  // Strict equality only — typing "3.14159" (incomplete) does nothing; only
  // the full 8-digit version fires. The user has to be demonstrably trying
  // to type real-π before the device asserts.
  //
  // Returns true if a correction was triggered (caller should NOT call render —
  // the slow routine handles its own rendering). Returns false on no match.
  function correctIfRealConstant(){
    var target;
    switch (disp){
      case  "3.1415926": target =  "3.142857143"; break;   // real π   →  22/7
      case "-3.1415926": target = "-3.142857143"; break;
      case  "1.4142135": target =  "1.414285714"; break;   // real √2  →  99/70
      case "-1.4142135": target = "-1.414285714"; break;
      case  "2.7182818": target =  "2.714285714"; break;   // real e   →  19/7
      case "-2.7182818": target = "-2.714285714"; break;
      default: return false;
    }
    slowCalcConstant(target);
    return true;
  }

  function inputDigit(d){
    // Pending-negative-sign state: disp is just "-" from a minus-as-sign press
    // (see setOp). The next digit extends it to "-d"; a decimal becomes "-0.".
    if (disp === "-"){
      disp = (d === "." ? "-0." : "-" + d);
      fresh = false; settled = false;
      if (correctIfRealConstant()) return;
      return render();
    }
    if (settled){ disp = (d==="."?"0.":d); settled=false; fresh=false; if (correctIfRealConstant()) return; return render(); }
    if (fresh){ disp = (d==="."?"0.":d); fresh=false; if (correctIfRealConstant()) return; return render(); }
    if (d==="." && disp.indexOf(".")>-1) return;
    if (d!=="." && disp.replace(/[^0-9]/g,"").length>=8){    // 8-digit display is full:
      disp = disp.replace(/\d(?=\D*$)/, d);                  // the last digit just keeps changing (dysfunctional)
      if (correctIfRealConstant()) return;
      return render();
    }
    disp = (disp==="0" && d!==".") ? d : disp + d;
    if (correctIfRealConstant()) return;
    render();
  }
  function del(){
    if (settled || fresh) return;
    disp = disp.length>1 ? disp.slice(0,-1) : "0";
    lastHiddenResult = null;              // editing input is "an action" — clear the 42 trigger
    render();
  }
  function clearAll(){
    disp="0"; acc=null; op=null; fresh=true; settled=false;
    lastHiddenResult = null;              // C resets all hidden state, trigger included
    oracleStreak = 0;                     // C also breaks the BATTERY LOW streak
    render();
  }
  function setOp(o){
    if (settled==="phrase"){ showPhrase("Cannot Operate on Soup"); soupBlink(); return false; } // can't operate on soup
    // Dirk Gently Easter egg: typing "10" then pressing "%" shows the absurd
    // invoice fee from The Holistic Detective Agency. Hijacks the entry-level
    // "10 % X" path (chained modulo with non-10 first operands still works).
    // Display-only — no lucid arming. The % still arms escapeArmed via the
    // dispatcher, so %+Red continues to bypass the cast gate per layer 4.
    if (o === "%" && disp === "10" && op === null){
      lastHiddenResult = null;
      showPhrase("The Holistic Detective Agency Fee");
      return true;
    }
    // Minus-as-sign: pressing − to start a negative-number entry. The display
    // shows just "-" while waiting for a digit. Once a digit is typed (via
    // inputDigit's disp==="-" branch), display becomes "-5" etc, treated as
    // a negative number throughout the calc. Real calculators with no +/- key
    // sometimes overload − this way. Two states fire it:
    //   1. Default state (disp="0", op=null) — fresh negative entry.
    //   2. After a non-minus operator (fresh=true, op set, op !== "-") —
    //      negative-operand entry mid-calc, preserving the pending op. Lets
    //      the user type `0 ÷ -273.15` directly, and other gestures that need
    //      a negative second operand. The op !== "-" guard preserves the
    //      double-minus behaviour for users who do that.
    //   If the user presses something other than a digit after the "-" is set,
    //   the result is harmless (NaN propagates through doBinary to VOID).
    if (o === "-" && ((disp === "0" && op === null) || (fresh && op !== null && op !== "-"))){
      disp = "-";
      fresh = false;
      settled = false;
      render();
      return true;
    }
    var cur = parseFloat(disp);
    if (op!==null && !fresh){ doBinary(acc, op, cur); acc = (settled==="num") ? parseFloat(disp) : cur; }
    else { acc = cur; }
    op = o; fresh = true;
    return true;
  }
  function equals(){
    if (op===null) return false;
    if (settled==="phrase") return false;
    var cur = parseFloat(disp);
    // Rare: the device "thinks for a moment" — ~0.5% of equals presses (1 in
    // ~200), briefly shows "..." then computes. Cheap calculator hesitation, no
    // actual reason. Deliberately scarce so it feels like a glitch, not a feature.
    // Skipped under prefers-reduced-motion to avoid surprise delays.
    if (!ledReduce && Math.random() < 0.005){
      var savedAcc = acc, savedOp = op;
      showPhrase("...");
      setTimeout(function(){
        doBinary(savedAcc, savedOp, cur);
        op = null; fresh = true;
        acc = (settled==="num") ? parseFloat(disp) : null;
      }, 600 + Math.random() * 400);
      return true;
    }
    doBinary(acc, op, cur);
    op = null; fresh = true;
    acc = (settled==="num") ? parseFloat(disp) : null;
    return true;
  }

  // ---- the oracle (cheap, broken-translation I Ching) ----
  // The 128 hexagrams of the DELUXE model (canon has 64; this cheap unit boasts
  // a seventh line, hence twice the wisdom). Indexed by the cast line-pattern
  // 0..127, so the same roll always gives the same hexagram. Each carries a
  // garbled NAME (n) and a signature KING WEN JUDGEMENT (j). Many j-lines are the
  // old OPENERS/MIDDLES, rehoused so nothing good was lost.
  var HEXAGRAMS=[
    {n:"THE DAMP GOOSE",            j:"DIFFICULTY AT THE OUTSET, AS OF A GOOSE UPON THE STAIR."},
    {n:"MILD WICKER",               j:"SMALL THINGS PROSPER; LARGE THINGS ARE MERELY FURNITURE."},
    {n:"WET TUESDAY",               j:"THE DAY IS AUSPICIOUS, BUT ONLY FOR STAYING INDOORS."},
    {n:"THE STUCK DRAWER",          j:"FORCE AVAIL NOTHING HERE. APPLY BISCUIT AND WAIT."},
    {n:"LESSER SOUP",               j:"NOURISHMENT ARRIVE, THOUGH THINNER THAN WAS HOPED."},
    {n:"GREATER SOUP",              j:"ABUNDANCE OF BROTH. THE SUPERIOR PERSON BRING OWN BOWL."},
    {n:"THE ANXIOUS SPOON",         j:"MOVEMENT IS CORRECT, YET THE SPOON FORESEE SPILLAGE."},
    {n:"OBSTRUCTION BY CARDIGAN",   j:"PROGRESS IS WOOLLY. UNBUTTON BEFORE PROCEEDING."},
    {n:"THE LOITERING OX",          j:"THE OX IS STRONG, BUT THE OX DO NOT ANSWER THE EMAIL."},
    {n:"SMALL TAMING OF THE BISCUIT",j:"RESTRAINT SUCCEED. THE BISCUIT IS NOT YET DUNKED."},
    {n:"THE RELUCTANT BICYCLE",     j:"FORTUNE IS LIKE A BICYCLE: GOOD WHEN MOVING, OFTEN STOLEN."},
    {n:"FELT, ABUNDANT",            j:"A SOFT YEAR. NOTHING SHARP WILL BE PERMITTED."},
    {n:"THE THIRD GOOSE",           j:"TWO GEESE AGREE; THE THIRD GOOSE KNOW SOMETHING."},
    {n:"RETREAT OF THE CUTLERY",    j:"WITHDRAW THE FORKS. THE FEAST IS POSTPONED."},
    {n:"PROGRESS, SLIGHTLY DAMP",   j:"ADVANCE IS FAVOURED. BRING A TOWEL REGARDLESS."},
    {n:"THE WAITING ROOM",          j:"PATIENCE. THE NUMBER YOU ARE IS NOT YET CALLED."},
    {n:"BEIGE ASCENDING",           j:"A MODEST COLOUR RISE TO POWER. DO NOT RESIST."},
    {n:"THE OVERFILLED KETTLE",     j:"PRESSURE BUILD. THE SUPERIOR PERSON REMOVE FROM HEAT."},
    {n:"GENTLE CONFUSION",          j:"WHEN NO GOOD ANSWER EXIST, THE CAPITAL LETTER WILL SERVE."},
    {n:"THE CLOSING DOOR",          j:"AN OPPORTUNITY NARROW. INSERT FOOT WITH CAUTION."},
    {n:"MOUNTAIN, BUSY",            j:"THE MOUNTAIN DO NOT COME TO YOU; THE MOUNTAIN IS BUSY."},
    {n:"THE LONG PAUSE",            j:"NOTHING HAPPEN. SHORTLY, NOTHING CONTINUE TO HAPPEN."},
    {n:"DIFFICULTY WITH WICKER",    j:"THE PLAN UNRAVEL AT THE CORNERS. REWEAVE GENTLY."},
    {n:"THE MISPLACED KEY",         j:"RETURN IS FAVOURABLE, ONCE THE POCKET IS LOCATED."},
    {n:"ABUNDANCE OF PIGEONS",      j:"MANY SMALL FORTUNES GATHER, NONE OF THEM INVITED."},
    {n:"THE TEPID DECISION",        j:"NEITHER HOT NOR COLD. DRINK IT ANYWAY."},
    {n:"THE DEPARTING GEESE",       j:"WHAT LEAVE IN FORMATION RETURN OUT OF STEP."},
    {n:"MODEST OTTER",              j:"GREAT BURDEN UPON A SMALL BACK. THE OTTER COPE."},
    {n:"THE FIRM SUGGESTION",       j:"A DOOR MARKED PUSH. IT WAS ALWAYS PUSH."},
    {n:"LUKEWARM TRIUMPH",          j:"VICTORY ARRIVE, FAINTLY, AND SLIGHTLY TO THE LEFT."},
    {n:"THE BORROWED UMBRELLA",     j:"SHELTER IS AVAILABLE BUT BELONG TO ANOTHER."},
    {n:"CRISIS OF SPOONS",          j:"DURATION IS FAVOURED, YET THE DRAWER RATTLE OMINOUSLY."},
    {n:"THE PATIENT TURNIP",        j:"RETREAT UNDERGROUND. EMERGE WHEN THE SOUP REQUIRE YOU."},
    {n:"NEARLY A DUCK",             j:"ONE IS NEVER TRULY ALONE WHO POSSESS A RUBBER DUCK."},
    {n:"THE INWARD GRUMBLE",        j:"PROGRESS IS MADE, AUDIBLY, UNDER THE BREATH."},
    {n:"SUDDEN WEDNESDAY",          j:"THE LIGHT IS DIMMED. CONCEAL YOUR BRILLIANCE AND YOUR SANDWICH."},
    {n:"THE OPTIMISTIC GRAVEL",     j:"SMALL STONES BELIEVE THEY ARE A PATH. ENCOURAGE THEM."},
    {n:"A SURPLUS OF MONDAY",       j:"THE WEEK BEGIN TWICE. NEITHER TIME IS CONVENIENT."},
    {n:"THE HESITANT BRIDGE",       j:"CROSSING IS PERMITTED; THE BRIDGE WOULD RATHER YOU DID NOT."},
    {n:"GREATER DAMPNESS",          j:"RELEASE IS NEAR. WRING OUT THE SITUATION FIRST."},
    {n:"THE DIMINISHING TEAPOT",    j:"DECREASE BELOW; THE POUR GROW WEAKER BUT SINCERER."},
    {n:"THE INCREASING TEAPOT",     j:"INCREASE ABOVE; REFILL FREELY, THE LEAVES FORGIVE."},
    {n:"RESOLUTION OF FELT",        j:"A BREAKTHROUGH, MUFFLED. THE ANNOUNCEMENT IS SOFT."},
    {n:"THE UNINVITED MEETING",     j:"COMING TO MEET. BRING NOTHING; EXPECT A CLIPBOARD."},
    {n:"GATHERING OF OWLS",         j:"THREE OWLS ASSEMBLE. THE MISUNDERSTANDING IS QUORATE."},
    {n:"THE TURNIP RISING",         j:"PUSHING UPWARD. THE TURNIP IS COMMITTED NOW."},
    {n:"EXHAUSTION BY COMMITTEE",   j:"OPPRESSION. THE WATER BELOW, THE MEETING ABOVE."},
    {n:"THE COMMUNAL WELL",         j:"THE WELL IS SHARED. THE ROPE, REGRETTABLY, IS NOT."},
    {n:"MOULTING",                  j:"REVOLUTION. THE PHOENIX RISE, MOLT, AND IMMEDIATELY REGRET IT."},
    {n:"THE OVERFULL VESSEL",       j:"THE CAULDRON IS FINE. THE HANDLE, LESS SO."},
    {n:"THUNDER, MILD",             j:"SHOCK ARRIVE. IT IS THE PLUMBING AFTER ALL."},
    {n:"THE STILL CARDIGAN",        j:"KEEPING STILL. THE MOUNTAIN HAVE PUT ITS FEET UP."},
    {n:"SLOW WICKER",               j:"DEVELOPMENT IS GRADUAL, AS MOSS UPON A DECKCHAIR."},
    {n:"THE MARRYING SPOON",        j:"THE YOUNGER SPOON WED ABOVE ITS DRAWER. AWKWARD."},
    {n:"ABUNDANCE, BRIEF",          j:"FULLNESS AT NOON; BRING THE WASHING IN BY THREE."},
    {n:"THE WANDERING SANDWICH",    j:"YOU GO NOT WHERE YOU INTEND, YET ARRIVE WHERE YOU WAS NEEDED."},
    {n:"GENTLE DRAUGHT",            j:"THE WIND ENTER TWICE. CLOSE THE SECOND WINDOW."},
    {n:"THE DOUBLED TUESDAY",       j:"JOY UPON JOY, BOTH OF THEM SLIGHTLY DAMP."},
    {n:"DISPERSAL OF PIGEONS",      j:"DISSOLUTION. WHAT GATHERED NOW FLAP OFF SEVERALLY."},
    {n:"THE FIRM DRAWER",           j:"LIMITATION. A DRAWER THAT WILL NOT QUITE CLOSE IS WISDOM."},
    {n:"INNER PIGEON",              j:"INNER TRUTH. THE PIGEON BELIEVE YOU; THIS IS ENOUGH."},
    {n:"THE SMALL EXCESS",          j:"SLIGHTLY TOO MUCH. THE HAT IS ONE SIZE HOPEFUL."},
    {n:"SOUP, COMPLETED",           j:"AFTER COMPLETION, THE BOWL IS EMPTY AND SO ARE YOU."},
    {n:"SOUP, PENDING",             j:"BEFORE COMPLETION, THE FOX CROSS THE ICE, SOUP IN PAW."},
    {n:"THE BONUS GOOSE",           j:"HEXAGRAM NOT FOUND IN NATURE. ENJOY RESPONSIBLY."},
    {n:"OVERFLOW OF WEDNESDAY",     j:"THE WEEK EXCEED SPECIFICATION. RETURN SURPLUS DAYS."},
    {n:"THE SPARE DRAWER",          j:"AN EXTRA COMPARTMENT OPEN. IT CONTAIN ANOTHER DRAWER."},
    {n:"THE REHEATED DECISION",     j:"THE DECISION REHEAT. IT IS WORSE, BUT FAMILIAR."},
    {n:"THE INVERTED OTTER",        j:"BURDEN FLOAT UPWARD. THE OTTER IS ALARMED BUT COPING."},
    {n:"A QUANTITY OF DUSK",        j:"NEITHER DAY NOR NIGHT. INVOICES MAY STILL BE SENT."},
    {n:"THE LATE ARRIVAL",          j:"GREAT SUCCESS ARRIVE WHEN LEAST CONVENIENT."},
    {n:"THE PRUDENT UMBRELLA",      j:"THE SUPERIOR PERSON CARRY UMBRELLA ON DRY DAY ALSO."},
    {n:"THE EMPTY ROOM",            j:"HEAVEN SMILE UPON THE ONE WHO ALREADY LEFT THE ROOM."},
    {n:"THE LOW ENTHUSIASM",        j:"WATER FIND THE LOWEST PLACE; SO ALSO YOUR ENTHUSIASM."},
    {n:"THE INEDIBLE TURNIP",       j:"THE WISE FARMER PLANT THE TURNIP HE CANNOT EAT."},
    {n:"FORTUNE FROM BEHIND",       j:"GREAT FORTUNE APPROACH FROM BEHIND, ON A BICYCLE."},
    {n:"THE NARROW HEAVEN",         j:"THE HEAVEN IS WIDE, BUT THE DOOR IS NARROW AND SLIGHTLY STUCK."},
    {n:"SUFFUSION, LESSER",         j:"A HINT OF YELLOW. THE FULL COLOUR IS SOLD ELSEWHERE."},
    {n:"NOT FOR YOU SPECIFICALLY",  j:"AUSPICIOUS! THOUGH PERHAPS NOT FOR YOU SPECIFICALLY."},
    {n:"THE EASTERN PLUMBING",      j:"THE DRAGON STIR IN THE EAST, OR IT IS THE PLUMBING."},
    {n:"THE EXTRA HEXAGRAM",        j:"SIXTY-FOUR WAS INSUFFICIENT. HERE IS ONE MORE, COMPLIMENTARY."},
    {n:"HALF OF NOTHING",           j:"A GOOD BEGINNING IS HALF OF NOTHING IN PARTICULAR."},
    {n:"THE CLAIMED WIND",          j:"WHEN THE WIND CHANGE, THE WISE PERSON CLAIM IT WAS THEIR IDEA."},
    {n:"THE WRONG ADDRESS",         j:"PROSPERITY IS NEAR, BUT IT HAVE THE WRONG ADDRESS."},
    {n:"THE EARLY CONFUSION",       j:"THE SUPERIOR PERSON ARRIVE EARLY AND THEN WAIT, CONFUSED."},
    {n:"THE EXAGGERATING SKY",      j:"THE SKY DECLARE GREAT THINGS; THE SKY ALSO EXAGGERATE."},
    {n:"THE NUMBER TOO BIG",        j:"IN THE BEGINNING WAS THE NUMBER. THE NUMBER WAS TOO BIG."},
    {n:"THE UNREACHED TASK",        j:"TODAY IS FAVOURABLE FOR THINGS YOU WILL NOT GET AROUND TO."},
    {n:"THE DISTANT BELL",          j:"A DISTANT BELL RING. IT IS PROBABLY FOR SOMEONE ELSE."},
    {n:"THE RESERVED ANCESTOR",     j:"THE ANCESTOR APPROVE, WITH SEVERAL RESERVATIONS."},
    {n:"THE SILENT DOG",            j:"A SMALL DOG OBSERVE THE LARGE WHEEL AND SAY NOTHING."},
    {n:"THE THIRD CUP",             j:"THE THIRD CUP OF TEA REMEMBER THE FIRST."},
    {n:"THE LOST DRAWER",           j:"WHAT IS LOST IN THE DRAWER WAS NEVER TRULY YOURS."},
    {n:"THE BUSY VALLEY",           j:"TWO MOUNTAIN DISAGREE; THE VALLEY DO ALL THE WORK."},
    {n:"THE OTHER POCKET",          j:"THE ANSWER YOU SEEK IS IN THE OTHER POCKET."},
    {n:"THE WINDOW DOOR",           j:"A DOOR THAT IS BOTH OPEN AND SHUT IS CALLED A WINDOW."},
    {n:"THE UNKNOWING FISH",        j:"THE FISH DO NOT KNOW IT IS WET; YOU DO NOT KNOW IT IS TUESDAY."},
    {n:"THE ROAD TO NOWHERE",       j:"A ROAD THAT GO NOWHERE IS STILL A PLACE TO STAND."},
    {n:"THE ATTENTION CANDLE",      j:"THE CANDLE CURSE THE DARKNESS, THEN ENJOY THE ATTENTION."},
    {n:"THE SANDWICH HAND",         j:"ONE HAND CLAP; THE OTHER HAND IS HOLDING A SANDWICH."},
    {n:"THE RELIEVED WORM",         j:"THE EARLY BIRD IS TIRED. THE WORM IS RELIEVED."},
    {n:"THE UNINVITED SEVENTH",     j:"LINE SEVEN ARRIVE WITHOUT INVITATION. THE OUTCOME WILL END POORLY. THIS IS NOT UNUSUAL."},
    {n:"THE NOISY VESSEL",          j:"THE EMPTY VESSEL MAKE THE MOST NOISE, AND THE BEST SOUP."},
    {n:"THE FINDING ELBOW",         j:"WHAT THE EYE DO NOT SEE, THE ELBOW EVENTUALLY FIND."},
    {n:"THE LONG SIT DOWN",         j:"THE GREAT JOURNEY BEGIN WITH A STEP, THEN A LONG SIT DOWN."},
    {n:"THE KEYLESS LOCK",          j:"A LOCK WITHOUT A KEY IS MERELY A FIRM SUGGESTION."},
    {n:"THE UNWATCHED SHADOW",      j:"THE SHADOW IS LONGEST WHEN NO ONE IS LOOKING FOR IT."},
    {n:"THE WATERY PROMISE",        j:"A PROMISE IS LIKE A CLOUD: IMPRESSIVE, AND LARGELY WATER."},
    {n:"THE COMPLAINING BRIDGE",    j:"THE BRIDGE COMPLAIN OF EVERY FOOTSTEP, YET MISS THEM WHEN GONE."},
    {n:"THE MISSPELT THING",        j:"TO NAME THE THING IS TO LOSE IT; TO MISSPELL IT IS WORSE."},
    {n:"THE WAYLESS MIRROR",        j:"THE MIRROR SHOW EVERYTHING EXCEPT THE WAY OUT."},
    {n:"A SUFFUSION OF BEIGE",      j:"NOT QUITE YELLOW. THE ECONOMY MODEL OF REVELATION."},
    {n:"THE PHILOSOPHICAL SPOON",   j:"THE SPOON QUESTION THE SOUP, AND IS CORRECT TO."},
    {n:"OWLS, RECONCILED",          j:"THE MISUNDERSTANDING IS RESOLVED. NOBODY IS SATISFIED."},
    {n:"THE PATIENT BUS",           j:"AWAIT THE SIGN. IT HAVE WHEELS. THE DECADE IS UNSPECIFIED."},
    {n:"GREATER GRAVEL",            j:"A MULTITUDE OF SMALL CERTAINTIES. NONE LOAD-BEARING."},
    {n:"THE DAMP DECISION",         j:"CHOOSE, BUT THE PAPER HAVE GONE SOFT BENEATH THE PEN."},
    {n:"A WEDNESDAY, IMPROVED",     j:"THE MIDWEEK IS UPGRADED. SIDE EFFECT INCLUDE THURSDAY."},
    {n:"THE HOPEFUL CARDIGAN",      j:"IT BELIEVE IT IS ARMOUR. LET IT TRY."},
    {n:"SOUP RECONSIDERED",         j:"THE BROTH REVISE ITS POSITION. IT IS NOW A SAUCE."},
    {n:"THE FINAL GOOSE",           j:"THE LAST OF THEM DEPART. THE POND EXHALE."},
    {n:"A REMNANT OF TUESDAY",      j:"SOME TUESDAY REMAIN. REFRIGERATE AFTER OPENING."},
    {n:"THE STOIC TURNIP",          j:"BURIED, CONTENT, AWAITING A SOUP THAT MAY NOT COME."},
    {n:"WICKER OF THE ANCESTORS",   j:"THEY APPROVE THE BASKET, WITH SEVERAL RESERVATIONS."},
    {n:"THE LAST DRAWER",           j:"IT OPEN ONTO THE PREVIOUS DRAWER. IT IS DRAWERS ALL THE WAY."},
    {n:"A SUFFUSION OF OCHRE",      j:"YELLOW'S DISAPPOINTED COUSIN ARRIVE INSTEAD."},
    {n:"THE PENULTIMATE PIGEON",    j:"ALMOST THE LAST BIRD. IT IS IN NO HURRY."},
    {n:"THE DELUXE HEXAGRAM",       j:"YOU HAVE REACHED 128. THE PREMIUM MODEL PROMISE NOTHING MORE."}
  ];
  var ADVICE=[
    "ADVISE: DO NOTHING, BUT DO IT WITH CONVICTION.",
    "ADVISE: CROSS THE GREAT WATER ONLY IF BRIDGE IS PRESENT.",
    "ADVISE: PERSEVERE. OR, ALTERNATIVELY, STOP.",
    "ADVISE: CONSULT A MORE EXPENSIVE MODEL.",
    "ADVISE: AWAIT THE SIGN. IT MAY BE A BUS.",
    "ADVISE: TRUST NO SPOON UNTIL THE SOUP IS PROVEN.",
    "ADVISE: PROCEED, BUT APOLOGISE IN ADVANCE.",
    "ADVISE: SAY YES. IF DISASTER, SAY YOU MEANT NO.",
    "ADVISE: THE BEST TIME WAS YESTERDAY. THE SECOND BEST IS LUNCH.",
    "ADVISE: TURN IT OFF AND ON AGAIN. THIS APPLY TO THE SOUL ALSO.",
    "ADVISE: DO NOT FEED THE DECISION AFTER MIDNIGHT.",
    "ADVISE: WALK SLOWLY, SO THE TROUBLE THINK YOU ARE NOT FLEEING.",
    "ADVISE: KEEP THE RECEIPT. FATE OFFER NO REFUND, BUT TRY.",
    "ADVISE: WHEN IN DOUBT, LOOK BUSY AND HOLD A CLIPBOARD.",
    "ADVISE: THE DOOR IS PUSH. IT WAS ALWAYS PUSH.",
    "ADVISE: TRUST THE PROCESS, EXCEPT THE PART YOU INVENTED.",
    "ADVISE: GIVE GENEROUSLY, BUT NOT THE GOOD SOUP.",
    "ADVISE: SLEEP ON IT. THE PROBLEM ALSO NEED REST.",
    "ADVISE: BE THE CHANGE, BUT KEEP SOME COINS BACK.",
    "ADVISE: IF THE PATH IS BLOCKED, ADMIRE THE BLOCKAGE INSTEAD.",
    "ADVISE: SPEAK LESS. THE GOOSE RESPECT THIS.",
    "ADVISE: BUY MORE BATTERIES. THE PROPHECY IS THIRSTY.",
    // a few Douglas Adams nods, rephrased (never verbatim)
    "ADVISE: IN LARGE FRIENDLY LETTERS — DO NOT BE ALARMED.",
    "ADVISE: JUDGE ALL ADVICE BY THE LIFE OF THE ONE WHO GIVE IT. THIS DEVICE INCLUDED.",
    "ADVISE: PROCURE A STRONG DRINK AND, IDEALLY, A PEER GROUP."
  ];
  var CHGNOTES=[
    "CHANGING LINE WARN: BEWARE MONDAY DISGUISED AS FRIDAY.",
    "CHANGING LINE SPEAK: THE GOOSE KNOW, BUT WILL NOT TELL.",
    "CHANGING LINE: ALL THING PASS, ESPECIALLY THIS OFFER.",
    "CHANGING LINE: WHAT RISE MUST ALSO PURCHASE BATTERIES.",
    "CHANGING LINE WARN: THE SMALL DECISION HIDE THE LARGE ONE.",
    "CHANGING LINE SPEAK: A KEY IS TURNING, BUT NOT YOUR KEY.",
    "CHANGING LINE: THE RIVER CHANGE ITS MIND ABOUT THE BRIDGE.",
    "CHANGING LINE WARN: DO NOT TRUST THE TUESDAY THAT SMILE.",
    "CHANGING LINE: WHAT YOU CARRY UPHILL YOU MUST EXPLAIN DOWNHILL.",
    "CHANGING LINE SPEAK: THE SPOON REMEMBER WHAT THE FORK FORGET.",
    "CHANGING LINE: A WINDOW OPEN SOMEWHERE; A DRAUGHT IS COMING.",
    "CHANGING LINE WARN: THE THIRD GOOSE IS THE ONE TO WATCH.",
    "CHANGING LINE: MOVEMENT IS GOOD, EXCEPT WHEN IT IS A BUS.",
    "CHANGING LINE SPEAK: YOU ALREADY KNOW. THE DEVICE MERELY AGREE.",
    // a couple of Douglas Adams nods, rephrased (never verbatim)
    "CHANGING LINE: SO LONG — AND GRATITUDE FOR THE ABUNDANT FISH.",
    "CHANGING LINE WARN: AGAINST OBSESSION ONE CANNOT WIN; THEY CARE, YOU DO NOT."
  ];
  var STILL="STILLNESS. THE HEXAGRAM DO NOT MOVE. NEITHER SHOULD YOU.";

  // "LINE 6 CHANGES" / "LINES 2 & 5 CHANGE" — name which lines moved (1 = bottom)
  function lineLabel(arr){
    if (arr.length===1) return "LINE "+arr[0]+" CHANGES:";
    var last=arr[arr.length-1], head=arr.slice(0,-1).join(", ");
    return "LINES "+head+" & "+last+" CHANGE:";
  }

  // Scroll a long text ONCE across the tiny LCD, then settle on `rest`.
  // No printout — the whole reading lives here, exactly as in the book. `onMid`
  // fires partway through (the LEDs' gloriously badly-timed celebration).
  function marchReading(text, rest, onMid){
    annErr.classList.remove("on");
    outEl.classList.remove("phrase");
    outEl.classList.add("ticker");
    outEl.innerHTML = '<span class="run"></span>';
    var run = outEl.firstChild;
    run.textContent = text;
    var secs = Math.max(7, text.length*0.08);    // unhurried on purpose — the wait IS the point
    run.style.animationDuration = secs + "s";
    if (typeof onMid === "function" && !ledReduce){
      ledMistimer = setTimeout(onMid, Math.round(secs*1000*(0.32 + Math.random()*0.38)));
    }
    run.addEventListener("animationend", function ae(){
      run.removeEventListener("animationend", ae);
      showPhrase(rest);                         // settle on the cast hexagram
    });
  }

  function rollLine(){
    // three "coins": yin(2)/yang(3) each -> 6,7,8,9
    var s=0; for (var i=0;i<3;i++) s += (Math.random()<0.5?2:3);
    // 6 old-yin(changing), 7 yang, 8 yin, 9 old-yang(changing)
    if (s===6) return {yang:false,chg:true};
    if (s===9) return {yang:true, chg:true};
    return {yang:(s===7), chg:false};
  }

  function consult(){
    // Consulting the oracle is an "action" that breaks the 42-lucid chain.
    lastHiddenResult = null;
    // Consume the escape flag (% directly before this consult bypasses the gate)
    // and advance the gate counter (unless we're bypassing).
    var bypass = escapeArmed;
    escapeArmed = false;
    var forceNormal = false;
    if (!bypass){
      if (gateCounter < 6){ forceNormal = true; gateCounter++; }
      else                { forceNormal = false; gateCounter = 0; }  // 7th cast: natural 50/50
    }

    // Roll 7 coin flips; re-roll the whole cast if the gate requires the result
    // to stay in the 1..64 range. (Same-roll-yields-same-hexagram determinism
    // is preserved: only the FINAL roll is the cast — invisible to the user.)
    var lines, chgLines, bits;
    do {
      lines = []; chgLines = []; bits = 0;
      for (var i=0;i<7;i++){
        var L = rollLine(); lines.push(L);
        if (L.chg) chgLines.push(i+1);     // line 1 = bottom, 7 = top
        bits |= (L.yang?1:0) << i;         // lines[0]=LSB, lines[6]=MSB ("line 7" = top)
                                            // bits >= 64 ⟺ top line yang ⟺ deluxe display
      }
    } while (forceNormal && bits >= 64);

    var changing = chgLines.length>0;
    var hx  = HEXAGRAMS[bits];              // deterministic: same roll -> same hexagram
    var num = bits + 1;                     // 1..128 (not King Wen order — a cheap model)
    var name = hx.n;
    var isDeluxe = bits >= 64;              // hexagram 65..128 → glitch + 7-line render

    // The whole reading, composed as one line to SCROLL across the tiny LCD
    // (no printout — faithful to the book). Hybrid: the hexagram's fixed King Wen
    // judgement, a random ADVISE line, and the Duke of Chou note when a line moves.
    var parts = [
      "易 No."+num+"  "+name,
      changing ? "※ IN MOTION" : "· AT REST",
      "THE JUDGEMENT OF KING WEN:",
      hx.j,
      pick(ADVICE)
    ];
    if (changing){
      parts.push(lineLabel(chgLines));
      parts.push("THE COMMENTARY OF THE DUKE OF CHOU:");
      parts.push(pick(CHGNOTES));
    } else {
      parts.push(STILL);
    }
    // EAT-THE-DEVICE easter egg. Vanishingly rare conjunction: cast lands on LESSER
    // SOUP (the device's nourishment hexagram — its universe-equivalent of classical
    // I Ching hex 27 Yi/Nourishment, in the "soup" idiom that runs through everything)
    // AND exactly one line changes, and that line is line 6 (the top of the 6-line
    // hex). Combined probability ≈ 1/64 × ~6% ≈ 1 in ~1000 consults. When it lands,
    // the device's mouth-hexagram with the top line moving reads as "nourishment from
    // above" — and the device, taking the answer literally, suggests the only
    // nourishment within reach: itself. The booklet warning "Do not eat the device
    // even if it advise so" is the keystone — it was load-bearing all along, waiting
    // for THIS reading to fire. Replaces the entire reading composed above; the
    // accuracy footer below still appends as normal.
    if (bits === 4 && chgLines.length === 1 && chgLines[0] === 6){
      parts = [
        "易 No."+num+"  "+name,
        "※ IN MOTION",
        "THE JUDGEMENT OF KING WEN:",
        "THE MOUTH HAS SPOKEN. NOURISHMENT IS REQUIRE.",
        "EAT THE DEVICE.",
        "LINE 6 CHANGES:",
        "THE COMMENTARY OF THE DUKE OF CHOU:",
        "THE WARRANTY DOES NOT COVER THIS. THE WARRANTY DID WARN YOU."
      ];
    }
    // Accuracy is randomised per reading — uniform int 11–71%. Range bounds chosen to
    // avoid the comedy extremes: above 71 the device would be bragging; below 11 it
    // would be admitting parody-level uselessness. Both endpoints undercut the joke,
    // which depends on the figure feeling like a precise-but-arbitrary corporate
    // certification pulled from nowhere. The original 39 is still in the pool.
    parts.push("READING CERTIFIED " + (Math.floor(Math.random() * 61) + 11) + "% ACCURATE · 易經計算機 CT-64 · NO REFUND");
    var full = parts.join(" · ");

    endOracle();                            // cancel any prior reading/LED timer
    annIching.classList.add("on");          // 易 I·CHING lights for the duration
    ledFor("cast");                         // brief "doing something" scan at the very start
    // Show a "Calculating..." phrase (or a future Adams variant) on the right side of the LCD
    // while the cast renders on the left. Faithful to the book's I Ching calculator. Set
    // textContent directly (NOT showPhrase) so we don't flip `settled` to "phrase" — the
    // user should be able to interrupt with a real keypress without triggering soup.
    outEl.classList.remove("ticker");
    outEl.classList.add("phrase");
    outEl.textContent = pick(CALC_PHRASES);
    // Draw the hexagram first; when the stack is complete (and after the glitch +
    // 7th line for deluxe casts), THEN start the marquee. The reading isn't
    // "read" until the device has finished pretending to cast it.
    renderHexagram(lines, isDeluxe, num, function(){
      marchReading(full, "易 No."+num+"  "+name, function(){
        ledFor("consult");                  // ...then the lights party right over the solemn bit
      });
    });
  }

  // Draw the cast hexagram at the left of the LCD, lines appearing bottom-up.
  // For "deluxe" numbers (65..128), after 6 lines are drawn the LCD glitches
  // (lcdPanic animation), then a 7th line appears on top — crooked, faint, and
  // blinking irregularly (lcdStruggle animation). The device's own visible
  // confession that it shouldn't be drawing a 7-line "hexagram" at all.
  function renderHexagram(lines, isDeluxe, num, onComplete){
    if (!hexEl || !hexLinesEl || !hexNumEl){
      if (typeof onComplete === "function") onComplete();
      return;
    }
    hexLinesEl.innerHTML = "";
    hexNumEl.textContent = "No." + num;

    // .hex-lines uses flex-direction:column-reverse, so the FIRST child sits
    // at the bottom. We append lines[0]..lines[5] (and lines[6] if deluxe),
    // which renders bottom→top exactly matching the "line 1 = bottom" labeling.
    var visibleCount = isDeluxe ? 7 : 6;
    for (var i=0; i<visibleCount; i++){
      var lineEl = document.createElement("div");
      lineEl.className = "hex-line " + (lines[i].yang ? "yang" : "yin");
      if (i === 6) lineEl.classList.add("deluxe");
      hexLinesEl.appendChild(lineEl);
    }

    hexEl.classList.add("on");
    if (lcdEl) lcdEl.classList.add("has-hex");  // gates the .out.phrase clip rule

    // Stagger fade-in bottom→top. 160ms apart — quick but readable.
    var stepMs = 160;
    var children = hexLinesEl.children;
    for (var j=0; j<Math.min(children.length, 6); j++){
      (function(idx){
        hexTimers.push(setTimeout(function(){
          if (children[idx]) children[idx].classList.add("show");
        }, idx * stepMs));
      })(j);
    }

    // Compute when the stack is fully drawn (non-deluxe: after line 6;
    // deluxe: after glitch + 7th line). marchReading fires after that beat.
    var stackCompleteAt = 6 * stepMs + 200;  // last line + small breath

    // Deluxe finale: brief pause after line 6, LCD panics, then on recovery
    // the 7th line appears (with the lcdStruggle blink animation).
    if (isDeluxe){
      var sixDrawnAt = 6 * stepMs + 80;
      hexTimers.push(setTimeout(function(){
        if (lcdEl) lcdEl.classList.add("glitch");
      }, sixDrawnAt));
      hexTimers.push(setTimeout(function(){
        if (lcdEl) lcdEl.classList.remove("glitch");
        if (children[6]) children[6].classList.add("show");
      }, sixDrawnAt + 1250));
      stackCompleteAt = sixDrawnAt + 1250 + 250;  // 7th line shown + breath
    }

    if (typeof onComplete === "function"){
      hexTimers.push(setTimeout(onComplete, stackCompleteAt));
    }
  }

  // ---- wiring ----
  document.querySelectorAll(".key").forEach(function(b){
    b.addEventListener("click", function(){
      // BATTERY LOW seal: the device is dead during the fade. Nothing registers.
      if (batteryDying) return;
      // Calculating gate. When calcKind is set, a "Calculating..."/"Recalculating..."
      // phrase is on screen and most input is refused. Two cases:
      //   calcKind === "pi"       — the π key is the ONE exception; pressing it
      //                             toggles to e (or back). Other keys blocked.
      //   calcKind === "constant" — NOTHING is allowed through. The device is
      //                             "computing" a wrong constant and refuses to
      //                             be distracted. Includes typed real-constant
      //                             correction and sqrt(2).
      // Pie symbol and hex graphic stay as they are — no state should change at all.
      if (calcKind && !(calcKind === "pi" && b.dataset.fn === "pi")) return;
      // any non-consult key clears the hexagram graphic (it lingered only as long as the cast was the topic)
      if (b.dataset.act !== "iching") hideHex();
      // the pie symbol clears on ANY key (including consult — a fresh oracle reading
      // is a new topic; pie was a moment, not a persistent state)
      hidePie();
      // restore the DEG annunciator (the 6×9 path may have flipped it to "B13" — that
      // override only lasts until the next user action, which is this one)
      if (degEl) degEl.textContent = "DEG";
      if (b.dataset.d!==undefined){ inputDigit(b.dataset.d); ledFor("digit"); }
      else if (b.dataset.op!==undefined){ if(setOp(b.dataset.op)) ledFor("op"); }
      else if (b.dataset.fn!==undefined){ if(b.dataset.fn==="pi") constPi(); else unary(b.dataset.fn); ledFor("fn"); }
      else if (b.dataset.act==="equals"){ if(equals()) ledFor("equals"); }
      else if (b.dataset.act==="clear"){ clearAll(); endOracle(); ledFor("clear"); }
      else if (b.dataset.act==="del"){ del(); ledFor("digit"); }
      else if (b.dataset.act==="iching") consult();   /* consult scrolls the reading on the LCD */
      // Escape sequence: % arms the gate-bypass for the NEXT consult; any other
      // key clears it. (consult() reads & clears escapeArmed at its start.)
      escapeArmed = (b.dataset.op === "%");
      // π-double-press easter egg: any non-π action resets the consecutive-press
      // counter, so the next π press starts fresh ("Calculating..." → π=22/7) rather
      // than continuing the ping-pong toward e. The pending timer (if any) survives
      // and self-checks before committing; see constPi's defensive guard.
      if (b.dataset.fn !== "pi") piPressCount = 0;
      // C-mashing streak: every C ticks it up (within the 800ms window); any
      // other key resets to zero. Hits 5 → easter egg phrase fires.
      if (b.dataset.act === "clear") trackClearStreak(); else resetClearStreak();
    });
  });

  // keyboard support
  window.addEventListener("keydown", function(e){
    var k=e.key;
    // BATTERY LOW seal (keyboard side): device is dead, nothing registers.
    if (batteryDying){ e.preventDefault(); return; }
    // Calculating gate (keyboard side): keyboard has no π shortcut, so during ANY
    // Calculating routine (pi OR constant), ignore ALL keypresses.
    if (calcKind){ e.preventDefault(); return; }
    // same hex-clearing rule for keyboard input (excluding the consult shortcuts)
    if (k!=="?" && k!=="i" && k!=="I") hideHex();
    // pie clears on any keypress (no keyboard shortcut would preserve it)
    hidePie();
    // same DEG-restoration rule — the B13 override only persists until the next user action
    if (degEl) degEl.textContent = "DEG";
    if (/[0-9.]/.test(k)){ inputDigit(k); ledFor("digit"); }
    else if (k==="+"||k==="-"){ if(setOp(k)) ledFor("op"); }
    else if (k==="*"||k==="x"||k==="X"){ if(setOp("*")) ledFor("op"); }
    else if (k==="/") { e.preventDefault(); if(setOp("/")) ledFor("op"); }
    else if (k==="%") { if(setOp("%")) ledFor("op"); }
    else if (k==="Enter"||k==="=") { e.preventDefault(); if(equals()) ledFor("equals"); }
    else if (k==="Backspace"){ del(); ledFor("digit"); }
    else if (k==="Escape"||k==="c"||k==="C"){ clearAll(); endOracle(); ledFor("clear"); }
    else if (k==="?"||k==="i"||k==="I") consult();
    // Escape sequence (keyboard side): same rule as the click handler.
    escapeArmed = (k === "%");
    // π-double-press easter egg: keyboard has no π shortcut, so any keypress is
    // by definition a non-π action and resets the consecutive-press counter.
    piPressCount = 0;
    // C-mashing streak (keyboard side): Esc/c/C count as clear; anything else resets.
    if (k==="Escape"||k==="c"||k==="C") trackClearStreak(); else resetClearStreak();
  });

  // manual modal
  var modal=document.getElementById("modal");
  document.getElementById("manualBtn").addEventListener("click",function(){modal.classList.add("open");});
  document.getElementById("closeBtn").addEventListener("click",function(){modal.classList.remove("open");});
  modal.addEventListener("click",function(e){ if(e.target===modal) modal.classList.remove("open"); });

  // ---- the "solar strip" green LEDs: rest dark, run a classic pattern on activity ----
  var ledBar = document.querySelector(".solar"), leds = [], LED_N = 18, ledGain = [];
  if (ledBar){ for (var li=0; li<LED_N; li++){ var ld=document.createElement("span"); ld.className="led"; ledBar.appendChild(ld); leds.push(ld); ledGain.push(0.7 + Math.random()*0.3); } } // each cheap LED a touch brighter/dimmer
  function ledShow(v){ for (var i=0;i<LED_N;i++) leds[i].style.setProperty("--on",((v[i]||0)*ledGain[i]).toFixed(3)); }
  function ledTri(x,max){ var p=max*2; x%=p; return x<=max?x:p-x; }   // 0..max..0 triangle wave
  var LEDP = {   // each returns a brightness array for animation step s
    larson: function(s){ var pos=ledTri(s,LED_N-1); return leds.map(function(_,i){ return Math.max(.04,1-Math.abs(i-pos)*.55); }); },
    chase:  function(s){ var pos=s%LED_N; return leds.map(function(_,i){ var d=(i-pos+LED_N)%LED_N; return d===0?1:d===1?.35:d===2?.12:.04; }); },
    fill:   function(s){ var lvl=ledTri(s,LED_N); return leds.map(function(_,i){ return i<lvl?1:.05; }); },
    blink:  function(s){ var v=(s%2)?1:.05; return leds.map(function(){ return v; }); },
    twinkle:function(){ return leds.map(function(){ return Math.random()<.24?(.45+Math.random()*.55):.05; }); }
  };
  var ledReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ledTimer = null, ledMistimer = null, soupTimer = null;  // ledMistimer: mid-reading burst; soupTimer: the sad soup error-blink
  function ledIdle(){ if(ledTimer){ clearInterval(ledTimer); ledTimer=null; } if(leds.length) ledShow(leds.map(function(){ return .04; })); }
  function ledPlay(seq){   // seq = [[patternName, ms], ...] played in order, then idle
    if (!leds.length || ledReduce) return;
    stopSoup();   // any deliberate animation cancels the soup error-blink
    if (ledTimer){ clearInterval(ledTimer); ledTimer=null; }
    var qi=0;
    (function start(){
      if (qi>=seq.length){ ledIdle(); return; }
      var fn=LEDP[seq[qi][0]], ticks=Math.max(1,Math.round(seq[qi][1]/80)), s=0, t=0;
      ledTimer=setInterval(function(){
        ledShow(fn(s)); s++; t++;
        if (t>=ticks){ clearInterval(ledTimer); ledTimer=null; qi++; start(); }
      },80);
    })();
  }
  function ledFor(kind){   // organized: each kind of action has its own signature
    if (ledReduce) return;
    switch(kind){
      case "op":      ledPlay([["larson",560]]); break;
      case "fn":      ledPlay([["chase",560]]); break;
      case "equals":  ledPlay([["larson",900]]); break;
      case "clear":   ledPlay([["blink",340]]); break;
      case "cast":    ledPlay([["larson",800]]); break;                 // "casting the lines" — a brief scan at the start
      case "consult": ledPlay([["fill",760],["twinkle",1500]]); break;  // build-up, then sparkle
      default:        ledPlay([["chase",440]]); break;                  // digit / del
    }
  }
  // While "Cannot Operate on Soup" is shown, the 3rd-from-last LED blinks like an
  // error indicator that's barely working as one: irregular, mostly short pauses
  // (1–5s) with the odd long sulk (up to 20s), the rest of the bar dark.
  function soupPause(){ return Math.random()<0.8 ? 1000+Math.random()*4000 : 5000+Math.random()*15000; }
  function soupBlink(){
    stopSoup();
    if (ledTimer){ clearInterval(ledTimer); ledTimer=null; }
    if (ledMistimer){ clearTimeout(ledMistimer); ledMistimer=null; }
    if (ledReduce || leds.length < 3) return;
    var idx = LED_N - 3;
    function frame(on){ var a=[]; for (var i=0;i<LED_N;i++) a[i]=.04; if(on) a[idx]=1; ledShow(a); }
    (function cycle(){
      frame(true);
      soupTimer = setTimeout(function(){
        frame(false);
        soupTimer = setTimeout(cycle, soupPause());   // irregular pause, then twitch again
      }, 150);
    })();
  }
  function stopSoup(){ if (soupTimer){ clearTimeout(soupTimer); soupTimer=null; } }

  // reduced-motion: a gentle static glow; otherwise rest dark until used
  if (ledReduce && leds.length) ledShow(leds.map(function(_,i){ return i%2?.4:.1; }));
  else ledIdle();

  render();

  /* DEG → RAD micro-flicker. The annunciator briefly flips to "RAD" for a beat
     then back, but nothing actually changes (trig still runs in degrees). Pure
     LCD-driver glitch — the kind of thing a cheap display does at random intervals.
     Skipped under prefers-reduced-motion. Skipped if DEG is currently overridden
     (e.g. by the 6×9 "B13" mode — don't stomp that). Roughly once per ~4 minutes. */
  setInterval(function(){
    if (!degEl || ledReduce) return;
    if (degEl.textContent !== "DEG") return;
    if (Math.random() > 0.015) return;
    degEl.textContent = "RAD";
    setTimeout(function(){
      if (degEl.textContent === "RAD") degEl.textContent = "DEG";
    }, 110 + Math.random() * 100);
  }, 3500);

  /* PWA: register the service worker so the device runs offline once installed.
     Kept here (not inline in the HTML) so the page needs no script-src 'unsafe-inline'. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-only is fine */ });
    });
  }

  /* PWA install prompt — capture the event, show a banner, let the user decide. */
  var _installPrompt = null;

  window.addEventListener("beforeinstallprompt", function(e) {
    e.preventDefault();
    if (localStorage.getItem("oraculon_install_dismissed")) return;
    _installPrompt = e;
    var banner = document.getElementById("installBanner");
    if (banner) banner.classList.add("visible");
  });

  window.addEventListener("appinstalled", function() {
    _installPrompt = null;
    var banner = document.getElementById("installBanner");
    if (banner) banner.classList.remove("visible");
    localStorage.setItem("oraculon_install_dismissed", "1");
  });

  var installBtn = document.getElementById("installBtn");
  if (installBtn) installBtn.addEventListener("click", function() {
    if (!_installPrompt) return;
    _installPrompt.prompt();
    _installPrompt.userChoice.then(function() {
      _installPrompt = null;
      var banner = document.getElementById("installBanner");
      if (banner) banner.classList.remove("visible");
    });
  });

  var dismissBtn = document.getElementById("dismissBtn");
  if (dismissBtn) dismissBtn.addEventListener("click", function() {
    var banner = document.getElementById("installBanner");
    if (banner) banner.classList.remove("visible");
    localStorage.setItem("oraculon_install_dismissed", "1");
  });
})();
