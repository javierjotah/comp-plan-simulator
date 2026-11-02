/* GENERATED FILE. DO NOT EDIT.
   Source:      comp-plan-wizard-v3.html
   Fingerprint: de19b55ce77a1e63
   Generated:   2026-10-28 by make-engine.js
   Proven by:   engine-check.js, which fails if this fingerprint no longer
                matches the wizard, and compares both engines preset by preset.
   The three bootstrap lines that touched the page were removed, and the
   substitutions listed below were applied. Nothing else was changed,
   reformatted or retyped.
     - mount point guarded so the module can be imported outside a browser */
var ENGINE_SOURCE_SHA = "de19b55ce77a1e63";

"use strict";


/* ==========================================================================
   LAYER 1: answer keys -> working numbers
   ========================================================================== */
const V = {
  OTE:   {OTE_UNDER_100:90000, OTE_100_140:120000, OTE_140_180:160000, OTE_180_PLUS:200000},
  MIX:   {MIX_70_30:.30, MIX_60_40:.40, MIX_50_50:.50, MIX_40_60:.60},
  QUOTA: {QUOTA_UNDER_400:350000, QUOTA_400_700:600000, QUOTA_700_1200:950000, QUOTA_1200_PLUS:1500000},
  AES:   {AE_1_3:2, AE_4_10:6, AE_11_25:16, AE_26_PLUS:30},
  AES_BAND:{AE_1_3:[1,3], AE_4_10:[4,10], AE_11_25:[11,25], AE_26_PLUS:[26,60]},
  BOOK:  {BOOK_UNDER_2M:1200000, BOOK_2_10M:5000000, BOOK_10_40M:20000000, BOOK_ABOVE_40M:75000000},
  STAGE_RATE:{STAGE_EARLY:.125, STAGE_GROWTH:.10, STAGE_ESTABLISHED:.09, STAGE_MATURE:.08},
  STAGE_BOOK:{STAGE_EARLY:1, STAGE_GROWTH:2, STAGE_ESTABLISHED:4, STAGE_MATURE:8},
  STAGE_LABEL:{STAGE_EARLY:"early stage", STAGE_GROWTH:"growth stage",
               STAGE_ESTABLISHED:"an established company", STAGE_MATURE:"a mature company"},
  SEG_MULT:{SEG_SMB:4, SEG_MM:5, SEG_ENT:6, SEG_MIXED:5},
  SEG_LABEL:{SEG_SMB:"SMB", SEG_MM:"mid-market", SEG_ENT:"enterprise", SEG_MIXED:"mixed"},
  PERIOD:{SEG_SMB:"Monthly", SEG_MM:"Quarterly", SEG_ENT:"Annual, quarterly checkpoints", SEG_MIXED:"Quarterly"},
  SEG_ACV:{SEG_SMB:10000, SEG_MM:45000, SEG_ENT:150000, SEG_MIXED:45000},
  WIN:{SEG_SMB:.30, SEG_MM:.25, SEG_ENT:.20, SEG_MIXED:.25},
  SDR_CAP:{SEG_SMB:200, SEG_MM:160, SEG_ENT:80, SEG_MIXED:140},
  SDR_SHARE:{ARCH_SUBSCRIPTION:.60, ARCH_PLG:.30, ARCH_USAGE:.50, ARCH_SERVICES:.50, ARCH_CHANNEL:.30},
  BOOK_PER_CSM:{SEG_SMB:2500000, SEG_MM:1500000, SEG_ENT:1000000, SEG_MIXED:1500000},
  /* "from" is where the first accelerator starts, and it is quota on every
     answer. It exists as a named member rather than as an implied att<=1 because
     the capacity model needs a cell for it: Javier, 28 Sep, asked what happens
     if a company wants the first tier at 105%, and the answer was that the
     engine could not say. It still cannot, since no answer moves it, but the
     workbook can now be asked the question and the engine says out loud what it
     had only been implying. */
  ACCEL: {ACCEL_NONE:{t1:1,t2:null,at:null,from:null},
          ACCEL_MODERATE:{t1:1.5,t2:null,at:null,from:1},
          ACCEL_AGGRESSIVE:{t1:2,t2:2.5,at:1.2,from:1}},
  DECEL: {DECEL_NONE:{thr:null,mult:1}, DECEL_REDUCED:{thr:.70,mult:.60}, DECEL_CLIFF:{thr:.50,mult:0}},
  EXP:   {EXP_NONE:0, EXP_LOWER:.4, EXP_EQUAL:1, EXP_HIGHER:1.3},
  GM:    {GM_UNDER_60:.55, GM_60_75:.68, GM_75_85:.80, GM_ABOVE_85:.88}
};
// Javier's line. Sits below the findings on the plan view and on the one-pager,
// identically. Not a finding and never coloured: it would fire on every plan and
// a fourth thing the colours mean would dilute the three that matter.
const HONESTY = "Built from your answers and industry benchmarks. Every real plan still needs two "+
  "things a simulator cannot supply: your own historical numbers, and feedback from the people who "+
  "will be paid on it.";
/* A MARGIN PLAN GETS ONE MORE SENTENCE, AND ONLY A MARGIN PLAN DOES. This note's whole job
   is naming what a simulator cannot supply, and on a plan paid on margin the thing it cannot
   supply is a discount. Nothing in the ledger is negotiated: a deal carries an ACV and the
   company carries one gross margin, so every rep's credited margin is identical to their
   bookings and the spread this mechanic exists to create never appears. Said here rather
   than left for somebody to work out, because the alternative was a plan page claiming the
   engine calculates on margin while the contract said contract value and the tracker accrued
   on revenue: three documents, one plan, three answers.
   Silent on a flat or product-tier plan, where a discount does not touch the payout, and a
   disclosure that fires where it changes nothing is noise. Javier, 2 Oct. */
const NO_DISCOUNT = " No deal here is discounted. Every one closes at book value at the margin "+
  "you entered, because there is no customer on the other side to negotiate with, so the gap a "+
  "margin plan opens between a rep who holds price and one who does not will not appear in "+
  "these numbers.";
const honestyFor  = p => HONESTY + (p.r.MODEL==="MODEL_MARGIN" ? NO_DISCOUNT : "");
const honestyHTML = p => '<p class="honesty">'+honestyFor(p)+'</p>';
const SDR_FLOOR=60000, CS_FLOOR=65000, MGR_SPAN=8, SDR_MGR_MIN=5, CS_MGR_MIN=5;
/* The floor a manager's team component pays nothing below. 70% of quota is a
   bad AE quarter rather than a catastrophe, which is the number this was written
   for. It is the wrong bar for CS: 70% of a renewal book means losing three
   accounts in ten, and it sat far below the range CS teams actually occupy, so
   the component paid on every screen whatever happened. A CS manager reads
   RET_FLOOR instead, the same 88% each of their CSMs carries, which is the same
   correction that put expansion on their plan and made "at target" mean a CSM
   who hit their whole number. No tie risk: the closest CS team to it is #miss at
   89.5%. */
const MGR_TEAM_FLOOR=.70;   // AE and SDR: team attainment pays nothing below this
/* `p` optional, like retentionPay: a CS manager's team floor IS the retention
   gate, so a pulled retention lever has to move it too or the manager's floor
   and their CSMs' gate stop being the same number, which is the one thing
   this function exists to guarantee. 20 Oct. */
const mgrTeamFloor = (manages, p) => manages==="CS"
  ? (p && p.retFloor != null ? p.retFloor : RET_FLOOR)
  : MGR_TEAM_FLOOR;
// Headcounts read as words in prose, digits in tables. "A team of 8" in a
// sentence reads like a spreadsheet leaked into the copy.
const wordN = n => ["zero","one","two","three","four","five","six","seven","eight","nine","ten"][n]
  || String(n);
const MEETING_TO_PIPE=.65, EARLY_MEETING_CAP=180, PARTICIPATION_TARGET=.60;
const RET_FLOOR=.88, RET_FULL=.95;
/* Nothing below the gate, then a straight ramp to the full component at the
   target, and on to 120% above it. This is the ONE definition: the plan page,
   the CEO accrual and the findings all read it.

   THE LINES COME OFF THE PLAN WHEN THE PLAN CARRIES THEM. `p.retFloor` and
   `p.retFull` are plan fields as of 20 Oct, set from these same constants, so
   at baseline nothing moves. A plan with the retention lever pulled carries
   moved lines and pays against them, and so does every document generated
   from that plan, because they all read the plan they were handed rather than
   a constant they cannot be told about. `p` is optional and omitting it keeps
   the constants, which is what every pre-20-Oct caller does. */
function retentionPay(ret, componentValue, p){
  const lo = p && p.retFloor != null ? p.retFloor : RET_FLOOR;
  const hi = p && p.retFull  != null ? p.retFull  : RET_FULL;
  if (ret===null || ret===undefined || ret < lo) return 0;
  return Math.min(1.2, (ret-lo)/(hi-lo)) * componentValue;
}
/* Reps at quota. All or nothing at the target, then it scales above it. Paying a
   fraction below the target means paying for one rep in five, and a floor to
   stop that is a second number nobody asked for. Same arrangement as
   retentionPay: this is the ONE definition, read by the plan page's scenario
   table and by the manager findings. They used to hold two: the scenario table
   paid proportionally all the way down, its own 70% row showing 40% of reps at
   quota drawing two thirds of the component, while the findings paid nothing. */
/* `p.partTarget` as of 20 Oct, same arrangement as retentionPay above and as
   teamAttainPay's `floor` below: the bar is the plan's when the plan has one. */
function participationPay(part, componentValue, p){
  const bar = p && p.partTarget != null ? p.partTarget : PARTICIPATION_TARGET;
  if (part===null || part===undefined || part < bar) return 0;
  return (part/bar) * componentValue;
}
/* Team attainment, the manager's other component. Nothing below the floor, then
   the same shape a rep's own quota has: linear to 100% and the plan's
   accelerator above it. The findings paid this one proportionally from zero and
   capped it at 130%, so a manager whose team sat at 9% in week 1 was shown $937
   of money their plan says is worth nothing until 70%, and a manager past 100%
   was denied an accelerator the plan gives them. Third of these, so it lives
   here with retentionPay and participationPay and is read by both sides. */
function teamAttainPay(p, attain, componentValue, floor){
  const bar = floor===undefined ? MGR_TEAM_FLOOR : floor;
  if (attain===null || attain===undefined || attain < bar) return 0;
  return roleEarn(p, componentValue, attain);
}
/* WHAT AN SDR ACTUALLY EARNS, COMPONENT BY COMPONENT.

   The plan gives an SDR up to three, weighted by segment: accepted
   opportunities by count, pipeline created by value, and deals won from their
   pipeline. The plan page prices all three and the Schedule prints all three.
   The simulator paid the WHOLE variable off the count, so on an enterprise plan
   40% of an SDR's variable rode on pipeline value and was never computed, and on
   a mid-market plan 30% rode on deals won and was never computed. An SDR could
   hit their count, source nothing that closed, and be paid in full.

   `#mixed` is the live case in the mock-up, 60 count and 40 value. The 70/30 and
   50/30/20 splits are reachable only by answering the questionnaire, which is
   why this never showed on a preset. Javier, 14 Oct.

   Each component is read against its own denominator, the same ones the plan
   page divides by to print its per-unit rates, so the money here and the rate
   there cannot disagree: the count against the quarter's unit target, the value
   against that target times ACV, and wins against that target times the win
   rate. Each takes the accelerator on its own, the way a rep's does. */
/* THE MANAGER'S THIRD COMPONENT, which until 14 Oct nothing in the app priced.
   A CS manager has 20% of their variable on the expansion their team lands and
   an SDR manager the same on what the pipeline their team created is worth. The
   plan page declares both, the contract prints both and the capacity model pays
   both; the engine produced no manager earnings figure at all and the mock-up's
   manager card ignored the weight outright, so a CS manager's hover read "Paid
   $5,792, all of it on the team's number" while a fifth of her plan sat
   uncounted. Javier, 14 Oct.

   It pays LINEARLY, no floor and no accelerator, the same shape as a CSM's own
   expansion component and the same shape the capacity model already generates:
   the pool times the weight times what the team landed against the team's
   target. Where the plan sets no such target the weight is not paid at all, it
   folds back into team attainment, which is `mgrFold` below and the rule the
   plan page has always stated. */
function mgrThirdPay(p, team, componentValue){
  const kind = team.manages || "AE", mem = team.members || [];
  if (!componentValue) return 0;
  const sum = (f) => mem.reduce((a, x) => a + (f(x) || 0), 0);
  let got = 0, want = 0;
  if (kind === "CS"){ got = sum(x => x.expWon); want = sum(x => x.expTarget); }
  else if (kind === "SDR"){
    got  = sum(x => x.createdValue);
    want = sum(x => x.target) * (p.acv || 0);
  }
  return want ? componentValue * (got / want) : 0;
}
/* Whether that third component exists on this plan at all. The weight is in
   mgrWeights whatever the plan says, so every reader has to ask this before
   paying it, and the two that did not were the two that were wrong. */
function mgrThirdLive(p, manages){
  return manages === "CS"  ? (p.csExpTarget || 0) > 0
       : manages === "SDR" ? !!(p.sdrWeights && p.sdrWeights.value) : false;
}
/* mgrWeights with that fold already applied, so nobody applies it twice and
   nobody forgets. */
function mgrFold(p, size, manages){
  const w = Object.assign({}, mgrWeights(size, manages));
  if (w.exp > 0 && !mgrThirdLive(p, manages)){ w.team += w.exp; w.exp = 0; }
  return w;
}
/* WHAT A MANAGER ACTUALLY EARNS THIS QUARTER, COMPONENT BY COMPONENT.

   This composition lived in the mock-up's mgrFacts() and nowhere else, which is
   why the company's cost figures could not read it: quarterState had no way to
   ask what a manager earned, so it carried a quarter of their TARGET variable
   prorated by the week instead. Move the reps-at-quota lever and both managers'
   tiles changed while WHAT IT COST and COMP vs GROSS PROFIT sat still, because
   the only number the company had was a target. Javier, 21 Oct.

   Four components, each already defined once above: team attainment through its
   floor, participation through its gate, the third component where the plan has
   one, and the manager's own bag where they carry one. `own` is NOT added into
   the company's sales variable by its caller, because a selling manager's deals
   are dealt through the AE row builder and their commission is already inside
   commSpend.

   Everything here reads `p` and the team, never a constant and never a lever, so
   a levered plan moves every component that depends on it. */
function mgrPay(p, t){
  const kind = t.manages || "AE", mem = t.members || [], n = mem.length;
  const ote = kind === "SDR" ? p.sdrMgrOte : kind === "CS" ? p.csMgrOte : p.salesMgrOte;
  const qv  = (ote || 0) * (p.mgrVarPct || 0) / 4;
  const w   = mgrFold(p, t.size || n, kind);
  const pay = {team: qv*(w.team||0), part: qv*(w.part||0),
               exp:  qv*(w.exp ||0), own:  qv*(w.personal||0)};
  pay.teamPaid = teamAttainPay(p, t.attain || 0, pay.team, mgrTeamFloor(kind, p)) || 0;
  pay.partPaid = participationPay(t.participation || 0, pay.part, p) || 0;
  pay.expPaid  = mgrThirdPay(p, t, pay.exp) || 0;
  /* A SELLING MANAGER CARRIES A BAG, and on a small team it is the biggest
     single piece of their pay. `mgrWeights` hands a manager of three or fewer
     40% on a quota of their own, and their deals are deliberately kept out of
     the team's number, so without this the screen showed a team figure that
     excluded them and said nothing at all about the rest. On #small that is
     40% of Tessa Bhatt's variable riding on $121,000 of her own closed
     business, with a tile beside it offering her a participation gate her plan
     does not contain. Javier caught it, 14 Oct. */
  /* The engine deals the seller their own rep row now, built by the same
     builder every AE gets, so the tile, the component and the findings all read
     one record rather than three reconstructions of it. */
  const sr = t.seller || null;
  pay.ownClosed = sr ? (sr.closed || 0) : 0;
  pay.ownQuota  = sr ? (sr.quota  || 0) : (p.qQuota || 0);
  pay.ownAttain = sr ? (sr.attain || 0) : 0;
  pay.ownPaid   = pay.own ? roleEarn(p, pay.own, pay.ownAttain) : 0;
  pay.total     = pay.teamPaid + pay.partPaid + pay.expPaid + pay.ownPaid;
  pay.target    = qv;
  pay.base      = ((ote || 0) - (ote || 0) * (p.mgrVarPct || 0)) / 4;
  return pay;
}
/* WHAT A CSM ACTUALLY EARNS THIS QUARTER. Same reason as mgrPay: the company's
   cost figures had no CS accrual beyond the retention half, so a whole-company
   cost ratio could not be built from actuals at all. The expansion half pays
   linearly against the quarter's target, which is the shape the CSM's own card,
   the capacity model and mgrThirdPay all use. */
function csPay(p, x){
  const ret = retentionPay(x.retention, (p.csVariable||0)*(p.csRetWeight||0)/4, p);
  const expFull = (p.csVariable||0)*(p.csExpWeight||0)/4;
  const exp = (expFull && x.expTarget) ? expFull * ((x.expWon||0)/x.expTarget) : 0;
  return ret + exp;
}
function sdrEarn(p, rep){
  const w = p.sdrWeights || {}, qv = (p.sdrVariable||0)/4, t = rep.target||0;
  if (!t) return 0;
  const on = (share, got, per) => {
    if (!share || !per) return 0;
    return roleEarn(p, qv*share, (got||0)/per);
  };
  return on(w.count, rep.created, t) +
         on(w.value, rep.createdValue, t*p.acv) +
         on(w.won,   rep.attWon,      t*p.winRate);
}
/* WHAT "AT TARGET" MEANS FOR ONE PERSON, FOR THE WHOLE SYSTEM.

   A manager's participation component pays on the share of their team who hit
   their own number, and "their own number" means every measure their plan pays
   them on, not just the first one. A CSM on a 60/40 retention and expansion plan
   who kept the book and landed nothing is not at target. An SDR paid partly on
   pipeline value who hit the count and missed the value is not at target either.
   Where a measure cannot be hit because the plan does not set it, it is dropped
   rather than failed: a plan with no CS expansion target must not hold every CSM
   short of a bar that pays nothing.

   This was three rules in three places. The engine had this one. The capacity
   model applied the expansion condition on every plan, so on a plan paying no CS
   expansion it held CSMs short of a bar that paid nobody anything. The finance
   tracker applied it on no plan, so on #full it paid the CS manager $6,431 of
   participation in week 8 and $4,594 at close that this rule says is zero. And
   tracker-check.js agreed with the tracker because I had written both from the
   same assumption, which is why 919 checked figures caught none of it.

   One definition now. The two spreadsheet builders generate the formula from the
   same two gates this reads (expTarget and sdrWeights.value), and the checkers
   call this function rather than carrying a fourth copy. Javier, 1 Oct: he is
   fine with CS manager participation reading zero on #full, because a plan that
   cannot clear its own bar should say so. */
function atTargetTest(p, manages){
  /* SECURED, NOT RESOLVED. `retention` is held / (held + churned), so it
     ignores the book still to come up: a CSM who has renewed everything that
     has happened so far reads 100% in week 4 and counted as at target on any
     plan without an expansion half. On `#miss` that passed four of eight at
     week 6. An AE is not at quota for pacing toward quota, and Javier, 19 Oct,
     asked for the same rule here. `retWithout` is held / book, which climbs as
     renewals land and equals `retention` once the book has resolved, so the
     close is unchanged and only the mid-quarter projection moves. */
  if (manages === "CS"){
    /* The plan's target, not the constant, so a pulled retention lever moves
       who counts as at target as well as what they are paid. */
    const full = p && p.retFull != null ? p.retFull : RET_FULL;
    return x => (x.retWithout != null ? x.retWithout : (x.retention||0)) >= full &&
                (x.expTarget > 0 ? (x.expWon||0) >= x.expTarget : true);
  }
  /* WINS COUNT TOO, decided 14 Oct. The won component was the one measure a
     plan pays an SDR on that this test ignored, so on a 70/30 plan someone who
     hit their count and sourced nothing that closed read as at target and paid
     their manager participation on it. The argument for leaving it out was that
     closing is the AE's job and lands next quarter anyway; what beat it is the
     denominator. The won target is not independent, it is the count target
     times the company win rate, so an SDR who hits their count and converts at
     the ordinary rate clears it. Missing it means their pipeline converted
     below the company average, which is a fact about what they created. */
  if (manages === "SDR") {
    const live = !!(p.sdrWeights && p.sdrWeights.value);
    const won  = !!(p.sdrWeights && p.sdrWeights.won);
    return x => (x.attain||0) >= 1 &&
                (live ? (x.createdValue||0) >= (x.target||0)*p.acv : true) &&
                (won  ? (x.attWon||0)      >= (x.target||0)*p.winRate : true);
  }
  return x => (x.attain||0) >= 1;
}
// Share of created opportunities an AE rejects. Not zero: a plan that assumes
// every created opportunity is accepted has no acceptance conversation in it,
// and acceptance is the one quality check an SDR plan actually contains.
const SDR_REJECT=.08;

const money  = n => "$" + Math.round(n).toLocaleString("en-US");
/* Under $500 the K form printed "$0K", which reads as a unit with nothing in
   it, and for $300 it was simply wrong. Those print in whole dollars. */
const moneyK = n => n>=1e6 ? "$"+(n/1e6).toFixed(n%1e6===0?0:2)+"M"
  : Math.abs(n) < 500 ? money(n) : "$"+Math.round(n/1000)+"K";
const pct    = n => (n*100).toFixed(1).replace(/\.0$/,"")+"%";
const pct0   = n => Math.round(n*100)+"%";

/* "standard for a enterprise AE", "at a 88% margin", "a SMB motion". The plan
   page writes `a ${...}` in about twenty places and the interpolated value
   decides the article, so the article has to be computed from what actually
   prints. Found 24 Sep by auditing plan-card copy, 66 card instances across the
   answer space.

   It reads the rendered string, not the value, so it works the same for a
   segment name, a percentage, a dollar figure and a deal count:
     $8M, $11K, 8%, 88%, 18 deals   an   (eight, eleven, eighteen)
     $1M, $20M, 100%, 4x            a
     SMB, MM, SDR, ENT, F           an   (ess, em, ess, ee, ef)
     enterprise, hour               an
     mid-market, one                a                                        */
const AN_LETTER = /^[AEFHILMNORSX]$/;      // letters whose NAME starts with a vowel
const article = v => {
  const t = String(v).trim().replace(/^[$£€]/, "");
  const lead = t.match(/^\d+/);
  if (lead){
    const n = lead[0];
    // Said aloud: 8, 11, 18, and anything opening 8 or 18 in the hundreds and
    // above ("eighteen hundred"). Everything else takes "a".
    return /^(8|11|18)(\d*)$/.test(n) && /^(8|11|18)/.test(n) ? "an" : "a";
  }
  if (/^[A-Z]{2,}\b/.test(t)) return AN_LETTER.test(t[0]) ? "an" : "a";
  if (/^(hour|honest|honou?r)/i.test(t)) return "an";
  // Vowel letters that open with a consonant sound: one, unit, user, euro.
  if (/^(one|once|uni|use|usu|euro|ewe)/i.test(t)) return "a";
  return /^[aeiou]/i.test(t) ? "an" : "a";
};
/* Keeps the original signature, article plus the word, which is what the two
   existing call sites expect. */
const an = v => article(v) + " " + v;
const An = v => { const a = article(v); return a[0].toUpperCase() + a.slice(1); };
const num    = n => Math.round(n).toLocaleString("en-US");

const AUTO   = "__AUTO__";

/* ==========================================================================
   CATEGORIES
   ========================================================================== */
const CATS = [
{n:1, name:"Your business",
 title:"First, tell us about your business.",
 body:["Comp plans aren't one size fits all. What you sell, who buys it, and who does the selling change almost every number that follows.",
       "Four quick questions and we're off. Don't worry, there are no wrong answers here!"]},
{n:2, name:"The money",
 title:"Now the money.",
 body:["What your people earn, how much of it is at risk, and how big a number they have to hit.",
       "Don't worry if you're not sure of the exact figures. A ballpark is fine, and we'll tell you right away if something doesn't add up."]},
{n:3, name:"How commission works",
 title:"How commission actually works.",
 body:["You've set the targets. Now let's decide what happens when someone beats them, and what happens when they don't.",
       "This is the part your reps will actually read. Halfway there!"]},
{n:4, name:"The edges",
 title:"The parts that break plans.",
 body:["Expansion revenue, customers who churn early, new hires who can't hit a full number yet.",
       "Every plan has edges, and getting them wrong is how a good plan quietly fails. Almost done!"]},
{n:5, name:"Governance", skippable:true,
 title:"Last one! The bits everyone skips.",
 body:["What your margin can carry, what happens when somebody leaves, and who gets paid when two reps work the same deal.",
       "Most plans skip the last two, which is exactly why those are the ones that end in arguments. Answer them and you'll have covered what most comp plans never do. If you'd rather not, we've got you: skip ahead and we'll apply standard terms."]}
];

/* ==========================================================================
   QUESTIONS
   ========================================================================== */
const Q = [
/* ---- Category 1 ---- */
{id:"ARCH", c:1, t:"How does your company package and price what it sells?",
 w:"Pricing model shapes comp far more than industry does. This picks the base plan everything else adjusts from.",
 o:[["ARCH_SUBSCRIPTION","Subscription software, sold by a sales team"],
    ["ARCH_PLG","Product-led","Users start self-serve, sales assists on upgrade and expansion"],
    ["ARCH_USAGE","Usage-based or consumption pricing"],
    ["ARCH_SERVICES","Software plus meaningful services or implementation fees"],
    ["ARCH_CHANNEL","Sold mainly through partners, resellers or a marketplace"]],
 d:()=>"ARCH_SUBSCRIPTION"},

{id:"SEG", c:1, t:"What does a typical deal look like?",
 w:"Deal size and cycle length set your quota, your pay mix and how long a new hire gets to ramp. It is the most load-bearing answer here.",
 o:[["SEG_SMB","SMB","Under $15K a year, closes in under 30 days"],
    ["SEG_MM","Mid-market","$15K to $75K a year, one to three months"],
    ["SEG_ENT","Enterprise","Above $75K a year, three to nine months"],
    ["SEG_MIXED","Mixed","Reps carry a blend with no dominant profile"]],
 d:()=>"SEG_MM"},

{id:"TEAM", c:1, t:"Which revenue roles will be on a variable compensation plan?",
 w:"Each role earns its money a different way. AEs on closed revenue, SDRs on the meetings and pipeline they create, CS on customers kept. This decides how many separate plans we build for you.",
 o:[["TEAM_AE","Account Executives only"],
    ["TEAM_AE_MGR","Account Executives and a management layer"],
    ["TEAM_AE_SDR_MGR","Account Executives, SDRs, and a management layer"],
    ["TEAM_AE_CS_MGR","Account Executives, CS, and a management layer"],
    ["TEAM_FULL","Full team","AEs, SDRs, CS, and managers"]],
 d:()=>"TEAM_AE_MGR"},

{id:"AES", c:1, t:"How many quota-carrying Account Executives are on the team today?",
 w:"Drives total quota, what the plan costs to fund, and how many reps appear in your live quarter simulator.",
 o:[["AE_1_3","1 to 3"],["AE_4_10","4 to 10"],["AE_11_25","11 to 25"],["AE_26_PLUS","26 or more"]],
 d:()=>"AE_4_10"},

/* ---- Category 2 ---- */
{id:"STAGE", c:2, t:"How mature is your company?",
 w:"Stage decides how generously you have to pay. Early companies pay more because they are asking people to take a real risk.",
 o:[["STAGE_EARLY","Early stage","Under 3 years selling, still finding a repeatable motion"],
    ["STAGE_GROWTH","Growth stage","3 to 7 years, repeatable motion, scaling headcount"],
    ["STAGE_ESTABLISHED","Established","7 to 15 years, predictable revenue"],
    ["STAGE_MATURE","Mature","15 years or more, efficiency over growth rate"]],
 d:()=>"STAGE_GROWTH"},

{id:"OTE", c:2, t:"What are your typical Account Executive's on-target earnings?",
 w:"Total cash if a rep hits exactly 100%. Every other number in the plan is built off this one.",
 o:[["OTE_UNDER_100","Under $100K"],["OTE_100_140","$100K to $140K"],
    ["OTE_140_180","$140K to $180K"],["OTE_180_PLUS","$180K or more"]],
 d:a=>({SEG_SMB:"OTE_UNDER_100",SEG_MM:"OTE_100_140",SEG_ENT:"OTE_140_180",SEG_MIXED:"OTE_100_140"})[a.SEG]},

{id:"MIX", c:2, t:"How should your base salary and commission split at target?",
 w:"How much of a rep's income depends on performance. The more directly a role controls revenue, the more variable it should carry.",
 o:[["MIX_70_30","70 / 30","Mostly base, commission is a modest upside"],
    ["MIX_60_40","60 / 40","Base-weighted, still meaningful variable"],
    ["MIX_50_50","50 / 50","Half base, half commission at target"],
    ["MIX_40_60","40 / 60","Variable-weighted, higher risk and higher reward"]],
 d:a=>a.SEG==="SEG_SMB"?"MIX_60_40":"MIX_50_50"},

{id:"QUOTA", c:2, t:"What annual quota does each of your Account Executives carry?",
 w:"Quota normally runs 4x to 6x OTE. Too low and the rep does not pay for themselves. Too high and nobody hits it, which is worse.",
 o:[["QUOTA_UNDER_400","Under $400K"],["QUOTA_400_700","$400K to $700K"],
    ["QUOTA_700_1200","$700K to $1.2M"],["QUOTA_1200_PLUS","Above $1.2M"]],
 d:a=>{const t=V.OTE[a.OTE]*V.SEG_MULT[a.SEG];
   return t<400000?"QUOTA_UNDER_400":t<700000?"QUOTA_400_700":t<1200000?"QUOTA_700_1200":"QUOTA_1200_PLUS";}},

{id:"BOOK", c:2, t:"How big is your existing customer base?",
 w:"Everything your CS team does happens inside this number. It sets how many CSMs you need, how much book each one carries, and how much growth they have to find.",
 o:[["BOOK_UNDER_2M","Under $2M","In annual recurring revenue"],
    ["BOOK_2_10M","$2M to $10M"],
    ["BOOK_10_40M","$10M to $40M"],
    ["BOOK_ABOVE_40M","Above $40M"]],
 d:a=>{const est=V.QUOTA[a.QUOTA]*V.AES[a.AES]*V.STAGE_BOOK[a.STAGE];
   return est<2e6?"BOOK_UNDER_2M":est<1e7?"BOOK_2_10M":est<4e7?"BOOK_10_40M":"BOOK_ABOVE_40M";}},

/* ---- Category 3 ---- */
{id:"OBJ", c:3, t:"What is your primary corporate objective for this plan?",
 w:"This is the whole point of a comp plan: paying for exactly what you want. It decides where weight goes later.",
 o:[["OBJ_NEWLOGO","Net-new logo acquisition"],
    ["OBJ_NRR","Retention and expansion of your existing customers"],
    ["OBJ_BALANCED","Balanced between winning new and growing existing"],
    ["OBJ_MARGIN","Profitable growth","Margin discipline matters more than top line"]],
 d:a=>["TEAM_AE_CS_MGR","TEAM_FULL"].includes(a.TEAM)?"OBJ_BALANCED":"OBJ_NEWLOGO"},

{id:"MODEL", c:3, t:"How should your commission rate be structured?",
 w:"Flat is simple. Tiered rewards overperformance. Margin-based protects profit. Choose the one that fits the objective you just set.",
 o:[["MODEL_FLAT","Flat","One rate on everything, whatever the attainment"],
    ["MODEL_TIERED","Tiered","The rate rises as attainment rises"],
    ["MODEL_DEAL_SIZE","By product","Strategic products pay a higher rate than the rest"],
    ["MODEL_MARGIN","On gross margin rather than revenue"]],
 d:()=>"MODEL_TIERED"},

{id:"ACCEL", c:3, t:"What happens when your reps go past target?",
 w:"Without an accelerator, a rep who hits quota in week ten has no reason to close anything else. They push deals into next quarter instead.",
 o:[["ACCEL_NONE","Nothing","The same rate continues above 100%"],
    ["ACCEL_MODERATE","Moderate","Roughly 1.5x the base rate above 100%"],
    ["ACCEL_AGGRESSIVE","Aggressive","Roughly 2x above 100%, stepping up again past 120%"]],
 d:()=>"ACCEL_MODERATE"},

{id:"DECEL", c:3, t:"What happens when your reps fall short of target?",
 w:"Decides whether sustained underperformance costs the rep anything before it costs the company a headcount.",
 o:[["DECEL_NONE","Nothing","The same rate all the way down"],
    ["DECEL_REDUCED","Reduced rate","Below a threshold, typically 70% attainment"],
    ["DECEL_CLIFF","Cliff","No commission at all until a minimum is cleared, typically 50%"]],
 d:()=>"DECEL_REDUCED"},

/* ---- Category 4 ---- */
{id:"EXP", c:4, t:"How should your expansion and upsell revenue be paid against new business?",
 w:"Expansion is cheaper to sell than new business, so paying it the same quietly tells your reps to stop hunting. Who owns it, AEs or CS, matters as much as the rate.",
 o:[["EXP_NONE","Not paid to AEs at all","Expansion belongs to Customer Success"],
    ["EXP_LOWER","Less than new business","Typically 3% to 5% against 10%"],
    ["EXP_EQUAL","The same as new business"],
    ["EXP_HIGHER","More than new business","To push land and expand"]],
 d:a=>({OBJ_NEWLOGO:"EXP_LOWER",OBJ_NRR:"EXP_HIGHER",OBJ_BALANCED:"EXP_EQUAL",OBJ_MARGIN:"EXP_EQUAL"})[a.OBJ]},

{id:"CLAW", c:4, t:"What happens when a customer your rep closed churns early?",
 w:"Protects you from reps closing bad-fit deals. Set the window too long and reps stop trusting the plan.",
 o:[["CLAW_NONE","Nothing","Commission is earned at close and stays earned"],
    ["CLAW_90","Clawback within 90 days"],
    ["CLAW_180","Clawback within 180 days"],
    ["CLAW_HOLDBACK","Holdback","80% at close, the last 20% once the customer sticks"]],
 d:()=>"CLAW_90"},

{id:"RAMP", c:4, t:"How do your new hires get treated while they ramp?",
 w:"Nobody hits a full number in month one. Ramp decides whether a new rep can afford to stay long enough to try.",
 o:[["RAMP_NONE","No ramp","Full quota from day one"],
    ["RAMP_3MO","Reduced quota for 3 months"],
    ["RAMP_6MO","Reduced quota for 6 months"],
    ["RAMP_DRAW","Reduced quota plus a non-recoverable draw"]],
 d:a=>a.SEG==="SEG_ENT"?"RAMP_6MO":"RAMP_3MO"},

{id:"INC", c:4, t:"Do you want extra incentives on top of the core plan?",
 w:"Useful for short-term pushes. Dangerous when they pile up and bury the plan underneath them.",
 o:[["INC_NONE","No","Keep the plan simple"],
    ["INC_TEAM","A team kicker","When the whole team hits its number"],
    ["INC_SPIFF","Short-term SPIFFs","For specific pushes"],
    ["INC_BOTH","Both"]],
 d:()=>"INC_TEAM"},

/* ---- Category 5 ---- */
{id:"GM", c:5, t:"What is your gross margin on the revenue these reps sell?",
 w:"Commission is a cost of revenue. Without margin we can tell you what the plan costs, but not whether you can afford it.",
 o:[["GM_UNDER_60","Under 60%","Services-heavy or infrastructure-heavy"],
    ["GM_60_75","60% to 75%","SaaS with meaningful support or hosting cost"],
    ["GM_75_85","75% to 85%","Standard B2B SaaS"],
    ["GM_ABOVE_85","Above 85%","Low-touch and highly efficient"]],
 d:a=>a.ARCH==="ARCH_SERVICES"?"GM_UNDER_60":"GM_75_85"},

{id:"TERM", c:5, t:"What happens to commission when a rep leaves?",
 w:"The real difference is what happens to commission they have already earned but not been paid yet. Whichever you pick has to be in the contract before anyone resigns, not after.",
 o:[["TERM_CLOSED_ONLY","Paid out on everything they closed","Including commission still owed on their last day, nothing after"],
    ["TERM_IN_FLIGHT","Also paid on deals already in contract","Even where those close after they have gone"],
    ["TERM_FORFEIT","Any commission not yet paid on their last day is forfeited"]],
 d:()=>"TERM_CLOSED_ONLY"},

{id:"CREDIT", c:5, t:"When two people work the same deal, who gets credit?",
 w:"Split credit is where comp plans actually break. Deciding now is cheaper than deciding during a dispute.",
 o:[["CREDIT_SINGLE","One owner","Whoever holds the opportunity gets 100%"],
    ["CREDIT_SPLIT","Split between them","Agreed deal by deal"],
    ["CREDIT_DOUBLE","Both paid in full","The company double-credits to keep collaboration clean"]],
 d:()=>"CREDIT_SINGLE"}
];


const catQs = n => Q.filter(q=>q.c===n);

/* ==========================================================================
   ENGINE
   ========================================================================== */
function resolve(a){
  const o={};
  Q.forEach(q=>{ o[q.id] = (a[q.id] && a[q.id]!==AUTO) ? a[q.id] : q.d(o); });
  return o;
}

function commAt(p,f){
  const rev = p.quota*f;
  /* A flat model with an accelerator or a decelerator is a contradiction, and
     the plan page flags it as one. This used to settle it by paying flat, so the
     engine ignored the rule the plan named while every finding described it:
     on #messy a rep under the 50% line was told "this plan pays no commission
     at all" and was paid the full rate, and on #early 80 AE screens described a
     reduced rate nobody was paid at. The named rule wins now, the way a
     specific clause governs a general label in a contract. With neither an
     accelerator nor a decelerator the two branches below reduce to one rate,
     which is what flat means. p.flat still drives the plan-page flag. */
  if (p.decel.thr!==null && f < p.decel.thr) return rev*p.rate*p.decel.mult;
  if (f<=1) return rev*p.rate;
  let c = p.quota*p.rate;
  const A = p.accel;
  if (A.at && f>A.at){
    c += p.quota*(A.at-1)*p.rate*A.t1;
    c += p.quota*(f-A.at)*p.rate*A.t2;
  } else {
    c += p.quota*(f-1)*p.rate*A.t1;
  }
  return c;
}

// Variable earned by a supporting role at a given attainment, using the same
// accelerator the AEs get so the plans behave like one system.
function roleEarn(p, variable, f){
  if (f<=1) return variable*f;
  return variable + variable*(f-1)*p.accel.t1;
}

// Manager component weights by the size of the team they run
/* A CS MANAGER CARRIES EXPANSION TOO. Their CSMs are paid 60 retention / 40
   expansion, and the manager had nothing on expansion at all: not a component,
   and not even inside "CSMs at target", which counted retention alone and so
   ignored 40% of what each CSM is paid on. A manager with no line on the thing
   their team is half-paid for cannot coach it and has no reason to.
   Expansion takes 20 points out of the retention component rather than out of
   participation. It is about 12% of the dollars a CS team is responsible for,
   $720K of expansion target against a $5.38M renewal book on #full, so 20% of
   variable is a deliberate overweight: protecting the book is the bigger number
   and growing it is the harder job, and a plan signals which one is strategic by
   paying it above its share. Participation is untouched because it answers a
   different question, whether the number came from the team or from two people. */
const MGR_EXP_WEIGHT = .20;
function mgrWeights(n, manages){
  const w = n<=3  ? {personal:.40, team:.60, part:0}
          : n<=10 ? {personal:0, team:.65, part:.35}
          : n<=25 ? {personal:0, team:.75, part:.25}
          :         {personal:0, team:.80, part:.20};
  /* An SDR manager carries the same shape for the same reason. On an enterprise
     plan their SDRs are paid 60% on the count of accepted opportunities and 40%
     on what that pipeline is worth, and the manager was measured on the count
     alone: sixty per cent of what their team is paid for, and "SDRs at target"
     counting only the half. Same third slot, same twenty points, different
     metric behind it. */
  if (manages!=="CS" && manages!=="SDR") return Object.assign({exp:0}, w);
  return Object.assign({}, w, {team: w.team - MGR_EXP_WEIGHT, exp: MGR_EXP_WEIGHT});
}

function buildPlan(ans){
  const r = resolve(ans);
  const p = {r, flags:[], roles:[]};
  // src lists the answers that materially drive this finding. Three or fewer and
  // the finding offers to change them; more than that and lighting up seven rows
  // is the twenty-question review screen again, so it offers nothing.
  const F = (t,h,b,src)=>p.flags.push({t,h,b,src});

  /* ---------- AE core ---------- */
  p.ote=V.OTE[r.OTE]; p.varPct=V.MIX[r.MIX];
  p.variable=p.ote*p.varPct; p.base=p.ote-p.variable;
  p.quota=V.QUOTA[r.QUOTA]; p.aes=V.AES[r.AES];
  p.seg=V.SEG_LABEL[r.SEG]; p.segMult=V.SEG_MULT[r.SEG];
  /* THE SEGMENT AS A NOUN PHRASE, because three of the four labels are not nouns.
     "benchmark for SMB" and "where enterprise normally runs 4x" read fine; "benchmark for
     mixed" and "where mixed normally sits near 5x" do not, because mixed is an adjective
     with nothing behind it. The pattern was already right in three places and bare in
     seven. One phrase now, used wherever the label stands as a noun; the bare label stays
     only where it is doing adjective work. Javier, 2 Oct. */
  p.segPhrase=`${article(p.seg)} ${p.seg} motion`;
  p.period=V.PERIOD[r.SEG]; p.gm=V.GM[r.GM];
  p.rate=p.variable/p.quota;          // the identity: variable = quota x rate at 100%
  p.multiple=p.quota/p.ote;
  p.expected=V.STAGE_RATE[r.STAGE];
  p.qQuota=p.quota/4;
  p.accel=V.ACCEL[r.ACCEL]; p.decel=V.DECEL[r.DECEL];
  p.flat=r.MODEL==="MODEL_FLAT";
  p.expRate=p.rate*V.EXP[r.EXP];
  p.csExpRate=(r.EXP==="EXP_NONE")?p.rate:p.expRate;
  p.early = r.STAGE==="STAGE_EARLY";
  // The shape of the attainment spread, from the stage answer. See attainmentFor.
  p.spread = SPREAD[r.STAGE] || SPREAD.STAGE_ESTABLISHED;

  p.teamQuota=p.quota*p.aes;
  p.book=V.BOOK[r.BOOK];
  p.bookRatio=p.book/p.teamQuota;

  /* ---------- team shape ---------- */
  p.hasMgr = r.TEAM!=="TEAM_AE";
  p.hasSdr = ["TEAM_AE_SDR_MGR","TEAM_FULL"].includes(r.TEAM);
  p.hasCs  = ["TEAM_AE_CS_MGR","TEAM_FULL"].includes(r.TEAM);

  /* ---------- SDR capacity chain ---------- */
  p.acv=V.SEG_ACV[r.SEG]; p.winRate=V.WIN[r.SEG];

  /* ---------- AE quota capacity ----------
     Computed HERE, not in the ledger, because it is knowable from the answers
     alone. You do not need a quarter to know that 39 deals against a ceiling of
     20 is impossible, so it is a judgement about the design and it belongs in
     the plan findings. The ledger only reads it. */
  p.dealsPerRepQtr = (p.quota/4)/p.acv;
  p.capDeals = CAP_DEALS[r.SEG];
  p.cycle = CYCLE_LABEL[r.SEG];
  p.cycleWeeks = CYCLE_WEEKS[r.SEG];
  p.capacity = p.dealsPerRepQtr>p.capDeals ? p.capDeals/p.dealsPerRepQtr : 1;

  p.sdrShare=V.SDR_SHARE[r.ARCH];
  p.dealsNeeded=p.teamQuota/p.acv;
  p.oppsNeeded=p.dealsNeeded/p.winRate;
  p.sdrOpps=p.oppsNeeded*p.sdrShare;
  /* An established-stage SDR's attainment is the count of ACCEPTED
   opportunities, not logged ones: `created` above is
   toDate.filter(c=>c.accepted).length. The unit said "opportunities
   created", which invites the reading that logging one counts for
   something. Third instance of this unit class, 24 Sep. */
  p.sdrUnit = p.early ? "meetings held" : "accepted opportunities";
  /* ONE NOUN, AND THE PARTS EVERY SENTENCE NEEDS. `sdrUnit` has existed since
     the wizard was built and only the plan page read it, so the mock-up, the
     findings and both workbooks each wrote their own copy of the word and only
     some of them knew about early stage. The singular and the verb are here
     because a sentence needs them: you ACCEPT an opportunity and you HOLD a
     meeting, and "Still to accept" on a meetings plan is as wrong as the noun.
     Javier, 15 Oct. */
  p.sdrUnit1 = p.early ? "meeting held" : "accepted opportunity";
  p.sdrUnitShort = p.early ? "meetings" : "opportunities";
  p.sdrVerb  = p.early ? "hold" : "accept";
  p.sdrCap  = p.early ? EARLY_MEETING_CAP : V.SDR_CAP[r.SEG];
  p.sdrDemand = p.early ? p.sdrOpps/MEETING_TO_PIPE : p.sdrOpps;
  p.sdrs = p.hasSdr ? Math.max(1, Math.round(p.sdrDemand/p.sdrCap)) : 0;
  p.sdrOte = Math.max(p.ote*0.60, SDR_FLOOR);
  p.sdrVarPct = 0.30;
  p.sdrVariable = p.sdrOte*p.sdrVarPct;
  p.sdrQuota = p.sdrCap;

  /* ---------- CS ---------- */
  p.bookPerCsmTarget = V.BOOK_PER_CSM[r.SEG];
  p.css = p.hasCs ? Math.max(1, Math.round(p.book/p.bookPerCsmTarget)) : 0;
  p.csBook = p.css ? p.book/p.css : 0;
  p.csOte = Math.max(p.ote*0.75, CS_FLOOR);
  p.csVarPct = 0.20;
  p.csVariable = p.csOte*p.csVarPct;

  /* ---------- managers ---------- */
  const mgrOte = base => Math.max(base*1.40, p.ote);
  p.salesMgrs = p.hasMgr ? Math.max(1, Math.ceil(p.aes/MGR_SPAN)) : 0;
  p.sdrMgrs   = (p.hasMgr && p.sdrs>=SDR_MGR_MIN) ? Math.max(1, Math.ceil(p.sdrs/MGR_SPAN)) : 0;
  p.csMgrs    = (p.hasMgr && p.css >=CS_MGR_MIN ) ? Math.max(1, Math.ceil(p.css /MGR_SPAN)) : 0;
  p.salesMgrOte = mgrOte(p.ote);
  p.sdrMgrOte   = mgrOte(p.sdrOte);
  p.csMgrOte    = mgrOte(p.csOte);
  p.mgrVarPct = 0.40;
  p.hasKicker = ["INC_TEAM","INC_BOTH"].includes(r.INC);

  /* ---------- cost ---------- */
  p.aeVar  = p.variable*p.aes;
  p.sdrVar = p.sdrs*p.sdrVariable;
  p.csVar  = p.css *p.csVariable;
  p.salesMgrVar = p.salesMgrs*p.salesMgrOte*p.mgrVarPct + p.sdrMgrs*p.sdrMgrOte*p.mgrVarPct;
  p.csMgrVar    = p.csMgrs*p.csMgrOte*p.mgrVarPct;
  p.mgrVar = p.salesMgrVar + p.csMgrVar;
  /* Double credit pays two people in full for the same deal, so the same revenue
     is paid on twice on the share of deals that have two people on them. It was
     a bare 1.08 applied to the total, which meant the capacity model could not
     see it at all: eleven plans passed every check while understating any
     double-credit plan by 8%, and a random sweep found it on the eighth try.
     Named, so a document can read it and say what it is. Javier, 29 Sep. */
  p.creditUplift = r.CREDIT==="CREDIT_DOUBLE" ? .08 : 0;
  p.roleVar  = p.aeVar+p.sdrVar+p.csVar+p.mgrVar;
  p.totalVar = p.roleVar * (1 + p.creditUplift);
  // Two businesses, two cost ratios. Sales roles are funded by new revenue;
  // CS is funded by the book they protect. One combined ratio is meaningless.
  p.salesVar   = p.aeVar + p.sdrVar + p.salesMgrVar;
  p.csVarTotal = p.csVar + p.csMgrVar;
  p.aeCostOfRev  = p.aeVar/p.teamQuota;
  p.salesCostOfRev = p.salesVar/p.teamQuota;
  p.csCostOfBook = p.book ? p.csVarTotal/p.book : 0;
  p.guardrail = .15 + (p.hasSdr?.03:0) + (p.hasMgr?.02:0);
  /* The share of gross profit the whole comp bill is allowed to take. It sat
     as a bare .25 in one conditional while every other threshold on this
     object had a name, so the finding printed a number nothing else could
     reach. Javier, 9 Oct, built 13 Oct. */
  p.gpGuardrail = .25;
  /* THE THREE PAY LINES, ON THE PLAN. Added 20 Oct. They were constants read
     directly by retentionPay, participationPay, atTargetTest, deck.js,
     make-contract.js, the two workbook builders and findings.js, which meant
     a lever could not move them: a value copy of a const cannot be overridden
     from outside, and every one of those would have gone on printing 88% and
     95% while the screen showed something else. As plan fields they travel
     with the plan into every document. json-check compares them against these
     same constants on every answer set, so the JSON's copy cannot drift. */
  p.retFloor   = RET_FLOOR;
  p.retFull    = RET_FULL;
  p.partTarget = PARTICIPATION_TARGET;
  p.revBase = p.teamQuota + (p.hasCs ? p.book : 0);
  p.costOfRev = p.totalVar/p.revBase;
  p.shareOfGp = p.costOfRev/p.gm;

  /* ---------- AE payout scenarios ---------- */
  const low = p.decel.thr!==null ? Math.max(.30, p.decel.thr-.10) : .70;
  p.scen = [low,1,1.3].map(f=>{
    const rev=p.quota*f, comm=commAt(p,f);
    return {att:Math.round(f*100), rev, comm, total:p.base+comm, pctOte:(p.base+comm)/p.ote};
  });
  if (p.accel.at){
    const f=1.5, comm=commAt(p,f);
    p.scen.push({att:150, rev:p.quota*f, comm, total:p.base+comm, pctOte:(p.base+comm)/p.ote});
  }
  buildRoles(p,r,F);
  planFindings(p,r,F);
  return p;
}

/* ==========================================================================
   THE DEAL LEDGER
   A whole quarter of deals, generated deterministically from the seven
   BUSINESS answers only. Comp answers never touch it: pulling a lever
   repays the same quarter rather than inventing a new one.
   ========================================================================== */
const QTR_WEEKS = 13, EARLY_SHARE = .15, CARRYOVER_SHARE = .20, STALL_WEEKS = 6;
/* The smallest quota band the questionnaire offers, read off the band table rather than
   typed, so a card that says "the quota is already at the bottom of the range" cannot
   start lying the day a band is added. Advice naming a control the reader has already run
   out of is the defect this exists to prevent; see the rate card and the stage card. */
const LOWEST_QUOTA = Object.keys(V.QUOTA).reduce((lo, k) => V.QUOTA[k] < V.QUOTA[lo] ? k : lo);
/* What one AE closes in expansion in a quarter, as a share of their quarterly
   quota. The capacity model prices expansion at the same 10% of quota, so the
   plan file and the quarter agree about the size of the motion. */
const AE_EXP_SHARE = .10;
// Expected cumulative share of the quarter's closes by week, derived from
// closeWeek over four million draws. Pace findings compare against this, never
// against a straight line: linear pacing in a business that closes late reports
// every rep as behind for eleven weeks running.
const PACE = [0,.075,.150,.195,.240,.284,.329,.374,.418,.463,.508,.620,.776,1.000];
// Manager teams are dealt to sit TEAM_SPREAD apart, top team to bottom team.
// The band is centred on the company mean, so with the company landing near
// 105% the spread also decides where the weakest team sits relative to target.
// At .12 that was 99% on every preset with more than one AE team, which is a
// miss by construction and the least legible version of itself: every
// short-of-target sentence in the Manager set read as a rounding complaint.
// At .20 the weakest lands at 95%, about $60K short on a $1.20M target, which
// is the sentence worth proof-reading. Not higher: .24 puts a #large team on
// exactly 100%, and a claim about a number sitting on a boundary is the
// display-tie class all over again.
const TEAM_SPREAD = .20;
// Won deals a rep can realistically close in a quarter, by cycle length. Not a
// quota opinion, a physics one: an enterprise rep working nine-month cycles
// cannot close twelve deals however the plan is written.
const CAP_DEALS = {SEG_SMB:20, SEG_MM:6, SEG_ENT:2.5, SEG_MIXED:6};
const CYCLE_LABEL = {SEG_SMB:"30-day", SEG_MM:"one to three month",
                     SEG_ENT:"three to nine month", SEG_MIXED:"one to three month"};
/* The same cycles in weeks, so a card can ask whether anything created now could
   still land inside the quarter. A deal has to run its cycle before it closes, so
   with fewer weeks left than the cycle takes, new pipeline is next quarter's
   business however much of it a rep creates. On a three to nine month cycle that
   is true in week 1. */
const CYCLE_WEEKS = {SEG_SMB:4, SEG_MM:8, SEG_ENT:26, SEG_MIXED:8};

/* Products carry a TIER. The tier is cosmetic in every plan except MODEL_DEAL_SIZE,
   where it is what "strategic products pay a higher rate" actually means.
   Deal SIZE deliberately does not affect the rate: a bigger deal already pays more
   because commission is a percentage, so a higher rate on top double-counts and
   quietly punishes whoever drew the smaller territory.
   TIER_MIX is 20/60/20 rather than 20/65/15 for a load-bearing reason: the mix
   weighted by TIER_MULT must come to exactly 1.0, or product tiering silently
   pays every rep above their variable target at 100% attainment and breaks the
   identity the whole engine rests on. Strategic share must equal services share. */
const TIER_MULT = {strategic:1.25, core:1.00, services:0.75};
const TIER_MIX  = [["strategic",.20], ["core",.60], ["services",.20]];
const PRODUCTS = {
  ARCH_SUBSCRIPTION:{strategic:"Analytics Suite", core:"Platform",         services:"Onboarding"},
  ARCH_PLG:         {strategic:"Enterprise Plan", core:"Business Plan",    services:"Migration"},
  ARCH_USAGE:       {strategic:"Committed Capacity", core:"Consumption",   services:"Integration"},
  ARCH_SERVICES:    {strategic:"Platform Licence", core:"Implementation",  services:"Managed Service"},
  ARCH_CHANNEL:     {strategic:"Partner Bundle",  core:"Platform",         services:"Enablement"}
};
// The team kicker. The published benchmark is 5% at 120%, but our quarter lands
// the whole company at 105%, so a 120% line never fires and the mechanic becomes
// decoration. Measured against a MANAGER'S OWN TEAM at 110% it clears for the
// strongest team and misses for the rest, which is the version worth having.
const KICK_LINE = 1.10, KICK_PCT = .05;
/* The kicker is an ANSWER, not a constant of the universe. INC offers "a team
   kicker" and defaults to it, and the answer was read nowhere: every plan got a
   kicker whether the user asked for one or said "no, keep the plan simple". */
const STAGES = ["Discovery","Demo","Proposal","Negotiation"];
/* A RENEWAL DOES NOT GET A DEMO. Every deal used to walk the new-business
   ladder regardless of type, so on #full 80 renewals sat in Demo and 54 in
   Discovery, and on #large 276 and 219. Nobody saw it because the type was
   buried at the end of a truncated opportunity name; it becomes the first
   thing a RevOps reader notices the moment the deal table can filter by type.
   Three stages, because a renewal has three: it is in the window, the number
   is with the customer, they are haggling. Expansion keeps the new-business
   ladder, because an expansion really is a new thing being sold.
   Javier, 13 Oct. */
const RENEWAL_STAGES = ["Renewal Identified","Quote Sent","Negotiation"];
function ladderFor(type){ return type === "Renewal" ? RENEWAL_STAGES : STAGES; }
// Names are mostly American and British, with a minority from elsewhere, because
// the reader has to hold eight of them in their head at once while comparing a
// table to a finding. No two entries share a stem: "Elena" and "Lena" appeared as
// two different reps on the same plan and read as a typo rather than two people.
// Names are mostly American and British, with a minority from elsewhere, because
// the reader has to hold eight of them in their head at once while comparing a
// table to a finding. No two entries share a stem: "Elena" and "Lena" turned up
// as two different reps on the same plan and read as a typo rather than as two
// people. Every org is dealt one first name and one surname each; the pools are
// carried past the largest org the wizard can build by FIRST_X and LAST_X below.
const FIRST = ["Grace","Tom","Hannah","Owen","Ivy","Marcus","Clara","Jack","Ruby","Nathan",
  "Ellie","Adam","Sophie","Ben","Chloe","Daniel","Megan","Josh","Katie","Aisha",
  "Priya","Diego","Kenji","Samir","Luke","Erin","Ryan","Holly","Nora","Felix",
  "Alice","Bradley","Caitlin","Dominic","Eleanor","Frank","Georgia","Harvey","Isabel","Jonah",
  "Kirsty","Leo","Maya","Nigel","Olivia","Patrick","Rosie","Simon","Tessa","Wesley",
  "Amara","Bruno","Camille","Elias","Farah","Gideon","Hugo","Imani","Jasmine","Karl"];
const LAST = ["Webb","Boyd","Doyle","Sullivan","Hale","Ellis","Reid","Brooks","Palmer","Whitfield",
  "Harding","Bennett","Fletcher","Curtis","Marsh","Norton","Pike","Radcliffe","Stanton","Vaughan",
  "Ashworth","Caldwell","Dunbar","Ferris","Grantham","Hollis","Ingram","Lockhart","Mercer","Prescott",
  "Quinn","Rowley","Thornton","Underhill","Wakefield","Khan","Zhang","Okafor","Haddad","Costa",
  "Novak","Fischer","Bhatt","Silva","Mori"];
/* The pools above run out. FIRST holds 60 entries and LAST holds 45, and the
   comment on FIRST claimed a whole org could be dealt one name each, which was
   true of the org the presets had when it was written and false the moment
   #large existed. Past the end of a pool name() falls back to random pairing
   that only guarantees the FULL name is unique, so #large dealt four Underhills,
   four Brookses and three Wakefields across 79 people, and #miss put Hugo
   Grantham and Amara Grantham in charge of two teams next to each other on the
   same CEO screen. Two managers sharing a surname reads as a typo, which is the
   same objection that put "no two entries share a stem" in the note above.
   The largest org the wizard can produce is 121 named people: 30 AEs, 75 CSMs,
   2 SDRs and 14 managers, at TEAM_FULL, 26+ AEs, a book above $40M, enterprise.
   These extensions carry both pools past that, so every person in every org the
   tool can build gets a first name and a surname nobody else has.
   They are SHUFFLED ON THEIR OWN SEED and sit in front of the base pool, which
   name() consumes from the back. Both parts matter: the base names are dealt in
   exactly the order they were before, and the extra shuffle draws no numbers
   from the ledger's own stream, so every preset under 46 people deals the same
   quarter, to the same people, as it did before this list existed. */
const FIRST_X = ["Naomi","Tobias","Wendy","Yusuf","Zara","Colin","Derek","Edwin","Fiona","Gavin",
  "Heidi","Ibrahim","Julia","Keith","Lydia","Miles","Nina","Oscar","Paloma","Quentin",
  "Rafael","Selina","Theo","Ursula","Viktor","Warren","Xavier","Yolanda","Zane","Arun",
  "Blake","Cassie","Delia","Esme","Finn","Greta","Hayden","Iris","Joel","Kamal",
  "Lorna","Mateo","Neil","Orla","Pablo","Rhys","Sasha","Trevor","Uma","Vera",
  "Lucia","Malik","Noor","Otto","Petra","Rebecca","Stefan","Tara","Ulrich","Vincent",
  "Willow","Yara","Zoe","Anika","Boris","Cormac","Dmitri","Emre","Freya","Gunnar"];
const LAST_X = ["Abbott","Baxter","Carver","Danforth","Easton","Fairfax","Gallagher","Hendricks","Isley","Jarrett",
  "Kendrick","Langley","Marchetti","Newbury","Ortega","Pennington","Quillen","Ransome","Sheridan","Talbot",
  "Upton","Vickers","Winslow","Yates","Zeller","Alderton","Bramwell","Chastain","Delacroix","Everly",
  "Fontaine","Garrick","Ivers","Jennings","Kowalski","Lindqvist","Moreau","Nakamura","Oyelaran","Petrov",
  "Rosenthal","Rasmussen","Stroud","Tremblay","Ueda","Vasquez","Wexford","Yamamoto","Zabala","Acheson",
  "Blaine","Corrigan","Dalgleish","Eriksen","Falkner","Goddard","Hargreaves","Iqbal","Jamison","Keating",
  "Lombardi","Mensah","Nguyen","Odell","Pemberton","Rivera","Sorensen","Thackeray","Voss","Wyndham",
  "Ashby","Brennan","Cardenas","Devereux","Ellsworth","Forsythe","Grimaldi","Hobart","Jensen","Kirkland"];
const CO_A = ["North","Vertex","Lumen","Harbour","Kestrel","Ardent","Beacon","Cobalt","Draft",
  "Ember","Fathom","Granite","Halcyon","Ionic","Juniper","Kiln","Larkspur","Meridian","Nimbus",
  "Orbit","Pallas","Quarry","Ridge","Summit","Tessera","Umber","Vale","Wren","Xenon","Yarrow"];
const CO_B = ["Labs","Systems","Health","Retail","Logistics","Financial","Media","Robotics",
  "Analytics","Foods","Energy","Works","Group","Digital","Bio","Freight","Learning","Insurance"];

function rng(seedStr){
  let h=2166136261;
  for(let i=0;i<seedStr.length;i++){h^=seedStr.charCodeAt(i); h=Math.imul(h,16777619);}
  let a=h>>>0;
  return ()=>{a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15, 1|a);
    t=t+Math.imul(t^t>>>7, 61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;};
}

/* Attainment read off a curve by rank, never sampled. Guarantees the shape,
   and the three anchors appear on their own once there are enough reps.
   A wider spread looked more dramatic but put the whole team at 114% attainment,
   which is not what a real quarter looks like and would flatter every plan.

   THE SHAPE FOLLOWS THE STAGE ANSWER. It used to be one curve for every company:
   best rep near 150%, worst near 60%, identical whether the user answered early
   stage or mature, SMB or enterprise. That made every company in the tool the
   same company wearing a different plan, and it is why the CEO's "the number
   came from a few people" card could never fire and why the distribution tile,
   whose whole justification is that a ramp, a cliff and a bunch are three
   different businesses, only ever drew one of the three. Measured across 3,000
   random plans the top 20% produced between 25.4% and 25.9% of revenue at any
   given headcount: a constant, not a finding.

   An early company genuinely is lumpy. Quotas are guesses, territories are
   uneven, and one or two people have found the motion the rest are still
   looking for. A mature one is tight, because the quota has been calibrated
   against several years of its own history. So the floor drops and the curve
   steepens as the stage gets earlier.

   THE MEAN IS PINNED at SPREAD_MEAN for all four, so the company still lands
   near 105% whatever shape it has. Only the distribution moves. b falls out of
   the floor and the curve rather than being chosen, which is what holds the
   mean: b = (mean - floor) * (curve + 1). STAGE_ESTABLISHED reproduces the old
   constants exactly, 0.60 and 0.92, so every established preset is untouched.

   What each one produces, at sixteen reps:
     early        top 20% hold 36% of revenue, best rep 223%, worst 40%
     growth       29%, best 176%, worst 51%
     established  26%, best 149%, worst 62%   (the old curve)
     mature       24%, best 136%, worst 70%
   Nothing here reaches the 50% that ceo-s2 used to ask for, and nothing should:
   solving the curve for it needs a rep at 322% of quota with half the team
   under 70%, which is a collapsed quota rather than a concentrated one, and
   standing 1 and ceo-c-capacity already own that conversation. */
const CS_EXP_GROWTH = .12;   // annual expansion a CS book is expected to carry
const SPREAD_MEAN = 1.0488;
// How hard a CSM's rank bites on their churn rate. See the renewal loop.
const CHURN_SPREAD = 2;
// The same, for how much expansion a CSM lands. See the renewal loop.
const EXP_SPREAD = 2;
const SPREAD = {
  STAGE_EARLY:       {floor:0.38, curve:2.15},
  STAGE_GROWTH:      {floor:0.50, curve:1.40},
  STAGE_ESTABLISHED: {floor:0.60, curve:1.05},
  STAGE_MATURE:      {floor:0.70, curve:0.90}
};
function attainmentFor(i,n,sp){
  const s = sp || SPREAD.STAGE_ESTABLISHED;
  const b = (SPREAD_MEAN - s.floor) * (s.curve + 1);
  return s.floor + b*Math.pow((i+0.5)/n, s.curve);
}

// Deal reps to manager teams DELIBERATELY. Straight by rank gives one manager
// every star and produces a 140% team against a 70% one, which is nonsense.
// Pure random lands every team on the same mean and there is no story to see.
// Teams get target means spaced TEAM_SPREAD apart, strongest first, then reps
// are dealt strongest-first to whichever team still needs the most per seat.
// Lands 11 to 14 points between the top and bottom team at every headcount,
// with the company mean untouched.
function dealTeams(attains, T){
  const n=attains.length;
  if (T<=1 || n===0) return new Array(n).fill(0);
  const sizes=Array.from({length:T},(_,t)=>Math.floor(n/T)+(t<n%T?1:0));
  const mean=attains.reduce((a,b)=>a+b,0)/n;
  const targets=Array.from({length:T},(_,t)=>mean+TEAM_SPREAD*(0.5-t/(T-1)));
  const sum=new Array(T).fill(0), cnt=new Array(T).fill(0), team=new Array(n).fill(0);
  attains.map((a,i)=>i).sort((a,b)=>attains[b]-attains[a]).forEach(i=>{
    let best=0, bestNeed=-Infinity;
    for(let t=0;t<T;t++){
      if(cnt[t]>=sizes[t]) continue;
      const need=(targets[t]*sizes[t]-sum[t])/(sizes[t]-cnt[t]);
      if(need>bestNeed){ bestNeed=need; best=t; }
    }
    team[i]=best; sum[best]+=attains[i]; cnt[best]++;
  });
  return team;
}

// Weeks 1-2 carry EARLY_SHARE of closes so the simulator opens with a visible
// spread. The rest hockey-sticks into the final three weeks. Kept because it is
// what PACE was derived from, and still used where a single deal needs a week.
function closeWeek(r){
  if (r()<EARLY_SHARE) return 1+Math.floor(r()*2);
  const w=[0,0,1,1,1,1,1,1,1,1,2.5,3.5,5];
  let total=w.reduce((a,b)=>a+b,0), x=r()*total;
  for(let i=0;i<w.length;i++){ x-=w[i]; if(x<=0) return i+1; }
  return QTR_WEEKS;
}

// Inverse of the close curve: the week by which share s of the quarter has closed.
function weekAtShare(s){
  for(let w=1;w<=QTR_WEEKS;w++) if (PACE[w]>=s) return w;
  return QTR_WEEKS;
}
// A REP'S closes are spread along the curve, not drawn one deal at a time.
// Independent draws were right in aggregate and absurd per person: with three or
// four wins a quarter, a rep finishing at 84% could have closed nothing by week
// 11, and a rep finishing at 137% could be sitting at 15%. That breaks every
// pace finding and every win-rate-to-date. Same fix as attainment: read the
// shape off a curve rather than sampling it. JITTER keeps some reps running
// early and some late without letting anyone fall off the curve entirely.
// OFFSET stratifies ACROSS reps as well as within one. An enterprise rep closes
// exactly one deal a quarter, so without it every rep's single deal lands at the
// middle of the curve and the simulator opens on an empty quarter with the whole
// team at zero through week 6. Offsetting each rep's grid by their position
// spreads those single deals over all thirteen weeks. The shift is a full slot
// when k is 1 and vanishes as k grows, which is exactly where it is needed.
const JITTER = .18;
function closeWeeks(k, r, offset){
  const out=[];
  for(let j=0;j<k;j++){
    let q=((j+0.5+(offset||0))/k) % 1 + (r()-0.5)*JITTER;
    q=((q % 1)+1) % 1;
    out.push(weekAtShare(Math.min(.999, Math.max(.001, q))));
  }
  return out;
}

/* DATES ON THE DEAL RECORD, AND WHAT A PARKED DEAL DOES NEXT.
   A carryover is a deal that never resolves inside the quarter. They used to
   be one lump dealt a random stage, so every one of them looked the same and
   none of them ever did anything. Three things are true of real parked deals
   and none of them were modelled:

   A parked deal eventually MOVES. It sits in one stage for weeks, then takes a
   step, and once it has moved the honest forecast is next quarter rather than
   another fortnight's promise. After the step it is not stale any more, and
   the finding stops talking about it.

   Some parked deals CLOSE. A deal that has sat in Discovery since last quarter
   can still land in week 10, and when it does the count of stale deals drops.
   Those are ordinary won and lost deals flagged as having been parked on the
   way, so revenue, attainment and the close weeks are exactly what they were.

   The rest are HEALTHY carryovers: created this quarter, forecast into next
   quarter, walking the stages toward that date like any live deal. Nothing
   wrong with them and no finding about them.

   Which kind a carryover is comes from the single rnd() call that used to draw
   its stage, so no other draw moves and no preset re-deals. Coverage and
   attainment are untouched: every one of them counts in open pipeline exactly
   as the old carryover did. */
const EARLY_STAGES = ["Discovery","Demo"];
/* A renewal has one early stage, not two, so both arms land on it. */
function earlyStageFor(type, i){
  return type === "Renewal" ? RENEWAL_STAGES[0] : EARLY_STAGES[i];
}
function carryDates(r){
  if (r < 0.5){
    const createdWeek = -8 + Math.floor(r*16);       // last quarter
    return {createdWeek, parkedDeal:true, stage: r < 0.25 ? "Discovery" : "Demo"};
  }
  const createdWeek = 1 + Math.floor((r-0.5)*6);     // early this quarter
  return {createdWeek, parkedDeal:false, expectedClose: QTR_WEEKS + 2 + Math.floor(((r*97)%1)*6)};
}
/* The next stage along, for the step a parked deal takes. */
function nextStage(stage, type){
  const L = ladderFor(type);
  const i = L.indexOf(stage);
  return i < 0 || i === L.length-1 ? stage : L[i+1];
}
function buildLedger(p){
  const r=p.r;
  const seed=[r.ARCH,r.SEG,r.TEAM,r.AES,r.STAGE,r.QUOTA,r.BOOK].join("|");
  const rnd=rng(seed);
  const L={deals:[], reps:[]};
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const used=new Set();
  // First names are dealt without replacement while the list lasts. Four people
  // called Hannah on one team is technically possible and unreadable: the whole
  // point of the table is that a manager can hold eight names in their head, and
  // repeated first names turn every finding into "which one".
  const shuffled = list => {
    const a=list.slice();
    for (let i=a.length-1; i>0; i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  };
  const rndX = rng(seed+"|names");
  const shuffledX = list => {
    const a=list.slice();
    for (let i=a.length-1; i>0; i--){ const j=Math.floor(rndX()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  };
  // Base pool at the back, extension in front, because name() pops from the back.
  const firstPool = shuffledX(FIRST_X).concat(shuffled(FIRST));
  const lastPool  = shuffledX(LAST_X).concat(shuffled(LAST));
  const name=()=>{
    let n;
    if (firstPool.length && lastPool.length){
      n = firstPool.pop()+" "+lastPool.pop();
      if (!used.has(n)){ used.add(n); return n; }
    }
    do{ n=pick(FIRST)+" "+pick(LAST); } while(used.has(n));
    used.add(n); return n;
  };
  const account=()=>pick(CO_A)+" "+pick(CO_B);

  // CAPACITY. A quota is unachievable in two different ways and only one of them
  // belongs in the ledger. Capacity-unachievable means the number needs more
  // deals than a rep can work in the cycle: that is a business-answer problem and
  // attainment must fall, or the simulator shows everyone hitting a quota the
  // findings just called impossible. Pay-unachievable (a 16x multiple, a 3% rate)
  // leaves attainment alone, because those reps CAN close it, they just earn
  // nothing for it, and the commission numbers already tell that story.
  // p.capacity, p.dealsPerRepQtr and p.capDeals are set in buildPlan.

  // rosters, indexed worst to best
  const roster=(n,role)=>Array.from({length:n},(_,i)=>
    ({name:name(), role, attain:attainmentFor(i,n,p.spread)*(role==="AE"?p.capacity:1)}));
  const aes=roster(p.aes,"AE"), sdrs=roster(p.sdrs,"SDR"), css=roster(p.css,"CS");

  /* ---------- WIN RATE PER REP ----------
     Reps do not all close at the same rate, and until this existed they did:
     losses were generated as wins x (1/winRate - 1) off the single plan rate, so
     every rep finished the quarter on exactly the plan's number and the two
     win-rate findings could only ever fire on which deals happened to resolve
     first. Either model it or say nothing, so it is modelled.
     Read off a curve rather than sampled, like attainment and close timing, and
     deliberately NOT in attainment order: a rep who closes a high share of what
     they work is not automatically the rep with the biggest number, and if the
     two ranks agreed the finding would just be restating attainment.
     Only the LOSS count moves. Wins are already fixed by the attainment curve,
     so revenue, attainment, teams and the kicker are all untouched. The totals
     are then scaled so the company still closes at the plan's win rate, because
     the SDR headcount chain and the coverage findings are built on it. */
  const WIN_SPREAD = .35;
  const order = aes.map((_,i)=>i);
  for (let i=order.length-1; i>0; i--){
    const j=Math.floor(rnd()*(i+1)); [order[i],order[j]]=[order[j],order[i]];
  }
  order.forEach((repIndex, rank)=>{
    const t = aes.length>1 ? rank/(aes.length-1) : 0.5;
    aes[repIndex].winRate = p.winRate*(1 - WIN_SPREAD + 2*WIN_SPREAD*t);
  });
  // Losses are wins x (1/rate - 1), so spreading the rate and stopping there
  // pulls the COMPANY rate down: the reciprocal of an average is not the average
  // of reciprocals. One scalar puts the aggregate back on the plan's rate while
  // leaving the spread between reps exactly as dealt.
  /* ---------- WHAT EACH REP LEADS WITH ----------
     Tiers used to be drawn per deal from one company-wide 20/60/20 mix, which
     meant a rep's product mix was a coin flip and the two findings about it were
     firing on sampling noise: three deals, two of them strategic, reported as
     "58% against 27% for the team". Either model it or say nothing.
     So each rep gets a leaning, MIX_SPREAD either side of the company's 20%
     strategic, dealt in a shuffled order so it is not just attainment wearing a
     different hat. Strategic and services move in opposite directions and the
     core share never moves, which keeps the company mix at 20/60/20 and the
     weighted multiplier at 1.0. Within a rep the two do NOT cancel, and that is
     the mechanic the plan is buying: on a product-tiered plan what you lead with
     changes what you earn. */
  const MIX_SPREAD = .10;
  const mixOrder = aes.map((_,i)=>i);
  for (let i=mixOrder.length-1; i>0; i--){
    const j=Math.floor(rnd()*(i+1)); [mixOrder[i],mixOrder[j]]=[mixOrder[j],mixOrder[i]];
  }
  mixOrder.forEach((repIndex, rank)=>{
    const t = aes.length>1 ? rank/(aes.length-1) : 0.5;
    aes[repIndex].stratShare = .20 - MIX_SPREAD + 2*MIX_SPREAD*t;
  });

  const wonOf = a => Math.max(1, Math.round(((p.quota/4)*a.attain)/p.acv));
  const totWon = aes.reduce((t,a)=>t+wonOf(a), 0);
  const totOpps = aes.reduce((t,a)=>t+wonOf(a)/a.winRate, 0);
  const wrFix = totWon ? (totOpps*p.winRate)/totWon : 1;
  aes.forEach(a=>{ a.winRate = Math.min(.85, Math.max(.05, a.winRate*wrFix)); });

  // Managers own a TEAM, not a headcount. Without this the Manager view has
  // nothing to be about and the reps-at-quota component measures the whole
  // company instead of the eight people a manager actually coaches.
  L.managers=[];
  const assign=(list,nMgrs,label)=>{
    if(!list.length) return;
    const T=Math.max(1, nMgrs||0);
    const team=dealTeams(list.map(x=>x.attain), T);
    list.forEach((x,i)=>{ x.team=team[i]; });
    if(!nMgrs) return;
    for(let t=0;t<T;t++){
      const members=list.filter(x=>x.team===t);
      const attain=members.reduce((s,m)=>s+m.attain,0)/members.length;
      L.managers.push({name:name(), role:label, manages:list[0].role, team:t,
                       reps:members.map(m=>m.name), attain,
                       kicker: p.hasKicker && attain>=KICK_LINE});
    }
  };
  assign(aes,p.salesMgrs,"Sales Manager");
  assign(sdrs,p.sdrMgrs,"SDR Manager");
  assign(css,p.csMgrs,"CS Manager");

  /* SELLING MANAGERS. At three reps or fewer the plan puts 40% of a sales
     manager's variable on their own quota, because at that size they are still
     carrying a bag. The simulator dealt them nothing, so that component had no
     number behind it and the card could only say it was not being followed.
     They are dealt a quarter here like anybody else.

     They are deliberately NOT in L.reps. An AE's peers are the other reps, not
     their boss, so putting a manager in the AE roster would quietly put them
     inside every peer comparison, the at-quota count, the top-20% share and the
     rep table. Their deals carry role "AE" because that is what they are, new
     business, and the company's revenue has to include them.

     Their own quota sits OUTSIDE the team target. Team attainment measures the
     people they coach. A manager whose own deals lifted the number their team
     component is measured on would be paid twice for one deal, which is the
     thing the rest of this plan exists to stop. It does mean company attainment
     stops equalling the sum of the teams, and that is correct rather than a
     leak: the company has sellers who are on nobody's team.

     RE-OPENED AND CLOSED AGAIN, 15 Sep. The kicker looks like a hole in this,
     because it pays the REPS rather than the manager, so the double-pay argument
     above has nothing to say about it. On #small the kicker asks whether the
     team cleared 110% of a combined quota that excludes a third of the people
     selling in that unit: the two reps are at 105% on $300K of quota while Tessa
     sold $121K against $150K that is counted nowhere near them.
     Left alone deliberately. The reps cannot influence their manager's deals, so
     folding her book into their gate makes them chase a number they do not
     control, which is a worse fault than the mismatch it fixes. A gate has to be
     something the people gated on it can move.
     Do not "fix" this by adding the manager to the team. It has now been argued
     twice and landed in the same place both times.

     Win rate and product mix are the company's, not a dealt spread. Nothing on
     any plan reads a manager's win rate, and giving them one would move the
     company's rate and mix for no one's benefit. */
  const MGR_SELLS_UNDER = 3;
  L.mgrSellers = [];
  L.managers.forEach(m=>{
    m.sells = m.manages==="AE" && m.reps.length<=MGR_SELLS_UNDER;
    if (!m.sells) return;
    const n = Math.max(1, p.aes);
    L.mgrSellers.push({name:m.name, role:"MGRSELL", team:m.team, manages:"AE",
      attain: attainmentFor(Math.floor(rnd()*n), n, p.spread)*p.capacity,
      winRate: p.winRate, stratShare:.20});
  });

  // The kicker resolves against the rep's own team, never the whole company, and
  // it is GATED on the individual. A plan that re-rates somebody down for missing
  // their number and then tops them up five per cent for the team's is a plan that
  // gets read out loud in a comp committee. The gate reuses the decelerator line
  // rather than introducing a second threshold, because every extra number in a
  // plan is another thing to explain. No decelerator, no gate.
  // Javier's argument for it, which is the better one: excluding the rep who is
  // short is exactly what makes the rest of the team help them over the line.
  const teamAttain={};
  L.managers.forEach(m=>{ teamAttain[m.manages+"|"+m.team]=m.attain; });
  [...aes,...sdrs,...css].forEach(x=>{
    const a=teamAttain[x.role+"|"+(x.team||0)];
    x.teamAttain = a===undefined ? null : a;
    x.teamCleared = x.teamAttain!==null && x.teamAttain>=KICK_LINE;
    // AE only. The kicker exists on exactly one component table, the AE's.
    // Managers see their AEs' kicker but do not earn one, SDRs and CSMs have no
    // kicker line at all, and marking them eligible had them measured against a
    // company number for pay that does not exist on their plan.
    x.kickerEligible = x.role==="AE" &&
      (p.decel.thr===null || x.attain>=p.decel.thr) && p.hasKicker;
    x.kicker = x.teamCleared && x.kickerEligible;
  });
  L.kickGate = p.decel.thr;
  L.kickLine=KICK_LINE; L.kickPct=KICK_PCT;

  let id=1000;
  // Opportunity names: account, product, deal type. NO uniqueness counter.
  // Real CRMs do not have unique opportunity names and never have; the record ID
  // is the key, and every row already prints OPP-####. A counter was the one
  // fake thing in the field.
  const catalogue=PRODUCTS[r.ARCH]||PRODUCTS.ARCH_SUBSCRIPTION;
  // A rep's own mix when we know whose deal it is, the company's otherwise.
  const tier=(rep)=>{
    const strat = rep && rep.stratShare!==undefined ? rep.stratShare : .20;
    const x=rnd();
    if (x < strat) return "strategic";
    if (x < strat + .60) return "core";
    return "services";
  };
  /* EVERY DEAL CARRIES A CREATED WEEK. A record with no created date is not a
     record anybody recognizes, and half the deal table had none: only the
     carryovers were dated. A deal that resolves was created a sales cycle
     before it closes, which on a 26-week enterprise cycle is last quarter or
     the one before, and week 0 is the last week of last quarter. The lead
     varies by a few weeks per deal, taken from the record id rather than from
     a new rnd() call, so nothing in the draw order moves. */
  const leadFor = (id, closeWeek) => {
    const jitter = (id % 5) - 2;                       // -2 to +2 weeks
    return closeWeek - Math.max(2, (p.cycleWeeks||8) + jitter);
  };
  const push=d=>{
    const t=d.tier||tier(d.owner);
    const rec=Object.assign({id:"OPP-"+(++id), tier:t, product:catalogue[t],
      name:d.account+" - "+catalogue[t]+" - "+d.type}, d, {tier:t, product:catalogue[t]});
    if (rec.createdWeek===undefined)
      rec.createdWeek = rec.week==null ? 1-Math.max(2, p.cycleWeeks||8) : leadFor(id, rec.week);
    delete rec.owner;                       // used to pick the tier, never stored
    L.deals.push(rec);
  };
  L.tierMult=TIER_MULT; L.tierMix=TIER_MIX;
  // Created by is the TEAM, never a person. Naming an individual creator means
  // the name and the team can disagree; naming only the team makes that impossible.
  // Created by is the TEAM in the visible column. The individual SDR is held in
  // the RECORD as createdByRep, never printed as a creator name, which is what
  // makes an SDR's own view possible without reopening the bug where a name and a
  // role disagreed.
  // NOT "sourced" and NOT "owner". Sourced means something else in this project
  // (marketing sources, it does not create) and the SDR never owns the
  // opportunity: the AE does. The SDR created it and then handed it over.
  // Allocation is weighted by SDR attainment, so a stronger SDR creates more, and
  // their attainment is expressed in the pipeline they created rather than sitting
  // as a number attached to nothing.
  const sdrWeights = sdrs.map(s=>s.attain);
  const sdrTotal = sdrWeights.reduce((a,b)=>a+b,0);
  const pickSdr = () => {
    let x = rnd()*sdrTotal;
    for(let i=0;i<sdrs.length;i++){ x-=sdrWeights[i]; if(x<=0) return sdrs[i].name; }
    return sdrs[sdrs.length-1].name;
  };
  const creator = () => (p.sdrs && rnd()<p.sdrShare)
    ? {createdBy:"SDR", createdByRep: pickSdr()}
    : {createdBy:"AE", createdByRep: null};

  // Selling managers are dealt through the same path as the reps, so their
  // quarter is generated by the same rules rather than by a second set. On every
  // preset without one this list is empty and nothing below changes.
  const sellers = [...aes, ...L.mgrSellers];
  sellers.forEach((ae,ai)=>{
    const off=ai/sellers.length;                     // stratifies close weeks across the team
    const target=(p.quota/4)*ae.attain;              // quarterly revenue this rep lands
    const nWon=Math.max(1, Math.round(target/p.acv));
    // varied sizes, then scaled so the set sums to exactly the target
    let sizes=Array.from({length:nWon},()=>0.5+rnd()*1.3);
    const k=target/(sizes.reduce((a,b)=>a+b,0)*p.acv);
    sizes=sizes.map(s=>Math.round(s*p.acv*k/1000)*1000);

    const wonWeeks=closeWeeks(sizes.length, rnd, off);
    sizes.forEach((acv,j)=>{
      push(Object.assign({account:account(), rep:ae.name, owner:ae, role:"AE", type:"New business", acv,
            status:"Won", stage:"Closed Won", week:wonWeeks[j]}, creator()));
    });
    // the losses THIS REP's win rate implies
    const nLost=Math.round(nWon*(1/ae.winRate - 1));
    const lostWeeks=closeWeeks(nLost, rnd, off);
    for(let i=0;i<nLost;i++){
      const acv=Math.round((0.5+rnd()*1.3)*p.acv/1000)*1000;
      push(Object.assign({account:account(), rep:ae.name, owner:ae, role:"AE", type:"New business", acv,
            status:"Lost", stage:"Closed Lost", week:lostWeeks[i]}, creator()));
    }
    // carryover: worked all quarter, never resolved
    const nOpen=Math.max(1, Math.round((nWon+nLost)*CARRYOVER_SHARE));
    for(let i=0;i<nOpen;i++){
      const acv=Math.round((0.5+rnd()*1.3)*p.acv/1000)*1000;
      push(Object.assign({account:account(), rep:ae.name, owner:ae, role:"AE", type:"New business", acv,
            status:"Open", week:null}, carryDates(rnd()), creator()));
    }
  });

  // a quarter of the book renews each quarter; expansion on ~a fifth of it
  if (p.css !== 0 && p.hasCs){
    // Renewals are dealt off each CSM's OWN book, not drawn at random from a
    // company pool. Random assignment left one CSM with no renewals at all,
    // which reports them at zero retention for a quarter in which nothing they
    // held was ever at risk. A CSM's book renews on its own schedule.
    const avg=p.acv;
    const perCsm=Math.max(1, Math.round((p.csBook/4)/avg));
    const pending=[];
    for(let i=0;i<perCsm*css.length;i++){
      const owner=css[i%css.length];
      const acv=Math.round((0.6+rnd()*0.9)*avg/1000)*1000;
      /* CHURN FOLLOWS THE CSM, the way close rate follows an AE. It was a flat
         10% draw for everybody, so a CSM's attainmentFor rank, computed for them
         like every other role, decided nothing about their quarter. dealTeams
         then spread CS managers on that rank, which is a number with no effect
         on the result, and CS teams came out three points apart on #large where
         AE teams are twenty and SDR sixteen. Nothing could be read off a CS
         manager comparison, and no threshold could land anywhere but on top of
         every team at once.
         Centred at 5.5%, which is what lets anybody clear the bar. It was 10%,
         set independently of RET_FULL at 95%, and the two cannot both be right:
         a book churning a tenth of itself lands CS teams at 85% to 91%
         retention, so no CSM and no CS manager on any preset ever made their
         number and "the team made it" was unreachable for the whole role. The
         target is the published benchmark and every CS card is written against
         it, so the generator is the thing that bends. At 5.5% the teams land
         between 97% and 105% of target: #mixed and #full clear it, one of
         #large's four clears it, #early and #miss do not.
         CHURN_SPREAD is how hard the rank bites, at 2 giving roughly 0.5% churn
         for the strongest CSM and 10% for the weakest. The mean of attainmentFor
         is SPREAD_MEAN, so the multiplier averages 1 and the centre is the
         company's churn. */
      const churnRate = Math.max(.01, Math.min(.35,
        0.055 * (1 + CHURN_SPREAD*(SPREAD_MEAN - (owner.attain||SPREAD_MEAN)))));
      const lost = rnd() < churnRate;
      pending.push({account:account(), rep:owner.name, role:"CS", type:"Renewal", acv,
            createdBy:"CS",
            status:lost?"Lost":"Won", stage:lost?"Closed Lost":"Closed Won"});
      // Expansion is a real selling motion, so it has to be able to fail and to be
      // in flight. Every expansion used to generate as already Won, which left no
      // win rate and nothing for coverage to compute against, killing half the CS
      // view. Won stays at the same rate it always was so CS economics do not move;
      // the losses and open deals are added on top.
      const expansion = (status, stage) => {
        // Expansion is nearly always the newer module, so it takes the strategic tier.
        pending.push({account:account(), rep:owner.name, role:"CS", type:"Expansion",
              acv:Math.round(acv*(0.15+rnd()*0.35)/1000)*1000, tier:"strategic",
              createdBy:"CS", status, stage});
      };
      /* Expansion follows the CSM too, and for the same reason. A flat 20% won
         rate for everybody left every CS team expanding at the same clip: on
         #large the four teams landed within 14% of each other, so a threshold
         anywhere near them sat on top of all four at once and the closest a
         preset could get to the component's 70% line put one team on 69.8%.
         A CSM who keeps their accounts is also the one who grows them, so the
         same rank drives both, centred the same way so the company's expansion
         is unchanged. The lost and open rates stay flat: what varies by CSM is
         how much they land, not how much they attempt. */
      const expWinRate = Math.max(.02, Math.min(.45,
        0.20 * (1 + EXP_SPREAD*((owner.attain||SPREAD_MEAN) - SPREAD_MEAN))));
      if (rnd() < expWinRate) expansion("Won","Closed Won");
      if (rnd()<0.20) expansion("Lost","Closed Lost");
      if (rnd()<0.10) { const cd = carryDates(rnd()); expansion("Open", cd.stage);
                        Object.assign(pending[pending.length-1], cd); }
    }
    // Same curve treatment per CSM, for the same reason it was needed for AEs.
    const byRep={};
    pending.forEach(d=>{ (byRep[d.rep]=byRep[d.rep]||[]).push(d); });
    const groups=Object.values(byRep);
    /* RENEWALS DO NOT CLOSE ON THE SALES CURVE. closeWeeks is built from the AE
       close distribution, a hockey stick that puts 41% of a quarter in the last
       three weeks, and the renewal book was being dealt through it: the comment
       above says a CSM's book renews on its own schedule and then the code gave
       it the sales team's. A renewal lands on its contract anniversary, and
       anniversaries are spread across a quarter rather than piled at the end.
       Spread evenly, with a jitter so two accounts do not renew in lockstep and
       an offset per CSM so the weeks do not line up across the team. */
    groups.forEach((list,gi)=>{
      const closed=list.filter(d=>d.status!=="Open");
      const off=gi/Math.max(1,groups.length);
      closed.forEach((d,j)=>{
        const q=((j+0.5+off)/Math.max(1,closed.length) + (rnd()-0.5)*0.12);
        // Spanned across the whole quarter rather than rounded into its middle.
        // With three or four renewals each, the old form put #mixed's entire book
        // through by week 11 and the card said "the whole book has come up" with
        // three weeks still on the clock.
        d.week=Math.min(QTR_WEEKS, Math.max(1, 1 + Math.round(q*(QTR_WEEKS-1))));
        push(d); });
      list.filter(d=>d.status==="Open").forEach(d=>{ d.week=null; push(d); });
    });
  }

  /* ---------- WHAT THE SDRs CREATED THIS QUARTER ----------
     Creation is generated as its own series rather than read off the AE deals,
     because outside SMB they are different cohorts: what an SDR creates this
     quarter mostly closes next quarter or next year, and what closes this
     quarter was created before it. Reading creation off the closing deals
     would report every enterprise SDR at a fraction of target for a quarter
     they actually worked normally.
     The createdByRep attribution on the AE deals still answers its own
     question, which is who created the pipeline that is closing now, and that
     is what the SDR's deferred commission is paid on.
     Creation is flat across the quarter, not hockey-sticked. Booking meetings
     and creating opportunities is weekly work; it does not pile into week 13
     the way closing does, and pacing an SDR against the closing curve would
     tell them they are ahead every week until they are suddenly not. */
  L.created=[];
  const sdrQtrTarget = p.sdrQuota/4;
  sdrs.forEach((s,si)=>{
    // The SDR quota is a COUNT, of meetings held or opportunities created, so
    // attainment is a count against a count. Value rides along on each record
    // because the enterprise plan pays a second component on it.
    const n     = Math.max(1, Math.round(sdrQtrTarget*s.attain));
    let sizes   = p.early ? new Array(n).fill(0)
                          : Array.from({length:n},()=>Math.round((0.5+rnd()*1.3)*p.acv/1000)*1000);
    for(let j=0;j<n;j++){
      let q=((j+0.5+(si/Math.max(1,sdrs.length)))/n)%1 + (rnd()-0.5)*(1/n);
      q=((q%1)+1)%1;
      const wk=Math.min(QTR_WEEKS, Math.max(1, Math.ceil(q*QTR_WEEKS)));
      /* WHAT BECAME OF THE MEETING. Only on a meetings plan, where it is the
         one thing that view cannot otherwise answer: the deals carrying an
         SDR's name are generated independently of their meetings, so "34% of
         what you hand over closes" is true of that pipeline and says nothing
         about these rooms. Javier, 15 Oct.

         Dealt rather than discovered, which is what this engine does with
         every other distribution, and dealt against MEETING_TO_PIPE, the rate
         the meeting volume was SIZED on at line 627, so the outcome and the
         quota agree by construction instead of through a second invented
         number. A meeting needs time to turn into anything, so one held
         inside the last fortnight is still pending rather than a failure;
         that is what `oppWeek` carries. */
      const becameOpp = p.early ? (rnd() < MEETING_TO_PIPE) : null;
      L.created.push({sdr:s.name, week:wk, acv:sizes[j], account:account(),
        unit: p.early?"meeting":"pipeline", accepted: rnd()>SDR_REJECT,
        becameOpp: becameOpp,
        oppWeek: becameOpp ? Math.min(QTR_WEEKS, wk + 1 + Math.floor(rnd()*3)) : null});
    }
  });
  L.sdrQtrTarget = sdrQtrTarget;

  /* ---------------- AE EXPANSION ----------------
     The plan can pay an AE a rate on expansion and the quarter never gave them
     any. Every expansion deal in the ledger belonged to a CSM, so on #full an AE
     was told they earn 8% on expansion and handed nothing to earn it on, and no
     finding could catch it because the AE set has no expansion field to read and
     commAt() takes new business attainment and nothing else. Javier, 30 Sep,
     after the tracker surfaced a column of zeros.

     DEALT LAST, ON ITS OWN STREAM. Every rnd() call above has already run by the
     time this block starts, and it draws from a generator of its own, so not one
     existing deal, close week, win rate or attainment moves. Same guarantee the
     stale-deal work bought by reusing an existing call, reached the other way.

     FOUR RULES, each of them protecting a number somebody already signed off:

     Typed "Expansion", so every calculation denominated in the new business
     number filters it out. An AE's quota is new business, their win rate is a new
     business win rate, and coverage is pipeline against the gap to that quota.
     Blending expansion into any of those overstates it, and p.winRate is not
     cosmetic: it sizes the SDR team through oppsNeeded.

     Closed in the first three weeks. A deal that resolves in week 3 is in the
     open set for two weeks and never again, so from week 3 on coverage, the
     stale count and every pipeline card see exactly what they saw before. It
     also means an expansion deal can never become a stale one.

     The top half of the AE roster wins one; the bottom half loses one. Javier
     asked for the top reps as a safeguard against pushing anybody over quota,
     and the type filter already makes that impossible, so this is belt and
     braces. It is also the realistic answer, since the reps working their base
     hardest are the ones landing expansion, and it makes the zero case
     deterministic rather than lucky: half the roster closes none, on every plan,
     which is what the manager and CEO cards are written against. The losses are
     not arithmetic, they are the difference between a team that ignored the
     installed base and one that went after it and missed.

     On accounts the AE already owns, so no dollar is credited twice and the CS
     expansion set is untouched. On a plan with no CS team this is the only
     expansion in the file, which is right for a plan that pays AEs for it. */
  L.aeExp = false;
  if (p.expRate > 0 && p.aes > 0) {
    let s2 = (seed ^ 0x5f3a) >>> 0;
    const r2 = () => (s2 = (s2 * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    /* THE WEAKEST TEAM CLOSES NONE, WHICH IS THE WHOLE POINT OF THE MANAGER CARD.
       Ranking reps company-wide and letting the top third win spreads winners
       across every team: the thinnest any team came out was one in eight, and a
       team that closed nothing was unreachable on every preset. A card whose red
       no plan can produce is a card nobody reads, which is the hard-to-reach
       argument we have had before. So the weakest AE team by attainment is out
       entirely wherever there is more than one, which is also the honest story: a
       team under water on new business has no room to work the installed base. */
    const teamAtt = {};
    aes.forEach(a => { (teamAtt[a.team] = teamAtt[a.team] || []).push(a.attain || 0); });
    const teamRank = Object.entries(teamAtt)
      .map(([t, v]) => [t, v.reduce((x, y) => x + y, 0) / v.length])
      .sort((x, y) => y[1] - x[1]);
    const excluded = teamRank.length > 1 ? String(teamRank[teamRank.length - 1][0]) : null;
    const eligible = aes.filter(a => String(a.team) !== excluded);
    const ranked = [...aes].sort((a, b) => (b.attain || 0) - (a.attain || 0));
    const winners = Math.max(1, Math.floor(eligible.length / 2));
    let taken = 0;
    /* The excluded team gets no expansion deal at all, won or lost, which is what
       makes three tones possible rather than two. A rep who tried and lost is a
       different conversation from a rep with nothing against the installed base
       in their quarter, and without this every non-winner had a loss and the red
       case fired nowhere. So: the top half of the eligible reps win one, the rest
       of the eligible reps lose one, and the weakest team has neither. */
    ranked.forEach((ae, i) => {
      if (String(ae.team) === excluded) return;
      const won = taken < winners;
      if (won) taken++;
      /* Sized off the rep's own quarterly quota, not off average deal size.
         Deal size was the first attempt and it does not scale: on #clean, where
         one deal is $163K, eight expansion deals came to $1.3M and expansion
         would have been a fifth of the company's new business. Ten per cent of a
         quarter's quota is the same assumption the capacity model already prices
         expansion at, which keeps the two files saying the same thing. */
      const acv = Math.max(1000,
        Math.round((0.6 + r2() * 0.8) * AE_EXP_SHARE * (p.quota / 4) / 1000) * 1000);
      push({account: account(), rep: ae.name, owner: ae, role: "AE", type: "Expansion",
            acv, createdBy: "AE", createdByRep: null, createdWeek: 1 - Math.max(2, p.cycleWeeks || 8),
            status: won ? "Won" : "Lost", stage: won ? "Closed Won" : "Closed Lost",
            week: 1 + (i % 3)});
    });
    L.aeExp = true;
  }

  L.reps=[...aes,...sdrs,...css];
  /* THE CEO HAS A NAME. The org tree on the admin's screen hangs every
     department off the CEO, so the CEO is a row like any other and a row needs
     a person. Drawn from its OWN stream rather than from `name()`, so every
     rep, CSM, SDR and manager in every preset keeps the name they already had
     and no existing figure moves. Javier, 15 Oct. */
  const rndC = rng(seed+"|ceo");
  const pickC = a => a[Math.floor(rndC()*a.length)];
  let cn; do { cn = pickC(FIRST_X)+" "+pickC(LAST_X); } while (used.has(cn));
  used.add(cn);
  L.ceo = {name: cn, role: "CEO"};
  L.seed=seed;
  return L;
}

/* ==========================================================================
   QUARTER STATE AS OF A WEEK
   The ledger is a finished quarter. Every persona view reads it at a point in
   time, so this layer re-derives the quarter as it stood in week W. The rule
   that makes it honest: a deal that closes in week 12 is an OPEN deal in week
   5, not a win and not absent. Without that, coverage, win rate to date and
   every pace finding would be reading the answer sheet.
   Nothing here is a new source of truth. It is arithmetic on the ledger, so
   pulling a comp lever cannot change it, which is the same reason the ledger
   is built from the business answers only.
   ========================================================================== */
const sum = (a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);
// Weight of the prior when estimating a rep's win rate, expressed in deals.
const K_WIN = 8;
const safeDiv = (a,b)=> b ? a/b : 0;

// A deal that has not closed yet has to show a stage. The further out its
// close week, the earlier the stage: a deal closing next week is not sitting
// in Discovery. Deterministic, because guessing twice would give two answers.
function openStage(weeksOut, type){
  if (type === "Renewal")
    return weeksOut>=5 ? "Renewal Identified" : weeksOut>=2 ? "Quote Sent"
         : "Negotiation";
  return weeksOut>=8 ? "Discovery" : weeksOut>=5 ? "Demo"
       : weeksOut>=2 ? "Proposal"  : "Negotiation";
}

/* Weeks in the stage the deal is in now. A deal walking toward a close enters
   a new band every few weeks, so its figure is always small. A slipping deal
   never moves, so its figure is the weeks since it was created, which starts
   the quarter already past a month and grows. That asymmetry is the signal.
   THE SLIP WINDOW is how far out a slipping deal is always forecast: the rep
   pushes the date a fortnight at a time. */
const SLIP_WINDOW = 2;
function weeksInStage(weeksOut, type){
  /* THE BANDS HAVE TO MATCH THE LADDER. Three stages means three bands, or a
     renewal's weeks-in-stage resets while the stage name does not move, which
     is a figure contradicting the word beside it. */
  if (type === "Renewal")
    return weeksOut>=5 ? Math.min(5, weeksOut-4) : weeksOut>=2 ? 5-weeksOut
         : 2-weeksOut;
  return weeksOut>=8 ? Math.min(5, weeksOut-7) : weeksOut>=5 ? 8-weeksOut
       : weeksOut>=2 ? 5-weeksOut : 2-weeksOut;
}
function dealsAsOf(L, week){
  const won=[], lost=[], open=[];
  L.deals.forEach(d=>{
    if (d.status==="Open" || d.week==null || d.week>week){
      const idn = parseInt(String(d.id).replace(/\D/g,""),10)||0;
      const parked = d.status==="Open" ? d.parkedDeal===true
      /* A deal that resolves can have been parked on the way to closing: one
         in four of the ones that close from week eight on. It shows as stuck
         until the week it lands, and then it is simply won or lost, which is
         why the stale count falls through the quarter. */
                   : (idn % 4 === 0 && (d.week||0) >= 8);
      const out = (d.week||QTR_WEEKS)-week;
      /* THE LIFE OF A PARKED DEAL, in three acts.
         It came out of last quarter and stopped moving a week or two either
         side of the new quarter starting (stallStart). It takes ONE step, most
         of them in the clean-up week, because a deal that sat in Demo from
         January to March with an end-of-quarter date is a deal a manager would
         have killed. Then it stalls again in the new stage and is pushed into
         next quarter in the final week. So the figure the card prints runs
         four to seven weeks before the step and climbs back to eight or so by
         the close, rather than reading twenty. */
      const stallStart = -6 + (idn % 4);            // last quarter, weeks -6 to -3
      /* THE CLEAN-UP WEEK. Pipeline hygiene is not something that happens a
         little every week, it happens when somebody runs a pipeline review, so
         most parked deals move in the same couple of weeks and the rest trickle.
         Six in ten step in week 5 or 6; the others are spread from week 3 to 10.
         Javier, 7 Oct: the dip should be visible, it just should not be a cliff. */
      const stepWeek   = (idn % 10 < 6) ? 6 : 3 + (idn % 8);
      /* Each deal carries its own patience, six to eight weeks, rather than the
         whole population sharing one clock. With a single threshold every
         parked deal went stale again on the same week, which is what produced a
         near-empty week 7 in the middle of the quarter. */
      const stallFor   = STALL_WEEKS + (idn % 3);   // 6 to 8
      /* Three in four parked deals take the step, including the ones that go on
         to close: a deal that lands in week 10 moved at some point to get
         there. The other one in four is never cleaned up at all. It sits in the
         same stage from last quarter to this one and gets pushed at the end,
         which is the deal every pipeline review misses and every manager knows
         about. Without it the middle of the quarter had almost no stale deals
         at all, because the review emptied the set in one week. */
      const cleaned = (idn % 4) !== 0;
      const stepped = parked && cleaned && week >= stepWeek;
      const pushed  = parked && d.status==="Open" && week >= QTR_WEEKS;
      /* The expected close is a FORECAST, what the rep has in the CRM, not the
         week it truly resolves, or the open table would leak which deals land
         and when. A parked deal is forecast two weeks out, week after week,
         until it steps; after the step the promise becomes the end of the
         quarter, and in the final week it moves into next quarter. */
      const exp = pushed ? QTR_WEEKS + 2 + (idn%5)
        : parked ? (stepped ? QTR_WEEKS : week + SLIP_WINDOW)
        : d.status==="Open" ? d.expectedClose
        : Math.max(week+1, (d.week||QTR_WEEKS) + (idn%3) - 1);
      const wis = stepped ? week - stepWeek + 1 : week - stallStart;
      open.push(Object.assign({}, d, {status:"Open", week:null, expectedClose:exp, stepped, pushed,
        /* A deal that resolves carries "Closed Won" or "Closed Lost" in the
           record, which is what it becomes, not where it sits while open. A
           parked one shows the early stage it is stuck in, and the next stage
           along once it has taken its step. */
        stage: parked ? (stepped ? nextStage(d.status==="Open" ? d.stage : earlyStageFor(d.type, idn%2), d.type)
                                 : (d.status==="Open" ? d.stage : earlyStageFor(d.type, idn%2)))
             : d.status==="Open" ? openStage(exp-week, d.type) : openStage(out, d.type),
        weeksInStage: parked ? wis
             : d.status==="Open" ? weeksInStage(exp-week, d.type) : weeksInStage(out, d.type),
        /* Stale is a computed state, not a label: parked long enough to matter
           and still carried as closing inside the quarter. */
        stale: parked && wis >= stallFor}));
    } else if (d.status==="Won") won.push(Object.assign({}, d, {weeksInStage: week-d.week+1}));
    else lost.push(Object.assign({}, d, {weeksInStage: week-d.week+1}));
  });
  return {won, lost, open};
}

/* WEEK 14 IS NOT A WEEK. It is the state after the quarter has ended, and it
   exists because the tool was of two minds about week 13: the kicker findings
   spoke in the past tense as though the quarter were over, while sixteen others
   still talked about what could close. Both readings are defensible and they
   cannot both be true at once.
   So week 13 is now the last week still in progress, with one week left rather
   than none, and the closed state is where anything that judges a finished
   quarter belongs. The data is identical, the deals are the same deals; what
   changes is whether the reader is being told what could still happen. */
/* CLOSED IS A STATE, AND "closed" IS HOW YOU ASK FOR IT.
   The sentinel itself is fine and always was: it is converted to week 13 plus a boolean
   on the next three lines, so nothing downstream ever sees a fourteenth week. The problem
   was the call interface. Callers reached this function by passing the literal 14, which
   put a week that does not exist into a builder's command line, a checker's case list and
   a proof page's slider, and a reader of `["miss", 14]` in tracker-check.js would
   reasonably conclude there are fourteen weeks in this quarter. Javier, 2 Oct: every
   quarter is thirteen weeks, so we do not need the number.
   So the string "closed" is the way to ask, CLOSED is exported for anyone who wants the
   number, and the literal still works because breaking a call signature to make a label
   nicer is not a trade worth making. */
const CLOSED = QTR_WEEKS + 1;
function quarterState(p, L, week){
  const asked = (typeof week === "string" && week.toLowerCase() === "closed") ? CLOSED : week;
  week = Math.max(1, Math.min(CLOSED, asked|0));
  const isClosed = week===CLOSED;
  const asOf = isClosed ? QTR_WEEKS : week;
  week = asOf;                    // everything downstream reads a real week, not 14
  const D = dealsAsOf(L, asOf);
  /* Weeks AFTER this one. Week N holds everything that closed by the end of
     week N, so week 13 already carries the final numbers and has none left.
     This counted the current week too, which made every card a week generous. */
  const S = {week: asOf, closed: isClosed, weeksLeft: isClosed ? 0 : QTR_WEEKS-asOf,
             pace: PACE[asOf], deals: D};

  /* ---------------- AEs ---------------- */
  const aeRoster = L.reps.filter(x=>x.role==="AE");
  /* One row builder, used for the reps and for a selling manager's own bag.
     A manager's quarter is generated by the same rules as a rep's, so it is
     read by the same code rather than by a second version of it that can
     drift. What differs is where the row is USED, not how it is built. */
  const aeRow = rep=>{
    /* NEW BUSINESS ONLY, EVERYWHERE THIS ROW IS USED AS A NUMERATOR.
       An AE's quota is new business, their win rate is a new business win rate,
       and coverage is pipeline against the gap to that quota. The expansion deals
       the ledger now deals them are typed, and everything below filters on the
       type, so attainment, commission, coverage, deals needed and the win rate
       that sizes the SDR team are all exactly what they were before expansion
       existed. What an AE earns on expansion is its own pair of fields at the
       bottom of this row, the way a CSM's expansion sits beside their retention
       rather than inside it. */
    const isNB = d => d.role==="AE" && d.type!=="Expansion";
    const won  = D.won .filter(d=>d.rep===rep.name && isNB(d));
    const lost = D.lost.filter(d=>d.rep===rep.name && isNB(d));
    const open = D.open.filter(d=>d.rep===rep.name && isNB(d));
    const expWonD  = D.won .filter(d=>d.rep===rep.name && d.role==="AE" && d.type==="Expansion");
    const expLostD = D.lost.filter(d=>d.rep===rep.name && d.role==="AE" && d.type==="Expansion");
    const expOpenD = D.open.filter(d=>d.rep===rep.name && d.role==="AE" && d.type==="Expansion");
    const closed = sum(won, d=>d.acv);
    const quota  = p.qQuota;
    const attain = safeDiv(closed, quota);
    const gap    = Math.max(0, quota-closed);
    const openV  = sum(open, d=>d.acv);
    // A rep who has resolved nothing has no win rate, and "your 0% win rate" is
    // both false and cruel. Fall back to the plan's rate until there is evidence.
    // A rep's win rate is SMOOTHED toward the plan's rather than switched on at a
    // threshold. A threshold fixed the worst sentence ("your 0% win rate") and
    // left the jumpiness: at nine resolved deals one more loss moved the observed
    // rate from 12.5% to 10%, and because coverage inverts it, the bar a rep is
    // measured against jumped from 8x to 10x in a week where nothing they did
    // changed. K_WIN is the weight of the prior in deals: eight resolved deals
    // sit halfway to their own number, forty sit almost entirely on it, and by
    // the end of a quarter it IS their number.
    /* The prior is the OTHER AEs' observed rate, not this rep's own dealt one.
       It used to be the dealt one, which is a number the engine keeps to itself:
       it decides how many deals a rep actually wins, and it sits anywhere from
       ten points below the team's rate to twenty above it. So a rep one win and
       one loss into the quarter was shown "50%", and the only reason it said 50%
       was a figure nothing on the screen could account for. Not his two deals,
       not the team's 29%. No label can rescue that, which is what three attempts
       at the wording proved.
       Blending toward the peers makes every figure on the card reconstructable:
       with nothing resolved it IS the team's rate, with a full quarter behind it
       it IS the rep's own, and in between it is a mix of two numbers both on
       screen. It also makes the label that was already there true, "the team's"
       early and "your" once most of the estimate is their own evidence.
       Peers exclude the rep, on the same argument the SDR conversion rate uses:
       a prior about you should not be built from you. */
    const resolvedN = won.length+lost.length;
    // The team's win rate is the prior this rep's own rate is blended against, so
    // it is a NEW BUSINESS win rate like the rate it informs. Without the filter an
    // expansion deal would quietly move the number that sizes the SDR team.
    const peerWon  = D.won.filter(d=>isNB(d) && d.rep!==rep.name).length;
    const peerLost = D.lost.filter(d=>isNB(d) && d.rep!==rep.name).length;
    const peerRes  = peerWon + peerLost;
    /* The peer rate is smoothed toward the plan's rate by the same estimator and
       the same weight, because a raw peer rate is unreliable for exactly the
       reason a raw personal one is. In week 1 on one preset the peers had
       resolved a handful of deals and won none of them, so the raw figure was 0%
       and the card read "at the team's 0% win rate a gap this size wants 20.0x",
       which is a bar nobody can clear stated with total confidence. Smoothed, it
       cannot reach zero while the plan's own rate is above it, and it still
       becomes the peers' real number once they have a quarter behind them. */
    const teamWR   = (peerWon + K_WIN*p.winRate) / (peerRes + K_WIN);
    const wr     = (won.length + K_WIN*teamWR) / (resolvedN + K_WIN);
    const avg    = won.length ? closed/won.length : p.acv;
    const top    = open.slice().sort((a,b)=>b.acv-a.acv)[0] || null;
    /* commAt() is written against the ANNUAL quota and returns an annual-scale
       commission, because the plan view uses it for whole-year scenarios. Every
       number in here is one quarter, so it has to be quartered. Without this a
       rep at 149% was shown $76,800 for a quarter against a $36,000 annual
       variable, and the CEO's cost of revenue read 36% instead of 9%. */
    const comm   = commAt(p, attain)/4;
    const withTop    = (top ? commAt(p,(closed+top.acv)/quota) : commAt(p, attain))/4;
    const paceTarget = PACE[week]*quota;
    return {
      name:rep.name, role:"AE", team:rep.team, teamAttain:rep.teamAttain, kicker:rep.kicker,
      finalAttain:rep.attain, quota, closed, attain, gap, open:openV, openCount:open.length,
      coverage: safeDiv(openV*wr, gap), openRaw:openV,
      won:won.length, lost:lost.length,
      // "Your win rate" only once two thirds of the estimate is their own
      // evidence, which is twice the prior's weight. At K_WIN itself the blend is
      // exactly half the plan's number, and calling that theirs is an overclaim.
      winRate: wr, winRateFromOwn: resolvedN>=2*K_WIN, resolvedDeals: resolvedN,
      winRateTrue: rep.winRate||p.winRate,
      avgDeal: avg, dealsNeeded: Math.ceil(safeDiv(gap, avg)),
      topOpen: top, topOpenPct: top ? safeDiv(top.acv, gap) : 0,
      openWeighted: openV*wr,
      comm, commWithTop: withTop, commAt100: commAt(p,1)/4,
      /* Expansion, beside the commission rather than inside it. comm is what the
         kicker takes a share of and what the quota cards are written against, so
         nothing that reads comm changes; anything reporting total earnings adds
         expComm to it. expRate is 0 on a plan that pays AEs nothing for
         expansion, and there are no expansion deals on those plans either. */
      expWon: sum(expWonD, d=>d.acv), expLost: sum(expLostD, d=>d.acv),
      expOpen: sum(expOpenD, d=>d.acv),
      expCount: expWonD.length, expLostCount: expLostD.length,
      expComm: sum(expWonD, d=>d.acv) * (p.expRate||0),
      expRate: p.expRate||0,
      paceTarget, paceGap: paceTarget-closed, ahead: closed>=paceTarget,
      belowDecel: p.decel.thr!==null && attain < p.decel.thr,
      /* belowDecel is true of where a rep stands TODAY and it is what the plan
         would pay if the quarter ended now, so it stays. But it is a quarter-end
         line read weekly, and in week 5 every rep in the company is under it:
         16 of 16 on the full preset, still 16 of 16 in week 7, and it does not
         discriminate until week 11. A card that fires on it spends two thirds of
         the quarter telling everybody the same thing.
         offDecelPace is the same line read against the clock: not below 70%, but
         below the trajectory that lands at 70%. sdr-s1-mtg-red already works
         this way. At quarter close pace is 1 and the two are identical. */
      offDecelPace: p.decel.thr!==null && attain < PACE[week]*p.decel.thr,
      // Cleared by the team, and whether this rep's own number lets them keep it.
      teamCleared: !!rep.teamCleared,
      kickerEligible: p.hasKicker && (p.decel.thr===null || attain >= p.decel.thr),
      toAccel: Math.max(0, quota-closed),
      /* "Past the proposal" on whichever ladder the deal is on. Without the
         renewal names a renewal under negotiation stopped counting as late
         stage, which is the findings tail of the ladder change. */
      lateStage: open.filter(d=>["Proposal","Quote Sent","Negotiation"].includes(d.stage)).length,
      /* The stale deals: parked in an early stage since before the quarter,
         still carried as closing in two weeks. Coverage counts them like any
         other open deal, which is the point the finding makes. */
      slipN: open.filter(d=>d.stale).length,
      slipV: sum(open.filter(d=>d.stale), d=>d.acv),
      slipMinWeeks: Math.min(99, ...open.filter(d=>d.stale).map(d=>d.weeksInStage||0)),
      slipStages: [...new Set(open.filter(d=>d.stale).map(d=>d.stage))],
      slipPushed: open.filter(d=>d.stale && d.pushed).length,
      /* What the forecast on those deals actually says, so a card can read the
         dates rather than assert one. */
      slipExpMin: Math.min(99, ...open.filter(d=>d.stale).map(d=>d.expectedClose||99)),
      slipExpMax: Math.max(0, ...open.filter(d=>d.stale).map(d=>d.expectedClose||0))
    };
  };
  S.aes = aeRoster.map(aeRow).sort((a,b)=>b.attain-a.attain);
  /* Selling managers, kept out of S.aes on purpose. Every AE statistic on this
     object counts reps, and a manager is not one of their own reps. */
  S.mgrSellers = (L.mgrSellers||[]).map(m=>
    Object.assign(aeRow(m), {role:"MGRSELL", team:m.team, isManager:true}));

  /* ---------------- SDRs ----------------
     Two different numbers, deliberately kept apart. Created is this quarter's
     work against this quarter's target. Attributed is the pipeline they created
     in earlier quarters that is resolving now, which is what their deferred
     component is actually paid on. Merging them would flatter short cycles and
     bury long ones. */
  const sdrRoster = L.reps.filter(x=>x.role==="SDR");
  /* An SDR or CSM was carrying the COMPANY attainment as their "team" number:
     not their team, not their manager's team, the whole company. Nothing read it
     yet, which is why it never printed a wrong sentence, but it was one finding
     away from doing so. Kicker is false for both because their plans have no
     kicker component. */
  const ownTeamAttain = () => null;   // filled in below, once S.teams exists
  S.sdrs = sdrRoster.map(rep=>{
    const mine    = (L.created||[]).filter(c=>c.sdr===rep.name);
    const toDate  = mine.filter(c=>c.week<=week);
    /* The target is denominated in ACCEPTED opportunities: the plan page says pay
       is counted once the AE has accepted it and moved a stage. Attainment used
       toDate.length, which includes the ones that were rejected, so a rep was
       measured on 34 while being paid on 31. createdCount keeps the logged total
       for the acceptance findings; everything about attainment reads accepted. */
    const logged  = toDate.length;
    /* Acceptance is the gate on an opportunity plan, where the AE has to accept it
       and move a stage. It is NOT the gate on an early-stage plan, which pays per
       meeting HELD: the meeting happened whether or not anything came of it.
       Counting accepted on both under-paid every early-stage rep by the rejection
       rate. */
    const created = p.early ? logged : toDate.filter(c=>c.accepted).length;
    const createdValue = sum(toDate, c=>c.acv);    // the enterprise value component
    const target  = L.sdrQtrTarget;
    const attWon  = D.won .filter(d=>d.createdByRep===rep.name);
    const attLost = D.lost.filter(d=>d.createdByRep===rep.name);
    const attOpen = D.open.filter(d=>d.createdByRep===rep.name);
    const flat    = target*(week/QTR_WEEKS);           // creation paces flat
    const row = {
      name:rep.name, role:"SDR", team:rep.team, teamAttain:ownTeamAttain(rep), kicker:false,
      /* NOT "pipeline". That is the name of the VALUE component, so calling
         the COUNT by it left the value component nameless and printed
         "Pipeline 30 of 50" about a number of opportunities. Javier, 15 Oct. */
      finalAttain:rep.attain, unit:p.sdrUnit,
      created, createdValue, createdCount:logged, target,
      attain:safeDiv(created,target),
      gap: Math.max(0, target-created), paceTarget:flat, paceGap:flat-created,
      perWeek: safeDiv(target, QTR_WEEKS), perWeekSoFar: safeDiv(created, week),
      accepted: toDate.filter(c=>c.accepted).length,
      acceptRate: safeDiv(toDate.filter(c=>c.accepted).length, toDate.length),
      avgOpp: toDate.length ? createdValue/toDate.length : p.acv,
      attWon:attWon.length, attLost:attLost.length, attOpen:attOpen.length,
      attOpenValue: sum(attOpen, d=>d.acv), attWonValue: sum(attWon, d=>d.acv),
      conv: safeDiv(attWon.length, attWon.length+attLost.length)
    };
    /* One earned figure, read by the cards, the findings and the SDR view, so
       no consumer has to rebuild the weighting and get it half right. */
    row.earned = sdrEarn(p, row);
    return row;
  }).sort((a,b)=>b.attain-a.attain);

  /* ---------------- CSMs ----------------
     Retention depletes and expansion accumulates, so they run in opposite
     directions and never share a bar. */
  const csRoster = L.reps.filter(x=>x.role==="CS");
  S.css = csRoster.map(rep=>{
    const ren   = L.deals.filter(d=>d.rep===rep.name && d.type==="Renewal");
    const done  = ren.filter(d=>d.week!=null && d.week<=week);
    const held  = sum(done.filter(d=>d.status==="Won"), d=>d.acv);
    const churn = sum(done.filter(d=>d.status==="Lost"), d=>d.acv);
    const pend  = sum(ren, d=>d.acv) - held - churn;
    // role as well as name, now that an AE can carry expansion too. Names are unique
    // today, so this changes nothing and stops a collision paying a CSM for an AE's deal.
    const exp   = L.deals.filter(d=>d.rep===rep.name && d.role==="CS" && d.type==="Expansion");
    const expWon= sum(exp.filter(d=>d.status==="Won" && d.week!=null && d.week<=week), d=>d.acv);
    const expOpen=sum(exp.filter(d=>d.status==="Open" || (d.week!=null && d.week>week)), d=>d.acv);
    /* ANNUAL TARGET, QUARTERLY RESULT. p.csExpTarget is built from p.csVariable,
       which is annual OTE times the variable share, so it is a year's expansion
       target. This compared it to one quarter of expansion deals, which is the
       same units bug commAt() exists to avoid on the commission side, and the
       AE ledger already divides p.quota by four for exactly this reason.
       Every CSM and every CS manager was being read against four quarters of
       target in one quarter: #full sat at 43% of "target" when the same book
       against a quarter's worth was 172%. It also made the CS manager's new
       expansion component unpayable on every preset, and made cs-s2-red, "the
       target is above what the book is carrying", fire on plans where it is not.
       Against a quarterly target the population runs p10 0%, p50 46%, p90 312%
       with 32% of CSMs clearing it: a real spread that straddles the line, so
       the generator needs no retuning on top of this. */
    const expTgt= (p.csExpTarget||0)/4;
    return {
      name:rep.name, role:"CS", team:rep.team, teamAttain:ownTeamAttain(rep), kicker:false,
      finalAttain:rep.attain, book:p.csBook,
      atRisk: sum(ren, d=>d.acv), held, churned:churn, pending:pend,
      retention: (held+churn)>0 ? held/(held+churn) : null,
      resolved: (held+churn)>0, retFloor:p.retFloor!=null?p.retFloor:RET_FLOOR,
    retTarget:p.retFull!=null?p.retFull:RET_FULL,
      retWith: safeDiv(held+pend, held+churn+pend),
      retWithout: safeDiv(held, held+churn+pend),
      pendingCount: ren.filter(d=>d.week==null||d.week>week).length,
      expWon, expOpen, expTarget:expTgt, expGap:Math.max(0, expTgt-expWon),
      expCoverage: safeDiv(expOpen, Math.max(0, expTgt-expWon)),
      expCount: exp.filter(d=>d.status==="Won" && d.week!=null && d.week<=week).length,
      topAccount: done.slice().sort((a,b)=>b.acv-a.acv)[0]||null
    };
  }).sort((a,b)=>b.retention-a.retention);

  /* ---------------- manager teams ----------------
     A team is the eight people a manager coaches, so every number here is over
     that set and never over the company. */
  const byRole = {AE:S.aes, SDR:S.sdrs, CS:S.css};
  /* One builder for a manager's team and for a whole function. The CEO view
     reads CS and SDR company-wide, and building those numbers a second way is
     how the CEO and the managers would come to disagree about the same
     people. A function is a team with every member of the role in it. */
  const makeTeam = m=>{
    const members = (byRole[m.manages]||[]).filter(x=>m.reps.includes(x.name));
    const unit    = m.manages==="AE" ? "closed" : m.manages==="SDR" ? "created" : "held";
    const actual  = sum(members, x=>x[unit]||0);
    /* A CS TEAM'S TARGET IS THE RETENTION BAR, NOT THE WHOLE BOOK. It used to be
       the book at risk, so the manager's component was scaled to holding 100% of
       it while every CSM under them is paid in full at RET_FULL, 95%. With the
       generator churning about 10%, every CS team in the tool landed at 88% to
       93%, six of the eleven finished with no CSM at their own target, and
       standing 1 read red from week 5 onward on every preset for a team doing
       nothing wrong. A manager whose entire team hit its number could not reach
       100% on the component that pays them.
       At 95% of the book the two bars are the same one: a team that retains what
       its CSMs are asked to retain reads 100%, and a team at 90% of the book
       reads 95% of target, which is the honest version of short. */
    const target  = m.manages==="AE" ? p.qQuota*members.length
                  : m.manages==="SDR" ? L.sdrQtrTarget*members.length
                  : sum(members, x=>x.atRisk) * (p.retFull!=null?p.retFull:RET_FULL);
    /* "CSMs at target" counted retention only, so a CSM who held their book and
       missed their expansion target entirely still counted as at target. Their
       plan is 60/40, and on the AE side "at quota" already means the rep's whole
       number. Both halves now. */
    /* Every measure the rep's own plan pays them on, whatever those measures are.
       atTargetTest is the one definition, up beside participationPay, and the two
       spreadsheet builders and their checkers read it rather than each carrying a
       rule of their own. */
    const atQuota = members.filter(atTargetTest(p, m.manages)).length;
    const belowGate = p.decel.thr===null ? 0
                    : members.filter(x=>(x.attain||0) < p.decel.thr).length;
    /* The same two counts read against the clock rather than against the finish
       line. Nobody is at 100% of a quarterly quota in week 5, so atQuota is zero
       for eleven straight weeks on a team whose spread is perfectly healthy: the
       card built on it said the total was hiding the team while four of eight
       were at or above pace the whole time. These are what the judgement cards
       use; atQuota and belowGate stay for the components, which pay on the
       finish line and on nothing else. */
    /* A CSM whose book has not come up yet has not lost anything, so they are
       keeping up. Counting them as behind put "only one of five is keeping up"
       on a team holding 100% of everything that had resolved. */
    /* Only CSMs whose book has started coming up are counted, because only they
       are in the denominator the card divides by. Counting the untouched ones as
       keeping up was the first attempt and it produced "four of one". */
    /* An SDR creates at an even rate, so keeping up means the share of the
       quarter gone, not the AE close curve, which runs well below it mid-quarter
       and counted SDRs as keeping up who were behind their own pace. */
    const atPace = m.manages==="CS"
      ? members.filter(x=>x.resolved && (x.retention||0) >= (p.retFull!=null?p.retFull:RET_FULL)).length
      : m.manages==="SDR"
      ? members.filter(x=>(x.attain||0) >= week/QTR_WEEKS).length
      : members.filter(x=>(x.attain||0) >= PACE[week]).length;
    const offGatePace = p.decel.thr===null ? 0
                    : members.filter(x=>(x.attain||0) < PACE[week]*p.decel.thr).length;
    const part    = safeDiv(atQuota, members.length);
    /* THE TILE THAT GAVE THIS AWAY. "the 5 this component needs" stayed 5 at
     every bar setting, because this read the constant while the pay beside it
     read the plan. 20 Oct. */
  const partBar = p.partTarget!=null ? p.partTarget : PARTICIPATION_TARGET;
  const needed  = Math.max(0, Math.ceil(partBar*members.length) - atQuota);
    /* WHAT IS STILL IN FRONT OF THIS TEAM, and it is a different thing for each
       of them. A CS member has no `open`, so this used to fall through to
       expOpen and measure EXPANSION PIPELINE against the RENEWAL BOOK. Every CS
       manager on every preset was told in week 1 that closing everything open
       left the quarter at 16% to 24%, when the true ceiling was 98% to 100%:
       the renewals simply had not come up yet. A category error, not a rounding
       one, and it read as a catastrophe on the one screen where nothing had
       happened at all.
       What is in front of a CS team is the renewals still to resolve. Those are
       NOT discounted by a win rate the way an AE's pipeline is, because a
       renewal is revenue the company already has unless it loses it, so the
       weighted figure is the same figure. Expansion has its own target and its
       own cards on the CS rep view and does not belong in this number. */
    const openV   = m.manages==="CS" ? sum(members, x=>x.pending||0)
                  : sum(members, x=>x.open||0);
    const openW   = m.manages==="CS" ? sum(members, x=>x.pending||0)
                  : sum(members, x=>x.openWeighted!==undefined ? x.openWeighted : 0);
    const attain  = safeDiv(actual, target);
    const closers = members.slice().sort((a,b)=>
      ((b.attain||b.retention||0)-(a.attain||a.retention||0)));
    return {
      manager:m.name, role:m.role, manages:m.manages, team:m.team, members,
      size:members.length, actual, target, attain, gap:Math.max(0,target-actual),
      /* A CS team's pace is not the sales close curve. What is on pace for them
         is holding RET_FULL of whatever has come up so far, so the benchmark is
         the share of the book already resolved and the readable number is the
         team's retention rate rather than a cumulative total. Both are needed:
         the rate is what the card says, the share is what it compares against. */
      resolvedShare: m.manages==="CS"
        ? safeDiv(sum(members, x=>(x.held||0)+(x.churned||0)), sum(members, x=>x.atRisk||0)) : null,
      // Null until something has resolved: 0% held of nothing is not a fact.
      retentionRate: m.manages==="CS" && sum(members, x=>(x.held||0)+(x.churned||0)) > 0
        ? safeDiv(sum(members, x=>x.held||0), sum(members, x=>(x.held||0)+(x.churned||0))) : null,
      /* The third component's numbers. For a CS team these are expansion; for an
         SDR team they are the VALUE of the pipeline created, against the count
         target priced at the company's average deal. One pair of fields because
         it is one slot in the plan, and every card that reads them picks its
         noun from t.manages. */
      expTarget: m.manages==="CS" ? sum(members, x=>x.expTarget||0)
               : m.manages==="SDR" && p.sdrWeights && p.sdrWeights.value
                 ? sum(members, x=>(x.target||0)*p.acv) : 0,
      expWon:    m.manages==="CS" ? sum(members, x=>x.expWon||0)
               : m.manages==="SDR" ? sum(members, x=>x.createdValue||0) : 0,
      expOpen:   m.manages==="CS" ? sum(members, x=>x.expOpen||0) : 0,
      expAttain: m.manages==="CS"
        ? safeDiv(sum(members, x=>x.expWon||0), sum(members, x=>x.expTarget||0))
        : m.manages==="SDR" && p.sdrWeights && p.sdrWeights.value
        ? safeDiv(sum(members, x=>x.createdValue||0), sum(members, x=>(x.target||0)*p.acv))
        : null,
      /* AE expansion gets fields of its own rather than the expWon slot above.
         That slot already means the book for a CS manager and pipeline value for
         an SDR manager, and every card reading it picks its noun from t.manages,
         so a third meaning is how a card ends up saying the wrong word about the
         right number. Zero and false on every team that is not an AE team. */
      aeExpPaid: m.manages==="AE" && (p.expRate||0) > 0,
      aeExpRev:  m.manages==="AE" ? sum(members, x=>x.expWon||0) : 0,
      aeExpLost: m.manages==="AE" ? sum(members, x=>x.expLost||0) : 0,
      aeExpComm: m.manages==="AE" ? sum(members, x=>x.expComm||0) : 0,
      aeExpReps: m.manages==="AE" ? members.filter(x=>(x.expCount||0)>0).length : 0,
      atQuota, belowGate, atPace, offGatePace,
      participation:part, participationGate:partBar,
      toGate:needed, open:openV,
      coverage: safeDiv(openW, Math.max(0,target-actual)),
      ceiling: safeDiv(actual+openV, target), kicker: p.hasKicker && attain>=KICK_LINE,
      finalAttain:m.attain,
      // What the reduced rate costs the people it lands on: the commission the
      // same closed revenue would have paid above the line, minus what it pays
      // below it. Never derived by dividing by the multiplier, which is zero on
      // a cliff plan and produced $NaN.
      decelCost: p.decel.thr===null ? 0 : sum(members.filter(x=>(x.attain||0)<p.decel.thr),
                   x=>(x.closed||0)*p.rate*(1-p.decel.mult)),
      // The same money over the people the card actually names. The conditional
      // names whoever is off the pace that clears the line, and pricing that
      // sentence with the cost across everyone below the line put "two of your
      // team" next to a figure belonging to eight of them.
      decelCostPace: p.decel.thr===null ? 0
                   : sum(members.filter(x=>(x.attain||0) < PACE[week]*p.decel.thr),
                         x=>(x.closed||0)*p.rate*(1-p.decel.mult)),
      order: closers,
      nearest: closers.filter(x=>p.decel.thr!==null && (x.attain||0)<p.decel.thr)
                      .sort((a,b)=>b.attain-a.attain)[0]||null,
      /* THE SELLING MANAGER'S OWN BAG, as a rep row. On a team of three or
         fewer `mgrWeights` puts 40% of the manager's variable on a quota they
         carry themselves, and until now the only trace of it anywhere was the
         pay card naming what it had paid. They own opportunities like anybody
         else, 48 of them on #small, so nothing was missing from the data; what
         was missing was the computed row the rep findings read, and the row
         builder above was written for exactly this and never called for it.

         It hangs on the TEAM and never joins `S.aes`. That list is the
         denominator for company attainment, reps at quota, the CEO's
         distribution and every manager's participation share, so putting a
         manager in it would take #small from two AEs to three and move every
         per-rep number in the tool. Their deals stay out of the team's number
         for the same reason, which is the rule this preserves rather than one
         it bends. Same quota as an AE, Javier, 14 Oct. */
      seller: mgrWeights(Math.ceil(m.team/m.n||members.length||1), m.manages||"AE").personal
        ? aeRow({name: m.name, team: m.name, kicker: false,
                 teamAttain: safeDiv(actual, target), teamCleared: false,
                 attain: safeDiv(sum((L.deals||[]).filter(d=>d.rep===m.name &&
                   d.status==="Won" && d.type!=="Expansion"), d=>d.acv), p.qQuota)})
        : null
    };
  };
  S.teams = L.managers.map(makeTeam);
  /* Every CSM and every SDR, whoever manages them, including roles on plans
     that have no manager for them at all. Not ranked, not compared: there is
     one of each. */
  S.fn = {
    CS:  S.css.length  ? makeTeam({name:null, role:"company", manages:"CS",  team:null,
                                   reps:S.css.map(x=>x.name),  attain:null}) : null,
    SDR: S.sdrs.length ? makeTeam({name:null, role:"company", manages:"SDR", team:null,
                                   reps:S.sdrs.map(x=>x.name), attain:null}) : null
  };
  S.teams.forEach((t,i)=>{
    const peers=S.teams.filter(x=>x.manages===t.manages).sort((a,b)=>b.attain-a.attain);
    t.rank = peers.indexOf(t)+1; t.peerCount = peers.length;
    t.top = peers[0]; t.bottom = peers[peers.length-1];
    t.spread = peers.length>1 ? peers[0].attain-peers[peers.length-1].attain : 0;
  });

  /* ---------------- the company ---------------- */
  /* Selling managers carry a real number and it belongs in the company's, both
     sides of it. Left out, the simulator generates revenue that appears nowhere
     and the CEO is reading a number that is missing a seller. Left in, company
     attainment no longer equals the sum of the teams, because a selling manager
     is on nobody's team: that is a fact about the org, not an error, and no CEO
     finding adds the teams up.
     Only closed, quota, open and commission move. The rep counts below, at
     quota, under 70%, the top-20% share, stay counts of REPS. */
  const mgrClosed = sum(S.mgrSellers, x=>x.closed);
  const mgrOpen   = sum(S.mgrSellers, x=>x.open);
  const mgrComm   = sum(S.mgrSellers, x=>x.comm);
  const closed = sum(S.aes, x=>x.closed) + mgrClosed;
  const quota  = p.qQuota*(p.aes + S.mgrSellers.length);
  const openV  = sum(S.aes, x=>x.open) + mgrOpen;
  const ranked = S.aes.slice().sort((a,b)=>b.closed-a.closed);
  const topN   = Math.max(1, Math.round(p.aes*0.20));
  const commSpend = sum(S.aes, x=>x.comm) + mgrComm;
  const baseComm  = sum(S.aes, x=>Math.min(x.attain,1)*p.variable/4);   // one quarter
  /* What the accelerator ADDED: each seller's commission over what the same
     revenue earns at the base rate, counted only where it is positive. It used
     to be total commission minus target commission, which counted three other
     things as accelerator pay: base-rate pay on revenue above quota, which
     that revenue earns with or without an accelerator; the whole commission
     of a selling manager, who is in commSpend and not in baseComm, which is
     how #small read 44%; and, netted the other way, the decelerator's saving.
     #full read $52,760 and 23% where the accelerator itself added $32,040 and
     14%. Selling managers are included because they are paid on the same
     curve. revAboveQuota is the revenue that uplift was paid on. */
  const sellersAll = [...S.aes, ...S.mgrSellers];
  const accelUplift = sum(sellersAll, x=>Math.max(0, (x.comm||0) - (x.closed||0)*p.rate));
  const revAboveQuota = sum(sellersAll, x=>Math.max(0, (x.closed||0) - (x.quota||0)));
  const repsAboveQuota = sellersAll.filter(x=>(x.attain||0)>1).length;
  /* WHAT THE MANAGERS ACTUALLY EARNED, not a quarter of their target prorated by
     the week. The old numerator could not move when a manager's pay moved: pull
     the reps-at-quota lever down and both managers on #full crossed into their
     participation component, their own tiles changed, and WHAT IT COST and COMP
     vs GROSS PROFIT sat still, because the company's only figure for manager pay
     was p.salesMgrVar at target. mgrPay is now the one definition, shared with
     the manager tiles, so the two cannot disagree. Javier, 21 Oct.

     `own` is deliberately left out. A selling manager's deals are dealt through
     the AE row builder and their commission is already inside commSpend, so
     adding the own-bag component here would count that money twice. It was
     being counted twice before, at target, inside p.salesMgrVar. */
  const mgrPaid = t=>{ const q = mgrPay(p, t); return q.teamPaid+q.partPaid+q.expPaid; };
  const mgrAccrued   = sum(S.teams.filter(t=>(t.manages||"AE")!=="CS"), mgrPaid);
  const csMgrAccrued = sum(S.teams.filter(t=>(t.manages||"AE")==="CS"), mgrPaid);
  /* SDR PAY, AS EARNED. It was p.sdrVar/4 prorated by the week, the same target
     figure manager pay used to carry, so an SDR team behind on pipeline cost the
     company exactly what an SDR team ahead of it did. `row.earned` is already
     the one definition, sdrEarn against the quarter's unit target, read by the
     SDR view, the cards and the findings; the company reads it too now. 22 Oct. */
  const sdrAccrued = sum(S.sdrs, x=>x.earned);
  const salesVarSpend = commSpend + sdrAccrued + mgrAccrued;
  /* THE WHOLE COMPANY'S VARIABLE, AS ACCRUED. WHAT IT COST was reading the
     plan's design ratio, p.costOfRev, so it answered "what would this plan cost
     at target" on a screen whose every other tile answers "what is happening".
     Its neighbour, COMP vs GROSS PROFIT, already read an actual. This is the
     actual with the same scope as p.costOfRev: every variable role over the
     revenue they are funded by, a quarter of the book included where there is a
     CS team, because p.revBase includes the book annually. */
  const csVarAccrued  = sum(S.css, x=>csPay(p, x));
  const totalVarSpend = salesVarSpend + csVarAccrued + csMgrAccrued;
  /* The book ramps with the week like everything else. A whole quarter of book
     under six weeks of accrued CS pay read 1.3% on #full against a design cost
     of 4.2%, which is not a cheap quarter, it is two different periods divided
     by each other. */
  const qRevBase      = closed + (p.hasCs ? (p.book/4)*(week/QTR_WEEKS) : 0);
  S.company = {
    closed, quota, attain: safeDiv(closed,quota), gap: Math.max(0,quota-closed),
    open: openV, coverage: safeDiv(sum(S.aes,x=>x.openWeighted), Math.max(0,quota-closed)),
    ceiling: safeDiv(closed+openV, quota),
    headcount: p.aes+p.sdrs+p.css+p.salesMgrs+p.sdrMgrs+p.csMgrs,
    atQuota: S.aes.filter(x=>x.attain>=1).length,
    below70: S.aes.filter(x=>x.attain<0.70).length,
    zeroShare: safeDiv(S.aes.filter(x=>x.closed===0).length, Math.max(1,p.aes)),
    topN, topShare: safeDiv(sum(ranked.slice(0,topN), x=>x.closed), Math.max(1,closed)),
    winRate: (sum(S.aes,x=>x.won) + K_WIN*p.winRate) /
             (sum(S.aes,x=>x.won+x.lost) + K_WIN),
    avgDeal: safeDiv(closed, Math.max(1,sum(S.aes,x=>x.won))),
    commSpend, baseComm, accelSpend: accelUplift, revAboveQuota, repsAboveQuota,
    /* AE EXPANSION, ITS OWN FIGURE AND OUT OF EVERY RATIO ABOVE.
       commSpend over closed is the cost of new business, and expansion revenue is
       not in closed, so putting expansion commission in the numerator would make
       the ratio look worse every time a rep expanded an account. That is the same
       correction the capacity model already carries, where expansion pay sits on
       its own memo row and outside the sales share. So it is reported here rather
       than folded in: what the company paid AEs for expansion, how much they
       landed, and how many of them landed any. */
    expRev: sum(S.aes, x=>x.expWon), expComm: sum(S.aes, x=>x.expComm),
    expReps: S.aes.filter(x=>x.expCount>0).length,
    expLostRev: sum(S.aes, x=>x.expLost), expRate: p.expRate||0,
    expPaid: (p.expRate||0) > 0,
    accelShare: safeDiv(accelUplift, Math.max(1,commSpend)),
    decelReps: S.aes.filter(x=>x.belowDecel).length,
    decelSaved: sum(S.teams.filter(t=>t.manages==="AE"), t=>t.decelCost),
    kickTeams: S.teams.filter(t=>t.manages==="AE" && t.kicker).length,
    /* 5% of each eligible member's QUARTER commission, which is what the kicker
       pays and what the rep and manager cards already quote. It was 5% of each
       member's ANNUAL target variable, so #full read $19,200 where the kicker
       paid $6,402, while the manager of the same team was told "$448 to $920
       each". Same annual-against-quarterly class as salesCost and csExpTarget. */
    kickCost: sum(S.teams.filter(t=>t.manages==="AE" && t.kicker),
                  t=>sum(t.members.filter(m=>m.kickerEligible!==false), m=>(m.comm||0)*KICK_PCT)),
    /* SDR and sales-manager variable were ANNUAL figures prorated by the week,
       added to ONE QUARTER of AE commission and divided by one quarter of
       revenue. At the close that put four quarters of SDR and manager pay on
       one quarter's revenue, the same annual-against-quarterly bug p.csExpTarget
       had. #full read 20.6% against a 20% guardrail where the real figure is
       11.9%, beside a design cost of 11.0%; #large read 20.9% for 12.0%. Every
       red and amber on the cost standing outside #messy was this. Corrected, a
       plan at about 100% attainment lands within a point of its own design cost
       on every preset, which is the check that the units are now right.
       Every role is read as an actual now: AE and selling-manager commission off
       the deals, SDR pay off sdrEarn, manager pay off mgrPay. Nothing in this
       numerator is a target prorated by the week. 22 Oct. */
    salesCost: safeDiv(salesVarSpend, Math.max(1,closed)),
    salesVarSpend,
    sdrAccrued, mgrAccrued, csMgrAccrued, csVarAccrued, totalVarSpend,
    costOfRev: safeDiv(totalVarSpend, Math.max(1,qRevBase)),
    /* What the accelerator paid, as a share of revenue. Subtracting it from
       salesCost answers whether the plan would have been inside its guardrail
       without the accelerator, which is the honest test for "it cost more
       because it worked". The card used to decide that on attainment alone. */
    accelCost: safeDiv(accelUplift, Math.max(1,closed)),
    csAccrued: sum(S.css, x=>retentionPay(x.retention, p.csVariable*(p.csRetWeight||0)/4, p)),
    csCost: safeDiv(p.csVarTotal/4, Math.max(1,p.book/4)),
    retention: safeDiv(sum(S.css,x=>x.held), Math.max(1,sum(S.css,x=>x.held+x.churned))),
    expWon: sum(S.css, x=>x.expWon),
    /* Sales variable over the gross profit on the revenue it bought. It was AE
       commission alone, labelled "total variable", so on #full the card read
       "sales variable 20.4%, total variable 7%": the total was the smaller of
       the two because it left out the SDR and manager pay the sales figure
       included. Same numerator as salesCost now, so the two can be checked
       against each other: this is salesCost divided by the margin. */
    gpShare: safeDiv(salesVarSpend, Math.max(1,closed*p.gm))
  };
  /* Team attainment for the roles whose rosters are built before S.teams exists.
     They were carrying the COMPANY number, which is neither their team nor their
     manager's team. Nothing read it yet, but it was one finding away from
     printing the wrong number on a rep's screen. */
  [...S.sdrs, ...S.css].forEach(x=>{
    const t = S.teams.find(t2=>(t2.members||[]).some(m=>m.name===x.name));
    x.teamAttain = t ? t.attain : null;
    x.teamName   = t ? t.manager : null;
    x.teamSize   = t ? t.size : null;
  });

  return S;
}

/* ==========================================================================
   ROLE BLOCKS — each carries its plan, its numbers, its rationale and its
   own findings. Findings about the whole plan stay at plan level.
   ========================================================================== */
function buildRoles(p,r,F){
  const objLabel={OBJ_NEWLOGO:"net-new logos",OBJ_NRR:"retention and expansion",
                  OBJ_BALANCED:"balanced growth",OBJ_MARGIN:"profitable growth"}[r.OBJ];
  const mk=(o)=>Object.assign({findings:[],components:[],numbers:[]},o);
  const R=(o)=>p.roles.push(o);
  const rf=(role,t,h,b)=>role.findings.push({t,h,b});

  /* ---------------- AE ---------------- */
  const ae=mk({key:"AE", name:"Account Executives", count:p.aes,
    ote:p.ote, mix:pct0(1-p.varPct)+" / "+pct0(p.varPct), variable:p.variable,
    rationale:`Paid on closed new business at ${pct(p.rate)} of contract value. That rate is not a `+
      `choice we made: at 100% attainment their variable pay has to equal quota times the rate, so `+
      `${money(p.variable)} over ${money(p.quota)} fixes it at ${pct(p.rate)}. The quota itself is `+
      `${p.multiple.toFixed(1)}x their OTE, against ${article(p.segMult)} ${p.segMult}x benchmark for ${p.segPhrase}.`,
    scen:p.scen.map(x=>Object.assign({unit:money(x.rev)},x)), scenCol:"Revenue closed"});
  ae.components=[{label:"New business revenue", weight:1,
    detail:`${pct(p.rate)} of contract value`+(r.ACCEL!=="ACCEL_NONE"
      ? `, rising to ${pct(p.rate*p.accel.t1)} past target`:``)}];
  ae.numbers=[
    {k:"Annual quota", v:money(p.quota), w:`${p.multiple.toFixed(1)}x OTE. Benchmark for ${p.segPhrase} is ${p.segMult}x.`},
    {k:"Quota per quarter", v:money(p.qQuota), w:`The simulator runs on this. The contract states the annual figure.`},
    {k:"Base salary", v:money(p.base), w:`${pct0(1-p.varPct)} of OTE.`},
    {k:"Variable at target", v:money(p.variable), w:`${pct0(p.varPct)} of OTE, earned by hitting quota exactly.`},
    {k:"Commission rate", v:pct(p.rate), w:`${money(p.variable)} divided by ${money(p.quota)}. Industry norm is 8% to 12%.`},
    {k:"Expansion rate", v:pct(p.expRate), w:`What their expansion revenue pays, against ${pct(p.rate)} on new business.`},
    {k:"Quota period", v:p.period, w:`Derived from deal cycle, not asked. Frequency follows cycle length.`},
    {k:"Below threshold", v:p.decel.thr===null?"No change":(p.decel.mult===0
        ?"No commission below "+pct0(p.decel.thr):pct(p.rate*p.decel.mult)+" below "+pct0(p.decel.thr)),
      w:`What happens when they miss.`},
    /* A draw answer says nothing about how long the ramp runs, so the length was
       missing everywhere: the plan page said "Reduced quota plus draw" and the
       contract had to leave a blank for it. Derived the way the rest of the
       plan derives what it was not told, and on the rule the row's own note
       already states, longer where the cycle is longer. */
    {k:"Ramp", v:({RAMP_NONE:"None",RAMP_3MO:"3 months",RAMP_6MO:"6 months",
                   RAMP_DRAW:(p.cycleWeeks>=26?"6 months":"3 months")+" plus a non-recoverable draw"})[r.RAMP],
      w:`New hire treatment. Norm is 3 to 6 months, longer where the cycle is longer.`},
    {k:"Clawback", v:({CLAW_NONE:"None",CLAW_90:"90 days",CLAW_180:"180 days",CLAW_HOLDBACK:"80/20 holdback"})[r.CLAW],
      w:`Recovery window if a customer churns early.`}
  ];
  R(ae);

  /* ---------------- SDR ---------------- */
  if (p.hasSdr){
    let comps;
    if (p.early) comps=[["Meetings held",1.00,"count"]];
    else if (r.SEG==="SEG_SMB")   comps=[["Accepted opportunities, by count",1.00,"count"]];
    else if (r.SEG==="SEG_ENT")   comps=[["Accepted opportunities, by count",.60,"count"],
                                         ["Pipeline created, by value",.40,"value"]];
    else if (r.SEG==="SEG_MIXED") comps=[["Accepted opportunities, by count",.50,"count"],
                                         ["Pipeline created, by value",.30,"value"],
                                         ["Deals won from their pipeline",.20,"won"]];
    else                          comps=[["Accepted opportunities, by count",.70,"count"],
                                         ["Deals won from their pipeline",.30,"won"]];

    p.sdrWeights = {};
    comps.forEach(([label,w,kind])=>{ p.sdrWeights[kind] = (p.sdrWeights[kind]||0) + w; });
    const sdr=mk({key:"SDR", name:"SDRs", count:p.sdrs,
      ote:p.sdrOte, mix:"70 / 30", variable:p.sdrVariable});

    sdr.components=comps.map(([label,w,kind])=>{
      const pool=p.sdrVariable*w;
      let detail;
      if (kind==="count") detail=money(pool/p.sdrQuota)+" per "+(p.early?"meeting held":"accepted opportunity");
      // Per $1M, not per $100K: it is a straight rate with no blocks in it, and the
      // smaller unit reads like something you accumulate a whole one of at a time.
      else if (kind==="value") detail=money(pool/(p.sdrQuota*p.acv)*1000000)+" per $1M of pipeline created";
      else detail=money(pool/(p.sdrQuota*p.winRate))+" per deal won";
      return {label, weight:w, detail};
    });
    if (["INC_SPIFF","INC_BOTH"].includes(r.INC) && (p.early||r.SEG==="SEG_SMB"))
      sdr.components.push({label:"Closed-won SPIFF", weight:null,
        detail:"Sits on top of the core plan, not inside it"});

    const bdrNote = `SDRs and BDRs are one role here. The comp maths is identical and the difference `+
      `between the titles is a territory decision, not a plan decision. `;
    sdr.rationale = bdrNote + (p.early
      ? `Paid on meetings held, because an early-stage company has no trustworthy definition of a `+
        `qualified opportunity yet and no history behind whatever definition it does have. Paying on a `+
        `stage you argue about every week destroys trust faster than anything else. This plan graduates `+
        `to pipeline created once there is a renewal and win-rate history to stand on.`
      : `Paid on pipeline created, counted once the AE has accepted it and moved a stage. `+
        (r.SEG==="SEG_ENT"
          ? `Enterprise adds a value component because opportunity sizes vary so widely that counting `+
            `alone punishes whoever works the biggest accounts. There is deliberately no closed-won `+
            `component: a nine-month cycle means that money lands two or three quarters late and stops `+
            `teaching anybody anything.`
          : r.SEG==="SEG_SMB"
          ? `SMB stays single-component because deals are small and similar in size, so a count is `+
            `already a fair measure and a second component would add arithmetic without adding signal.`
          : `A closed-won component gives them a stake in whether the pipeline was real. Paying purely `+
            `on volume gets you volume and garbage quality; paying purely on closed-won makes a junior `+
            `person wait months for money they cannot control.`));

    sdr.numbers=[
      {k:"Quota", v:p.sdrQuota+" "+p.sdrUnit+" a year", w:`${num(p.sdrQuota/4)} a quarter. Benchmark capacity for ${p.segPhrase}.`},
      {k:"Headcount", v:p.sdrs+(p.sdrs===1?" SDR":" SDRs"),
       w:`Derived from what the AE team needs, not from an AE ratio. ${money(p.teamQuota)} of quota at `+
         `${moneyK(p.acv)} average deal size is ${num(p.dealsNeeded)} deals, at ${article(pct0(p.winRate))} ${pct0(p.winRate)} `+
         `win rate that is ${num(p.oppsNeeded)} opportunities, of which SDRs source `+
         `${pct0(p.sdrShare)}, divided by ${p.sdrCap} each.`},
      {k:"OTE", v:money(p.sdrOte), w:`60% of an AE's, floored at ${moneyK(SDR_FLOOR)} because the market will not go below it.`},
      {k:"Variable", v:money(p.sdrVariable), w:`30% of OTE. Support roles carry less variable than closers.`},
      {k:"Attainment measured on", v:p.early?"Meetings held":"Accepted opportunities",
       w:`One quota. The other components are per-unit payments calibrated off the same number, so they `+
         `can never contradict it. A rep with thin pipeline but unusually good conversion is paid above `+
         `their raw attainment, which is the whole point of the second component.`},
      {k:"Past target", v:r.ACCEL==="ACCEL_NONE"?"No accelerator":p.accel.t1+"x, mirroring the AEs",
       w:`Mirrors the AE setting. If AEs get an accelerator and SDRs get nothing, you have told the SDR team they matter less.`},
      {k:"Clawback", v:"Exempt", w:`Created in Q1, won in Q3, churned in Q4 means taking money back from a `+
         `junior person for a deal they handed off six months earlier. Clawback belongs on whoever negotiated it.`}
    ];

    const sdrBase=p.sdrOte-p.sdrVariable;
    sdr.scen=[.70,1,1.30].map(f=>{
      const earned=roleEarn(p,p.sdrVariable,f);
      return {att:Math.round(f*100), unit:num(p.sdrQuota*f)+" "+p.sdrUnit,
              comm:earned, total:sdrBase+earned, pctOte:(sdrBase+earned)/p.sdrOte};
    });
    sdr.scenCol=p.early ? "Meetings held" : "Pipeline created";
    if (p.ote/p.sdrOte < 1.55)
      rf(sdr,"warn","The step from SDR to AE barely pays",
        `An SDR at ${moneyK(p.sdrOte)} against an AE at ${moneyK(p.ote)} is `+
        `${(p.ote/p.sdrOte).toFixed(2)}x. `+
        (p.ote/p.sdrOte >= 1.5
          ? `That is right at the floor of the healthy 1.5x to 1.7x range, with nothing above it.`
          : `The healthy range is 1.5x to 1.7x, so this sits below it.`)+
        ` Promotion should be worth something, or your best SDRs go and get it somewhere else.`);
    if (p.sdrs >= p.aes)
      rf(sdr,"bad","Outbound does not pay for itself at these numbers",
        `Covering this quota needs ${p.sdrs} SDRs against ${p.aes} AEs. At ${article(moneyK(p.acv))} ${moneyK(p.acv)} average deal `+
        `and ${article(pct0(p.winRate))} ${pct0(p.winRate)} win rate you need ${num(p.oppsNeeded)} opportunities a year, which `+
        `is more prospecting than the deals can fund. Fix the deal size or the win rate before hiring the team.`);
    R(sdr);
  }

  /* ---------------- CS ---------------- */
  if (p.hasCs){
    let comps, why;
    if (p.early){
      comps=[["Retention",.50],["Onboarding and adoption milestones",.50]];
      why=`An early-stage company has not had enough renewals to measure retention meaningfully, so paying `+
          `primarily on it is paying on noise. Onboarding is observable from day one. This plan graduates `+
          `once there is a renewal history.`;
    } else if (r.OBJ==="OBJ_NRR"){
      comps=[["Retention",.50],["Expansion revenue generated",.50]];
      why=`You said retention and expansion is the priority, so CS is a commercial role here, not a support `+
          `one, and half their variable rides on growing the book rather than just holding it.`;
    } else if (r.OBJ==="OBJ_BALANCED"){
      comps=[["Retention",.60],["Expansion revenue generated",.40]];
      why=`Balanced growth means CS defends the base and contributes to growth, weighted toward defence `+
          `because that is the part they most directly control.`;
    } else {
      comps=[["Retention",1.00]];
      why=`Your objective is ${objLabel}, so CS is a defensive role here. Their job is to keep what the `+
          `AEs won, and the plan pays for exactly that and nothing else.`;
    }
    const cs=mk({key:"CS", name:"Customer Success", count:p.css,
      ote:p.csOte, mix:"80 / 20", variable:p.csVariable});
    const expWeight=(comps.find(c=>c[0].startsWith("Expansion"))||[null,0])[1];
    /* THE BOOK SETS THE TARGET AND THE PAY SETS THE RATE, which is the way round
       the AE side already works: the quota answer sets p.quota and p.rate falls
       out of variable divided by it. This was inverted, deriving the target from
       the pay, so the number a CSM had to grow was whatever the comp arithmetic
       happened to produce: 3.6% annual growth on the book for #full, 6.0% for
       #mixed, 9.0% for #large. Expansion attainment ran past 200% on every
       preset, and the plan's own "expansion target is aggressive" card, which
       warns above 15% growth, could never fire because nothing ever got there.
       CS_EXP_GROWTH is the expectation a book carries in a year. 12% sits inside
       the range this page already calls healthy, under the 15% where that card
       starts warning and well under the 25% it calls unreachable. The rate is
       then whatever pays the component in full at that target, the same identity
       the AE plan rests on. */
    p.csExpTarget = expWeight ? p.csBook*CS_EXP_GROWTH : 0;
    if (expWeight && p.csExpTarget > 0) p.csExpRate = (p.csVariable*expWeight)/p.csExpTarget;
    p.csExpWeight = expWeight;
    p.csRetWeight = (comps.find(c=>c[0]==="Retention")||[null,0])[1];

    cs.components=comps.map(([label,w])=>({label, weight:w,
      detail: label==="Retention"
        ? `Nothing below ${pct0(p.retFloor)} retention, full component at ${pct0(p.retFull)}`
        : label.startsWith("Expansion")
        ? `${pct(p.csExpRate)} of expansion revenue, about ${money(p.csExpTarget)} each to earn it in full`
        : `Milestone based`}));

    cs.rationale = why + ` A CSM controls far less of their outcome than a rep does, which is why the mix `+
      `is 80/20 and why the retention component is gated rather than proportional. Paying proportionally `+
      `for 60% retention would be paying somebody for failure.`;

    cs.numbers=[
      {k:"Book per CSM", v:moneyK(p.csBook),
       w:`Your ${moneyK(p.book)} book across ${p.css} CSMs. The target for ${p.segPhrase} is about ${moneyK(p.bookPerCsmTarget)} each.`},
      {k:"Headcount", v:p.css+(p.css===1?" CSM":" CSMs"), w:`Derived from book size, not from AE headcount.`},
      {k:"OTE", v:money(p.csOte), w:`75% of an AE's, floored at ${moneyK(CS_FLOOR)}.`},
      {k:"Variable", v:money(p.csVariable), w:`20% of OTE. Retention roles carry the least variable of anyone on plan, because they control the least.`},
      {k:"Retention gate", v:pct0(p.retFloor)+" to "+pct0(p.retFull),
       w:`Nothing pays below ${pct0(p.retFloor)}. Full component at ${pct0(p.retFull)}. Above that they are into expansion territory.`},
      {k:"Measured", v:(r.SEG==="SEG_ENT"?"Individually":"Retention as a team, expansion individually"),
       w:(r.SEG==="SEG_ENT"
         ? `Named accounts, so a CSM genuinely owns their book.`
         : `A CSM holding twelve accounts loses eight points of retention when one churns for reasons nobody `+
           `controlled. Team-level retention protects them from weather; individual expansion still credits `+
           `what they actually did.`)}
    ];
    if (expWeight) cs.numbers.push({k:"Expansion target", v:money(p.csExpTarget),
      w:`Their expansion variable divided by the ${pct(p.expRate)} expansion rate. Nobody picked this number, it fell out.`});

    const csBase=p.csOte-p.csVariable;
    const retW=(comps.find(c=>c[0]==="Retention")||[null,0])[1];
    const othW=1-retW;
    const retPay=ret=> retentionPay(ret, p.csVariable*retW, p);
    cs.scen=[[.85,.50],[p.retFull,1],[.98,1.30]].map(([ret,ex])=>{
      const earned=retPay(ret)+p.csVariable*othW*ex;
      return {att:Math.round(ret*100), unit:pct0(ret)+" retention, "+pct0(ex)+" of expansion",
              comm:earned, total:csBase+earned, pctOte:(csBase+earned)/p.csOte};
    });
    cs.scenCol="Performance";
    /* "Your CSMs are carrying too much book" was deleted on 24 Sep. It could
       never fire: p.css is round(book / bookPerCsmTarget), so csBook is
       book/css, which lands on the target by construction. Measured across
       every segment and book size the ratio is 1.00 every time, so
       csBook > target*1.3 has no input that satisfies it. The tool hires CS to
       the benchmark, so no CSM in it is ever overloaded, and a card describing
       a world the engine does not model is the same case as the accelerator-is-
       decoration finding. It had no copy in the doc either, which is how it
       survived: nothing checked plan cards until plan-drift.js. */
    const expGrowth = expWeight ? p.csExpTarget/p.csBook : 0;
    if (expGrowth > .25)
      rf(cs,"bad","The expansion target is not reachable",
        `Each CSM needs ${moneyK(p.csExpTarget)} of expansion from ${article(moneyK(p.csBook))} ${moneyK(p.csBook)} book, which is `+
        `${pct(expGrowth)} growth on an installed base. Best-in-class net revenue retention runs about `+
        `120%, so this asks every CSM to beat the market outright before they earn their full variable. `+
        `Cut the expansion weight or hire more CSMs.`);
    else if (expGrowth > .15)
      rf(cs,"warn","The expansion target is aggressive",
        `Each CSM needs ${moneyK(p.csExpTarget)} of expansion from ${article(moneyK(p.csBook))} ${moneyK(p.csBook)} book, which is `+
        `${pct(expGrowth)} growth. Reachable, but it assumes a healthy product and a book with room in it. `+
        `Past about 25% it stops being a plan and becomes a wish.`);
    if (p.early && r.OBJ==="OBJ_NRR")
      rf(cs,"bad","Your objective and your stage are pulling against each other",
        `You said retention and expansion is the priority, but at early stage there is no renewal history `+
        `to measure retention against, so CS is being paid on onboarding instead. Both of those are `+
        `individually correct and together they mean nobody is paid for the thing you said matters most.`);
    R(cs);
  }

  /* ---------------- Managers ---------------- */
  const mgrs=[];
  if (p.salesMgrs) mgrs.push({key:"AE", label:"Sales Managers", n:p.salesMgrs, ote:p.salesMgrOte,
    team:p.aes, teamLabel:"AEs", metric:"AE revenue against AE quota", floor:p.ote*1.4<p.ote});
  if (p.sdrMgrs) mgrs.push({key:"SDR", label:"SDR Managers", n:p.sdrMgrs, ote:p.sdrMgrOte,
    /* Early-stage SDRs are paid on meetings held, and the manager above them was
       described as paid on pipeline created: the plan page and the manager cards
       both named a unit nobody on that team is measured on. */
    team:p.sdrs, teamLabel:"SDRs", metric:(p.early ? "meetings held" : "accepted opportunities")+" against SDR quota", floor:p.sdrOte*1.4<p.ote});
  if (p.csMgrs) mgrs.push({key:"CS", label:"CS Managers", n:p.csMgrs, ote:p.csMgrOte,
    team:p.css, teamLabel:"CSMs", metric:`renewals held against ${pct0(p.retFull)} of the book at risk, the same bar each CSM carries`, floor:p.csOte*1.4<p.ote});

  if (mgrs.length){
    /* mgrWeights is keyed on the size of the team the manager runs, which is
       what its own bands describe: at three or fewer "the manager is still a
       selling manager". It was being handed p.aes, the whole company's AE
       count, so on a 16-AE org with two managers of eight it read the 25-rep
       band and called the reps-at-quota component 25% when the manager's own
       team puts it at 35%. The findings read the manager's team size, so the
       two disagreed on every preset but one. The span is what both use now. */
    const span = Math.ceil(mgrs[0].team/mgrs[0].n);
    const oneKind = mgrs.length===1;
    const w = mgrWeights(span, oneKind ? mgrs[0].key : "AE");
    // No expansion target, no expansion component: the weight goes back to the
    // retention half rather than paying against a target of zero.
    if (w.exp>0 && !(p.csExpTarget>0)) { w.team += w.exp; w.exp = 0; }
    const mg=mk({key:"MGR",
      name: oneKind ? mgrs[0].label : "Managers",
      count: mgrs.reduce((s,m)=>s+m.n,0),
      sub:  oneKind ? null : mgrs.map(m=>m.n+" "+m.label.replace(" Managers","")).join(", "),
      ote:  oneKind ? mgrs[0].ote : null,
      mix:"60 / 40", variable:null});
    /* ONE BLOCK USED TO DESCRIBE EVERY KIND OF MANAGER, and it described the
       Sales Manager. On any org with more than one kind, a CS manager's page
       read "Team attainment 65%, nothing paid below 70%" when their actual plan
       is book retained, expansion and CSMs at target against an 88% floor. Every
       correction made to that plan was invisible exactly where it mattered, and
       the role-aware labels below were dead code besides: the entries carried no
       key, so oneKind && mgrs[0].key==="CS" was never true even on a CS-only org.
       Each kind now states its own split, prefixed when there is more than one. */
    const compsFor = (kind) => {
      const sp = Math.ceil(mgrs.find(m=>m.key===kind).team/mgrs.find(m=>m.key===kind).n);
      const ww = mgrWeights(sp, kind);
      const thirdLive = kind==="CS" ? p.csExpTarget>0
                      : kind==="SDR" ? !!(p.sdrWeights && p.sdrWeights.value) : false;
      if (ww.exp>0 && !thirdLive) { ww.team += ww.exp; ww.exp = 0; }
      const teamLabel = kind==="CS" ? "Book retained"
                      : kind==="SDR" ? (p.early ? "Meetings held" : "Opportunities created") : "Team attainment";
      const partLabel = kind==="CS" ? "CSMs at target"
                      : kind==="SDR" ? "SDRs at target" : "Reps at quota";
      return [
        ...(ww.personal?[{label:"Their own quota", weight:ww.personal,
          detail:"At this team size the manager is still a selling manager"}]:[]),
        {label:teamLabel, weight:ww.team,
          detail:`Nothing paid below ${pct0(mgrTeamFloor(kind, p))} of it`},
        ...(ww.exp?[{label: kind==="SDR" ? "Pipeline value" : "Expansion", weight:ww.exp,
          detail: kind==="SDR"
            ? `The value of the pipeline the team created, against the same target priced at the average deal`
            : `Team expansion revenue against the team's expansion target`}]:[]),
        ...(ww.part?[{label:partLabel, weight:ww.part,
          detail:`Full component when ${pct0(p.partTarget)} of the team is at or above 100%`}]:[])
      ];
    };
    mg.components = oneKind ? compsFor(mgrs[0].key)
      : [].concat(...mgrs.map(m => compsFor(m.key).map(c =>
          Object.assign({}, c, {label: m.label.replace(" Managers","")+": "+c.label}))));
    /* The illustration is solved at the size of the team a manager actually runs,
       not at the ends of the company's AE band. Those are different numbers and
       this paragraph used to mix them: on a 16-AE org it picked its branch from
       the 11-to-25 band and printed the 4-to-10 weight from the span, so it
       described a team nobody in the org has and quoted a share that did not
       belong to it. A span is one number, so the illustration is one number.

       Two branches, because MGR_SPAN caps a team at eight. What the split should
       be above that is a recommendation rather than something this engine
       builds, and it sits on the Share column where the question forms. */
    const mask = n => Math.round((95*n-200)/(n-1));
    mg.rationale = (w.personal
      ? `At one to three reps the manager is a founder or a selling manager who still carries their own `+
        `number, and paying them purely on a team of ${wordN(span)} is paying them on a coin flip.`
      : `Team attainment alone can be carried by one star. On a team of ${wordN(span)}, a single rep at `+
        `200% can carry everybody else sitting at ${mask(span)}% and still land the team at 95%, so the `+
        `manager gets paid while most of the team is failing. That is why reps-at-quota carries `+
        `${pct0(w.part)} here: at this size one person genuinely can mask the rest.`) +
      (oneKind ? `` :
      ` Every manager runs one function only. Nobody spans, because coaching a discovery call and coaching `+
      `a cold call are different crafts.`);
    /* The Share column is where a reader asks whether these weights are fixed.
       They are not: the table has rows this engine never reaches, because a span
       is held at MGR_SPAN. Read off mgrWeights rather than typed out, so the
       recommendation cannot drift from the rule it is quoting. */
    const rec = n => Math.round(mgrWeights(n,"AE").team*100)+"/"+Math.round(mgrWeights(n,"AE").part*100);
    mg.shareNote = `One star covers less of a bigger group, so team attainment carries more of the `+
      `split as a manager's team grows. Recommended is ${rec(10)} up to ten, ${rec(25)} from eleven `+
      `to twenty-five, and ${rec(26)} past that.`;
    // "Running 16" was the whole AE headcount, not what one manager runs. On a
    // 16-AE org with two managers the page said each of them ran sixteen people
    // while the weights came from eight.
    mg.numbers = mgrs.map(m=>{
      const s = Math.ceil(m.team/m.n);
      return {k:m.label, v:m.n+" at "+money(m.ote)+" OTE",
      w:`One per ${MGR_SPAN} ${m.teamLabel}. On this plan that is `+
        // A manager runs a team, not a number of people. Same correction the
        // Share note took, and this line was the one instance it missed.
        (m.n===1 ? `one manager with a team of ${wordN(s)}`
                 : `${wordN(m.n)} of them, with ${wordN(s)} on each team`)+
        `. Team attainment measured on ${m.metric}. `+
        `OTE is the higher of 1.4x the role they manage or an AE's OTE, because no first-line manager `+
        `should earn less than the org's benchmark individual contributor.`};
    });
    mg.numbers.push({k:"Reps at quota target", v:pct0(p.partTarget),
      w:`If attainment is a healthy bell curve centred near 100%, expecting everyone to clear it is `+
        `expecting the impossible and expecting a third to is accepting failure.`});

    // Scenarios shown for the Sales Manager, the one every plan with a
    // management layer has. Reps-at-quota is assumed to move with team attainment.
    const mgrVariable=p.salesMgrOte*p.mgrVarPct, mgrBase=p.salesMgrOte-mgrVariable;
    mg.scen=[[.70,.40],[1,p.partTarget],[1.30,.75]].map(([f,hit])=>{
      const teamPay = teamAttainPay(p, f, mgrVariable*w.team);
      const partPay = participationPay(hit, mgrVariable*w.part, p);
      // Capped where the team component is capped. The illustration moves the
      // manager's own attainment with the team's, which is an illustration's
      // licence; letting it run past 130% when the component beside it stops
      // there is not.
      const ownPay  = mgrVariable*w.personal*Math.min(1.3, f);
      const earned=teamPay+partPay+ownPay;
      return {att:Math.round(f*100),
              unit:pct0(f)+" team attainment, "+pct0(hit)+" of reps at quota",
              comm:earned, total:mgrBase+earned, pctOte:(mgrBase+earned)/p.salesMgrOte};
    });
    mg.scenCol="Performance";
    mg.scenNote = oneKind ? null
      : "These payout scenarios are shown for a Sales Manager, against AE revenue and AE quota. An SDR manager reads the same shape against pipeline created. A CS manager does not: their variable splits three ways rather than two, because their CSMs are paid on expansion as well as retention, so these scenarios do not describe their plan.";
    const mgrPool=p.mgrVar, teamPool=p.aeVar+p.sdrVar+p.csVar;
    if (p.sdrMgrs && p.sdrMgrs*p.sdrMgrOte*p.mgrVarPct > p.sdrVar*.40)
      rf(mg,"warn","The SDR team is too small to carry its own manager",
        `Management costs ${money(p.sdrMgrs*p.sdrMgrOte*p.mgrVarPct)} of variable against an SDR team pool `+
        `of ${money(p.sdrVar)}. Cheaper to have them report into sales leadership for another two hires.`);
    if (mgrs.some(m=>m.floor))
      rf(mg,"warn","A manager's pay is only holding up because of the floor",
        `At least one manager's OTE is being set by the floor rather than by the ratio, which means the `+
        `role underneath them is paid so little that 1.4x it would have put a people manager below an AE.`);
    if (mgrPool > teamPool*.35)
      rf(mg,"warn","Management overhead is heavy",
        `${money(mgrPool)} of manager variable against ${money(teamPool)} for everyone they manage. `+
        `Past about a third, you are paying more to supervise the work than the work is worth.`);
    R(mg);
  }
}

function planFindings(p,r,F){
  /* ---------- HEALTH REPORT: fixed checks, always reported ---------- */

  // 0. Quota capacity. Different question from the multiple: that one asks whether
  // the quota pays properly, this one asks whether it can be worked at all. A quota
  // can be perfectly priced against OTE and still demand more deals than the cycle
  // allows. Knowable from the answers alone, which is why it lives here rather than
  // waiting for the simulator to show a team at 56% with nothing explaining it.
  // Deal counts print to one decimal below ten. "3 deals against a ceiling of 3"
  // reads as nonsense when the real figures are 2.5 and 2.5.
  const dq = v => v<10 ? v.toFixed(1) : num(v);
  if (p.capacity<0.75)
    F("bad","This quota cannot be worked as written",
      `Hitting it needs ${dq(p.dealsPerRepQtr)} closed deals a quarter from every rep, against a `+
      `realistic ceiling of ${dq(p.capDeals)} on ${article(p.cycle)} ${p.cycle} sales cycle. That is not a pay problem, `+
      `it is an arithmetic one: at ${moneyK(p.acv)} a deal, ${moneyK(p.quota)} is more selling than the `+
      `cycle allows. Expect attainment near ${pct0(p.capacity)} of target however the plan is paid. `+
      `A quota around ${moneyK(p.capDeals*p.acv*4)} is workable at this deal size.`, ["SEG","QUOTA"]);
  else if (p.capacity<1)
    F("warn","This quota is above what the cycle comfortably supports",
      `It needs ${dq(p.dealsPerRepQtr)} closed deals a quarter from every rep against a practical `+
      `ceiling of ${dq(p.capDeals)} on ${article(p.cycle)} ${p.cycle} cycle. Attainment will sit near ${pct0(p.capacity)} `+
      `of target for reasons that have nothing to do with how the plan pays. Deliberate stretch is fine `+
      `as long as everyone knows that is what it is.`, ["SEG","QUOTA"]);
  else if (p.dealsPerRepQtr > p.capDeals*0.85)
    F("warn","This quota runs right at the limit of the cycle",
      `It needs ${dq(p.dealsPerRepQtr)} closed deals a quarter from every rep against a practical `+
      `ceiling of ${dq(p.capDeals)} on ${article(p.cycle)} ${p.cycle} cycle. Reachable, with nothing spare. One slow `+
      `month and the quarter is gone.`, ["SEG","QUOTA"]);

  // 1. Quota multiple. The rate note has to match where the rate actually landed,
  // because a variable-heavy pay mix can keep the rate in band even on a brutal quota.
  const rateNote =
    p.rate<.08 ? `The implied commission rate is ${pct(p.rate)}, under the 8% to 12% norm.`
  : p.rate>.12 ? `The implied commission rate is ${pct(p.rate)}, above the 8% to 12% norm.`
  : `The implied rate of ${pct(p.rate)} does land inside the 8% to 12% norm, but only because your pay `+
    `mix pushes so much into variable. The rate is fine. The quota is not.`;
  if (p.multiple<3.5)
    F("bad","Your quota is too low to fund this plan",
      `${moneyK(p.quota)} against ${article(moneyK(p.ote))} ${moneyK(p.ote)} OTE is ${p.multiple.toFixed(1)}x, where ${p.segPhrase} `+
      `normally runs ${p.segMult}x. ${rateNote} A rep hitting target costs more than they bring in. `+
      `A quota near ${moneyK(p.ote*p.segMult)} works.`, ["OTE","MIX","QUOTA"]);
  else if (p.multiple>7)
    F("bad","Your quota is unreachable",
      `${p.multiple.toFixed(1)}x OTE, well past the ${p.segMult}x benchmark for ${p.segPhrase}. ${rateNote} `+
      `Expect attainment to cluster below 100% and turnover to follow. A defensible quota here is around `+
      `${moneyK(p.ote*p.segMult)}.`, ["OTE","MIX","QUOTA"]);
  else if (Math.abs(p.multiple-p.segMult)>=1.2)
    F("warn","Your quota multiple is off benchmark",
      `${p.multiple.toFixed(1)}x OTE where ${p.segPhrase} normally sits near ${p.segMult}x. Not wrong, but it `+
      `needs a reason you can defend, like an unusually high win rate or a territory you know is rich.`, ["OTE","QUOTA"]);
  else
    F(p.rate<.08||p.rate>.12 ? "warn" : "ok",
      p.rate<.08||p.rate>.12 ? "Your quota multiple is fine but the rate it implies is not"
                             : "Quota multiple is healthy",
      `${p.multiple.toFixed(1)}x OTE against ${article(p.segMult)} ${p.segMult}x benchmark for ${p.segPhrase}, implying `+
      `${article(pct(p.rate))} ${pct(p.rate)} commission rate. `+
      (p.rate<.08
        // Same class as the accelerator one above: 367 plans already on the lowest quota
        // band were told to lower the quota. The mix is the lever that is actually left,
        // and this card already names it one sentence earlier.
        ? `That is under the 8% to 12% industry norm. The quota is defensible, so the pressure is coming `+
          `from your pay mix: only ${pct0(p.varPct)} of OTE is variable, which leaves little to spread `+
          `across the quota. ` + (r.QUOTA===LOWEST_QUOTA
            ? `Push more into variable. The quota is already at the bottom of the range.`
            : `Push more into variable or lower the quota.`)
       : p.rate>.12
        ? `That is above the 8% to 12% industry norm. The quota is defensible, so this is your pay mix: `+
          `${pct0(p.varPct)} of OTE riding on commission is a lot to fund out of one quota.`
        : `That sits inside the 8% to 12% industry norm.`), ["OTE","MIX","QUOTA"]);

  // 2. Rate vs stage
  const drift = p.rate-p.expected;
  if (p.multiple>=3.5 && p.multiple<=7){
    if (Math.abs(drift)<=.025)
      F("ok","You are paying about right for your stage",
        `${pct(p.rate)} against roughly ${pct(p.expected)} typical at your maturity.`);
    else if (drift>0)
      F("warn","You are paying above your stage",
        `${pct(p.rate)} where companies at your maturity pay around ${pct(p.expected)}. Legitimate when `+
        `you are competing hard for talent, but it should be deliberate and it should come down as you scale.`, ["STAGE","OTE"]);
    else
      F("warn","You are paying below your stage",
        `${pct(p.rate)} where companies at your maturity pay around ${pct(p.expected)}. This makes hiring `+
        `harder and your best reps portable. `+
        // The stock advice here is to raise the accelerator, which costs nothing
        // until somebody earns it. On a quota nobody can reach it also DOES
        // nothing, so the advice changes with the same number the accelerator
        // and kicker cards read.
        /* ADVICE THAT NAMES A CONTROL HAS TO BE A CONTROL THEY CAN STILL MOVE.
           This said "raise the accelerator" without ever checking whether there was any
           raising left to do, and fired that way on 1,014 plans in a 30,000 sweep, every
           one of them already on the most aggressive setting the questionnaire offers.
           Javier caught it. The line it replaces is honest about there being one lever
           left rather than pointing at a control that is already at its stop.
           Note the test is on the ANSWER, not on p.accel: a flat plan has no accelerator
           at all and belongs in the same branch, because there is nothing to raise there
           either until the model changes. */
        (r.ACCEL==="ACCEL_AGGRESSIVE"
          ? `The accelerator is already at its most aggressive, so the lever left is the OTE itself.`
         : p.capacity<1
          ? `The usual answer is to raise the accelerator, which costs nothing until somebody earns it, `+
            `and on this quota nobody will: attainment sits near ${pct0(p.capacity)}. Fix the quota `+
            `first, or the raise is on paper only.`
          : `If it is budget, raise the accelerator instead. That costs nothing until somebody earns it.`),
        ["STAGE","OTE","ACCEL"]);
  }

  // 3. Pay mix
  const mixOk = (r.SEG==="SEG_SMB" && ["MIX_60_40","MIX_50_50"].includes(r.MIX)) ||
                (r.SEG!=="SEG_SMB" && ["MIX_50_50","MIX_40_60"].includes(r.MIX));
  if (mixOk)
    F("ok","Pay mix fits the motion",
      `${pct(1-p.varPct)} base and ${pct(p.varPct)} variable is standard for an AE on ${p.segPhrase}.`);
  else if (r.SEG==="SEG_SMB" && r.MIX==="MIX_40_60")
    F("warn","That mix is aggressive for an SMB motion",
      // Two different 60s in one breath, both correct and reading like a contradiction:
      // "the norm is 60/40" is base to variable, "pushing 60% into variable" is the other
      // way up. Spelled out once rather than abbreviated. Javier, 2 Oct.
      `High-velocity reps close often enough that income is already steady, so the norm is 60% base `+
      `and 40% variable. This plan puts 60% into variable, which adds risk without adding much `+
      `motivation, because the deals were coming anyway.`, ["MIX","SEG"]);
  else
    F("warn","That mix is base-heavy for this motion",
      `AEs on ${p.segPhrase} normally sit at 50/50 or 40/60. On long, high-value cycles a base-heavy mix means a rep `+
      `earns nearly the same whether they close the year or not, which is the exact problem comp is meant to fix.`, ["MIX","SEG"]);

  // 4. Affordability, judged separately for the two businesses
  const csNote = p.hasCs
    ? ` Customer Success is funded by the book instead, costing ${pct(p.csCostOfBook)} of the `+
      `${moneyK(p.book)} you are protecting.`
    : ``;
  if (p.salesCostOfRev>p.guardrail)
    F("bad","Your sales roles cost more than the revenue can carry",
      `${pct(p.salesCostOfRev)} of new business goes to sales variable comp, past the ${pct(p.guardrail)} `+
      `ceiling for a team shaped like yours, and that is before a single base salary is counted. `+
      `AE commission alone is ${pct(p.aeCostOfRev)}.`+csNote);
  else if (p.csCostOfBook > .025)
    F("warn","Customer Success is expensive against the book it protects",
      `CS variable runs ${pct(p.csCostOfBook)} of your ${moneyK(p.book)} book. Sales is inside its `+
      `guardrail at ${pct(p.salesCostOfRev)}, so the pressure is on the retention side. Either the book `+
      `is thin for the headcount or the CS team is bigger than the revenue justifies.`);
  else if (p.shareOfGp>p.gpGuardrail)
    F("warn","Comp is eating a lot of your gross profit",
      `Every ratio is inside its guardrail, but at ${article(pct(p.gm))} ${pct(p.gm)} margin total variable is `+
      `${pct(p.shareOfGp)} of gross profit. Fine if you are deliberately buying growth, tight if not.`);
  else
    F("ok","The plan is affordable",
      `Sales variable is ${pct(p.salesCostOfRev)} of new business against ${article(pct(p.guardrail))} ${pct(p.guardrail)} ceiling.`+
      csNote+` Together that is ${pct(p.shareOfGp)} of gross profit at ${article(pct(p.gm))} ${pct(p.gm)} margin.`);

  // Product tiering moves less money than it looks, and only for reps who can
  // actually steer what the customer buys.
  if (r.MODEL==="MODEL_DEAL_SIZE")
    F("warn","Paying by product moves less than it looks",
      `Strategic products pay ${Math.round((TIER_MULT.strategic-1)*100)}% more than core and services pay `+
      `${Math.round((1-TIER_MULT.services)*100)}% less, but strategic is a fifth of the deals and services `+
      `another fifth, so the mix is balanced and a rep at target still earns exactly their variable pay. `+
      `The lever only bites for reps who can genuinely steer which product a customer buys. Where they `+
      `cannot, this pays them for the customer's preference rather than their own work.`, ["MODEL"]);

  /* 5. Motivation principle

     Three states, not two. This used to read the ACCEL answer and nothing else,
     so a plan could carry "this quota cannot be worked as written, expect
     attainment near 53%" and, four cards later, "overperformance pays, at 130%
     a rep takes home 126% of OTE". Both were computed correctly from the same
     answers, and nothing read the first one's conclusion before writing the
     second. Anything the plan prices above target is downstream of whether
     target is reachable, so capacity is checked before overperformance is
     described. Measured: at capacity 1 the accelerator pays 13% to 44% of all
     commission, at 0.84 it pays 4.6%, at 0.72 and below it pays nothing. */
  if (r.ACCEL==="ACCEL_NONE" && p.capacity<1)
    // Same card, but the advice inverts. Telling somebody to add an accelerator
    // to a quota nobody reaches is recommending a second decoration.
    F("warn","Motivation: nothing rewards overperformance, and nothing could",
      `With no accelerator, a rep who hits quota early gains nothing by closing more this period. On this `+
      `quota that is the smaller problem: attainment sits near ${pct0(p.capacity)}, so hitting quota early `+
      `is not the case you need to plan for. Adding an accelerator here would reward nobody. The quota is `+
      `the thing to fix, and the motivation question is worth asking again after it moves.`,
      ["SEG","QUOTA","ACCEL"]);
  else if (r.ACCEL==="ACCEL_NONE")
    F("warn","Motivation: nothing rewards overperformance",
      `With no accelerator, a rep who hits quota early gains nothing by closing more this period, so they `+
      `will hold deals for next quarter. Your forecast gets worse and your best rep gets bored.`, ["ACCEL"]);
  else if (p.capacity<1)
    F("warn","Motivation: the accelerator is decoration on this quota",
      `Past target every dollar pays ${p.accel.t1}x the base rate`+
      (p.accel.at?`, stepping to ${p.accel.t2}x above ${Math.round(p.accel.at*100)}%`:"")+
      `. Attainment on this quota sits near ${pct0(p.capacity)} before anybody underperforms, so almost `+
      `nobody reaches the rate. You are paying for the complexity of an overperformance mechanic on a `+
      `plan where overperformance is not available. Either the quota comes down or the accelerator is `+
      `making the plan longer to read and nothing else.`, ["SEG","QUOTA","ACCEL"]);
  else
    F("ok","Motivation: overperformance pays",
      `Past target, every dollar pays ${p.accel.t1}x the base rate`+
      (p.accel.at?`, stepping to ${p.accel.t2}x above ${Math.round(p.accel.at*100)}%`:"")+
      `. At 130% a rep takes home ${Math.round(p.scen[2].pctOte*100)}% of OTE.`);

  /* The team kicker has the same exposure and had no plan-side card at all: it
     asks a team to average KICK_LINE of quota, which is further out of reach
     than quota itself. Measured across segment and quota answers, a team clears
     110% at every capacity of 1 and at none below it, with the best team landing
     at 98% on 0.84, 85% on 0.72 and 67% on 0.53. So this is the same test as the
     accelerator above, from the same number, with a different consequence. */
  if (p.hasKicker && p.capacity<1)
    F("warn","The team kicker cannot be reached on this quota",
      `The kicker pays when a team averages ${Math.round(KICK_LINE*100)}% of quota, and team attainment `+
      `on this quota sits near ${pct0(p.capacity)} before anybody has a bad quarter. That is not a `+
      `stretch goal, it is arithmetic nobody on the team can beat. A target people work out is `+
      `unreachable stops being a target.`, ["SEG","QUOTA","INC"]);

  // 6. Simplicity principle
  let mech=0;
  if (r.ACCEL!=="ACCEL_NONE") mech++;
  if (r.DECEL!=="DECEL_NONE") mech++;
  if (!["EXP_EQUAL","EXP_NONE"].includes(r.EXP)) mech++;
  if (r.CLAW!=="CLAW_NONE") mech++;
  if (r.RAMP!=="RAMP_NONE") mech++;
  if (r.INC==="INC_BOTH") mech+=2; else if (r.INC!=="INC_NONE") mech++;
  if (["MODEL_DEAL_SIZE","MODEL_MARGIN"].includes(r.MODEL)) mech++;
  if (r.CREDIT!=="CREDIT_SINGLE") mech++;
  p.mech = mech;
  if (mech>=7)
    F("warn","Simplicity: this plan has a lot of moving parts",
      `${mech} separate mechanisms on top of the base rate. If a rep cannot work out their own commission `+
      `in their head, they stop trying, and the plan stops steering behaviour. Consider dropping the two `+
      `that matter least.`);
  else if (mech>=5)
    F("ok","Simplicity: followable, but you are near the limit",
      `${mech} mechanisms on top of the base rate. Still explainable on one page, though another one or `+
      `two and reps will stop doing the maths and start guessing.`);
  else
    F("ok","Simplicity: a rep can follow this",
      `${mech} mechanisms on top of the base rate. Few enough that someone can work out their own `+
      `paycheque without help.`);

  // 7. Company goals principle.
  // Expansion "not separately commissioned" pays the SAME as new business, so it is
  // neutral, not evidence of a new-logo tilt. Alignment is judged on the actual gap.
  // One phrase, built once, so no branch can double up on the comparison words.
  const expPhrase =
      r.EXP==="EXP_NONE"   ? `nothing, against ${pct(p.rate)} on new business`
    : r.EXP==="EXP_LOWER"  ? `less than new business, ${pct(p.expRate)} against ${pct(p.rate)}`
    : r.EXP==="EXP_HIGHER" ? `more than new business, ${pct(p.expRate)} against ${pct(p.rate)}`
    :                        `the same as new business, both at ${pct(p.rate)}`;
  if (r.OBJ==="OBJ_NRR" && !p.hasCs)
    /* NARROWED TO THE RENEWAL, which is the only half of the objective that actually goes
       unpaid. The condition ignores EXP entirely, so the old headline "nobody is paid for it"
       fired on all four expansion answers. Measured over 30,000 random plans, 4,622 produce
       this card and they split near evenly: expansion not paid 1,158, lower 1,144, equal
       1,150, higher 1,170. On that last quarter expansion is the best paid thing on the plan
       and the card called it unpaid. The retention component exists only on the CSM role, so
       with no CS team nothing in the plan moves when a customer renews, whatever expansion
       pays. The two cards still co-fire on the 1,158 EXP_NONE plans, so the clause below
       branches: one owns growth, the other owns renewal, and neither contradicts the other.
       Javier, 3 Oct. */
    /* THE EXPANSION CLAUSE BRANCHES, because on EXP_NONE this card sits beside "Nobody is
       paid to grow an existing account", which states that expansion pays nothing. A flat
       "expansion may still be paid" contradicted it on 1,158 of the 4,622 plans. Where
       expansion is paid the rate is known, so it is named rather than hedged. */
    F("bad","Company goals: nobody is paid to keep the customer",
      `You said retention and expansion matter most, then left the renewal with nobody. `+
      (r.EXP==="EXP_NONE" ? `Whether` : `Expansion pays ${expPhrase}, but whether`)+
      ` a customer renews changes nobody's pay, because the only role that carries a `+
      `retention number is a CSM and this plan has no CS team.`, ["OBJ","EXP","TEAM"]);
  else if (r.OBJ==="OBJ_NEWLOGO")
    ["EXP_LOWER","EXP_NONE"].includes(r.EXP)
      ? F("ok","Company goals: the plan pays for new logos",
          r.EXP==="EXP_NONE"
            ? `AEs are paid nothing on expansion, so every hour they spend inside an existing account `+
              `costs them money. Nothing points them anywhere but new logos.`
            : `Expansion pays ${expPhrase}, so a rep who chases an upsell earns less `+
              `than one who wins a new customer. The money agrees with the strategy.`)
      /* THE TITLE FOLLOWS THE COMPARISON, the way expPhrase under it already does. One
         title covered two answers: on EXP_HIGHER it said expansion "pays just as well"
         over a body reading "more than new business, 10.4% against 8%", so the headline
         understated the thing the body was reporting. Javier, 2 Oct. */
      : F("warn", r.EXP==="EXP_HIGHER"
            ? "Company goals: you said new logos, but expansion pays better"
            : "Company goals: you said new logos, but expansion pays just as well",
          `Expansion pays ${expPhrase}. A rep will take the expansion deal every time, `+
          `because it pays at least as much and closes faster. To steer toward new logos, expansion has `+
          `to pay visibly less.`, ["OBJ","EXP"]);
  else if (r.OBJ==="OBJ_NRR")
    (r.EXP==="EXP_HIGHER" || (r.EXP==="EXP_NONE" && p.hasCs))
      ? F("ok","Company goals: the plan pays for retention and growth",
          r.EXP==="EXP_NONE"
            ? `Expansion is handed to Customer Success outright and they are paid ${pct(p.csExpRate)} on it, `+
              `the full new-business rate. Clean ownership: one team lands, another grows, and neither is `+
              `competing for the same dollar.`
            : `Expansion pays ${expPhrase}, and somebody is on a retention plan. A rep `+
              `is rewarded for growing an account, not just landing one.`)
      /* THE SAME DEFECT, WORSE. This title fired on EXP_EQUAL too, where the body says
         "the same as new business, both at 8%" and the title says new business pays
         better: a flat contradiction inside one card, and the closing line about reps
         going where the money is was false for the same reason. Equal rates are not a
         plan that pays better for new business, they are a plan that points nowhere. */
      : r.EXP==="EXP_EQUAL"
      ? F("warn","Company goals: you said retention, but nothing tips a rep towards it",
          `Expansion pays ${expPhrase}. The money is indifferent, so nothing but habit `+
          `decides where a rep spends their day, and habit favours the new deal.`, ["OBJ","EXP"])
      : F("warn","Company goals: you said retention, but new business still pays better",
          `Expansion pays ${expPhrase}. Reps go where the money is, and right now that `+
          `is not the installed base.`, ["OBJ","EXP"]);
  else if (r.OBJ==="OBJ_BALANCED")
    r.EXP==="EXP_EQUAL"
      ? F("ok","Company goals: the plan is genuinely balanced",
          `Expansion pays ${expPhrase}, so a rep is indifferent between them and `+
          `chases whichever deal is actually winnable. That is what balanced looks like in a comp plan.`)
      : F("warn","Company goals: you said balanced, but the rates are tilted",
          `Expansion pays ${expPhrase}. That is a preference, not a balance. Either `+
          `own the tilt and change the objective, or level the two rates.`, ["OBJ","EXP"]);
  else /* OBJ_MARGIN */
    r.MODEL==="MODEL_MARGIN"
      /* THIS FINDING USED TO CLAIM THE ENGINE DID IT. "Commission is calculated on gross margin
         rather than revenue" was false on every plan the tool can build: no deal carries a cost
         of delivery, nothing is discounted, and commAt() takes attainment and a rate. Same sin
         as the AE expansion rate that paid on a ledger with no AE expansion deals in it, and
         the same fix: say what the plan is, say what running it needs, and stop asserting the
         simulated figures are something they are not. The honesty note carries the rest. */
      ? F("ok","Company goals: the plan protects profit",
          `Paying on the gross profit a deal carries rather than on its contract value is what turns `+
          `profitable growth from a slogan into an instruction, because a rep who discounts 30% to close `+
          `feels it in their own pay. It also needs the margin on the deal record, which usually means `+
          `list against sold price out of your CPQ, or a delivery cost per product. Wherever it comes `+
          `from, that number has to be final when commission is calculated, because a margin that gets `+
          `restated after payout is a clawback waiting to happen. Every figure the simulator shows is `+
          `calculated on revenue, because a simulated deal carries no cost of delivery.`)
      : F("warn","Company goals: you said profitable growth, but you are paying on revenue",
          `Commission is calculated on revenue, not margin, so a rep earns exactly the same on a deal they `+
          `discounted 30% as on one they held firm. If margin is the priority, the commission has to be `+
          `calculated on it.`, ["OBJ","MODEL"]);

  /* ---------- CONDITIONAL CHECKS ---------- */
  if (p.flat && r.ACCEL!=="ACCEL_NONE")
    F("bad","You picked a flat rate and then an accelerator",
      `A flat model pays one rate at every attainment level. An accelerator is by definition a second rate. `+
      `One of these has to go, and the accelerator is usually the one worth keeping.`, ["MODEL","ACCEL"]);
  if (p.flat && r.DECEL!=="DECEL_NONE")
    F("bad","You picked a flat rate and then a decelerator",
      `A flat model pays one rate at every attainment level, and a decelerator is a second, lower rate `+
      `below a threshold. A flat rate that drops is not flat. Keep one or the other.`, ["MODEL","DECEL"]);
  if (r.ARCH==="ARCH_SERVICES")
    F("warn","Services revenue needs its own rate",
      `Implementation and professional services normally pay 1% to 3%, well under the recurring rate, `+
      `because the margin is thinner and the revenue does not repeat. One blended rate quietly rewards `+
      `reps for selling the least valuable thing you have.`, ["ARCH","MODEL"]);
  if (r.SEG==="SEG_ENT")
    F("ok","The simulator added a pipeline component",
      `Enterprise cycles run three to nine months, so closed revenue is a lagging signal and a rep can go `+
      `two quarters without a payout. Standard practice attaches part of variable pay to pipeline generated, `+
      `capped under 30% of incentive. You did not choose this. You will be able to dial it to zero.`);
  if (r.SEG==="SEG_ENT" && ["RAMP_NONE","RAMP_3MO"].includes(r.RAMP))
    F("warn","Your ramp is shorter than your sales cycle",
      `Enterprise deals take three to nine months. A new rep on full quota inside that window is being `+
      `measured on deals that mathematically cannot have closed yet. Six months is the norm here.`, ["RAMP","SEG"]);
  if (r.SEG==="SEG_ENT" && r.DECEL==="DECEL_CLIFF")
    F("warn","A cliff is harsh on a long cycle",
      `One slipped enterprise deal can put a good rep under 50% for a quarter through no fault of their own. `+
      `Cliffs work on high-velocity motions where volume smooths the noise out.`, ["DECEL","SEG"]);
  if (r.SEG==="SEG_SMB" && r.CLAW==="CLAW_180")
    F("warn","A 180-day clawback is long for this motion",
      `On sub-30-day cycles a six-month clawback means a rep is still carrying risk on deals from two `+
      `quarters ago. Ninety days is the norm and it is easier to trust.`, ["CLAW","SEG"]);
  if (r.EXP==="EXP_NONE" && !p.hasCs)
    F("bad","Nobody is paid to grow an existing account",
      `AEs earn nothing on expansion and there is no CS team on a plan, so every dollar of growth from `+
      `your existing customers is somebody's unpaid extra work. That revenue is usually the cheapest you `+
      `will ever book, and right now the plan is actively steering people away from it.`, ["EXP","TEAM"]);
  if (r.TERM==="TERM_FORFEIT")
    F("warn","Total forfeiture on resignation is legally exposed",
      `Several jurisdictions treat earned commission as wages, which cannot be forfeited by policy. `+
      `This is worth running past employment counsel before it goes in a contract, and it is the clause `+
      `most likely to end up in front of a tribunal.`, ["TERM"]);
  if (r.CREDIT==="CREDIT_DOUBLE")
    F("warn","Double crediting costs real money",
      // NAMES THE LINE RATHER THAN "the cost figures below". The uplift lands on p.totalVar
      // and on nothing else: aeCostOfRev and salesCostOfRev are built from the raw role
      // figures on purpose, because those are the lines read against the 8% to 15% industry
      // guardrail and that comparison has to be like for like. Saying "the cost figures"
      // told a finance reader all four carried it when two do not, and left the gap between
      // the role lines and the total looking like an arithmetic error. Javier, 3 Oct.
      `Paying both parties in full on shared deals is great for collaboration and it inflates commission `+
      `spend by roughly 5% to 10%. We have added 8% to the Total variable figure below, and left the `+
      `percentage-of-revenue lines without it so they still compare like for like against the industry `+
      `guardrail. Budget for it deliberately rather than discovering it at year end.`, ["CREDIT"]);
  if (r.MODEL==="MODEL_MARGIN" && p.gm<.65)
    F("warn","Margin-based commission on a thin margin",
      // "would make" rather than "makes": this is advice about the plan you would run, not a
      // description of the figures on this screen, which are calculated on revenue.
      `At ${pct(p.gm)} gross margin, paying on margin rather than revenue would make the commission pool `+
      `small and volatile. Reps feel the swing and cannot forecast their own income.`, ["MODEL","GM"]);

  /* ---- new plan-level checks ---- */
  if (r.TEAM==="TEAM_AE" && p.aes>=11)
    F("warn","That is a lot of reps with nobody managing them on plan",
      `Span of control runs six to eight reps per manager, so ${p.aes} AEs would normally have `+
      `${Math.ceil(p.aes/MGR_SPAN)}. The Manager view still renders using the sum of rep quotas, but `+
      `nobody is paid to move that number.`, ["TEAM","AES"]);
  /* The team kicker is switched on by INC and the team structure comes from
     TEAM, two answers that never look at each other. "Account Executives only"
     plus team incentives builds a kicker measured against a manager's own team
     on a plan that has no managers and therefore no teams, so it can never pay
     and nothing said so. Found 24 Sep while checking what a Participation
     Schedule does for a role that does not exist. No preset produces it: all
     eight carry at least one sales manager, which is why every check that
     iterates the presets was blind to it. */
  if (p.hasKicker && !p.hasMgr)
    F("bad","The team kicker has no team to measure against",
      `You asked for a team incentive on a plan with no management layer. The kicker pays an extra `+
      `${pct0(KICK_PCT)} when a manager's team finishes at ${pct0(KICK_LINE)} of its combined quota, and this `+
      `plan has no managers, so there is no team and the kicker can never pay. Either add the management `+
      `layer or drop the team incentive.`, ["TEAM","INC"]);

  /* No `src`: no answer the user can change removes the property, so there is
     nothing for a "change what is driving this" control to point at. The
     agreement this tool generates carries the rule in section 10, and the flag
     still earns its place, because nobody is obliged to use that agreement and
     the plan has the property either way. */
  if (p.hasMgr)
    F("warn","Mid-quarter departures are worth a pro-rating rule",
      `Both halves of a manager's variable improve when somebody leaves. Reps at quota is a ratio with `+
      `headcount underneath it, so four of eight at quota is 50% and the same four of six is 67%. Team `+
      `attainment measures against the sum of the current team's quotas, so a departing rep takes their `+
      `target away and leaves their shortfall behind. Pro-rate a leaver's quota and attainment to their `+
      `time in the seat, and write it down before it comes up rather than after.`);

  if (p.bookRatio < 1)
    F("warn","You are selling more this year than you have ever sold",
      `${An(moneyK(p.book))} ${moneyK(p.book)} book against ${moneyK(p.teamQuota)} of new business is ${p.bookRatio.toFixed(1)}x. `+
      `That is hypergrowth, and it means retention matters less right now than the headcount suggests. `+
      `It also means your quota is a bet, not an extrapolation.`, ["QUOTA","AES","BOOK"]);
  else if (p.bookRatio > 8 && r.OBJ==="OBJ_NEWLOGO")
    F("bad","Your objective disagrees with your balance sheet",
      `Your ${moneyK(p.book)} book is ${p.bookRatio.toFixed(0)}x what the team will sell this year. This is `+
      `an installed-base business, and you have told the plan to pay for net-new logos. The growth is `+
      `already sitting in the accounts you have.`, ["OBJ","BOOK"]);
  else if (p.bookRatio > 8)
    F("ok","Your book is where the growth is",
      `${An(moneyK(p.book))} ${moneyK(p.book)} book against ${moneyK(p.teamQuota)} of new business is ${p.bookRatio.toFixed(0)}x. `+
      `Most of your revenue outcome next year gets decided by renewals and expansion, not by new logos, `+
      `and your objective reflects that.`);
}

/* ==========================================================================
   UI — wizard screens float over a blurred live preview of the plan.
   Results are company-level findings first, then one block per role.
   ========================================================================== */
const S = {screen:"intro", cat:1, qi:0, ans:{}, why:false, skipped:{}, lit:null, litFrom:null};
const app=typeof document!=="undefined"?document.getElementById("app"):null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function stepsHTML(){
  return `<div class="steps">`+CATS.map(c=>{
    const qs=catQs(c.n);
    return `<div class="grp">`+qs.map((q,i)=>{
      const done=S.ans[q.id]!==undefined||S.skipped[c.n];
      const now=S.screen==="q"&&S.cat===c.n&&i===S.qi;
      return `<div class="step ${now?"now":(done?"done":"")}"></div>`;
    }).join("")+`</div>`;
  }).join("")+`</div>`;
}

function qRows(items, pfx, live){
  return items.map((d,i)=>live?`
    <tr>
      <td>${d.bold?"<b>"+esc(d.k)+"</b>":esc(d.k)}</td>
      <td class="num">${d.bold?"<b>"+esc(d.v)+"</b>":esc(d.v)}</td>
      <td class="qcell"><button class="q" onclick="tip('${pfx}${i}')">?</button></td>
    </tr>
    <tr class="tiprow" id="t${pfx}${i}" hidden>
      <td colspan="3"><div class="tipbox">${esc(d.w)}</div></td>
    </tr>`
  :`<tr><td>${esc(d.k)}</td><td class="num">${esc(d.v)}</td><td class="qcell"></td></tr>`).join("");
}

/* Plan warnings whose damage lands after the quarter, so no quarter's numbers
   will ever show them. This used to feed a CEO card that repeated the plan
   page's own sentences on the quarter view; the idea it carried, that a clean
   quarter does not clear these, belongs next to the warning itself. */
const SLOW_HARM = new Set([
  "Nobody is paid to grow an existing account",
  "The step from SDR to AE barely pays",
  "Margin-based commission on a thin margin",
  "Total forfeiture on resignation is legally exposed",
  "A 180-day clawback is long for this motion",
  "Your ramp is shorter than your sales cycle",
  "Customer Success is expensive against the book it protects",
  "Company goals: nobody is paid to keep the customer"
]);

/* REDS TO THE TOP, AND NOTHING ELSE MOVES.

   The engine builds p.flags as an argument rather than a ranking: the quota
   economics, then pay mix and affordability, then the three principles in
   their own order, Motivation, Simplicity, Company goals, then the edges. That
   sequence is deliberate and a plain severity sort would scatter it.

   What it was not built for was leaving a red stranded. On `#mixed` the eighth
   finding is "You picked a flat rate and then an accelerator", a red, sitting
   under four greens, and Javier found it by reading past them. `wizard-copy.md`
   already states the principle for the simulator's own findings panel:
   "Findings sort by severity, not by a fixed order... no finding is ever
   stranded at the bottom of the list when it is the one that matters." The
   one-pager follows it too. The plan view was the one surface that did not, and
   nothing on record says that was decided.

   So the reds come up and everything else keeps its place. The sort is stable,
   which is what makes the second half of that sentence true: within the reds
   and within everything else the original order survives untouched. Same
   comparator the one-pager uses, so the two surfaces cannot disagree about what
   counts as first. Javier, 27 Oct: "lift the reds to the top and leave
   everything else exactly where it is." */
function redsFirst(list){
  return list.slice().sort((a,b)=>(a.t==="bad"?0:1)-(b.t==="bad"?0:1));
}

function flagsHTML(list){
  return list.map(f=>{
    // REDS ONLY. An amber is worth knowing, not worth interrupting for, and a
    // plan with six ambers would carry six invitations to go and change something.
    const fixable = f.t==="bad" && f.src && f.src.length && f.src.length<=3;
    return `<div class="flag ${f.t}"><b>${esc(f.h)}</b>${esc(f.b)}`+
      (SLOW_HARM.has(f.h) ? `<span class="slow">Won't show up in quarterly results.</span>` : ``)+
      (fixable ? `<a class="fix noprint" href="#"
         onclick="fixAnswers('${f.src.join(",")}','${encodeURIComponent(f.h)}');return false;"
         >Change what's driving this &rsaquo;</a>` : ``)+
      `</div>`;
  }).join("");
}

function roleHTML(p, role, idx, live, open){
  /* Reuses the ? affordance from the numbers table rather than inventing a
     second one, and like those it is live-only: a printed plan has nobody to
     click it. Only the Manager role carries a note; every other role's weights
     do not move with anything. */
  const shareQ = (live && role.shareNote)
    ? ` <button class="q" onclick="tip('s${idx}')">?</button>` : ``;
  const shareRow = (live && role.shareNote)
    ? `<tr class="tiprow" id="ts${idx}" hidden><td colspan="3">`+
      `<div class="tipbox">${esc(role.shareNote)}</div></td></tr>` : ``;
  /* Both halves of a manager's variable improve when somebody leaves: reps at
     quota is a ratio with headcount underneath it, and team attainment measures
     against the sum of the CURRENT team's quotas, so a leaver takes their target
     away and leaves their shortfall behind. The plan flag makes the argument;
     these two rows carry the mark so the rule is attached to the components it
     governs rather than only to a card further down. */
  const comps = role.components.map(c=>`
    <tr><td>${esc(c.label)}</td>
        <td class="num">${c.weight===null?"on top":pct0(c.weight)}</td>
        <td>${esc(c.detail)}</td></tr>`).join("");
  /* The note was specified as a mark on the team-attainment and reps-at-quota
     rows, which was written when only an AE manager was in view. Every manager
     component has the property: each one measures a team against the sum of the
     CURRENT team's targets, and the participation halves are ratios with
     headcount underneath them. Seven superscripts on a seven-row table is noise,
     so it reads as one note under the table instead. */
  const proRow = role.key === "MGR"
    ? `<tr class="tiprow"><td colspan="3"><p class="note">Every component above is measured on the `+
      `roster at quarter open, with a leaver's quota and attainment pro-rated to their time in the `+
      `seat.</p></td></tr>` : ``;
  const head = `${esc(role.name)}`
    + (role.count?` &middot; ${role.count}`:``)
    + (role.sub?` &middot; ${esc(role.sub)}`:``)
    + (role.ote?` &middot; ${moneyK(role.ote)} OTE &middot; ${esc(role.mix)}`:``)
    + (role.findings.length?` <span class="badge ${role.findings.some(f=>f.t==="bad")?"bad":"warn"}">${role.findings.length}</span>`:``);
  return `
  <details class="role" ${open?"open":""}>
    <summary>${head}</summary>
    <div class="rolebody">
      <h4>What they're paid on</h4>
      <div class="scroll"><table>
        <tr><th>Component</th><th class="num">Share${shareQ}</th><th>How it pays</th></tr>${comps}${proRow}${shareRow}
      </table></div>
      <h4>Why this shape</h4>
      <p class="lede">${esc(role.rationale)}</p>
      ${role.findings.length?`<h4>What the simulator noticed here</h4>${flagsHTML(role.findings)}`:``}
      <h4>The numbers</h4>
      <div class="scroll"><table>
        <tr><th>Value</th><th class="num">Result</th><th></th></tr>
        ${qRows(role.numbers,"r"+idx+"_",live)}
      </table></div>
      ${role.scen?`
      <h4>Payout scenarios</h4>
      <div class="scroll"><table>
        <tr><th>Attainment</th><th>${esc(role.scenCol||"Revenue closed")}</th>
            <th class="num">Variable earned</th>
            <th class="num">Total earnings</th><th class="num">% of OTE</th></tr>
        ${role.scen.map(s=>`<tr><td>${s.att}%${s.att===100?" (target)":""}</td>
          <td>${esc(s.unit||money(s.rev))}</td><td class="num">${money(s.comm)}</td>
          <td class="num">${money(s.total)}</td><td class="num">${pct0(s.pctOte)}</td></tr>`).join("")}
      </table></div>
      ${role.scenNote?`<p class="note">${esc(role.scenNote)}</p>`:``}`:``}
    </div>
  </details>`;
}

function costRows(p){
  const c=[
    {k:"Team quota ("+p.aes+" AEs)", v:money(p.teamQuota),
     w:`${moneyK(p.quota)} each. This is the revenue the plan is built to buy.`},
    {k:"Existing book", v:money(p.book),
     w:`${p.bookRatio.toFixed(1)}x what the team will sell this year. Everything CS does happens inside this number.`},
    {k:"AE variable at 100%", v:money(p.aeVar),
     w:`${p.aes} reps earning ${money(p.variable)} each if every one lands exactly on target.`}
  ];
  if (p.sdrs) c.push({k:"SDR variable ("+p.sdrs+")", v:money(p.sdrVar),
    w:`30% of ${article(moneyK(p.sdrOte))} ${moneyK(p.sdrOte)} OTE each.`});
  if (p.css) c.push({k:"CS variable ("+p.css+")", v:money(p.csVar),
    w:`20% of ${article(moneyK(p.csOte))} ${moneyK(p.csOte)} OTE each. The lowest variable share on the plan, because they control the least.`});
  if (p.mgrVar) c.push({k:"Manager variable", v:money(p.mgrVar),
    w:`40% of OTE across every manager the org is big enough to need.`});
  c.push({k:"Total variable at 100%", v:money(p.totalVar), bold:true,
    w:`Everyone hitting target exactly. Real quarters never look like this, which is what the capacity `+
      `model stress-tests.`+(p.r.CREDIT==="CREDIT_DOUBLE"?` Includes 8% for double crediting.`:``)});
  c.push({k:"AE commission as % of new business", v:pct(p.aeCostOfRev),
    w:`The apples-to-apples figure against the 8% to 15% industry commission guardrail.`});
  c.push({k:"All sales variable as % of new business", v:pct(p.salesCostOfRev),
    w:`AEs, SDRs and the managers who run them. Sales roles are funded by the revenue they bring in, so `+
      `this is the number the guardrail applies to. Your ceiling is about ${pct(p.guardrail)}, wider than `+
      `15% because SDRs and managers cost money without carrying quota.`});
  if (p.hasCs) c.push({k:"CS variable as % of book", v:pct(p.csCostOfBook),
    w:`Customer Success is funded by the book it protects, not by new business, so measuring it against `+
      `new revenue would be comparing two different businesses. On ${article(moneyK(p.book))} ${moneyK(p.book)} book this is what `+
      `retention variable costs you.`});
  c.push({k:"All variable as % of gross profit", v:pct(p.shareOfGp),
    w:`Total variable against ${moneyK(p.revBase)} of revenue at ${article(pct(p.gm))} ${pct(p.gm)} margin. This is the number `+
      `a CFO actually asks about.`});
  return c;
}


/* ==========================================================================
   THE ONE-PAGER
   Hidden on screen, and the only thing that prints. Everything here is a
   compression of the results view for a reader who never answered the
   questions, so it opens by saying what business it was built for.
   ========================================================================== */
const BADGE={bad:"ISSUE", warn:"WATCH", ok:"OK"};

/* ---- THE ONE-PAGER FITS ITSELF ONTO ONE PAGE -------------------------------
   It had stopped being one. Measured in Chromium at the real print width, six of the
   eight presets printed on two pages and the worst was 12.00in of content in a 9.55in
   box. Three structural fixes took most of that out, the cost table in two columns, the
   passed checks two up, and column widths on the role table, which between them bought
   about 1.5in. What is left is the findings block, and a fixed cap on it is the wrong
   instrument: a cap has to be set for the worst plan the tool can build, so every other
   plan prints fewer findings than its page had room for.

   So the page trims itself. Cards come off the bottom of the findings block, one at a
   time, until the content fits, and the "N more in the full plan view" line is rewritten
   as it goes, so the document is honest about what it is not showing whatever it decides
   to show. A plan with four short findings keeps all four.

   WHY THIS CANNOT RUN OUT OF ROOM. The trim can only remove flagged cards; the head, the
   KPI row, the passed checks, both tables, the two notes and the footer are fixed. That
   floor was measured across 808 random answer sets and runs 5.68in to 7.80in, so the
   worst case still leaves 1.75in of slack in the box, and no plan's floor overflowed. The
   floor also has room to grow by roughly sixteen more passed findings before it matters.

   WHAT IT DOES NOT COVER, and nothing could. The box is Letter less this file's own
   margins. A4 is narrower, so text wraps more while this measures against Letter. A
   reader who widens the margins in the print dialog, or prints at a scale other than
   100%, gets a box smaller than the one being measured, and CSS does not expose the real
   page box to script, so a 5% safety target was tried and dropped: see OP_SAFETY. Font
   fallback is the one case that is safe, because this measures the text the browser
   actually drew rather than guessing at metrics.

   It runs on beforeprint, where the print stylesheet is live and the one-pager is
   displayed, which is the only moment the real heights exist. Every rule for this
   document lives inside @media print, so an offscreen clone measured on screen would be
   unstyled and the numbers would be fiction. A browser that never fires beforeprint gets
   today's behaviour, which is a second page: a degradation, not a break.
   Javier, 2 Oct. */
const OP_MAX_CARDS = 4;          // the ceiling, before any trimming
const OP_MIN_CARDS = 2;          // never strip the section bare, whatever the measurement says
/* THE FLOOR GIVES WAY BEFORE THE PAGE DOES. Javier's rule is that the one-pager is one page
   on every plan the tool can build, and four answer sets broke it: all four carry TEAM_FULL,
   whose role table makes the fixed part of the page taller, and they measured 9.64 to 9.98
   inches against a 9.55 box with the trim already down to its floor of two cards. A card is
   about 0.7in, so dropping one more clears every one of them.
   Two cards is a guard against stripping the section bare, not a principle, and one card plus
   an honest "and 3 more issues" beats a second page carrying one finding. So the floor is two
   normally and one on a plan that still overflows at two, which is the only case that reaches
   it: the presets all fit at two or more. Javier, 22 Oct: "we made a rule to fix all one
   pagers into a one page." */
const OP_HARD_MIN  = 1;
/* 11in less the 0.5in top and 0.6in bottom this file sets.
   THE BOTTOM MARGIN WAS 0.95in AND MOST OF IT WAS DOING NOTHING. It is there to
   keep the fixed footer clear of the paper edge, and that footer is 21px tall
   against 91px of reserved space. The other 70 were empty.
   Why it was worth reclaiming, 26 Oct. The box was 917px and the fit targeted
   909, which is eight pixels of slack. Javier printed the plan through
   Microsoft Print to PDF, the Windows virtual printer, with Chrome's headers
   and footers on, and four of the eight presets came back on two pages. Through
   Chrome's own Save as PDF, which has no printer driver and no hardware margin,
   all eight print on one page. A driver reports its own printable area, which
   is narrower than the paper, and narrower means text wraps more and the
   document gets taller than the browser measured a moment earlier.
   He printed a ruler through this same @page rule to settle it: the usable
   height came back at 920px, so the box itself was never the problem. Eight
   pixels of slack was.
   Nothing is trimmed differently by this. The target stays 909 and the card
   counts are identical on all eight presets; the same document simply prints
   into a box with 41px of room instead of 8. */
const OP_BOX       = 9.9 * 96;
/* THE GAP BETWEEN THE BOX AND THE TARGET, and it is now the whole point of the pair.
   What matters to the reader is the TARGET, OP_BOX minus this, because that is the height
   a trimmed one-pager is allowed to reach and therefore how many findings get printed. It
   was 917 - 8 = 909. It is 950 - 41 = 909. The same number, so the trim is unchanged and
   the card counts are identical on all eight presets; what changed is that the page the
   document lands on is now 950px rather than 917, so those 909px arrive with 41px of room
   instead of eight.
   WHY NOT SIMPLY LOWER THE TARGET. That was the other option and it costs findings: a 5%
   buffer against the old box was tried in October and took a printed finding off three of
   the eight presets. Raising the box instead costs nothing, which is why it went first.
   Javier, 26 Oct, on the choice: "Do the free fix and after we will leave it as that no
   matter what happens."
   WHAT THE 41px IS PROTECTING AGAINST, honestly. Not a reader widening the margins, which
   is a quarter inch or more and this still would not cover. It is the difference between
   the height the browser measures a moment before printing and the height the page
   actually comes out at on a printer driver, whose printable area is narrower than the
   paper, so text wraps more and the document grows. Measured on Javier's machine: four of
   eight presets spilled through Microsoft Print to PDF with Chrome's headers and footers
   on, and none through Chrome's own Save as PDF. */
const OP_SAFETY    = 41;

/* THE LINE BREAKS THE COUNT DOWN BY SEVERITY, and that is not cosmetic.
   It read "6 more issues and watch items in the full plan view", which is one bucket for
   two things that are not alike. A reader could not tell whether the six were six
   warnings or two red issues and four warnings, and on 8% of plans a RED is behind that
   count: measured across 408 plans, 34 produce five or six reds against a ceiling of
   four. Six reds at roughly 0.7in a card beside a 7.9in floor is 12.1in, so printing
   every red is not reachable on the worst plan however the layout is tuned. Something has
   to be counted rather than shown, which makes it matter a great deal that the count says
   what kind of thing it is holding. Javier, 2 Oct, chose this over dropping the passed
   checks block to buy room, because 8% is low and the sentence is honest.

   The trim itself does not threaten a red. Findings sort bad first and cards come off the
   bottom, so warnings go first by construction, and in 408 plans the trim never reached a
   red. It is not prevented, though: a plan carrying four or more reds that is also tall
   enough to trim would cut one, and 11% of plans carry four or more. onepager-check.js
   asserts it does not happen.

   One copy of the sentence, because the trim rewrites the line the render wrote. */
function opMoreLine(reds, warns){
  if (!reds && !warns) return "";
  // "more" attaches to the first count only: "2 more issues and 4 watch items".
  const what =
    reds && warns ? reds + " more issue" + (reds===1?"":"s") + " and " +
                    warns + " watch item" + (warns===1?"":"s")
    : reds        ? reds + " more issue" + (reds===1?"":"s")
                  : warns + " more watch item" + (warns===1?"":"s");
  return what + " in the full plan view. Everything that passed is shown below.";
}

function fitOnePage(){
  const op = document.getElementById("onepager");
  if (!op) return;
  const more = op.querySelector(".op-more");
  if (!more) return;
  // What the render already held back at the ceiling, by severity.
  const baseReds  = parseInt(more.dataset.reds  || "0", 10);
  const baseWarns = parseInt(more.dataset.warns || "0", 10);
  const cards = [...op.querySelectorAll(".op-flag:not(.ok)")];
  // Put back anything an earlier print took out, so a second print of the same plan
  // starts from the full set rather than trimming the trimmed.
  cards.forEach(c => c.hidden = false);
  let cut = 0;
  const setMore = () => {
    // Each card carries its own severity, so the count stays broken down however the
    // trim lands rather than collapsing back into one bucket.
    let reds = baseReds, warns = baseWarns;
    for (let i = 0; i < cut; i++)
      cards[cards.length - 1 - i].dataset.sev === "bad" ? reds++ : warns++;
    const text = opMoreLine(reds, warns);
    more.hidden = !text;
    if (text) more.textContent = text;
  };
  setMore();
  const over = () => op.getBoundingClientRect().height > OP_BOX - OP_SAFETY;
  while (over() && cards.length - cut > OP_MIN_CARDS) {
    cards[cards.length - 1 - cut].hidden = true;
    cut++;
    setMore();
  }
  /* Still over with the normal floor reached: take one more rather than print two pages. */
  while (over() && cards.length - cut > OP_HARD_MIN) {
    cards[cards.length - 1 - cut].hidden = true;
    cut++;
    setMore();
  }
}
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("beforeprint", fitOnePage);
  // Chrome fires the media query rather than the event in some print paths, so both.
  if (window.matchMedia) {
    const mq = window.matchMedia("print");
    if (mq.addEventListener) mq.addEventListener("change", e => { if (e.matches) fitOnePage(); });
  }
}

function onePagerHTML(p){
  const r=p.r;
  const flagged=p.flags.filter(f=>f.t!=="ok")
    .concat(...p.roles.map(R=>R.findings.filter(f=>f.t!=="ok")))
    .sort((a,b)=>(a.t==="bad"?0:1)-(b.t==="bad"?0:1));
  const passed=p.flags.filter(f=>f.t==="ok");
  /* FOUR IS THE CEILING, NOT THE RULE. A fixed cap has to be set for the worst plan the
     tool can build, which means every other plan prints fewer findings than its page had
     room for. Four is what fits on most plans, and fitOnePage() below takes cards off the
     bottom only on the plans that actually need it. Javier, 2 Oct: "cut the findings only
     on the ones that need that cut". */
  const shown=flagged.slice(0,OP_MAX_CARDS), hidden=flagged.length-shown.length;
  // Held back at the ceiling, split by severity, because the "N more" line names both.
  const held=flagged.slice(OP_MAX_CARDS);
  const heldReds=held.filter(f=>f.t==="bad").length, heldWarns=held.length-heldReds;

  // Passed checks keep their box and their colour and gain the word, they just
  // lose the body text. Colour still does work; it just is not doing it alone.

  /* WHAT IT COSTS, IN TWO COLUMNS RATHER THAN FIVE STACKED ROWS.
     This table is what pushed the one-pager onto a second page. Measured in Chromium
     against the file's own 9.55in page box, six of the eight presets printed to two
     pages, over by 0.64in on the typical case and 1.12in on #mixed, and page two held
     the tail of this table plus the two notes and the footer. It was never caught
     because the two sample PDFs in the project folder are #clean and #messy, which are
     two of the three presets that fit.

     The document's top half was already horizontal (.op-kpi is a flex row of boxes) and
     its bottom half was vertical for no reason other than it grew that way. Pairing the
     rows recovers two rows of height on every plan and drops nothing: no finding is cut,
     no figure is cut, and type does not shrink, which matters because Javier had already
     told me everything but the main titles was too small.

     The split is semantic rather than arithmetic. LEFT is the shares, what each group of
     people costs against the money they are measured on. RIGHT is the totals, which is
     where the headline figure belongs, and pairing puts Total variable top right where
     the eye lands rather than fourth down a list. Rows are derived from the pairs, so a
     plan with no CS team gives two rows and not a blank one. Javier, 2 Oct. */
  const costTable = p => {
    const left = [
      ["AE commission as a share of new business", pct(p.aeCostOfRev), false],
      ["All sales variable as a share of new business", pct(p.salesCostOfRev), false],
    ];
    if (p.hasCs) left.push(["CS variable as a share of the book", pct(p.csCostOfBook), false]);
    const right = [
      ["Total variable at 100% attainment", money(p.totalVar), true],
      ["Share of gross profit at "+pct(p.gm)+" margin", pct(p.shareOfGp), false],
    ];
    const cell = (c, cls) => c
      ? `<td class="op-r ${cls}">${c[2]?`<b>${c[0]}</b>`:c[0]}</td>`
        + `<td class="op-r op-n">${c[2]?`<b>${c[1]}</b>`:c[1]}</td>`
      : `<td class="op-r ${cls}"></td><td class="op-r"></td>`;
    const rows = Math.max(left.length, right.length);
    let out = "";
    for (let i = 0; i < rows; i++)
      out += "<tr>" + cell(left[i], "") + cell(right[i], "op-gut") + "</tr>";
    return `<table class="op-tbl op-cost">${out}</table>`;
  };

  const roleLine = R => {
    const comps=R.components.filter(c=>c.weight!==null)
      .map(c=>c.label+(c.weight<1?" "+pct0(c.weight):"")).join(", ");
    return `<tr>
      <td class="op-r"><b>${esc(R.name)}</b>${R.count?` &nbsp;${R.count}`:``}</td>
      <td class="op-r">${R.ote?moneyK(R.ote)+" OTE":"&mdash;"}</td>
      <td class="op-r">${esc(R.mix||"")}</td>
      <td class="op-r">${esc(comps)}</td></tr>`;
  };

  return `
  <div id="onepager">
    <div class="op-head">
      <h1>Compensation Plan</h1>
      <p class="op-sub">Built for ${esc(an(p.seg))} motion at ${esc(V.STAGE_LABEL[r.STAGE])},
      ${p.aes} Account Executives carrying ${moneyK(p.teamQuota)} of new business
      against ${moneyK(p.book)} of existing revenue.</p>
    </div>

    <div class="op-kpi">
      <div><span>Team quota</span><b>${moneyK(p.teamQuota)}</b></div>
      <div><span>Total variable</span><b>${moneyK(p.totalVar)}</b></div>
      <div><span>Sales cost of new business</span><b>${pct(p.salesCostOfRev)}</b></div>
      <div><span>Share of gross profit</span><b>${pct(p.shareOfGp)}</b></div>
    </div>

    <h2>What the simulator found</h2>
    ${/* data-sev so fitOnePage() can tell what it is hiding without reading the badge
          text, which is copy and could change. */``}
    ${shown.map(f=>`<div class="op-flag ${f.t}" data-sev="${f.t}">
        <span class="op-badge ${f.t}">${BADGE[f.t]}</span>
        <b>${esc(f.h)}</b> ${esc(f.b)}</div>`).join("")}
    ${/* Always rendered, hidden when the count is zero, because fitOnePage() may create a
          count where the plan had none and needs a line to write it into. */``}
    <p class="op-more" data-reds="${heldReds}" data-warns="${heldWarns}"${hidden>0?``:` hidden`}>${opMoreLine(heldReds,heldWarns)}</p>
    ${/* THE PASSED CHECKS GO TWO UP, for the same reason the cost table did.
          Each one is a single line, a badge and a heading with no body text, and on
          #mixed there are six of them stacked down the page. Two per row halves that
          block. Nothing is cut and nothing shrinks: the only thing that changes is that
          a one-line card stops claiming a full page width it does not use. Together
          with the cost table this is what brings the worst case back inside one page.
          Flex wrap rather than a table, so an odd count leaves the last card at half
          width in its row instead of stretching it to full and making it look like a
          different kind of thing. Javier, 2 Oct. */``}
    <div class="op-ok-grid">
      ${passed.map(f=>`<div class="op-flag ok">
        <span class="op-badge ok">OK</span><b>${esc(f.h)}</b></div>`).join("")}
    </div>

    <h2>Who gets paid, and how</h2>
    ${/* op-roles carries column widths. Without them auto layout handed "Paid on" 508 of
          710px and starved the other three, so Role, OTE and Mix each wrapped to two
          lines on rows whose own text was one: "Account Executives 16" wrapped in 101px,
          "$120K OTE" in 54px, "60% / 40%" in 47px. Every role row was 41px when it should
          have been 22px, which was 0.48in of the overflow on #full, bought back for
          nothing. Javier, 2 Oct. */``}
    <table class="op-tbl op-roles">
      <tr><th>Role</th><th>OTE</th><th>Mix</th><th>Paid on</th></tr>
      ${p.roles.map(roleLine).join("")}
    </table>

    <h2>What it costs</h2>
    ${costTable(p)}
    <p class="op-note">Base salary sits on top of every figure above. Built on ${p.aes} Account
    Executives, the middle of the band selected.</p>

    <p class="op-honesty">${honestyFor(p)}</p>

    <div class="op-foot">
      <span>Comp Plan Simulator &mdash; One-Pager</span>
      <span>Javier J. Hernandez &mdash;
        <a href="https://www.linkedin.com/in/javierjotah">linkedin.com/in/javierjotah</a></span>
    </div>
  </div>`;
}

function planHTML(p, live){
  return `
  <div class="card">
    <h2>Your compensation plan</h2>
    <p class="lede">${p.aes} Account Executives on ${esc(an(p.seg))} motion, ${moneyK(p.teamQuota)} of new
    business against ${article(moneyK(p.book))} ${moneyK(p.book)} book.</p>
    <div class="kpi">
      <div><div class="k">Team quota</div><div class="v">${moneyK(p.teamQuota)}</div></div>
      <div><div class="k">Total variable</div><div class="v">${moneyK(p.totalVar)}</div></div>
      <div><div class="k">Sales cost of new business</div><div class="v">${pct(p.salesCostOfRev)}</div></div>
      <div><div class="k">All variable, share of gross profit</div><div class="v">${pct(p.shareOfGp)}</div></div>
    </div>

    <p class="note">Built on ${p.aes} Account Executives, the middle of the band you chose. Every figure
    below scales with that number, and you will be able to set your exact headcount with a lever.</p>

    <h3>What the simulator noticed &middot; ${p.flags.length} findings</h3>
    ${flagsHTML(redsFirst(p.flags))}
    ${honestyHTML(p)}

    <h3>Who gets paid, and how</h3>
    ${p.roles.map((role,i)=>roleHTML(p,role,i,live,i===0)).join("")}

    <h3>What this costs the company</h3>
    <div class="scroll"><table>
      <tr><th>Line</th><th class="num">Value</th><th></th></tr>
      ${qRows(costRows(p),"c",live)}
    </table></div>
  </div>`;
}

/* ---- screen bodies ---- */
function iIntro(){
  return `
    <h1>Let's build your compensation plan.</h1>
    <p>This simulator walks you through a short set of questions about your business, your team, and
    how you want your people to be paid. At the end it generates a complete compensation plan built
    to match what you actually described, not a generic template.</p>
    <h3>What you get</h3>
    <ul class="plain">
      <li>A one-page plan summary, and why it was designed this way</li>
      <li>A launch deck for rolling it out to your team</li>
      <li>A compensation agreement written as a real contract</li>
      <li>A capacity model that stress-tests what it costs</li>
      <li>A finance tracker for attainment and accruals</li>
      <li>A live quarter simulator you can play with</li>
    </ul>
    <p>Don't worry about getting everything exactly right! Not sure on a question? Let the simulator
    decide it. Changed your mind later? Come back and change a single answer, or retake the whole
    thing. Nothing is locked in.</p>
    <div class="nav"><span></span>
      <button class="btn primary" onclick="goCat(1)">Let's go</button></div>`;
}

function iCat(){
  const c=CATS.find(x=>x.n===S.cat);
  return `
    ${stepsHTML()}
    <div class="cat">Section ${c.n} of 5 &middot; ${esc(c.name)}</div>
    <h1>${esc(c.title)}</h1>
    ${c.body.map(b=>`<p class="lede">${esc(b)}</p>`).join("")}
    <div class="nav">
      <button class="btn" onclick="catBack()">Back</button>
      <div class="navright">
        ${c.skippable?`<button class="link" onclick="skipCat(${c.n})">Skip and build my plan</button>`:``}
        <button class="btn primary" onclick="startCat(${c.n})">${c.n===1?"Let's go":"Continue"}</button>
      </div>
    </div>`;
}

function iQ(){
  const qs=catQs(S.cat), q=qs[S.qi], c=CATS.find(x=>x.n===S.cat);
  const cur=S.ans[q.id];
  return `
    ${stepsHTML()}
    <div class="cat">Section ${S.cat} of 5 &middot; ${esc(c.name)}</div>
    <div class="qnum">Question ${S.qi+1} of ${qs.length}</div>
    <h2>${esc(q.t)}</h2>
    <div class="opts">
      ${q.o.map(o=>`<button class="opt ${cur===o[0]?"sel":""}" onclick="pick('${q.id}','${o[0]}')">
        <b>${esc(o[1])}</b>${o[2]?`<small>${esc(o[2])}</small>`:""}</button>`).join("")}
      <button class="opt auto ${cur===AUTO?"sel":""}" onclick="pick('${q.id}','${AUTO}')">
        <b>Let Simulator Decide</b><small>Not sure? We'll take care of it.</small></button>
    </div>
    <button class="whybtn" onclick="toggleWhy()">${S.why?"Hide":"Why are we asking this?"}</button>
    ${S.why?`<div class="why"><p>${esc(q.w)}</p></div>`:""}
    <div class="nav">
      <button class="btn" onclick="prevQ()">Back</button>
      ${isLastQ()&&cur!==undefined
        ? `<button class="btn primary" onclick="go('plan')">Build my plan</button>`
        : `<span></span>`}
    </div>`;
}

function iReview(){
  const r=resolve(S.ans);
  const row=(q,cn,i)=>{
    const key=(S.ans[q.id]&&S.ans[q.id]!==AUTO)?S.ans[q.id]:r[q.id];
    const lbl=(q.o.find(o=>o[0]===key)||[])[1]||key;
    return `<div class="rev">
      <div><div class="lbl">${esc(q.t)}</div><div class="val">${esc(lbl)}</div></div>
      <button onclick="jump(${cn},${i})">Change</button></div>`;
  };

  // Came from a finding: show ONLY the answers behind it. Everything else is a
  // click away and almost nobody wants it, so it does not get to be the default.
  if (S.lit){
    const picked=[];
    CATS.forEach(c=>catQs(c.n).forEach((q,i)=>{
      if (S.lit.indexOf(q.id)>=0) picked.push(row(q,c.n,i));
    }));
    return `
      ${stepsHTML()}
      <h2>${picked.length===1?"The answer":"The "+picked.length+" answers"} behind this finding</h2>
      ${S.litFrom?`<p class="lede">${esc(S.litFrom)}</p>`:``}
      ${picked.join("")}
      <p class="revmore"><a href="#" onclick="showAllAnswers();return false;">See all twenty answers</a></p>
      <div class="nav"><span></span>
        <button class="btn primary" onclick="go('plan')">Back to my plan</button></div>`;
  }

  return `
    ${stepsHTML()}
    <h2>Your answers</h2>
    <p class="lede">Change anything and we'll rebuild.</p>
    ${CATS.map(c=>{
      const qs=catQs(c.n);
      return `<h3>Section ${c.n} of 5 &middot; ${esc(c.name)}</h3>`+qs.map((q,i)=>row(q,c.n,i)).join("");
    }).join("")}
    <div class="nav"><span></span>
      <button class="btn primary" onclick="go('plan')">Build my plan</button></div>`;
}

const MODAL = {intro:iIntro, cat:iCat, q:iQ, review:iReview};

function render(){
  if (MODAL[S.screen]){
    app.innerHTML =
      `<div class="blurwrap" aria-hidden="true"><div class="blurbg">${planHTML(buildPlan(S.ans),false)}</div></div>
       <div class="scrim"><div class="card modal">${MODAL[S.screen]()}</div></div>`;
    document.body.classList.add("locked");
  } else {
    document.body.classList.remove("locked");
    const P=buildPlan(S.ans);
    app.innerHTML = planHTML(P,true) + onePagerHTML(P) + `
      <div class="card noprint" style="margin-top:14px">
        <div class="nav" style="margin:0">
          <button class="btn" onclick="go('review')">Change an answer</button>
          <div class="navright">
            <button class="btn" onclick="window.print()">Print as PDF</button>
            <button class="btn primary" onclick="restart()">Retake the simulator</button>
          </div>
        </div>
      </div>
      <p class="note noprint"><b>Not wired yet.</b> The deck, the contract and the two spreadsheets
      are the next pieces of work. "Print as PDF" produces the one-page summary.</p>`;
  }
  window.scrollTo(0,0);
  const sc=document.querySelector(".scrim"); if(sc) sc.scrollTop=0;
}

/* ---- actions ---- */
function go(s){S.screen=s;S.why=false;S.lit=null;S.litFrom=null;render();}
// Opens the review showing ONLY the answers behind one finding. Never a single
// destination: capacity is quota, segment and deal size pulling together, so
// jumping to one question would misrepresent what caused it. And never all
// twenty, which is the screen Javier objected to in the first place.
function fixAnswers(ids,from){
  S.screen="review"; S.why=false; S.lit=ids.split(","); S.litFrom=decodeURIComponent(from||"");
  render();
}
function showAllAnswers(){S.lit=null;S.litFrom=null;render();}
function goCat(n){S.cat=n;S.screen="cat";S.why=false;render();}
function startCat(n){S.cat=n;S.qi=0;S.screen="q";S.why=false;render();}
function skipCat(n){catQs(n).forEach(q=>S.ans[q.id]=AUTO);S.skipped[n]=true;afterCat(n);}
function isLastQ(){ return S.cat===5 && S.qi===catQs(5).length-1; }
function pick(id,k){S.ans[id]=k;S.why=false; if(isLastQ()) render(); else setTimeout(nextQ,110);}
function toggleWhy(){S.why=!S.why;render();}
function tip(id){const r=document.getElementById("t"+id); r.hidden=!r.hidden;}
function jump(c,i){S.cat=c;S.qi=i;S.screen="q";S.why=false;render();}
function nextQ(){
  const qs=catQs(S.cat);
  if(S.qi<qs.length-1){S.qi++;S.why=false;render();}
  else afterCat(S.cat);
}
function afterCat(n){ if(n<5) goCat(n+1); else go("plan"); }
function prevQ(){ if(S.qi>0){S.qi--;S.why=false;render();} else goCat(S.cat); }
function catBack(){
  if(S.cat===1) go("intro");
  else {S.cat--;S.qi=catQs(S.cat).length-1;S.screen="q";S.why=false;render();}
}
function restart(){S.ans={};S.skipped={};S.cat=1;S.qi=0;location.hash="";go("intro");}

/* ------------------------------------------------------------------
   PROTOTYPE CONVENIENCE, not part of the product. Add #clean, #mixed
   or #messy to the URL and you land straight on a built plan instead
   of answering twenty questions again to check one line of copy.
   Everything still behaves normally from there: change an answer,
   see all twenty, retake, print. Answer sets were picked by running
   60,000 random plans and keeping the best example of each shape.
   ------------------------------------------------------------------ */
const PRESETS = {
  clean: {ARCH:"ARCH_CHANNEL",SEG:"SEG_ENT",TEAM:"TEAM_AE_MGR",AES:"AE_11_25",
    STAGE:"STAGE_ESTABLISHED",OTE:"OTE_UNDER_100",MIX:"MIX_40_60",QUOTA:"QUOTA_400_700",
    // OBJ_RETENTION is not an option and never was. The objective question offers
    // OBJ_NEWLOGO, OBJ_NRR, OBJ_BALANCED and OBJ_MARGIN, and every objective branch is
    // an if/else chain whose last arm is the margin one, so a token matching none of
    // them fell through to margin: this preset's plan page read "the plan protects
    // profit" on a plan whose stated objective was retention. answer-check.js, 2 Oct.
    BOOK:"BOOK_10_40M",OBJ:"OBJ_NRR",MODEL:"MODEL_MARGIN",ACCEL:"ACCEL_AGGRESSIVE",
    DECEL:"DECEL_NONE",EXP:"EXP_EQUAL",RAMP:"RAMP_6MO",INC:"INC_NONE",GM:"GM_ABOVE_85",
    TERM:"TERM_CLOSED_ONLY",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  /* SEG_MIXED, AND IT SHOULD ALWAYS HAVE BEEN. A preset called `mixed` was
     answering SEG_ENT, and checking why the SDR won component had never once
     rendered turned up the larger fact: no preset was SEG_MIXED at all, three
     were ENT and five SMB, so the third segment branch of the questionnaire
     was never exercised by anything. This gives the preset space that branch
     AND makes the only three-component SDR plan reviewable: count 50, pipeline
     value 30, deals won 20. Javier, 15 Oct. */
  mixed: {ARCH:"ARCH_SERVICES",SEG:"SEG_MIXED",TEAM:"TEAM_FULL",AES:"AE_11_25",
    STAGE:"STAGE_ESTABLISHED",OTE:"OTE_UNDER_100",MIX:"MIX_40_60",QUOTA:"QUOTA_1200_PLUS",
    BOOK:"BOOK_2_10M",OBJ:"OBJ_BALANCED",MODEL:"MODEL_FLAT",ACCEL:"ACCEL_MODERATE",
    DECEL:"DECEL_NONE",EXP:"EXP_EQUAL",RAMP:"RAMP_NONE",INC:"INC_SPIFF",GM:"GM_60_75",
    // CREDIT_BOTH is not an option and never was: the question offers CREDIT_SINGLE,
    // CREDIT_SPLIT and CREDIT_DOUBLE. Matching none of them, creditUplift read as zero and
    // the launch deck printed no credit line at all. CREDIT_SPLIT keeps the uplift at zero,
    // so no figure in this preset moves and the stale token is gone. The double-credit card
    // is reached by the off-preset usage margin recipe rather than by a preset, which is
    // what the hard-to-reach page is for. answer-check.js, 2 Oct.
    TERM:"TERM_IN_FLIGHT",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  // Two more, added for the findings proof sheet rather than for the plan view.
  // #full is the only preset with every role on it: AEs, SDRs, CSMs and all three
  // kinds of manager, which is what the persona findings need in order to have a
  // subject at all. #early is the same org before it has a renewal history, so the
  // SDRs are paid on meetings and CS on onboarding, and it is the only way to see
  // the meetings variants resolved.
  // OTE raised a band: at OTE_UNDER_100 this preset ran a $600K quota against a
  // $90K OTE, which is 6.7x, outside the 4x-to-6x guidance the wizard itself gives
  // on that question. OTE is not part of the ledger seed, so this moves the money
  // and leaves the generated quarter untouched.
  full: {ARCH:"ARCH_CHANNEL",SEG:"SEG_SMB",TEAM:"TEAM_FULL",AES:"AE_11_25",
    STAGE:"STAGE_ESTABLISHED",OTE:"OTE_100_140",MIX:"MIX_60_40",QUOTA:"QUOTA_400_700",
    BOOK:"BOOK_10_40M",OBJ:"OBJ_BALANCED",MODEL:"MODEL_DEAL_SIZE",ACCEL:"ACCEL_AGGRESSIVE",
    DECEL:"DECEL_REDUCED",EXP:"EXP_EQUAL",RAMP:"RAMP_3MO",INC:"INC_BOTH",GM:"GM_60_75",
    TERM:"TERM_FORFEIT",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  early: {ARCH:"ARCH_CHANNEL",SEG:"SEG_SMB",TEAM:"TEAM_FULL",AES:"AE_11_25",
    STAGE:"STAGE_EARLY",OTE:"OTE_UNDER_100",MIX:"MIX_50_50",QUOTA:"QUOTA_UNDER_400",
    BOOK:"BOOK_10_40M",OBJ:"OBJ_BALANCED",MODEL:"MODEL_FLAT",ACCEL:"ACCEL_NONE",
    DECEL:"DECEL_REDUCED",EXP:"EXP_HIGHER",RAMP:"RAMP_DRAW",INC:"INC_NONE",GM:"GM_75_85",
    TERM:"TERM_IN_FLIGHT",CLAW:"CLAW_HOLDBACK",CREDIT:"CREDIT_SINGLE"},
  // #small is the same established company as #full, one size band down. Every
  // other preset sits in AE_11_25 or AE_4_10, so the AE_1_3 band was unreachable
  // by clicking, and with it the manager plan that band produces: at three reps
  // or fewer the reps-at-quota component disappears and 40% of the manager's
  // variable moves onto their own quota. A whole plan shape nobody could read.
  // Book dropped a band with it, because a 2-AE company carrying $10-40M is not
  // a small company, it is a company with a strange sales team.
  small: {ARCH:"ARCH_CHANNEL",SEG:"SEG_SMB",TEAM:"TEAM_FULL",AES:"AE_1_3",
    STAGE:"STAGE_ESTABLISHED",OTE:"OTE_100_140",MIX:"MIX_60_40",QUOTA:"QUOTA_400_700",
    BOOK:"BOOK_2_10M",OBJ:"OBJ_BALANCED",MODEL:"MODEL_DEAL_SIZE",ACCEL:"ACCEL_AGGRESSIVE",
    DECEL:"DECEL_REDUCED",EXP:"EXP_EQUAL",RAMP:"RAMP_3MO",INC:"INC_BOTH",GM:"GM_60_75",
    TERM:"TERM_FORFEIT",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  // #large closes the band coverage at the other end. The AE question offers
  // 1-3, 4-10, 11-25 and 26+, and the presets sat on three of them: #small on
  // 1-3, #messy on 4-10 and four presets on 11-25. Nothing answered 26+, which
  // is the only band that produces more than two teams of any kind, so the
  // Middle archetype was unreachable for every manager on every preset, and so
  // was the rank clause, which needs four teams to print at all.
  // Book raised a band with it. The book drives CS headcount, so at BOOK_10_40M
  // a 30-AE company got eight CSMs in one team and CS managers still had no
  // peer. Above $40M gives four CS teams at exactly the same $2.5M per CSM, so
  // the org grows without the ratio changing.
  large: {ARCH:"ARCH_CHANNEL",SEG:"SEG_SMB",TEAM:"TEAM_FULL",AES:"AE_26_PLUS",
    STAGE:"STAGE_ESTABLISHED",OTE:"OTE_100_140",MIX:"MIX_60_40",QUOTA:"QUOTA_400_700",
    BOOK:"BOOK_ABOVE_40M",OBJ:"OBJ_BALANCED",MODEL:"MODEL_DEAL_SIZE",ACCEL:"ACCEL_AGGRESSIVE",
    DECEL:"DECEL_REDUCED",EXP:"EXP_EQUAL",RAMP:"RAMP_3MO",INC:"INC_BOTH",GM:"GM_60_75",
    TERM:"TERM_FORFEIT",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  messy: {ARCH:"ARCH_PLG",SEG:"SEG_ENT",TEAM:"TEAM_AE_MGR",AES:"AE_4_10",
    STAGE:"STAGE_GROWTH",OTE:"OTE_180_PLUS",MIX:"MIX_70_30",QUOTA:"QUOTA_UNDER_400",
    BOOK:"BOOK_10_40M",OBJ:"OBJ_NEWLOGO",MODEL:"MODEL_FLAT",ACCEL:"ACCEL_MODERATE",
    DECEL:"DECEL_CLIFF",EXP:"EXP_NONE",RAMP:"RAMP_NONE",INC:"INC_SPIFF",GM:"GM_75_85",
    TERM:"TERM_IN_FLIGHT",CLAW:"CLAW_180",CREDIT:"CREDIT_SPLIT"},
  /* An eighth preset, and the only one whose company misses. The other seven
     vary the PLAN and land the same QUARTER: six of them finish at 105% and
     #small at 97%, so the CEO view had never been read against a company that
     failed. ceo-s1-red fired on all seven and only in the opening weeks, when
     nothing has closed yet, which is not a verdict on anything.

     Chosen by search rather than by hand. Four thousand answer sets were built,
     724 of them missed at the close, and each was scored on how much of the CEO
     view it lights up, with cards no existing preset reaches counted four times
     over. This one won: 88% at the close, and it is the only plan in the set
     that reaches ceo-c-capacity, the card saying the quota cannot be worked and
     coaching will not change it. */
  miss: {ARCH:"ARCH_CHANNEL",SEG:"SEG_SMB",TEAM:"TEAM_AE_CS_MGR",AES:"AE_11_25",
    STAGE:"STAGE_EARLY",OTE:"OTE_180_PLUS",MIX:"MIX_50_50",QUOTA:"QUOTA_700_1200",
    BOOK:"BOOK_ABOVE_40M",OBJ:"OBJ_NEWLOGO",MODEL:"MODEL_MARGIN",ACCEL:"ACCEL_AGGRESSIVE",
    DECEL:"DECEL_REDUCED",EXP:"EXP_NONE",RAMP:"RAMP_NONE",INC:"INC_TEAM",GM:"GM_60_75",
    TERM:"TERM_FORFEIT",CLAW:"CLAW_NONE",CREDIT:"CREDIT_SPLIT"}
};
function loadPreset(){
  const k=(location.hash||"").replace("#","").toLowerCase();
  if (!PRESETS[k]) return false;
  S.ans=Object.assign({},PRESETS[k]); S.skipped={}; S.lit=null; S.litFrom=null;
  S.screen="plan"; return true;
}







window.ENGINE = {ENGINE_SOURCE_SHA, V, Q, CATS, STAGES, PRESETS, AUTO, resolve, buildPlan, buildRoles, planFindings, buildLedger, quarterState, dealsAsOf, attainmentFor, closeWeek, rng, openStage, weeksInStage, commAt, roleEarn, mgrWeights, atTargetTest, retentionPay, participationPay, teamAttainPay, sdrEarn, mgrTeamFloor, mgrThirdPay, mgrThirdLive, mgrFold, mgrPay, csPay, loadPreset, planHTML, QTR_WEEKS, CLOSED, PACE, SPREAD, SPREAD_MEAN, CHURN_SPREAD, EXP_SPREAD, CAP_DEALS, CYCLE_LABEL, CYCLE_WEEKS, TEAM_SPREAD, EARLY_SHARE, CARRYOVER_SHARE, STALL_WEEKS, LOWEST_QUOTA, TIER_MULT, TIER_MIX, PRODUCTS, KICK_LINE, KICK_PCT, PARTICIPATION_TARGET, MEETING_TO_PIPE, EARLY_MEETING_CAP, MGR_SPAN, SDR_FLOOR, CS_FLOOR, SDR_MGR_MIN, CS_MGR_MIN, CS_EXP_GROWTH, MGR_EXP_WEIGHT, AE_EXP_SHARE, RET_FLOOR, RET_FULL, SDR_REJECT, MGR_TEAM_FLOOR, SLOW_HARM, HONESTY, NO_DISCOUNT, honestyFor, onePagerHTML, money, moneyK, pct, pct0, num, esc, article, an, An};
