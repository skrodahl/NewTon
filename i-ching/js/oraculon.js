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
    "A Suffusion of Yellow",   // the canonical one
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
    // a couple of Douglas Adams nods, rephrased (never verbatim)
    "Reality, Frequently Approximate",
    "The Approximate Speed of Bad News"
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

  // stop any reading in progress: cancel the (gloriously mistimed) LED burst,
  // drop the I·CHING annunciator, and settle the LEDs back to dark
  function endOracle(){
    if (ledMistimer){ clearTimeout(ledMistimer); ledMistimer=null; }
    stopSoup();
    annIching.classList.remove("on");
    ledIdle();
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
    outEl.textContent = disp;
    annErr.classList.toggle("on", settled === "phrase");
  }

  function showNumber(n){
    // trim float noise (but DON'T clamp digit count — results may spill to a
    // baffling 10 digits even though input is capped at 8; that mismatch is the joke)
    var s = (Math.round(n*1e9)/1e9).toString();
    disp = s; settled = "num"; render();
  }
  function showPhrase(p){ disp = p; settled = "phrase"; render(); }

  function apply(a,o,b){
    switch(o){ case "+":return a+b; case "-":return a-b;
               case "*":return a*b; case "/":return a/b; } return b;
  }

  // A calculation only succeeds if the ANSWER stays <= 4. Inputs may be anything.
  function doBinary(a,o,b){
    var r = apply(a,o,b);
    if (!isFinite(r) || Number.isNaN(r)) return showPhrase(pick(VOID));
    if (Math.abs(r) > CEILING) return showPhrase(pickOracle());
    showNumber(r);
  }

  // Scientific functions: present, plausible, often usable (trig in DEGREES).
  var D2R = Math.PI/180;  // the device thinks in degrees, like a polite calculator
  var FN = {
    sin:function(x){return Math.sin(x*D2R);},
    cos:function(x){return Math.cos(x*D2R);},
    tan:function(x){return Math.tan(x*D2R);},
    sqrt:Math.sqrt, sq:function(x){return x*x;},
    inv:function(x){return 1/x;}, log10:function(x){return Math.log(x)/Math.LN10;}
  };
  function unary(name){
    if (settled==="phrase") return showPhrase(pickOracle());
    var x = parseFloat(disp);
    if (Number.isNaN(x)) return showPhrase(pickOracle());
    var r = FN[name](x);
    fresh = true;
    if (!isFinite(r) || Number.isNaN(r)) return showPhrase(pick(VOID));
    // Only the ANSWER must obey the Rule of 4: tan(74)=3.49 passes, tan(80)=5.67 does not.
    if (Math.abs(r) > CEILING) return showPhrase(pickOracle());
    showNumber(r);
  }
  function constPi(){ disp = (Math.round(Math.PI*1e9)/1e9).toString(); settled="num"; fresh=true; render(); }

  function inputDigit(d){
    if (settled){ disp = (d==="."?"0.":d); settled=false; fresh=false; return render(); }
    if (fresh){ disp = (d==="."?"0.":d); fresh=false; return render(); }
    if (d==="." && disp.indexOf(".")>-1) return;
    if (d!=="." && disp.replace(/[^0-9]/g,"").length>=8){    // 8-digit display is full:
      disp = disp.replace(/\d(?=\D*$)/, d);                  // the last digit just keeps changing (dysfunctional)
      return render();
    }
    disp = (disp==="0" && d!==".") ? d : disp + d;
    render();
  }
  function del(){
    if (settled || fresh) return;
    disp = disp.length>1 ? disp.slice(0,-1) : "0";
    render();
  }
  function clearAll(){
    disp="0"; acc=null; op=null; fresh=true; settled=false; render();
  }
  function setOp(o){
    if (settled==="phrase"){ showPhrase("Cannot Operate on Soup"); soupBlink(); return false; } // can't operate on soup
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
    {n:"THE EQUAL WORDS",           j:"A WISE WORD AND A LOUD WORD WEIGH THE SAME ON TUESDAY."},
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
    var lines=[], chgLines=[], bits=0;
    for (var i=0;i<7;i++){                  // SEVEN lines — the deluxe model's bonus line
      var L=rollLine(); lines.push(L);
      if (L.chg) chgLines.push(i+1);        // line 1 = bottom, 7 = top
      bits = (bits<<1) | (L.yang?1:0);      // 0..127 from line pattern
    }
    var changing = chgLines.length>0;
    var hx  = HEXAGRAMS[bits];              // deterministic: same roll -> same hexagram
    var num = bits + 1;                     // 1..128 (not King Wen order — a cheap model)
    var name = hx.n;

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
    parts.push("READING CERTIFIED 39% ACCURATE · 易經計算機 CT-64 · NO REFUND");
    var full = parts.join(" · ");

    endOracle();                            // cancel any prior reading/LED timer
    annIching.classList.add("on");          // 易 I·CHING lights for the duration
    ledFor("cast");                         // brief "doing something" scan at the very start
    marchReading(full, "易 No."+num+"  "+name, function(){
      ledFor("consult");                    // ...then the lights party right over the solemn bit
    });
  }

  // ---- wiring ----
  document.querySelectorAll(".key").forEach(function(b){
    b.addEventListener("click", function(){
      if (b.dataset.d!==undefined){ inputDigit(b.dataset.d); ledFor("digit"); }
      else if (b.dataset.op!==undefined){ if(setOp(b.dataset.op)) ledFor("op"); }
      else if (b.dataset.fn!==undefined){ if(b.dataset.fn==="pi") constPi(); else unary(b.dataset.fn); ledFor("fn"); }
      else if (b.dataset.act==="equals"){ if(equals()) ledFor("equals"); }
      else if (b.dataset.act==="clear"){ clearAll(); endOracle(); ledFor("clear"); }
      else if (b.dataset.act==="del"){ del(); ledFor("digit"); }
      else if (b.dataset.act==="iching") consult();   /* consult scrolls the reading on the LCD */
    });
  });

  // keyboard support
  window.addEventListener("keydown", function(e){
    var k=e.key;
    if (/[0-9.]/.test(k)){ inputDigit(k); ledFor("digit"); }
    else if (k==="+"||k==="-"){ if(setOp(k)) ledFor("op"); }
    else if (k==="*"||k==="x"||k==="X"){ if(setOp("*")) ledFor("op"); }
    else if (k==="/") { e.preventDefault(); if(setOp("/")) ledFor("op"); }
    else if (k==="Enter"||k==="=") { e.preventDefault(); if(equals()) ledFor("equals"); }
    else if (k==="Backspace"){ del(); ledFor("digit"); }
    else if (k==="Escape"||k==="c"||k==="C"){ clearAll(); endOracle(); ledFor("clear"); }
    else if (k==="?"||k==="i"||k==="I") consult();
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

  /* PWA: register the service worker so the device runs offline once installed.
     Kept here (not inline in the HTML) so the page needs no script-src 'unsafe-inline'. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-only is fine */ });
    });
  }
})();
