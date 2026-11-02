/* The tutorial screen, wired to the real engine. The layout and the styling are
   base.css, which is that screen verbatim; the changes are mock.css; this file
   only fills it with real numbers.

   Nothing here is scenery. Every figure, name, deal and sentence comes from
   engine.global.js and findings.js. */
(function(){
"use strict";
var E = window.ENGINE, FIND;

/* FINDINGS READ THE PLAN'S PAY LINES, NOT THE ENGINE'S CONSTANTS.

   `findings.js` takes its 18 dependencies by injection, and three of them are
   the retention gate, the retention target and the reps-at-quota bar. Injected
   straight off the engine they are frozen at 88 / 95 / 60, so a pulled lever
   would move the tiles and the tables while all 84 places the findings read
   those numbers went on quoting the old ones. Rebuilding FIND against the
   plan is what makes every finding follow a lever with no edits to any of
   the 84.

   AT BASELINE THIS CHANGES NOTHING: the plan's three fields are set from the
   same constants, and json-check compares them on every answer set. The
   rebuild is cached on the three values, so it happens once unless they move.
   `retentionPay` and `participationPay` are wrapped rather than replaced,
   because the engine's is the ONE definition and a second one in here is the
   bug those functions' own comments warn about. */
var FIND_ON = null;
function syncFindings(p){
  var key = p ? [p.retFloor, p.retFull, p.partTarget].join("|") : "base";
  if (FIND && FIND_ON === key) return;
  /* NOT WHILE THE HANDLE IS MOVING. Rebuilding the whole finding set on every
     pointermove is the one expensive thing a drag can do, and the spec says
     findings are recomputed on release anyway. The release path clears the
     flag and renders again, so the deferral can never be the final state. */
  if (DRAGGING) return;
  var o = {};
  makeFindings.DEPS.forEach(function(n){ o[n] = E[n]; });
  if (p){
    if (p.retFloor   != null) o.RET_FLOOR = p.retFloor;
    if (p.retFull    != null) o.RET_FULL = p.retFull;
    if (p.partTarget != null) o.PARTICIPATION_TARGET = p.partTarget;
    o.retentionPay     = function(r, v){ return E.retentionPay(r, v, p, P); };
    o.participationPay = function(a, v){ return E.participationPay(a, v, p, P); };
  }
  FIND = makeFindings(o);
  FIND_ON = key;
}
syncFindings(null);

var ST = {preset:"full", week:6, role:"revops", who:null, sort:null, open:{}, type:"",
          csCol:"ret",
          onlyX:false,
          sel:null,
          /* A MANAGER'S ROW CLICK FILTERS ONE PANEL, it does not repoint the
             screen. Separate from `sel` on purpose: RevOps selection drives the
             tiles, the deals and the findings together, and overloading one
             flag with two meanings is how the next person reading this gets it
             wrong. Javier, 14 Oct. */
          pick:null};
var P, L, S;
/* THE THREE PAY LINES, AS THE LIVE PLAN HAS THEM.

   Chunk 1 gave the engine functions the ability to be told a different gate,
   target or bar. It did not make anybody tell them, so the retention and
   reps-at-quota levers moved the handle and nothing else: every call site
   here still read the frozen constant off E. Thirty-nine reads in this file
   and twenty-nine in cards.js, all swapped in one pass on 20 Oct.

   Functions, not values, because P is rebuilt on every render and a captured
   number would be one render stale from the moment a lever moved. They fall
   back to the engine's constants when there is no plan yet, which is the
   state during the first render. */
function RF(){  return (P && P.retFloor   != null) ? P.retFloor   : E.RET_FLOOR; }
function RFU(){ return (P && P.retFull    != null) ? P.retFull    : E.RET_FULL; }
function PT(){  return (P && P.partTarget != null) ? P.partTarget : E.PARTICIPATION_TARGET; }
/* THE PLAN AS DESIGNED, always, whatever the levers say. Two jobs, and both
   are bugs if P is used instead.

   IT DEALS THE QUARTER. `buildLedger` reads p.quota, p.acv, p.capacity,
   p.spread and nine other derived fields, so building it from the levered
   plan re-deals the quarter: drag quota and different deals close, in
   different weeks, for different amounts. The spec has said since 23 Sep that
   nothing a lever does re-deals the quarter, and "the same deals close in the
   same weeks" is the comparison the levers exist to make. Dealt from P0,
   measured against P.

   IT ANCHORS THE LEVER RANGES. Quota's range is half to double the plan's own
   quota, and reading that off the levered plan makes it chase itself: each
   render re-derives the range from the moved value, so one drag to 85% took
   $150K a quarter to $2.02M in four steps. */
var P0;
/* The baseline quarter and a per-render cache of its findings. See build(). */
var S0 = null, BASE_ROWS = {};
/* The week runs 1 to 13 AND THEN ONE MORE STEP: the quarter closed. Week 13 is
   not the end of the story, it is the last week deals can land in; closed is
   when the numbers are final, commission is owed and the cards switch to the
   past tense. The proof sheet has always had that extra notch and this did not. */
var SP, SP2;  /* last week and the one before, so a card can say what MOVED and
                 whether the movement itself is speeding up or slowing down */
/* ===================================================================
   THE PLAN COMES OUT OF commission_rules.json, NOT OUT OF THE ENGINE.

   Decided 4 Oct and built 20 Oct. The JSON is meant to be the brain of the
   shipped application, and until something renders from it the only thing
   standing behind it is a checker. `json-check.js` compares it to the engine
   on 401,945 answer sets, which is strong, but a checker and a screen fail
   differently: this is the JSON being READ by the thing a person looks at.

   WHAT THE JSON OWNS: every plan field and every resolved answer. That is
   what `json-check` compares, field by field and exactly.

   WHAT IT DOES NOT OWN: `flags` and `roles`. Scoped out 5 Oct, and
   `rules-engine.js` says so at the top: findings stay in the engine as tested
   code. The engine still produces both, so `E.buildPlan` still runs and the
   two halves are assembled below. Running both is not waste, it is what makes
   the comparison below possible.

   IF THE TWO DISAGREE the console says so, with console.warn, naming the
   fields. A stale `rules.global.js` is the obvious way this breaks and it would
   otherwise break silently, with the screen showing numbers no checker ever
   saw. This was the dev bar's job until the bar came out for production,
   29 Oct; the console is not user-facing, so the alarm moved there rather than
   being left to compare and report nothing. Javier's call.
   =================================================================== */
/* ===================================================================
   THE FOUR WHAT-IFS.

   `null` means baseline. A lever holds a DERIVED FIELD NAME and a value, and
   `rules-engine.buildPlan` applies it as that field is derived, so everything
   computed from it follows: move quota and capacity, deals needed, team quota
   and expected all move too.

   ONE STATE, EVERYWHERE. A lever changes the plan, not a view, and there is
   only one plan, so this lives here and not on ST.role. Nothing resets on a
   view switch. The CONTROLS are only on RevOps and the CEO, because that is
   where the authority to re-rate a plan sits; the STATE follows the reader
   into every view, which is the whole point: watching which rep a quota
   change bites is the reason to pull it. Spec, 23 Sep.

   RANGES ARE RELATIVE WHERE THE BASELINE VARIES. Quota spans half to double
   the plan's own quota, because "what if quota were 20% higher" is the
   question and a fixed $2M ceiling is absurd on a two-rep plan. The other
   three are absolute, because a retention gate and a cost ceiling mean the
   same thing on every plan.

   THE RETENTION LEVER MOVES ONE HANDLE AND TWO LINES. It holds the seven
   points between gate and target, because the width of that band is what a
   point of churn is worth and widening it silently re-prices every renewal
   conversation. Spec, 23 Sep. Hence `retFull = retFloor + BAND`. */
var LV = {quota: null, partTarget: null, retFloor: null, guardrail: null};
var RET_BAND = 0.07;
var DRAGGING = false;

/* EVERY BASELINE AND EVERY RANGE COMES OFF P0, NEVER P. Read off the live
   plan they move with the lever, and a range that chases its own handle is
   not a range. */
function leverSpecs(){
  var B = P0 || P || {};
  var q0 = B.quota || 600000;
  return {
    "lever-quota": {f:"quota", lo:q0*0.5, hi:q0*2, step:q0*0.05,
      val:function(){ return LV.quota == null ? q0 : LV.quota; },
      set:function(v){ LV.quota = v; },
      text:function(v){ return E.moneyK(v/4) + " each"; }},
    "lever-reps":  {f:"partTarget", lo:0.30, hi:1.00, step:0.05,
      val:function(){ return LV.partTarget == null ? B.partTarget : LV.partTarget; },
      set:function(v){ LV.partTarget = v; },
      text:function(v){ return pct0(v); }},
    "lever-ret":   {f:"retFloor", lo:0.80, hi:0.93, step:0.01,
      val:function(){ return LV.retFloor == null ? B.retFloor : LV.retFloor; },
      set:function(v){ LV.retFloor = v; },
      text:function(v){ return pct0(v) + " / " + pct0(v + RET_BAND); }},
    "lever-ceil":  {f:"guardrail", lo:0.10, hi:0.35, step:0.01,
      val:function(){ return LV.guardrail == null ? B.guardrail : LV.guardrail; },
      set:function(v){ LV.guardrail = v; },
      text:function(v){ return pct0(v); }}
  };
}
function leverOverrides(){
  if (LV.quota == null && LV.partTarget == null &&
      LV.retFloor == null && LV.guardrail == null) return null;
  var o = {};
  if (LV.quota      != null) o.quota      = LV.quota;
  if (LV.partTarget != null) o.partTarget = LV.partTarget;
  if (LV.guardrail  != null) o.guardrail  = LV.guardrail;
  if (LV.retFloor   != null){ o.retFloor = LV.retFloor;
                              o.retFull  = LV.retFloor + RET_BAND; }
  return o;
}
function leversMoved(){ return !!leverOverrides(); }

/* WHAT THE LINE SAYS. One clause per moved lever, each naming the value it
   moved FROM, which is the half that makes it a comparison rather than an
   announcement. Spec, 23 Sep: "naming which levers moved and what they moved
   from, with one control to put them all back."

   The order is the levers' own left-to-right order, so the sentence reads in
   the order the handles sit. The retention clause names both lines, because
   one handle moves two and hiding the target would be a quiet lie. */
function whatIfClauses(){
  var B = P0 || {}, out = [];
  if (LV.quota != null)
    out.push("quota is " + E.moneyK(LV.quota / 4) + " a quarter instead of " +
             E.moneyK(B.quota / 4));
  if (LV.partTarget != null)
    out.push("the reps-at-quota bar is " + pct0(LV.partTarget) + " instead of " +
             pct0(B.partTarget));
  if (LV.retFloor != null)
    out.push("retention runs " + pct0(LV.retFloor) + " to " + pct0(LV.retFloor + RET_BAND) +
             " instead of " + pct0(B.retFloor) + " to " + pct0(B.retFull));
  if (LV.guardrail != null)
    out.push("the cost ceiling is " + pct0(LV.guardrail) + " instead of " +
             pct0(B.guardrail));
  return out;
}
function whatIfSentence(){
  var c = whatIfClauses();
  if (!c.length) return "";
  /* A comma before the final "and" even with only two clauses. Each clause
     carries its own "instead of", so "$150K and retention runs 82%" ran two
     comparisons together into one breath. */
  var body = c.length === 1 ? c[0]
    : c.slice(0, -1).join(", ") + ", and " + c[c.length - 1];
  /* Capitalised here rather than in each clause, because only the first one
     starts the sentence and which one that is depends on what was moved. */
  return body.charAt(0).toUpperCase() + body.slice(1) + ".";
}
function paintWhatIf(){
  var n = el("whatif"); if (!n) return;
  if (!leversMoved()){ n.hidden = true; n.innerHTML = ""; return; }
  n.hidden = false;
  n.innerHTML = '<b>This is a what-if, not the plan.</b> ' + esc(whatIfSentence()) +
                ' <a href="#" id="whatif-reset">Back to the plan as designed</a>';
}
function resetLevers(){ LV = {quota:null, partTarget:null, retFloor:null, guardrail:null}; }
/* THE LINK WORKS NOW, and until 27 Oct it did not. It was deliberately inert:
   "there is no questionnaire behind this page to return to", which was true
   when it was written on 22 Oct and stopped being true the moment the
   questionnaire and the simulator became one page. The merge enabled it and
   nobody went back and wired it, so Javier clicked it and nothing happened.

   WHERE IT GOES. The same place the finding's own "Change what's driving this"
   goes: the answers, narrowed to the answers behind this finding. Not all
   twenty. This line is a one-sentence summary of a finding sitting on the plan
   view, so the two controls have to land in the same place or the reader learns
   they are different things.

   HOW THE FINDING IS FOUND. A flag carries no id, so it is matched on its
   heading, named here rather than buried in the lookup. That is a string match
   and string matches rot, so `layer-check` clicks this link and fails if the
   answers come back empty: a renamed finding breaks the build rather than
   quietly making the link inert again, which is the exact failure being fixed. */
var CAUSE_FINDING = { capacity: "This quota cannot be worked as written" };

function simLineFinding(){
  var c = simCauses();
  if (!c.length || !P || !P.flags) return null;
  var want = CAUSE_FINDING[c[0]];
  var hit = P.flags.filter(function(f){ return f.h === want; })[0];
  return (hit && hit.src && hit.src.length) ? hit : null;
}

document.addEventListener("click", function(e){
  if (!e.target || e.target.id !== "simline-link") return;
  e.preventDefault();
  var W = window.WIZARD;
  if (!W) return;                                  /* the console opened on its own */
  var f = simLineFinding();
  /* All twenty is the fallback, not the intent. A reader who clicks a link
     labelled "Change an answer" and gets nothing is worse off than one who gets
     a longer list than they needed. */
  if (f && W.fixAnswers) W.fixAnswers(f.src, f.h);
  else if (W.openAnswers) W.openAnswers();
});

/* ---- THE SIMULATOR LINE ------------------------------------------------
   Spec: `wizard-copy.md` Part 4 "The simulator line", settled over several
   rounds in September and never built, because `comp-plan-wizard-v3.html` has no
   simulator behind its plan and so no quarter for the line to connect to. The
   mock-up is the only place it can exist until the dev project builds it.

   ALWAYS EXACTLY ONE LINE, exactly one link, above the levers, on every
   persona, not dismissible, never a modal, never stacked however many things
   are wrong. Its job is NOT to explain the plan: the plan view did that. Its
   job is to connect a finding the reader has already seen to the numbers now in
   front of them, which the plan could not do because there was no quarter when
   it was written.

   IT DOES NOT FIRE ON EVERY RED, and that is the sharpest thing in the spec.
   Red means the plan will hurt you, not that the quarter will look strange, and
   the two come apart constantly: a plan paying for expansion over new logos
   produces a perfectly normal-looking quarter and shows its damage in net
   revenue retention two years later. Capacity is the one case a quarter of data
   CAN show, so capacity is the set. Measured 22 Oct over 4,000 answer sets: red
   capacity is 19% of plans, and of the presets only `#mixed` has it, at 0.72.

   RED ONLY, deliberately. Amber capacity, 0.75 to 0.99, is 6% of plans and
   means the quota runs tight, not that the screen is about to be misread: the
   team lands at 85 to 99% of quota, which looks like a normal quarter because it
   is one. `#miss` sits there at 0.84 and correctly gets no line. Amber would
   also need a sentence nobody has written, and the spec gives none.

   NEAR, NOT AT, and it is one word carrying a real distinction. The sentence
   quotes a PLAN figure and then points at a table of QUARTER figures, and the
   two are not the same measurement. `p.capacity` is one rep's ceiling against
   one rep's quota. The table underneath is the whole company's closed revenue
   against the whole company's quota, every carrier in it and not only the AEs.
   On the plan Javier was reading that is 53.33% in the sentence and $581,000
   against $1,125,000, 51.6%, in the table. They sit beside each other because
   the same quota drives both, and they separate as the headcount lever moves,
   because capacity is per rep and does not move with it. "at" promised a number
   the table was never going to show, and he read the two, saw 53 and 52, and
   asked whether the maths was wrong. It is not; the word was. Javier, 26 Oct:
   "I do like lands near 53%."

   EVERY FIGURE IS THE PLAN'S, NOT THE QUARTER'S. The share the team lands near
   is p.capacity, the fraction of quota the cycle physically allows, so the line
   reads the same in week 1 and at the close and never argues with the week
   lever. That is the spec's own point: capacity is knowable from the answers
   alone.

   "benchmark ceiling", Javier's word, 22 Oct, and it is load-bearing. The
   ceiling is CAP_DEALS, an industry figure; an SMB team closing twelve a month
   reads a bare "ceiling of 20" as the tool being wrong about their business and
   stops trusting it. */
/* TWO CONDITIONS, NOT ONE, and the second is the whole point. The ratio alone
   fires on single-digit deal counts where it cannot carry the precision of the
   sentence it writes: at a ceiling of 6, one extra deal moves the quarter 12
   points, so "lands at 72%" reads as a forecast off a number that is really 6
   deals give or take one.

   Measured over 6,000 answer sets, two thirds of red capacity was that shape,
   mid-market plans short by an average of 2.3 deals against a ceiling of 6. And
   the ratio gets the ORDER wrong, which is what settled it: `#miss` needs 23.8
   deals against a ceiling of 20, short by 3.8, and stays silent at 0.84, while
   `#mixed` is short by 2.3 and is told the plan cannot be worked. The bigger
   absolute gap says nothing and the smaller one shouts.

   Lowering the ratio cannot fix that, because the ratio is the thing that is
   wrong. So the line also requires enough deals for a percentage to mean
   anything. Javier, 22 Oct, choosing this over softening the sentence, which
   would have put the line at odds with the plan-view capacity finding that
   quotes the same precision.

   Consequence he accepted knowingly: no preset reaches it any more, so the line
   is invisible in the mock-up. He had already seen it on `#mixed`. */
var SIM_CAP_RED  = 0.75;
var SIM_MIN_DEALS = 10;
function simCauses(){
  var out = [];
  if (P && P.capacity != null && P.capacity < SIM_CAP_RED &&
      (P.dealsPerRepQtr || 0) >= SIM_MIN_DEALS) out.push("capacity");
  return out;
}
function simLineHTML(){
  var c = simCauses();
  if (!c.length) return "";
  var need = P.dealsPerRepQtr || 0;
  /* Deal counts print to one decimal below ten, the rule the capacity finding
     already follows, so "8.3 deals" does not become "8". */
  var needTxt = need < 10 ? need.toFixed(1) : String(Math.round(need));
  var capTxt  = P.capDeals < 10 ? String(P.capDeals) : String(Math.round(P.capDeals));
  var landed  = pct0(P.capacity);
  /* One cause and several causes are two different sentences in the spec, not
     one with a clause bolted on. Only capacity is in the set today, so the
     second shape is unreachable; it is built because the set is meant to grow
     and a half-built shape is how copy nobody approved ends up on screen. */
  var body = c.length === 1
    ? "This plan cannot be worked as written. It needs " + needTxt +
      " closed deals a quarter from every rep against a benchmark ceiling of " +
      capTxt + ", which is why the team below lands near " + landed + "."
    : wordN(c.length) + " things about this plan distort the quarter below, the largest " +
      "being a quota that needs " + needTxt + " deals a quarter per rep against a " +
      "benchmark ceiling of " + capTxt + ".";
  return esc(body) + ' <a href="#" id="simline-link">Change an answer</a>';
}
/* Under the what-if line, Javier's call 22 Oct, because the what-if is about
   what the reader just did and this is about what the plan always was. Both can
   be on screen at once and at one plan in five that will happen. */
function paintSimLine(){
  var n = el("simline"); if (!n) return;
  var html = simLineHTML();
  if (!html){ n.hidden = true; n.innerHTML = ""; return; }
  n.hidden = false;
  n.innerHTML = html;
}
/* Nine, ten, eleven as words, for the several-causes sentence. The engine has
   its own wordN and this file cannot reach it. */
function wordN(n){
  return ["zero","one","two","three","four","five","six","seven","eight","nine","ten"][n] ||
         String(n);
}

var RULES = window.COMMISSION_RULES || null;
var RE    = window.RULES_ENGINE || null;
var PLAN_SRC = RULES && RE ? "json" : "engine";
var planDrift = [];
/* WHERE THE PLAN CAME FROM. Without the rules scripts the screen quietly falls
   back to the engine, and a silently-failed pivot looks identical to a working
   one, so it is said once, at load. */
if (PLAN_SRC !== "json")
  console.warn("Comp Plan Simulator: rules scripts not loaded, plan built by the ENGINE, not the JSON");
/* Said once per distinct disagreement, not once per render: build() runs on
   every render and the same drift would otherwise fill the console. */
var driftSaid = "";
function sayDrift(){
  var msg = planDrift.join("; ");
  if (msg && msg !== driftSaid)
    console.warn("Comp Plan Simulator: JSON DISAGREES WITH ENGINE: " + msg);
  driftSaid = msg;
}

/* flags and roles are the engine's. Everything else must come from the JSON,
   so they are named here rather than the JSON's fields being named: a new
   engine field then shows up as drift instead of quietly bypassing the JSON. */
var ENGINE_OWNS = ["flags", "roles"];

function planFrom(answers){
  var eng = E.buildPlan(answers);
  P0 = eng;            /* the plan as designed, before any lever */
  planDrift = [];
  var over = leverOverrides();
  /* NO JSON, NO LEVERS. The engine has no override path, so with the rules
     scripts missing the screen falls back to the plan as designed rather than
     silently ignoring a handle the reader has moved. */
  if (PLAN_SRC !== "json") return eng;

  var jsn;
  try { jsn = RE.buildPlan(RULES, answers, over); }
  catch (err){ planDrift = ["rules-engine threw: " + err.message]; sayDrift(); return eng; }
  /* WITH A LEVER PULLED THERE IS NOTHING TO COMPARE. E.buildPlan has no
     override path, so the engine's plan is the baseline and a difference is
     the lever working, not drift. Nothing is compared and nothing is said,
     rather than claiming a clean comparison that was not made. */
  if (over){
    ENGINE_OWNS.forEach(function(k){ jsn[k] = eng[k]; });
    return jsn;
  }

  ENGINE_OWNS.forEach(function(k){ jsn[k] = eng[k]; });

  /* Compare what the JSON owns against what the engine computed. Scalars and
     the scenario rows; anything else is reported by name rather than guessed
     at, because a silent pass is the failure this exists to prevent. */
  Object.keys(eng).forEach(function(k){
    if (ENGINE_OWNS.indexOf(k) >= 0) return;
    var x = eng[k], y = jsn[k];
    if (k === "r"){
      Object.keys(x || {}).forEach(function(id){
        if (x[id] !== y[id]) planDrift.push("r." + id + " " + x[id] + " vs " + y[id]);
      });
      return;
    }
    if (Array.isArray(x)){
      if (!Array.isArray(y) || x.length !== y.length){
        planDrift.push(k + ".length " + x.length + " vs " + (y && y.length));
        return;
      }
      x.forEach(function(row, i){
        if (row && typeof row === "object")
          Object.keys(row).forEach(function(f){
            if (row[f] !== y[i][f]) planDrift.push(k + "[" + i + "]." + f);
          });
        else if (row !== y[i]) planDrift.push(k + "[" + i + "]");
      });
      return;
    }
    if (x && typeof x === "object") return;   /* no such field today */
    if (x !== y) planDrift.push(k + " " + x + " vs " + y);
  });
  sayDrift();
  return jsn;
}

/* THE ANSWERS, NOT A PRESET. For two months this file was handed a plan by
   naming one of eight saved answer sets, because there was no questionnaire in
   front of it. There is now. ANSWERS is whatever the reader actually answered;
   the preset is only the answer set the blurred preview behind the
   questionnaire is drawn from before anything is answered, and what the
   checkers load to skip the twenty questions. It was also what the dev bar
   loaded, until the bar came out for production, 29 Oct. The engine never cared which: `buildPlan` takes answers and
   always did, which is why the merge touched four lines in this file and none
   in cards.js or tour.js. 26 Oct. */
var ANSWERS = null;
function answersNow(){
  return ANSWERS || (E.PRESETS[ST.preset] || E.PRESETS.full);
}
function build(){
  P = planFrom(answersNow());           /* sets P0 on the way through */
  syncFindings(P);
  L = E.buildLedger(P0 || P);           /* the quarter is dealt ONCE, unlevered */
  S = E.quarterState(P, L, ST.week === "closed" ? "closed" : ST.week);
  /* THE SAME QUARTER, READ AGAINST THE PLAN AS DESIGNED. Only built while a
     lever is off its baseline, because that is the only time anything can
     have changed, and only on the SAME ledger, so the comparison is the plan
     and nothing else. Null the rest of the time, which is the common case. */
  S0 = leversMoved() ? E.quarterState(P0, L, ST.week === "closed" ? "closed" : ST.week) : null;
  BASE_ROWS = {};
  var prev = ST.week === "closed" ? E.QTR_WEEKS : ST.week - 1;
  SP  = prev >= 1 ? E.quarterState(P, L, prev) : null;
  SP2 = prev >= 2 ? E.quarterState(P, L, prev - 1) : null;
}
function weekNum(){ return ST.week === "closed" ? E.CLOSED : ST.week; }

var SCALE = 1.3;
function w(v){ return Math.max(0, Math.min(100, (v / SCALE) * 100)); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>]/g, function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
function pct0(v){ return Math.round(v * 100) + "%"; }
var el = function(id){ return document.getElementById(id); };

/* ---- findings, and the tone a bar takes -------------------------------- */
function ctxFor(role, subj){
  if (role === "AE")  return FIND.ctxAE(P, L, S, subj);
  if (role === "SDR") return FIND.ctxSDR(P, L, S, subj);
  if (role === "CS")  return FIND.ctxCS(P, L, S, subj);
  if (role === "MGR") return FIND.ctxMGR(P, L, S, subj);
  return FIND.ctxCEO(P, L, S);
}
function setFor(role){ return FIND[role === "CEO" ? "CEO" : role] || []; }
/* ONE DEFINITION OF A FINDING ROW. There were FOUR copies of this markup:
   findingBlock, the AE view, the SDR/CS view and sellerBlock. I added the
   what-if mark to findingBlock on 20 Oct and the AE view silently carried on
   without it, which is exactly the shape of bug four copies of anything
   produces. Every one of them calls this now. */
function findingRow(f){
  var t = f.tone === "bad" ? "bad" : f.tone === "warn" ? "warn" : "good";
  return '<div class="finding ' + t + (f.whatif ? " wif" : "") + '"><b>' +
    esc(f.title) +
    (f.whatif ? '<i class="wiftag">' +
      (f.whatif === "new" ? "new under the what-if" : "changed by the what-if") +
      '</i>' : '') +
    '</b>' + esc(f.text) + '</div>';
}

function fireRows(role, subj){
  var c, set = setFor(role);
  try { c = ctxFor(role, subj); } catch(e){ return []; }
  try { return set.map(function(f){ return FIND.resolveFinding(f, c); })
          .filter(function(r){ return r && r.fired; }); } catch(e){ return []; }
}

/* WHAT THE LEVER DID TO THE FINDINGS.

   Spec, 23 Sep: "a finding that changed marked for a moment rather than
   appearing silently" and "findings that changed are marked in place on every
   view, not only where the controls are". Pull the cost ceiling and a plan
   that was affordable becomes unaffordable: that is a new red in a list of
   eleven, and without a mark the reader has to re-read the whole list to find
   what their hand just did.

   HOW. The same findings are resolved a second time against P0 and S0, the
   plan as designed on the same ledger, and the two sets are diffed BY ID,
   which resolveFinding already returns. A finding whose id is absent from the
   baseline is new; one whose text differs has changed. Text, not tone,
   because a finding can keep its colour and change its number.

   The globals are swapped rather than the context builders being
   parameterised: ctxFor reads P, L and S directly and there are five of them.
   Everything here is synchronous, the swap is restored in a finally, and the
   finding set itself is restored too, since syncFindings would otherwise
   leave the baseline's build in place.

   Cached per render and only built while levered, because firedFor is called
   once per table row and this doubles its work. */
function baseSubj(subj){
  if (!subj || !S0 || !subj.name) return subj;
  var pool = (S0.teams || []).reduce(function(a, t){ return a.concat(t.members || []); }, [])
    .concat(S0.aes || [], S0.sdrs || [], S0.css || [], S0.teams || []);
  for (var i = 0; i < pool.length; i++)
    if (pool[i] && pool[i].name === subj.name) return pool[i];
  return subj;
}
function firedBase(role, subj){
  if (!S0 || !P0) return null;
  var key = role + "|" + ((subj && subj.name) || "-");
  if (BASE_ROWS[key]) return BASE_ROWS[key];
  var pP = P, pS = S, pF = FIND, pFO = FIND_ON, out = null;
  try {
    P = P0; S = S0; syncFindings(P0);
    out = fireRows(role, baseSubj(subj));
  } catch(e){ out = null; }
  finally { P = pP; S = pS; FIND = pF; FIND_ON = pFO; }
  BASE_ROWS[key] = out || [];
  return BASE_ROWS[key];
}
function firedFor(role, subj){
  var rows = fireRows(role, subj);
  if (!S0 || !rows.length) return rows;
  var was = firedBase(role, subj);
  if (!was) return rows;
  /* NEW, OR A CHANGED VERDICT. NOT A CHANGED NUMBER.

     The first build marked any finding whose TEXT differed, which is literally
     correct and useless: measured on #full, nudging quota 10% marked SEVEN OF
     EIGHT AE findings, because almost every finding quotes a figure derived
     from quota. A mark on everything is not a mark.

     A finding whose number moved but whose verdict did not is not news. A
     finding that was not there before, or that was green and is now red, is
     the thing the reader has to be shown. 20 Oct. */
  var byId = {};
  was.forEach(function(r){ byId[r.id] = r.tone; });
  rows.forEach(function(r){
    r.whatif = !(r.id in byId) ? "new" : (byId[r.id] !== r.tone ? "changed" : null);
  });
  return rows;
}
/* The bar takes the tone of the STANDING finding, the first standing in each
   role's set, not the worst thing that person carries. */
function tone(role, rows){
  var set = setFor(role);
  if (!set.length || !rows.length) return "";
  var first = set[0].standing;
  var hit = rows.filter(function(r){ return r.standing === first; })[0];
  if (!hit) return "";
  return hit.tone === "ok" ? "good" : hit.tone;
}
function pills(rows){
  var bad = 0, warn = 0;
  rows.forEach(function(r){ if (r.tone === "bad") bad++; else if (r.tone === "warn") warn++; });
  return '<span class="counts">' +
    (bad  ? '<span class="pill r">' + bad + '</span>' : '') +
    (warn ? '<span class="pill a">' + warn + '</span>' : '') + '</span>';
}
/* A bar is a value, a track and a tick. The quota track runs 0 to 1.3x with
   the tick on this week's pace, and that is still the default. A row that is
   not judged on quota passes its own track in. */
function barHTML(attain, t, opt){
  var floor = opt ? opt.floor : 0;
  var top   = opt ? opt.top   : SCALE;
  var tick  = opt ? opt.tick  : S.pace;
  var span  = top - floor;
  var at = function(v){ return Math.max(0, Math.min(100, ((v - floor) / span) * 100)); };
  /* TWO TONES IN ONE TRACK. A CS bar's LENGTH is retention; the question
     Javier asked of it on 18 Oct is a different one, "indicate what landed or
     what's open". So the bar keeps its length and splits inside it: the solid
     part is the share already renewed, the light part runs on to the end. A
     second bar underneath would have answered a question nobody asked, which
     is what the leaderboard was doing and what he called a disaster. */
  var solid = opt && opt.solid !== undefined
    ? '<b style="width:' +
      (at(attain) * Math.max(0, Math.min(1, opt.solid))).toFixed(1) + '%"></b>' : '';
  return '<div class="bar ' + t + (solid ? ' split' : '') + '"' +
    (opt && opt.note ? ' title="' + esc(opt.note) + '"' : '') +
    '><i style="width:' + at(attain).toFixed(1) + '%"></i>' + solid +
    '<u style="left:' + at(tick).toFixed(1) + '%"></u></div>';
}

/* ---- the bar a person's row draws --------------------------------------
   A CS row cannot use the quota track. It used to draw renewals landed
   against the book up for renewal this quarter, which is not a performance
   figure at all: it is how much of the book has happened to come up yet,
   which no CSM controls. Every CSM therefore sat ahead of the pace tick all
   quarter while the colour, which comes from the retention standing, could
   say amber. Two CSMs with the same bar in the same place came out different
   colours and nothing on the screen explained the gap.

   So a CS row draws the thing it is judged on and paid on: retention if
   nothing more churns. The track is the plan's own two lines, the gate where
   the component pays nothing up to no churn at all, and the tick sits on the
   full-pay line. A bar short of the tick means the component is no longer
   whole, which is exactly when the standing finding turns amber. The bar and
   the colour finally measure the same thing. */
function barOf(role, m){
  var fallback = m.attain !== undefined ? m.attain
               : (m.atRisk ? (m.held || 0) / m.atRisk : 0);
  if (role !== "CS") return {val: fallback, opt: null};
  var r = null;
  try { var c = FIND.ctxCS(P, L, S, m); if (c) r = c.retIfNoMore; } catch(e){}
  if (r === null || r === undefined) return {val: fallback, opt: null};
  var upSoFar = (m.held || 0) + (m.pending || 0);
  return {val: csTrack(r), opt: {floor: 0, top: 1, tick: CS_TICK,
    solid: upSoFar ? (m.held || 0) / upSoFar : 1}};
}
/* THE CS TRACK IS DELIBERATELY NOT STRAIGHT, and this is the one place in the
   app where a scale bends, so it is written down rather than left to be found.

   The gate sits at 0, the full-pay line at 71% and carries the tick, and 100%
   retention at 82%, which leaves the last 18% unreachable so a CS bar never
   fills. The bend puts the width where the money is: the seven points between
   the gate and full pay, where every point of churn costs real commission, get
   71% of the bar, and the five points above full pay, where the component pays
   the same whatever happens, get 11%.

   A straight track from the gate to 100 forces the full-pay line to 58% and
   spends 42% of the bar on a zone where nothing changes. That is what shipped
   first and what Javier caught, 7 Oct: "if the mark is 95% the green line of
   100 shouldn't be at the end, the whole point was not to fill the whole bar."
   The two positions below are his, marked on a screenshot. */
var CS_TICK = 0.71, CS_END = 0.82;
/* THE GATE SITS AT 65% OF THE BAR, AND BELOW IT THE SCALE RUNS NORMALLY.
   Settled with Javier 21 Oct after two wrong attempts of mine.

   It used to sit at 0, so every CSM at or below the gate drew an empty bar.
   On #mixed at closed that made Chloe Bennett at 87.4% and Alice Okafor at
   73.9% identical: both nothing, under a column headed AGAINST TARGET. Javier:
   "should still color to that point no?" and, on why the bend survives it,
   "everyone is almost always close to that range", which the spread bears out,
   CS managers 92-95% and reps 74-100%.

   CS was also the only row in the table drawing PAY rather than value. An AE
   or SDR bar is actual over target, linear, so a rep at 30% of quota draws 30%
   in red. A CSM below the gate drew nothing.

   MY FIRST FIX PUT THE GATE AT 15% AND IT WAS STILL WRONG, because almost the
   whole book sits below the gate and squeezing it into 15% of the width makes
   87.4% draw at 14%. Javier: "they are at 87% and 72%, why can't they move
   closer to the tick... it looks odd." A smaller lie is still a lie.

   SO: BELOW THE GATE THE SCALE IS NORMAL, ABOVE IT THE SEVEN PAYING POINTS
   ARE STRETCHED. Per point of retention:
       below 88      0.74% of the bar   (a straight scale would be 0.90%)
       88 to 95      2.43% of the bar   (the stretch, 3.3x)
       95 to 100     1.60% of the bar   (tapering; the component caps up here)
   Which is what the bend was always for, magnifying the points that decide
   the money, without crushing the rest to nothing.

   JAVIER'S 7 OCT MARKS SURVIVE: the full-pay line is still CS_TICK, 100%
   retention is still CS_END, the last 18% is still unreachable, and there is
   still exactly ONE mark on the bar, at 95%. He ruled out a three-mark
   version: "I don't want three marks, only one. At 95 like it is now."

   What the three CS reps on #mixed at closed draw: 73.9% -> 55%,
   87.4% -> 65% (just short of the gate), 100% -> 90%. */
var CS_GATE = 0.65;
function csTrack(r){
  var g = RF(), f = RFU();
  if (r == null || r <= 0) return 0;
  if (r <= g) return r / g * CS_GATE;
  if (r <= f) return CS_GATE + (r - g) / (f - g) * (CS_TICK - CS_GATE);
  return CS_TICK + (r - f) / (1 - f) * (CS_END - CS_TICK);
}

/* ---- the CS ladder, and why the old model had to go ---------------------
   RETENTION-IF-NOTHING-MORE-CHURNS CANNOT ANSWER "WHAT IS THIS WORTH". It is
   (held + pending) / book, so moving a dollar from pending to held leaves it
   unchanged: securing a renewal moves that measure by exactly zero, always, by
   construction. The only thing that moves it is churn. That is why the first
   version priced a renewal as what LOSING it would cost, and why every card
   ended up either saying "worth nothing" or threatening the reader. Javier,
   19 Oct: it reads as money coming out of a CSM's paycheck, and retention has
   to stay forward-looking even though it only lands at the end.

   So the marginal question runs on SECURED / BOOK, which rises as renewals
   land and ends at final retention. Measured on `#full`: 27% at week 4, 62% at
   week 8, 83% at week 11, 96% at the close, with the first crossings of the
   88% gate in the last fortnight. That is the AE's own shape, a climb with a
   line in it, and it makes the triangle fire for a reason instead of eight
   times at week 8.

   THE COMPONENT IS A RATE LADDER, not a switch. `retentionPay` is
   min(1.2, (ret - .88) / (.95 - .88)) x component, so: nothing below 88,
   linear from 88 up, and the 1.2 cap binds at 96.4 rather than at 95. Three
   zones, exactly like an AE's decelerator, base band and top tier, which is
   why `csWorthAdd` below is the same two-point difference `marginal()` takes
   for a deal. */
/* THE CEILING IS DERIVED, NOT TYPED. Writing .964, or the 1.2 it comes from,
   puts a compensation number in the renderer, which is the class the 25%
   gross-profit literal was fixed for on 11 Oct. The engine owns the curve, so
   the cap is found by asking it where the curve stops rising. */
var CS_CAP = 0;
function csCap(){
  if (CS_CAP) return CS_CAP;
  var top = E.retentionPay(1, 1000, P), lo = RF(), hi = 1, mid, i;
  for (i = 0; i < 48; i++){
    mid = (lo + hi) / 2;
    if (E.retentionPay(mid, 1000, P) >= top - 1e-9) hi = mid; else lo = mid;
  }
  CS_CAP = hi;
  return CS_CAP;
}
function csLadder(m){
  var book = m && m.atRisk || 0;
  if (!book) return null;
  var CS_CAP = csCap();
  var secured = m.held || 0, open = m.pending || 0;
  var retFull = (P.csVariable || 0) * (P.csRetWeight || 0) / 4;
  var lvl = secured / book;
  var next = lvl < RF()
      ? {at: RF(), label: pct0(RF()), on: true}
      : lvl < CS_CAP ? {at: CS_CAP, label: pct0(CS_CAP)} : null;
  return {book: book, secured: secured, open: open, retFull: retFull, lvl: lvl,
          /* The best level still reachable. Churn only ever lowers it, and once
             it is under the gate the component cannot be earned at all, which
             is the CS form of a quota that can no longer be worked. */
          ceiling: (secured + open) / book,
          need: book * RFU(), gateAt: book * RF(),
          capAt: book * CS_CAP, next: next,
          paid: E.retentionPay(lvl, retFull, P) || 0,
          inBand: lvl >= RF() && lvl < CS_CAP};
}
function csPayAt(L0, dollars){
  return E.retentionPay(Math.max(0, dollars) / L0.book, L0.retFull, P) || 0;
}
/* What securing one more is worth, and what one already secured was worth.
   Same two-point difference the AE's `marginal()` takes. */
function csWorthAdd(L0, acv){
  return L0 ? Math.max(0, csPayAt(L0, L0.secured + (acv || 0)) - L0.paid) : 0;
}
function csWorthHad(L0, acv){
  return L0 ? Math.max(0, L0.paid - csPayAt(L0, L0.secured - (acv || 0))) : 0;
}

/* A headline figure takes the tone of the CEO finding that OWNS that number,
   the same rule the people bars follow. It also settles the inversion for
   free: the cost card already knows that past the ceiling is bad, so nothing
   here has to know which direction is good. Javier, 7 Oct. */
var TILE_STANDING = ["Is the sales number going to land", "Who produced the revenue",
                     "What it costs", "What it costs"];
function standingTone(name){
  var rows = firedFor("CEO").filter(function(r){ return r.standing === name; });
  if (!rows.length) return "";
  return rows[0].tone === "ok" ? "good" : rows[0].tone;
}

/* ---- the four figures. The same four as the tutorial screen. ------------ */
function tiles(){
  var co = S.company;
  var byRep = (S.aes || []).map(function(r){ return r.closed || 0; })
    .sort(function(a, b){ return b - a; }).slice(0, 10);
  var top = byRep[0] || 1;
  /* The two meters were identical marks measuring opposite things, and the
     12px bar left a hole in a tile sized by the ring. The caption fills the
     hole with the one fact that tells them apart: one tick is a pace, the
     other is a ceiling. */
  /* `axis` puts both marks on an ABSOLUTE scale instead of the attainment one.
     The cost meter used to take the cost as a fraction of the ceiling, which
     pinned the tick: the tick WAS the ceiling, so moving the ceiling lever
     shrank the bar and left the mark where it was, and the one thing being
     dragged was the one thing that could not move. On an absolute axis the bar
     is the cost, the tick is the ceiling, and the lever moves the tick while the
     bar holds still, which is the truth of it: changing the ceiling does not
     change what the quarter cost. Javier, 22 Oct. */
  var meter = function(v, tick, cap, axis){
    var pos = axis ? function(x){ return Math.max(0, Math.min(100, x / axis * 100)); } : w;
    return '<div class="art"><div class="meter"><i style="width:' + pos(v).toFixed(1) + '%"></i>' +
      '<u style="left:' + pos(tick).toFixed(1) + '%"></u></div>' +
      '<div class="cap">' + cap + '</div></div>'; };
  /* The axis is the full range the ceiling lever can be set to, so the tick has
     visible room to travel in both directions and nothing clamps inside the
     range the tool can actually produce. Read off the lever rather than typed,
     so the two cannot drift apart. */
  var CEIL_AXIS = leverSpecs()["lever-ceil"].hi;
  var gpPct = (co.gpShare || P.shareOfGp);
  var costPct = (co.salesCost || P.salesCostOfRev);
  /* EVERY TILE CARRIES A NUMBER. Two of them used to carry none, so the value
     line rendered as a blank &nbsp; sitting between the title and the art,
     which is the gap Javier saw under WHERE IT CAME FROM and the ring. It also
     took the ring's percentage out of the middle of the ring, where there was
     no room for it: 28px of circle with a 19px hole punched in it left four
     pixels of arc and 7.5px type. The number belongs on the value line with
     the other three, and the ring is then free to be a mark rather than a
     label with a circle round it. Javier, 7 Oct. */
  var all = (S.aes || []).map(function(r){ return r.closed || 0; })
    .sort(function(a, b){ return b - a; });
  var totClosed = all.reduce(function(a, b){ return a + b; }, 0) || 1;
  var top2 = (all[0] || 0) + (all[1] || 0);
  return [
    ['Revenue against plan', E.moneyK(co.closed),
     meter(co.attain, S.pace, S.closed ? "tick = full quota"
                                       : "tick = week " + S.week + " pace")],
    ['Where it came from', pct0(top2 / totClosed) + ' top two',
     '<div class="art"><div class="spark">' + byRep.map(function(v){
       return '<s style="height:' + Math.max(6, v / top * 100).toFixed(0) + '%"></s>';
     }).join('') + '</div><div class="cap">' +
     (all.length > 10 ? "10 of " + all.length + " reps, biggest first"
                      : "one bar per rep, biggest first") + '</div></div>'],
    /* THE QUARTER, NOT THE DESIGN. This read P.costOfRev, the whole company's
       variable at target over p.revBase, so it answered "what would this plan
       cost at target" while the three tiles beside it answered "what is
       happening", and no lever but quota could move it. Its own hover card has
       always read the actual, co.salesCost, and quoted the design SALES cost
       beneath it, so the tile and its card were about two different numbers.
       It is the sales cost of revenue now: the same numerator COMP vs GROSS
       PROFIT uses, which is this figure divided by the margin, over the revenue
       it bought. The tick is P.guardrail, which is the line that governs this
       ratio and not one with the book in the denominator. The design figure is
       the fallback, so a quarter with nothing closed still shows a number.
       Javier, 22 Oct. */
    /* ONE DECIMAL ON THE TWO COST TILES, and only on those two. Both are a
       ratio judged against a line, and at whole percents the lever moves
       disappeared: pulling reps-at-quota to its minimum on #full at closed
       moves this from 11.7% to 12.5%, and the tile printed 12% both times, so a
       live figure read as a dead one. The other two tiles are money and a share
       of the top two reps, which need no decimal. Javier, 22 Oct. */
    ['What it cost', E.pct(costPct),
     meter(costPct, P.guardrail, "tick = " + pct0(P.guardrail) + " ceiling", CEIL_AXIS)],
    /* THE RING IS GONE. It was a 40px donut carrying a value, a 25% threshold
       and a direction, and at that size it could show one of the three. The
       number is one share against one line, so the mark is a part-of-whole bar:
       the whole is gross profit, the fill is what variable pay takes of it, and
       the line sits at 25%. Javier, 7 Oct: "the pie chart keeps being a
       problem". He was right and the shape was the problem. */
    ['Comp vs gross profit', E.pct(gpPct),
     '<div class="art"><div class="pow"><i style="width:' +
      Math.min(100, gpPct * 100).toFixed(1) + '%"></i>' +
      '<u style="left:25%"></u></div><div class="cap">line = 25% of gross profit</div></div>']
  ].map(function(t, i){
    var tn = standingTone(TILE_STANDING[i]);
    return '<div class="tile ' + tn + '" data-tile="' + i + '" data-tone="' + tn +
      '"><div class="k">' + t[0] + '</div>' +
      '<div class="v">' + t[1] + '</div>' + t[2] + '</div>';
  }).join('');
}

/* ---- the org tree ------------------------------------------------------
   Four levels: the company, a DEPARTMENT line per role, each manager, then
   their people. The department line is the level RevOps and the CEO actually
   manage at: "how is CS doing" was a question the old tree could not answer
   without adding four rows up by eye.

   The carets open and close. A department starts open and a team starts closed,
   so the screen opens on the shape of the org rather than on 35 names. */
var DEPTS = [["AE","Sales"], ["SDR","SDR"], ["CS","Customer Success"]];

function nodeOpen(id, dflt){
  return ST.open[id] === undefined ? dflt : ST.open[id];
}
function caret(id, dflt){
  return '<span class="caret tw" data-node="' + id + '">' +
    (nodeOpen(id, dflt) ? "\u25be" : "\u25b8") + '</span>';
}
/* FIXED COLUMNS. The table had none, so the browser sized it by content and
   NAME took every spare pixel on a wide screen: at 1680 that was a gap wide
   enough for Javier to mark up, with the bars starting at 58% of the table.
   The deal table has had fixed columns all along; this is the same treatment,
   with AGAINST TARGET taking the slack instead of the gap after the names. It
   also lands every bar in the same place, which they were not.
   Javier, 11 Oct. */
function treeHeader(){
  return '<colgroup><col style="width:32%"><col style="width:14%">' +
    '<col style="width:44%"><col style="width:10%"></colgroup>' +
    '<tr><th>Name</th><th>Role</th>' +
    '<th>Against target<span class="q" data-q="q-target">?</span></th><th class="num">Findings</th></tr>';
}
/* ORDERED BY WHAT THE ROW'S BAR DRAWS. Nothing sorted these before: the tree
   printed the engine's build order, and Sales and SDR came out descending by
   luck because the engine happens to build them that way and their bar draws
   the quantity that order follows. CS does not, and on #miss at closed the
   four CS teams ran 96.7, 96.6, 96.2, 97.8, so the best team was last on both
   measures. Javier read an accidental order as a deliberate one, which is
   exactly what an accidental order invites.

   Sorted on the same number the bar uses, so the order and the bar cannot
   disagree: retention for a CS team, team attainment for everyone else. On
   Sales and SDR this changes nothing visible today, which is the point.

   THIS IS THE RevOps AND CEO ORG TREE ONLY. The manager's own screen arranges
   its people deliberately, biggest first with the reader pulled to the top
   carrying their real rank, decided 13 Oct, and `board()` is untouched.
   Javier, 21 Oct. */
function teamsOf(key){
  return (S.teams || []).filter(function(t){
    var m = t.manages || "AE";
    return key === "AE" ? (m !== "CS" && m !== "SDR") : m === key;
  }).sort(function(a, b){ return teamRank(key, b) - teamRank(key, a); });
}
function teamRank(key, t){
  if (key === "CS"){ var R = retFor(t.members); return R.ret == null ? -1 : R.ret; }
  return t.attain || 0;
}
function roleOf(key){ return key === "CS" ? "CS" : key === "SDR" ? "SDR" : "AE"; }
/* The VIEW key to a role name, which is the other direction and was being
   done inline in three places. */
function roleOf2(viewKey){
  return viewKey === "cs" ? "CS" : viewKey === "sdr" ? "SDR" : "AE";
}

/* PEOPLE WITH NO MANAGER ARE STILL IN THE ORGANISATION. The tree used to be
   built by walking TEAMS, so anybody nobody manages was drawn nowhere: on
   #small that is one SDR and two CSMs, real people, in S.sdrs and S.css, with
   their own findings and their own bars, missing from a screen whose whole job
   is "the whole organization".

   They hang off the department row directly, at the level a manager would sit
   at, because there is no team to put them under. The department row itself
   exists whenever the plan has people in the role, managed or not.
   Javier, 9 Oct, built 10 Oct. */
function rosterOf(key){
  return key === "SDR" ? (S.sdrs || []) : key === "CS" ? (S.css || []) : (S.aes || []);
}
function looseOf(key){
  var on = {};
  teamsOf(key).forEach(function(t){
    (t.members || []).forEach(function(m){ on[m.name] = 1; }); });
  return rosterOf(key).filter(function(x){ return !on[x.name]; });
}

/* A SELLING MANAGER'S OWN DEALS BELONG IN THE DEPARTMENT'S NUMBER. Keeping
   them out is a PAY rule and nothing else: their deals must not count twice,
   once in the team half of their variable and once in the personal half. That
   rule belongs on their pay, not on a report. A department row answers "how is
   Sales doing", and Sales is everyone in Sales.

   Without this, #small showed a green Sales at 105% under an amber company at
   97%, the difference being the manager's own $121K against her own $150K.
   With it the two agree and the apologetic note under the company card is not
   needed, because there is nothing left to explain. Javier, 8 Oct.

   Only AE-managing teams add a personal number: the quarterly quota here is the
   AE quota, and an SDR or CS manager who sells carries a target in their own
   unit, which is not comparable. */
function ownOf(t){
  var manages = t.manages || "AE", w = {};
  if (manages === "SDR" || manages === "CS") return {closed: 0, quota: 0};
  try { w = E.mgrWeights(t.size || (t.members || []).length, manages); } catch(e){}
  if (!w.personal) return {closed: 0, quota: 0};
  var closed = 0;
  E.dealsAsOf(L, weekNum()).won.forEach(function(d){
    if (d.rep === t.manager) closed += d.acv || 0; });
  return {closed: closed, quota: P.qQuota || 0};
}
/* One calculation, read by the department bar and by its card, so the two can
   never disagree. */
function deptTotals(teams){
  var actual = 0, target = 0, people = 0, sellers = 0, open = 0;
  teams.forEach(function(t){
    var own = ownOf(t);
    actual += (t.actual || 0) + own.closed;
    target += (t.target || 0) + own.quota;
    open   += t.open || 0;
    people += (t.members || []).length + 1;
    if (own.quota) sellers++;
  });
  return {actual: actual, target: target, open: open, people: people, sellers: sellers};
}

/* THE DEPARTMENT FIGURE, INCLUDING THE PEOPLE NOBODY MANAGES.

   SDR and CS roll up through S.fn, which the engine already builds over every
   person in the role whether or not anybody manages them, with each role's own
   unit and target. Re-adding loose people by hand here would mean restating
   that unit logic in this file, which is how the two quietly stop agreeing.

   AE has no S.fn and is the one role where a selling manager's own deals have
   to be added, so it keeps deptTotals, and loose AEs are added on their own
   closed and quota, which is what an AE row carries. */
function deptFigure(key, teams, loose){
  var fn = (S.fn || {})[key];
  /* Only where it changes the answer. With nobody loose the two roads lead to
     the same number, and taking the new one anyway would mean re-proving seven
     presets to buy nothing. */
  if (key !== "AE" && fn && (loose || []).length){
    return {actual: fn.actual || 0, target: fn.target || 0, open: fn.open || 0,
            people: (fn.members || []).length, sellers: 0};
  }
  var tot = deptTotals(teams);
  (loose || []).forEach(function(x){
    tot.actual += x.closed || 0;
    tot.target += x.quota  || 0;
    tot.open   += x.openV  || 0;
    tot.people += 1;
  });
  return tot;
}

/* WHAT A DEPARTMENT IS ACTUALLY MEASURED ON.

   Three roles, three units, and the roll-up was printing all of them as money
   against a plain ratio. SDR carries a COUNT, so "$24 of $50" was 24 accepted
   opportunities dressed as currency.

   CS was worse than a formatting bug. The department showed renewals LANDED
   against the whole book up for renewal, which in week 6 is mostly a statement
   about how far through the quarter we are. That is the exact bug Javier
   caught on the individual CS bars on 7 Oct, where it became retention if
   nothing more churns, on the bent track with the gate at 88%. The individuals
   were fixed and the department was never touched, so on #small it sat at 32%
   with its only two people at 82% and 64%. A department and its own members
   now agree by construction, the way a department and the company already do.
   Javier, 13 Oct. */
/* One retention aggregate, over whatever set of CSMs it is handed: the whole
   roster for a department, one manager's people for a team. (held + pending)
   over the book, which is retention if nothing more churns, the same measure
   the individual bars have used since 7 Oct. Javier, 13 Oct. */
function retFor(list){
  var held = 0, churn = 0, pend = 0;
  (list || []).forEach(function(c){
    held += c.held || 0; churn += c.churned || 0; pend += c.pending || 0; });
  var book = held + churn + pend;
  return {held: held, churn: churn, pend: pend, book: book,
          ret: book ? (held + pend) / book : null};
}
function deptMeasure(key, teams, loose){
  var tot = deptFigure(key, teams, loose);
  if (key === "CS"){
    var R = retFor(S.css), ret = R.ret;
    return {kind: "ret", ret: ret, held: R.held, churn: R.churn, pend: R.pend, book: R.book,
            frac: ret === null ? 0 : csTrack(ret),
            opt: {floor: 0, top: 1, tick: CS_TICK,
                  solid: (R.held + R.pend) ? R.held / (R.held + R.pend) : 1},
            tone: ret === null ? "" : ret >= RFU() ? "good"
                : ret >= RF() ? "warn" : "bad",
            people: tot.people};
  }
  var frac = tot.target ? tot.actual / tot.target : 0;
  return {kind: key === "SDR" ? "count" : "money",
          actual: tot.actual, target: tot.target, frac: frac, opt: null,
          tone: numberTone(tot.actual, tot.target, tot.open), people: tot.people,
          noun: key === "SDR" ? (P.early ? "meetings held" : "accepted opportunities") : ""};
}

/* A DEPARTMENT IS COLOURED BY ITS OWN NUMBER, by the same test the CEO
   standing finding uses on the company's.

   It used to take the worst tone of the teams under it. That rule went in on
   6 Oct for a real reason: a department coloured by its own pace sat green
   directly above an amber manager on a one-team department, two rows showing
   one fact and giving two answers. The reason expired on 8 Oct, when a
   department started counting its selling managers' own deals. The department
   and the manager row are no longer the same fact, and the department and the
   COMPANY now are: on seven of the eight presets Sales is arithmetically
   identical to the company, because new business is closed entirely by the AE
   organisation. So the worst-manager rule was putting an amber Sales directly
   under a green company with the same number in both rows.

   The consequence, accepted: a green manager can sit under an amber department
   again. That is honest now. The department is the business and the manager
   row is their team, which on a selling manager's row excludes their own
   deals, and their card says so. Javier, 8 Oct.

   The thresholds are lifted from ceo-s1: at close, quota is green, 90% is
   amber, below that is red; during the quarter, at or ahead of pace is green,
   behind is amber, and out of reach on everything still open is red. */
function numberTone(actual, target, open){
  if (!target) return "";
  var at = actual / target;
  if (S.closed) return at >= 1 ? "good" : at >= 0.90 ? "warn" : "bad";
  /* The out-of-reach test only applies where there IS a pipeline. An SDR or CS
     team carries no open revenue, so without this guard every one of them went
     red in week 1 and stayed red, for the want of a field they never had. */
  if (open && (actual + open) / target < 1) return "bad";
  return (at >= 1 || at >= S.pace) ? "good" : "warn";
}

/* A name inside an attribute selector. Apostrophes are the ones that bite. */
function cssq(v){ return String(v).replace(/["\\]/g, "\\$&"); }
function selCls(kind, key){
  if (ST.sel && ST.sel.kind === kind && ST.sel.key === key) return " picked";
  /* The CEO cannot select, but it can POINT THE TABLE, and the row it pointed
     with has to say so. `tree()` is only ever rendered by RevOps and the CEO,
     so reading ST.pick here cannot collide with a manager's own table, which
     builds its rows in `mgrPeople`. Javier, 15 Oct. */
  if (ST.pick && ST.pick === key && (kind === "person" || kind === "team")) return " picked";
  return "";
}
/* "View as <name>" lives at the FOOT OF THE HOVER CARD, not on the row. It was
   built on the row first; Javier moved it, 14 Oct. The markup is in cards.js,
   the switch is `viewAs` below, and the row is back to its one meaning with
   nothing sharing it. The way back is the filter, so this is one-way by
   design. */
function viewAs(role, who){
  if (!role) return;
  /* THE CEO HAS NO `who`. Every other role picks a person out of a list; the
     CEO view is one seat and its switcher is empty, so requiring a name here
     silently did nothing when the CEO card's View as was pressed.
     Javier, 15 Oct. */
  if (role !== "ceo" && !who) return;
  ST.role = role; ST.who = role === "ceo" ? null : who;
  ST.sel = null; ST.pick = null;
  render();
}
function personRow(key, m, ind){
  var r = roleOf(key), pr = firedFor(r, m), b = barOf(r, m);
  return '<tr class="' + selCls("person", m.name).replace(/^ /, "") +
    '" data-kind="person" data-role="' + r +
    '" data-key="' + esc(m.name) + '" data-tone="' + tone(r, pr) +
    '"><td class="nm ' + ind + '">' + esc(m.name) +
    '</td><td>' + r + '</td><td>' + barHTML(b.val, tone(r, pr), b.opt) + '</td>' +
    '<td class="num">' + pills(pr) + '</td></tr>';
}
/* The second column says what the department is made of. A department with no
   manager at all should not be made to say "0 teams". */
function deptCount(teams, loose){
  var t = teams.length, u = loose.length;
  var tl = t + (t === 1 ? " team" : " teams");
  if (!t) return u + (u === 1 ? " person" : " people") + ", no manager";
  if (!u) return tl;
  return tl + ", " + u + " unmanaged";
}

/* WHOSE DEALS ARE THESE. An SDR team owns nothing: their people create the
   opportunity and an AE owns it from that moment, so filtering a team or an
   SDR by `d.rep` returned an empty table under a title naming them. The
   manager view learned this on 14 Oct and the RevOps team branch never did,
   which is the bug Javier hit clicking Nathan Boyd. One builder now, used by
   RevOps and by the CEO's pick. Javier, 15 Oct. */
/* A DEPARTMENT IS A SCOPE TOO. Clicking Sales only swapped the findings hint
   and left the table showing the whole company, so the one thing a department
   row could usefully do, say what that department is working, it did not do.
   Javier, 15 Oct. */
var DEPT_LABEL = {AE: "All Sales deals", SDR: "All SDR deals", CS: "All CS deals"};
function deptFilterFor(key){
  var own = {};
  (S.teams || []).forEach(function(t){
    if ((t.manages || "AE") !== key) return;
    (t.members || []).forEach(function(m){ own[m.name] = 1; });
    own[t.manager] = 1;
  });
  ((key === "SDR" ? S.sdrs : key === "CS" ? S.css : S.aes) || [])
    .forEach(function(m){ own[m.name] = 1; });
  return key === "SDR" ? function(d){ return own[d.createdByRep]; }
                       : function(d){ return own[d.rep]; };
}
function lensFor(name){
  var t = (S.teams || []).filter(function(x){ return x.manager === name; })[0];
  if (t) return t.manages === "SDR" ? "SDR" : null;
  return (S.sdrs || []).some(function(m){ return m.name === name; }) ? "SDR" : null;
}
/* ---- THE MEETINGS TABLE -------------------------------------------------
   A MEETINGS PLAN PAYS ON MEETINGS, so the table has to be the meetings. On
   `#early` Holly is paid on 43 of them while the deal table showed 70 rows
   carrying her name, a different population from the one her tiles and her
   cheque are computed on, with nothing on screen explaining the gap. The deal
   table stays everywhere the unit is an opportunity, which is Javier's call:
   "on plans where they get paid on accepted opportunities the table is fine".
   Javier, 15-18 Oct.

   `L.created` already holds one row per meeting with the account and the week
   it was held, which is all a meeting is. */
function meetingsFor(names, wide){
  var wk = weekNum();
  var rows = (L.created || []).filter(function(c){
    return c.unit === "meeting" && c.week <= wk && names[c.sdr]; })
    .sort(function(x, y){ return y.week - x.week; });
  var many = Object.keys(names).length > 1;
  var paidFor = meetPaid;
  /* THE HEADERS LOOKED SORTABLE AND DID NOTHING. This table renders the same
     `th()` the deal table does, so every column drew a caret and the click
     handler on #dealtab flipped it, and then this builder sorted by week
     descending and ignored the sort state entirely: the arrow moved and the
     rows never did. Pre-existing and nobody reported it; found sweeping the
     stage-sort fix on 22 Oct. The comparators have to live here because two of
     them close over the week and over `paidFor`. */
  var MSORTS = {
    opp:     function(c){ return String(c.account || "").toLowerCase(); },
    src:     function(c){ return String(c.sdr || "").toLowerCase(); },
    created: function(c){ return c.week || 0; },
    stage:   function(c){ return MEET_RANK[meetState(c, wk)]; },
    paid:    function(c){ return paidFor(c); }
  };
  rows = sortRows(rows, MSORTS);
  LAST_XNOTE = "";
  if (!rows.length) return '<thead><tr><th>Account</th></tr></thead><tbody>' +
    '<tr><td class="nm">No meetings held yet this quarter.</td></tr></tbody>';
  /* NO PAID COLUMN ON A MANAGER'S SCREEN. Five columns in the narrow table
     squeezed "Led to an opp" until it truncated to "Lead to an...", and the
     column it was squeezed by is one every row shares: a meeting pays the
     same flat rate or nothing. No other manager view carries a Paid column
     either. Dropping it is what makes the heading readable. Javier, 19 Oct. */
  /* ACCOUNT WAS TAKING A THIRD MORE THAN ITS LONGEST NAME on the rep's own
     table, which is the hand's width of nothing Javier saw between it and
     Held. The slack goes to the outcome column. Javier, 19 Oct. */
  return '<colgroup><col style="width:' + (many ? "40%" : "36%") + '">' +
    (many ? '<col style="width:26%">' : '') +
    '<col style="width:' + CW.wk + 'px"><col style="width:' + (many ? "34%" : "34%") + '">' +
    (many ? '' : '<col style="width:' + CW.paid + 'px">') + '</colgroup><thead><tr>' +
    th("opp", "Account") + (many ? th("src", "Held by") : "") +
    th("created", "Held", "num") + th("stage", "Led to an opp") +
    (many ? "" : th("paid", "Paid", "num")) + '</tr></thead><tbody>' +
    rows.map(function(c){
      var st = meetState(c, wk);
      var lbl = MEET_LABEL[st];
      return '<tr data-meet="' + esc(c.sdr + "|" + c.account + "|" + c.week) +
        '" class="' + (st === "no" ? "lost" : st === "yes" ? "won" : "") + '">' +
        '<td class="nm"><span class="dot ' + (st === "no" ? "lost" : st === "yes" ? "won" : "open") +
        '"></span>' + esc(c.account) + '</td>' +
        (many ? '<td>' + esc(c.sdr) + '</td>' : '') +
        '<td class="num">' + weekLabel(c.week) + '</td>' +
        '<td>' + lbl + '</td>' +
        (many ? '' : '<td class="num">' + E.money(Math.round(paidFor(c))) + '</td>') +
        '</tr>';
    }).join("") + '</tbody>';
}
/* A meeting gets a fortnight to turn into something before it counts against
   anyone, the same reasoning the stale rule uses. */
var MEET_MATURE = 2;
/* THREE STATES, NOT TWO. A meeting held last week has not had time to become
   anything, so a yes/no column would mark every recent one "no" and make the
   rate look worse the closer you got to today. One definition, because the
   outcome column now sorts as well as prints and the two cannot disagree. */
function meetState(c, wk){
  return c.becameOpp ? (c.oppWeek <= wk ? "yes" : "soon")
                     : (wk - c.week < MEET_MATURE ? "soon" : "no");
}
var MEET_LABEL = {yes: "Yes", soon: "Not yet", no: "No"};
/* The same shape the deal table's stage rank has: ascending runs from "nothing
   has happened yet" through the win to the loss, so a descending sort brings the
   dead meetings to the top, exactly as it brings Lost deals to the top. */
var MEET_RANK = {soon: 0, yes: 1, no: 2};
/* WHAT ONE MEETING PAID, with the accelerator priced in, which is why it is a
   column rather than one figure repeated down the page. Module level since 22
   Oct, because the row's Paid cell and the row's hover card both print it and
   two copies of a marginal is two copies to get wrong. */
function meetPaid(c){
  var m = (S.sdrs || []).filter(function(x){ return x.name === c.sdr; })[0];
  if (!m || !m.target) return 0;
  var w = P.sdrWeights || {}, qv = (P.sdrVariable || 0) / 4;
  if (!w.count) return 0;
  return E.roleEarn(P, qv * w.count, (m.created || 0) / m.target) -
         E.roleEarn(P, qv * w.count, Math.max(0, (m.created || 0) - 1) / m.target);
}
/* The rate the view reports, computed only over meetings old enough to have
   resolved, so it does not sag every time somebody books one. */
function meetRate(names){
  var wk = weekNum(), seen = 0, hit = 0;
  (L.created || []).forEach(function(c){
    if (c.unit !== "meeting" || c.week > wk || !names[c.sdr]) return;
    if (!c.becameOpp && wk - c.week < MEET_MATURE) return;
    seen++; if (c.becameOpp && c.oppWeek <= wk) hit++;
  });
  return {rate: seen ? hit / seen : 0, seen: seen, hit: hit};
}
/* NULL-SAFE, because `cardApi()` is called once at mount, before the first
   render has built a plan. */
function meetingsPlan(){ return !!(P && P.early && P.hasSdr); }
function dealFilterFor(name){
  var t = (S.teams || []).filter(function(x){ return x.manager === name; })[0];
  if (t){
    var mine = {}; (t.members || []).forEach(function(m){ mine[m.name] = 1; });
    mine[t.manager] = 1;
    return t.manages === "SDR" ? function(d){ return mine[d.createdByRep]; }
                               : function(d){ return mine[d.rep]; };
  }
  if ((S.sdrs || []).some(function(m){ return m.name === name; }))
    return function(d){ return d.createdByRep === name; };
  return function(d){ return d.rep === name; };
}
/* The whole findings area, saying what is missing rather than sitting empty.
   Javier, 15 Oct: on the admin's screen the findings only exist once you pick
   somebody, so the absence has to be loud enough that you notice you are
   missing something. */
var DEPT_HINT = {
  AE:  "Click on a Sales rep or their manager to see their findings.",
  SDR: "Click on an SDR or their manager to see their findings.",
  CS:  "Click on a CSM or their manager to see their findings."
};
function findHint(msg){
  return '<div class="findhint"><p>' + esc(msg) + '</p></div>';
}
function tree(){
  var out = [], coRows = firedFor("CEO"), isCeo = ST.role === "ceo";
  /* "The team" on the CEO's own screen, "The company" on the admin's. Javier,
     15 Oct: the company is not the admin's team, it is the CEO's. */
  /* AND THE FINDINGS BELONG TO THE PERSON, NOT THE ORG. On the admin's table
     the CEO is a row of his own, so the counts move down to him and the
     company row keeps only what it has always been, the organisation's
     number. On the CEO's own screen there is no such row: he is the one
     reading it. */
  out.push('<tr class="sel" data-kind="co" data-tone="' + tone("CEO", coRows) +
    '"><td class="nm">' + caret("co", true) +
    '<b>' + (isCeo ? "The team" : "The company") + '</b></td><td>&mdash;</td><td>' +
    barHTML(S.company.attain, tone("CEO", coRows)) + '</td>' +
    '<td class="num">' + (isCeo ? pills(coRows) : "") + '</td></tr>');
  if (!nodeOpen("co", true)) return treeHeader() + out.join("");
  /* THE CEO IS A PERSON AND THE ORG HANGS OFF HIM. Javier, 15 Oct: his own
     name in the name column, CEO in the role column, his own caret, and every
     department nested under him rather than beside him. He is not on his own
     team, which is why his screen has no row like this and the admin's does. */
  var ceoName = (L.ceo && L.ceo.name) || "CEO";
  if (!isCeo){
    out.push('<tr class="' + selCls("ceo", ceoName).replace(/^ /, "") +
      '" data-kind="ceo" data-key="' + esc(ceoName) +
      '" data-tone="' + tone("CEO", coRows) + '"><td class="nm ind1">' +
      caret("ceo", true) + esc(ceoName) + '</td><td>CEO</td><td>' +
      barHTML(S.company.attain, tone("CEO", coRows)) + '</td>' +
      '<td class="num">' + pills(coRows) + '</td></tr>');
    if (!nodeOpen("ceo", true)) return treeHeader() + out.join("");
  }
  /* One level deeper on the admin's table than on the CEO's, because of the
     row above. */
  var D1 = isCeo ? "ind1" : "ind2", D2 = isCeo ? "ind2" : "ind3",
      D3 = isCeo ? "ind3" : "ind4";

  DEPTS.forEach(function(d){
    var key = d[0], label = d[1], teams = teamsOf(key), loose = looseOf(key);
    if (!teams.length && !loose.length) return;

    /* The department figure is the roll-up of its teams and its count is the
       roll-up of their findings. It carries no colour of its own, because there
       is no department finding set: the engine judges the company, a manager
       and a person, and nothing in between. */
    var M = deptMeasure(key, teams, loose);
    var bad = 0, warn = 0, pairs = [];
    var count = function(r){ if (r.tone === "bad") bad++; else if (r.tone === "warn") warn++; };
    teams.forEach(function(t){
      var mr = firedFor("MGR", t);
      pairs.push([t, mr]);
      mr.forEach(count);
      (t.members || []).forEach(function(m){ firedFor(roleOf(key), m).forEach(count); });
    });
    loose.forEach(function(m){ firedFor(roleOf(key), m).forEach(count); });
    var dId = "dept:" + key;
    out.push('<tr class="dept' + selCls("dept", key) + '" data-kind="dept" data-key="' + key +
      '" data-tone="' + M.tone + '"><td class="nm ' + D1 + '">' +
      caret(dId, true) +
      '<b>' + esc(label) + '</b></td><td>' + deptCount(teams, loose) + '</td><td>' +
      barHTML(M.frac, M.tone, M.opt) + '</td>' +
      '<td class="num"><span class="counts">' +
        (bad  ? '<span class="pill r">' + bad  + '</span>' : '') +
        (warn ? '<span class="pill a">' + warn + '</span>' : '') +
      '</span></td></tr>');
    if (!nodeOpen(dId, true)) return;

    pairs.forEach(function(pair){
      var t = pair[0], mr = pair[1], tId = "team:" + t.manager;
      /* A CS MANAGER WAS THE LAST LEVEL ON THE OLD MEASURE. t.attain is
         renewals landed over the whole book, which in week 6 is mostly a
         statement about the calendar, so every CS manager sat at 21-36% with
         every one of their own people between 56 and 82. Their bar is now the
         same retention measure on the same bent track as the people under
         them. The COLOUR is untouched: a manager's row takes its tone from
         their findings, not from their number, and that is a separate rule.
         Javier, 13 Oct. */
      var csT = key === "CS" ? retFor(t.members) : null;
      out.push('<tr class="' + selCls("team", t.manager).replace(/^ /, "") +
        '" data-kind="team" data-key="' + esc(t.manager) +
        '" data-tone="' + tone("MGR", mr) + '"><td class="nm ' + D2 + '">' +
        caret(tId, false) + esc(t.manager) +
        '</td><td>' + (key === "CS" ? "CS" : key === "SDR" ? "SDR" : "Sales") +
        ' Manager</td><td>' +
        (csT ? barHTML(csT.ret === null ? 0 : csTrack(csT.ret), tone("MGR", mr),
                       {floor: 0, top: 1, tick: CS_TICK})
             : barHTML(t.attain, tone("MGR", mr))) + '</td>' +
        '<td class="num">' + pills(mr) + '</td></tr>');
      if (!nodeOpen(tId, false)) return;
      (t.members || []).forEach(function(m){
        out.push(personRow(key, m, D3));
      });
    });
    /* One level in from the department, where a manager would be, because
       there is no manager to put them under. */
    loose.forEach(function(m){ out.push(personRow(key, m, D2)); });
  });
  return treeHeader() + out.join("");
}

/* ---------------------------------------------------------------- deals
   THE LIST COMES FROM dealsAsOf(L, week), NOT FROM THE RAW LEDGER. The raw
   deals in L are the seed: half of them carry a stage and no expected close,
   the other half the reverse, because the engine resolves both as of a given
   week. Reading the seed directly is what produced deals with no stage and
   deals with no close date, and it also threw away the stale flag, which is the
   whole point of a parked deal: still forecast to close this quarter, sitting
   in the same stage far too long. Every open deal here has a stage, a close
   week and a weeks-in-stage, because the engine worked them out. */
function stageText(d){
  if (d.status === "Won")  return "Won";
  if (d.status === "Lost") return "Lost";
  return d.stage || "";
}
/* Every row in this table closes inside the quarter, so the week is always 1 to
   13. Deals forecast beyond it are filtered out rather than labelled. */
/* ---- FORMATTERS -----------------------------------------------------------
   ONE HOME PER PRESENTED THING. This file had helpers for every VALUE and
   almost none for the PRESENTATION of a value, so a week label, a role label
   and a pay row were written longhand at each render site. That is why fixing
   LQ in the deal table left the hover card still printing "week -3": there was
   no one place to fix. Worse, `weekText` already existed and the LQ rule was
   added as a NEW inline ternary beside it rather than inside it.

   Anything that renders one of these calls the formatter. `format-check.js`
   fails the build if a raw pattern appears anywhere else. Javier, 18 Oct:
   "isn't it fixed on a source level so it is ok everywhere all at once". */
function weekLabel(wk){
  if (wk === undefined || wk === null || wk === "") return "";
  /* Week 0 and below is last quarter. The ledger deals a third of its rows
     there and both "Wk 0" and "Wk -3" read as bugs. */
  return wk < 1 ? "LQ" : "Wk " + wk;
}
var ROLE_LABEL = {AE: "AE", SDR: "SDR", CS: "CSM"};
function roleLabel(r){ return ROLE_LABEL[r] || r || "AE"; }
function weekText(d){
  return weekLabel(d.status === "Open" ? d.expectedClose : d.week);
}

/* Sorting. Every column, click to sort, click again to reverse. Stage sorts by
   where it sits in the pipeline rather than alphabetically, because Demo coming
   before Discovery is the kind of thing that makes a table look wrong. */
/* ONE AXIS FOR THREE DEAL TYPES: HOW FAR ALONG IS IT.

   This was an ARRAY of the four new-business stages plus Won and Lost, and the
   comparator sent anything not in it to the end. Renewals run a different
   ladder, `RENEWAL_STAGES` in the engine: Renewal Identified, Quote Sent,
   Negotiation. So the first two were unranked, landed AFTER Lost, and were
   tied with each other. Javier, 21 Oct: "when I sort the table by stage and I
   wanted to see the Lost or Won at the top, I don't get to them, I get to the
   renewal stages instead."

   A map rather than an array, because the fix is that two names share a rank.
   `Negotiation` was already shared by both ladders and already worked, which
   is what the rest of this is copying.

   THE EIGHT NAMES ARE MEASURED, NOT ASSUMED. Swept across all 8 presets at
   weeks 6, 10, 13 and closed: Won, Lost, Demo, Proposal, Discovery, Renewal
   Identified, Negotiation, Quote Sent. Nothing else exists, so nothing falls
   through to the default below. If a ninth ever appears it sorts last, which
   is the behaviour that caused this bug, so add it here. */
var STAGE_RANK = {
  "Discovery": 0, "Renewal Identified": 0,
  "Demo": 1,
  "Proposal": 2, "Quote Sent": 2,
  "Negotiation": 3,
  "Won": 4,
  "Lost": 5
};
/* The two columns the wide rep table adds. */
var SORTS = {
  type: function(d){ return String(d.type || ""); },
  src:  function(d){ return String(d.createdByRep || d.createdBy || ""); },
  created: function(d){ return d.createdWeek || 0; },
  paid: function(d){ return d.acv || 0; },
  opp:   function(d){ return d.name.toLowerCase(); },
  owner: function(d){ return (d.rep || "").toLowerCase(); },
  stage: function(d){ var r = STAGE_RANK[stageText(d)];
                      return r === undefined ? 99 : r; },
  acv:   function(d){ return d.acv || 0; },
  week:  function(d){ return (d.status === "Open" ? d.expectedClose : d.week) || 0; }
};
/* THE DEFAULT ARRANGEMENT, and a way back to it. The sort was a two-state
   toggle, so the first click on any header threw the default away for good
   and nothing brought it back. Three states now: ascending, descending, off,
   and OFF IS THE DEFAULT, so the third click takes you home without the
   screen growing a reset button.

   The default is open deals first by soonest close, then resolved most recent
   first: what is coming, then what happened, which is the order a rep reads
   their own quarter in. A column sort flattens that grouping, because a date
   sort that still forces open deals to the top is not a date sort. */
function defaultRows(open, closed){
  return open.slice().sort(function(a, b){
      return (a.expectedClose - b.expectedClose) || (b.acv - a.acv); })
    .concat(closed.slice().sort(function(a, b){
      return (b.week - a.week) || (b.acv - a.acv); }));
}
/* `map` so a second table can sort its own rows by the same column ids without
   borrowing the deal table's comparators, which read fields a meeting does not
   have. The guard matters: the two tables do not carry the same columns, and a
   column with no comparator now leaves the order alone instead of throwing. */
function sortRows(rows, map){
  if (!ST.sort) return rows;
  var get = (map || SORTS)[ST.sort.col], dir = ST.sort.dir;
  if (!get) return rows;
  return rows.slice().sort(function(a, b){
    var x = get(a), y = get(b);
    if (x < y) return -dir;
    if (x > y) return dir;
    return 0;
  });
}
function th(col, label, cls){
  var on = ST.sort && ST.sort.col === col;
  return '<th class="sortable ' + (cls || "") + (on ? " on" : "") +
    '" data-col="' + col + '">' + label +
     /* The arrow is always there, faint, so a column reads as sortable before
       anybody clicks it, and becomes a single direction once it is the column
       being sorted. */
    '<span class="caret">' + (on ? (ST.sort.dir > 0 ? "\u2191" : "\u2193") : "\u21c5") +
    '</span></th>';
}

/* THE SHAPE FOLLOWS THE VIEW, THE FILTER ONLY NARROWS. Selecting a person on
   RevOps used to swap in the seven-column rep table, inside a 40% column,
   because the builder branched on whether a filter was passed. A RevOps
   reader selecting a rep wants that rep's deals in the table they are already
   reading, not a different table. Javier's spec says the deal table FILTERS
   to their deals, and says nothing about it changing. Javier, 13 Oct. */
/* THE SDR LENS IS A PROPERTY OF WHOSE DEALS THESE ARE, not of which view is
   open. It used to be read off the manager shell, so an SDR team selected from
   the admin's table or pointed at from the CEO's got the AE column set over
   rows that are nobody's to own. Callers that know the answer pass it.
   Javier, 15 Oct. */
function deals(keep, wide, lens){
  var A = E.dealsAsOf(L, weekNum());
  /* The same table, narrowed to one person on a rep view. A rep's screen shows
     a rep's deals; everything else about the table is identical, so there is
     one builder and one sort. */
  if (keep) A = {won: A.won.filter(keep), lost: A.lost.filter(keep), open: A.open.filter(keep)};
  /* A PICKLIST, NOT CHIPS. Four chips would park permanent chrome in the
     densest box on the screen; a select shows one word until somebody touches
     it, and the two persona pickers already teach a select as "narrow what
     you are looking at". It only changes what the TABLE shows: nothing else
     on screen recalculates, because the moment it did this would stop being a
     lookup and start being a planning tool. Javier, 13 Oct. */
  if (ST.type){
    var byType = function(d){ return (d.type || "") === ST.type; };
    A = {won: A.won.filter(byType), lost: A.lost.filter(byType), open: A.open.filter(byType)};
  }
  var closed = A.won.concat(A.lost).sort(function(a, b){ return b.week - a.week; });
  /* THIS TABLE IS THIS QUARTER'S DEALS, nothing else. A deal forecast past week
     13 is next quarter's, so it is not here: it drops out of the table on the
     week its close date moves, which is what being pushed looks like from the
     outside. */
  var open   = A.open.filter(function(d){ return d.expectedClose <= E.QTR_WEEKS; })
    .sort(function(a, b){ return a.expectedClose - b.expectedClose; });
  var rows   = ST.sort ? sortRows(closed.concat(open)) : defaultRows(open, closed);

  /* THE REP'S TABLE IS THE WIDE ONE. Recorded 7 Oct and never built: the deal
     table is widest on a rep screen because a rep cares enormously about their
     own deals and only mildly about the standings, and it is the narrow one on
     RevOps and the CEO where the people table is the main event. The extra
     width buys the three columns that were cut to fit 35%: the product, what
     the deal paid THEM, and the marker on the deal that tips them past a line.
     Owner goes, because on a rep's own table every row is their own name. */
  /* A CSM'S OWN BOOK IS A REP'S TABLE. It ran the admin column set because
     the set followed the SHELL and a CSM's shell is "mid", so it carried an
     Owner column naming the same person on every row and no Paid column at
     all. Javier, 19 Oct: "no reason why the CSMs columns and the AE columns
     shouldn't match". Columns follow whether the table is your OWN; only the
     width follows the shell. */
  var csOwn = !wide && SH().tiles === "cs" && !!A_VIEWER();
  var rep = wide ? pay(rows) : (csOwn ? payCS(rows) : null);
  LAST_PAY = rep;
  /* AN SDR MANAGER READS THE SAME TABLE FOR A DIFFERENT REASON. Every row on
     their screen was created by one of their people and is owned by somebody
     else's, so Owner names a stranger and Stage is a stranger's business.
     Created by and the week it was created are what their own number is made
     of. Close stays, because what happened to it is the point of showing the
     row at all. Javier, 14 Oct. */
  var sdrLens = lens === "SDR" ||
    (lens === undefined && SH().tiles === "mgr" && (A_TEAM() || {}).manages === "SDR");
  /* Not on an SDR table: those rows are owned by AEs outside the team, so a
     mark about somebody else's quota is noise on that screen. */
  /* AN SDR SEES WHAT MOVES THEIR OWN NUMBER. Every row on this table is owned
     by an AE, so the question is not whose deal it is but whether it pays the
     SDR who sourced it. Created this quarter feeds the count and the pipeline
     value; a deal created LAST quarter feeds neither, and only earns them
     anything if it WON this quarter on a plan that carries a won component.
     Javier, 15 Oct: "I should only see deals that affect their commission".
     The LQ rows that survive are exactly the ones that still pay. */
  if (sdrLens){
    var hasWon = !!((P.sdrWeights || {}).won);
    rows = rows.filter(function(d){
      /* A POTENTIAL PAYER COUNTS, not just one that has already paid. Created
         this quarter feeds the count and the pipeline value whatever happens
         to it. A LAST-QUARTER deal feeds neither, so on a plan with no won
         component it can never pay and does not belong here at all; on a plan
         WITH one it is still live money until it resolves, so it stays unless
         it is lost. Javier, 15 Oct: "it needs to keep all deals as potential
         commission givers, not just the ones that actually do". */
      return (d.createdWeek >= 1) || (hasWon && d.status !== "Lost");
    });
  }
  /* THE MAP FOLLOWS THE ROW, NOT THE VIEW. Picking by view meant a RevOps
     table filtered to Renewal got the AE map over CS rows: eight triangles and
     one consequence line, which is what Javier screenshotted on 19 Oct. The
     two maps are disjoint already, since `crossMap` resolves `aeOf(d.rep)` and
     drops anyone who is not an AE while `crossMapCS` only looks at renewals,
     so running both and merging is the whole fix. */
  var cm = sdrLens ? {by: {}, hits: 0, reps: 0}
                   : crossMerge(crossMap(rows), crossMapCS(rows));
  LAST_XNOTE = xnoteFor(cm);
  if (ST.onlyX && cm.hits) rows = rows.filter(function(d){ return cm.by[d.id]; });
  else if (ST.onlyX) ST.onlyX = false;
  /* "Created" holds "Wk 2" or "LQ". Giving it a name's share of the table put
     a hand's width of nothing between it and Created by. Javier, 15 Oct. */
  if (!rep) return '<colgroup><col style="width:' + (sdrLens ? "47%" : "43%") +
    '"><col style="width:' + (sdrLens ? "33%" : "28.5%") + '">' +
    '<col style="width:' + (sdrLens ? "20%" : "28.5%") + '"><col style="width:' +
    CW.acv + 'px"><col style="width:' + CW.wk + 'px"></colgroup>' +
    '<thead><tr>' + th("opp","Opportunity") +
    th(sdrLens ? "src" : "owner", sdrLens ? "Created by" : "Owner") +
    (sdrLens ? th("created","Created","num") : th("stage","Stage")) +
    th("acv","ACV","num") + th("week","Closed","num") + '</tr></thead><tbody>' +
    rows.map(function(d){
      var cls = d.status === "Won" ? "won" : d.status === "Lost" ? "lost"
              : d.stale ? "stale" : "open";
      var xm = cm.by[d.id];
      return '<tr data-deal="' + d.id + '" class="' + (d.stale ? "stale " : "") +
        (xm ? "crosses" : "") + '">' +
        '<td class="nm oppcell"><span class="dot ' + cls + '"></span>' +
        '<span class="txt">' + esc(d.name) + '</span>' +
        (xm ? '<span class="xmark" title="' + esc(xm.text) + '">\u25b2</span>' : '') + '</td>' +
        '<td>' + esc(sdrLens ? (d.createdByRep || d.createdBy || "") : d.rep) + '</td>' +
        /* A deal created in week 0 or earlier came from last quarter, and 30%
           of the ledger did. Blank read as missing data and "Wk -1" read as a
           bug; LQ is what it actually means. Javier, 15 Oct. */
        (sdrLens ? '<td class="num">' + weekLabel(d.createdWeek) + '</td>'
                 : '<td>' + esc(stageText(d)) + '</td>') +
        '<td class="num">' + E.moneyK(d.acv) + '</td>' +
        '<td class="num">' + weekText(d) + soonFlag(d) + '</td></tr>';
    }).join("") + '</tbody>';

  /* THE FULL OPPORTUNITY NAME. It was cut to the account alone to stop the
     Product column repeating it, and Javier was right that this is backwards:
     "that's the actual opp name, otherwise it makes no sense and it is just
     the company name". So the name stays whole and the PRODUCT column goes,
     since the name already ends in it. Type and Sourced take its place, and
     Sourced is the one genuinely new fact, who put the opportunity there. */
  /* THE COLUMN SET IS DECIDED HERE, NOT IN CSS. Hiding a table column with
     display:none removes it from the table's column structure, so the <col>
     elements shift and the wrong column inherits the zero width: Stage came
     out 0px wide on the laptop. The set is chosen from the viewport, and the
     colgroup and the cells are built from the same list, so they cannot
     disagree.

     The drop order is the one recorded on 7 Oct, finally exercised. Source
     goes first, it reads "AE" on most rows. Type goes next, because the
     picklist above the table already filters by it. Five columns is what the
     RevOps table carries anyway. Javier, 13 Oct, my call, flagged. */
  /* AND SOURCE GOES WITH OWNER ON A CSM'S BOOK. Every renewal in it was
     sourced by CS, so the column repeats one word down the page, which is the
     same thing Javier objected to about Owner. Dropping it here rather than in
     `dealCols` keeps the viewport rule in one place. */
  var cols = dealCols();
  if (csOwn) cols = cols.filter(function(k){ return k !== "src"; });
  var TH = {opp:['opp','Opportunity'], type:['type','Type'], src:['src','Source'],
            stg:['stage','Stage'], acv:['acv','ACV','num'],
            paid:['paid','Paid','num'], wk:['week','Close','num']};
  return '<colgroup>' + cols.map(function(k){
      return '<col style="width:' + (k === "opp" ? "100%" : CW[k] + "px") + '">';
    }).join('') + '</colgroup>' +
    '<thead><tr>' + cols.map(function(k){
      return th(TH[k][0], TH[k][1], TH[k][2]); }).join('') + '</tr></thead><tbody>' +
    rows.map(function(d){
      var cls = d.status === "Won" ? "won" : d.status === "Lost" ? "lost"
              : d.stale ? "stale" : "open";
      var m = rep.by[d.id] || {};
      /* Stale and crossing are different facts and both can be true, so the
         tint carries the stale state the way the RevOps table does and the
         crossing deal is marked on the row rather than by replacing it. */
      /* The mark sits OUTSIDE the truncating text. Inside it, the ellipsis
         ate it on every long opportunity name, which is most of them. */
      var cell = {
        opp:  '<td class="nm oppcell"><span class="dot ' + cls + '"></span>' +
              '<span class="txt">' + esc(d.name) + '</span>' +
              (m.crosses ? '<span class="xmark" title="' + esc(m.crosses) +
               '">\u25b2</span>' : '') + '</td>',
        type: '<td>' + esc(d.type || "") + '</td>',
        src:  '<td>' + esc(d.createdBy || "") + '</td>',
        stg:  '<td>' + esc(stageText(d)) + '</td>',
        acv:  '<td class="num">' + E.moneyK(d.acv) + '</td>',
        /* THE COLUMN IS PAST TENSE, so anything that has not resolved reads as
           a dash rather than a zero. An AE's open deal was printing "$0",
           which says it paid nothing when nothing has happened to it yet, and
           a won renewal under the 88% gate was printing a dash, which says
           the same thing about money that is coming. Three states:

             not won yet, or lost   dash
             won, under the gate    TBD, and it recalculates when secured
                                    crosses 88% and again at the ceiling
             won                    the money

           Javier, 19 Oct. */
        paid: '<td class="num' + (m.paid ? '' : ' dim') + '">' +
              (d.status !== "Won" ? "\u2014"
               : m.notYet ? "TBD"
               : E.money(Math.round(m.paid || 0))) + '</td>',
        wk:   '<td class="num">' + weekText(d) + soonFlag(d) + '</td>'
      };
      return '<tr data-deal="' + d.id + '" class="' +
        (d.stale ? "stale " : "") + (m.crosses ? "crosses" : "") + '">' +
        cols.map(function(k){ return cell[k]; }).join('') + '</tr>';
    }).join("") + '</tbody>';
}
/* THE WORD, NOT A DOT. A dot needs a legend and a legend at the foot of a
   scrolling table sits below the fold exactly when it is wanted. "next" needs
   nothing: the week lever above says which week it is. Javier, 13 Oct. */
function soonFlag(d){
  return closingNext(d) ? ' <em class="soon">next</em>' : '';
}
/* And the triangle gets a sentence rather than a legend entry, because what a
   reader wants is which deal and when, not what a symbol means. It only
   appears when there is a crossing deal, and it names it. */
function crossNote(rep){
  var id = Object.keys(rep.by).filter(function(k){ return rep.by[k].crosses; })[0];
  if (!id) return "";
  var d = (rep.rows || []).filter(function(x){ return String(x.id) === String(id); })[0];
  if (!d) return "";
  return '<p class="xnote"><span class="xmark">\u25b2</span> Winning ' +
    esc(d.account || String(d.name || "").split(" - ")[0]) + ' ' +
    esc(rep.by[id].crosses) + '</p>';
}
/* A DEAL FACT, so it travels to every table: the deal lands next week.
   Measured before building it: no open deal ever carries the CURRENT week on
   any preset, because the engine resolves a deal the week it lands, so
   "next week" is the soonest state that exists. It is also common, 13 to 16
   of 16 reps on #full have one, which is what makes it the quiet mark beside
   the rare loud one. Javier, 13 Oct. */
function closingNext(d){
  return d.status === "Open" && d.expectedClose === weekNum() + 1;
}

/* WHAT EACH DEAL PAID THEM, and which one crossed a line.

   Won deals are walked in the order they CLOSED and priced marginally, so the
   quarter's commission is split across the deals that earned it rather than
   every deal claiming the same threshold. That ordering rule is the one the
   hover cards already use; doing it any other way had four of one rep's wins
   each claiming to be the deal that crossed. Open deals are priced as if they
   landed next, on top of what is already closed. Lost deals paid nothing. */
/* COLUMN WIDTHS ARE PIXELS, NOT PERCENTAGES. Javier, 13 Oct: "The word next
   doesn't fit in the 1440." The cause was that every column was a percentage
   of the table, so a column holding content of a FIXED size got narrower as
   the screen did, while content that does not shrink stayed the same. Close
   had 67.8px of room at 1680 and 54.6 at 1440; "Wk 10 next" needs 64.2.

   Measured across every preset and all thirteen weeks, the widest content each
   column can ever hold: Type 82.8 ("New business"), Source 54.5 (the header),
   Stage 68.0 ("Negotiation") on a rep table and 108.8 ("Renewal Identified")
   where CS renewals appear, ACV 40.0 ("$204K"), Paid 51.0, Close 64.2. Add the
   14px of cell padding and about 4 of cushion and the number below is what the
   column needs. None of that changes with the viewport, so none of it is a
   percentage any more.

   Opportunity is the only column whose content has no ceiling, so it takes
   100% and the browser gives it everything the others leave. It gains at every
   size: 263px of text at 1680, 213 at 1440, 231 at 1280, against 231/204/192
   before. That is the other half of Javier's note, "there is still a lot of
   space between stage and acv" and "you can remove more from the opportunity
   name" if it is not enough. It was enough, and the name grew instead.

   The narrow RevOps table keeps percentages for its three text columns, since
   Owner and Stage there hold names and "Renewal Identified" and must share
   what is left rather than each hold its worst case: at 1280 the three of them
   together have less room than Stage alone would need. ACV and Close are
   pixels there too, so the Close column cannot clip on that table either. */
var CW = {type:100, src:72, stg:86, acv:58, paid:70, wk:84};

/* Measured, not guessed: 1500 is where seven columns stop fitting and 1350
   is where six do. */
/* The team whose screen this is, for the one place the deal table needs to
   know. Null on every view that is not a manager's. */
function A_TEAM(){
  return SH().tiles === "mgr"
    ? (S.teams || []).filter(function(x){ return x.manager === ST.who; })[0] || null : null;
}
function dealCols(){
  var w = window.innerWidth;
  if (w >= 1500) return ["opp","type","src","stg","acv","paid","wk"];
  if (w >= 1350) return ["opp","type","stg","acv","paid","wk"];
  return ["opp","stg","acv","paid","wk"];
}
var LAST_PAY = null, LAST_XNOTE = "";
/* THE CROSSING IS A FACT ABOUT A REP AND THEIR OPEN PIPE, so it holds on any
   table those rows appear in, not only on the rep's own. It used to be
   computed inside `pay()`, which runs for one rep on the wide table, so a
   manager looking at eight people's deals saw no marks at all and the three
   places that set `xnote` to "" stayed blank. Javier, 15 Oct: the scope of the
   TABLE decides, not the role. One rep in it gets the sentence, more than one
   gets the count. Measured first: four or more reps carry a crossing in 24% of
   manager-weeks and seven at worst, so a sentence each was never an option. */
/* A RENEWAL CROSSES THE OTHER WAY. For an AE the mark finds the open deal
   that takes them OVER a line. Retention only ever falls, so for a CSM it
   inverts: the mark finds the renewal whose LOSS would drop them THROUGH one,
   the full-pay line first and the gate where they are already under it. This
   is why filtering to Renewals lost the flag: `crossMap` needs a quota and a
   rate ladder and a CSM has neither. Javier, 15 Oct. */
function csOf(name){
  return (S.css || []).filter(function(m){ return m.name === name; })[0] || null;
}
function A_VIEWER(){ return SH().viewer ? ST.who : null; }
function crossMapCS(rows){
  var byRep = {}, out = {}, hits = 0;
  rows.forEach(function(d){
    if (d.rep && d.type === "Renewal" && d.status === "Open")
      (byRep[d.rep] = byRep[d.rep] || []).push(d); });
  /* UPWARD, like the AE's. It used to mark the smallest renewal whose LOSS
     broke a line, which is the inversion Javier rejected on 19 Oct. It now
     marks the one that takes SECURED over the next line, soonest first and the
     largest on a tie, which is the AE map's own ordering. */
  Object.keys(byRep).forEach(function(nm){
    var m = csOf(nm), L0 = csLadder(m);
    if (!L0 || !L0.next) return;
    var bar = L0.book * L0.next.at;
    if (L0.secured >= bar) return;
    var able = byRep[nm].filter(function(d){
      return L0.secured + (d.acv || 0) >= bar; })
      .sort(function(x, y){ return (x.expectedClose - y.expectedClose) || (y.acv - x.acv); });
    if (!able[0]) return;
    out[able[0].id] = {deal: able[0], rep: nm, cs: true,
      text: "clears " + L0.next.label + " for " +
        (A_VIEWER() === nm ? "you" : nm.split(" ")[0]) + ", where retention " +
        (L0.next.on ? "starts paying." : "tops out.")};
    hits++;
  });
  return {by: out, hits: hits, reps: Object.keys(byRep).length, cs: true};
}
function crossMap(rows){
  var byRep = {}, out = {}, hits = 0;
  rows.forEach(function(d){ if (d.rep) (byRep[d.rep] = byRep[d.rep] || []).push(d); });
  Object.keys(byRep).forEach(function(nm){
    var r = aeOf(nm);
    if (!r || !r.quota) return;
    var q = r.quota, at = r.closed || 0, lines = [];
    if ((P.decel || {}).thr && at < q * P.decel.thr)
      lines.push([q * P.decel.thr, "clears the " + E.pct0(P.decel.thr) +
        " line, where the reduced rate stops"]);
    var af = (P.accel || {}).from || 1;
    if (at < q * af) lines.push([q * af, "takes " + nm.split(" ")[0] + " past quota"]);
    var target = lines.sort(function(x, y){ return x[0] - y[0]; })[0];
    if (!target) return;
    var able = byRep[nm].filter(function(d){
      return d.status === "Open" && d.expectedClose <= E.QTR_WEEKS &&
             at + (d.acv || 0) >= target[0]; })
      .sort(function(x, y){ return (x.expectedClose - y.expectedClose) || (x.acv - y.acv); });
    if (!able[0]) return;
    out[able[0].id] = {deal: able[0], rep: nm, text: target[1] +
      ". It is forecast for week " + able[0].expectedClose + "."};
    hits++;
  });
  return {by: out, hits: hits, reps: Object.keys(byRep).length};
}
/* THE NOTE IS A CONTROL. On a manager's 490 rows a triangle is findable; on
   the company's 1,617 Javier had to go fishing for it. Clicking the line
   narrows the table to the marked deals and clicking it again lets go, which
   reuses the filtering already here rather than inventing a stepper.
   Javier, 15 Oct. */
function crossMerge(ae, cs){
  var by = {}, k;
  for (k in ae.by) by[k] = ae.by[k];
  for (k in cs.by) by[k] = cs.by[k];
  return {by: by, hits: ae.hits + cs.hits, reps: ae.reps + cs.reps,
          cs: !!(cs.hits && !ae.hits), mixed: !!(cs.hits && ae.hits)};
}
function xnoteFor(cm){
  if (!cm.hits) return "";
  if (cm.reps === 1){
    var k = Object.keys(cm.by)[0], one = cm.by[k];
    return '<p class="xnote"><span class="xmark">\u25b2</span> ' +
      (one.cs ? "Holding " : "Winning ") +
      esc(one.deal.account || String(one.deal.name || "").split(" - ")[0]) + ' ' +
      esc(one.text) + '</p>';
  }
  /* A renewal crosses upward now, the same way a deal does, so one sentence
     covers a table holding either or both. */
  var what = cm.mixed ? "take someone over their next line"
           : cm.cs ? "take a CSM over their next line"
           : "take a rep over their next line";
  return '<p class="xnote xclick' + (ST.onlyX ? " on" : "") + '" data-onlyx="1">' +
    '<span class="xmark">\u25b2</span> ' +
    (ST.onlyX ? "Showing the " + (cm.hits === 1 ? "one deal" : capWord(cm.hits).toLowerCase() +
      " deals") + " that would " + what + ". Click to show them all."
     : (cm.hits === 1 ? "One" : capWord(cm.hits)) +
       " of these would " + what + ". Click to see just " +
       (cm.hits === 1 ? "it" : "them") + ".") + '</p>';
}
function capWord(n){
  var w = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
           "Nine", "Ten", "Eleven", "Twelve"];
  return w[n] || String(n);
}
/* WHAT EACH ROW PAID THE CSM WHO OWNS IT, in the shape `pay()` returns so the
   column builder cannot tell them apart. Renewals price on the retention
   ladder and expansions at their flat per-dollar rate, which is the same split
   `dealPay` makes in the hover. */
function payCS(rows){
  var name = (rows[0] || {}).rep; if (!name) return null;
  var m = csOf(name); if (!m) return null;
  var L0 = csLadder(m), by = {};
  var expFull = (P.csVariable || 0) * (P.csExpWeight || 0) / 4;
  /* Under the gate the retention component has not started, so a renewal that
     has already closed has still earned nothing SO FAR. That is a dash, not a
     zero. Expansion has no gate and pays from the first dollar, which is why
     those rows carry money all quarter. */
  var underGate = !!(L0 && L0.lvl < RF());
  rows.forEach(function(d){
    var v = 0, notYet = false;
    if (d.type === "Renewal" && L0){
      v = d.status === "Won" ? csWorthHad(L0, d.acv) : 0;
      notYet = d.status === "Won" && !v && underGate;
    } else if (d.type === "Expansion" && m.expTarget)
      v = d.status === "Won" ? expFull * Math.min(1, (d.acv || 0) / m.expTarget) : 0;
    by[d.id] = {paid: v, notYet: notYet};
  });
  return {rep: m, by: by, rows: rows};
}
function pay(rows){
  var name = (rows[0] || {}).rep; if (!name) return null;
  var r = aeOf(name); if (!r || !r.quota) return null;
  var q = r.quota, by = {}, run = 0;
  var c = function(x){ return E.commAt(P, x) / 4; };
  rows.filter(function(d){ return d.status === "Won"; })
    .slice().sort(function(a, b){ return (a.week - b.week) || (a.id < b.id ? -1 : 1); })
    .forEach(function(d){
      var before = run; run += d.acv || 0;
      by[d.id] = {paid: c(run / q) - c(before / q)};
    });
  var at = r.closed || 0;
  rows.forEach(function(d){
    if (by[d.id]) return;
    by[d.id] = {paid: d.status === "Open"
      ? c((at + (d.acv || 0)) / q) - c(at / q) : 0};
  });

  /* THE MARK POINTS FORWARD. It used to flag the won deal that happened to
     cross a line, which Javier called correctly: "completely useless after
     the fact". It now flags the OPEN deal that would take them over, and
     where several would, the one closing soonest, which is the one they can
     actually do something about.

     Measured across 8 presets x 4 weeks x every AE, 472 rep-weeks: one open
     deal crosses the nearest line 27.5% of the time, two are needed 18%, and
     three or more 44%. So this is deliberately rare. Where no single deal
     does it there is no mark, because the standing finding already says how
     many deals of their size it takes. */
  var lines = [];
  if ((P.decel || {}).thr && at < q * P.decel.thr)
    lines.push([q * P.decel.thr, "clears the " + E.pct0(P.decel.thr) +
      " line, where the reduced rate stops"]);
  var af = (P.accel || {}).from || 1;
  if (at < q * af) lines.push([q * af, "takes you past quota"]);
  var target = lines.sort(function(a, b){ return a[0] - b[0]; })[0];
  if (target){
    var able = rows.filter(function(d){
      return d.status === "Open" && d.expectedClose <= E.QTR_WEEKS &&
             at + (d.acv || 0) >= target[0]; })
      .sort(function(a, b){ return (a.expectedClose - b.expectedClose) || (a.acv - b.acv); });
    if (able[0]) by[able[0].id].crosses = target[1] +
      ". It is forecast for week " + able[0].expectedClose + ".";
  }
  return {rep: r, by: by, rows: rows};
}

/* ---- the filter: role, then who ---------------------------------------- */
/* A ROLE IS OFFERED ONLY WHEN THE PLAN HAS ONE. The switcher used to list all
   eight whatever the plan was, so a plan with no SDRs offered SDR and SDR
   Manager and landed on an empty view. Harmless in a mock-up with a preset
   switcher, but Claude Code would inherit a control that can select a persona
   the plan cannot produce. RevOps and the CEO are always there: one is the
   admin looking at it and the other exists on every plan. Javier, 8 Oct. */
/* THE SHELL IS A PROPERTY OF THE ROLE, NOT A TEST ON ITS NAME. Four views are
   still to come and every one of them is one of two shells with different
   contents: the rep shell (deals at 50%, a leaderboard, tiles about one person)
   and the admin shell (deals at 35%, the hierarchy, tiles about the company).
   Adding them by widening `ST.role === "ae"` four times is how role names end up
   scattered through the renderer, which is the shape that produced three dead
   blocks of column CSS and a `viewer` that was null on the first render after
   every switch. So the table below decides the screen and the branches read it.

   Javier's own description of the four, 14 Oct, is exactly these two shells:
   CS matches the AE "that's table size, the look of the BAN numbers, the
   simulator screen, filters, week"; Manager and CEO match RevOps; and SDR takes
   the RevOps sizing with the AE's leaderboard, "we won't re-invent the wheel for
   the less important group".

     shell   wide = the rep screen, narrow = the admin screen. Drives the column
             split, which deal table is built, and which column set it gets.
     levers  the four plan levers. A rep cannot re-rate their own plan.
     people  the table under the tiles: tree is the hierarchy, board is the
             leaderboard of their own peers.
     tiles   which tile row, named rather than branched on.
     viewer  whether this screen is somebody's own, which is what decides
             first-person copy and whose pay a card may show.
     pick    whether the person dropdown is live.
     select  whether clicking a row repoints the rest of the screen. RevOps
             only: it is the super-admin power, "clicking on an AE will show at
             the bottom the findings for that AE for that week, clicking on a
             Manager the same". Everywhere else a row click does nothing, so
             nothing on the row may LOOK clickable either. Javier, 14 Oct: a
             cursor that promises something and then does nothing is worse than
             no affordance. The caret keeps its pointer, because expanding a
             team is the one thing those rows still do.
     built   false while a view is still a placeholder. Flipping one of these to
             true plus writing its content is the whole of adding a view. */
/* THREE WIDTHS, NOT TWO. A rep's deal table is the wide one and the admin's
   is narrow, and a CSM sits between: four tiles do not fit above a wide table,
   and their book is not the main event the way an AE's pipeline is.
   Javier, 18 Oct: "CSM gets their own width". */
var ADMIN = {shell:"narrow", people:"tree",  pick:true,  viewer:false, built:false,
             select:false},
    REP   = {shell:"wide",   people:"board", pick:true,  viewer:true,  built:false,
             select:false};
function spec(base, over){
  var o = {}, k;
  for (k in base) o[k] = base[k];
  for (k in over) o[k] = over[k];
  return o;
}
var ALL_ROLES = [
  ["revops","RevOps (admin)", spec(ADMIN, {levers:true,  tiles:"co",  pick:false, built:true,
                                           select:true})],
  ["ceo","CEO",               spec(ADMIN, {levers:true,  tiles:"ceo", built:true})],
  ["mgr","Sales Manager",     spec(ADMIN, {levers:false, tiles:"mgr", viewer:true, built:true})],
  ["sdrmgr","SDR Manager",    spec(ADMIN, {levers:false, tiles:"mgr", viewer:true, built:true})],
  ["csmgr","CS Manager",      spec(ADMIN, {levers:false, tiles:"mgr", viewer:true, built:true})],
  ["ae","Account Executive",  spec(REP,   {levers:false, tiles:"ae",  built:true})],
  /* The one that is neither: the admin shell carrying a leaderboard, because an
     SDR's deals are mostly somebody else's by the time they matter. */
  ["sdr","SDR",               spec(REP,   {levers:false, tiles:"sdr", shell:"narrow",
                                           built:true})],
  ["cs","Customer Success",   spec(REP,   {levers:false, tiles:"cs", built:true,
                                           shell:"mid"})]
];
function roleSpec(key){
  var r = ALL_ROLES.filter(function(x){ return x[0] === key; })[0];
  return (r && r[2]) || ADMIN;
}
/* The spec for the screen being rendered right now. */
function SH(){ return roleSpec(ST.role); }
function roleExists(key){
  if (key === "revops" || key === "ceo" || key === "ae") return true;
  if (key === "sdr") return !!P.hasSdr;
  if (key === "cs")  return !!P.hasCs;
  /* A manager role needs a team that manages that role, not merely the role. */
  var want = key === "mgr" ? "AE" : key === "sdrmgr" ? "SDR" : "CS";
  return (S.teams || []).some(function(t){
    var m = t.manages || "AE";
    return want === "AE" ? (m !== "SDR" && m !== "CS") : m === want; });
}
function roles(){ return ALL_ROLES.filter(function(r){ return roleExists(r[0]); }); }
function peopleFor(role){
  /* ALPHABETICAL, not by attainment. The roster arrives sorted by how people
     are doing, and leaving it that way turns a control into a leaderboard.
     Ranking belongs on the leaderboard, which is a different thing and says
     so. Spec, Sep 2026. */
  if (role === "ae")  return (S.aes || []).map(function(x){ return x.name; })
    .sort(function(a, b){ return a.localeCompare(b); });
  if (role === "sdr") return (S.sdrs || []).map(function(x){ return x.name; });
  if (role === "cs")  return (S.css || []).map(function(x){ return x.name; });
  if (role === "mgr" || role === "sdrmgr" || role === "csmgr"){
    var want = role === "mgr" ? "AE" : role === "sdrmgr" ? "SDR" : "CS";
    return (S.teams || []).filter(function(t){
      return (t.manages || "AE") === want || (want === "AE" && t.manages !== "CS" &&
        t.manages !== "SDR"); }).map(function(t){ return t.manager; });
  }
  /* ONE CEO. This hardcoded fallback predates the ledger having a CEO at all,
     so the picker said Dana Whitfield while the admin's table said the real
     name. Javier, 15 Oct. */
  if (role === "ceo") return [(L.ceo && L.ceo.name) || P.ceoName || "the CEO"];
  return ["You"];
}
var DEAL_TYPES = ["New business", "Renewal", "Expansion"];
/* SCOPED TO THE TABLE, not to the ledger. Offering Renewal on an AE's screen
   is a filter that can only ever return nothing: renewals belong to CS. The
   list is built from the deals this view is actually showing. */
function fillTypes(){
  var t = el("typeSel");
  var scope = (L.deals || []);
  /* A MANAGER OWNS NO DEALS. Scoping the filter by the viewer's own name left
     every manager with an empty list and the control hidden, which is why
     Javier never saw an All deals picker on those screens. Theirs is the
     team's table, so the filter is scoped to the team's table. Javier,
     15 Oct. */
  var mt0 = SH().tiles === "mgr" ? A_TEAM() : null;
  if (mt0){
    var own0 = {}; (mt0.members || []).forEach(function(m){ own0[m.name] = 1; });
    own0[mt0.manager] = 1;
    scope = scope.filter(mt0.manages === "SDR"
      ? function(d){ return own0[d.createdByRep]; }
      : function(d){ return own0[d.rep]; });
  } else if (SH().viewer && ST.who)
    scope = scope.filter(function(d){ return d.rep === ST.who; });
  var live = DEAL_TYPES.filter(function(x){
    return scope.some(function(d){ return d.type === x; }); });
  if (ST.type && live.indexOf(ST.type) < 0) ST.type = "";
  t.innerHTML = '<option value="">All deals</option>' + live.map(function(x){
    return '<option' + (x === ST.type ? ' selected' : '') + '>' + esc(x) + '</option>';
  }).join('');
  t.hidden = live.length < 2;
}
function fillFilter(){
  var r = el("roleSel"), who = el("whoSel");
  /* Nobody arrives at an empty screen. The default is the rep closest to 100%,
     the typical one rather than the best one. */
  /* Nobody arrives at an empty screen. The AE default is the rep closest to
     100%, the typical one rather than the best; every other role takes the
     first name until it has a rule of its own. */
  if (SH().pick && !ST.who){
    if (ST.role === "ae"){ var d = closestToQuota(S.aes || []); if (d) ST.who = d.name; }
    else ST.who = peopleFor(ST.role)[0] || null;
  }
  r.innerHTML = roles().map(function(x){
    return '<option value="' + x[0] + '"' + (x[0] === ST.role ? ' selected' : '') + '>' +
      x[1] + '</option>'; }).join('');
  var names = peopleFor(ST.role);
  who.innerHTML = names.map(function(n){
    return '<option' + (n === ST.who ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
  who.disabled = !SH().pick;
}

/* ---- levers ------------------------------------------------------------ */
function levers(){
  var set = function(id, frac, text){
    var n = el(id); if (!n) return;
    n.querySelector(".track i").style.width = (frac * 100).toFixed(0) + "%";
    n.querySelector(".track u").style.left  = (frac * 100).toFixed(0) + "%";
    n.querySelector(".val").textContent = text;
  };
  /* All four now read their own state. They used to be painted at fixed
     fractions with the baseline text beside them, which is why they looked
     live and did nothing. `moved` marks a handle that is off its baseline so
     a reader can see at a glance which of the four they have touched. */
  paintWhatIf();
  paintSimLine();
  var SP = leverSpecs();
  Object.keys(SP).forEach(function(id){
    var sp = SP[id], v = sp.val();
    var frac = Math.min(1, Math.max(0, (v - sp.lo) / (sp.hi - sp.lo)));
    set(id, frac, sp.text(v));
    var n = el(id);
    if (n) n.classList.toggle("moved", LV[sp.f] != null);
  });
  /* The thirteen weeks share the first 84% of the track, a 7% step each, and the
     quarter closed sits at the far end. The LAST GAP IS BIGGER THAN THE OTHERS,
     16% against 7%, and that is the only thing that marks the close as a step
     past the quarter rather than one more week. No rule, no notch, no dots: the
     spacing does it, the way the proof sheet's slider does it. Three attempts
     to decorate this were all wrong. Javier, 7 Oct.

     "of 13" is gone from the label because every quarter has thirteen weeks, so
     the denominator never told anybody anything. */
  set("lever-week",  ST.week === "closed" ? 1 : (ST.week - 1) / (E.QTR_WEEKS - 1) * 0.84,
      ST.week === "closed" ? "Quarter closed" : "Week " + ST.week);
}

/* ---- what the cards get to see -----------------------------------------
   They are handed the live plan, ledger and quarter on every render, plus the
   three lookups that need the tree's own structure. Nothing in cards.js
   reaches into this file. */
function allPeople(){
  var out = (S.teams || []).reduce(function(a, t){ return a.concat(t.members || []); }, []);
  /* The rosters as well as the teams. Without this a person nobody manages
     opens a hover card with nothing in it but their name, which is exactly
     the bug the tree row was added to fix, one layer down. */
  return out.concat((S.aes || []), (S.sdrs || []), (S.css || []));
}
function cardApi(){
  /* WHOSE SCREEN IS THIS. The cards had no way to know, so they named the rep
     in the third person even on that rep's own view: "Winning this takes
     Imani past the 70% line" while Imani is looking at it. Javier, 13 Oct. */
  return {E: E, FIND: FIND, P: P, L: L, S: S, SP: SP, SP2: SP2,
    nextStep: nextStep, rateAt: rateAt, viewAs: viewAs, mgrFacts: mgrFacts,
    csLadder: csLadder, csWorthAdd: csWorthAdd, csWorthHad: csWorthHad,
    csCap: csCap, boardRole: roleOf2(ST.role), csCol: ST.csCol,
    teamOfRep: teamOfRep, mgrSecured: mgrSecured,
    mgrNow: mgrNow,
    /* The team whose screen this is, so a rep's hover can be read with a
       manager's eyes rather than the rep's own. Null everywhere else. */
    mgrTeam: SH().tiles === "mgr"
      ? (S.teams || []).filter(function(x){ return x.manager === ST.who; })[0] || null : null,
    mgrRank: mgrRank, role: ST.role,
    weekLabel: weekLabel, roleLabel: roleLabel,
    /* Present only on a meetings plan, so a card can branch on its existence
       rather than re-deriving "is this early stage" for itself. */
    meetRate: meetingsPlan() ? meetRate : null,
    meetRateTeam: function(t){
      var n = 0, s = 0;
      (t.members || []).forEach(function(m){
        var o = {}; o[m.name] = 1; var r = meetRate(o);
        if (!r.seen) return; n++; s += r.rate; });
      return n ? s / n : 0;
    },
    /* Whether the deal table on this screen is an SDR's. The cards need it to
       decide whose money a deal row is about. */
    sdrLens: (SH().tiles === "mgr" && (A_TEAM() || {}).manages === "SDR") ||
             ST.role === "sdr" ||
             !!(ST.sel && ST.sel.kind === "team" &&
                ((S.teams || []).filter(function(x){ return x.manager === ST.sel.key; })[0] || {})
                  .manages === "SDR") ||
             !!(ST.sel && ST.sel.kind === "dept" && ST.sel.key === "SDR"),
    viewer: SH().viewer ? ST.who : null, find: {
    person: function(el){
      var n = el.getAttribute("data-key");
      return allPeople().filter(function(m){ return m.name === n; })[0] || {name: n};
    },
    /* A MEETING, FOUND BY THE THREE THINGS THAT IDENTIFY ONE. A created row has
       no id, so the key the table writes is sdr|account|week, which is unique:
       one SDR does not hold two meetings with the same account in the same week.
       The state, its label and what it paid are resolved here rather than in the
       card, because all three rules live in this file and the card must not hold
       a second copy of any of them. Javier, 22 Oct. */
    meet: function(el){
      var k = String(el.getAttribute("data-meet") || "").split("|");
      var wk = weekNum();
      var c = (L.created || []).filter(function(x){
        return x.unit === "meeting" && x.sdr === k[0] && x.account === k[1] &&
               String(x.week) === k[2]; })[0];
      if (!c) return null;
      var st = meetState(c, wk);
      return {account: c.account, sdr: c.sdr, week: c.week, oppWeek: c.oppWeek,
              state: st, label: MEET_LABEL[st], paid: meetPaid(c)};
    },
    team: function(el){
      var n = el.getAttribute("data-key");
      var t = (S.teams || []).filter(function(x){ return x.manager === n; })[0];
      if (!t) return {manager: n};
      /* The card carries BOTH, Javier's call: the retention their bar shows and
         the attainment their pay is computed on. Same calculation as the row. */
      if ((t.manages || "AE") === "CS") t.csRet = retFor(t.members);
      return t;
    },
    roll: function(el){
      var kind = el.getAttribute("data-kind");
      var key  = el.getAttribute("data-key");
      var teams = kind === "co" ? (S.teams || []) : teamsOf(key);
      var loose = kind === "co" ? [] : looseOf(key);
      var tot = kind === "co" ? deptTotals(teams) : deptFigure(key, teams, loose);
      var M   = kind === "co" ? null : deptMeasure(key, teams, loose);
      var label = kind === "co" ? "The company"
                : (DEPTS.filter(function(d){ return d[0] === key; })[0] || [0, key])[1];
      var bad = 0, warn = 0;
      var count = function(r){ if (r.tone === "bad") bad++; else if (r.tone === "warn") warn++; };
      teams.forEach(function(t){
        firedFor("MGR", t).forEach(count);
        var rk = (t.manages || "AE");
        (t.members || []).forEach(function(m){ firedFor(roleOf(rk), m).forEach(count); });
      });
      loose.forEach(function(m){ firedFor(roleOf(key), m).forEach(count); });
      if (kind === "co") firedFor("CEO").forEach(function(r){
        if (r.tone === "bad") bad++; else if (r.tone === "warn") warn++; });
      return {label: label, teams: teams, bad: bad, warn: warn, m: M,
              actual: tot.actual, target: tot.target, people: tot.people};
    },
    openFor: function(name){
      return E.dealsAsOf(L, weekNum()).open.filter(function(d){
        return d.rep === name && d.expectedClose <= E.QTR_WEEKS; });
    },
    wonFor: function(name){
      return E.dealsAsOf(L, weekNum()).won.filter(function(d){ return d.rep === name; });
    },
    deal: function(id){
      var A2 = E.dealsAsOf(L, weekNum());
      return A2.won.concat(A2.lost, A2.open).filter(function(d){ return d.id === id; })[0];
    }
  }};
}

/* ---- THE AE VIEW -------------------------------------------------------
   "A rep walks into a room and here is what he sees", Javier, 13 Oct. So the
   person is already chosen when the view opens and the findings are already
   on screen: a visitor who never touches the picker still sees the best thing
   in the tool.

   Built to the September spec in app_shell: three tiles, a leaderboard with no
   numbers on it, and the findings block. A forecast tile was cut there
   deliberately and stays cut, because this is not a forecast tool. */
function aeRoster(){ return (S.aes || []); }
function aeOf(name){
  var r = aeRoster().filter(function(x){ return x.name === name; })[0];
  return r || aeRoster()[0] || null;
}
/* Closest to 100%, per the spec. Not the best rep: the typical one. */
function closestToQuota(list){
  return (list || []).slice().sort(function(a, b){
    return Math.abs((a.attain || 0) - 1) - Math.abs((b.attain || 0) - 1); })[0];
}
function money0(v){ return E.money(Math.round(v || 0)); }

/* WHAT THE NEXT DEAL IS WORTH. A REAL deal, Javier 13 Oct: "my next deal, I
   was hoping it was a real deal, not if you make 10k more". So this is the
   open opportunity closing soonest, priced with the same marginal arithmetic
   the hover cards use.

   AND THE STEP IS NOT ONLY THE ACCELERATOR. Javier caught the old line. For a
   rep under the decelerator the jump from 4.8% to 16% is the reduced rate
   coming OFF and the accelerator going ON, two separate mechanics, and
   calling it one was wrong. The card names whichever of the two actually
   applies. */
function nextDealValue(rep){
  var q = rep.quota || P.qQuota;
  if (!q) return null;
  var mine = E.dealsAsOf(L, weekNum()).open
    .filter(function(d){ return d.rep === rep.name && d.expectedClose <= E.QTR_WEEKS; })
    .sort(function(a, b){ return (a.expectedClose - b.expectedClose) || (b.acv - a.acv); });
  var d = mine[0];
  if (!d) return null;
  var size = d.acv || 0, at = rep.closed || 0;
  var c = function(x){ return E.commAt(P, x) / 4; };
  /* THE SECOND BAR IS THE NEXT STEP UP, and it is the same step the card
     names, so the tile cannot say "past quota" while the card under it says
     "past 70%". That disagreement appeared the moment the card started naming
     the real threshold, on a rep at 59% whose next change is the decelerator
     coming off. Javier, 14 Oct. */
  var step = nextStep(P, rep.attain || 0);
  var bar = step ? q * step.at : 0;
  var now = c((at + size) / q) - c(at / q);
  var then = step ? c((Math.max(at, bar) + size) / q) - c(Math.max(at, bar) / q) : now;
  return {deal: d, size: size, now: now, after: then, step: step,
          crosses: !!(step && at < bar && at + size >= bar),
          same: !step || Math.abs(now - then) < 1};
}
/* THE RATE THE PLAN PAYS AT A GIVEN ATTAINMENT. The decelerator is a multiplier
   on everything below its threshold, the accelerator tiers are marginal above
   quota, which is how the engine prices them. */
function rateAt(P, at){
  var d = P.decel || {}, ac = P.accel || {}, r = P.rate || 0;
  if (d.thr && at < d.thr) return r * (d.mult || 0);
  if (ac.t2 && ac.at && at >= ac.at) return r * ac.t2;
  if (ac.t1 && at >= 1) return r * ac.t1;
  return r;
}
/* THE RATE LADDER, IN THE ORDER A REP CLIMBS IT. Three changes can sit above
   someone: the decelerator coming off, the accelerator going on at quota, and
   the second tier. Return the nearest one still above them, or null when they
   are past the lot. A step only counts if it actually changes the rate, so a
   plan whose accelerator is 1x (early stage) has no step at quota. */
function nextStep(P, at){
  var d = P.decel || {}, ac = P.accel || {}, out = [];
  if (d.thr && d.mult !== 1 && (d.mult === 0 || d.mult))
    out.push({at: d.thr, label: E.pct0(d.thr)});
  if (ac.t1 && ac.t1 !== 1) out.push({at: 1, label: "quota"});
  if (ac.t2 && ac.at && ac.t2 !== ac.t1) out.push({at: ac.at, label: E.pct0(ac.at)});
  for (var i = 0; i < out.length; i++) if (at < out[i].at) return out[i];
  return null;
}

/* ---- the manager's four tiles ------------------------------------------
   One builder for the numbers, read by the tiles and by their hover cards, so a
   figure on the tile and the same figure on the card cannot drift. Javier's
   spec, 7 Sep: distribution first, the aggregate second, participation third
   and the manager's own pay last, "a manager screen that opens with the
   manager's own pay is the wrong emphasis and a bad look".

   Two of the four need a CS variant and it is the no-blend rule biting. A sales
   manager's "who is where" is attainment against quota and an SDR manager's is
   the count against target, both one number per person. A CS team has two
   numbers this tool refuses to merge, so tile 1 plots retention, the defensive
   one where a laggard is the risk, and tile 2 becomes team expansion. */
function mgrFacts(t){
  var mem = (t.members || []), kind = t.manages || "AE", n = mem.length;
  var sum = function(f){ return mem.reduce(function(a, x){ return a + (f(x) || 0); }, 0); };
  var of  = kind === "CS" ? function(m){ return m.retention == null ? 0 : m.retention; }
                          : function(m){ return m.attain || 0; };
  var vals = mem.map(of);
  var bands = kind === "CS"
    ? [["At or above " + pct0(RFU()), vals.filter(function(v){ return v >= RFU(); }).length],
       ["From " + pct0(RF()) + " to " + pct0(RFU()),
        vals.filter(function(v){ return v >= RF() && v < RFU(); }).length],
       ["Below " + pct0(RF()), vals.filter(function(v){ return v < RF(); }).length]]
    /* The reduced-rate bands are an AE mechanic. An SDR carries one line and a
       count, so giving their team the decelerator bands labelled them against a
       threshold their plan does not contain. */
    : kind === "AE" && P.decel && P.decel.thr
    ? [["Above quota", vals.filter(function(v){ return v >= 1; }).length],
       ["From " + pct0(P.decel.thr) + " to quota",
        vals.filter(function(v){ return v >= P.decel.thr && v < 1; }).length],
       ["Below " + pct0(P.decel.thr), vals.filter(function(v){ return v < P.decel.thr; }).length]]
    : [["At or above target", vals.filter(function(v){ return v >= 1; }).length],
       ["Below target", vals.filter(function(v){ return v < 1; }).length]];
  /* The aggregate, in whatever unit the role below is measured in. */
  var got, want, unit;
  if (kind === "CS"){ got = sum(function(m){ return m.expWon; });
                      want = sum(function(m){ return m.expTarget; }); unit = "money"; }
  else if (kind === "SDR"){ got = sum(function(m){ return m.created; });
                            want = sum(function(m){ return m.target; }); unit = "count"; }
  else { got = sum(function(m){ return m.closed; });
         want = sum(function(m){ return m.quota; }); unit = "money"; }
  /* ONE DEFINITION, IN THE ENGINE. This composition used to live here and
     nowhere else, which is why the company's cost figures could not read it and
     carried a quarter of the managers' TARGET variable instead. It is
     E.mgrPay now, read by this tile and by quarterState's company block, so a
     manager's pay and what the company says it cost cannot disagree.
     Javier, 21 Oct. */
  var pay = E.mgrPay(P, t);
  return {kind: kind, n: n, vals: vals, bands: bands,
          lo: n ? Math.min.apply(null, vals) : 0, hi: n ? Math.max.apply(null, vals) : 0,
          got: got, want: want, unit: unit, attain: t.attain || 0,
          atq: Math.round((t.participation || 0) * n),
          gate: Math.ceil((t.participationGate || PT()) * n),
          closest: closestTo(mem, of), nextUp: nextUp(mem, of, t, kind), pay: pay};
}
/* WHO WOULD ACTUALLY CLOSE THE GATE. The card used to say "they are one of the
   closest" whenever a rep's attainment rank sat inside the gate, which was
   wrong three ways: it never checked the rep was not already counted, so
   somebody past the line was told they were close to it; it said "one of"
   even when the answer was one person; and it read closeness off the
   attainment ladder when at-target is the multi-measure test, so a rep can
   lead on attainment and still fail it on wins. This takes the members who
   fail `atTargetTest`, orders them by how close they are and keeps only as
   many as the gate still needs. Javier, 15 Oct. */
function nextUp(mem, of, t, kind){
  var need = Math.max(0, Math.ceil((t.participationGate || PT()) * mem.length) -
                         Math.round((t.participation || 0) * mem.length));
  if (!need) return [];
  var test;
  try { test = E.atTargetTest(P, kind); } catch(e){ test = function(m){ return of(m) >= 1; }; }
  return mem.filter(function(m){ return !test(m); })
            .sort(function(x, y){ return of(y) - of(x); })
            .slice(0, need)
            .map(function(m){ return m.name; });
}
/* The one nearest the line without being over it, which is who a manager asks
   about first. Null when everybody is already there. */
function closestTo(mem, of){
  var under = mem.filter(function(m){ return of(m) < 1; })
    .sort(function(a, b){ return of(b) - of(a); });
  return under[0] || null;
}
/* ---- the manager's rep table -------------------------------------------
   SORTED BY WHAT IS ACTIONABLE, NOT BY ATTAINMENT. Javier's spec, 7 Sep: this
   is the only screen whose reader can change the outcome this week, so it says
   where the effort goes. Every rep sits somewhere against two thresholds worth
   real money, the reduced-rate line, which retroactively re-rates everything
   they have already closed, and quota, which switches the accelerator on for
   everything after. Neither is a linear gain, which is exactly why sorting by
   attainment finds the wrong people.

   The sort is the money at the rep's nearest threshold divided by how many of
   their own average deals it takes to get there, and anyone without the open
   pipeline to cover the gap drops to the bottom. A rep at 40% with nothing open
   ranks last, below people who look worse on paper, because nothing a manager
   does this week changes their quarter. The reason column is what makes the
   order legible: nobody trusts a sort they cannot see the logic of.

   SDR and CS teams get the same table on a simpler rule. The thresholds the
   sort reasons about are AE mechanics, a decelerator and an accelerator; an
   SDR has one line and a CSM is defending rather than climbing, so for those
   two the ranking is distance to their own target among the people who can
   still reach it, with the same reason clause shape. */
function mgrRank(t){
  var mem = (t.members || []), kind = t.manages || "AE";
  /* AT THE CLOSE THERE IS NO EFFORT TO DIRECT, so the column stops being advice
     and becomes what happened, and the ranking stops being the size of an
     opportunity nobody can take any more. Javier, 14 Oct. */
  if (S.closed) return mem.map(function(m){
    var now = mgrNow(kind, m);
    var r = {m: m, score: now, able: true, why: ""};
    if (kind === "CS"){
      r.why = (now >= RFU() ? "held " : "held ") + pct0(now) + " of " +
        E.moneyK((m.atRisk || 0)) +
        (now >= RFU() ? ", at or above the line"
          : ", " + Math.round((RFU() - now) * 100) + " points under");
    } else if (kind === "SDR"){
      var short = (m.target || 0) - (m.created || 0);
      r.why = E.num(m.created || 0) + " of " + E.num(m.target || 0) + ", " +
        (short > 0 ? E.num(short) + " short" : E.num(-short) + " over");
    } else {
      var q = m.quota || P.qQuota, over = (m.closed || 0) - q;
      r.why = E.moneyK(m.closed || 0) + " of " + E.moneyK(q) + ", " +
        (over >= 0 ? E.moneyK(over) + " over" : E.moneyK(-over) + " short");
    }
    return r;
  }).sort(function(a, b){ return b.score - a.score; });
  return mem.map(function(m){
    var r = {m: m, score: 0, why: "", able: true};
    if (kind === "AE"){
      var q = m.quota || P.qQuota, closed = m.closed || 0, at = m.attain || 0;
      var step = nextStep(P, at);
      if (!step){ r.why = "past every line this plan pays on"; r.score = -1; return r; }
      var bar = q * step.at, gap = Math.max(0, bar - closed);
      var c = function(x){ return E.commAt(P, x) / 4; };
      var worth = c(bar / q) - c(closed / q);
      var avg = m.avgDeal || P.acv || 1;
      var deals = Math.max(1, Math.round(gap / avg));
      r.able = (m.open || 0) >= gap;
      r.score = r.able ? worth / deals : -2;
      r.why = r.able
        ? E.moneyK(gap) + " to " + step.label + ", " +
          deals + (deals === 1 ? " deal" : " deals")
        : E.moneyK(gap) + " to " + step.label + ", only " + E.moneyK(m.open || 0) + " open";
      r.gap = gap; r.deals = deals; r.worth = worth; r.step = step;
      return r;
    }
    var now = mgrNow(kind, m);
    var want = kind === "CS" ? RFU() : 1;
    if (now >= want){
      r.why = kind === "CS"
        ? pct0(now) + " of " + E.moneyK(m.atRisk || 0) + ", at or above the line"
        : E.num(m.created || 0) + " of " + E.num(m.target || 0) + ", at target";
      r.score = -1; return r;
    }
    r.score = now;
    /* A gap has to survive the rounding the reader sees: at 94.96% the old line
       printed "95%, 0 points under", two equal numbers with a distance claimed
       between them. Same class the engine fixed with pctVs. */
    var pts = Math.round((want - now) * 100);
    r.why = kind === "CS"
      ? pct0(now) + " of " + E.moneyK(m.atRisk || 0) +
        (pts >= 1 ? ", " + pts + (pts === 1 ? " point under" : " points under")
                  : ", just under the line")
      : E.num(m.created || 0) + " of " + E.num(m.target || 0) + ", " +
        E.num(Math.max(0, (m.target || 0) - (m.created || 0))) + " short";
    return r;
  }).sort(function(a, b){ return b.score - a.score; });
}
/* ONE MEASURE PER PERSON, read by the bar, the clause beside it and the card.
   The bar was drawn on retention-if-nothing-more-churns, which is what the
   RevOps tree uses, while the clause read the raw retention, so a row showed a
   gap its own words denied. Javier, 14 Oct. */
/* TWO QUESTIONS, TWO MEASURES, and conflating them turned every CSM red.

   `mgrNow` is the LEVEL: retention if nothing more churns. The people table,
   the bars and the findings all read it and Javier confirmed on 19 Oct that
   this is right for them, because a book is judged on what it is holding.

   `mgrSecured` is PROGRESS: held against the whole book. Only the AT TARGET
   component reads it, because that is the one place the question is "have
   they got there yet", and an AE pacing toward quota is not at quota. Pointing
   `mgrNow` itself at secured answered the second question everywhere the
   first was being asked, and the people table came out 68% in red with
   "27 points under" for a CSM who has lost nothing. */
function mgrNow(kind, m){
  if (kind !== "CS") return m.attain || 0;
  try { var c = FIND.ctxCS(P, L, S, m); if (c && c.retIfNoMore != null) return c.retIfNoMore; }
  catch(e){}
  return m.retention == null ? 0 : m.retention;
}
function mgrSecured(kind, m){
  if (kind !== "CS") return m.attain || 0;
  if (m.retWithout != null) return m.retWithout;
  return m.retention == null ? 0 : m.retention;
}
/* AND A COLOUR THAT AGREES WITH IT. Every other people table takes its tone
   from a person's FINDINGS, which works where a findings column sits beside
   the row to explain it. This table has no such column, so a CSM two points
   short read green and an SDR ahead of pace read amber, both correct and both
   looking broken. Here the colour is the number: at or above their own line is
   green, above the lower line is amber, below it is red. Javier, 14 Oct. */
/* The team's tone, which its bar has always had and its card never did. */
function teamTone(t, kind, f){
  if (kind === "CS"){
    var R = retFor(t.members), r = R.ret === null ? 0 : R.ret;
    return r >= RFU() ? "good" : r >= RF() ? "warn" : "bad";
  }
  var tr = S.closed ? (f.want ? f.got / f.want : 0)
                    : (f.want && S.pace ? (f.got / f.want) / S.pace : 0);
  return tr >= 1 ? "good" : tr >= .8 ? "warn" : "bad";
}
function mgrTone(kind, m){
  var v = mgrNow(kind, m);
  /* Retention is a LEVEL, not a race, so it bands on the plan's two lines at
     any week. */
  if (kind === "CS") return v >= RFU() ? "good" : v >= RF() ? "warn" : "bad";
  /* The others band against THE TICK, which is the pace mark the bar already
     draws, so the colour and the bar answer the same question. Banding against
     the final target mid-quarter made four of five SDRs amber in week 6, which
     is not a signal, it is a calendar. At the close the tick IS the target. */
  var bar = S.closed ? (m.quota || m.target || 1)
                     : (m.paceTarget || (S.pace || 0) * (m.quota || m.target || 1));
  var got = kind === "SDR" ? (m.created || 0) : (m.closed || 0);
  var r = bar ? got / bar : 0;
  return r >= 1 ? "good" : r >= .8 ? "warn" : "bad";
}
function mgrPeople(t){
  var rows = mgrRank(t), kind = t.manages || "AE";
  var rk = kind === "SDR" ? "SDR" : kind === "CS" ? "CS" : "AE";
  var f = mgrFacts(t);
  /* THE SAME BAR THE TREE DRAWS. This passed the raw number with no options, so
     a CSM's retention rendered against the default scale with the tick on the
     week's pace and every one of them read behind at the close, which is not
     what the RevOps row beside it says about the same person. `barOf` carries
     the bent CS track, gate at 0 and full pay at 71%, and the tone comes from
     their findings the way every other people table does it. Javier, 14 Oct. */
  var cell = function(m){
    var b = barOf(rk, m);
    return barHTML(b.val, mgrTone(kind, m), b.opt);
  };
  /* AND THE TEAM'S OWN LINE. A table of people with no total makes the reader
     add up eight numbers to answer the first question they have. It sits on top
     the way the roll-up does on the tree, and it is not selectable: there is no
     such person to filter the deals to. */
  /* THE TEAM ROW READS THE COLUMN IT SITS IN. For a CS manager that column is
     retention, so the roll-up is the team's retention on the same bent track
     its members are drawn on, exactly as the RevOps tree draws it. Putting the
     team's EXPANSION there, which is what tile 2 measures, sent a 63% through
     a scale whose gate is 88% and drew an empty bar under eight full ones. */
  var teamBar, teamWhy;
  if (kind === "CS"){
    var R = retFor(t.members), ret = R.ret === null ? 0 : R.ret;
    teamBar = barHTML(csTrack(ret), ret >= RFU() ? "good"
                                    : ret >= RF() ? "warn" : "bad",
                      {floor: 0, top: 1, tick: CS_TICK,
                       /* The roll-up splits renewed from still-up exactly as
                          every row under it does, or the one solid bar at the
                          top of a column of split ones reads as a different
                          measure. */
                       solid: (R.held + R.pend) ? R.held / (R.held + R.pend) : 1});
    teamWhy = (S.closed ? "held " : "holding ") + pct0(ret) + " of " + E.moneyK(R.book);
  } else {
    var tr0 = S.closed ? (f.want ? f.got / f.want : 0)
                       : (f.want && S.pace ? (f.got / f.want) / S.pace : 0);
    teamBar = barHTML(f.want ? f.got / f.want : 0,
                      tr0 >= 1 ? "good" : tr0 >= .8 ? "warn" : "bad");
    teamWhy = S.closed
      ? (f.got >= f.want ? E.moneyK(f.got - f.want) + " over"
                         : E.moneyK(f.want - f.got) + " short")
      : (kind === "SDR" ? E.num(f.got) + " of " + E.num(f.want)
                        : E.moneyK(f.got) + " of " + E.moneyK(f.want));
  }
  /* The bar column was wider than it needed and the effort column started
     too far left, leaving a hand's width of nothing between them. The line
     gets the slack. Javier, 18 Oct. */
  /* THE BAR IS THE POINT OF THIS COLUMN, and I shrank it twice. Javier asked
     for "Where the effort goes to move to the right a bit more, SO THE LINE
     GETS BIGGER", and I read it as the effort column wanting more room, took
     the bar 26 to 21 and then to 14, and matched it to the RevOps tree, which
     is a four-column table in a narrower box and not comparable. The effort
     text needs about a third; the bar takes the rest. Javier, 19 Oct: "this
     is the opposite of what we want". */
  return '<colgroup><col style="width:26%"><col style="width:45%">' +
    '<col style="width:29%"></colgroup><thead><tr>' +
    '<th>Name</th><th>' + (kind === "CS" ? "Retention" : "Against target") +
    /* THE TICK NEEDS SAYING SOMEWHERE. Every role's bar carries one and
       nothing on the screen explained it. The AT TARGET tile's "?" answers a
       different question, which is the one I built on 18 Oct when Javier
       meant this column. */
    '<span class="q" data-q="mgr-col">?</span>' +
    '</th><th>' + (S.closed ? "How the quarter went" : "Where the effort goes") +
    /* THE EXPLAINER BELONGS ON THE COLUMN IT EXPLAINS. It was sitting on the
       block title, where it read as "what is this table", and the question it
       answers is why this column is ordered the way it is. Javier, 15 Oct. */
    '<span class="q" data-q="mgr-order">?</span></th></tr></thead><tbody>' +
    /* THE TEAM ROW'S CARD WAS THE ONLY UNTONED ONE, because the row carried no
       `data-tone` for the card to read. Parked 14 Oct and overtaken; the tone
       is the team's own, the same one its bar draws with. */
    '<tr class="teamrow" data-kind="mgrteam" data-tone="' + teamTone(t, kind, f) +
    '" data-key="' + esc(t.manager) +
    '"><td class="nm">The team</td><td>' + teamBar +
    '</td><td class="why">' + esc(teamWhy) + '</td></tr>' +
    rows.map(function(r){
      var m = r.m;
      return '<tr data-kind="person" data-role="' + rk +
        '" data-key="' + esc(m.name) + '" data-pick="' + esc(m.name) +
        '"' + (ST.pick === m.name ? ' class="picked"' : '') +
        ' data-tone="' + mgrTone(kind, m) + '">' +
        '<td class="nm">' + esc(m.name) + '</td>' +
        '<td>' + cell(m) + '</td>' +
        '<td class="why">' + esc(r.why) + '</td></tr>';
    }).join('') + '</tbody>';
}

/* How many CSMs have RENEWED enough of their book to clear the full-pay line.
   The same measure the at-target test judges on. */
function csHeld(t){
  var n = 0;
  (t.members || []).forEach(function(m){
    if (mgrSecured("CS", m) >= RFU()) n++; });
  return n;
}
/* How many CSMs have landed their expansion target. The other half of the
   at-target test, which the participation tile now names. */
function csGrown(t){
  var n = 0;
  (t.members || []).forEach(function(m){
    if (m.expTarget && (m.expWon || 0) >= m.expTarget) n++; });
  return n;
}
function mgrTiles(t){
  var f = mgrFacts(t), kind = f.kind;
  var num = function(v){ return f.unit === "money" ? E.moneyK(v) : E.num(v); };
  var bar = function(v, tick, cap){
    return '<div class="art"><div class="meter"><i style="width:' + w(v).toFixed(1) + '%"></i>' +
      (tick == null ? '' : '<u style="left:' + w(tick).toFixed(1) + '%"></u>') +
      '</div><div class="cap">' + esc(cap) + '</div></div>'; };
  var top = Math.max.apply(null, f.vals.concat([1]));
  var spark = '<div class="art"><div class="spark">' + f.vals.slice()
    .sort(function(a, b){ return b - a; }).map(function(v){
      return '<s style="height:' + Math.max(6, v / top * 100).toFixed(0) + '%"></s>';
    }).join('') + '</div><div class="cap">one bar per person, biggest first</div></div>';
  var t1 = kind === "CS" ? "Who is holding what" : "Who is where";
  var t2 = kind === "CS" ? "Team expansion" : "Team against target";
  return [
    /* HIGHEST FIRST, because the list inside the card and the bars beside it
       both run that way and the face was the only thing reading upward.
       Javier, 15 Oct. */
    [t1, pct0(f.hi) + " to " + pct0(f.lo), spark],
    /* NO TILE FOR A COMPONENT THE PLAN DOES NOT HAVE. On an early-stage plan
       CS is paid retention and onboarding milestones with a zero expansion
       target, so this read "Team expansion 0%" against $0 on every CS manager
       screen. Same decision as the rep view, which drops its own expansion
       tile there. Javier, 15 Oct. */
    (kind === "CS" && !f.want) ? null :
    [t2, pct0(f.want ? f.got / f.want : 0),
     bar(f.want ? f.got / f.want : 0, S.closed ? 1 : S.pace,
         num(f.got) + " of " + num(f.want) +
         (S.closed ? "" : " \u00b7 tick = week " + S.week + " pace"))],
    f.pay.part
    /* NO "?" ON THE TILE. It was built here on 18 Oct when Javier meant the
       people table's bar column, and that column has its own now. Two markers
       answering overlapping questions is worse than one in the right place,
       and the one here was the generic block that talked about CSMs on a
       Sales Manager's screen. Javier, 19 Oct. */
    ? [(kind === "CS" ? "CSMs at target" : kind === "SDR" ? "SDRs at target"
                                         : "Reps at quota"), f.atq + " of " + f.n,
     /* IT READ 0 OF 8 FOR TWELVE WEEKS AND THEN JUMPED. At target for a CSM is
        both halves, and expansion lands late, so the count sat dead all
        quarter while the half already done went unsaid.

        BOTH HALVES WOULD NOT FIT ON THE FACE. "6 of 8 holding · 0 of 8 grown"
        ran 56px past the tile at 100% zoom and wrapped at 75%, which is the
        same mistake the SDR faces were carrying this morning. So the face
        keeps the count the component actually pays on and the two halves go
        to the caption. Javier, 18 Oct. */
     /* THE BAR IS THE NUMBER ON THE FACE. Filling it to the holding count put
        a two-thirds bar under "0 of 8", so the picture contradicted the
        figure above it. Javier, 19 Oct: "the line should reflect the number
        as well". The two halves stay in the caption, where they explain why
        the bar is where it is rather than arguing with it. */
     bar(f.n ? f.atq / f.n : 0, f.n ? f.gate / f.n : 0,
         /* ONE CAPTION FOR EVERY MANAGER TILE. The CS version carried both
            halves of the at-target test, which made it twice the length of
            the captions beside it, and once the bar became the count the
            halves had nothing left to explain. They live on the card.
            Javier, 19 Oct. */
         "tick = the " + f.gate + " this component needs")]
    : ["My own number", pct0(f.pay.ownAttain),
       bar(f.pay.ownAttain, S.closed ? 1 : S.pace,
           E.moneyK(f.pay.ownClosed) + " of " + E.moneyK(f.pay.ownQuota) +
           (S.closed ? "" : " \u00b7 tick = week " + S.week + " pace"))],
    ["What this pays me", money0(f.pay.total),
     bar(f.pay.target ? f.pay.total / f.pay.target : 0, 1,
         "tick = " + money0(f.pay.target) + " at target")]
  /* A dropped tile leaves a hole, and the mapper walked into it. Filtering it
     out is not enough either: `mgrTileCard` switches on the tile's POSITION,
     so closing the gap renumbered every tile after it and the second tile
     started rendering the card of the one that used to be second. The
     original index travels with the tile. Javier, 15 Oct. */
  ].map(function(x, i){ return x && [x, i]; }).filter(Boolean).map(function(pair){
    var x = pair[0], i = pair[1];
    return '<div class="tile" data-mgrtile="' + i + '" data-key="' + esc(t.manager) +
      '"><div class="k">' + x[0] + '</div>' +
      '<div class="v">' + x[1] + '</div>' + x[2] + '</div>';
  }).join('');
}

/* ---- the SDR's four tiles ------------------------------------------------
   Spec'd in wizard-copy.md and built 15 Oct. Four rather than three, and the
   fourth is the reason: "What happens to what you create" is the one question
   the comp plan cannot see and the thing that gets an SDR promoted or moved
   on. Without it the view is a smaller AE screen.

   THE RULE THAT GOVERNS TILE ONE: no tile shows a dollar figure the plan does
   not pay on. A meetings SDR is paid per meeting and nothing else, so their
   first tile counts meetings with no pipeline value beside it. */
function sdrTiles(rep){
  var tg = rep.target || 0, got = rep.created || 0;
  var at = tg ? got / tg : 0;
  /* NOT `w`. That is the global track-scaling function, and shadowing it here
     made the meter call a weights object. Same shape as the `who` shadowing in
     mgrTileCard. */
  var wt = P.sdrWeights || {}, qv = (P.sdrVariable || 0) / 4;
  var earned = 0;
  try { earned = E.sdrEarn(P, rep) || 0; } catch(e){}
  var baseQ = ((P.sdrOte || 0) - (P.sdrOte || 0) * (P.sdrVarPct || 0)) / 4;
  var oteQ  = (P.sdrOte || 0) / 4;
  var t1 = tone("SDR", firedFor("SDR", rep));
  var unit = P.sdrUnit || "accepted opportunities";
  /* What one more unit pays, with the accelerator priced in, which is the
     whole reason this is not just the flat rate. */
  var one = 0;
  try {
    one = E.roleEarn(P, qv * (wt.count || 1), tg ? (got + 1) / tg : 0) -
          E.roleEarn(P, qv * (wt.count || 1), tg ? got / tg : 0);
  } catch(e){}
  /* ON A MEETINGS PLAN THE QUESTION IS THE STEP WE CAN SEE. The deals wearing
     an SDR's name are generated independently of their meetings, so their
     win rate says nothing about these rooms; what the view can answer is how
     many of the meetings turned into an opportunity at all. Javier, 15 Oct:
     "there's a jump there that doesn't actually work". */
  var meet = meetingsPlan(), conv, team = 0, n = 0;
  if (meet){
    var mine0 = {}; mine0[rep.name] = 1;
    conv = meetRate(mine0).rate;
    (S.sdrs || []).forEach(function(m){
      var o = {}; o[m.name] = 1; var r2 = meetRate(o);
      if (!r2.seen) return; n++; team += r2.rate; });
  } else {
    conv = rep.conv || 0;
    (S.sdrs || []).forEach(function(m){ if (m.conv === undefined) return; n++; team += m.conv; });
  }
  team = n ? team / n : 0;
  /* Attainment rides the same 1.3 track every other attainment bar uses, so a
     rep past target still reads as past target. A conversion RATE is a share
     of a whole and tops out at one, so it gets its own scale. */
  var mtr = function(v, tick, cap, share){
    var f = share ? w2 : w;
    return '<div class="art"><div class="meter"><i style="width:' + f(v).toFixed(1) +
      '%"></i><u style="left:' + f(tick).toFixed(1) + '%"></u></div>' +
      '<div class="cap">' + cap + '</div></div>'; };
  return [
    /* THE FACE CARRIES THE TICK AND NOTHING ELSE. "Accepted opportunities ·
       $1.33M of $1.57M created · tick = week 6 pace" was three times the
       length of the caption beside it, so the four tiles rendered at
       different heights and the titles wrapped. The detail is on the card
       now. Javier, 18 Oct. */
    ['My number', num(got) + ' of ' + num(tg),
     mtr(at, S.closed ? 1 : S.pace,
       S.closed ? 'of target' : 'tick = week ' + S.week + ' pace'), t1],
    ['Earned so far', money0(baseQ + earned),
     mtr(oteQ ? (baseQ + earned) / oteQ : 0, 1,
       'tick = ' + money0(oteQ) + ' at target'), ''],
    /* THE SAME TILE THE AE GETS. It carried a caption where the AE carries two
       bars, which is why Javier kept saying the two-line version was never
       built: the card had the numbers and the tile had a sentence. Same
       `stepArt`, same two blues, so "now" and "past target" read the way they
       do one screen over. Javier, 19 Oct. */
    (function(){
      var sh = qv * (wt.count || 1);
      var past = (tg && got < tg)
        ? E.roleEarn(P, sh, (tg + 1) / tg) - E.roleEarn(P, sh, tg / tg) : 0;
      var moves = past && Math.round(past) !== Math.round(one);
      return ['Next one is worth', S.closed ? '\u2014' : (one ? money0(one) : '\u2014'),
        S.closed || !one
          ? '<div class="art"><div class="cap">' +
            (S.closed ? 'the quarter is closed' : 'nothing left to create') + '</div></div>'
          : stepArt(one, past, moves ? "past target" : ""), ''];
    })(),
    /* THE CONVERSION TILE. Their own rate on a track with the team's marked
       on it, the same pattern the CEO cost meters use, so the comparison is
       the tile rather than a number the reader has to hold in their head. */
    [meet ? 'What meetings turn into' : 'What happens to it', E.pct0(conv),
     mtr(conv, team, 'tick = team at ' + E.pct0(team), true),
     conv < team * 0.8 ? 'bad' : conv < team ? 'warn' : '']
  ].map(function(t, i){
    return '<div class="tile ' + t[3] + '" data-sdrtile="' + i +
      '" data-key="' + esc(rep.name) + '" data-tone="' + t[3] +
      '"><div class="k">' + t[0] + '</div><div class="v">' + t[1] + '</div>' + t[2] + '</div>';
  }).join('');
}
function w2(v){ return Math.max(0, Math.min(100, (v || 0) * 100)); }
/* ---- the CSM's tiles ----------------------------------------------------
   Four, and three at early stage. Spec'd 23 Sep, built 15 Oct. Retention and
   expansion never share a track and are never netted into one number: one is
   a gated component that pays nothing below the floor and then pays in full,
   the other pays from the first dollar, and tile three is the only place that
   difference becomes visible.

   EARLY STAGE DROPS TILE TWO rather than filling it. The plan pays retention
   and onboarding milestones half each with a zero expansion target, and
   onboarding is a checklist in a workflow tool: nothing varies between people
   in a way anyone could verify, so the engine would be inventing a number to
   fill a space. The earned tile still NAMES the component, because the plan
   pays it, and nothing pretends to measure it. */
function csTiles(rep){
  var risk = rep.atRisk || 0, held = rep.held || 0, pend = rep.pending || 0,
      churn = rep.churned || 0;
  var ret = rep.retention == null ? 0 : rep.retention;
  try { var cx = FIND.ctxCS(P, L, S, rep); if (cx && cx.retIfNoMore != null) ret = cx.retIfNoMore; }
  catch(e){}
  var expT = rep.expTarget || 0, expW = rep.expWon || 0;
  var retFull = (P.csVariable || 0) * (P.csRetWeight || 0) / 4;
  var expFull = (P.csVariable || 0) * (P.csExpWeight || 0) / 4;
  var retPay = 0, expPay = 0;
  try { retPay = E.retentionPay(ret, retFull, P) || 0; } catch(e){}
  if (expT) expPay = expFull * Math.min(1, expW / expT);
  var baseQ = ((P.csOte || 0) - (P.csVariable || 0)) / 4;
  var oteQ  = (P.csOte || 0) / 4;
  var t1 = tone("CS", firedFor("CS", rep));
  var allowed = risk * (1 - RFU());
  var head = Math.max(0, allowed - churn);
  var avg = 0, bookN = 0;
  try { bookN = Math.max(1, Math.round(risk / Math.max(1, P.acv))); avg = risk / bookN; } catch(e){}
  var tiles = [];
  /* Retention as DEPLETION on the bent track, with the gate and the full-pay
     line both on it, because a CSM inside the gate and one below it are in
     two completely different quarters. */
  var banked = (held + pend) ? held / (held + pend) : 1;
  tiles.push(['What I am holding', E.pct0(ret),
    '<div class="art"><div class="meter split"><i style="width:' +
    (csTrack(ret) * 100).toFixed(1) + '%"></i><b style="width:' +
    (csTrack(ret) * banked * 100).toFixed(1) + '%"></b><u style="left:' +
    (CS_TICK * 100).toFixed(1) + '%"></u></div><div class="cap">' +
    E.moneyK(held + pend) + ' of ' + E.moneyK(risk) +
    ' \u00b7 tick = ' + E.pct0(RFU()) + '</div></div>', t1]);
  if (expT) tiles.push(['What I am growing', E.moneyK(expW),
    '<div class="art"><div class="meter"><i style="width:' +
    w(expT ? expW / expT : 0).toFixed(1) + '%"></i><u style="left:' +
    w(S.closed ? 1 : (S.pace || 0)).toFixed(1) + '%"></u></div><div class="cap">' +
    'of ' + E.moneyK(expT) + (S.closed ? '' : ' \u00b7 tick = week ' + S.week) +
    '</div></div>', '']);
  /* Earned, split by component, which is where the gated half and the
     per-dollar half stop looking alike. */
  var parts = [E.pct0(P.csRetWeight || 0) + ' retention ' + money0(retPay)];
  if (expT) parts.push(E.pct0(P.csExpWeight || 0) + ' expansion ' + money0(expPay));
  else if (P.early) parts.push(E.pct0(1 - (P.csRetWeight || 0)) +
    ' onboarding, not simulated here');
  tiles.push(['Earned so far', money0(baseQ + retPay + expPay),
    '<div class="art"><div class="meter"><i style="width:' +
    w(oteQ ? (baseQ + retPay + expPay) / oteQ : 0).toFixed(1) +
    '%"></i><u style="left:' + w(1).toFixed(1) + '%"></u></div><div class="cap">' +
    'tick = ' + money0(oteQ) + ' at target</div></div>', '']);
  /* THE MARGINAL ONE, rebuilt 19 Oct. A CSM has two levers, so the tile names
     the next real thing in their book, renewal or expansion, whichever lands
     soonest AND actually pays. That rule is self-correcting: when retention is
     outside its paying band every renewal is worth zero, so the tile falls
     through to the next expansion on its own and never prints "$0, the next
     renewal". Javier, 19 Oct, on why "furthest from the line" cannot work:
     retention is 27% secured in week 4 and only reaches 96% at the close, so
     it would win every week until the last fortnight.

     AND IT IS THE ONE TILE WITH NO ART, which is also why it read lighter than
     the other three. The ladder goes here: a straight nought-to-hundred track
     with the gate and the full-pay line dotted on it and secured as the fill.
     Straight rather than the bent track the holding tile uses, because the
     whole point is the distance to both lines from well below them, and on the
     bent track the gate sits at the very left edge. Two retention tracks doing
     two jobs, which Javier accepted as the cost. */
  var LAD = csLadder(rep);
  var nxt = null, nxtPay = 0, nxtKind = "";
  if (!S.closed && LAD){
    var mine = [];
    try {
      mine = E.dealsAsOf(L, weekNum()).open.filter(function(d){
        return d.rep === rep.name && (d.type === "Renewal" || d.type === "Expansion") &&
               d.expectedClose <= E.QTR_WEEKS; });
    } catch(e){}
    mine.sort(function(x, y){
      return (x.expectedClose - y.expectedClose) || (y.acv - x.acv); });
    for (var ix = 0; ix < mine.length; ix++){
      var dx = mine[ix];
      var vx = dx.type === "Renewal" ? csWorthAdd(LAD, dx.acv)
             : (expT ? expFull * Math.min(1, (dx.acv || 0) / expT) : 0);
      if (vx > 0){ nxt = dx; nxtPay = vx;
                   nxtKind = dx.type === "Renewal" ? "renewal" : "expansion"; break; }
    }
  }
  var ladderCap = S.closed ? 'the quarter is closed'
    : nxt ? 'the next ' + nxtKind
    : (LAD && LAD.lvl >= csCap()) ? 'past the ceiling, nothing adds'
    : (LAD && LAD.ceiling < RF()) ? 'the book cannot reach ' + E.pct0(RF())
    : 'nothing open pays more';
  var lpos = function(v){ return Math.max(0, Math.min(100, (v || 0) * 100)); };
  /* THE ART FOLLOWS THE COMPONENT THE TILE IS ABOUT. The retention ladder's
     two marks were drawn under an expansion as well, which puts the 88% gate
     and the 95% line beside a number neither of them governs: expansion has no
     gate and pays from the first dollar. An expansion draws its own progress
     against its target, the same bar the growing tile uses. Javier, 19 Oct. */
  var art = (nxt && nxtKind === "expansion")
    ? '<div class="art"><div class="meter"><i style="width:' +
      w(expT ? expW / expT : 0).toFixed(1) + '%"></i><u style="left:' +
      w(S.closed ? 1 : (S.pace || 0)).toFixed(1) + '%"></u></div>'
    : '<div class="art"><div class="meter ladder"><i style="width:' +
      lpos(LAD ? LAD.lvl : 0).toFixed(1) + '%"></i>' +
      '<u class="dot1" style="left:' + lpos(RF()).toFixed(1) + '%"></u>' +
      '<u class="dot2" style="left:' + lpos(RFU()).toFixed(1) + '%"></u></div>';
  tiles.push(['Next one is worth', nxtPay ? money0(nxtPay) : '\u2014',
    art + '<div class="cap">' + ladderCap + '</div></div>', '']);
  return tiles.map(function(t, i){
    return '<div class="tile ' + t[3] + '" data-cstile="' + i +
      '" data-key="' + esc(rep.name) + '" data-tone="' + t[3] +
      '"><div class="k">' + t[0] + '</div><div class="v">' + t[1] + '</div>' + t[2] + '</div>';
  }).join('');
}
function cap1(s){ s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
/* THE TWO-BAR ART. Lifted out of `aeTiles` on 19 Oct so the SDR's own
   "next one is worth" tile can use the same thing instead of a caption:
   Javier's point is that a rep should not have to learn a second visual
   language moving between two screens that answer the same question. */
function stepArt(a, b, lab2){
  var m = Math.max(a, b) || 1;
  /* Two blues, not one. "Now" is money this deal would actually pay today;
     "past quota" is conditional, so it reads as the lighter of the pair and
     the eye does not have to go to the labels to tell them apart. */
  var one = function(v, lab, cls){
    return '<div class="steprow ' + cls + '"><s style="width:' +
      (v / m * 100).toFixed(1) + '%"></s><em>' + esc(lab) + '</em></div>'; };
  /* The bars keep the comparison the headline gave up: equal lengths are a
     plan whose accelerator does nothing.

     NO CAPTION. Naming the deal here pushed the text out of the tile and it
     rendered below the box, overlapping the row underneath. The tile is a
     fixed height and the two bars already fill it; the deal's name and week
     live on the card. Javier, 13 Oct: "is out of the box and it is on the
     hoover, kill". */
  /* TWO BARS WHENEVER THERE IS A STEP ABOVE THEM, in both directions. I had
     hidden the second bar on a CROSSING deal because it comes out shorter
     when the step is the decelerator, and I read that as "wait and earn
     less". Javier, 14 Oct, on Imani at 66%: "it lost the second line ... I
     don't think she pass every rate at week 7." Right, and the two crossing
     cases are opposites that I had collapsed into one. The decelerator pays
     back RETROACTIVELY, so her $8K deal pays $3,808 against $640 for the
     same deal afterwards, and the long first bar is the story: close it and
     collect the catch-up. The accelerator's second tier is MARGINAL, so
     Eleanor's deal pays $2,760 against $3,400 once she is over 120%, and the
     longer second bar is the story. Nobody delays a deal to earn less, so
     neither bar misleads. One bar only when nothing sits above them. */
  return '<div class="art"><div class="step">' + one(a, "now", "real") +
    (lab2 ? one(b, lab2, "maybe") : '') + '</div></div>'; }

function aeTiles(rep){
  var q = rep.quota || P.qQuota, closed = rep.closed || 0, at = rep.attain || 0;
  var comm = E.commAt(P, at) / 4, oteQ = (P.ote || 0) / 4, baseQ = (P.base || 0) / 4;
  /* P.r, not E.resolve(): the resolved answer set is the JSON's now, and
     calling the engine here would read round the pivot. */
  var hold = (P.r || {}).CLAW === "CLAW_HOLDBACK";
  var held = hold ? comm * 0.2 : 0;
  var earned = baseQ + comm;
  var nd = nextDealValue(rep);
  var t1 = tone("AE", firedFor("AE", rep));

  /* THE SAME MARK THE CEO TILES USE. The first version drew the people
     table's row bar here, so the one tile with a direct counterpart on the
     RevOps screen, REVENUE AGAINST PLAN, did not look like it. Javier, 13 Oct. */
  var meter = function(v, tick, cap, zones){
    return '<div class="art"><div class="meter' + (zones ? ' zoned' : '') + '">' +
      (zones || '') +
      '<i style="width:' + w(v).toFixed(1) + '%"></i>' +
      '<u style="left:' + w(tick).toFixed(1) + '%"></u></div>' +
      '<div class="cap">' + cap + '</div></div>'; };

  /* THE SEGMENTED QUOTA BAR THE SPEC ASKED FOR. The zones the plan actually
     pays in, drawn behind the fill: the reduced rate, the flat middle, the
     accelerator, and the second tier where a plan has one. The boundaries ARE
     the thresholds, so the 70% line and quota are on screen without adding a
     second tick to a bar that already carries the pace. Javier, 13 Oct:
     "too many ticks may be confusing". */
  var zones = (function(){
    var d = P.decel || {}, ac = P.accel || {}, cuts = [];
    if (d.thr) cuts.push(d.thr);
    cuts.push(ac.from || 1);
    if (ac.t2 && ac.at) cuts.push(ac.at);
    var out = [], from = 0;
    cuts.concat([SCALE]).forEach(function(to, i){
      var l = w(from), r = w(Math.min(to, SCALE));
      if (r > l) out.push('<b class="z' + (i + 1) + '" style="left:' + l.toFixed(1) +
        '%;width:' + (r - l).toFixed(1) + '%"></b>');
      from = to;
    });
    return out.join('');
  })();

  /* Two bars rather than a caption, because this tile exists for the
     COMPARISON. Scaled to the larger of the two, so when a plan has no
     accelerator the bars are the same length and the picture says so before
     the words do. It also fixes the tile reading as empty: its art was 17px
     against 28 to 36 everywhere else, which is what made the figure look
     shrunken next to its neighbours. */

  return [
    ['My attainment', pct0(at),
     meter(at, S.closed ? 1 : S.pace,
       E.moneyK(closed) + ' of ' + E.moneyK(q) +
       (S.closed ? '' : ' \u00b7 tick = week ' + S.week + ' pace'), zones), t1],
    /* THE BAR MEANS SOMETHING NOW. It was paid against total, where total was
       whatever happened to be earned, so the fill could never say anything.
       The whole is the quarter's OTE and the tick sits on it, exactly as the
       revenue tile reads against quota. */
    ['Earned so far', money0(earned),
     meter(oteQ ? earned / oteQ : 0, 1,
       hold ? money0(held) + ' held until the customer sticks'
            : 'tick = ' + money0(oteQ) + ' at quota'), ''],
    /* ONE NUMBER, AND IT IS POCKET DOLLARS. The two-number version compared
       RATES, so a rep already past quota saw the same figure twice: on #clean
       at week 12 it printed "$51,570 to $51,570", because past quota the
       marginal rate stops changing even though the money does not. A rep
       wants one question answered, what does my next deal pay me, so the
       tile answers it and the card keeps the comparison. Javier, 13 Oct. */
    ['What the next deal is worth',
     nd ? money0(nd.now) : '\u2014',
     nd ? stepArt(nd.now, nd.after,
               nd.step ? "past " + nd.step.label : "")
        : '<div class="art"><div class="cap">' +
          (S.closed ? 'the quarter is closed' : 'nothing open this quarter') +
          '</div></div>', '']
  ].map(function(t, i){
    return '<div class="tile ' + t[3] + '" data-aetile="' + i +
      '" data-key="' + esc(rep.name) + '" data-tone="' + t[3] +
      '"><div class="k">' + t[0] + '</div><div class="v">' + t[1] + '</div>' + t[2] + '</div>';
  }).join('');
}

/* THE TEAM'S TABLE, NOT A ONE-LINE STRIP. The 7 Oct note proposed collapsing
   this to a rank strip; Javier overruled it on 13 Oct looking at the built
   version. Top five of the rep's own team, then the rep themselves wherever
   they actually sit, carrying their real rank:

       1. Peter      4. John
       2. Michael    5. Steve
       3. Dave          12. You

   SCOPED TO THE TEAM. The people a rep is measured against are the ones their
   manager compares them to; a company rank on a thirty-AE org is a more
   exposing fact and not one they can act on. No manager, no team: it falls
   back to the company and the heading says so.

   STILL NO NUMBERS ON IT. One published attainment and a shared rate is all
   it takes to work out anybody's pay, so the bar is the whole row and the
   figures live behind your own hover. That permission model is the point of
   this view, and it is the thing the RevOps screen deliberately switches off. */
/* AN AE'S TEAM IS AN AE TEAM, and an SDR's is their own. The AE-only guard was
   right when this served one view; with the SDR and CS views built it put
   every SDR and CSM on a company-wide leaderboard and titled it "Where you sit
   in the company" while they plainly sit on a team. Javier, 15 Oct. */
function teamOfRep(name, role){
  var want = role === "SDR" ? "SDR" : role === "CS" ? "CS" : null;
  return (S.teams || []).filter(function(t){
    var m = t.manages || "AE";
    if (want ? m !== want : (m === "SDR" || m === "CS")) return false;
    return (t.members || []).some(function(x){ return x.name === name; }); })[0] || null;
}
/* ONE LEADERBOARD, THREE ROLES. An SDR ranks on the count their plan pays on
   and a CSM on retention, and a CSM's row carries TWO bars rather than one,
   because the whole CS view refuses to blend retention and expansion into a
   single number and a single bar would have to pick one and hide the other.
   Spec'd 23 Sep, built 15 Oct. */
function rosterOf(role){
  return role === "SDR" ? (S.sdrs || []) : role === "CS" ? (S.css || []) : aeRoster();
}
function boardRows(rep, role){
  role = role || "AE";
  var t = teamOfRep(rep.name, role);
  var names = {};
  (t ? (t.members || []) : rosterOf(role)).forEach(function(m){ names[m.name] = 1; });
  /* THE ORDER FOLLOWS THE MEASURE ON SCREEN. A CSM carries two, and which one
     the board ranks on is the reader's choice rather than ours. Javier,
     19 Oct. */
  var key = role !== "CS" ? function(r){ return r.attain || 0; }
          : ST.csCol === "exp"
            ? function(r){ return r.expTarget ? (r.expWon || 0) / r.expTarget : 0; }
            : function(r){ return boardRet(r); };
  var ranked = rosterOf(role).filter(function(r){ return names[r.name]; })
    .slice().sort(function(a, b){ return key(b) - key(a); });
  var i = ranked.map(function(r){ return r.name; }).indexOf(rep.name);
  return {team: t, ranked: ranked, mine: i, role: role};
}
/* The leaderboard ranks on the LEVEL, the same thing its bar draws, so the
   order and the bars cannot disagree. */
function boardRet(r){
  var v = null;
  try { var c = FIND.ctxCS(P, L, S, r); if (c) v = c.retIfNoMore; } catch(e){}
  if (v != null) return v;
  return r.retention == null ? 0 : r.retention;
}
function board(rep, role){
  var B = boardRows(rep, role), ranked = B.ranked, mine = B.mine;
  role = B.role;
  var TOP = 5;
  var out = [];
  /* THE REP GOES FIRST, carrying their real rank. Appending them under the
     top five put them below the fold on a team of seven, so the one row the
     screen exists for needed a scroll to find. Javier, 13 Oct. Inside the top
     five they are simply highlighted in place and not repeated. */
  if (mine >= TOP){
    out.push(row(ranked[mine], mine + 1));
    out.push('<tr class="gap"><td colspan="3"></td></tr>');
  }
  ranked.slice(0, TOP).forEach(function(r, i){ out.push(row(r, i + 1)); });
  function row(r, n){
    var me = r.name === rep.name, t0 = me ? tone(role, firedFor(role, r)) : "";
    /* TWO UNLABELLED BARS STACKED IN A 44% COLUMN read as one broken bar, and
       neither said which was which. Javier, 18 Oct: "the two lines on the
       People's table is a complete disaster". Each now carries its own word,
       the book bar splits renewed from still-up, and the expansion bar only
       exists on a plan that has an expansion target. `barOf` is what carries
       the bent track and the split, so the row and the tree draw the same
       thing from the same place. */
    /* ONE BAR, THE ONE THE BUTTONS SELECT. Two stacked bars read as one
       broken bar whichever way they were labelled, and the second was
       answering a question the reader had not asked. Javier, 19 Oct. */
    var bars;
    if (role === "CS"){
      if (ST.csCol === "exp")
        bars = barHTML(r.expTarget ? (r.expWon || 0) / r.expTarget : 0, t0);
      else { var bc = barOf("CS", r); bars = barHTML(bc.val, t0, bc.opt); }
    } else bars = barHTML(r.attain, t0);
    return '<tr data-kind="board" data-role="' + role + '" data-key="' + esc(r.name) +
      '" data-me="' + (me ? "1" : "") + '"' + (me ? ' class="sel"' : '') +
      '><td class="nm rk">' + n + '.</td>' +
      '<td class="nm">' + (me ? "You" : esc(r.name)) + '</td>' +
      '<td>' + bars + '</td></tr>';
  }
  /* A HEADER, so this table says what its columns are like every other one on
     the screen. It had none at all. Javier, 19 Oct. */
  var anyExp = false;
  ranked.forEach(function(r){ if (r.expTarget) anyExp = true; });
  var toggle = (role === "CS" && anyExp)
    ? '<span class="segs">' +
      '<b data-cscol="ret"' + (ST.csCol === "exp" ? '' : ' class="on"') + '>Retention</b>' +
      '<b data-cscol="exp"' + (ST.csCol === "exp" ? ' class="on"' : '') + '>Expansion</b>' +
      '</span>' : '';
  var head = '<thead><tr><th></th><th>Name</th><th>Against target' +
    '<span class="q" data-q="board-col">?</span>' + toggle + '</th></tr></thead>';
  return '<colgroup><col style="width:11%"><col style="width:45%">' +
    '<col style="width:44%"></colgroup>' + head + '<tbody>' + out.join('') + '</tbody>';
}
function boardTitle(rep, role){
  var B = boardRows(rep, role);
  return B.team ? "Where you sit on " + B.team.manager + "'s team"
                : "Where you sit in the company";
}

/* The deal table's shape follows the SHELL, not the fact that a person is
   selected: an SDR screen is one person's view on the admin shell and takes the
   admin table, which is Javier's "SDRs deals aren't really relevant and all
   post, since creation is what matters". */
function dealsFor(name, wide){
  return deals(function(d){ return d.rep === name; },
               wide === undefined ? SH().shell === "wide" : wide !== false);
}

/* ---- render ------------------------------------------------------------ */
function render(){
  build();
  CARDS.close();
  levers();
  fillFilter();
  fillTypes();
  /* A changed answer can take the plan out from under the selected role. */
  if (!roleExists(ST.role)) { ST.role = "revops"; ST.who = null; fillFilter(); }
  /* THE CARDS LEARN WHOSE SCREEN THIS IS AFTER THE FILTER HAS DECIDED. This
     was two lines higher, which meant `viewer` was read before fillFilter()
     picked the default rep, so on the first render after any role switch the
     cards had viewer:null and stayed that way until something else re-rendered.
     Found 14 Oct chasing the SDR pay row, which kept appearing on a rep's own
     screen; the same staleness was making the card call a rep by name on their
     own view, which is the exact bug the viewer field was added for on 13 Oct. */
  CARDS.sync(cardApi());
  el("viewtag").textContent = (roles().filter(function(x){ return x[0] === ST.role; })[0] ||
      ["", "RevOps (admin)"])[1] +
    (SH().pick ? " \u2014 " + (el("whoSel").value || "") : "");

  /* The four plan levers are the CEO's and RevOps'. A rep cannot re-rate their
     own plan, so their screen does not offer to. Week stays: it is in every
     persona and it is not a what-if. */
  var solo = !SH().levers;
  /* 50 / 50 on the rep shell, 35 / 65 on the admin shell. */
  el("view").classList.toggle("repwide", SH().shell === "wide");
  /* A CSM's own width: the rep layout, with the table pulled in so four tiles
     fit above it. Javier, 18 Oct. */
  el("view").classList.toggle("repmid", SH().shell === "mid");
  el("view").classList.toggle("cansel", !!SH().select);
  el("view").classList.toggle("canpick", SH().tiles === "ceo" && !SH().select);
  el("levers").classList.toggle("noplan", solo);
  /* One lever node, two homes. Duplicating it would mean two sliders that have
     to be kept agreeing, which is the bug waiting to happen. */
  var wk = el("lever-week"), home = solo ? el("headlever") : el("levers");
  if (wk.parentNode !== home) home.appendChild(wk);
  el("levers").hidden = solo;

  if (SH().tiles === "ae"){
    var rep = aeOf(ST.who);
    if (!rep){ el("tiles").innerHTML = ""; el("tree").innerHTML = "";
               el("dealtab").innerHTML = ""; el("findings").innerHTML = ""; return; }
    el("orgttl").textContent = boardTitle(rep);
    el("dealttl").textContent = "Your deals this quarter";
    el("tiles").innerHTML = aeTiles(rep);
    el("tree").innerHTML = board(rep);
    el("dealtab").innerHTML = dealsFor(rep.name);
    el("xnote").innerHTML = LAST_PAY ? crossNote(LAST_PAY) : "";
    el("findings").innerHTML = '<h4 class="findttl">What this means for you</h4>' +
      firedFor("AE", rep).map(findingRow).join('');
    el("xnote").innerHTML = LAST_PAY ? crossNote(LAST_PAY) : "";
    return;
  }

  /* ---- a manager ------------------------------------------------------
     Three views sharing a skeleton, not one: a sales, SDR and CS manager's
     teams are measured on closed revenue, pipeline created and retention, and
     a generic manager view would have to pick one and be wrong for two thirds
     of the people reading it. So this is the rep view of whatever role sits
     below them, aggregated, with their own pay underneath. */
  if (SH().tiles === "mgr"){
    var mt = (S.teams || []).filter(function(x){ return x.manager === ST.who; })[0];
    if (!mt){ el("tiles").innerHTML = ""; el("tree").innerHTML = "";
              el("dealtab").innerHTML = ""; el("findings").innerHTML = ""; return; }
    var own = {}; (mt.members || []).forEach(function(m){ own[m.name] = 1; });
    own[mt.manager] = 1;
    /* The block is the team; the column already says what the rows are for. */
    el("orgttl").innerHTML = 'Your team';
    el("tiles").innerHTML = mgrTiles(mt);
    el("tree").innerHTML = mgrPeople(mt);
    /* AN SDR MANAGER'S TEAM OWNS NO DEALS. Their people create opportunities and
       an AE owns them from that moment, so filtering the table by owner gave an
       SDR manager an empty table. Theirs is what the team CREATED, including
       what somebody else now owns and has closed or lost, which is the same
       rule the SDR's own view follows. */
    var one = ST.pick && own[ST.pick] ? ST.pick : null;
    el("dealttl").textContent = one
      ? one.split(" ")[0] + "'s deals this quarter"
      : "Your team's deals this quarter";
    if (mt.manages === "SDR" && meetingsPlan()){
      var who0 = {};
      if (one) who0[one] = 1;
      else (mt.members || []).forEach(function(m){ who0[m.name] = 1; });
      el("dealtab").innerHTML = meetingsFor(who0, false);
      el("dealttl").textContent = one
        ? one.split(" ")[0] + "'s meetings this quarter"
        : "Your team's meetings this quarter";
    } else
    el("dealtab").innerHTML = deals(
      mt.manages === "SDR"
        ? function(d){ return one ? d.createdByRep === one : own[d.createdByRep]; }
        : function(d){ return one ? d.rep === one : own[d.rep]; }, false);
    el("xnote").innerHTML = LAST_XNOTE;
    /* The one line that says why this view behaves differently from the other
       four: everywhere else the action is inside the finding, because a rep's
       action is something they do themselves. Here it is always about a
       specific person, and findings never name people. */
    /* AND THE OTHER HALF OF THEIR PAY, WHERE THEY HAVE ONE. On a team of three
       or fewer the manager carries a bag, and until now a rep at 42% with $281K
       open got four standings about where that stands while the selling manager
       got none, on the larger of the two numbers they are paid on. The rep set
       resolves against their own record, so this needed no new finding copy.
       Ids are prefixed `own-` in the proof sheet so a card about the manager's
       own quarter can never be mistaken for one about their team. */
    el("findings").innerHTML = findingBlock("MGR", mt) + sellerBlock(mt);
    return;
  }

  /* ---- an SDR, and a CSM ------------------------------------------------
     The same shelf the AE has, with the tiles their own plan is paid on.
     Built 15 Oct to the spec in wizard-copy.md. */
  if (SH().tiles === "sdr" || SH().tiles === "cs"){
    var isCs = SH().tiles === "cs", kind = isCs ? "CS" : "SDR";
    var me = (isCs ? (S.css || []) : (S.sdrs || []))
      .filter(function(m){ return m.name === ST.who; })[0];
    if (!me){ el("tiles").innerHTML = ""; el("tree").innerHTML = "";
              el("dealtab").innerHTML = ""; el("findings").innerHTML = ""; return; }
    el("orgttl").textContent = boardTitle(me, kind);
    el("tiles").innerHTML = isCs ? csTiles(me) : sdrTiles(me);
    el("tree").innerHTML = board(me, kind);
    /* AN SDR'S TABLE IS WHAT THEY SOURCED, a CSM's is their book. Neither
       owns the rows: an AE owns the deal an SDR created and the renewal a CSM
       is holding, so filtering by owner would empty both. */
    var mine = {}; mine[me.name] = 1;
    var meet = !isCs && meetingsPlan();
    el("dealttl").textContent = isCs ? "Your book this quarter"
                              : meet ? "The meetings you held this quarter"
                                     : "What you sourced this quarter";
    el("dealtab").innerHTML = isCs
      ? deals(function(d){ return d.rep === me.name; }, false)
      : meet ? meetingsFor(mine, false)
      : deals(function(d){ return d.createdByRep === me.name; }, false, "SDR");
    el("xnote").innerHTML = LAST_XNOTE;
    el("findings").innerHTML = '<h4 class="findttl">What this means for you</h4>' +
      firedFor(kind, me).map(findingRow).join('');
    return;
  }
  if (!SH().built){
    el("tiles").innerHTML = "";
    el("tree").innerHTML = "";
    el("dealtab").innerHTML = "";
    el("findings").innerHTML = '<div class="finding warn"><b>Not in this pass</b>' +
      'This view has not been built yet.</div>';
    return;
  }
  el("orgttl").textContent = "The whole organization";
  el("tree").innerHTML = tree();

  /* THE CEO IS THE SAME SHELF WITHOUT THE SUPER-ADMIN POWER. Same tiles, same
     tree, same levers; what it does not have is selection. "The CEO doesn't
     have admin powers", Javier, 14 Oct, so a row click repoints nothing and the
     rows carry no cursor saying it would. The tree still expands, because
     teams opening to their people is the whole reason the table is there. */
  if (!SH().select){
    /* THE CEO POINTS THE TABLE AND NOTHING ELSE. On 14 Oct we took the click
       away entirely, on the argument that the CEO has no admin powers. Javier
       put it back on 15 Oct with a narrower power: his findings are always on
       screen because they are his own, so a click has nothing to repoint
       except the deals. The tiles and the findings stay where they are. */
    var cp = ST.pick,
        ct = cp ? (S.teams || []).filter(function(x){ return x.manager === cp; })[0] : null;
    var cd = cp && DEPT_LABEL[cp] ? cp : null;
    el("dealttl").textContent = cd ? DEPT_LABEL[cd]
                              : ct ? ct.manager.split(" ")[0] + "'s team deals"
                              : cp ? cp.split(" ")[0] + "'s deals"
                              : "Your team's deals this quarter";
    el("tiles").innerHTML = tiles();
    el("dealtab").innerHTML = cd ? deals(deptFilterFor(cd), false, cd === "SDR" ? "SDR" : null)
                            : cp ? deals(dealFilterFor(cp), false, lensFor(cp))
                            : deals();
    el("xnote").innerHTML = LAST_XNOTE;
    el("findings").innerHTML = findingBlock("CEO", null);
    return;
  }

  /* THE SELECTION DRIVES THE OTHER THREE PANELS. The tree itself never
     narrows: this seat sees everybody, and the point of the view is reading
     one person against the whole org, not hiding the org. */
  var sel = ST.sel, rep = null, team = null;
  /* AN SDR OR A CSM SELECTED HERE REPOINTS EVERYTHING, like an AE always has.
     This resolved `sel.role === "AE"` only, so clicking either of the other
     two left the tiles, the table and the findings on the company while the
     row sat highlighted. It was correctly blocked on those views not
     existing; they exist, so the admin can read them. Javier, 18 Oct. */
  if (sel && sel.kind === "person" && sel.role !== "AE"){
    var who1 = (sel.role === "CS" ? (S.css || []) : (S.sdrs || []))
      .filter(function(m){ return m.name === sel.key; })[0];
    if (who1){
      var isC = sel.role === "CS", one1 = {}; one1[who1.name] = 1;
      el("dealttl").textContent = isC
        ? who1.name.split(" ")[0] + "'s book"
        : (meetingsPlan() ? who1.name.split(" ")[0] + "'s meetings"
                          : who1.name.split(" ")[0] + " sourced these");
      el("tiles").innerHTML = isC ? csTiles(who1) : sdrTiles(who1);
      el("dealtab").innerHTML = isC
        ? deals(function(d){ return d.rep === who1.name; }, false)
        : meetingsPlan() ? meetingsFor(one1, false)
        : deals(function(d){ return d.createdByRep === who1.name; }, false, "SDR");
      el("xnote").innerHTML = LAST_XNOTE;
      el("findings").innerHTML = findingBlock(sel.role, who1);
      return;
    }
  }
  if (sel && sel.kind === "person" && sel.role === "AE") rep = aeOf(sel.key);
  if (sel && sel.kind === "team")
    team = (S.teams || []).filter(function(t){ return t.manager === sel.key; })[0];

  /* The CEO read from the admin's seat. Same numbers the admin's own default
     shows, which is the point: it is the CEO's row, so his findings arrive
     with it. No "what this means for you" heading here, because on this
     screen you are the admin looking at him. */
  if (sel && sel.kind === "ceo"){
    el("dealttl").textContent = (sel.key || "").split(" ")[0] + "'s team deals";
    el("tiles").innerHTML = tiles();
    el("dealtab").innerHTML = deals();
    el("xnote").innerHTML = LAST_XNOTE;
    el("findings").innerHTML = findingBlock("CEO", null);
    return;
  }

  if (rep){
    el("dealttl").textContent = rep.name.split(" ")[0] + "'s deals";
    el("tiles").innerHTML = aeTiles(rep);
    el("dealtab").innerHTML = dealsFor(rep.name, false);
    el("xnote").innerHTML = LAST_XNOTE;
    el("findings").innerHTML = findingBlock("AE", rep);
    return;
  }
  if (team){
    el("dealttl").textContent = team.manager.split(" ")[0] + "'s team deals";
    /* THE TILES FOLLOW THE SELECTION. This line was a placeholder from before
       the manager views existed: picking a team repointed the deal table and
       the findings and left the company's four tiles sitting above them, so
       the numbers on screen described two different things at once. The
       manager tiles exist now, so the selection gets them. Javier, 15 Oct. */
    el("tiles").innerHTML = mgrTiles(team);
    el("dealtab").innerHTML = deals(dealFilterFor(team.manager), false,
                                    lensFor(team.manager));
    el("xnote").innerHTML = LAST_XNOTE;
    el("findings").innerHTML = findingBlock("MGR", team);
    return;
  }

  var dk = sel && sel.kind === "dept" ? sel.key : null;
  el("dealttl").textContent = dk ? (DEPT_LABEL[dk] || "The quarter's deals")
                                 : "The quarter's deals";
  el("tiles").innerHTML = tiles();
  el("dealtab").innerHTML = dk
    ? deals(deptFilterFor(dk), false, dk === "SDR" ? "SDR" : null)
    : deals();
  el("xnote").innerHTML = LAST_XNOTE;
  el("findings").innerHTML = dk
    ? findHint(DEPT_HINT[dk] || "Click on a person to see their findings.")
    : findHint("Click on any person to see their findings here.");
}
/* One renderer for every findings block, so a heading cannot drift between
   the views that use it. */
/* The seller block. One line under the heading carrying the two facts a
   manager needs, what is at stake and that this part is not about their team,
   then the rep cards read against their own book. An earlier draft explained
   how the sheet was assembled and justified the block by the team size, which
   is the builder's problem and not the reader's. */
function sellerBlock(t){
  var sr = t.seller;
  if (!sr) return "";
  var f = mgrFacts(t);
  if (!f.pay.own) return "";
  return '<h4 class="findttl">Your own number, as a seller</h4>' +
    '<p class="findlead">' + money0(f.pay.own) + ' of your variable rides on your own ' +
    'quota rather than on the team.</p>' +
    firedFor("AE", sr).map(findingRow).join('');
}
function findingBlock(role, subj){
  /* EVERY SCREEN IS ONE YOU ARE IN. The manager heading named them in the third
     person on their own view while the AE's says "for you", which made the
     manager views read as something you look at rather than something you are.
     Javier, 14 Oct. */
  /* AND THE CEO IS A PERSON TOO. His screen is one he is IN, like the AE's and
     the manager's, so it carries the same heading; the admin's console is now
     the only view without one, which is the first thing that tells the two
     apart. Javier, 15 Oct. The same findings read from the ADMIN's seat get no
     heading, because there you are looking at him rather than being him. */
  var ttl = (role === "AE" || role === "MGR" ||
             (role === "CEO" && ST.role === "ceo")) ? "What this means for you" : "";
  /* The line explaining that a manager's actions live in the table came out on
     14 Oct. It was approved copy from the spec and Javier retired it on sight:
     it read in the third person under a third-person heading, and "the findings
     are the findings, they aren't what you are describing here". The split it
     described is real and the tour can carry it. */
  return (ttl ? '<h4 class="findttl">' + esc(ttl) + '</h4>' : '') +
    firedFor(role, subj).map(findingRow).join('');
}

/* ---- controls ---------------------------------------------------------- */
/* The column set follows the window, so the window has to be watched. */
var rzT = null;
window.addEventListener("resize", function(){
  clearTimeout(rzT); rzT = setTimeout(render, 150); });
/* Delegated, because the line is rebuilt on every render. */
el("whatif").addEventListener("click", function(e){
  if (!e.target.closest || !e.target.closest("#whatif-reset")) return;
  e.preventDefault();
  resetLevers();
  render();
});

el("roleSel").addEventListener("change", function(e){
  /* The selection goes with the view. Moving from RevOps to the CEO left a
     row highlighted and a selection pointing at a screen that no longer has
     one. Javier, 14 Oct. */
  ST.role = e.target.value; ST.who = null; ST.pick = null; ST.sel = null;
  ST.onlyX = false; render(); });
el("whoSel").addEventListener("change", function(e){
  ST.who = e.target.value; ST.pick = null; render(); });
el("typeSel").addEventListener("change", function(e){ ST.type = e.target.value; render(); });

/* Opening and closing the org tree, and SELECTING A ROW. Delegated, so both
   survive the rebuild.

   Selection is what the spec has always said this view does: "clicking a row
   moves three things at once: the findings below the table become that
   person's findings for that week, the tile row becomes that person's tiles,
   and the deal table filters to their deals". It is also what the tour needs,
   since its RevOps step clicks a rep and expects exactly that. Javier, 13 Oct.

   The caret is checked FIRST, so opening a branch does not also select it. */
/* The leaderboard's measure switch. Delegated on the board so it survives
   every re-render, like the deal table's sort. */
document.getElementById("orgbox").addEventListener("click", function(e){
  var b = e.target.closest && e.target.closest("[data-cscol]");
  if (!b) return;
  e.stopPropagation();
  ST.csCol = b.getAttribute("data-cscol");
  render();
});
document.getElementById("tree").addEventListener("click", function(e){
  /* A manager picking one of their own people. Clicking the same row again
     clears it, the same way the RevOps tree lets go of a selection. */
  var pk = e.target.closest ? e.target.closest("[data-pick]") : null;
  if (pk && SH().tiles === "mgr"){
    var nm = pk.getAttribute("data-pick");
    ST.pick = ST.pick === nm ? null : nm;
    render();
    /* NO RE-PIN. A row click selects and nothing more since 19 Oct, so there
       is no pinned card to put back on the rebuilt row. */
    return;
  }
  /* The CEO's row click: it points the deal table and leaves everything else
     alone. Checked after the caret so expanding a branch still expands it. */
  if (SH().tiles === "ceo" && !SH().select){
    var ct2 = e.target.closest ? e.target.closest("[data-node]") : null;
    if (!ct2){
      var cr = e.target.closest
        ? e.target.closest('tr[data-kind="person"],tr[data-kind="team"],tr[data-kind="dept"]') : null;
      if (cr){
        var ck = cr.getAttribute("data-key") || "";
        ST.pick = ST.pick === ck ? null : ck;
        render();
        return;
      }
    }
  }
  var c = e.target.closest ? e.target.closest("[data-node]") : null;
  if (c){
    var id = c.getAttribute("data-node");
    ST.open[id] = !nodeOpen(id, id.indexOf("team:") !== 0);
    render();
    return;
  }
  if (!SH().select) return;
  var tr = e.target.closest ? e.target.closest("tr[data-kind]") : null;
  if (!tr) return;
  var kind = tr.getAttribute("data-kind"), key = tr.getAttribute("data-key") || "";
  /* The company row IS the unselected state, and clicking a selected row
     again clears it, so there is always a way back out without hunting. */
  if (kind === "co" || (ST.sel && ST.sel.kind === kind && ST.sel.key === key))
    ST.sel = null;
  else ST.sel = {kind: kind, key: key, role: tr.getAttribute("data-role") || ""};
  render();
  /* The 15 Oct re-pin is gone with the pin-on-click it existed for. */
});

/* Sorting the deal table. Delegated from the table itself, so it survives the
   table being rebuilt on every render. */
/* The crossing line is a control, so it listens. */
document.getElementById("xnote").addEventListener("click", function(e){
  if (!e.target.closest || !e.target.closest("[data-onlyx]")) return;
  ST.onlyX = !ST.onlyX;
  render();
});
document.getElementById("dealtab").addEventListener("click", function(e){
  var h = e.target.closest ? e.target.closest("th.sortable") : null;
  if (!h) return;
  var col = h.getAttribute("data-col");
  ST.sort = !ST.sort || ST.sort.col !== col ? {col:col, dir:1}
          : ST.sort.dir === 1 ? {col:col, dir:-1}
          : null;   /* third click: back to the default arrangement */
  render();
});

/* THE FOUR PLAN LEVERS. Click anywhere on a track to jump there, or drag the
   handle. Both gestures go through the same `at()`, so there is one definition
   of what an x position means.

   WHY POINTER EVENTS AND setPointerCapture: a mouse that leaves the track
   mid-drag must keep dragging, and a touch must not scroll the page under it.
   Capture gives both for free and releases on pointerup wherever it happens.

   THE NUMBERS MOVE WHILE THE HANDLE MOVES, THE FINDINGS WAIT FOR THE RELEASE.
   Spec, 23 Sep. `DRAGGING` is what `syncFindings` reads, and the pointerup
   path clears it and renders again, so the deferral is never the last word.
   Renders are coalesced onto an animation frame: a pointermove can fire more
   often than the screen refreshes and a full render per event drops frames on
   the large presets. */
(function(){
  var raf = 0;
  function paint(){ raf = 0; render(); }
  function queue(){ if (!raf) raf = requestAnimationFrame(paint); }

  function at(id, clientX){
    var t = el(id).querySelector(".track").getBoundingClientRect();
    if (id === "lever-week"){ setWeekAt(clientX); return; }
    var sp = leverSpecs()[id]; if (!sp) return;
    var f = Math.min(1, Math.max(0, (clientX - t.left) / t.width));
    var v = sp.lo + f * (sp.hi - sp.lo);
    /* Snapped to the step, then rounded away from floating point: a quota of
       $599,999.9999 prints as $150K and compares as a moved lever forever. */
    v = Math.round(v / sp.step) * sp.step;
    v = Math.round(v * 1e6) / 1e6;
    sp.set(Math.min(sp.hi, Math.max(sp.lo, v)));
  }

  /* WEEK IS IN THIS LIST NOW. Its own "?" says "Drag it back and nothing is
     lost" and the tour step says "Drag WEEK and the quarter plays out", and
     until 20 Oct it answered clicks only: two pieces of approved copy were
     teaching a gesture the control did not have. It is not a what-if, so it
     has no entry in leverSpecs and no baseline to be off; `at()` falls
     through to the week path below. Javier spotted it. */
  ["lever-quota", "lever-reps", "lever-ret", "lever-ceil", "lever-week"].forEach(function(id){
    var n = el(id); if (!n) return;
    var track = n.querySelector(".track");
    track.addEventListener("pointerdown", function(e){
      /* The "?" sits in the label, not the track, so it is not caught here. */
      e.preventDefault();
      DRAGGING = true;
      track.setPointerCapture(e.pointerId);
      at(id, e.clientX);
      queue();
    });
    track.addEventListener("pointermove", function(e){
      if (!DRAGGING || !track.hasPointerCapture(e.pointerId)) return;
      at(id, e.clientX);
      queue();
    });
    function end(e){
      if (!DRAGGING) return;
      DRAGGING = false;
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      /* The render that recomputes the findings. */
      render();
    }
    track.addEventListener("pointerup", end);
    track.addEventListener("pointercancel", end);
  });
})();

/* The week lever is the one control that worked before this pass: click
   anywhere on its track and the quarter moves there. */
/* ONE DEFINITION OF WHAT AN X POSITION MEANS ON THE WEEK TRACK, read by both
   the click and the drag. The thirteen weeks share the first 84% of the
   track and the closed quarter sits past 92%, which is the spacing the lever
   has always drawn. */
function setWeekAt(clientX){
  var t = el("lever-week").querySelector(".track").getBoundingClientRect();
  var f = Math.min(1, Math.max(0, (clientX - t.left) / t.width));
  ST.week = f >= 0.92 ? "closed"
    : Math.min(E.QTR_WEEKS, Math.max(1, Math.round(1 + (f / 0.84) * (E.QTR_WEEKS - 1))));
}

/* YOUR FILES. Every button hands over the real file for the plan on screen.

   FOUR OF THEM ARE BUILT ON DEMAND BY n8n. The page POSTs the answers, the
   week and the levers to the webhook, n8n runs the same builders this project
   has always used, and the blob comes back. Nothing on this rail is pre-built
   and nothing is named after a preset any more. 28 Oct.

   THE VISITOR'S FILENAME IS SET HERE, not by n8n, because the browser's
   `download` attribute is what names a blob. CODE-BRIEF, 20 Oct: one shape,
   `[Company Name] Comp Plan - <Document>`, brackets literal, the week on the
   tracker and nowhere else.

   THE RESUME IS NOT A DOCUMENT. It is a file beside the page, it opens in a
   tab rather than downloading, and it never goes near the service. Javier,
   27 Oct: clicking it threw him out of the simulator, because Chrome ignores
   `download` on a file:// URL and displays a PDF itself. Opening it is the
   better behaviour anyway: it is the one file on this rail somebody wants to
   READ at the moment they click, and a new tab leaves the simulator behind it.

   THE DECK AND THE AGREEMENT ASK FIRST, the rest do not. The rule, settled
   long before this: the dialog appears when the person downloading has a
   decision to make, and that is true of the two documents that go to the
   people being paid. Opening a finance file or a resume changes nobody's pay.

   `CARDS.warn` returns false when the plan has nothing worth warning about,
   and then the file goes straight down. Until 20 Oct that false was dropped
   on the floor, so on a clean plan the deck button did nothing whatsoever. */
/* THE PROXY, NOT n8n. The page cannot hold a secret, so it does not talk to
   n8n at all: it POSTs to a small proxy that holds n8n's credential, takes the
   twenty answers and five lever keys only by exact match, refuses anything
   else, and forwards. n8n has no public port. Switched 2 Nov, once the proxy
   passed n8n-accept.js from the public URL, 36 documents identical to the
   builders. Until then this pointed at n8n's own /webhook/<id> on localhost;
   which n8n URL the proxy forwards to is now the proxy's business, not the
   page's. */
var WEBHOOK = "https://comp-plan-simulator.duckdns.org/";

var DOCS = {
  "f-contract": {doc:"agreement", ask:"agreement",
                 name:function(){ return "[Company Name] Comp Plan - Agreement.docx"; }},
  "f-deck":     {doc:"deck", ask:"deck",
                 name:function(){ return "[Company Name] Comp Plan - Launch Deck.pptx"; }},
  "f-capacity": {doc:"capacity",
                 name:function(){ return "[Company Name] Comp Plan - Capacity Model.xlsx"; }},
  "f-tracker":  {doc:"tracker",
                 name:function(){ return "[Company Name] Comp Plan - Finance Tracker - " +
                   (ST.week === "closed" ? "closed" : "week " + ST.week) + ".xlsx"; }},
  "f-resume":   {open:true, at:"",
                 name:function(){ return "Javier_J_Hernandez_Resume_2026.pdf"; }}
};

/* A TILE IS AN SVG AND A TEXT NODE. Swapping that node says what is happening
   without a second element to lay out, and the original is kept so putting it
   back is exact rather than retyped. */
var TILE_TEXT = {};
function tileLabel(id, text){
  var node = el(id); if (!node) return;
  var n = node.lastChild;
  while (n && n.nodeType !== 3) n = n.previousSibling;
  if (!n) return;
  if (TILE_TEXT[id] == null) TILE_TEXT[id] = n.nodeValue;
  n.nodeValue = text == null ? TILE_TEXT[id] : "\n        " + text;
}

function saveBlob(blob, name){
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  /* Revoked late on purpose: Chrome has started the download by the time the
     click returns, but has not finished reading the blob. */
  setTimeout(function(){ URL.revokeObjectURL(url); }, 10000);
}

var BUSY = {};
function handOver(id){
  var d = DOCS[id]; if (!d) return;

  if (d.open){
    var r = document.createElement("a");
    r.href = d.at + encodeURIComponent(d.name());
    r.target = "_blank"; r.rel = "noopener";
    document.body.appendChild(r); r.click(); r.remove();
    return;
  }

  /* One build at a time per tile. A second click while the first is in flight
     would race two downloads of the same thing. */
  if (BUSY[id]) return;
  BUSY[id] = true;
  tileLabel(id, "Building");

  fetch(WEBHOOK, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      document: d.doc,
      answers:  answersNow(),
      week:     ST.week,
      levers:   leverOverrides()
    })
  })
  .then(function(res){
    if (!res.ok) throw new Error(res.status + " from the document service");
    return res.blob();
  })
  .then(function(blob){
    saveBlob(blob, d.name());
    tileLabel(id, null);
  })
  .catch(function(err){
    /* LOUD IN THE CONSOLE, QUIET ON THE TILE. The console carries the real
       reason, which is what a failure needs while this is being built. The
       tile says the one thing a visitor can do anything about. */
    if (window.console) console.error("document service:", err);
    tileLabel(id, "Not available");
    setTimeout(function(){ tileLabel(id, null); }, 4000);
  })
  .then(function(){ BUSY[id] = false; });
}
Object.keys(DOCS).forEach(function(id){
  var node = el(id); if (!node) return;
  node.addEventListener("click", function(){
    var d = DOCS[id];
    if (d.ask && CARDS.warn(d.ask, function(){ handOver(id); })) return;
    handOver(id);
  });
});

/* HOW DID I BUILD THIS. A layer over the blurred simulator. The blur is a
   class on the frame and every exit path removes it, which is the one thing
   the tour gets wrong today and the reason it is written as a single close()
   rather than three. */
(function(){
  var layer = el("buildlayer"), frame = el("frame");
  function open(){ layer.hidden = false; frame.classList.add("blurred");
    layer.scrollTop = 0; CARDS.close(); }
  function close(){ layer.hidden = true; frame.classList.remove("blurred"); }
  el("nav-build").addEventListener("click", open);
  el("buildx").addEventListener("click", close);

  /* THE TWO LINKS IN THE CLOSING LINE DID NOTHING. "If any of this is worth a
     conversation, download my resume or find me on LinkedIn" sat on href="#"
     with no handler behind either, so the one sentence on the page that asks
     the reader to act on it was dead. Found 27 Oct, same class as the
     simulator's "Change an answer": a control that looks live and is not.
     Both open a tab rather than navigating, because the reader is standing in
     the build page for a reason and should still be there afterwards. */
  var LEAVE = {
    "bp-resume": "Javier_J_Hernandez_Resume_2026.pdf",
    "bp-li":     "https://www.linkedin.com/in/javierjotah"
  };
  Object.keys(LEAVE).forEach(function(id){
    var node = el(id); if (!node) return;
    node.addEventListener("click", function(e){
      e.preventDefault();
      window.open(LEAVE[id], "_blank", "noopener");
    });
  });
  layer.addEventListener("click", function(e){ if (e.target === layer) close(); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && !layer.hidden) close(); });
  /* One section at a time. Opening a second closes the first, so the card
     never grows past the screen and the closing line stays reachable.
     Javier, 10 Oct. */
  var secs = [].slice.call(layer.querySelectorAll("details"));
  secs.forEach(function(d){
    d.addEventListener("toggle", function(){
      if (!d.open) return;
      secs.forEach(function(o){ if (o !== d) o.open = false; });
    });
  });

  /* The count is measured from the finding sets rather than typed, because the
     copy doc's own note says to re-measure it before the page ships. */
  var n = 0;
  ["AE", "SDR", "CS", "MGR", "CEO"].forEach(function(k){ n += (FIND[k] || []).length; });
  if (n) el("qfcount").textContent = n;
})();

CARDS.mount(cardApi());

/* ---- the two doors, and the bridge the questionnaire calls --------------
   The frame belongs to the simulator, which is why these are wired here and
   not in wizard.js: YOUR COMP PLAN and RETAKE THE QUESTIONNAIRE are buttons on
   the console's own top bar. Both were inert until today.

   RETAKE opens the ANSWERS, not a restart. The tour copy has always promised it
   "brings your 20 answers back, with everything rebuilding around them", and
   starting over lives on that screen as a link top right. Javier, 26 Oct. */
(function(){
  var r = el("nav-retake"), pl = el("nav-plan");
  if (r)  r.addEventListener("click", function(){
    if (window.WIZARD) window.WIZARD.openAnswers(); });
  if (pl) pl.addEventListener("click", function(){
    if (window.WIZARD) window.WIZARD.openPlan(); });
})();

/* What the questionnaire calls on its way in. The answers become the plan and
   everything downstream rebuilds from them: the ledger is re-dealt only when
   one of the seven business answers moved, because that is what seeds it, so
   changing a pay mechanic returns the same people and the same deals paid
   differently. That is not luck, it is the ledger's design, and it is what
   makes going back to change an answer worth doing. */
window.APP = {
  /* A TEST HOOK, and it is here rather than in the sweep because the sweep
     cannot reach ST from outside this closure. `mockup-sweep.js` walks random
     answer sets across every persona and week looking for the shapes nobody
     chose, and it has to do that walk INSIDE one page call or it spends its
     whole runtime on round trips. Driving the real selects and the real week
     lever from the outside was the alternative: the lever uses pointer capture
     and synthetic pointer events do not survive it. So one named hook, used by
     a checker, rather than a checker that pretends to be a mouse. */
  at: function(role, week){
    if (role){ ST.role = role; ST.who = null; ST.pick = null; ST.sel = null; }
    if (week !== undefined && week !== null) ST.week = week;
    render();
  },
  roles: function(){ return roles().map(function(r){ return r[0]; }); },
  fromAnswers: function(ans){
    ANSWERS = ans;
    resetLevers();
    ST.who = null; ST.pick = null; ST.sel = null; ST.onlyX = false;
    render();
  }
};

render();
})();
