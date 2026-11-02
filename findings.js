/* ===========================================================================
   THE FINDINGS LIBRARY
   Every persona finding, as data. Three things per finding and no more:
   the sentence exactly as it is written in the copy document, the condition
   that fires it, and the tokens it needs.

   The sentence is stored with its {{TOKENS}} still in it rather than as a
   built string, deliberately. It means the copy in here can be diffed
   against the copy document, and it means a token nobody computed shows up
   on screen as {{LIKE_THIS}} instead of quietly rendering as "undefined".

   Nothing in here decides anything. The engine produces the quarter, the
   state layer reads it at a week, and this file only says what is worth
   saying about what it found.
   =========================================================================== */

/* ---- where the sentences come from at runtime ---------------------------
   The lookup table, `commission_rules.json`, under `findings`. In the browser
   it arrives as window.COMMISSION_RULES, written by rules.global.js; in node
   it is required directly. Both are resolved lazily, because in the browser
   this file loads BEFORE rules.global.js and only runs later, when a finding
   is actually resolved.

   A MISSING KEY IS LOUD. If the table has no entry for a finding, the reader
   gets {{MISSING COPY: the-id}} on screen rather than the word "undefined" or
   a silent blank, which is the same reasoning as leaving an unresolved
   {{TOKEN}} visible: a copy problem should look like a copy problem. It also
   means a stale table cannot hide, because the checker and the screen fail the
   same way. */
let COPY_TABLE = null;
function copyTable(){
  if (COPY_TABLE) return COPY_TABLE;
  let rules = null;
  if (typeof window !== "undefined" && window.COMMISSION_RULES) rules = window.COMMISSION_RULES;
  else if (typeof require === "function"){
    try { rules = require("./commission_rules.json"); } catch (e){ rules = null; }
  }
  COPY_TABLE = (rules && rules.findings) || {};
  return COPY_TABLE;
}
function copyFor(f, key){
  const entry = copyTable()[f.id];
  if (entry && entry[key] !== undefined) return entry[key];
  return "{{MISSING COPY: " + f.id + "." + key + "}}";
}

function makeFindings(E){
  /* ---- MEETINGS, AND WHAT THEY TURNED INTO ------------------------------
     One home for the meeting-to-opportunity rate, read by the SDR findings,
     the SDR tile and the manager's card, so the three cannot disagree. A
     meeting gets a fortnight before it counts against anybody, the same
     reasoning the stale rule uses, and the rate is computed only over the
     ones old enough to have resolved so it does not sag every time somebody
     books one. Javier, 15 Oct. */
  const MEET_MATURE = 2;
  /* THE MATURITY RULE LIFTS AT THE CLOSE. A meeting held in the last two weeks
     that has not become an opportunity is excluded while the quarter is live,
     because it has not had a chance yet and counting it as a miss understates
     the rep. At the close that reasoning is gone: the quarter is over, those
     meetings had their chance, and excluding them flatters the number AND
     disagrees with the table beside it, which counts every meeting held.

     Javier found it on Holly Costa, #early, closed: the finding said 65% while
     the table said 58 of 93. 58/89 against 58/93. His call, 21 Oct: "It should
     take the full number at closed." */
  function meetRateFor(L, S, name){
    let seen = 0, hit = 0;
    (L.created || []).forEach(c => {
      if (c.unit !== "meeting" || c.week > S.week || c.sdr !== name) return;
      if (!S.closed && !c.becameOpp && S.week - c.week < MEET_MATURE) return;
      seen++; if (c.becameOpp && c.oppWeek <= S.week) hit++;
    });
    return {rate: seen ? hit / seen : 0, seen, hit};
  }
  /* THE REST OF THE TEAM MEANS THE REST OF THE TEAM. This averaged every SDR
     including the one being described, while the sentence that prints it says
     "against {{TEAM}} for the rest of the team". On Holly it read 66.7% with
     her in and 67.1% without. Every other peer comparison in this file already
     excludes the subject (see `peers` and `teamConv`, which also smooths);
     this was the one helper that did not follow the standard. 21 Oct. */
  function meetTeamRateFor(L, S, p, selfName){
    let n = 0, s = 0;
    (S.sdrs || []).forEach(m => {
      if (selfName && m.name === selfName) return;
      const r = meetRateFor(L, S, m.name);
      if (!r.seen) return; n++; s += r.rate;
    });
    return n ? s / n : 0;
  }

  /* Everything this file reads out of the engine, named in one place so a
     caller can build E from the list rather than from memory. The proof sheet
     assembles its own E out of the inlined engine, and a helper added here and
     not there used to arrive as "E.x is not a function" mid-render, which took
     a whole persona off the page without saying a word. Fail loudly instead. */
  const absent = makeFindings.DEPS.filter(k => E[k] === undefined);
  if (absent.length) throw new Error(
    "findings.js was handed an engine missing: " + absent.join(", "));

  const {money, moneyK, pct, pct0, num, commAt,
         RET_FLOOR, RET_FULL, KICK_LINE, KICK_PCT, PARTICIPATION_TARGET,
         MGR_TEAM_FLOOR, QTR_WEEKS, STALL_WEEKS} = E;

  const x1   = n => (Math.round(n*10)/10).toFixed(1)+"x";
  // A share that rounds to nothing should say "under 1%", not "0%". Printing 0%
  // beside a real dollar figure is the fastest way to look broken.
  /* A per-unit rate that a count gets multiplied by in the same sentence.
     "$158 per accepted opportunity, and 23 have been accepted, which is $3,623"
     did not multiply: the rate was $157.52. Whole-dollar rates stay as they
     are; anything else prints to the cent, and the total then checks. */
  const perMoney = v => { const c = Math.round(v*100)/100;
    return Number.isInteger(c) ? money(c)
      : "$"+c.toLocaleString("en-US",{minimumFractionDigits:2, maximumFractionDigits:2}); };
  /* Whether the plan is past its ceiling with the accelerator taken out, read
     at the one decimal the card prints. 17.004% against 17% fired "the
     accelerator does not explain it" and then printed the accelerator as the
     whole 0.9-point overage: a gap of four thousandths of a point was deciding
     which card a CEO read. */
  const freeOver = c => Math.round(c.accelFree*1000) > Math.round(c.p.guardrail*1000);
  const share= n => n>0 && n<0.005 ? "under 1%" : pct0(n);
  // moneyK of nothing renders "$0K", which looks like a rounding artefact rather
  // than an amount. Nothing is nothing.
  const mk0  = n => Math.round(n)===0 ? "nothing" : moneyK(n);
  /* An 80/20 holdback, rounded so the parts add up to the whole ON THE PAGE.
     money() rounds each figure on its own, so a $9,383 component splits into
     $7,507 paid and $1,877 held, and a reader adding the two numbers in front
     of them gets $9,384 against the total printed beside them. Nobody can
     reconcile that, which is the unnameable-number class: a figure the reader
     cannot rebuild from the ones around it. The held piece is the remainder
     rather than a second product of its own, so the three always agree. Used by
     both AE holdback cards and by the manager's, because a rep and their
     manager reading the same mechanic must not round it two different ways. */
  const hold82 = n => { const total = Math.round(n), paid = Math.round(total*0.8);
    return {total, paid, held: total - paid}; };
  /* A retention rate printed next to the bars it is being measured against.
     94.64% rounds to 95%, and the amber card then names 95% as the line that
     pays in full and says you are at 95% while paying less than full, which
     reads as a contradiction even though both numbers are right. So the whole
     number is used except where it would land exactly on a bar, and there one
     decimal is printed instead. Same display-tie class as the coverage and run
     rate ones: true of the underlying number, false of the one on screen. */
  /* A claim about the distance between two numbers has to survive the rounding
     the reader sees. "Team attainment is 70%, $1K short of the 70% your
     component starts paying at" is true of the underlying values and nonsense on
     the page: two identical figures with a gap asserted between them. pctVs
     widens to one decimal only when the two collide, so every other card keeps
     whole percentages. pctBar is the retention pair of bars expressed through
     it, and was the first place this was found. */
  const pctVs = (n, bar) =>
    (Math.round(n*100) === Math.round(bar*100) && n !== bar)
      ? (Math.round(n*1000)/10).toFixed(1)+"%"
      : pct0(n);
  /* pctVs widens to one decimal when two figures collide, but one decimal is not
     always enough: 46.26% and 46.31% both print 46.3%, and the card then reads
     "46.3% against a 46.3% pace", two identical numbers with a comparison
     asserted between them. Swept across every screen the shape turned up four
     ways, on three personas: the CEO pace line, a manager "ahead of the next"
     and a rep told a rate was "12.9% instead of 12.9%". The fix is not a second
     decimal, which reads as false precision. It is that a card comparing two
     figures asks this first, and says "level" or "right on" when the reader
     cannot see a difference, instead of asserting one. */
  const samePct = (a, b) => pctVs(a, b) === pctVs(b, a);
  /* A figure at the precision moneyK prints it, for arithmetic the reader is
     going to check. "Your next deal at your average size of $10K is worth
     $1,271" is 12.9% of $9,853, while the page says $10K, and 12.9% of $10K is
     $1,290. Commission worked out on the raw number beside a rounded one is the
     unnameable-number class: the reader multiplies what they can see and gets a
     different answer. Same rule as hold82, one step earlier. */
  const asShown = n => n>=1e6 ? Math.round(n/1e4)*1e4 : Math.round(n/1000)*1000;
  /* The rate at the one decimal pct() prints. Only for the what-if sentences,
     "your next deal at your average size is worth", which illustrate a rate
     rather than state money anybody was paid, so they are worked from the two
     figures on the page. A real payout is never computed this way. */
  const rateShown = r => Math.round(r*1000)/1000;
  const nextDeal = (deal, r) => money(asShown(deal)*rateShown(r));
  // A share of revenue said per $100, from the percentage as printed: 22.2% is $22.20.
  const per100 = r => "$"+(Math.round(r*1000)/10).toFixed(2).replace(/\.00$/,"");
  const pctBar = n => {
    const bar = [RET_FLOOR, RET_FULL].find(b =>
      Math.round(n*100) === Math.round(b*100) && n !== b);
    return bar === undefined ? pct0(n) : pctVs(n, bar);
  };
  const pts  = n => (Math.round(n*1000)/10).toFixed(1).replace(/\.0$/,"")+" points";
  /* A gap in points printed between two percentages has to be the difference
     of the two percentages AS PRINTED. "Megan Bennett is at 93% and Patrick
     Fletcher at 76%, 16.2 points apart" asks the reader to subtract 76 from 93
     and get 16.2, which they cannot: the gap came from 92.6% and 76.4%. Same
     shape on the kicker cards, "105% against the 110% line, 4.6 points short".
     p1 prints the figure at one decimal, dropping ".0", and gapPts subtracts
     those printed figures, so every such sentence checks. */
  const d1  = n => Math.round(n*1000)/10;
  const f1  = v => (Math.round(v*10)/10).toFixed(1).replace(/\.0$/,"");
  const p1  = n => f1(d1(n))+"%";
  const gapPts = (a, b) => { const g = Math.round((d1(a)-d1(b))*10)/10;
    return f1(g)+(g===1 ? " point" : " points"); };
  const per  = n => (Math.round(n*10)/10).toFixed(1).replace(/\.0$/,"");
  const ord  = n => ["","first","second","third","fourth","fifth","sixth","seventh","eighth"][n]||(n+"th");
  /* Counts print as words to ten. Zero prints as "none", not "zero": swept
     across every preset and week, the word only ever landed in sentences where
     "zero closed won" and "zero are under 70%" read as a spreadsheet cell rather
     than as English. Five cards were affected and none of them wanted "zero".
     many() is never called with 0 anywhere in the set, so "none reps" cannot
     arise; agree-check and the zero sweep both cover it if that ever changes. */
  const cnt  = n => ["none","one","two","three","four","five","six","seven","eight","nine","ten"][n]||num(n);
  // "one deals" is the kind of thing a reader stops trusting the rest of the card
  // over. Any counted noun goes through here rather than cnt() plus a literal.
  // What share of everything an SDR created is still unresolved.
  const openShare = c => { const t=c.d.attWon+c.d.attLost+c.d.attOpen;
    return t ? c.d.attOpen/t : 0; };
  /* Weeks left, said the way each card already says it, and "in the final week
     of the quarter" once there are none. Week N's screen holds everything that
     closed by the end of week N, so the weeks left are the ones after it: week
     12 has one, week 13 has none. It used to count the current week as well,
     so every card was a week generous, and week 13 said "one week left" on a
     screen whose numbers were already the final ones. */
  const leftSays = (S, style) => S.weeksLeft<=0 ? "in the final week of the quarter"
    : "with "+(style==="words" ? many(S.weeksLeft,"week")
             : style==="a" && S.weeksLeft===1 ? "a week"
             : S.weeksLeft===1 ? "1 week" : S.weeksLeft+" weeks")+" left";
  /* The two sentences the CS pay standing is built from, in one place because
     three cards say them. What is earned, and what is still riding on the
     book. */
  /* WHAT THE FORECAST ON A SET OF STALLED DEALS SAYS, read off the records.
     Both stalled cards asserted "closing two weeks from now", which is what a
     parked deal carries before it takes its step and not after: once it has
     stepped the promise is the end of the quarter, and in the final week the
     dates have been pushed into next quarter. A card that prints a date
     nobody holds is the thing this whole pass exists to stop. */
  const forecastSays = (minExp, maxExp, week, subj) => {
    if (minExp > QTR_WEEKS)
      return "The AE has already pushed "+subj+" into next quarter";
    if (maxExp <= week+2)
      return "The AE forecast still has "+subj+" closing inside two weeks";
    if (maxExp <= QTR_WEEKS)
      return "The AE forecast still has "+subj+" closing before the quarter ends";
    return "The AE forecast has "+subj+" split between the last weeks of this quarter and next";
  };
  /* An SDR's value target is their own count target at the plan's average deal
     size: the same opportunities, priced. */
  const sdrValueAttain = c => c.d.createdValue/Math.max(1, c.d.target*c.p.acv);
  /* Against the week, not against the whole quarter. Creation paces flat, so
     week 5 is five thirteenths of the target and 58% of the quarter is ahead
     of it rather than a red. The colour reads the same bar the rest of the SDR
     set reads; the sentence still states the quarter figure, which is what the
     rep is paid on. */
  const sdrValuePace = c => sdrValueAttain(c)/(c.closed ? 1 : c.S.week/QTR_WEEKS);
  const csLead = c => {
    const earned = c.csEarned, held = c.csHeld;
    if (Math.round(earned) <= 0)
      return c.closed ? "Nothing was earned on expansion, and the retention component paid nothing."
                      : "Nothing is earned yet: expansion commission is the only part that pays before "+
                        "the book resolves, and none has closed.";
    /* With no expansion closed, "$0 of it on expansion and the rest on where
       the book finished" was a split with nothing on one side of it. */
    const what = !c.csRetSettled
      ? money(earned)+(c.closed ? " was earned" : " is earned")+" on expansion you have closed"
      : Math.round(c.csExpComm) <= 0
      ? money(earned)+(c.closed ? " was earned" : " is earned")+", all of it on "+
        (c.closed ? "where the book finished" : "the book, which has resolved in full already")
      : money(earned)+(c.closed ? " was earned" : " is earned")+", "+money(c.csExpComm)+" of it on "+
        "expansion and the rest on "+
        (c.closed ? "where the book finished" : "the book, which has resolved in full already");
    return what+(held>0
      ? ", with "+money(c.csPaid)+" paid and "+money(held)+" landing 90 days after the close, if "+
        "those accounts stay."
      : ".");
  };
  /* EXPANSION, ON AN AE'S SCREEN.

     The plan can pay an AE a rate on expansion and until 30 September the quarter
     never dealt them any, so every sentence about what a rep earned was a new
     business sentence and nothing on any screen could contradict it. The ledger
     deals it now, and the rep has to be able to see it where they read their
     earnings rather than only on a card of its own.

     A clause rather than a card, for the four banked-against-at-risk variants and
     the two closed ones, because those are the sentences that state what the
     quarter has paid. Empty on a plan that pays AEs nothing for expansion, and
     empty for a rep who closed none, so it costs those screens nothing.

     It says the money sits outside quota because that is the question a rep asks
     next: an expansion deal does not move their attainment, their accelerator or
     their kicker, and a sentence that puts a number beside their commission
     without saying so invites them to add it to their number. */
  /* EXPANSION HAS ALL RESOLVED BY WEEK FOUR, so nothing asks about it before then.
     The expansion deals close in the first three weeks, which is what keeps them
     out of the stale set and out of coverage. It also means that in week 1 nobody
     has closed any yet, and an ungated card would have told every CEO on every
     plan that almost nobody runs expansion, on the one screen where that is not a
     finding but a calendar. Same quarter-end-threshold-read-weekly class as the
     accelerator card. From week 4 the picture is final and the question is real. */
  const expSettled = c => c.closed || c.S.week >= 4;

  const aeExpClause = c => {
    if (!(c.a.expComm > 0)) return "";
    return " You also earned "+money(c.a.expComm)+" on "+mk0(c.a.expWon)+" of expansion, paid at "+
      pct(c.a.expRate)+" and counted outside your quota.";
  };

  /* Nothing left to renew. In week 13 a CSM whose book has fully resolved was
     still being told what every further $10K of churn would cost and what
     would happen if nothing more churned: advice about a quarter that has no
     more renewals in it. Every forward-looking line in the CS set checks this
     first. */
  const bookSettled = c => Math.round(c.k.pending/1000) <= 0;
  const csRiskClause = c => {
    const bits = [];
    if (!c.csRetSettled) bits.push("your retention component, worth "+money(c.csRetIfHeld)+
      " if nothing more churns");
    if (c.k.expOpen>0) bits.push(money(c.k.expOpen*c.p.csExpRate)+" on "+mk0(c.k.expOpen)+
      " of expansion still open");
    if (!bits.length) return c.closed ? "Nothing was left open." : "Nothing is left open.";
    return (c.closed ? "What did not resolve inside the quarter: " : "Still riding on the quarter: ")+
      bits.join(", and ")+".";
  };
  const many = (n,word) => cnt(n)+" "+(n===1 ? word
    : /[^aeiou]y$/.test(word) ? word.slice(0,-1)+"ies" : word+"s");
  // Same rule one step further along the sentence: a verb that follows a count
  // has to be built from that count, not typed into the card. A card cannot
  // conjugate against a number it does not hold, which is how "one are still
  // open" and "only one of eight are keeping up" both got written.
  const isAre = n => n===1 ? "is" : "are";
  /* A rank needs enough things ranked to mean anything. Settled on the SDR card
     first: being second of two is being the other one, and second of three is
     the middle. Four is where an ordering starts carrying information. */
  const RANK_MIN = 4;
  /* The same argument one standing down. Standing 2 judges how a team's number
     is distributed, and a distribution needs enough people to distribute across.
     On a team of two the share can only be 0%, 50% or 100%, and 50% sits inside
     the amber band, so one up and one down lands amber every time by
     construction: on #small it was amber on 11 of 14 weeks with no other outcome
     available. It is not detecting a pattern, it is restating the headcount.
     Three is enough. The shares become 0%, 33%, 67% and 100%, so one of three
     lands in red or behind and two of three lands green, and each band means
     something. Only the amber is unreachable at three, which makes the set
     narrower rather than broken. Four and five behave normally: the #large SDR
     team of four runs behind, green, amber and behind again across one quarter.
     SDR and CS teams cannot be smaller than four in any case, so this only ever
     removes an AE team of two. */
  const SPREAD_MIN = 3;
  /* The same argument again, one view up, on the CEO's standing 2. It reads the
     share of revenue produced by the top 20% of reps, and that share is only a
     statement about concentration if there is a majority left over for it to be
     concentrated against. topN is round(aes*0.2), so at two reps the "top 20%"
     is one of the two people and the share is 44%: the headcount wearing a
     percentage. At five the top group is one and four remain, which is where it
     starts carrying information. Measured: at six reps and up the share is
     stable and set by the stage, 34-39% early down to 21-25% mature; at two it
     runs 37% to 76% regardless of stage. */
  const CONC_MIN = 5;
  /* Where concentration becomes a finding. The old bar was 50% and it was wrong
     on its own terms, not merely miscalibrated against our generator. For the
     top fifth of a team to produce half the revenue with the company near 105%,
     those reps have to sit around 2.5x the average rep. Solving the attainment
     curve for it needs a top rep at 322% of quota with half the team under 70%,
     which is a quota that has collapsed rather than a team that is concentrated,
     and standing 1 and ceo-c-capacity already own that conversation. No real
     comp plan produces it either, so the card was dead against a real company's
     data and not only against ours.
     33% is where the stages separate cleanly. Measured at close over 4,000
     plans, at six reps and up: early 34-39%, growth 26-31%, established 23-27%,
     mature 21-25%. So an early-stage company clears it and nothing else does,
     with two points of daylight on either side of the bar. */
  const CONC_BAR = .33;
  const SOFT_ATTAIN = 1.10;
  // The two questions standing 2 asks, in one place, because four cards read
  // them and the set has been bitten before by a rule written twice.
  const concentrated = c => c.p.aes >= CONC_MIN && c.co.topShare >= CONC_BAR;
  const broadBased   = c => c.co.atQuota >= c.p.aes*0.4;
  /* "Your top one produced 27%" on a six-rep company. The top 20% of six is one
     person, and a count where a noun belongs is the same mistake many() exists
     to stop one step further along. The AE question produces 2, 6, 16 or 30
     reps, so topN is 1, 1, 3 or 6 and this is reachable on any four-to-ten
     company. Built once here because three cards say it. */
  const topPhrase = c => c.co.topN===1 ? "your top rep" : "your top "+cnt(c.co.topN);
  /* Below CONC_MIN the concentration sentence comes out entirely: a share needs
     a majority to be concentrated against. Only the 1-3 band lands here and it
     builds two AEs, so the closing line can name two people rather than hedging
     across a range the question cannot produce. */
  const smallCo = c => c.p.aes < CONC_MIN;

  /* Findings whose damage lands outside the quarter. A property of the
     finding, set once when it is written, never computed from the data.
     Standing 5 on the CEO view collects whichever of these a plan tripped. */
  // The list of slow-harm plan warnings moved to the engine as SLOW_HARM.

  /* ---- things every persona needs ---- */
  const base = c => {
    const {p, S} = c;
    const decelLine = p.decel.thr===null ? null : p.qQuota*p.decel.thr;
    return {
      late: S.week>=9 || S.closed,
      closed: S.closed,
      WEEK: S.week,
      // The token carries its own noun. "1 weeks left" is the kind of thing that
      // makes a reader stop trusting every other number on the screen.
      WEEKS_LEFT: S.closed ? "the quarter over"
        : S.weeksLeft===1 ? "1 week" : S.weeksLeft+" weeks",
      WITH_LEFT: leftSays(S),
      // "13 a week for the 1 week left" read oddly and "for the 0 weeks left"
      // would not read at all; the final week is said as one.
      FOR_LEFT: S.weeksLeft<=0 ? "in the final week" : S.weeksLeft===1 ? "in the one week left"
        : "a week for the "+S.weeksLeft+" weeks left",
      BASE_RATE: pct(p.rate),
      ACCEL_RATE: pct(p.rate*(p.accel.t1||1)),
      DECEL_RATE: p.decel.thr===null ? "the same rate" : pct(p.rate*p.decel.mult),
      DECEL_LINE: decelLine===null ? "no reduced-rate line" : moneyK(decelLine),
      // Three plans, three different true sentences about the lower line. Written
      // as one clause because the alternative was three copies of every variant
      // that mentions it, and because the old single wording said "the reduced
      // rate bites below no reduced-rate line" on a plan with no decelerator and
      // called a cliff a reduced rate on a plan that pays nothing at all.
      DECEL_CLAUSE: decelLine===null ? "there is no lower line to fall under"
        : p.decel.mult===0 ? "below "+moneyK(decelLine)+" this plan pays no commission at all"
        : "the reduced rate bites below "+moneyK(decelLine),
      DECEL_STAKE: decelLine===null
        ? "Pace is the only thing moving here, the rate you are paid does not change."
        : p.decel.mult===0
        /* "Behind the middle" was a peer comparison left over from the version
           of standing 1 that measured a rep against the team. Nothing on this
           screen is about the middle of anything. */
        ? "Being behind pace is not the expensive part, falling under that line is."
        : "Being behind pace is not the expensive part, crossing that lower line is.",
      CLIFF_LINE: decelLine===null ? "no cliff" : moneyK(decelLine),
      KICK_LINE: pct0(KICK_LINE),
      KICK_PCT: pct0(KICK_PCT),
      PARTICIPATION_GATE: pct0(PARTICIPATION_TARGET),
      TEAM_COUNT: cnt(S.teams.filter(t=>t.manages===(c.subject&&c.subject.manages||"AE")).length)
    };
  };

/* ===========================================================================
   ACCOUNT EXECUTIVE
   The question: am I going to hit my number, and what does that pay me?
   =========================================================================== */
  const AE = [
  /* The order inside a standing IS the priority: the first variant whose
     condition is true is the one that reports, and the rest are suppressed.
     Reds come before greens here because a rep sitting under the reduced-rate
     line is the more consequential fact even in a week where they are also
     ahead of pace. Nothing closed yet outranks everything, because in that
     state every other variant would be describing a quarter that has not
     started. */
  { id:"ae-s1-zero", standing:"Where you stand", tone:"good",
    title:"Where you stand - nothing closed yet",
    fires: c => !c.closed && c.a.closed===0,
    /* It opened on the accelerator and never said what the quota was, which is
       the first thing a rep with nothing closed wants: the figure was the quota
       all along, printed under another name. And on a flat plan there is no
       accelerator to start anywhere. */
    text:"Week {{WEEK}} and nothing has closed for you yet. That describes {{ZERO_SHARE}} of the team "+
      "right now, and most of this quarter closes in the last three weeks. Your quota is {{QUOTA}}"+
      "{{ACCEL_AT}}, and {{DECEL_CLAUSE}}.",
    tok: c => ({ZERO_SHARE:pct0(c.S.company.zeroShare), QUOTA:moneyK(c.a.quota),
      ACCEL_AT: c.p.accel.t1>1 ? ", everything above it pays "+c.p.accel.t1+"x" : ""}) },

  { id:"ae-s1-cliff", standing:"Where you stand", tone:"bad",
    title:"Where you stand - cliff plans only",
    fires: c => !c.closed && c.a.offDecelPace && c.p.decel.mult===0,
    /* The first version pointed the cliff forwards, "everything you close from
       here pays nothing until you cross that line", which understates it twice
       over. On a cliff the unpaid money is the revenue ALREADY closed, and the
       distance to the line is usually less than one deal, so the sentence read
       as a long grind when the truth is that the next deal turns the whole thing
       on. A rep $1K under a $44K line is one deal away from being paid on $44K.
       That is the cliff distortion in its purest form and the copy now says it. */
    text:"{{CLIFF_LEAD}} {{CLIFF_CLAUSE}}",
    tok: c => { const line=c.p.qQuota*c.p.decel.thr, toLine=Math.max(0,line-c.a.closed),
        value=money(line*c.p.rate), avg=c.a.avgDeal||0;
      /* With nothing closed it said "the $0K you have closed has paid you
         nothing", and "worth $4,500 on what is already closed" when nothing
         was. The $4,500 was never on what was closed: it is the commission on
         the first $188K, the line itself, which includes whatever is closed. */
      const none = Math.round(c.a.closed/1000) <= 0;
      return {CLOSED:moneyK(c.a.closed),
        CLIFF_LEAD: none
          ? "You have closed nothing yet, and below "+moneyK(line)+" this plan pays no commission at all."
          : "Below "+moneyK(line)+" this plan pays no commission at all, so the "+moneyK(c.a.closed)+
            " you have closed has paid you nothing.",
        CLIFF_CLAUSE: avg>0 && toLine<=avg
          ? "You are "+moneyK(toLine)+" from the line and your average deal is "+moneyK(avg)+", so one "+
            "deal crosses it and turns that nothing into "+value+"."
          : "You are "+moneyK(toLine)+" from the line, about "+
            many(Math.max(1,Math.ceil(toLine/Math.max(1,avg))),"deal")+" at your average size of "+
            moneyK(avg)+". Crossing it pays "+value+" on the first "+moneyK(line)+
            (none ? "." : ", the "+moneyK(c.a.closed)+" already closed included.")}; } },

  { id:"ae-s1-reduced", standing:"Where you stand", tone:"bad",
    title:"Where you stand - in the reduced zone",
    /* Was c.a.belowDecel, the quarter-end line read weekly, which put every AE
        in the company in the reduced zone for the first two thirds of the
        quarter: 16 of 16 on the full preset through week 7. offDecelPace is the
        same line against the clock, and at close the two are identical. */
    fires: c => !c.closed && c.a.offDecelPace && c.p.decel.mult>0,
    text:"You have closed {{CLOSED}} of {{QUOTA}} {{WITH_LEFT}}. Below {{DECEL_LINE}} "+
      "this plan pays {{DECEL_RATE}} instead of {{BASE_RATE}}. On what you have closed so far that is "+
      "{{DECEL_COST}} less than the same revenue would have paid above the line.",
    tok: c => ({CLOSED:moneyK(c.a.closed), QUOTA:moneyK(c.a.quota),
      DECEL_COST:money(c.a.closed*c.p.rate*(1-c.p.decel.mult))}) },

  { id:"ae-s1-past", standing:"Where you stand", tone:"good",
    title:"Where you stand - past quota",
    fires: c => !c.closed && c.a.attain>=1,
    /* On a plan with no accelerator this told a rep past quota "everything from
       here pays 12.9% instead of 12.9%" and "your next deal is worth $X to you,
       not $X": a card describing a mechanic the plan does not have. #early is
       the preset. Past quota on a flat plan is still worth saying, because it is
       the moment the plan stops giving anyone a reason to close more. */
    text:"You are at {{ATTAIN}} {{WITH_LEFT}}. {{PAST_CLAUSE}}",
    tok: c => ({ATTAIN:pct0(c.a.attain), AVG_DEAL:moneyK(c.a.avgDeal),
      PAST_CLAUSE: (c.p.accel.t1||1) > 1
        ? "Everything from here pays "+pct(c.p.rate*c.p.accel.t1)+" instead of "+pct(c.p.rate)+
          ". Your next deal at your average size of "+moneyK(c.a.avgDeal)+" is worth "+
          nextDeal(c.a.avgDeal, c.p.rate*c.p.accel.t1)+" to you, not "+nextDeal(c.a.avgDeal, c.p.rate)+"."
        : "This plan has no accelerator, so everything from here pays the same "+pct(c.p.rate)+
          " it paid below quota. Your next deal at your average size of "+moneyK(c.a.avgDeal)+
          " is worth "+nextDeal(c.a.avgDeal, c.p.rate)+" to you, the same as the last one.",
      ACCEL_COMM:nextDeal(c.a.avgDeal, c.p.rate*(c.p.accel.t1||1)), BASE_COMM:nextDeal(c.a.avgDeal, c.p.rate)}) },

  { id:"ae-s1-ahead", standing:"Where you stand", tone:"good",
    title:"Where you stand - ahead of pace",
    fires: c => !c.closed && c.a.closed>0 && c.a.attain<1 && c.a.ahead,
    /* Was a peer comparison, "you are ahead of the middle of the team", which is
       the manager's question rather than the rep's and is already answered on the
       manager view. What a rep ahead of pace actually wants to know is whether
       the reduced rate can still reach them and how far quota is from here. */
    text:"Week {{WEEK}}. You have closed {{CLOSED}} against a {{QUOTA}} quota, ahead of the {{PACE}} "+
      "the week calls for. {{AHEAD_CLAUSE}}",
    tok: c => ({CLOSED:moneyK(c.a.closed), QUOTA:moneyK(c.a.quota), PACE:moneyK(c.a.paceTarget),
      /* "And the accelerator starts there" was printed on every plan, including
         the flat ones that have no accelerator at all, where the card below it
         was already saying so. */
      AHEAD_CLAUSE: (c.decelLine!==null && c.a.closed>=c.decelLine
          ? "You are clear of the "+moneyK(c.decelLine)+" line, so every deal from here pays the full "+
            "rate, and quota is "+moneyK(c.a.gap)+" away "+leftSays(c.S)+"."
          : "Quota is "+moneyK(c.a.gap)+" away "+leftSays(c.S)+
            (c.p.accel.t1>1 ? ", and everything above it pays "+c.p.accel.t1+"x." : "."))}) },

  { id:"ae-s1-behind", standing:"Where you stand", tone:"warn",
    title:"Where you stand - behind pace",
    /* Excluded belowDecel, which is the quarter-END line, while the reduced-rate
       card fires on offDecelPace, the line against the clock. A rep who is under
       the line but ahead of the pace that clears it fell between the two and the
       whole standing went silent: #miss middle AE had no "Where you stand" card
       at all in weeks 6 and 9. The two cards now partition the same test. */
    fires: c => !c.closed && c.a.closed>0 && c.a.attain<1 && !c.a.ahead && !c.a.offDecelPace,
    /* "Against $116K for the middle of the team" described this rep's own pace
       as a peer statistic: paceTarget is their quota on the close curve and has
       nothing to do with the team. Same mistake the ahead card had fixed, and
       the same phrasing it uses now. */
    text:"Week {{WEEK}}. You have closed {{CLOSED}} against a {{QUOTA}} quota, behind the {{PACE}} the "+
      "week calls for. The gap is {{PACE_GAP}}, and {{DECEL_CLAUSE}}. {{DECEL_STAKE}}",
    tok: c => ({CLOSED:moneyK(c.a.closed), PACE:moneyK(c.a.paceTarget),
      QUOTA:moneyK(c.a.quota), PACE_GAP:moneyK(Math.max(0,c.a.paceGap))}) },

  /* THE CLOSING VARIANTS. Standing 1 in every persona is written about time
     remaining, so once the quarter is closed the whole standing used to go quiet
     and a rep opening the final screen was told nothing about where they landed.
     These are the past-tense version: what the quarter did, what it paid, and
     which line they ended up on. Nothing here forecasts, because there is
     nothing left to forecast. */
  { id:"ae-s1-closed-good", standing:"Where you stand", tone:"good",
    title:"How the quarter finished - at or above quota",
    fires: c => c.closed && c.a.attain>=1,
    text:"You finished at {{ATTAIN}} of quota, {{CLOSED}} against {{QUOTA}}, and the quarter paid you "+
      "{{EARNED}} in commission.{{ACCEL_NOTE}}",
    tok: c => ({ATTAIN:pct0(c.a.attain), CLOSED:moneyK(c.a.closed), QUOTA:moneyK(c.a.quota),
      EARNED:money(c.a.comm),
      ACCEL_NOTE: c.p.accel.t1>1
        ? " Of that, "+money(Math.max(0,c.a.comm-c.a.commAt100))+" came from the part above quota, "+
          "which is the accelerator doing what it is there for."
        : " This plan pays one rate throughout, so nothing extra rode on the last stretch."}) },

  { id:"ae-s1-closed-short", standing:"Where you stand", tone:"warn",
    title:"How the quarter finished - short of quota",
    fires: c => c.closed && c.a.attain<1 && !c.a.belowDecel,
    text:"You finished at {{ATTAIN}}, {{GAP}} short of a {{QUOTA}} quota, and the quarter paid you "+
      "{{EARNED}}.{{LINE_NOTE}}",
    tok: c => ({ATTAIN:pct0(c.a.attain), GAP:moneyK(c.a.gap), QUOTA:moneyK(c.a.quota),
      EARNED:money(c.a.comm),
      LINE_NOTE: c.p.decel.thr===null ? ""
        : " You stayed above "+moneyK(c.decelLine)+", so every deal paid the full "+pct(c.p.rate)+"."}) },

  { id:"ae-s1-closed-under", standing:"Where you stand", tone:"bad",
    title:"How the quarter finished - below the line",
    fires: c => c.closed && c.a.belowDecel,
    text:"You finished at {{ATTAIN}}, {{CLOSED}} against a {{QUOTA}} quota, which is below {{DECEL_LINE}}. "+
      "{{UNDER_NOTE}} The quarter paid you {{EARNED}}.",
    tok: c => ({ATTAIN:pct0(c.a.attain), CLOSED:moneyK(c.a.closed), QUOTA:moneyK(c.a.quota),
      EARNED:money(c.a.comm),
      UNDER_NOTE: c.p.decel.mult===0
        ? "Below that line this plan pays no commission at all, so the deals you did close paid nothing."
        : "Everything you closed was paid at "+pct(c.p.rate*c.p.decel.mult)+" rather than "+
          pct(c.p.rate)+", which is "+money(c.a.closed*c.p.rate*(1-c.p.decel.mult))+
          " less than the same revenue above the line."}) },

  { id:"ae-s2-past", standing:"Coverage", tone:"good", title:"Coverage - already past quota",
    fires: c => !c.closed && c.a.attain>=1,
    text:"You are past quota, so coverage stops mattering. Everything open is upside at {{ACCEL_RATE}}.",
    tok: c => ({}) },

  /* Two boundary variants that sit above green, because green and amber both used
     to make a comparison the printed numbers did not support.
     ONLINE: coverage and the bar both round to one decimal, so a rep at 1.99x
     against a 2.03x bar read "you have 2.0x, a gap this size wants 2.0x" and was
     then told it was not enough. Three cells in 145 across the presets, and it
     hit greens as often as ambers. A tolerance band would only move the same
     contradiction to a new boundary, so the tie gets its own sentence.
     PLENTY: at ten times cover, "more than the gap needs" is comic understatement
     and the rep stops reading. Past two and a half times the requirement the pipeline is
     simply not the constraint, and saying so is more use than a ratio. */
  { id:"ae-s2-online", standing:"Coverage", tone:"warn", title:"Coverage - exactly on the line",
    fires: c => { if (c.closed || c.a.attain>=1 || c.a.gap<=0) return false;
      const r1=n=>(Math.round(n*10)/10).toFixed(1);
      return r1(1/Math.max(.05,c.a.winRate)) === r1(c.a.openRaw/Math.max(1,c.a.gap)); },
    text:"You need {{GAP}} and have {{OPEN}} open, which is {{COVERAGE}}. At {{RATE_OWNER}} "+
      "{{WIN_RATE}} win rate a gap this size wants the same. Sitting exactly on the line means the "+
      "expected outcome is quota and nothing more, so anything that slips takes you under.",
    tok: c => ({GAP:moneyK(c.a.gap), OPEN:moneyK(c.a.openRaw), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      COVERAGE:x1(c.a.openRaw/Math.max(1,c.a.gap))}) },

  { id:"ae-s2-plenty", standing:"Coverage", tone:"good", title:"Coverage - pipeline is not the problem",
    fires: c => !c.closed && c.a.attain<1 && c.a.gap>0 &&
      (c.a.openRaw/Math.max(1,c.a.gap)) >= 2.5*(1/Math.max(.05,c.a.winRate)),
    // Gap first, bar second, the same rhythm the green and the on-the-line variant
    // use. The first version stacked both ratios and the win rate into one clause.
    text:"You need {{GAP}} and have {{OPEN}} open. At {{RATE_OWNER}} {{WIN_RATE}} win rate a gap this "+
      "size wants {{NEED_COVER}}, and you have {{COVERAGE}}. Pipeline is not what decides this "+
      "quarter for you. {{PLENTY_CLAUSE}}",
    tok: c => ({GAP:moneyK(c.a.gap), OPEN:moneyK(c.a.openRaw), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      NEED_COVER:x1(1/Math.max(.05,c.a.winRate)), COVERAGE:x1(c.a.openRaw/Math.max(1,c.a.gap)),
      PLENTY_CLAUSE: c.a.topOpen
        ? "Closing "+many(Math.max(1,Math.ceil(c.a.gap/Math.max(1,c.a.topOpen.acv))),"deal")+
          " the size of your largest open one gets you there."
        : "What decides it is which of them you choose to work."}) },

  { id:"ae-s2-green", standing:"Coverage", tone:"good", title:"Coverage",
    fires: c => !c.closed && c.a.attain<1 && c.a.gap>0 && (c.a.openRaw/c.a.gap) >= (1/Math.max(.05,c.a.winRate)),
    text:"You need {{GAP}} to reach quota and have {{OPEN}} open. At {{RATE_OWNER}} {{WIN_RATE}} win rate a gap "+
      "this size wants about {{NEED_COVER}}. You have {{COVERAGE}}, which is more than the gap needs "+
      "if the pipeline is real.",
    tok: c => ({GAP:moneyK(c.a.gap), OPEN:moneyK(c.a.openRaw), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      NEED_COVER:x1(1/Math.max(.05,c.a.winRate)), COVERAGE:x1(c.a.openRaw/Math.max(1,c.a.gap))}) },

  { id:"ae-s2-amber", standing:"Coverage", tone:"warn", title:"Coverage",
    fires: c => { const need=1/Math.max(.05,c.a.winRate), have=c.a.openRaw/Math.max(1,c.a.gap);
      return !c.closed && c.a.attain<1 && c.a.gap>0 && have<need && have>=need*0.6; },
    text:"You need {{GAP}} and have {{OPEN}} open, which is {{COVERAGE}}. At {{RATE_OWNER}} {{WIN_RATE}} win rate "+
      "a gap this size wants {{NEED_COVER}}. {{GROW_CLAUSE}}",
    /* The tail used to read "either the pipeline grows or the deals land above
        your own average deal size" at every week on every plan. Growing the
        pipeline is only an option if something created now can still close
        inside the quarter, and a deal has to run its cycle first. With two weeks
        left on a 30-day cycle it cannot, and on a three to nine month cycle it
        never could, which means the sentence was wrong on three presets in every
        week of the quarter rather than only late in it.
        This is the shape a card-level read cannot catch: the sentence is
        identical in week 2 and week 12, so it dedupes to one row and the reading
        list never asks whether it is still true. */
    tok: c => ({GAP:moneyK(c.a.gap), OPEN:moneyK(c.a.openRaw), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      NEED_COVER:x1(1/Math.max(.05,c.a.winRate)), COVERAGE:x1(c.a.openRaw/Math.max(1,c.a.gap)),
      GROW_CLAUSE: c.S.weeksLeft >= (c.p.cycleWeeks||4)
        ? "Either the pipeline grows or the deals land above your own average deal size."
        : "On a "+c.p.cycle+" cycle nothing created now lands inside the quarter, so it comes down "+
          "to the deals already open and whether they close above your own average deal size."}) },

  { id:"ae-s2-red", standing:"Coverage", tone:"bad", title:"Coverage",
    fires: c => { const need=1/Math.max(.05,c.a.winRate), have=c.a.openRaw/Math.max(1,c.a.gap);
      return !c.closed && c.a.attain<1 && c.a.gap>0 && have<need*0.6; },
    text:"You need {{GAP}} and have {{OPEN}} open, which is {{COVERAGE}}. At {{RATE_OWNER}} {{WIN_RATE}} win rate "+
      "a gap this size wants {{NEED_COVER}}. There is not enough in front of you.",
    tok: c => ({GAP:moneyK(c.a.gap), OPEN:moneyK(c.a.openRaw), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      NEED_COVER:x1(1/Math.max(.05,c.a.winRate)), COVERAGE:x1(c.a.openRaw/Math.max(1,c.a.gap))}) },

  { id:"ae-s2-ceiling", standing:"Coverage", tone:"bad", title:"Coverage - the quarter has a ceiling",
    fires: c => !c.closed && c.p.decel.thr!==null && ((c.a.closed+c.a.openRaw)/c.a.quota) < c.p.decel.thr,
    text:"Even if every open deal closed, you would finish at {{CEILING}} of quota, below the {{DECEL_LINE}} "+
      "line. This quarter is already decided on rate, not on volume.",
    tok: c => ({CEILING:pct0((c.a.closed+c.a.openRaw)/c.a.quota)}) },

  /* Coverage asked backwards. Mid-quarter the question is whether what is open
     can still cover the gap; at quarter end the same arithmetic answers a better
     one, which is whether the quarter was short of at-bats or short of wins. A
     rep who worked the coverage the number needed and still missed has a
     conversion problem. A rep who never had it has an activity problem. They are
     different conversations and the number tells you which one to have.
     WORKED is everything that carried a name this quarter: won, lost and the
     carryover that never resolved. */
  { id:"ae-s2-closed-good", standing:"Coverage", tone:"good",
    title:"What the quarter took - the at-bats were there",
    fires: c => c.closed && c.a.attain>=1,
    text:"You worked {{WORKED}} across {{WORKED_COUNT}} against a {{QUOTA}} quota, which "+
      "is {{HAVE_COVER}}. At {{RATE_OWNER}} {{WIN_RATE}} close rate a number that size wants "+
      "{{NEED_COVER}}, so the at-bats were there and the number landed.",
    tok: c => ({WORKED:moneyK(c.worked), WORKED_COUNT:many(c.workedCount,"opportunity"), QUOTA:moneyK(c.a.quota),
      HAVE_COVER:x1(c.haveCover), NEED_COVER:x1(c.needCover), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's"}) },

  /* Below the win-rate threshold there is no conversion verdict to give. Five
     opportunities at a 27% rate expect 1.4 wins, so a rep who got one is inside
     the noise and "you had the pipeline and did not convert it" would be
     reporting a coin flip as a failure. Same rule and the same threshold as the
     win-rate conditionals. What is true at that volume is that the quarter turned
     on individual deals, which is worth saying on its own. */
  { id:"ae-s2-closed-few", standing:"Coverage", tone:"warn",
    title:"What the quarter took - too few at-bats to read a rate",
    fires: c => c.closed && c.a.attain<1 && !c.a.winRateFromOwn,
    text:"You worked {{WORKED}} across {{WORKED_COUNT}} against a {{QUOTA}} quota and closed "+
      "{{WON_COUNT}}. At that volume there is no close rate to read here, only individual deals. "+
      "{{FEW_CLAUSE}}",
    tok: c => ({WORKED:moneyK(c.worked), WORKED_COUNT:many(c.workedCount,"opportunity"),
      QUOTA:moneyK(c.a.quota), WON_COUNT:many(c.a.won,"deal"),
      FEW_CLAUSE: c.a.won>0
        ? "One more at your average size of "+moneyK(c.a.avgDeal)+" would have finished the quarter at "+
          pct0((c.a.closed+c.a.avgDeal)/c.a.quota)+"."
        : "Nothing landed, so there is nothing here to average."}) },

  /* A rep who finished at 96% with the coverage the number needed has not got a
     conversion problem, they have got a near miss, and handing them the same red
     card as a rep at 63% is the tone reporting arithmetic instead of the quarter.
     The verdict below only speaks once the miss is big enough to be a pattern. */
  { id:"ae-s2-closed-near", standing:"Coverage", tone:"warn",
    title:"What the quarter took - a near miss",
    fires: c => c.closed && c.a.attain<1 && c.a.attain>=0.9 && c.a.winRateFromOwn &&
                c.haveCover >= c.needCover,
    text:"You worked {{WORKED}} across {{WORKED_COUNT}} against a {{QUOTA}} quota, which is "+
      "{{HAVE_COVER}}, and finished at {{ATTAIN}}. The pipeline was there and the quarter came down "+
      "to a deal either way.",
    tok: c => ({WORKED:moneyK(c.worked), WORKED_COUNT:many(c.workedCount,"opportunity"),
      QUOTA:moneyK(c.a.quota), HAVE_COVER:x1(c.haveCover), ATTAIN:pct0(c.a.attain)}) },

  { id:"ae-s2-closed-conv", standing:"Coverage", tone:"bad",
    title:"What the quarter took - the pipeline was there",
    fires: c => c.closed && c.a.attain<0.9 && c.a.winRateFromOwn && c.haveCover >= c.needCover,
    text:"You worked {{WORKED}} across {{WORKED_COUNT}} against a {{QUOTA}} quota, which "+
      "is {{HAVE_COVER}}. At {{RATE_OWNER}} {{WIN_RATE}} close rate that was enough pipeline to land "+
      "the number, and it finished at {{ATTAIN}}. This quarter was not short of opportunities.",
    tok: c => ({WORKED:moneyK(c.worked), WORKED_COUNT:many(c.workedCount,"opportunity"), QUOTA:moneyK(c.a.quota),
      HAVE_COVER:x1(c.haveCover), WIN_RATE:pct0(c.a.winRate), ATTAIN:pct0(c.a.attain),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's"}) },

  { id:"ae-s2-closed-thin", standing:"Coverage", tone:"warn",
    title:"What the quarter took - the at-bats were not there",
    fires: c => c.closed && c.a.attain<1 && c.a.winRateFromOwn && c.haveCover < c.needCover,
    text:"You worked {{WORKED}} across {{WORKED_COUNT}} against a {{QUOTA}} quota, which "+
      "is {{HAVE_COVER}}. At {{RATE_OWNER}} {{WIN_RATE}} close rate a number that size wants "+
      "{{NEED_COVER}}, so the at-bats were never there. {{THIN_CLAUSE}}",
    tok: c => ({WORKED:moneyK(c.worked), WORKED_COUNT:many(c.workedCount,"opportunity"), QUOTA:moneyK(c.a.quota),
      HAVE_COVER:x1(c.haveCover), NEED_COVER:x1(c.needCover), WIN_RATE:pct0(c.a.winRate),
      RATE_OWNER: c.a.winRateFromOwn ? "your" : "the team's",
      THIN_CLAUSE: c.a.winRate > c.S.company.winRate
        ? "You closed at a better rate than the team, so the shortfall was in pipeline and not in selling."
        : "Both the volume and the close rate came in under what the number needed."}) },

  /* When quota is gone, the concentration question changes rather than
     disappearing. "No single deal decides your quarter" is reassurance aimed at a
     question this reader stopped asking in week 9, and the honest version points
     at the line that still pays: crossing the reduced rate re-rates everything
     they have already closed, so it is usually worth more than the gap to a quota
     they cannot reach. The share is measured against whichever line the sentence
     names. Measuring one and naming the other was the bug in the first draft. */
  { id:"ae-s3-line", standing:"Concentration", tone:"warn",
    title:"The line that is still in play",
    fires: c => !c.closed && c.a.topOpen && !c.quotaReachable && c.a.belowDecel && c.toLine>0,
    text:"Your largest open deal is {{TOP_DEAL_NAME}} at {{TOP_DEAL}}. You are {{TO_LINE}} from "+
      "{{DECEL_LINE}}, the line where everything you have already closed re-rates, so {{LINE_CLAUSE}}.",
    tok: c => { const d=c.a.topOpen||{acv:0,name:"-"};
      const need=Math.ceil(c.toLine/Math.max(1,d.acv));
      return {TOP_DEAL_NAME:d.name, TOP_DEAL:moneyK(d.acv), TO_LINE:moneyK(c.toLine),
        LINE_CLAUSE: d.acv>=c.toLine ? "that one deal clears it on its own"
          : "it takes "+cnt(need)+" deals that size to cross it"}; } },

  { id:"ae-s3-green", standing:"Concentration", tone:"good", title:"Concentration",
    /* Green stopped at 50%, which let a deal carrying a third of the gap be
       described as not deciding the quarter. A quarter of the gap is the honest
       ceiling for that claim, and the sentence now ends on the number that
       actually helps: how many deals that size close what is left. */
    fires: c => !c.closed && c.a.topOpen && c.a.gap>0 && c.a.topOpenPct<0.25,
    text:"Your largest open deal is {{TOP_DEAL_NAME}}, {{TOP_DEAL_PCT}} of what you still need. No "+
      "single deal decides your quarter, and it takes about {{DEALS_TO_GAP}} that size to close it.",
    tok: c => { const d=c.a.topOpen||{acv:0,name:"-"};
      return {TOP_DEAL_NAME:d.name, TOP_DEAL:moneyK(d.acv), TOP_DEAL_PCT:share(c.a.topOpenPct),
        DEALS_TO_GAP: many(Math.max(1,Math.ceil(c.a.gap/Math.max(1,d.acv))),"deal")}; } },

  { id:"ae-s3-amber", standing:"Concentration", tone:"warn", title:"Concentration",
    fires: c => !c.closed && c.a.topOpen && c.a.gap>0 && c.a.topOpenPct>=0.25 &&
                (c.a.topOpenPct<1 || c.p.decel.thr===null),
    /* Both figures assume everything else loses: the high one is what is closed
       plus this deal and nothing more, the low one is simply where the rep stands
       today. Presenting them as the two ways the quarter finishes made two
       hypotheticals look like outcomes, and "finish" broke the no-forecast rule
       as well. They are positions, so the sentence now says so. */
    text:"{{TOP_DEAL_PCT}} of what you still need sits in one deal, {{TOP_DEAL_NAME}} at {{TOP_DEAL}}, "+
      "in {{TOP_DEAL_STAGE}}. It carries {{TOP_DEAL_COMM}} of commission. Winning it puts you at "+
      "{{WITH_ATTAIN}}{{ELSE_CLAUSE}}, against {{WITHOUT_ATTAIN}} today.{{ONLY_CLAUSE}}",
    tok: c => { const d=c.a.topOpen||{acv:0,name:"-",stage:"-"};
      return {TOP_DEAL_PCT:share(c.a.topOpenPct), TOP_DEAL_NAME:d.name, TOP_DEAL:moneyK(d.acv),
      TOP_DEAL_STAGE:d.stage, TOP_DEAL_COMM:money(d.acv*c.p.rate),
      WITH_ATTAIN:pct0((c.a.closed+d.acv)/c.a.quota), WITHOUT_ATTAIN:pct0(c.a.attain),
      /* "Before anything else lands" assumes there is something else. Where
         this is the only open deal, saying so is the stronger fact. */
      ELSE_CLAUSE: c.a.openCount<=1 ? "" : " before anything else lands",
      ONLY_CLAUSE: c.a.openCount<=1 ? " It is the only deal you have open." : ""}; } },

  { id:"ae-s3-red", standing:"Concentration", tone:"bad",
    title:"Concentration - one deal is your quarter",
    fires: c => !c.closed && c.a.topOpen && c.a.gap>0 && c.a.topOpenPct>=1 && c.p.decel.thr!==null,
    // Same correction as the amber above. Both commission figures are
    // everything-else-fails, so they are stated as where the rep stands rather
    // than as what the quarter pays out.
    text:"{{TOP_DEAL_NAME}} at {{TOP_DEAL}} covers {{TOP_DEAL_PCT}} of your gap and sits in "+
      "{{TOP_DEAL_STAGE}} {{WITH_LEFT}}. On its own it takes you to {{WITH}}. Without it "+
      "you are on {{WITHOUT}}{{UNDER_CLAUSE}}.",
    tok: c => { const d=c.a.topOpen||{acv:0,name:"-",stage:"-"};
      return {TOP_DEAL_NAME:d.name, TOP_DEAL:moneyK(d.acv), TOP_DEAL_PCT:share(c.a.topOpenPct),
      TOP_DEAL_STAGE:d.stage, WITH:money(c.a.commWithTop), WITHOUT:money(c.a.comm),
      /* "Because that lands below $61K" was printed whatever the rep had
         closed, including on a rep sitting well clear of the line, where the
         smaller figure is simply less revenue at the same rate. */
      UNDER_CLAUSE: (c.decelLine!==null && c.a.closed < c.decelLine)
        ? ", because that lands below "+moneyK(c.decelLine)
        : ""}; } },

  /* Concentration at quarter end, and gated hard on purpose. A nine-deal SMB rep
     is unconcentrated by construction, and firing a card to say so hands the
     reader another structural green. This one only speaks when the shape is
     actually worth naming: one deal carrying 40% or more of the number, or fewer
     than three deals carrying all of it. On an enterprise plan that is most reps
     and it is the single most useful thing you can tell them. */
  { id:"ae-s3-closed-conc", standing:"Concentration", tone:"warn",
    title:"How few deals carried the quarter",
    fires: c => c.closed && c.a.won>0 && c.a.closed>0 &&
                (c.topWonPct>=0.40 || c.a.won<3),
    text:"{{TOP_WON_PCT}} of what you closed came from one deal, {{TOP_WON_NAME}} at {{TOP_WON}}, and "+
      "{{WON_COUNT}} carried the whole quarter. At that concentration the result is a fact about those "+
      "accounts more than a rate you can plan the next quarter on.",
    tok: c => { const d=c.topWon||{acv:0,name:"-"};
      return {TOP_WON_PCT:share(c.topWonPct), TOP_WON_NAME:d.name, TOP_WON:moneyK(d.acv),
        WON_COUNT: c.a.won===1 ? "that single deal" : cnt(c.a.won)+" deals"}; } },

  { id:"ae-s4-green", standing:"Banked against at risk", tone:"good", title:"Banked against at risk",
    fires: c => c.hold && c.a.attain>=0.7,
    text:"{{PAID}} is paid. {{ACCRUED}} is earned and lands {{HOLDBACK_TIMING}}. {{OPEN_CLAUSE}} Most of "+
      "your quarter is already yours.{{EXP_CLAUSE}}",
    tok: c => ({EXP_CLAUSE:aeExpClause(c), PAID:money(hold82(c.a.comm).paid), ACCRUED:money(hold82(c.a.comm).held),
      HOLDBACK_TIMING:"90 days after each deal closes",
      // Same sentence, two tenses. After the quarter closes those deals did not
      // resolve and carry forward; they are not still in play.
      OPEN_CLAUSE: c.a.openCount===0 ? ""
        : c.closed ? money(c.a.openRaw*c.a.winRate*c.p.rate)+" sat inside deals that did not close."
        : money(c.a.openRaw*c.a.winRate*c.p.rate)+" is still inside open deals.",
      AT_RISK:money(c.a.openRaw*c.a.winRate*c.p.rate)}) },

  { id:"ae-s4-amber", standing:"Banked against at risk", tone:"warn", title:"Banked against at risk",
    fires: c => c.hold && c.a.attain<0.7,
    /* With nothing closed the original printed three zeros in one sentence and
       said nothing at all. Standing 4 still has something worth saying at that
       point, which is what the holdback will do once money does land, so the
       zero case explains the mechanic instead of reporting it. */
    text:"{{HOLD_BODY}}{{EXP_CLAUSE}}",
    tok: c => ({EXP_CLAUSE:aeExpClause(c), EARNED:money(c.a.comm), PAID:money(hold82(c.a.comm).paid), HOLDBACK_PCT:"20%",
      HOLDBACK_DAYS:"90", ACCRUED:money(hold82(c.a.comm).held),
      HOLD_BODY: c.a.comm>0
        ? "You have earned "+money(c.a.comm)+", but only "+money(hold82(c.a.comm).paid)+" has been paid. This "+
          "plan holds 20% back for 90 days after close, so "+money(hold82(c.a.comm).held)+" arrives later and "+
          "only if those accounts stay."
        : "Nothing has closed yet, so nothing is banked. This plan holds 20% back for 90 days after "+
          "each deal closes, so a fifth of everything you earn this quarter arrives later and only if "+
          "those accounts stay."}) },

  { id:"ae-s4-red", standing:"Banked against at risk", tone:"bad",
    title:"What is banked and what is still at risk",
    /* It used to be gated to week 9, which made the standing flip colour on a
       screen where nothing had changed: on #miss the weakest rep's at-risk
       already exceeded banked in week 8, the green fired because the red was
       silenced, and week 9 turned it red with the same two numbers. The pair
       splits on one comparison at every week now, and the early-week hold
       already softens a red before week five, which is what the week gate was
       reaching for. */
    fires: c => { const atRisk=c.a.openRaw*c.a.winRate*c.p.rate;
      return !c.closed && atRisk > c.a.comm; },
    // No percentage here, and deliberately. It used to say "77% of your commission
    // is still inside open deals", where the denominator was banked commission
    // plus what the open pipeline might pay: a projected total dressed up as a
    // known one, which reads as though the other 23% is safely won. Banked and
    // open are both facts. The one estimate is labelled as being at their own
    // close rate, the same way the coverage findings label theirs.
    text:"Week {{WEEK}}. You have banked {{PAID}}. Another {{OPEN}} sits in {{OPEN_COUNT}}, "+
      "which is worth about {{AT_RISK}} to you at your own close rate, and none of it counts until it "+
      "closes.{{EXP_CLAUSE}}",
    tok: c => ({EXP_CLAUSE:aeExpClause(c), PAID:money(c.a.comm), OPEN:moneyK(c.a.openRaw), OPEN_COUNT:many(c.a.openCount,"open deal"),
      AT_RISK:money(c.a.openRaw*c.a.winRate*c.p.rate)}) },

  { id:"ae-s4-nohold", standing:"Banked against at risk", tone:"good",
    /* "Plans with no holdback" is a note to ourselves about which plan shape
       this card belongs to, printed at the top of a rep's screen. */
    title:"What is banked and what is still at risk",
    // The complement of ae-s4-red. Both used to fire on a no-holdback plan and
    // restate the same two numbers in opposite colours.
    fires: c => !c.hold && !c.closed && !(c.a.openRaw*c.a.winRate*c.p.rate > c.a.comm),
    text:"{{NOHOLD_SAYS}}{{EXP_CLAUSE}}",
    /* "$0 earned on closed business... Nothing you have already earned is
       waiting on anything" was three sentences about money that does not exist
       yet. With nothing closed the card says what the plan will do when a deal
       lands instead. */
    tok: c => { const earned = c.a.comm, risk = c.a.openRaw*c.a.winRate*c.p.rate;
      return {EXP_CLAUSE:aeExpClause(c), NOHOLD_SAYS: Math.round(earned) <= 0
        ? "Nothing has closed for you yet, so nothing is earned. "+money(risk)+" sits in your open "+
          "deals, and this plan holds none of it back: whatever lands is paid at the close of the "+
          "quarter it lands in."
        /* "Nothing you have already earned is waiting on anything" is not true
           on a plan with a decelerator: finishing under the line re-rates
           everything closed, so what is banked is banked at today's rate and
           not at a rate nobody can change. */
        : money(earned)+" earned on closed business, paid at close. "+money(risk)+" still sitting in "+
          "open deals. "+((c.decelLine!==null && c.a.closed < c.decelLine)
            ? "That "+money(earned)+" is at the full rate, and finishing under "+moneyK(c.decelLine)+
              " would re-rate it: the plan pays "+pct(c.p.rate*c.p.decel.mult)+" on everything below "+
              "that line, not just on what comes after it."
            : "Nothing you have already earned is waiting on anything.")}; } },

  /* Banked against at risk is a mid-quarter question. On a plan with no holdback
     it has no closed-state answer at all: everything is banked and nothing is at
     risk, for every rep, every time, which is a green that reports the plan
     design rather than the person. What is left worth saying is the one thing
     the mid-quarter card got wrong, that the open deals did not resolve and go
     forward with the rep. No commission estimate on them either: at quarter end
     the honest figure is the pipeline and the count, not a weighted guess at
     what it might pay. */
  { id:"ae-s4-closed-good", standing:"Banked against at risk", tone:"good",
    title:"What carries into next quarter",
    fires: c => !c.hold && c.closed && c.a.attain>=1,
    // "all of it on closed business" was a claim the expansion clause then contradicted:
    // the rep also earned on expansion, so the quarter did not pay them all of it there.
    text:"The quarter paid you {{EARNED}} on closed business, none of it held back. "+
      "{{ROLL_CLAUSE}}{{EXP_CLAUSE}}",
    tok: c => ({EXP_CLAUSE:aeExpClause(c), EARNED:money(c.a.comm),
      ROLL_CLAUSE: c.a.openCount===0
        ? "Nothing was left open, so the number is the whole of it."
        : moneyK(c.a.openRaw)+" sat in "+many(c.a.openCount,"deal")+" that did not resolve, and you open "+
          "the next quarter with that already in front of you."}) },

  { id:"ae-s4-closed-short", standing:"Banked against at risk", tone:"warn",
    title:"What carries into next quarter",
    fires: c => !c.hold && c.closed && c.a.attain<1,
    // "all of it on closed business" was a claim the expansion clause then contradicted:
    // the rep also earned on expansion, so the quarter did not pay them all of it there.
    text:"The quarter paid you {{EARNED}} on closed business, none of it held back. "+
      "{{ROLL_CLAUSE}}{{EXP_CLAUSE}}",
    tok: c => ({EXP_CLAUSE:aeExpClause(c), EARNED:money(c.a.comm),
      ROLL_CLAUSE: c.a.openCount===0
        ? "Nothing was left open, so the number is the whole of it."
        : moneyK(c.a.openRaw)+" sat in "+many(c.a.openCount,"deal")+" that did not resolve. That is next "+
          "quarter's opening pipeline now, not this quarter's shortfall."}) },

  /* These two fire on the SAME threshold that lets the copy say "your win rate",
     which is where two thirds of the estimate is the rep's own evidence. They
     used to fire earlier, which put "the team's 17% win rate" on one card and
     "you close 17% against a team average of 27%" on the card below it. If the
     number is not theirs yet, we do not compare them to anybody with it.
     Eight points of difference, not five: a win rate off a handful of deals
     carries enough error that a five-point test reports arithmetic. */
  /* AE EXPANSION, ITS OWN CARD.

     The clause on the banked cards tells a rep what expansion paid them. This
     answers the question the clause raises, which is whether they are working the
     part of their plan that pays them outside quota. Three tones off one test,
     what they landed against what their peers did, because there is no expansion
     target on an AE plan: the plan pays a rate and sets no number, so the only
     honest bar is the rest of the team. Fires nowhere unless the plan actually
     pays an AE for expansion, so an EXP_NONE plan, where expansion is handed to
     Customer Success outright, sees none of these. */
  { id:"ae-c-exp-green", standing:"Conditionals", tone:"good",
    title:"Expansion - you are working the base",
    fires: c => expSettled(c) && (c.a.expRate||0) > 0 && c.a.expComm > 0,
    /* NO PEER COMPARISON ON A REP'S OWN MONEY. All three of these carried a line
       about how many of the team had closed expansion, and Javier's question was
       the right one: what is it doing on a card about what this rep earned. It is
       the same peer-comparison shape the AE set spent a day removing, where
       "behind the middle" became "behind pace". How many of the team work the base
       is a manager's question and a CEO's question, and both of them have a card
       for it. A rep's card stays about the rep. */
    text:"You closed {{EXP_WON}} of expansion this quarter and it paid you {{EXP_COMM}} at "+
      "{{EXP_RATE}}. It does not move your quota, so it is money on top of your number rather than a "+
      "way to reach it.",
    tok: c => ({EXP_WON:moneyK(c.a.expWon), EXP_COMM:money(c.a.expComm), EXP_RATE:pct(c.a.expRate)}) },

  { id:"ae-c-exp-amber", standing:"Conditionals", tone:"warn",
    title:"Expansion - the rate is there and you have none yet",
    fires: c => expSettled(c) && (c.a.expRate||0) > 0 && !(c.a.expComm > 0) && c.a.expLost > 0,
    text:"Your plan pays {{EXP_RATE}} on expansion and you have closed none. You went after "+
      "{{LOST}} and lost it, which would have paid you {{WORTH}}. Expansion sits outside your quota, "+
      "so nothing here is costing you attainment, only pay.",
    tok: c => ({EXP_RATE:pct(c.a.expRate), LOST:moneyK(c.a.expLost),
      WORTH:money(c.a.expLost*c.a.expRate)}) },

  { id:"ae-c-exp-red", standing:"Conditionals", tone:"bad",
    title:"Expansion - money on your plan you have not gone after",
    fires: c => expSettled(c) && (c.a.expRate||0) > 0 && !(c.a.expComm > 0) && !(c.a.expLost > 0),
    text:"Your plan pays {{EXP_RATE}} on expansion and you have neither closed nor lost any: there is "+
      "nothing in your quarter against the installed base at all. It is paid outside quota, so it "+
      "costs you nothing to attempt and nothing to miss except the money.",
    tok: c => ({EXP_RATE:pct(c.a.expRate)}) },

  { id:"ae-c-winup", standing:"Conditionals", tone:"good",
    title:"Win rate - you close better than the team",
    fires: c => c.a.winRateFromOwn && c.a.winRate > c.S.company.winRate+0.08,
    text:"You close {{WIN_RATE}} of what you work against a team average of {{TEAM_WIN}}. You need less "+
      "pipeline than your peers to land the same number.",
    tok: c => ({WIN_RATE:pct0(c.a.winRate), TEAM_WIN:pct0(c.S.company.winRate)}) },

  { id:"ae-c-windown", standing:"Conditionals", tone:"bad",
    title:"Win rate - you close worse than the team",
    fires: c => !c.closed && c.a.winRateFromOwn && c.a.winRate < c.S.company.winRate-0.08,
    text:"You close {{WIN_RATE}} against a team average of {{TEAM_WIN}}. A gap of {{GAP}} wants "+
      "{{NEED_COVER}} coverage for you where the average rep needs {{TEAM_NEED}}.",
    tok: c => ({WIN_RATE:pct0(c.a.winRate), TEAM_WIN:pct0(c.S.company.winRate), GAP:moneyK(c.a.gap),
      NEED_COVER:x1(1/Math.max(.05,c.a.winRate)), TEAM_NEED:x1(1/Math.max(.05,c.S.company.winRate))}) },

  /* The win-rate gap in past tense. The mid-quarter version prescribes coverage
     for a gap that no longer exists once the quarter is over, so the closed one
     drops the prescription and states what the rate cost in deals: the same
     opportunities at the team's rate would have produced a different count. */
  { id:"ae-c-windown-closed", standing:"Conditionals", tone:"bad",
    title:"Win rate - you closed worse than the team",
    fires: c => c.closed && c.a.winRateFromOwn && c.a.winRate < c.S.company.winRate-0.08,
    text:"You closed {{WIN_RATE}} of what you worked against a team average of {{TEAM_WIN}}. "+
      "{{WORKED_COUNT}} produced {{WON_COUNT}}, where the team's rate on the same "+
      "opportunities produces {{TEAM_WOULD}}.",
    tok: c => ({WIN_RATE:pct0(c.a.winRate), TEAM_WIN:pct0(c.S.company.winRate),
      WORKED_COUNT:many(c.workedCount,"opportunity"), WON_COUNT:cnt(c.a.won)+(c.a.won===1?" win":" wins"),
      TEAM_WOULD:cnt(Math.round(c.workedCount*c.S.company.winRate))}) },

  { id:"ae-c-oneaway", standing:"Conditionals", tone:"good", title:"One deal from the accelerator",
    fires: c => !c.closed && c.a.attain<1 && c.a.gap>0 && c.a.gap < c.a.avgDeal && c.p.accel.t1>1,
    text:"You are {{TO_ACCEL}} from quota. One deal at your average size of {{AVG_DEAL}} clears it. The "+
      "deal after that one pays {{ACCEL_COMM}} instead of {{BASE_COMM}}.",
    tok: c => ({TO_ACCEL:moneyK(c.a.gap), AVG_DEAL:moneyK(c.a.avgDeal),
      ACCEL_COMM:nextDeal(c.a.avgDeal, c.p.rate*(c.p.accel.t1||1)), BASE_COMM:nextDeal(c.a.avgDeal, c.p.rate)}) },

  /* Built on the deal dates. A slipping deal was already open when the
     quarter started, has not left an early stage since, and is still carried
     in the forecast as closing in a fortnight, which its stage and this sales
     cycle make impossible. Coverage counts it at full value, so the rep's
     pipeline reads bigger than what can actually land. In the final week the
     forecast date moves into next quarter, and the card says that instead. */
  { id:"ae-c-stalled", standing:"Conditionals", tone:"warn",
    /* Amber says the coverage figure is flattered. Red says it is load
       bearing: take the stale deals out and the pipeline no longer covers the
       gap at all, which is a different conversation. There is no green,
       because a pipeline with nothing parked in it is not news. */
    toneBy: c => c.a.gap>0 && c.a.openRaw*c.a.winRate >= c.a.gap &&
                 (c.a.openRaw-c.a.slipV)*c.a.winRate < c.a.gap ? "bad" : "warn",
    title:"{{SLIP_TITLE}}",
    /* Only where it is worth a card: a tenth of what the rep has open, from
       week four, so a fortnight's forecast has had time to be wrong twice.
       Not at the close. The card is about coverage that will not land, and once
       the quarter is over there is nothing left to land: the closed screen
       printed the same sentence as week 13 about a number that has stopped
       moving. The SDR version does speak at the close, because "never reached a
       decision inside the quarter" is a fact about the quarter that ended. */
    fires: c => !c.closed && c.a.slipN>0 && c.S.week>=4 &&
                c.a.slipV >= 0.10*Math.max(1,c.a.openRaw),
    text:"{{SLIP_SUBJ}}, worth {{SLIP_V}}, {{HAVE_HAS}} sat in {{SLIP_STAGE}} {{FOR_WEEKS}}. {{SLIP_BODY}}",
    tok: c => { const n = c.a.slipN, pushed = c.a.slipPushed>0;
      const stage = c.a.slipStages.length===1 ? c.a.slipStages[0] : "an early stage";
      const loadBearing = c.a.gap>0 && c.a.openRaw*c.a.winRate >= c.a.gap &&
                          (c.a.openRaw-c.a.slipV)*c.a.winRate < c.a.gap;
      return {SLIP_TITLE: pushed ? "The deals that were never going to land have moved to next quarter"
          : loadBearing ? "Your coverage depends on deals that are not moving"
          : "Part of your coverage is not going to land",
        SLIP_SUBJ: n===1 ? "One of your "+num(c.a.openCount)+" open deals"
          : cnt(n)+" of your "+num(c.a.openCount)+" open deals",
        SLIP_V: n===1 ? moneyK(c.a.slipV) : moneyK(c.a.slipV)+" between them",
        HAVE_HAS: n===1 ? "has" : "have",
        SLIP_STAGE: stage,
        /* One deal has one figure; several have a lowest one. */
        FOR_WEEKS: (n===1 ? "for " : "for ")+num(c.a.slipMinWeeks)+" weeks"+(n===1 ? "" : " or more"),
        SLIP_BODY: pushed
          /* By the final week the promise has been made twice: two weeks out
             early on, then the end of the quarter after the deal took its one
             step. "Carried all quarter as closing two weeks out" was the old
             single-promise model and is no longer what the record says. */
          ? (n===1 ? "It was" : "They were")+" forecast inside this quarter every week of it and "+
            (n===1 ? "has" : "have")+" now moved into next quarter, which is where "+(n===1?"it":"they")+
            " always belonged. The "+moneyK(c.a.openRaw)+" your coverage reads includes "+
            (n===1 ? "it" : "them")+"."
          /* The old line said nothing closes that fast "on a 4-week cycle",
             which on an SMB plan is not true. What makes the forecast wrong is
             the deal's own history, not the cycle length. */
          : (c.a.slipExpMax <= c.S.week+2
              ? (n===1 ? "The forecast still has it closing inside two weeks"
                       : "The forecast still has them closing inside two weeks")
              : (n===1 ? "The forecast still has it closing before the quarter ends"
                       : "The forecast still has them closing before the quarter ends"))+
            ", and a deal that has not moved in "+num(c.a.slipMinWeeks)+" weeks is not "+
            (c.a.slipExpMax <= c.S.week+2 ? "closing in the next two" : "closing on that date either")+
            ". Coverage counts "+
            (n===1 ? "it" : "them")+" at full value, so the "+moneyK(c.a.openRaw)+" you have open reads "+
            "bigger than what can land this quarter."+
            (loadBearing ? " Take "+(n===1?"it":"them")+" out and what is left does not cover the gap "+
              "at all." : "")}; } },

  { id:"ae-c-latestage", standing:"Conditionals", tone:"warn",
    title:"Nothing in your pipeline is late stage",
    fires: c => !c.closed && c.S.week>=9 && c.a.openCount>0 && c.a.lateStage===0,
    // "Your pipeline" is false the moment the rep has won anything: those deals
    // went through Proposal on the way to closing. The claim is about what is
    // still open, so the sentence has to say so.
    text:"{{OPEN_SUBJECT}} still in early stages {{WITH_LEFT}}. Nothing in your open "+
      "pipeline has reached {{LATE_STAGE}}.",
    tok: c => ({OPEN_SUBJECT: c.a.openCount===1 ? "Your one open deal is"
                 : "All "+cnt(c.a.openCount)+" of your open deals are", LATE_STAGE:"Proposal"}) },

  /* The rep's kicker findings speak only at the end of the quarter, in the past
     tense, exactly like the Manager's. Mid-quarter there is nothing true to say
     to a rep about it: the number is the team's, they cannot move it alone, and
     the earlier version compared a cumulative figure to a full-quarter line,
     which reported a team at 53% in week 9 as though it had failed.
     A MANAGER does get a mid-quarter pair, because a manager can act on the team
     number and needs to know whether to keep the team pointed at it. Those are
     built on reachability rather than likelihood: see mgr-c-kicklive below.
     Every kicker card on every persona is gated on p.hasKicker. Without that
     gate, each one that reads the ABSENCE of the kicker fired on plans that do
     not have one, because team.kicker is p.hasKicker && attain>=KICK_LINE and
     so reads false whatever the team did. A team at 111% was told it "missed
     the kicker by -0.7 points"; a manager was told the kicker was still on the
     table on a plan with no kicker; a CEO was told they were "carrying the
     complexity of an incentive that paid nothing" that they had not bought.
     Six cards in all: ae-c-kickout, ae-c-kickgated, mgr-c-kicklive,
     mgr-c-kickgone, mgr-c-kickmiss, ceo-c-kickoff. The three that read the
     kicker's PRESENCE were always safe, since t.kicker true implies hasKicker.
     The gate also makes "no reduced-rate line" unreachable on ae-c-kickgated,
     since kickerEligible can only be false once a real threshold exists. */
  { id:"ae-c-kickin", standing:"Conditionals", tone:"good", title:"Your team cleared the kicker",
    fires: c => c.closed && c.team && c.team.kicker && c.a.kickerEligible && c.a.comm>0,
    text:"Your team finished at {{TEAM_ATTAIN}} against the {{KICK_LINE}} line, so you earn an extra "+
      "{{KICK_PCT}} of your own commission on top of everything else. That is {{KICK_VALUE}}.",
    tok: c => ({TEAM_ATTAIN:pct0(c.team?c.team.attain:0), KICK_VALUE:money(c.a.comm*KICK_PCT)}) },

  /* Red, where the team-missed version next to it is amber, and the split is the
     point. If the team missed, nobody was paid and it is not about this rep. If
     the team cleared and the rep is gated out, everyone was paid except them and
     the reason is their own number. That is the harshest outcome the plan
     produces, and two ambers side by side would have hidden the difference. */
  { id:"ae-c-kickgated", standing:"Conditionals", tone:"bad",
    title:"Your team cleared the kicker and it does not pay to you",
    fires: c => c.closed && c.p.hasKicker && c.a.teamCleared && !c.a.kickerEligible && c.a.comm>0,
    text:"Your team finished at {{TEAM_ATTAIN}} and cleared the {{KICK_LINE}} line. This plan pays the "+
      "extra {{KICK_PCT}} only to people at or above {{DECEL_LINE}}, and you finished at {{CLOSED}}, so "+
      "it does not reach you. It would have been {{KICK_VALUE}}.",
    tok: c => ({TEAM_ATTAIN:pct0(c.team?c.team.attain:0), CLOSED:moneyK(c.a.closed),
      KICK_VALUE:money(c.a.comm*KICK_PCT)}) },

  { id:"ae-c-kickout", standing:"Conditionals", tone:"warn",
    title:"Your team missed the kicker by {{KICK_MISS}}",
    fires: c => c.closed && c.p.hasKicker && c.team && !c.team.kicker &&
                c.team.attain >= KICK_LINE-0.10 && c.a.comm>0,
    text:"Your team finished at {{TEAM_ATTAIN}} against the {{KICK_LINE}} line, {{KICK_MISS}} short, so "+
      "the extra {{KICK_PCT}} does not pay. For you that was {{KICK_VALUE}}.",
    tok: c => ({TEAM_ATTAIN:p1(c.team?c.team.attain:0),
      KICK_MISS:gapPts(KICK_LINE, c.team?c.team.attain:0), KICK_VALUE:money(c.a.comm*KICK_PCT)}) },

  /* Both product-mix findings need three closed deals behind them. A rep two
     deals into the quarter who happened to close two core products is at 0%
     strategic, which is true and means nothing: it is a coin flip being reported
     as a pattern. Same rule as the win-rate conditionals, and it holds in week
     nine as well as week two, which a week-based cap would not. */
  { id:"ae-c-tiergood", standing:"Conditionals", tone:"good", title:"Where your commission came from",
    fires: c => c.p.r.MODEL==="MODEL_DEAL_SIZE" && c.a.won>=3 && c.tier.mine > c.tier.team+0.03,
    text:"{{STRAT_SHARE}} of the revenue you closed came from strategic products, against {{TEAM_STRAT}} for "+
      "the team. At the {{TIER_PREMIUM}} strategic premium that is {{TIER_GAIN}} more than the same "+
      "revenue would have paid in core products.",
    tok: c => ({STRAT_SHARE:share(c.tier.mine), TEAM_STRAT:share(c.tier.team), TIER_PREMIUM:"25%",
      TIER_GAIN:money(c.a.closed*c.tier.mine*0.25*c.p.rate)}) },

  { id:"ae-c-tierbad", standing:"Conditionals", tone:"warn", title:"Where your commission came from",
    fires: c => c.p.r.MODEL==="MODEL_DEAL_SIZE" && c.a.won>=3 && c.tier.mine < c.tier.team-0.03,
    text:"{{STRAT_SHARE}} of the revenue you closed came from strategic products, against {{TEAM_STRAT}} for "+
      "the team. Closing the same revenue with the team's product mix would have paid you {{TIER_GAP}} more.",
    tok: c => ({STRAT_SHARE:share(c.tier.mine), TEAM_STRAT:share(c.tier.team),
      TIER_GAP:money(c.a.closed*(c.tier.team-c.tier.mine)*0.25*c.p.rate)}) }
  ];

/* ===========================================================================
   SDR
   =========================================================================== */
  const SDR = [
  { id:"sdr-s1-ahead", standing:"Where you stand", tone:"good", title:"{{AHEAD_TITLE}}",
    fires: c => !c.closed && !c.p.early && c.d.created>=c.d.paceTarget,
    /* "The middle of the team" was factually wrong. An SDR's paceTarget is a flat
       share of their OWN target by week, not a peer statistic, so the phrase
       described a curve as though it were other people. It is gone from both this
       card and the amber. This card also states the period, because standing 2
       counts a different population and the two sit next to each other. */
    /* "Ahead of pace, ahead of the 16.9 the week calls for" on 22 against a
       target of 20 measured a rep against the clock after they had passed the
       finish line. Once the target is met the card says so instead. */
    text:"Week {{WEEK}}. You have created {{OPP_COUNT}} this quarter, against a target of "+
      "{{PIPE_QUOTA}}{{AHEAD_CLAUSE}} Creation counts the day it is accepted, so that part is already "+
      "banked.",
    /* The creation count is ACCEPTED opportunities, which is what the target is
       counted in and what the rep is paid on; the rep may have logged more. The
       other cards on this screen say "accepted" and these two did not. */
    tok: c => { const done = c.d.created >= c.d.target;
      return {OPP_COUNT:many(Math.round(c.d.created),"accepted opportunity"), PIPE_QUOTA:num(c.d.target),
        PIPE_PACE:per(c.d.paceTarget),
        AHEAD_TITLE: done ? "Target met, with the quarter still running" : "Ahead of pace",
        AHEAD_CLAUSE: done
          ? ", which is past it with "+(c.S.weeksLeft<=0 ? "the final week to run"
              : c.S.weeksLeft===1 ? "a week to run" : c.S.weeksLeft+" weeks to run")+"."
          : ", which is ahead of the "+per(c.d.paceTarget)+" the week calls for."}; } },

  { id:"sdr-s1-behind", standing:"Where you stand", tone:"warn", title:"Behind pace",
    /* Amber and red now split on the run rate the gap demands against the rate the
       rep has actually held, not on a share of pace. This rep sat at 68% of pace
       in every single week of the quarter, so a proportional test could never
       escalate however late it got, while the rate he needed went 3.6, 4.3, 5.2,
       16.0 a week as the weeks ran out. The ratio is what changes, so the ratio
       is what the colour follows. */
    fires: c => { if (c.closed || c.p.early || c.d.created>=c.d.paceTarget) return false;
      const need=c.d.gap/Math.max(1,c.S.weeksLeft);
      return need < 2*Math.max(.1, c.d.perWeekSoFar); },
    /* Was three units in one sentence, dollars of pipeline against a count for
       the team against a count for the target, and then said "the gap is 47,
       which is about 47 opportunities", the same number twice. This plan pays on
       opportunities accepted, so the whole card counts opportunities and the
       value never appears. The per-week figure replaces the vague closing line. */
    text:"Week {{WEEK}}. You have created {{OPP_COUNT}} this quarter, against a target of "+
      "{{PIPE_QUOTA}}. Getting there means {{PER_WEEK}} {{FOR_LEFT}}, against "+
      "the {{RAN_PER_WEEK}} a week you have run so far. The gap is in weeks, not in one big account.",
    /* The creation count is ACCEPTED opportunities, which is what the target is
       counted in and what the rep is paid on; the rep may have logged more. The
       other cards on this screen say "accepted" and these two did not. */
    tok: c => ({OPP_COUNT:many(Math.round(c.d.created),"accepted opportunity"), PIPE_QUOTA:num(c.d.target),
      PER_WEEK:per(c.d.gap/Math.max(1,c.S.weeksLeft)), RAN_PER_WEEK:per(c.d.perWeekSoFar)}) },

  { id:"sdr-s1-red", standing:"Where you stand", tone:"bad",
    title:"Behind, and the arithmetic is against you",
    fires: c => { if (c.closed || c.p.early || c.d.created>=c.d.paceTarget) return false;
      const need=c.d.gap/Math.max(1,c.S.weeksLeft);
      return need >= 2*Math.max(.1, c.d.perWeekSoFar); },
    text:"You have created {{PIPE_CREATED}} of a {{PIPE_QUOTA}} target this quarter, "+
      "{{WITH_LEFT}}. Closing that gap needs {{OPPS_PER_WEEK}} a week against the "+
      "{{OPPS_PER_WEEK_ACTUAL}} you have averaged. That is {{RATE_MULT}} the rate you have held all "+
      "quarter, and there is not enough time left for it to close on effort alone.",
    tok: c => { const need=c.d.gap/Math.max(1,c.S.weeksLeft), ran=Math.max(.1,c.d.perWeekSoFar);
      /* The multiple is taken from the ROUNDED figures the card prints, not the
         ones behind them. 2.54 against 1.27 clears the 2x firing rule but shows
         as 2.5 and 1.3, and "more than double" is then false of everything the
         reader can see. */
      const r1=n=>Math.round(n*10)/10;
      const m=r1(need)/Math.max(.1, r1(ran));
      return {PIPE_CREATED:num(c.d.created), PIPE_QUOTA:num(c.d.target)+" opportunities",
        OPPS_PER_WEEK:per(need), OPPS_PER_WEEK_ACTUAL:per(c.d.perWeekSoFar),
        RATE_MULT: m>=3 ? Math.round(m)+" times"
          : m>=2 ? "more than double"
          : m>=1.75 ? "nearly double"
          : (Math.round(m*10)/10)+" times"}; } },

  { id:"sdr-s1-mtg-green", standing:"Where you stand", tone:"good",
    title:"Where you stand - early stage, paid on meetings",
    fires: c => !c.closed && c.p.early && c.d.created>=c.d.paceTarget,
    text:"Week {{WEEK}}. You have held {{MEETINGS_HELD}} of a {{MEETINGS_TARGET}} meeting target "+
      "this quarter, ahead of the {{MEETINGS_PACE}} the week calls for. At {{PER_MEETING}} a "+
      "meeting that is {{MEETINGS_EARNED}} earned so far. On a plan that pays per meeting held, that "+
      "money is already yours.",
    tok: c => ({MEETINGS_HELD:num(c.d.created), MEETINGS_TARGET:num(c.d.target),
      MEETINGS_PACE:per(c.d.paceTarget), PER_MEETING:money(c.p.sdrVariable/c.p.sdrQuota),
      MEETINGS_EARNED:money(c.d.created*c.p.sdrVariable/c.p.sdrQuota)}) },

  { id:"sdr-s1-mtg-amber", standing:"Where you stand", tone:"warn",
    title:"Where you stand - early stage, behind on meetings",
    fires: c => !c.closed && c.p.early && c.d.created<c.d.paceTarget && c.d.created>=c.d.paceTarget*0.7,
    text:"Week {{WEEK}}. You have held {{MEETINGS_HELD}} of a {{MEETINGS_TARGET}} meeting target, "+
      "where the week calls for {{MEETINGS_PACE}}. Getting there means {{MEETINGS_PER_WEEK}} {{FOR_LEFT}}, "+
      "against the {{MEETINGS_PER_WEEK_SO_FAR}} a week you have been running.",
    tok: c => ({MEETINGS_HELD:num(c.d.created), MEETINGS_TARGET:num(c.d.target),
      MEETINGS_PACE:per(c.d.paceTarget),
      MEETINGS_PER_WEEK:per(c.d.gap/Math.max(1,c.S.weeksLeft)),
      MEETINGS_PER_WEEK_SO_FAR:per(c.d.perWeekSoFar)}) },

  { id:"sdr-s1-mtg-red", standing:"Where you stand", tone:"bad",
    title:"Where you stand - early stage, well behind on meetings",
    fires: c => !c.closed && c.p.early && c.d.created<c.d.paceTarget*0.7,
    text:"You have held {{MEETINGS_HELD}} of a {{MEETINGS_TARGET}} meeting target {{WITH_LEFT}}, "+
      "which "+
      "needs {{MEETINGS_FROM_HERE}} against the {{MEETINGS_PER_WEEK_SO_FAR}} you have "+
      "averaged. That is a real step up, so it is worth working out now whether it is a volume problem "+
      "or a list problem. More activity fixes the first and nothing but a better list fixes the second.",
    tok: c => ({MEETINGS_HELD:num(c.d.created), MEETINGS_TARGET:num(c.d.target),
      /* "27 a week from here" in the final week is a rate over a week that is
         not there; with one week or none it is simply how many more. */
      MEETINGS_FROM_HERE: c.S.weeksLeft<=1 ? num(Math.ceil(c.d.gap))+" more"
        : per(c.d.gap/c.S.weeksLeft)+" a week from here",
      MEETINGS_PER_WEEK:per(c.d.gap/Math.max(1,c.S.weeksLeft)),
      MEETINGS_PER_WEEK_SO_FAR:per(c.d.perWeekSoFar)}) },

  { id:"sdr-s1-closed-good", standing:"Where you stand", tone:"good",
    title:"How the quarter finished - target met",
    fires: c => c.closed && c.d.created>=c.d.target,
    text:"You finished the quarter at {{CREATED}} against a {{TARGET}} target. {{CLOSED_NOTE}}",
    tok: c => ({CREATED: c.p.early ? num(c.d.created)+" meetings held" : cnt(c.d.created)+" opportunities",
      TARGET: c.p.early ? num(c.d.target)+" meeting" : cnt(c.d.target)+" opportunity",
      /* Every SDR closing card ends on money now. The rate is the count component
         over the quota, which is the whole plan on a count-only plan and 60% of it
         on Enterprise. */
      PAID_CLAUSE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        if (!w) return "";
        const per = c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota);
        return money(c.d.created*per);
      })(),
      TARGET_PAY: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        return w ? money(c.p.sdrVariable*w/4) : "";
      })(),
      CLOSED_NOTE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        const per = w ? c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota) : 0;
        const paid = money(c.d.created*per), target = money(c.p.sdrVariable*w/4);
        return c.p.early
          ? "Every one of them was earned the day it was held, and they paid "+paid+" against a "+
            target+" target."
          : "Creation counts on acceptance, so that part of your number was banked as you went: "+
            paid+" against a "+target+" target.";
      })()}) },

  /* Split at three quarters of target. Finishing 32% short used to close amber,
     the same colour as a rep who missed by two opportunities. */
  { id:"sdr-s1-closed-well-short", standing:"Where you stand", tone:"bad",
    title:"How the quarter finished - well short of target",
    fires: c => c.closed && c.d.created < c.d.target*0.75,
    text:"You finished the quarter at {{CREATED}} against a {{TARGET}} target, {{SHORT}} short, which "+
      "is {{PCT}} of it. {{CLOSED_NOTE}}",
    tok: c => ({CREATED: c.p.early ? num(c.d.created)+" meetings held" : cnt(c.d.created)+" opportunities",
      TARGET: c.p.early ? num(c.d.target)+" meeting" : cnt(c.d.target)+" opportunity",
      SHORT: cnt(Math.round(c.d.target-c.d.created)), PCT: pct0(c.d.created/Math.max(1,c.d.target)),
      /* Was "the first thing to establish is which weeks they were", which points
         at pipeline analytics this tool does not hold, and it carried no money at
         all. Same treatment as the amber: state what the quarter paid against what
         it was sized to pay. */
      CLOSED_NOTE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        const per = w ? c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota) : 0;
        return "That paid "+money(c.d.created*per)+" against a "+money(c.p.sdrVariable*w/4)+
          " target, and a gap this size is a rate that held all quarter rather than a slow finish.";
      })()}) },

  { id:"sdr-s1-closed-short", standing:"Where you stand", tone:"warn",
    title:"How the quarter finished - short of target",
    fires: c => c.closed && c.d.created<c.d.target && c.d.created>=c.d.target*0.75,
    text:"You finished the quarter at {{CREATED}} against a {{TARGET}} target, {{SHORT}} short. "+
      "{{CLOSED_NOTE}}",
    tok: c => ({CREATED: c.p.early ? num(c.d.created)+" meetings held" : cnt(c.d.created)+" opportunities",
      TARGET: c.p.early ? num(c.d.target)+" meeting" : cnt(c.d.target)+" opportunity",
      SHORT: cnt(Math.round(c.d.target-c.d.created)),
      /* Was "it is worth knowing which weeks they were", which points a rep at
         pipeline analytics this tool does not hold and should not pretend to. It
         is also an answer the model does not contain: creation weeks are assigned
         stratified-uniform with jitter, so there are no quiet weeks to find. This
         is a comp tool, so the close is what the shortfall cost. */
      CLOSED_NOTE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        const per = w ? c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota) : 0;
        const missed = money(Math.max(0, c.d.target-c.d.created)*per);
        return per
          ? "At "+perMoney(per)+" per "+(c.p.early?"meeting held":"accepted opportunity")+" that is "+
            missed+" of variable you did not earn."
          : "";
      })()}) },

  /* Standing 2 used to compare a raw conversion rate off any sample at all, so a
     rep two resolved opportunities into the quarter was told his pipeline was
     converting at 50% against the team's 33%. Below twelve resolved there is no
     rate to read, only counts, and the card now says so instead of ranking him on
     a coin flip. The three verdicts below all use the smoothed number. */
  { id:"sdr-s2-early-days", standing:"What happened to what you created", tone:"good",
    /* Green said "still in play" on a set where the resolved ones were mostly
       losses: too few to state a rate against, which is the card's point, and
       not too few to stop calling it healthy. Amber once the losses are most
       of what has resolved. */
    toneBy: c => (c.d.attWon+c.d.attLost) >= 3 && c.d.attLost > (c.d.attWon+c.d.attLost)*0.7
      ? "warn" : "good",
    title:"What you created is still in play",
    fires: c => !c.solo && !c.p.early && !c.convFromOwn,
    text:"Of the {{OPP_COUNT}} you created that AEs are working, {{OPP_WON}} closed won, {{OPP_LOST}} "+
      "closed lost and "+
      "{{OPP_OPEN}} {{OPEN_VERB}} still open{{LATE_CLAUSE}}. {{RESOLVED}} is too few to read a conversion "+
      "rate "+
      "against the {{TEAM_CONV}} for the rest of the team, so what is still moving matters more than what has landed.",
    tok: c => ({OPP_COUNT:many(c.d.attWon+c.d.attLost+c.d.attOpen,"opportunity"),
      OPP_WON:cnt(c.d.attWon), OPP_LOST:cnt(c.d.attLost), OPP_OPEN:cnt(c.d.attOpen),
      OPEN_VERB:isAre(c.d.attOpen), RESOLVED:many(c.convResolved,"resolved opportunity"),
      LATE_CLAUSE: c.lateStage>0 ? ", "+cnt(c.lateStage)+" of them past Proposal" : "",
      TEAM_CONV:pct0(c.teamConv)}) },

  /* One SDR on the plan, so there is nobody to compare them to. The outcome of
     what they created is still a fact worth stating; the verdict is not. */
  { id:"sdr-s2-solo", standing:"What happened to what you created", tone:"good",
    title:"What happened to what you created",
    fires: c => !c.p.early && c.solo,
    text:"Of the {{OPP_COUNT}} you created that AEs are working, {{OPP_WON}} closed won, {{OPP_LOST}} "+
      "closed lost and {{OPP_OPEN}} {{OPEN_VERB}} still open{{LATE_CLAUSE}}. The plan pays you on acceptance, so "+
      "this number never reaches your cheque. It reaches the AEs working them, and the quality of your "+
      "opportunities is the reputation that travels ahead of you.",
    tok: c => ({OPP_COUNT:many(c.d.attWon+c.d.attLost+c.d.attOpen,"opportunity"),
      OPP_WON:cnt(c.d.attWon), OPP_LOST:cnt(c.d.attLost), OPP_OPEN:cnt(c.d.attOpen),
      OPEN_VERB:isAre(c.d.attOpen),
      LATE_CLAUSE: c.lateStage>0 ? ", "+cnt(c.lateStage)+" of them past Proposal" : ""}) },

  { id:"sdr-s2-green", standing:"What happened to what you created", tone:"good",
    title:"Your pipeline is converting",
    titleClosed:"Your pipeline converted",
    fires: c => !c.solo && !c.p.early && c.convFromOwn && c.conv >= c.teamConv,
    text:"Of the {{OPP_COUNT}} you created that AEs are working, {{OPP_WON}} closed won, {{OPP_LOST}} "+
      "closed lost and "+
      "{{OPP_OPEN}} {{OPEN_VERB}} still open. That is {{SDR_CONV}} conversion against {{TEAM_CONV}} for the "+
      "rest of the team. Nothing in this plan pays you for that number, and it is still the one that gets you an AE "+
      "seat when one opens.",
    tok: c => ({OPP_COUNT:many(c.d.attWon+c.d.attLost+c.d.attOpen,"opportunity"),
      OPP_WON:cnt(c.d.attWon), OPP_LOST:cnt(c.d.attLost), OPP_OPEN:cnt(c.d.attOpen),
      OPEN_VERB:isAre(c.d.attOpen), SDR_CONV:pctVs(c.conv,c.teamConv), TEAM_CONV:pct0(c.teamConv)}) },

  { id:"sdr-s2-amber", standing:"What happened to what you created", tone:"warn",
    /* Was titled "volume is fine, conversion is not" and opened on the rep's rank
       for pipeline created, which told the rep ranked last of five that their
       volume was fine. Volume is standing 1's question and it is answered there.
       This card is about what happens to the work after it leaves their hands. */
    title:"What you hand over is converting below the team",
    titleClosed:"What you handed over converted below the team",
    fires: c => !c.solo && !c.p.early && c.convFromOwn && c.conv < c.teamConv && c.conv >= c.teamConv*0.6,
    text:"The opportunities you hand over are converting at {{SDR_CONV}} against {{TEAM_CONV}} for the "+
      "rest of the team. The plan pays you on what you create, so this gap does not show up in your cheque. It is "+
      "worth an hour with the AEs working your accounts to hear what the gap is made of, because it is "+
      "the part of the job the plan cannot measure.",
    tok: c => ({SDR_CONV:pctVs(c.conv,c.teamConv), TEAM_CONV:pct0(c.teamConv)}) },

  { id:"sdr-s2-red", standing:"What happened to what you created", tone:"bad",
    title:"The pipeline is not standing up",
    fires: c => !c.solo && !c.p.early && c.convFromOwn && c.conv < c.teamConv*0.6,
    // The old version prescribed sitting in on handovers, which assumes a
    // handover process this org may not have. The AEs who worked the deals know
    // why they died whatever the process is called.
    titleClosed:"The pipeline did not stand up",
    text:"{{OPP_LOST}} of the {{OPP_COUNT}} you created that AEs {{WORK_VERB}} {{LOST_VERB}} lost, "+
      "which is {{SDR_CONV}} conversion against {{TEAM_CONV}} for the rest of the team. Something "+
      "{{GO_VERB}} wrong between the meeting and the close, and the AEs who worked those deals are the "+
      "ones who know what. Your number {{SAFE_VERB}} safe either way, which is why something like this "+
      "{{GONE_VERB}} unmentioned for a whole quarter.",
    tok: c => ({OPP_LOST:cnt(c.d.attLost), OPP_COUNT:many(c.d.attWon+c.d.attLost+c.d.attOpen,"opportunity"),
      WORK_VERB: c.closed ? "worked" : "are working", LOST_VERB: c.closed ? "were" : "have already been",
      GO_VERB: c.closed ? "went" : "is going", SAFE_VERB: c.closed ? "was" : "is",
      GONE_VERB: c.closed ? "went" : "can go",
      SDR_CONV:pctVs(c.conv,c.teamConv), TEAM_CONV:pct0(c.teamConv)}) },

  /* Standing 2 had only a below-team variant on early-stage plans, so it went
     silent for every rep at or above the team rate, which is half of them. That is
     why the card looked like it appeared at random. */
  /* THE STEP THIS VIEW CAN SEE. Both of these used to report the win rate of
     the deals wearing the SDR's name, which the engine deals independently of
     their meetings, so the sentence described a chain that is never modelled.
     They now report the step the ledger actually holds: how many of the
     meetings became an opportunity at all. Javier, 15 Oct: "we are never
     judging her on the value of meetings, there's a jump there that doesn't
     actually work". */
  { id:"sdr-s2-early-good", standing:"What happened to what you created", tone:"good",
    title:"Early stage - your meetings are turning into something",
    titleClosed:"Early stage - your meetings turned into something",
    fires: c => !c.solo && c.p.early && c.meetRate.seen >= 5 &&
                c.meetRate.rate >= c.meetTeamRate,
    text:"{{MINE}} of the meetings you held have turned into an opportunity, against {{TEAM}} for "+
      "the rest of the team. This plan pays you for holding the meeting either way, so nothing about "+
      "that number reaches your cheque. It reaches the AEs who work them, and it is the number people "+
      "remember when a seat opens.",
    tok: c => ({MINE:pctVs(c.meetRate.rate,c.meetTeamRate), TEAM:pct0(c.meetTeamRate)}) },

  { id:"sdr-s2-early", standing:"What happened to what you created", tone:"warn",
    title:"Early stage - the plan pays for the meeting, not the outcome",
    titleClosed:"Early stage - the plan paid for the meeting, not the outcome",
    fires: c => !c.solo && c.p.early && c.meetRate.seen >= 5 &&
                c.meetRate.rate < c.meetTeamRate,
    text:"{{MINE}} of the meetings you held have turned into an opportunity, against {{TEAM}} for "+
      "the rest of the team. Your pay is the same either way on this plan, which is the whole point of "+
      "the number: nothing else on this screen would tell you. If you want one thing to change, it is "+
      "usually who is in the room rather than how many rooms.",
    tok: c => ({MINE:pctVs(c.meetRate.rate,c.meetTeamRate), TEAM:pct0(c.meetTeamRate)}) },

  /* Standing 3 used to be concentration, and it could not fill the slot. The gate
     is a share of created pipeline value, and that share decays automatically as
     the count grows: three opportunities in week 1 make the largest one 38% by
     arithmetic, sixteen by week 6 make it 8%. So it spoke only when the sample was
     too small to mean anything and went silent once the rep had a real book. It
     also cannot touch this rep's money, because the target counts opportunities.

     What is live every week, and is about the cheque, is acceptance. The ledger
     stamps every created opportunity accepted or rejected and the plan pays only
     on the accepted ones. Rejection is a flat rate for everyone in the model, so
     this states the rep's own numbers and never compares them to the team. */
  /* Rank, as its own card rather than a clause. An SDR's plan pays on their own
     count and nothing else, so position on the team is the one number on their
     screen that is purely about them against their peers, and it is the number
     that decides who gets asked when an AE seat opens. Week 1 is excluded because
     three opportunities against five is noise; from week 3 the ordering is stable.
     Rank is on ACCEPTED opportunities, which is what the target counts. */
  { id:"sdr-s4-rank-up", standing:"Where you sit on the team", tone:"good",
    title:"Where you sit on the team",
    fires: c => c.S.sdrs.length>=4 && (c.closed || c.S.week>=3) &&
                c.rankMine >= c.sdrMedian,
    text:"{{RANK_VERB}} {{SDR_RANK}} of the {{SDR_TEAM_SIZE}} on this plan, on {{MY_ACCEPTED}} "+
      "{{RANK_UNIT}} {{COMPARED}}. That ordering is what gets read when an AE seat opens.",
    /* Everyone in the top half was measured against the middle of the team,
       which is the group they have already passed: second place on 6 against
       "6 for the middle of the team" is a comparison with nothing in it. They
       are measured against what is in front of them, and the leader against
       the rep chasing them. */
    tok: c => ({RANK_VERB: c.closed ? "You finished" : "You are", SDR_RANK:ord(c.sdrRank),
      SDR_TEAM_SIZE:many(c.S.sdrs.length,"SDR"), MY_ACCEPTED:num(c.rankMine), RANK_UNIT:c.rankUnit,
      COMPARED: c.sdrRank===1
        ? (c.sdrSecond>0 ? "against "+num(c.sdrSecond)+" for the SDR behind you"
                         : "ahead of the rest of the team")
        : Math.round(c.sdrTop)===Math.round(c.rankMine)
        ? "level with the top of the team"
        : "against "+num(c.sdrTop)+" for the top of the team"}) },

  { id:"sdr-s4-rank-down", standing:"Where you sit on the team", tone:"warn",
    title:"Where you sit on the team",
    fires: c => c.S.sdrs.length>=4 && (c.closed || c.S.week>=3) &&
                c.rankMine < c.sdrMedian && c.rankMine >= 0.75*c.sdrMedian,
    text:"{{RANK_VERB}} {{SDR_RANK}} of the {{SDR_TEAM_SIZE}} on this plan, on {{MY_ACCEPTED}} "+
      "{{RANK_UNIT}}. {{BEHIND_CLAUSE}} That ordering is what gets read when an AE seat opens.",
    tok: c => ({RANK_VERB: c.closed ? "You finished" : "You are", SDR_RANK:ord(c.sdrRank),
      SDR_TEAM_SIZE:many(c.S.sdrs.length,"SDR"), MY_ACCEPTED:num(c.rankMine), RANK_UNIT:c.rankUnit,
      BEHIND_CLAUSE: "The top of the team "+(c.closed ? "finished" : "is")+" on "+num(c.sdrTop)+
          " and the middle on "+num(c.sdrMedian)+".",
      TOP_VERB: c.closed ? "finished" : "is", TEAM_TOP:num(c.sdrTop),
      TEAM_MEDIAN:num(c.sdrMedian)}) },

  { id:"sdr-s4-rank-far", standing:"Where you sit on the team", tone:"bad",
    title:"Where you sit on the team",
    fires: c => c.S.sdrs.length>=4 && (c.closed || c.S.week>=3) &&
                c.rankMine < 0.75*c.sdrMedian,
    text:"{{RANK_VERB}} {{SDR_RANK}} of the {{SDR_TEAM_SIZE}} on this plan, on {{MY_ACCEPTED}} "+
      "{{RANK_UNIT}}, {{BEHIND_GAP}}. {{GAP_TAIL}}",
    tok: c => ({RANK_VERB: c.closed ? "You finished" : "You are", SDR_RANK:ord(c.sdrRank),
      SDR_TEAM_SIZE:many(c.S.sdrs.length,"SDR"), MY_ACCEPTED:num(c.rankMine), RANK_UNIT:c.rankUnit,
      BEHIND_GAP: num(c.sdrMedian-c.rankMine)+" behind the middle of the team and "+
          num(c.sdrTop-c.rankMine)+" behind the top",
      TO_MEDIAN:num(c.sdrMedian-c.rankMine), TO_TOP:num(c.sdrTop-c.rankMine),
      // "The gap to close" is work still to do, which the quarter no longer has.
      /* "The gap to close before the ordering starts working for you" implies
         the gap is closeable. In week 11 on the weakest SDR it was six times
         what they had created all quarter, which is not a ranking problem. */
      /* Against the weeks left at their own rate, not against their total: in
         week 11 an SDR six behind the middle is six weeks of their own work
         short with two weeks to do it in. */
      GAP_TAIL: (c.sdrMedian-c.rankMine) > (c.rankMine/Math.max(1,c.S.week))*Math.max(0,c.S.weeksLeft)
        ? (c.closed ? "Closing that is next quarter's work, and at this quarter's rate it is more "+
            "than a quarter of it."
          : "At your own rate that is more work than the weeks left hold, so this is a volume "+
            "problem rather than a ranking one, and the ordering is only the symptom.")
        : c.closed ? "Closing that is next quarter's work."
        : "That is the gap to close before the ordering starts working for you."}) },

  { id:"sdr-s3-clean", standing:"What counted", tone:"good", title:"Everything you logged counted",
    /* Green whenever the rejections cost nothing, which is nearly always. Four of
       seventy-one against a target of fifty is not a warning, it is the bar doing
       its job. It cannot be a rate comparison either: rejection is flat across the
       model, so "your rejection rate is high" would report noise. */
    fires: c => !c.p.early && c.d.createdCount>0 && c.d.accepted>=c.d.createdCount,
    text:"{{LOGGED_VERB}} {{LOGGED}} this quarter and an AE accepted every one. Only accepted "+
      "opportunities {{COUNT_VERB}} toward your {{TARGET}}, so nothing you did fell through that "+
      "gap. {{EARNED_CLAUSE}}",
    tok: c => ({LOGGED:many(c.d.createdCount,"opportunity"), TARGET:num(c.d.target),
      EARNED_CLAUSE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        if (!w) return "";
        const perOpp = c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota);
        // The rate is a plan mechanic, so it is stated once in week 1 and the
        // totals carry every week after that. It also lives on the plan page.
        // The money hangs off the ACCEPTED count, not off creation: the rejected
        // ones paid nothing, so "creation paid" would overstate what the work
        // earned. The rate is stated in week 1 and the totals carry every week
        // after that; it also lives permanently on the plan page.
        const money_ = money(c.d.accepted*perOpp);
        const subj = "Those "+cnt(c.d.accepted);
        return c.S.week<=1 && !c.closed
          ? subj+" have paid "+money_+" so far, at "+perMoney(perOpp)+" per accepted opportunity."
          : subj+(c.closed ? " paid "+money_+"." : " have paid "+money_+" so far.");
      })(),
      LOGGED_VERB: c.closed ? "You logged" : "You have logged",
      COUNT_VERB: c.closed ? "counted" : "count"}) },

  /* Rejections that cost nothing. The green above claimed an AE accepted every
     one, which was false whenever this case fired through it. */
  { id:"sdr-s3-some", standing:"What counted", tone:"good", title:"What you logged and what counted",
    fires: c => !c.p.early && c.d.createdCount>0 && c.d.accepted<c.d.createdCount &&
      (c.d.accepted>=c.d.target || c.d.createdCount<c.d.target),
    text:"{{LOGGED_VERB}} {{LOGGED}} this quarter and an AE accepted {{ACCEPTED}} of them. "+
      "{{REJECTED}} did not meet the bar, and only accepted opportunities {{COUNT_VERB}} toward your "+
      "{{TARGET}}, so {{EARNED_TAIL}}",
    tok: c => { const w=(c.p.sdrWeights&&c.p.sdrWeights.count)||0;
      const per = w ? c.p.sdrVariable*w/Math.max(1,c.p.sdrQuota) : 0;
      return {LOGGED:many(c.d.createdCount,"opportunity"), ACCEPTED:cnt(c.d.accepted),
        REJECTED:many(c.d.createdCount-c.d.accepted,"opportunity"), TARGET:num(c.d.target),
        LOGGED_VERB: c.closed ? "You logged" : "You have logged",
        COUNT_VERB: c.closed ? "counted" : "count",
        EARNED_TAIL: "those "+cnt(c.d.accepted)+(c.closed ? " paid " : " have paid ")+
          money(c.d.accepted*per)+(c.closed ? "." : " so far.")}; } },

  { id:"sdr-s3-rejected", standing:"What counted", tone:"warn", title:"What you logged and what counted",
    // Fires only when they logged enough and the rejections took the target away.
    fires: c => !c.p.early && c.d.createdCount>0 && c.d.accepted<c.d.createdCount &&
      c.d.accepted<c.d.target && c.d.createdCount>=c.d.target,
    text:"{{LOGGED_VERB}} {{LOGGED}} this quarter and an AE accepted {{ACCEPTED}} of them. "+
      "{{REJECTED}} did not meet the bar, and only accepted opportunities {{COUNT_VERB}} toward your "+
      "{{TARGET}}. You logged enough to clear it and {{ACCEPTED}} is what {{COUNT_VERB2}}, so the bar "+
      "is the reason you {{MISS_VERB}} it. {{EARNED_CLAUSE}}",
    tok: c => ({LOGGED:many(c.d.createdCount,"opportunity"), LOGGED_N:cnt(c.d.createdCount),
      ACCEPTED:cnt(c.d.accepted), REJECTED:many(c.d.createdCount-c.d.accepted,"opportunity"),
      TARGET:num(c.d.target),
      EARNED_CLAUSE: (()=>{
        const w = (c.p.sdrWeights && c.p.sdrWeights.count) || 0;
        if (!w) return "";
        const perOpp = c.p.sdrVariable*w/Math.max(1, c.p.sdrQuota);
        // The rate is a plan mechanic, so it is stated once in week 1 and the
        // totals carry every week after that. It also lives on the plan page.
        // The money hangs off the ACCEPTED count, not off creation: the rejected
        // ones paid nothing, so "creation paid" would overstate what the work
        // earned. The rate is stated in week 1 and the totals carry every week
        // after that; it also lives permanently on the plan page.
        const money_ = money(c.d.accepted*perOpp);
        const subj = "Those "+cnt(c.d.accepted);
        return c.S.week<=1 && !c.closed
          ? subj+" have paid "+money_+" so far, at "+perMoney(perOpp)+" per accepted opportunity."
          : subj+(c.closed ? " paid "+money_+"." : " have paid "+money_+" so far.");
      })(),
      LOGGED_VERB: c.closed ? "You logged" : "You have logged",
      COUNT_VERB: c.closed ? "counted" : "count",
      COUNT_VERB2: c.closed ? "counted" : "counts",
      MISS_VERB: c.closed ? "missed" : "are short of",
      PAY_VERB: c.closed ? "paid" : "pays"}) },

  { id:"sdr-c-concentrated", standing:"Conditionals", tone:"warn",
    title:"One opportunity is carrying the value you created",
    fires: c => !c.p.early && c.topOpp && c.d.createdCount>=8 && c.topShare>=0.35,
    /* This measured concentration in dollars against a target counted in
       opportunities, then told the rep their quarter was fine without saying why.
       Whichever line the sentence names, the share is measured to that line: the
       SDR is paid per accepted opportunity, so a large one is worth exactly the
       same to them as a small one. The concentration is real, it just lands on
       the AE team and on the SDR's own record rather than on their cheque, and
       the card now says that rather than implying the money is at stake. */
    text:"{{TOP_OPP_PCT}} of the pipeline value you have created sits in {{TOP_OPP_NAME}} at "+
      "{{TOP_OPP}}. Your target counts opportunities, not dollars, so that account pays you the same "+
      "as any other and your own number does not move with it. What does move with it is what the AE "+
      "team is carrying, and how your quarter gets remembered if it goes away.",
    tok: c => ({TOP_OPP_PCT:share(c.topShare), TOP_OPP_NAME:c.topOpp?c.topOpp.account:"-",
      TOP_OPP:moneyK(c.topOpp?c.topOpp.acv:0)}) },

  /* The card the deleted sdr-c-latestage was groping at, now that the records
     carry dates. Not stage depth, which an SDR does not control, but an
     opportunity they created that has not moved out of an early stage since
     before the quarter began while the forecast keeps promising it in a
     fortnight. An opportunity created last week cannot land here. */
  { id:"sdr-c-stalled", standing:"Conditionals", tone:"warn",
    /* Red once half of what they created and still have open is parked, but
       only where the plan pays the SDR when an AE closes. On a count and value
       plan those deals cost the rep nothing this quarter, so red would be
       shouting about somebody else's problem. */
    toneBy: c => c.deferredShare>0 && c.mySlipN*2 >= c.myOpenN ? "bad" : "warn",
    title:"Opportunities you created have stopped moving",
    /* Two or more, so one parked deal on a long list is not a card, and from
       week four, by which point a two-week forecast has been wrong twice. */
    fires: c => !c.p.early && c.S.week>=4 && c.mySlipN >= 2,
    text:"{{SUBJECT}}, worth {{SLIP_V}}, {{HAVE_NOT}} left {{SLIP_STAGE}} in {{SLIP_WEEKS}}. {{TAIL}}",
    tok: c => { const n = c.mySlipN;
      const stage = c.mySlipStages.length===1 ? c.mySlipStages[0] : "an early stage";
      return {SUBJECT: n===c.myOpenN
          ? (n===1 ? "The one opportunity you created that is still open"
             : "All "+many(n,"opportunity")+" you created that are still open")
          : cnt(n)+" of the "+many(c.myOpenN,"opportunity")+" you created that "+
            (c.myOpenN===1 ? "is" : "are")+" still open",
        SLIP_V: moneyK(c.mySlipV), HAVE_NOT: n===1 ? "has not" : "have not",
        SLIP_STAGE: stage,
        /* Several deals have a lowest figure, one deal has its own. */
        SLIP_WEEKS: num(c.mySlipMinWeeks)+" weeks"+(n===1 ? "" : " or more"),
        TAIL: (()=>{
          const them = n===1 ? "it" : "them", they = n===1 ? "it" : "they";
          const fore = forecastSays(c.mySlipExpMin, c.mySlipExpMax, c.S.week, them)+".";
          /* On a plan that pays nothing when an AE closes, "the part of your
             commission that pays when an AE closes" is a component that does
             not exist. #mixed pays 60% on count and 40% on value, so what
             those deals are holding up there is the value half, which was
             already paid on creation: the cost is the next one they do not
             create while these sit. */
          const stake = c.deferredShare>0
            ? "The part of your commission that pays when an AE closes is waiting on "+
              (n===1 ? "that deal" : "those deals")+", and it is worth asking which of them the AE "+
              "would work again."
            : "Your own number counted "+(n===1 ? "it" : "them")+" the day "+
              (n===1 ? "it was" : "they were")+" accepted, so nothing here costs you this quarter. "+
              /* Once the dates have been pushed, the quarter they sit in is
                 next quarter, not this one. */
              (n===1 ? "It sits" : "They sit")+" in the AEs' "+
              (c.mySlipExpMin > QTR_WEEKS ? "next quarter" : "quarter")+" now, and it is worth "+
              "asking which of them the AE would work again.";
          return c.closed
            ? (n===1 ? "It never reached a decision inside the quarter" :
               "They never reached a decision inside the quarter")+", and "+fore.charAt(0).toLowerCase()+
              fore.slice(1)+" "+stake
            : fore+" "+stake; })()}; } },

  { id:"sdr-c-deferred", standing:"Conditionals", tone:"good",
    title:"Part of your number is not yours to close",
    /* Split in two on exposure. Amber only late in the quarter with a real share
       still unresolved; before that, or once most of it has landed either way,
       nothing is wrong and a permanent amber was reporting the plan's shape. */
    fires: c => c.deferredShare>0 && !(openShare(c)>=0.25 && (c.closed || c.S.week>=9)),
    /* Fires after the quarter closes as well, where the mid-quarter wording sent
       the rep to filter a list for deals that are still moving. Once the quarter
       is over those deals did not close inside it, so the deferred share does not
       arrive on this quarter's cheque at all: it follows the deals into the next
       one. Two tenses, one card. */
    text:"{{ACCEPTED_CLAUSE}} {{DEFERRED_CLAUSE}}",
    tok: c => ({PAID_ON_CREATION:pct0(1-c.deferredShare), PAID_ON_CLOSE:pct0(c.deferredShare),
      OPP_OPEN:cnt(c.d.attOpen),
      ACCEPTED_CLAUSE: (()=>{
        const perOpp = c.p.sdrVariable*(1-c.deferredShare)/Math.max(1, c.p.sdrQuota);
        return pct0(1-c.deferredShare)+" of your commission "+(c.closed?"paid ":"pays ")+
          perMoney(perOpp)+" per accepted opportunity, and "+cnt(c.d.accepted)+
          (c.closed ? " were accepted" : " have been accepted")+", which is "+
          money(c.d.accepted*perOpp)+".";
      })(),
      DEFERRED_CLAUSE: (()=>{
        const perDeal = c.p.sdrVariable*c.deferredShare/
                        Math.max(1, c.p.sdrQuota*c.p.winRate);
        const earned  = money(c.d.attWon*perDeal);
        const has     = n => n===1 ? " has landed" : " have landed";
        const rate    = c.S.week<=1
          ? "The other "+pct0(c.deferredShare)+" pays "+perMoney(perDeal)+" per deal when an AE closes "+
            "what you created"
          : "The other "+pct0(c.deferredShare)+" depends on an AE closing what you created";
        const ratePast= "The other "+pct0(c.deferredShare)+" paid "+perMoney(perDeal)+" per deal when an "+
                        "AE closed what you created";
        if (c.closed) return ratePast+", and "+many(c.d.attWon,"deal")+" landed, "+
          "which is "+earned+"."+(c.d.attOpen===0 ? ""
          : " "+many(c.d.attOpen,"deal")+" did not resolve inside the quarter, so that part is not "+
            "lost, it follows them into next quarter.");
        if (c.d.attOpen===0) return rate+". "+many(c.d.attWon,"deal")+has(c.d.attWon)+", which is "+
          earned+", and nothing you created is still open.";
        return rate+". "+many(c.d.attWon,"deal")+has(c.d.attWon)+" so far, which is "+earned+", and "+
          many(c.d.attOpen,"deal")+" are still open. Those are the open rows in your opportunity "+
          "list: filter it to what you created and somebody else now owns, and you can see what is "+
          "still moving and what has gone quiet.";
      })()}) },

  { id:"sdr-c-deferred-late", standing:"Conditionals", tone:"warn",
    title:"Most of your deferred pay is still unresolved",
    fires: c => c.deferredShare>0 && openShare(c)>=0.25 && (c.closed || c.S.week>=9),
    /* Fires after the quarter closes as well, where the mid-quarter wording sent
       the rep to filter a list for deals that are still moving. Once the quarter
       is over those deals did not close inside it, so the deferred share does not
       arrive on this quarter's cheque at all: it follows the deals into the next
       one. Two tenses, one card. */
    text:"{{ACCEPTED_CLAUSE}} {{DEFERRED_CLAUSE}}",
    tok: c => ({PAID_ON_CREATION:pct0(1-c.deferredShare), PAID_ON_CLOSE:pct0(c.deferredShare),
      OPP_OPEN:cnt(c.d.attOpen),
      ACCEPTED_CLAUSE: (()=>{
        const perOpp = c.p.sdrVariable*(1-c.deferredShare)/Math.max(1, c.p.sdrQuota);
        return pct0(1-c.deferredShare)+" of your commission "+(c.closed?"paid ":"pays ")+
          perMoney(perOpp)+" per accepted opportunity, and "+cnt(c.d.accepted)+
          (c.closed ? " were accepted" : " have been accepted")+", which is "+
          money(c.d.accepted*perOpp)+".";
      })(),
      DEFERRED_CLAUSE: (()=>{
        const perDeal = c.p.sdrVariable*c.deferredShare/
                        Math.max(1, c.p.sdrQuota*c.p.winRate);
        const earned  = money(c.d.attWon*perDeal);
        const has     = n => n===1 ? " has landed" : " have landed";
        const rate    = c.S.week<=1
          ? "The other "+pct0(c.deferredShare)+" pays "+perMoney(perDeal)+" per deal when an AE closes "+
            "what you created"
          : "The other "+pct0(c.deferredShare)+" depends on an AE closing what you created";
        const ratePast= "The other "+pct0(c.deferredShare)+" paid "+perMoney(perDeal)+" per deal when an "+
                        "AE closed what you created";
        if (c.closed) return ratePast+", and "+many(c.d.attWon,"deal")+" landed, "+
          "which is "+earned+"."+(c.d.attOpen===0 ? ""
          : " "+many(c.d.attOpen,"deal")+" did not resolve inside the quarter, so that part is not "+
            "lost, it follows them into next quarter.");
        if (c.d.attOpen===0) return rate+". "+many(c.d.attWon,"deal")+has(c.d.attWon)+", which is "+
          earned+", and nothing you created is still open.";
        return rate+". "+many(c.d.attWon,"deal")+has(c.d.attWon)+" so far, which is "+earned+", and "+
          many(c.d.attOpen,"deal")+" are still open. Those are the open rows in your opportunity "+
          "list: filter it to what you created and somebody else now owns, and you can see what is "+
          "still moving and what has gone quiet.";
      })()}) },

  /* sdr-c-latestage is DELETED, not rewritten. It said a pipeline sitting in
     early stages "stalls this early", and nothing in the model supports that.
     openStage derives the stage from how far out a deal closes, so early stage
     means the close date is distant rather than that anything has stalled, and
     late in the quarter a future-dated deal can only be one week out, which
     makes Negotiation the only reachable stage for it. So lateStage===0 after
     week 11 is only reachable when every open opp is a carryover, and those are
     dealt a stage at random. The card was reading a coin flip and calling it
     qualification.

     What it was reaching for is real and lives elsewhere: sdr-s2-red judges the
     same pipeline on conversion, which is what happened to the opps rather than
     where they are parked, and it already ends on "your number is safe either
     way, which is why something like this can go unmentioned for a whole
     quarter". sdr-s2-early-days and sdr-s2-solo already append a plain count of
     what is past Proposal, with no verdict attached.

     The honest version of this card is weeks-in-stage, and it needs a created
     week on the deal record, which the ledger does not have: the SDR creation
     log carries weeks, the deal set carries only which SDR made it, and the two
     are generated independently. Banked in the TODO with the expected close
     week the deal table needs. Until both land, nothing here can separate "this
     pipeline is not moving" from "this was created in week twelve". */

  { id:"sdr-c-oneaway", standing:"Conditionals", tone:"good", title:"One opportunity from target",
    fires: c => !c.p.early && c.d.gap>0 && c.d.gap<=1,
    // Deal size cannot clear a gap counted in opportunities, and "one opportunity
    // from target, one opportunity clears it" said the same thing twice.
    text:"You are {{PIPE_TO_TARGET}} from your target. The next one an AE accepts takes you there, "+
      "and it pays {{PER_OPP}}.",
    tok: c => ({PIPE_TO_TARGET:cnt(Math.ceil(c.d.gap))+" accepted opportunity",
      PER_OPP: money(c.p.sdrVariable*((c.p.sdrWeights&&c.p.sdrWeights.count)||0)/
                     Math.max(1,c.p.sdrQuota))}) },

  /* Enterprise SDR plans pay a second component on pipeline VALUE, and nothing
     reported it. No comparison in here: opportunity sizes are drawn independently
     of the rep, so "your opportunities are bigger than the team's" would be noise.
     Their own two totals are real, because both follow from a count that is
     modelled per rep. */
  { id:"sdr-c-value", standing:"Conditionals", tone:"good",
    /* It explained the mechanic in green whatever the value half was doing, so
       a rep a third of the way to their value target read the same colour as
       one past it. The bands are the ones the rest of the SDR set uses. */
    toneBy: c => { const a = sdrValuePace(c);
      return a >= 1 ? "good" : a >= MGR_TEAM_FLOOR ? "warn" : "bad"; },
    title:"Your plan pays on value as well as count",
    titleClosed:"Your plan paid on value as well as count",
    fires: c => !c.p.early && !!(c.p.sdrWeights && c.p.sdrWeights.value),
    text:"{{COUNT_PCT}} of your variable {{PAYS}} on accepted opportunities, {{COUNT_MONEY}} {{SO_FAR}}. "+
      "The other {{VALUE_PCT}} {{PAYS}} on the value of what you {{CREATE_VERB}}, {{PER_1M}} per $1M, "+
      "and you {{CREATED_VERB}} {{CREATED_VALUE}}, which is {{VALUE_MONEY}}. {{VALUE_STANDS}}",
    tok: c => { const W=c.p.sdrWeights||{}, V=c.p.sdrVariable;
      /* Stated per $1M rather than per $100K. There are no blocks here, it is a
         straight rate, and "per $100K" reads like a unit you accumulate. At $1M
         the worked example does the explaining: $3.90M is visibly not a round
         number of millions and it still pays. $1M is also the unit people think
         in for pipeline, where $100K is the unit they count opportunities in. */
      const per1m = V*(W.value||0)/Math.max(1, c.p.sdrQuota*c.p.acv)*1000000;
      const target = c.d.target*c.p.acv, a = sdrValueAttain(c);
      return {COUNT_PCT:pct0(W.count||0), VALUE_PCT:pct0(W.value||0),
        PAYS: c.closed ? "paid" : "pays", SO_FAR: c.closed ? "in total" : "so far",
        CREATE_VERB: c.closed ? "created" : "create",
        CREATED_VERB: c.closed ? "created" : "have created",
        COUNT_MONEY:money(c.d.accepted*V*(W.count||0)/Math.max(1,c.p.sdrQuota)),
        PER_1M:money(per1m), CREATED_VALUE:moneyK(c.d.createdValue),
        VALUE_MONEY:money(c.d.createdValue/1000000*per1m),
        /* The card used to end on how the two halves differ and never said
           where the second one stood. */
        /* At the close the sentence is about the target. While the quarter
           runs it is about the pace, because that is what the colour reads and
           16% of a quarter target in week 1 is neither good nor bad on its
           own. */
        VALUE_STANDS: c.closed
          ? (a >= 1
             ? "That cleared the "+moneyK(target)+" the value half is measured against, on "+
               pct0(a)+" of it."
             : "That finished at "+pct0(a)+" of the "+moneyK(target)+" the value half is measured "+
               "against.")
          : (sdrValuePace(c) >= 1
             ? "That is "+pct0(a)+" of the "+moneyK(target)+" the value half is measured against, "+
               "ahead of the pace for week "+c.S.week+"."
             : "That is "+pct0(a)+" of the "+moneyK(target)+" the value half is measured against, "+
               "behind the pace for week "+c.S.week+", and the count half cannot make it up: the two "+
               "are paid separately.")}; } }
  ];

/* ===========================================================================
   CUSTOMER SUCCESS
   =========================================================================== */
  const CS = [
  /* All three of these used to fire on, and quote, the running retention rate,
     which is held over held-plus-churned. Early in the quarter that is a rate on
     the sliver that has resolved: in week 3 a CSM showed 84% off $55K of a $653K
     renewal base, and the card told them they were under the gate. They were not.
     The number moves on its own as renewals land, whatever they do, so the colour
     flapped and the copy was forecasting.

     The stable quantity is the churn budget. The gate pays nothing below 88%, so
     across the quarter the CSM can lose 12% of what is up for renewal and still
     clear it, and 5% to keep the component whole. Those are fixed the day the
     quarter opens. Red now means the budget is spent and the gate is arithmetically
     gone, which is a fact rather than a projection. */
  /* Standing 1 reports position on the ramp, in money. The component is nothing
     below the gate, slides to whole at the full line, and keeps paying to 120%
     above it, so "you cleared the gate" was the least useful thing the card could
     say: clearing it is worth $129 to a CSM at 88.3%. What they can act on is
     what the component is paying now, what it pays whole, and what the next
     thousand of churn costs. */
  { id:"cs-s1-whole", standing:"What you are holding", tone:"good",
    title:"The retention component is whole",
    titleClosed:"The retention component paid in full",
    fires: c => c.k.atRisk>0 && c.retIfNoMore!==null && c.retIfNoMore>=RET_FULL,
    /* Three positions, three sentences, and only the sentences each position
       needs. The old card said the same fact three ways: nothing has churned,
       nothing more churning leaves you at 100%, and at or above 95%. It also
       did arithmetic the reader can do, printing the difference between what it
       pays and what it is worth alongside both numbers.

       So the projection is printed only where the opening has not already made
       it obvious. With nothing resolved there is no churn figure to imply it,
       so it stays. With renewals landed and nothing churned, "nothing has
       churned" is 100% already, so it goes. */
    text:"{{OPEN}} {{HOLD_CLAUSE}}{{PAY_CLAUSE}}",
    tok: c => {
      const ret  = pctBar(c.retIfNoMore||0);
      const over = c.retNow > c.retFull;
      const none = (c.k.held + c.k.churned) === 0;
      const churn = c.k.churned > 0;
      return {
        OPEN: c.closed
          ? "Your "+moneyK(c.k.atRisk)+" renewal book closed with "+
            (churn ? moneyK(c.k.churned)+" churned." : "nothing churned.")
          : none
          ? "None of your "+moneyK(c.k.atRisk)+" renewal book has resolved yet."
          : moneyK(c.k.held)+" of your "+moneyK(c.k.atRisk)+" renewal book has renewed and "+
            (churn ? moneyK(c.k.churned)+" has churned." : "nothing has churned."),
        HOLD_CLAUSE: (c.closed || bookSettled(c) || (!none && !churn)) ? ""
          : "Nothing more churning leaves you at "+ret+". ",
        /* Above the full line the component keeps climbing, so the two numbers
           are worth naming. Exactly on it there is no gap to explain and the
           sentence has no business pretending there is. */
        PAY_CLAUSE: c.closed
          ? (over
             ? "Retention finished at "+ret+", and because the component keeps climbing above "+
               pct0(RET_FULL)+" it paid "+money(c.retNow)+" rather than "+money(c.retFull)+"."
             : "Retention finished at "+ret+", exactly on the line, so the component paid "+
               money(c.retFull)+" in full.")
          : (over
             ? "The component pays in full at "+pct0(RET_FULL)+" and keeps climbing above it, so "+
               "that is "+money(c.retNow)+(none ? "" : " right now")+" rather than "+
               money(c.retFull)+"."
             : "That is exactly on the line, so the component pays "+
               money(c.retFull)+" in full."),
        RETENTION:ret, RET_TARGET:pct0(RET_FULL),
        RET_NOW:money(c.retNow), RET_WHOLE:money(c.retFull)};
    } },

  /* cs-s1-green was deleted. Its condition, churn within 5% of the book, is the
     same statement as "retention at or above 95%", which is the card above, so it
     could never fire. Three bands now: whole at or above the full line, amber
     between the gate and it, red below the gate. Amber across that whole band is
     right, because anywhere under 95% is money left on the table. */

  { id:"cs-s1-amber", standing:"What you are holding", tone:"warn", title:"The book is holding, just",
    titleClosed:"The book held, just",
    fires: c => c.k.atRisk>0 && c.k.churned > c.k.atRisk*(1-RET_FULL) &&
                c.k.churned <= c.k.atRisk*(1-RET_FLOOR),
    text:"{{GREEN_OPEN}} The retention component is worth {{RET_WHOLE}} in full at {{RET_TARGET}}. "+
      "{{PAY_CLAUSE}} {{PER_K_CLAUSE}}",
    tok: c => ({GREEN_OPEN:c.greenOpen, RET_TARGET:pct0(RET_FULL), RET_WHOLE:money(c.retFull),
      RET_NOW:money(c.retNow), RETENTION:pctBar(c.retIfNoMore||0), PER_K:money(c.retPerK*10),
      PAY_CLAUSE: c.closed
        ? "It paid "+money(c.retNow)+" at "+pctBar(c.retIfNoMore||0)+"."
        /* "At today's churn it WOULD pay" is a conditional about a book with
           nothing left to come up. Once it has all resolved, it pays. */
        /* Mid-quarter with the book resolved, nothing has been paid yet and the
           figure can no longer move, so it is neither "would pay" nor "pays". */
        : bookSettled(c)
        ? "With the book resolved it will pay "+money(c.retNow)+", which is "+pctBar(c.retIfNoMore||0)+"."
        : "At today's churn it would pay "+money(c.retNow)+", which is "+pctBar(c.retIfNoMore||0)+".",
      /* Per $1K the number came out at $35 to $60, too small to weigh against a
         renewal worth tens of thousands. Per $100K would be bigger than the
         churn allowance it is describing, so it would price something that
         cannot happen. $10K sits inside the budget on every preset and reads
         between $349 and $602.

         Except at the very end of the allowance. Near the gate the remaining
         budget can be smaller than the unit, and $10K then prices more churn
         than is left and more money than the component still holds: a CSM at
         88.3% with $2K of room was told $10K of churn costs $584, against the
         $129 the component was still worth. The unit drops to $1K there. */
      PER_K_CLAUSE: c.closed
        ? money(Math.max(0, c.retFull-c.retNow))+" of it went with the churn."
        : bookSettled(c)
        ? money(Math.max(0, c.retFull-c.retNow))+" of it went with the churn, and there is nothing "+
          "left to renew."
        : (()=>{ const budget = c.k.atRisk*(1-RET_FLOOR);
            const unit = (budget - c.k.churned) >= 10000 ? 10 : 1;
            return "Every further $"+unit+"K of churn costs about "+money(c.retPerK*unit)+
              " of it, and it stops paying at all once "+moneyK(budget)+" has gone."; })(),
      GATE_BUDGET:moneyK(c.k.atRisk*(1-RET_FLOOR))}) },

  { id:"cs-s1-red", standing:"What you are holding", tone:"bad",
    title:"The retention gate is out of reach",
    titleClosed:"The retention gate was missed",
    fires: c => c.k.atRisk>0 && c.k.churned > c.k.atRisk*(1-RET_FLOOR),
    text:"{{BOOK_CHURNED}} has churned of the {{BOOK_AT_RISK}} up for renewal this quarter. The "+
      "retention component pays nothing below {{RET_FLOOR}}, which allowed {{GATE_BUDGET}} of churn, "+
      "so {{GONE_TAIL}}",
    tok: c => ({BOOK_CHURNED:mk0(c.k.churned), BOOK_AT_RISK:moneyK(c.k.atRisk),
      RET_FLOOR:pct0(RET_FLOOR), GATE_BUDGET:moneyK(c.k.atRisk*(1-RET_FLOOR)),
      GONE_TAIL: c.closed
        ? "the "+money(c.retFull)+" it is worth paid nothing this quarter."
        : bookSettled(c)
        ? "the "+money(c.retFull)+" it is worth pays nothing this quarter, with the book fully resolved."
        : "the gate has gone whatever happens to the "+mk0(c.k.pending)+" still to renew. What is "+
          "left is worth holding for the book rather than for this quarter's cheque.",
      BOOK_PENDING:mk0(c.k.pending)}) },

  { id:"cs-s2-green", standing:"What you are growing", tone:"good", title:"Expansion is ahead",
    fires: c => c.k.expTarget>0 && c.k.expWon >= c.k.expTarget*c.S.pace,
    text:"You have closed {{EXP_WON}} of expansion against a {{EXP_TARGET}} target, with {{EXP_OPEN}} "+
      "still open across {{EXP_COUNT}}. That is ahead of where the quarter says you should be.",
    tok: c => ({EXP_WON:mk0(c.k.expWon), EXP_TARGET:moneyK(c.k.expTarget),
      EXP_OPEN:mk0(c.k.expOpen), EXP_COUNT:many(c.k.expCount,"account")}) },

  { id:"cs-s2-amber", standing:"What you are growing", tone:"warn",
    title:"Expansion is behind and the coverage is thin",
    titleClosed:"Expansion finished short with the coverage in front of it",
    /* It was gated !closed, so at quarter end a CSM who missed the target while
       carrying more than enough open fell through all three variants of this
       standing and finished the quarter with one card on the whole screen.
       Green needs the target met, red needs the book to have been too small to
       meet it, and the case between the two, enough in front of them and none of
       it landed, is exactly the one worth saying out loud. */
    fires: c => c.k.expTarget>0 && c.k.expWon < c.k.expTarget*(c.closed?1:c.S.pace) &&
                (c.k.expWon+c.k.expOpen) >= c.k.expTarget,
    text:"{{AMBER_BODY}}",
    tok: c => ({EXP_WON:mk0(c.k.expWon), EXP_TARGET:moneyK(c.k.expTarget),
      EXP_OPEN:mk0(c.k.expOpen), EXP_COVERAGE:x1(c.k.expCoverage),
      EXP_NEED_COVER:x1(1/Math.max(.2,c.expWinRate)),
      AMBER_BODY: c.closed
        ? "You closed "+mk0(c.k.expWon)+" of a "+moneyK(c.k.expTarget)+" expansion target, with "+
          mk0(c.k.expOpen)+" still open at quarter end. There was enough in front of you to reach it "+
          "and none of it landed inside the quarter, so this is a closing problem rather than a "+
          "sourcing one."
        : "You have closed "+mk0(c.k.expWon)+" of a "+moneyK(c.k.expTarget)+" target with "+
          mk0(c.k.expOpen)+" still open, which is "+x1(c.k.expCoverage)+" the gap. At the rate you "+
          "close expansion, a gap this size wants "+x1(1/Math.max(.2,c.expWinRate))+"."}) },

  /* Retitled and reworded. "There is not enough in front of you" reads as the
     CSM falling short, when the arithmetic says the target was set above what
     their book currently holds: in week 1, with nothing closed and every
     expansion opportunity still open, the ceiling is already under 100%. The card
     does not claim the target is unreachable, because a real CSM can source
     expansion that is not in the book yet; it says where the remainder has to
     come from, which is the finding a plan builder needs. */
  { id:"cs-s2-red", standing:"What you are growing", tone:"bad",
    title:"The target is above what the book is carrying",
    titleClosed:"The target was above what the book was carrying",
    fires: c => c.k.expTarget>0 && (c.k.expWon+c.k.expOpen) < c.k.expTarget,
    text:"{{RED_BODY}}",
    tok: c => ({EXP_WON:mk0(c.k.expWon), EXP_TARGET:moneyK(c.k.expTarget),
      EXP_OPEN:mk0(c.k.expOpen), EXP_CEILING:pct0((c.k.expWon+c.k.expOpen)/c.k.expTarget),
      /* Early there is still time for expansion to appear and close, so the card
         says where the remainder would have to come from. Late, and after the
         quarter ends, it is not coming: the ceiling is the number. */
      /* The percentage earns its place beside a real amount, where it saves the
         reader the division. Beside nothing it is restating nothing. */
      RED_BODY: c.closed
        ? "You closed "+mk0(c.k.expWon)+" of a "+moneyK(c.k.expTarget)+" expansion target"+
          (Math.round(c.k.expWon)>0
            ? ", which is "+pct0(c.k.expWon/Math.max(1,c.k.expTarget))+"." : ".")+
          (c.k.expOpen>0 ? " The "+mk0(c.k.expOpen)+" still open at quarter end did not land inside it."
           : "")
        : c.k.expOpen===0
        ? "You have a "+moneyK(c.k.expTarget)+" expansion target and there is no expansion open in "+
          "your book at all"+(c.k.expWon>0 ? ", on top of the "+mk0(c.k.expWon)+" you have closed" : "")+
          ". All of it has to come from accounts you have not started on yet."
        : "You have closed "+mk0(c.k.expWon)+" of a "+moneyK(c.k.expTarget)+" expansion target and "+
          "there is "+mk0(c.k.expOpen)+" of expansion open in your book. Even closing all of it "+
          "leaves you at "+pct0((c.k.expWon+c.k.expOpen)/c.k.expTarget)+" of target, "+
          (c.S.week>=9
          ? "and "+leftSays(c.S,"a")+" that is the "+
            "number rather than a gap to close."
          : "so the rest has to come from expansion that is not in the book yet.")}) },

  { id:"cs-s3-green", standing:"Concentration of what is left", tone:"good",
    title:"The remaining book is spread",
    fires: c => c.k.pending>0 && c.topPendingShare<0.5,
    text:"{{BOOK_PENDING}} is still to renew across {{PENDING_COUNT}}, the largest of them "+
      "{{TOP_ACCOUNT_PCT}} of the total.",
    tok: c => ({BOOK_PENDING:mk0(c.k.pending), PENDING_COUNT:many(c.k.pendingCount,"account"),
      TOP_ACCOUNT_PCT:share(c.topPendingShare)}) },

  /* Amber while the account is still in play, red from week 9. The concentration
     is a fact about how the book was signed rather than anything that has gone
     wrong, so in week 5 a red is alarm about an event that has not happened. It
     is not a helpless finding either: unlike a rank card, whether this account
     renews is the job. So it warns early with the account named, and escalates
     once the window is closing and it genuinely is the thing deciding the
     quarter. Same shape as the back-loaded card. */
  { id:"cs-s3-conc", standing:"Concentration of what is left", tone:"warn",
    title:"One account is most of what is left",
    fires: c => !c.closed && c.S.week<9 && c.k.pending>0 && c.topPendingShare>=0.5,
    text:"{{TOP_ACCOUNT_NAME}} is {{TOP_ACCOUNT}} of the {{BOOK_PENDING}} still to renew, or "+
      "{{TOP_ACCOUNT_PCT}} of it. Holding it puts you at {{RET_WITH}}. Losing it puts you at "+
      "{{RET_WITHOUT}}{{GATE_CLAUSE}}. Nothing has gone wrong yet, and that one "+
      "conversation is most of your quarter.",
    tok: c => ({TOP_ACCOUNT_NAME:c.topPending?c.topPending.account:"-",
      TOP_ACCOUNT:moneyK(c.topPending?c.topPending.acv:0), BOOK_PENDING:mk0(c.k.pending),
      TOP_ACCOUNT_PCT:share(c.topPendingShare), RET_WITH:pct0(c.retWithTop),
      RET_WITHOUT:pct0(c.retWithoutTop), RET_FLOOR:pct0(RET_FLOOR),
      /* "Losing it puts you at 89%, which is below the 88% gate" was printed
         whatever the figures said, and 89 is not below 88. The claim is now
         made from the printed numbers, and where losing the account still
         clears the gate the card says what it actually costs. */
      GATE_CLAUSE: (() => { const w = Math.round(c.retWithoutTop*100), g = Math.round(RET_FLOOR*100);
        return w < g ? ", which is below the "+pct0(RET_FLOOR)+" gate"
          : w < Math.round(RET_FULL*100)
            ? ", still above the "+pct0(RET_FLOOR)+" gate but "+(Math.round(RET_FULL*100)-w)+
              " points off the "+pct0(RET_FULL)+" target"
            : ", which still clears the "+pct0(RET_FULL)+" target"; })()}) },

  { id:"cs-s3-red", standing:"Concentration of what is left", tone:"bad",
    title:"One account is your quarter",
    titleClosed:"One account was your quarter",
    fires: c => (c.closed || c.S.week>=9) && c.k.pending>0 && c.topPendingShare>=0.5,
    text:"{{TOP_ACCOUNT_NAME}} is {{TOP_ACCOUNT}} of the {{BOOK_PENDING}} still to renew, or "+
      "{{TOP_ACCOUNT_PCT}} of it. Holding it puts you at {{RET_WITH}}. Losing it puts you at "+
      "{{RET_WITHOUT}}{{GATE_CLAUSE}}.",
    tok: c => ({TOP_ACCOUNT_NAME:c.topPending?c.topPending.account:"-",
      TOP_ACCOUNT:moneyK(c.topPending?c.topPending.acv:0), BOOK_PENDING:mk0(c.k.pending),
      TOP_ACCOUNT_PCT:share(c.topPendingShare), RET_WITH:pct0(c.retWithTop),
      RET_WITHOUT:pct0(c.retWithoutTop), RET_FLOOR:pct0(RET_FLOOR),
      /* "Losing it puts you at 89%, which is below the 88% gate" was printed
         whatever the figures said, and 89 is not below 88. The claim is now
         made from the printed numbers, and where losing the account still
         clears the gate the card says what it actually costs. */
      GATE_CLAUSE: (() => { const w = Math.round(c.retWithoutTop*100), g = Math.round(RET_FLOOR*100);
        return w < g ? ", which is below the "+pct0(RET_FLOOR)+" gate"
          : w < Math.round(RET_FULL*100)
            ? ", still above the "+pct0(RET_FLOOR)+" gate but "+(Math.round(RET_FULL*100)-w)+
              " points off the "+pct0(RET_FULL)+" target"
            : ", which still clears the "+pct0(RET_FULL)+" target"; })()}) },

  { id:"cs-s4-green", standing:"Banked against at risk", tone:"good", title:"Most of it is yours",
    titleClosed:"Most of it was yours",
    fires: c => c.csAtRiskShare<0.5 && (c.k.pending>0 || c.k.expOpen>0),
    text:"{{LEAD}} {{AT_RISK_CLAUSE}} Most of what you {{EARNED_VERB}} {{WAIT_VERB}} not waiting "+
      "on anything.",
    tok: c => ({LEAD: csLead(c), AT_RISK_CLAUSE: csRiskClause(c),
      EARNED_VERB: c.closed ? "earned" : "have earned",
      WAIT_VERB: c.closed ? "was" : "is"}) },

  { id:"cs-s4-red", standing:"Banked against at risk", tone:"bad",
    title:"Your quarter is still in front of you",
    fires: c => !c.closed && c.csAtRiskShare>=0.5,
    text:"Week {{WEEK}} and {{CS_AT_RISK_PCT}} of your commission {{DEPENDS_ON}}. {{LEAD}} {{RISK_TAIL}}",
    /* "A CS quarter often sits this way" is true in week 2 and reassurance about
       a shape that has stopped being normal by week 11. Past week 8 the same fact
       is a window problem rather than a feature of the role. */
    /* Once every renewal has resolved the retention half is settled, and what
       is left riding is expansion, so the sentence says which. */
    tok: c => ({CS_AT_RISK_PCT:pct0(c.csAtRiskShare), LEAD: csLead(c),
      DEPENDS_ON: c.csRetSettled ? "depends on expansion that has not landed"
        : "depends on how the book finishes",
      RISK_TAIL: c.S.week>=9
        ? (c.S.weeksLeft<=0 ? "In the final week of the quarter, all of it has to land now."
          : "With "+(c.S.weeksLeft===1?"a week":c.S.weeksLeft+" weeks")+" left, all of it has to land "+
            (c.S.weeksLeft===1 ? "inside it." : "inside them."))
        : "A CS quarter often sits this way, and none of the rest counts until it lands."}) },

  { id:"cs-c-netting", standing:"Conditionals", tone:"warn",
    title:"Your expansion is covering your churn",
    titleClosed:"Your expansion covered your churn",
    fires: c => c.k.churned>0 && c.k.expWon>0 && c.k.expWon >= c.k.churned*0.5,
    // Six sentences was too long for the card, and the point survives in three.
    /* "You lost $12K and grew $22K. Netted off that is 101%" left the reader to
       guess what it was 101% of: the base, the book up for renewal, was never
       printed, so two small numbers appeared to produce a percentage out of
       nowhere. */
    text:"You {{LOST_VERB}} {{BOOK_CHURNED}} and {{GREW_VERB}} {{EXP_WON}} on a {{BOOK_AT_RISK}} book up "+
      "for renewal. Netted off, that is {{NRR}} net retention, which is the version most people will "+
      "see. The growth is on accounts you keep and can grow again, the churn comes off the base you "+
      "start next quarter with.",
    tok: c => ({BOOK_CHURNED:mk0(c.k.churned), EXP_WON:mk0(c.k.expWon), BOOK_AT_RISK:mk0(c.k.atRisk),
      LOST_VERB: c.closed ? "lost" : "have lost", GREW_VERB: c.closed ? "grew" : "have grown",
      NRR:pct0((c.k.atRisk-c.k.churned+c.k.expWon)/Math.max(1,c.k.atRisk))}) },

  { id:"cs-c-backloaded", standing:"Conditionals", tone:"warn", title:"Everything renews at the end",
    /* The old rule was "every remaining renewal falls in the last three weeks",
       which can only become true once the earlier ones have resolved, so it could
       not fire before week 10 and arrived with nothing left to do about it. The
       shape is knowable in week 1 from the schedule itself: half this CSM's
       renewal value is already booked into weeks 11 to 13. */
    fires: c => !c.closed && c.backHeavy && c.k.pending>0,
    text:"{{BACK_BODY}}",
    tok: c => ({PENDING_COUNT:many(c.k.pendingCount,"account"), BOOK_PENDING:mk0(c.k.pending),
      BACK_BODY: c.S.week>=QTR_WEEKS-2
        ? many(c.backCount,"account")+" worth "+mk0(c.backValue)+
          (c.backCount===1?" renews":" renew")+" in the final three weeks, and "+
          "those weeks are now. That is how the book was signed rather than anything you did, but your "+
          "quarter is decided in a window you cannot lengthen."
        : mk0(c.backValue)+" of your "+moneyK(c.k.atRisk)+" renewal book, across "+
          many(c.backCount,"account")+", is scheduled for the last three weeks of the quarter. That is how the book was "+
          "signed rather than anything you did, but it means half your retention number lands in a "+
          "window with no room to recover in it. The only lever is starting those conversations early "+
          "enough that the dates are a formality."}) },

  { id:"cs-c-fastgrow", standing:"Conditionals", tone:"good", title:"You are growing faster than the team",
    titleClosed:"You grew faster than the team",
    /* Two decimals, because expansion rates live in tenths of a percent and one
       decimal printed "0.5% against 0.5%" while claiming one was larger. And it
       only fires on a margin that means something: a tenth again as much as the
       rest of the team, rather than any difference at all. Two rates a hundredth
       of a point apart are noise with a verdict attached. */
    /* And the two figures it prints have to differ. "$1K against a $75K target,
       which is 1%. The rest of the team averages $1K, or 1% of theirs" claimed
       a lead between two pairs of identical numbers: the margin was real at
       four decimal places and invisible on screen. */
    fires: c => c.k.expTarget>0 && c.peerExpAttain>0 &&
                (c.k.expWon/c.k.expTarget) >= c.peerExpAttain*1.10 &&
                Math.round((c.k.expWon/c.k.expTarget)*100) > Math.round(c.peerExpAttain*100) &&
                mk0(c.k.expWon) !== mk0(c.peerExpWon),
    text:"You {{GREW}} your book by {{EXP_WON}} against a {{EXP_TARGET}} expansion target, which is "+
      "{{MY_ATTAIN}}. The rest of the team {{AVERAGES}} {{PEER_MONEY}}, or {{PEER_ATTAIN}} of theirs.",
    tok: c => ({EXP_WON:mk0(c.k.expWon), EXP_TARGET:moneyK(c.k.expTarget),
      GREW: c.closed ? "grew" : "have grown", AVERAGES: c.closed ? "averaged" : "averages",
      MY_ATTAIN:pct0(c.k.expWon/Math.max(1,c.k.expTarget)),
      PEER_MONEY:mk0(c.peerExpWon), PEER_ATTAIN:pct0(c.peerExpAttain)}) },

  { id:"cs-c-aggressive", standing:"Conditionals", tone:"warn",
    title:"The expansion target is aggressive against this book",
    fires: c => c.k.expTarget>0 && (c.k.expTarget/c.k.book) > 0.10,
    text:"Reaching it needs {{EXP_RATE}} growth from a {{BOOK_SIZE}} book. That is reachable, but not "+
      "evenly across the book, so the early work is knowing which accounts still have room in them.",
    tok: c => ({EXP_RATE:pct(c.k.expTarget/c.k.book), BOOK_SIZE:moneyK(c.k.book)}) }
  ];

/* ===========================================================================
   MANAGER
   Findings name patterns. The table names people.
   =========================================================================== */
  const MGR = [
  { id:"mgr-s1-green", standing:"Is the team going to make it", tone:"good",
    /* A team already past target is not going to make it, it has made it, with
       the quarter still running. The card covers both being on pace and being
       past the line, so the title has to say which. */
    title:"{{S1_TITLE}}",
    titleClosed:"The team made it",
    /* && binds tighter than ||, so without the brackets the second clause fired
       on its own and this live card rendered at quarter close alongside
       mgr-s1-closed-good, printing "with the quarter over left". */
    /* Gated on the ceiling as well. A team can be on pace and still unable to
       reach target once everything open is counted, and this card and the red
       both fired: "the team is going to make it" above "the team is not going to
       make it". The sheet shows one card per standing, so the green won on array
       order and a team that arithmetically could not get there was told it would.
       The ceiling is the harder fact and it takes precedence.
       On pace is the rounded comparison, so this card and the amber below cannot
       disagree over a tie the reader cannot see. */
    fires: c => !c.closed && !c.shortOfCeiling && (c.t.attain>=1 || c.onPace),
    /* "Of a 250 opportunities target" is what the unit formatter produces when
        the sentence supplies its own noun. The target reads after the number
        instead, which works for money and for counts. */
    text:"{{STAND_CLAUSE}}{{RANK_CLAUSE}}{{RATE_CLAUSE}}",
    tok: c => ({S1_TITLE: c.t.attain>=1 ? "The team is already there"
                 : "The team is going to make it",
      STAND_CLAUSE:c.teamStands(), TEAM_UNIT_ACTUAL:c.unit(c.t.actual),
      TEAM_UNIT_TARGET:c.unit(c.t.target), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      // The green owes the same answer the amber gives: at this rate, where do
      // they land. Without it "going to make it" is an assertion.
      RATE_CLAUSE: (c.t.manages==="SDR" && !c.closed)
        ? " At the rate they are "+(c.p.early ? "booking them" : "creating")+" they land near "+
          num(Math.round((c.t.actual/Math.max(1,c.S.week))*QTR_WEEKS))+"."
        : "",
      RANK_CLAUSE: c.t.peerCount>=RANK_MIN
        ? " Across the "+cnt(c.t.peerCount)+" teams on this plan you are "+ord(c.t.rank)+"."
        : ""}) },

  /* The three cards below open the way the green does. Every fix the green took
     was applied to the green alone: naming the second figure as a target, giving
     attainment its own clause instead of welding it to the gap, saying how many
     weeks are left, and carrying the rank. The amber read "Your team has $0K of
     $1.20M, $1.20M short at 0%", three numbers in one breath with nothing saying
     which was the goal, and "your people have $8.00M open between them", where
     every other card in the set says "the team". Same standing, same reader, one
     sentence apart. */
  { id:"mgr-s1-amber", standing:"Is the team going to make it", tone:"warn", title:"The team is short",
    fires: c => !c.closed && !c.shortOfCeiling && c.t.attain<1 && !c.onPace,
    text:"{{STAND_CLAUSE}}{{RANK_CLAUSE}} {{GAP_CLAUSE}}",
    tok: c => ({STAND_CLAUSE:c.teamStands(), TEAM_UNIT_ACTUAL:c.unit(c.t.actual),
      TEAM_UNIT_TARGET:c.unit(c.t.target),
      GAP_CLAUSE:c.gapSays, MGR_TEAM_GAP:c.unit(c.t.gap), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      RANK_CLAUSE: c.t.peerCount>=RANK_MIN
        ? " Across the "+cnt(c.t.peerCount)+" teams on this plan you are "+ord(c.t.rank)+"."
        : ""}) },

  { id:"mgr-s1-red", standing:"Is the team going to make it", tone:"bad",
    title:"The team is not going to make it",
    fires: c => !c.closed && c.shortOfCeiling,
    text:"{{STAND_CLAUSE}}{{RANK_CLAUSE}} {{CEILING_CLAUSE}}{{COACHING_CLAUSE}}",
    /* "Closing every open deal leaves you at 98%" was printed at teams with
        nothing open at all, which is a sentence about an act nobody can perform. */
    tok: c => ({STAND_CLAUSE:c.teamStands(), TEAM_UNIT_ACTUAL:c.unit(c.t.actual),
      TEAM_UNIT_TARGET:c.unit(c.t.target),
      TEAM_OPEN:c.unit(c.t.open), TEAM_CEILING:pct0(c.t.ceiling), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      RANK_CLAUSE: c.t.peerCount>=RANK_MIN
        ? " Across the "+cnt(c.t.peerCount)+" teams on this plan you are "+ord(c.t.rank)+"."
        : "",
      CEILING_CLAUSE: c.ceilingSays,
      /* "The gap is not a coaching problem" is an AE sentence: it means the
         pipeline cannot cover the number whatever anybody does about activity.
         On a CS team the cap is churn that has already happened, which the
         clause above has just said in plain terms, so the line adds nothing but
         length and a management noun the reader did not ask for. */
      COACHING_CLAUSE: c.t.manages==="CS" ? ""
        : " The gap is not a coaching problem at this point in the quarter."}) },

  { id:"mgr-s1-closed-good", standing:"Is the team going to make it", tone:"good",
    title:"How the team finished - at or above target",
    fires: c => c.closed && c.t.attain>=1,
    text:"Your team finished at {{MGR_TEAM_ATTAIN}}, {{TEAM_UNIT_ACTUAL}} against a target of "+
      "{{TEAM_UNIT_TARGET}}.{{RANK_CLAUSE}}",
    tok: c => ({MGR_TEAM_ATTAIN:pct0(c.t.attain), TEAM_UNIT_ACTUAL:c.unit(c.t.actual),
      TEAM_UNIT_TARGET:c.unit(c.t.target),
      RANK_CLAUSE: c.t.peerCount>=RANK_MIN
        ? " Across the "+cnt(c.t.peerCount)+" teams on this plan, you finished "+ord(c.t.rank)+"."
        : ""}) },

  { id:"mgr-s1-closed-short", standing:"Is the team going to make it", tone:"warn",
    title:"How the team finished - short of target",
    fires: c => c.closed && c.t.attain<1,
    text:"Your team finished at {{MGR_TEAM_ATTAIN}}, {{TEAM_UNIT_ACTUAL}} against a target of "+
      "{{TEAM_UNIT_TARGET}}, {{MGR_TEAM_GAP}} short.{{RANK_CLAUSE}}",
    tok: c => ({MGR_TEAM_ATTAIN:pct0(c.t.attain), TEAM_UNIT_ACTUAL:c.unit(c.t.actual),
      TEAM_UNIT_TARGET:c.unit(c.t.target), MGR_TEAM_GAP:c.unit(c.t.gap),
      RANK_CLAUSE: c.t.peerCount>=RANK_MIN
        ? " Across the "+cnt(c.t.peerCount)+" teams on this plan, you finished "+ord(c.t.rank)+"."
        : ""}) },

  /* An SDR team's pipeline value is paid inside mgr-s3-three, which is a card
     about the manager's own money. Nowhere did it appear as a TEAM number the
     way the creation count does in standing 1, so a manager carried half a
     target they could not see. Two targets, one activity: the count and the
     value are the same opportunities measured twice, and the only thing that
     can separate the two percentages is the size of what was created. So the
     card names both and then names the average, which is what explains the
     distance between them rather than a second fact sitting beside the first.
     When the two land on the same rounded percentage there is no distance to
     explain and the clause comes off: a divergence asserted between two
     identical figures on the page is the display-tie class again. Same reason
     "cleared the target" is only said when the raw number and the printed one
     agree about it. CS has the same structural gap and keeps it, because a CS
     team's two halves are different activities and no single average joins
     them.

     IT IS A STANDING, NOT A CONDITIONAL, and it was built as one by mistake.
     Nothing about the quarter has to happen for it to speak: it fired on all
     42 SDR manager screens the value component exists on, every week and every
     archetype, which is the definition of a standing and the opposite of a
     conditional. It sits directly after "Is the team going to make it" because
     that standing is the team's number against its target and an SDR team has
     two targets for one activity, so the count card answers half the question
     and this answers the other half. It gets its own heading rather than
     joining that standing, because the second card under a heading renders as
     an "also" and pipeline value is the equal half, not a footnote to the
     count. That heading is used by this card alone. A second card given the
     same standing string would come back marked also and quietly demote this
     one, so proof-check asserts it renders primary on every screen it fires. */
  { id:"mgr-sp-value", standing:"What the pipeline is worth", tone:"warn",
    toneBy: c => c.closed
      ? ((c.t.expAttain||0) >= 1 ? "good" : (c.t.expAttain||0) >= MGR_TEAM_FLOOR ? "warn" : "bad")
      : ((c.t.expWon/Math.max(1,c.S.week))*QTR_WEEKS >= c.t.expTarget ? "good" : "warn"),
    title:"What the pipeline behind the count is worth",
    titleClosed:"What the pipeline behind the count was worth",
    fires: c => c.t.manages==="SDR" && c.t.expTarget>0 && c.t.actual>0,
    text:"{{VALUE_LINE}} {{AVG_LINE}}",
    tok: c => {
      const t=c.t;
      const avg = t.expWon/Math.max(1,t.actual), assumed = t.expTarget/Math.max(1,t.target);
      const vp = Math.round((t.expAttain||0)*100), cp = Math.round(t.attain*100);
      const vClear = (t.expAttain||0) >= 1, cClear = t.attain >= 1;
      const ahead = vp > cp, level = vp === cp;
      const split = c.closed && vClear!==cClear &&
                    (vp>=100)===vClear && (cp>=100)===cClear;
      const why = level
        ? ", which is the size the target assumes, so the count and the value say the same thing."
        : " where the target assumes "+moneyK(assumed)+", which is why the "+
          (split
            ? (vClear ? "value cleared the target and the count did not."
                      : "count cleared the target and the value did not.")
            : c.closed
              ? "value finished "+(ahead ? "ahead of" : "behind")+" the count."
              : "value sits "+(ahead ? "ahead of" : "behind")+" the count.");
      return {
        VALUE_LINE: "The pipeline your team "+(c.closed ? "created was" : "has created is")+
          " worth "+moneyK(t.expWon)+" against a "+moneyK(t.expTarget)+" target, which is "+
          pct0(t.expAttain||0)+", on "+num(t.actual)+" "+(c.p.sdrUnit||"accepted opportunities")+
          " against a target of "+num(t.target)+", which is "+pct0(t.attain)+".",
        AVG_LINE: "The average "+(c.p.sdrUnit1||"accepted opportunity")+
          (c.closed ? " was " : " is ")+moneyK(avg)+why};
    } },

  { id:"mgr-s2-green", standing:"How many are carrying it", tone:"good",
    title:"The number is spread across the team",
    titleClosed:"The number was spread across the team",
    fires: c => c.hasSpread && c.spreadShare>=PARTICIPATION_TARGET,
    /* The decelerator count came off this card. It contradicted the card's own
       good news, and worse, the two counts are not complements: "keeping up" is
       at or above pace and the decelerator count is below 70% OF pace, so
       everyone in between belonged to neither and the sentence read as though a
       rep had gone missing. mgr-c-decel owns that count and states it whole. */
    /* The pace was on the other three variants and not on this one, and this is
       the card that makes the strongest claim about it: "keeping up with the
       quarter" is a statement about the pace with the pace left out. It opens the
       way its siblings do now, which also lets the spread clause drop "with the
       quarter", since the number in front of it says which quarter. */
    /* The only standing 2 variant without a rep-table pointer, which left every
       screen whose spread is healthy with nowhere to send the reader for the
       individual numbers: fifteen of them across all three kinds of manager, and
       worse at the close once standing 1 stopped carrying one. A green needs a
       different sentence from its siblings rather than the same one: there is no
       week to spend on anybody, so it points at the detail rather than at a
       problem. */
    /* "Nothing about this quarter depends on one person" is a forecast risk,
       and at the close there is nothing left to depend on anybody: the quarter
       already happened. Past tense it is a fact about how the number was made,
       which is the thing worth keeping. */
    text:"{{STAND_CLAUSE}} and {{SPREAD_CLAUSE}}. {{SPREAD_THESIS}} {{TABLE_CLAUSE}}",
    tok: c => ({AT_QUOTA_TEAM:cnt(c.t.atQuota), TEAM_SIZE:cnt(c.t.size),
      BELOW_GATE_TEAM:cnt(c.t.belowGate), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      STAND_CLAUSE: c.closed
        ? c.paceSays(true, false) : c.paceSays(false, false),
      SPREAD_CLAUSE: c.spreadSays(c.closed ? "finished at target" : "are keeping up"),
      /* "The record of who" is the siblings' line and it contradicts this one:
         the sentence before it has just said nothing depends on one person, so
         there is no who to be the record of. A green points at the detail in
         both states. */
      SPREAD_THESIS: c.closed ? "The number was not made by one person."
                              : "Nothing about this quarter depends on one person.",
      TABLE_CLAUSE: "The rep table has the numbers rep by rep.",
      DECEL_CLAUSE: ""}) },

  { id:"mgr-s2-amber", standing:"How many are carrying it", tone:"warn",
    title:"The total is healthier than the team",
    titleClosed:"The total was healthier than the team",
    fires: c => c.hasSpread && c.onPace && c.spreadShare >= 0.5 &&
                c.spreadShare < PARTICIPATION_TARGET,
    /* Two things were missing. The pace, without which "healthier than the team"
       reads as nonsense at 20% attainment: at week 3 the pace IS 20%, so the
       total is exactly where it should be and half the team is not, which is the
       card's whole point. And a reference for the concentration figure, which
       printed on all 64 screens this fires on while on 36 of them the top
       quarter of the team produced under 1.5x an even split. 48% from two of
       eight means nothing without the 25% an even split would give. */
    /* It implied an action and pointed nowhere, which is the one thing the
       Manager set is not allowed to do: findings name patterns, the table names
       people. Red and behind both end on the table. This fires on 35 screens and
       on 23 of them nothing else on screen named the table either, so the
       manager was told half the team is not keeping up and left to find them. */
    text:"{{STAND_CLAUSE}} and {{SPREAD_CLAUSE}}. {{CONC_CLAUSE}}{{THESIS}}{{TABLE_CLAUSE}}",
    tok: c => ({MGR_TEAM_ATTAIN:pct0(c.t.attain), AT_QUOTA_TEAM:cnt(c.t.atQuota),
      // Was empty at the close, which is where the other three variants say "the
      // rep table is the record of who". A quarter that is over still has a
      // record, and dropping the pointer here left CS and AE screens with none.
      TABLE_CLAUSE: c.closed ? " The rep table is the record of who."
                             : " The rep table says which of them to spend the week on.",
      SPREAD_CLAUSE: c.spreadSays(c.closed ? "finished at target" : "are keeping up"),
      TEAM_SIZE:cnt(c.t.size), TOP_CONTRIB_SHARE:share(c.topContribShare),
      TOP_CONTRIB_N:cnt(c.topContribN),
      STAND_CLAUSE: c.closed
        ? c.paceSays(true, false) : c.paceSays(false, false),
      THESIS: c.closed ? "The number landed and the team did not."
                       : "The number is where it should be and the team is not.",
      CONC_CLAUSE: (()=>{ const even=c.topContribN/Math.max(1,c.t.size);
        if (!even || c.topContribShare < even*1.5) return "";
        return share(c.topContribShare)+" of it came from "+cnt(c.topContribN)+" of them, where an "+
               "even split would be "+pct0(even)+". "; })()}) },

  { id:"mgr-s2-red", standing:"How many are carrying it", tone:"bad",
    title:"The team total is hiding most of the team",
    titleClosed:"The team total hid most of the team",
    /* The title claims concealment, so the card has to fire where concealment is
       happening: the total at or above pace, and most of the team not making it.
       On the old condition it fired on 230 screens and the claim was true on 46
       of them. The commonest case it was wrong about, 135 screens, is a team
       whose total is behind as well, where nothing is hidden and the total is
       telling the truth. That case has its own card now.
       "Most of the team" also means fewer than half are keeping up, not fewer
       than the 60% the pay component wants. That threshold was borrowed from a
       component for a judgement it was never written to make. */
    fires: c => c.hasSpread && c.onPace && c.spreadShare < 0.5,
    /* Two things this used to claim and could not support. "And this one is"
        needs a total worth hiding: in week 1 at 9% nothing is concealed, so the
        sentence only prints once the team is at or above the quarter's pace.
        And the rep table does not sort by who is closest to the line. It sorts
        on the size of the step at each rep's nearest threshold, per deal it
        takes to get there, filtered to who has the pipeline to do it. */
    /* The decelerator count came off this card too. It is a money fact and
       mgr-c-decel states it whole, with the cost and the names; repeating it
       here as a sub-clause created a three-state puzzle nobody asked for. A
       reader assumes two states, keeping up or not, and the middle group,
       behind pace but still on a path that clears the line, was invisible
       either way. Standing 2 says how many are keeping up and stops. */
    text:"{{STAND_CLAUSE}} and {{SPREAD_CLAUSE}}.{{HIDING_CLAUSE}} {{TABLE_CLAUSE}}",
    tok: c => ({STAND_CLAUSE: c.paceSays(c.closed, false),
      MGR_TEAM_ATTAIN:pct0(c.t.attain), AT_QUOTA_TEAM:cnt(c.t.atQuota),
      TEAM_SIZE:cnt(c.t.size), PACE:pct0(c.S.pace),
      /* The decelerator is on the AE commission schedule and nowhere else. An
          SDR manager was being told that every deal their SDRs close pays the
          reduced rate: a line their plan does not have, about deals they do not
          close. Same for a CS manager. */
      /* "with the quarter" went with the pace number now standing in front of
          it, so all four variants read the same way. */
      SPREAD_CLAUSE: c.spreadSays(c.closed ? "finished at target" : "are keeping up"),
      TABLE_CLAUSE: c.closed
        ? "The rep table is the record of who."
        : "The rep table says which of them to spend the week on.",
      /* Two conditions, and the early one matters most. Before week five nobody
          has had a quarter yet, so "most of the people in it are having their
          worst quarter" is not a thing anyone can know: at 9% in week 1 the card
          was asserting it about eight people on four days of evidence. */
      HIDING_CLAUSE: (c.S.week>=5 && c.onPace)
        ? " A team can post a good number while most of the people in it are having their worst "+
          "quarter, and this one is."
        : ""}) },

  /* Standing 3 is banded on what each component PAYS, not on 100% team
     attainment. The attainment component starts paying at the 70% floor, so a
     team at 85% was being told neither half was paying while the card beside it
     showed the money. It also had no variant for the team that misses on
     attainment and still clears reps at quota, which is the one case where the
     plan pays a manager for the shape of the team rather than the total. */
  /* Standing 3 owns the mechanism: which component paid, against which bar, and
     how far the other one was. It no longer prints the money, because standing 4
     exists to do that and both cards used to end on the same sentence. It does
     not point at the rep table either: standing 2 sits on the same screen and
     already does, and the moment this card names who to work on it is doing
     standing 2's job.

     Both halves report their distance in the unit that half is measured in,
     dollars for attainment and people for reps at quota. At close the distance
     becomes the counterfactual rather than sitting beside it, so neither half
     says the same thing twice. */
  { id:"mgr-s2-behind", standing:"How many are carrying it", tone:"warn",
    title:"The total is behind and so is the team",
    titleClosed:"The total finished behind and so did the team",
    /* The biggest band in this standing and it had no card. A team at 34%
       against a 42% pace with three of eight keeping up is not concealing
       anything: the total is behind, the spread is behind with it, and the
       number is an honest report of a struggling team. It used to be handed the
       concealment card, which accused it of a cover-up. */
    fires: c => c.hasSpread && !c.onPace && c.spreadShare < PARTICIPATION_TARGET,
    /* "The total is not flattering anybody here, it is behind and the spread is
       behind with it" is a present-tense reading of a quarter that is over. */
    text:"{{STAND_CLAUSE}} and {{SPREAD_CLAUSE}}. {{BEHIND_THESIS}} {{TABLE_CLAUSE}}",
    tok: c => ({MGR_TEAM_ATTAIN:pct0(c.t.attain), PACE:pct0(c.S.pace),
      BEHIND_THESIS: c.closed
        ? "The total flattered nobody here: it finished short and the team finished short with it."
        : "The total is not flattering anybody here, it is behind and the spread is behind with it.",
      /* "Against a 100% pace" is how pace reads once the quarter is over, which
          is a sentence about a clock that has stopped. At close it is target. */
      STAND_CLAUSE: c.closed
        ? c.paceSays(true, true) : c.paceSays(false, false),
      SPREAD_CLAUSE: c.spreadSays(c.closed ? "finished at target" : "are keeping up"),
      TABLE_CLAUSE: c.closed
        ? "The rep table is the record of who."
        : "The rep table says which of them to spend the week on."}) },

  /* A CS MANAGER'S PLAN HAS THREE COMPONENTS, not two, so the four cards below
     cannot describe it: their titles count halves. This one reports all three
     and takes its colour from how many are paying, which is the toneBy pattern
     mgr-s4-part already uses. The four below are gated off CS rather than
     rewritten, because AE and SDR managers genuinely do have two halves and
     their copy is read and settled. */
  { id:"mgr-s3-three", standing:"What your own plan is paying you for", tone:"warn",
    toneBy: c => { const n = (c.mgrFromAttain>0?1:0)+(c.mgrFromExp>0?1:0)+(c.mgrFromPart>0?1:0);
                   return n===3 ? "good" : n===0 ? "bad" : "warn"; },
    title:"What your plan is paying you for",
    titleClosed:"What your plan paid you for",
    fires: c => c.hasExp && c.hasPart,
    text:"{{ALL_OR_PARTS}}",
    tok: c => {
      const was = c.closed ? "paid" : "pays", is = c.closed ? "finished at" : "is";
      const nil = c.closed ? "paid nothing" : "pays nothing";
      const n=(c.mgrFromAttain>0?1:0)+(c.mgrFromExp>0?1:0)+(c.mgrFromPart>0?1:0);
      const t={
      RETENTION_PART: c.attainSubject+" "+is+" "+pctVs(c.t.attain,c.teamFloor)+", "+
        (c.t.attain>=c.teamFloor
          ? "above the "+pct0(c.teamFloor)+" your "+c.componentName+" component starts paying at, so that part "+was+"."
          : c.unit(c.attainGap)+" short of the "+pct0(c.teamFloor)+" it starts paying at, so that part "+nil+"."),
      EXPANSION_PART: c.thirdName+" "+is+" "+pctVs(c.t.expAttain||0,MGR_TEAM_FLOOR)+" of the team's "+
        (c.t.manages==="SDR"?moneyK(c.t.expTarget):moneyK(c.t.expTarget))+" target"+
        ((c.t.expAttain||0)>=MGR_TEAM_FLOOR
          ? ", above the "+pct0(MGR_TEAM_FLOOR)+" its own component starts at, so that part "+was+"."
          : ", under the "+pct0(MGR_TEAM_FLOOR)+" its own component starts at, so that part "+nil+"."),
      PARTICIPATION_PART: (c.t.atQuota===0 ? "None of your "+many(c.t.size,c.people)
                            : cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people))+
        (c.closed ? " finished " : (c.t.atQuota===1 ? " is " : " are "))+c.atBar+
        " on both halves of their own plan, and "+
        (c.t.participation>=PARTICIPATION_TARGET
          ? "that clears the "+pct0(PARTICIPATION_TARGET)+" the "+c.partComponent+" component needs, so that part "+was+"."
          : (c.t.toGate===1?"one":cnt(c.t.toGate))+(c.t.atQuota===0?"":" more")+
            (c.closed ? " would have cleared the " : " would clear the ")+
            pct0(PARTICIPATION_TARGET)+" it need"+(c.closed?"ed":"s")+", so that part "+nil+".")};
      /* Three parts, three identical tails. "So that part pays" three times in
         one card is the sentence stopping to repeat its own verdict, and the
         nothing-pays version was worse. When all three agree the verdict is said
         once at the front and each part keeps only its own number; when they
         disagree the tails earn their place, because that is the only way to see
         which part is which. */
      const strip = v => v.replace(/, so that part (pays|paid)( nothing)?\./, ".")
                          .replace(/, (above|under) the \d+% its own component starts at\./, ".");
      const lead = n===3 ? (c.closed ? "All three parts of your plan paid. "
                                     : "All three parts of your plan are paying. ")
                 : (c.closed ? "No part of your plan paid. "
                             : "No part of your plan is paying yet. ");
      return Object.assign({}, t, {ALL_OR_PARTS: (n===3||n===0)
        ? lead+strip(t.RETENTION_PART)+" "+strip(t.EXPANSION_PART)+" "+strip(t.PARTICIPATION_PART)
        : t.RETENTION_PART+" "+t.EXPANSION_PART+" "+t.PARTICIPATION_PART});
    } },

  { id:"mgr-s3-green", standing:"What your own plan is paying you for", tone:"good",
    title:"Both halves of your plan are paying",
    titleClosed:"Both halves of your plan paid",
    fires: c => c.hasPart && !c.hasExp && c.t.attain>=c.teamFloor && c.t.participation>=PARTICIPATION_TARGET,
    text:"{{ATTAIN_HALF}} {{QUOTA_HALF}}",
    tok: c => ({TEAM_FLOOR:pct0(c.teamFloor), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      AT_QUOTA_TEAM:cnt(c.t.atQuota), TEAM_SIZE:cnt(c.t.size),
      ATTAIN_HALF: c.closed
        ? c.attainSubject+" finished at "+pctVs(c.t.attain,c.teamFloor)+", above the "+pct0(c.teamFloor)+
          " your "+c.componentName+" component starts paying at, so that half paid."
        : c.attainSubject+" is "+pctVs(c.t.attain,c.teamFloor)+", above the "+pct0(c.teamFloor)+
          " your "+c.componentName+" component starts paying at, so that half pays.",
      QUOTA_HALF: c.closed
        ? cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people)+" finished "+c.atBar+", clearing the "+
          pct0(PARTICIPATION_TARGET)+" the "+c.partComponent+" component needed, so that half paid too."
        : cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people)+" are "+c.atBar+", clearing the "+
          pct0(PARTICIPATION_TARGET)+" the "+c.partComponent+" component needs, so that half pays too."}) },

  { id:"mgr-s3-amber", standing:"What your own plan is paying you for", tone:"warn",
    title:"Half your plan is paying",
    titleClosed:"Half your plan paid",
    fires: c => c.hasPart && !c.hasExp && c.t.attain>=c.teamFloor && c.t.participation<PARTICIPATION_TARGET,
    text:"{{ATTAIN_HALF}} {{QUOTA_HALF}} {{CARRY_LINE}}",
    tok: c => ({TEAM_FLOOR:pct0(c.teamFloor), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      PARTICIPATION_ACTUAL:pct0(c.t.participation), TO_GATE_N:cnt(c.t.toGate),
      ATTAIN_HALF: c.closed
        ? c.attainSubject+" finished at "+pctVs(c.t.attain,c.teamFloor)+", above the "+pct0(c.teamFloor)+
          " your "+c.componentName+" component starts paying at, so that half paid."
        : c.attainSubject+" is "+pctVs(c.t.attain,c.teamFloor)+", above the "+pct0(c.teamFloor)+
          " your "+c.componentName+" component starts paying at, so that half pays.",
      QUOTA_HALF: c.closed
        ? (c.t.atQuota===0 ? "None of your "+many(c.t.size,c.people)
                           : cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people))+
          " finished "+c.atBar+", and "+
          (()=>{ const more = c.t.atQuota===0 ? "" : " more";
                 return c.t.toGate===1 ? "one"+more : cnt(c.t.toGate)+more; })()+
          " would have cleared the "+pct0(PARTICIPATION_TARGET)+" it needed, so that half paid nothing."
        /* Was "Reps at quota is 13%, four reps short of the 60% it needs". The
            percentage is what the component is measured on, but it was the only
            one of the four standing 3 variants leading with it while green,
            shape and red all lead with a count. On screen that put "six of
            eight are keeping up" one card above a bare "13%" with nothing
            connecting them, and 13% of eight is one. Counts here, percentages
            in the attainment half, which is where the number is a percentage
            in its own right. */
        /* The noun agrees with the TEAM (eight reps), the verb with the COUNT
            (one is). Tying both to the same number gives "one of your eight rep
            is at quota", which is how the first version of this read. */
        : (c.t.atQuota===0 ? "None of your "+many(c.t.size,c.people)+" are"
                           : cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people)+
                             (c.t.atQuota===1 ? " is" : " are"))+
          /* The one clause in the set with the bar typed in: an SDR or a CSM is
             "at target", and every other card that counts them says so. */
          " "+c.atBar+", "+(c.t.toGate===1 ? "one" : cnt(c.t.toGate))+
          " short of the "+pct0(PARTICIPATION_TARGET)+" it needs, so that half does not.",
      CARRY_LINE: c.closed
        ? "You were paid for the total and not for the team, which is the exact split this plan was "+
          "built to prevent."
        : "You are being paid for the total and not for the team, which is the exact split this plan "+
          "was built to prevent."}) },

  { id:"mgr-s3-shape", standing:"What your own plan is paying you for", tone:"warn",
    title:"The team is paying you and the total is not",
    titleClosed:"The team paid you and the total did not",
    fires: c => c.hasPart && !c.hasExp && c.t.attain<c.teamFloor && c.t.participation>=PARTICIPATION_TARGET,
    text:"{{QUOTA_HALF}} {{ATTAIN_HALF}}",
    tok: c => ({TEAM_FLOOR:pct0(c.teamFloor), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      AT_QUOTA_TEAM:cnt(c.t.atQuota), TEAM_SIZE:cnt(c.t.size),
      QUOTA_HALF: c.closed
        ? cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people)+" finished "+c.atBar+", clearing the "+
          pct0(PARTICIPATION_TARGET)+" the "+c.partComponent+" component needed, so that half paid."
        : cnt(c.t.atQuota)+" of your "+many(c.t.size,c.people)+" are "+c.atBar+", clearing the "+
          pct0(PARTICIPATION_TARGET)+" the "+c.partComponent+" component needs, so that half pays.",
      ATTAIN_HALF: c.closed
        ? c.attainSubject+" finished at "+pctVs(c.t.attain,c.teamFloor)+", and another "+c.unit(c.attainGap)+
          " would have reached the "+pct0(c.teamFloor)+" the "+c.componentName+" component starts at, so "+
          "that half paid nothing."
        : c.attainSubject+" is "+pctVs(c.t.attain,c.teamFloor)+", "+c.unit(c.attainGap)+" short of the "+
          pct0(c.teamFloor)+" the "+c.componentName+" component starts at, so that half does not."}) },

  { id:"mgr-s3-red", standing:"What your own plan is paying you for", tone:"bad",
    title:"Neither half is paying",
    titleClosed:"Neither half paid",
    fires: c => c.hasPart && !c.hasExp && c.t.attain<c.teamFloor && c.t.participation<PARTICIPATION_TARGET,
    text:"{{ATTAIN_HALF}} {{QUOTA_HALF}}",
    tok: c => ({TEAM_FLOOR:pct0(c.teamFloor), MGR_TEAM_ATTAIN:pct0(c.t.attain),
      PARTICIPATION_ACTUAL:pct0(c.t.participation), TEAM_SIZE:cnt(c.t.size),
      ATTAIN_HALF: c.closed
        ? c.attainSubject+" finished at "+pctVs(c.t.attain,c.teamFloor)+", and another "+c.unit(c.attainGap)+
          " would have reached the "+pct0(c.teamFloor)+" your "+c.componentName+" component starts paying "+
          "at, so that half paid nothing."
        : c.attainSubject+" is "+pctVs(c.t.attain,c.teamFloor)+", "+c.unit(c.attainGap)+" short of the "+
          pct0(c.teamFloor)+" your "+c.componentName+" component starts paying at, so that half pays "+
          "nothing.",
      QUOTA_HALF: (()=>{ const none = c.t.atQuota===0, n = c.t.toGate;
        /* "None of your eight are at quota" ends on a bare number and reads
            empty. The noun is the team's own, so a CS manager gets CSMs. */
        const who = none ? "None of your "+cnt(c.t.size)+" "+c.people+"s"
                         : cnt(c.t.atQuota)+" of your "+cnt(c.t.size)+" "+c.people+"s";
        const one  = c.t.atQuota===1;
        const verb = c.closed ? " finished "+c.atBar+", and "
                              : (one ? " is "+c.atBar+", and " : " are "+c.atBar+", and ");
        /* "More" than none is not a thing. With nobody at quota the count is not
            an increment on anything, so the word goes: "it takes five to clear"
            rather than "five more". Above zero "more" is right and stays. */
        const more = none ? "" : " more";
        const need = c.closed
          ? (n===1 ? "one"+more+" would have cleared" : cnt(n)+more+" would have cleared")
          : "it takes "+(n===1 ? "one"+more : cnt(n)+more)+" to clear";
        return who+verb+need+" the "+pct0(PARTICIPATION_TARGET)+" the other component "+
          (c.closed?"needed":"needs")+", so that half "+(c.closed?"paid":"pays")+" nothing either."; })()}) },

  /* Tone follows the money rather than sitting on good forever. It was green at
     51% with nothing earned, directly under a red saying neither half was
     paying. Same bands as standing 3, so the two agree instead of arguing. */
  /* Named for the component it reports, not for a colour. It was mgr-s4-green,
     which was wrong on 92% of the screens it appears on: toneBy makes the colour
     follow what the two halves are actually paying, and across the presets it
     renders amber 157 times, red 152 and green 27. A tone word in an id is only
     safe on a card whose tone is fixed. The pair is now mgr-s4-part and
     mgr-s4-own, matching the hasPart and hasOwn that choose between them. */
  { id:"mgr-s4-part", standing:"What this pays you", tone:"good",
    toneBy: c => (c.mgrFromAttain>0 && c.mgrFromPart>0) ? "good"
               : (c.mgrFromAttain>0 || c.mgrFromPart>0) ? "warn" : "bad",
    title:"Where your money comes from",
    titleClosed:"Where your money came from",
    fires: c => c.hasPart,
    /* It used to end on "base sits on top of both", which reassures nobody and
        names no number, and it never said how the target divided. The split is
        the thing a manager cannot work out for themselves. */
    text:"Your {{MGR_VARIABLE_TARGET}} variable target splits in {{SPLIT_N}}. {{EARNED_CLAUSE}}",
    tok: c => ({SPLIT_N: c.hasExp ? "three" : "two", MGR_EARNED:money(c.mgrEarned), MGR_VARIABLE_TARGET:money(c.mgrTarget),
      MGR_FROM_ATTAIN:money(c.mgrFromAttain), MGR_FROM_PARTICIPATION:money(c.mgrFromPart),
      MGR_TEAM_VALUE:money(c.teamValue), MGR_PART_VALUE:money(c.partValue),
      /* The component and what it has paid used to sit in separate sentences,
          so $10,920 worth and $10,829 earned read as the same number typed
          twice. Each component is now named with its own figure beside it. */
      /* Present tense, not present perfect. These are not running totals: each
          figure is what the component pays at today's team attainment, so "has
          paid" both read clunky and described the wrong thing. The SDR cards
          keep the perfect tense because theirs IS cumulative, and they say "so
          far" to earn it. Standing 3 next door already says "so that half
          pays", so this matches the persona it sits in. */
      EARNED_CLAUSE: (()=>{
        const carries = c.closed ? " carried " : " carries ";
        const pay = (v) => (c.closed ? " paid " : " is paying ")+
          (v>0 ? money(v) : (c.closed ? "nothing" : "nothing yet"));
        if (c.hasExp)
          return c.teamLabel+carries+money(c.teamValue)+" of it and"+pay(c.mgrFromAttain)+
            ". "+c.thirdName+carries+money(c.expValue)+" and"+pay(c.mgrFromExp)+
            ". "+c.partLabel+carries+money(c.partValue)+" and"+pay(c.mgrFromPart)+".";
        if ((c.mgrFromAttain+c.mgrFromPart) <= 0)
          return c.teamLabel+carries+money(c.teamValue)+" of it and "+
            c.partSentence+" "+
            money(c.partValue)+", and neither"+(c.closed ? " paid anything." : " is paying anything yet.");
        return c.teamLabel+carries+money(c.teamValue)+" of it and"+pay(c.mgrFromAttain)+
          ". "+c.partLabel+carries+money(c.partValue)+" and"+pay(c.mgrFromPart)+".";})()}) },

  { id:"mgr-s4-own", standing:"What this pays you", tone:"good",
    toneBy: c => (c.mgrFromAttain>0 && c.mgrFromOwn>0) ? "good"
               : (c.mgrFromAttain>0 || c.mgrFromOwn>0) ? "warn" : "bad",
    title:"Where your money comes from",
    titleClosed:"Where your money came from",
    fires: c => c.hasOwn,
    text:"Your {{MGR_VARIABLE_TARGET}} variable target splits in two. {{EARNED_CLAUSE}}",
    tok: c => ({MGR_EARNED:money(c.mgrEarned), MGR_VARIABLE_TARGET:money(c.mgrTarget),
      MGR_FROM_ATTAIN:money(c.mgrFromAttain), MGR_FROM_OWN:money(c.mgrFromOwn),
      MGR_TEAM_VALUE:money(c.teamValue), MGR_OWN_VALUE:money(c.ownValue),
      EARNED_CLAUSE: (()=>{
        const carries = c.closed ? " carried " : " carries ";
        const pay = (v) => (c.closed ? " paid " : " is paying ")+
          (v>0 ? money(v) : (c.closed ? "nothing" : "nothing yet"));
        if ((c.mgrFromAttain+c.mgrFromOwn) <= 0)
          return "Team attainment"+carries+money(c.teamValue)+" of it and your own quota "+
            money(c.ownValue)+", and neither"+(c.closed ? " paid anything." : " is paying anything yet.");
        return "Team attainment"+carries+money(c.teamValue)+" of it and"+pay(c.mgrFromAttain)+
          ". Your own quota"+carries+money(c.ownValue)+" and"+pay(c.mgrFromOwn)+".";})()}) },

  /* THE HOLDBACK REACHED THE REP AND NOT THEIR MANAGER. On #early, the one
     preset answering CLAW_HOLDBACK, an AE is told that 80% is paid and the last
     fifth lands 90 days after close and only if the account stays, while their
     manager on the same plan, paid on exactly that revenue, is told their money
     is simply paid. The manager carries what their team carries, which is the
     same rule expansion follows on a CS manager and pipeline value on an SDR
     manager, so it is the third time it has been applied rather than a new idea.

     Scoped to the team-attainment component and to managers OF AEs, because
     that component is commission on the revenue the holdback bites and nothing
     else on a manager's plan is. The participation component is a gate on how
     many people cleared quota, not a share of revenue, so it is paid outright
     and the card leaves it alone. An SDR manager's creation number and a CS
     manager's retention are not new-logo revenue either. A SELLING manager's
     own commission is already covered without this card: their own block runs
     the AE set against their own number, so ae-s4-green and ae-s4-amber speak
     there exactly as they do for a rep.

     The 80/20 lives here rather than in the ledger for the same reason it does
     on the AE cards: the engine pays the component in full and the split is a
     statement about when that money arrives, not about how much was earned. */
  { id:"mgr-s5-hold", standing:"Banked against at risk", tone:"good",
    toneBy: c => c.mgrFromAttain>0 ? "good" : "warn",
    title:"Banked against at risk",
    fires: c => c.hold && c.t.manages==="AE",
    text:"{{HOLD_BODY}}",
    tok: c => {
      const h = hold82(c.mgrFromAttain), earned = c.mgrFromAttain;
      const lead = "Your team component is commission on the same revenue the plan holds 20% of "+
                   "back, so it "+(c.closed ? "reached you the same way it reached them. "
                                            : "reaches you the same way it reaches them. ");
      return {MGR_FROM_ATTAIN:money(h.total), MGR_HELD:money(h.held), MGR_PAID:money(h.paid),
        HOLD_BODY: earned>0
          ? lead+"Of the "+money(h.total)+" team attainment "+(c.closed ? "paid" : "is paying")+
            " you, "+money(h.paid)+" is paid and "+money(h.held)+
            " lands 90 days after each deal closes, and only if those accounts stay."
          /* Explaining the holdback on a component that paid nothing read as a
             riddle. With nothing paid the sentence says that first. */
          : c.closed
              ? "Your team component paid nothing this quarter, so none of it is held back."
              : "Your team component is paying nothing yet. When it does, the plan holds back a fifth "+
                "of it, the same 20% it holds from the team, until 90 days after each deal closes and "+
                "only if those accounts stay."};
    } },

  { id:"mgr-c-weakest", standing:"Conditionals", tone:"warn",
    title:"Your team is the weakest of the {{TEAM_COUNT}}",
    titleClosed:"Your team was the weakest of the {{TEAM_COUNT}}",
    fires: c => c.late && c.t.peerCount>1 && c.t.rank===c.t.peerCount && c.t.spread>0.10,
    /* The opening stayed present tense at the close while the last line had
       already switched, so one card carried both tenses. */
    text:"{{STAND_LINE}} Same plan, same quota, same product, same quarter. {{GAP_LINE}}",
    tok: c => ({MGR_TEAM_ATTAIN:p1(c.t.attain), TOP_TEAM:p1(c.t.top.attain),
      TEAM_SPREAD_PTS:gapPts(c.t.top.attain, c.t.attain),
      STAND_LINE: "Your team "+(c.closed ? "finished at " : "is at ")+
        p1(c.t.attain)+" against "+p1(c.t.top.attain)+
        " for the strongest team, "+gapPts(c.t.top.attain, c.t.attain)+" apart.",
      GAP_LINE: c.closed
        ? "Whatever explained that gap was territory, hiring or coaching, and none of the three was "+
          "fixed by how people were paid."
        : "Whatever explains that gap is territory, hiring or coaching, and none of the three is "+
          "fixed by how people are paid."}) },

  { id:"mgr-c-strongest", standing:"Conditionals", tone:"good",
    title:"Your team is the strongest of the {{TEAM_COUNT}}",
    titleClosed:"Your team was the strongest of the {{TEAM_COUNT}}",
    /* Not when the reader cannot see the lead. "At 70.2%, ahead of the next at
       70.2%" crowned a strongest team over a difference that does not exist on
       the page, on #large and #miss CS. */
    fires: c => c.late && c.t.peerCount>1 && c.t.rank===1 && !samePct(c.t.attain, c.second),
    /* Two faults, one sentence. It read "at 96%, ahead of the next at 96%", the
       display-tie class, because both figures rounded to the same number; and it
       claimed a gap that has to be explained when the lead was a tenth of a
       point. mgr-c-weakest already refuses to speak under a ten-point spread and
       this had no such guard at all. Under two points the teams are level and
       the card says so; at or above it the gap is real and worth explaining.
       And the whole thing spoke in the present tense at the close, one line
       under a title that had already switched to "was the strongest". */
    text:"{{STAND_LINE}} {{SAME_PLAN}} {{GAP_LINE}}",
    tok: c => ({MGR_TEAM_ATTAIN:pctVs(c.t.attain, c.second), SECOND_TEAM:pctVs(c.second, c.t.attain),
      STAND_LINE: "Your team "+(c.closed ? "finished at " : "is at ")+pctVs(c.t.attain, c.second)+
        ", ahead of the next at "+pctVs(c.second, c.t.attain)+".",
      SAME_PLAN: c.closed ? "Every team was on the same plan and the same quota,"
                          : "Every team here is on the same plan and the same quota,",
      GAP_LINE: (c.t.attain - c.second) < 0.02
        ? (c.closed ? "and there was next to nothing between the top two."
                    : "and there is next to nothing between the top two.")
        : (c.closed ? "so the gap came from something other than how people were paid."
                    : "so the gap is coming from something other than how people are paid.")}) },

  /* Mid-quarter, and the reason they are allowed to speak when the rep's cannot:
     a manager can move the team number, so the useful question is not whether the
     kicker will happen but whether it still CAN. That is arithmetic, the same
     bounding the coverage findings use, and it never predicts. When the answer is
     no, it is the most actionable thing on the screen: stop pointing the team at
     money that is already gone. */
  { id:"mgr-c-kicklive", standing:"Conditionals", tone:"good",
    title:"The kicker is still on the table",
    fires: c => c.S.week>=9 && !c.closed && c.p.hasKicker && c.t.manages==="AE" && !c.t.kicker &&
                c.kickNeed>0 && c.kickCover>=1,
    /* It used to end on what the kicker is worth today, which is 5% of the
        commission of whoever is above the decelerator line right now. On a team
        that has not got going that is nobody, so a card whose whole point is
        that the prize is still reachable priced the prize at $0. On one team it
        read $0, $488, $1,380, $2,720, $4,828 across weeks 9 to 13 with nobody
        doing anything differently, purely as eligibility caught up.

        Pricing it at the finish needs an assumption about how the team's number
        distributes across its people, which this project does not make. The
        rate and one rep at quota are both exact and neither is a forecast. */
    text:"The kicker needs {{KICK_NEED}} more than the team has closed, and they have {{TEAM_OPEN}} "+
      "open between them, which covers it {{KICK_COVER}} times over {{CLOSE_RATE_SAYS}}. "+
      "It adds {{KICK_PCT}} to the commission of every rep who finishes at or above {{DECEL_THR}}, "+
      "which is {{KICK_AT_QUOTA}} to a rep at quota.",
    tok: c => ({CLOSE_RATE_SAYS:c.closeRateSays, KICK_NEED:moneyK(c.kickNeed), TEAM_OPEN:moneyK(c.t.open),
      KICK_COVER:per(c.kickCover), KICK_PCT:pct0(KICK_PCT),
      DECEL_THR:pct0(c.p.decel.thr||0),
      KICK_AT_QUOTA:money(commAt(c.p,1)/4*KICK_PCT)}) },

  { id:"mgr-c-kickgone", standing:"Conditionals", tone:"warn",
    title:"The kicker needs a better finish than usual",
    fires: c => c.S.week>=5 && !c.closed && c.p.hasKicker && c.t.manages==="AE" && !c.t.kicker &&
                c.kickNeed>0 && c.kickCover<1,
    text:"The kicker needs {{KICK_NEED}} more than the team has closed. They have {{TEAM_OPEN}} open, "+
      "which at the rate this team closes is worth about {{KICK_EXPECTED}}. Clearing it means landing "+
      "{{KICK_SHARE}} of what is open against the {{TEAM_WIN}} they usually close, "+
      "{{WITH_LEFT}}. Still possible, and worth deciding whether to point people at it or at something else.",
    tok: c => ({KICK_NEED:moneyK(c.kickNeed), TEAM_OPEN:moneyK(c.t.open),
      KICK_EXPECTED:moneyK(c.kickExpected), KICK_SHARE:pct0(Math.min(1,c.kickNeed/Math.max(1,c.t.open))),
      TEAM_WIN:pct0(c.teamWin), KICK_TEAM_VALUE:money(c.kickValue)}) },

  { id:"mgr-c-kickhit", standing:"Conditionals", tone:"good", title:"Your team cleared the kicker",
    fires: c => c.late && c.t.manages==="AE" && c.t.kicker,
    /* The kicker is gated on the individual: a rep who finished under the
       decelerator line does not get it, which is the whole argument for the gate
       and is why the rest of the team has a reason to pull them over the line.
       "Every one of your people" was false on all four teams that clear the
       kicker across the presets, and the money beside it already excluded them. */
    /* Sibling of mgr-c-kickmiss, which was made closed-state for saying "finished"
        mid-quarter. This one was left on c.late saying the same thing. Gating is
        not the fix here: attainment only rises, so a team past the line in week
        11 has secured the kicker and the card is right to say so. Only the tense
        was wrong. */
    text:"Your team {{KICK_VERB}} {{MGR_TEAM_ATTAIN}} against the {{KICK_LINE}} line. {{WHO_GETS_IT}}",
    tok: c => ({KICK_VERB: c.S.closed ? "finished at" : "is at",
      MGR_TEAM_ATTAIN:pctVs(c.t.attain,KICK_LINE), KICK_TEAM_VALUE:money(c.kickValue),
      /* What each of them gets, not what the team got between them. The manager
          earns nothing from this card: their whole use for it is telling a rep
          what is coming, and "worth $6,394 between them" is a number they can do
          nothing with. The kicker is a share of each rep's OWN commission, so
          there is no single figure, and the range is the honest way to carry
          that. The table has the individual numbers, which is where a manager
          goes for a name. */
      WHO_GETS_IT: (()=>{
        const inN  = c.t.members.filter(m=>m.kickerEligible!==false);
        const out  = c.t.size - inN.length;
        const each = inN.map(m=>(m.comm||0)*KICK_PCT).sort((a,b)=>a-b);
        const lo = each[0]||0, hi = each[each.length-1]||0;
        const worth = Math.round(hi-lo) < 1
          ? money(hi)+" each"
          : money(lo)+" to "+money(hi)+" each";
        const verb = c.S.closed ? "earn" : "earn";
        if (!out) return "Every one of them "+verb+"s an extra "+pct0(KICK_PCT)+" of their own "+
                         "commission, "+worth+". The rep table has the individual numbers.";
        return cnt(inN.length)+" of your "+many(c.t.size,c.people)+" are at or above "+pct0(c.p.decel.thr||0)+
               " and "+verb+" an extra "+pct0(KICK_PCT)+" of their own commission, "+worth+
               ". The rep table has the individual numbers."; })()}) },

  { id:"mgr-c-kickmiss", standing:"Conditionals", tone:"warn",
    title:"Your team missed the kicker by {{KICK_MISS}}",
    /* This used to fire from week nine, alongside "the kicker is still on the
        table", so one screen carried both "you can still get it" and "you
        finished short of it" about the same kicker in the same quarter. The
        kicker is decided at quarter end and nowhere earlier, so this is a
        closed-state card. */
    /* Any team that did not clear it, not only one that came close. The ten-point
        window was inherited from the rep card, where it belongs: a rep only needs
        telling about a near miss, because a distant one is not about them. On the
        manager screen it produced the worst shape available. mgr-c-kicklive told
        a #large manager the kicker was still on the table in week 13, with $727K
        open and coverage of 1.37, and then the quarter closed and nothing was
        said at all, because that team was fifteen points short rather than ten.
        Encouraged to chase it to the last week and never told it was gone.
        A card closes the loop it opened. The manager owns the team number and
        the rep does not, which is what makes the two thresholds different rather
        than inconsistent. */
    fires: c => c.closed && c.p.hasKicker && c.t.manages==="AE" && !c.t.kicker,
    text:"Your team finished at {{MGR_TEAM_ATTAIN}} against a {{KICK_LINE}} line. {{WHO_MISSED}}",
    /* Per rep, for the same reason the card above it is: a manager earns nothing
        from the kicker either way, and the only use they have for this number is
        telling somebody what it would have been. A team total is not a thing they
        can say to anyone. */
    tok: c => ({MGR_TEAM_ATTAIN:p1(c.t.attain), KICK_MISS:gapPts(KICK_LINE, c.t.attain),
      KICK_TEAM_VALUE:money(c.kickValue),
      WHO_MISSED: (()=>{
        const inN  = c.t.members.filter(m=>m.kickerEligible!==false);
        const each = inN.map(m=>(m.comm||0)*KICK_PCT).sort((a,b)=>a-b);
        if (!each.length) return "Nobody on the team was in line for the extra "+pct0(KICK_PCT)+
                                 " of their own commission in any case.";
        const lo = each[0], hi = each[each.length-1];
        const worth = Math.round(hi-lo) < 1 ? money(hi)+" each"
                                            : money(lo)+" to "+money(hi)+" each";
        return "Nobody gets the extra "+pct0(KICK_PCT)+" of their own commission, which would have "+
               "been "+worth+". The rep table has the individual numbers."; })()}) },

  { id:"mgr-c-decel", standing:"Conditionals", tone:"bad",
    /* While the quarter runs this names whoever is off the pace that clears the
       line, not everyone who is under it: in week 5 everybody is under it. The
       title has to say which, or "two of your team are under the line" sits on a
       screen where eight of them are. */
    /* "One of your team is behind the pace" needs a countable noun after "your":
       the body of every other manager card says "of your eight reps", and the
       role noun follows what this manager runs. */
    title:"{{GATE_SUBJ}} {{GATE_VERB}} behind the pace that clears the reduced-rate line",
    titleClosed:"{{GATE_SUBJ}} finished under the reduced-rate line",
    /* One of eight below the line is an individual; a third of the team is the
        quota. The colour follows which of those it is. */
    toneBy: c => c.gateN >= Math.ceil(c.t.size/3) ? "bad" : "warn",
    fires: c => c.hasDecel && c.gateN>0 && (c.closed ? c.t.decelCost : c.t.decelCostPace)>0,
    /* "Every deal those people close" reads as though the manager is being told
        about strangers. It is their team. Where the whole team is under the line
        it says so; where it is some of them, "they" points at the title, which
        always sits directly above the sentence. */
    text:"{{WHOSE_DEALS}} {{PAY_VERB}} {{DECEL_RATE}} instead of {{BASE_RATE}}, and it "+
      "{{APPLY_CLAUSE}} {{COST_CLAUSE}} {{TABLE_CLAUSE}}",
    tok: c => ({BELOW_GATE_TEAM:cnt(c.t.belowGate), DECEL_COST_TEAM:money(c.t.decelCost),
      WHOSE_DEALS: c.closed
        ? (c.gateN===c.t.size ? "Everything your team closed" : "Everything they closed")
        : (c.gateN===c.t.size ? "Every deal your team closes" : "Every deal they close"),
      PAY_VERB: c.closed ? "paid" : "is paying",
      APPLY_CLAUSE: c.closed
        ? "applied to everything they closed this quarter, not only to what came after they crossed."
        : "applies to everything they have already closed this quarter, not just what comes next. "+
          "It comes off the moment they cross.",
      /* Priced over the people this card names rather than over everyone below
          the line, which at week 5 is the whole team. */
      COST_CLAUSE: (c.gateN===1 ? "That is " : "Between them that is ")+
        money(c.closed ? c.t.decelCost : c.t.decelCostPace)+
        " of commission they "+(c.closed ? "did not see." : "are not seeing so far."),
      TABLE_CLAUSE: c.closed
        ? (c.gateN===1 ? "The rep table shows who." : "The rep table is the record of who.")
        : "The rep table says which of them to spend the week on.",
      // Titles skip the sentence capitaliser, so the count starts upper case here.
      GATE_COUNT: (n=>n.charAt(0).toUpperCase()+n.slice(1))(cnt(c.gateN)),
      /* The count, then the team it is out of: "One of your eight reps", not
         "One of your team" and not "Four of your four reps". A manager of one
         has no count to give. */
      GATE_SUBJ: c.t.size===1 ? "Your "+c.people
        : (n=>n.charAt(0).toUpperCase()+n.slice(1))(cnt(c.gateN))+" of your "+
          many(c.t.size, c.people),
      GATE_VERB: c.gateN===1 ? "is" : "are"}) },

  /* WHAT STANDING 2 CANNOT SEE. The spread standing reads attainment, which
     says who is behind. It does not say whether being behind is a volume
     problem or a conversion one, and those are opposite conversations. Read off
     the deal counts, the answer on this model is always volume: the quiet rep
     converts BETTER and simply works a fraction of the pipeline, so the gap is
     how much is being worked rather than how well. The other case, where the
     quiet rep also converts worse, cannot occur here, because each rep's win
     rate is dealt independently and their deal count follows from attainment
     divided by it; no branch is written for a shape the engine cannot build.
     AE teams only. An SDR's count IS their target, so standing 2 already reads
     it, and a CSM's book is assigned rather than worked. Twenty opportunities
     on the busiest rep keeps it off enterprise teams, where five to eight deals
     each is the whole quarter and a ratio means nothing. */
  /* EXPANSION, AT THE MANAGER LEVEL.

     An AE manager whose team is paid a rate on expansion has a coaching question
     nobody was asking: how many of their reps are working the installed base at
     all. Read off the team rather than off the company, because that is what this
     manager owns, and gated on the plan paying an AE for it, so a plan that hands
     expansion to Customer Success outright never shows these.

     The red exists because the engine can now produce a team where nobody closed
     any and nobody attempted any, which is the case Javier asked for. It is
     deterministic rather than lucky: the weakest AE team works no expansion on
     every plan that has more than one team. */
  { id:"mgr-c-exp-green", standing:"Conditionals", tone:"good",
    title:"Expansion - most of the team is working the base",
    fires: c => expSettled(c) && c.t.aeExpPaid && c.t.aeExpReps*2 >= c.t.size,
    /* EXPANSION IS A GOOD THING AND THE GREEN HAS TO SAY SO. This card used to end
       "a team choosing to work accounts that pay them nothing on their number",
       which reads as though expansion were a sacrifice. It is revenue off accounts
       the company already has, it pays the rep, and it is the cheapest revenue in
       the building. Javier, 30 Sep. */
    text:"{{REPS}} of your {{SIZE}} reps closed expansion this quarter, {{REV}} of it, worth {{COMM}} "+
      "to them at {{RATE}}. That is revenue off accounts you already have, and it pays them on top of "+
      "their quota rather than against it.",
    tok: c => ({REPS:cnt(c.t.aeExpReps), SIZE:cnt(c.t.size), REV:moneyK(c.t.aeExpRev),
      COMM:money(c.t.aeExpComm), RATE:pct(c.p.expRate)}) },

  { id:"mgr-c-exp-amber", standing:"Conditionals", tone:"warn",
    title:"Expansion - a few of the team are working the base",
    fires: c => expSettled(c) && c.t.aeExpPaid && c.t.aeExpReps > 0 && c.t.aeExpReps*2 < c.t.size,
    /* NOT A CRITICISM OF THE PLAN. The plan pays a rate and sets no expansion
       target, and that is a decision we made rather than a hole: a rate with no
       target makes expansion available to a rep instead of something they are
       held to. So the card says what is available, not what is missing. */
    text:"{{REPS}} of your {{SIZE}} reps closed expansion this quarter, {{REV}} between them. The "+
      "plan pays {{RATE}} on it and sets no target, so the same rate is sitting there for the "+
      "{{REST}} who closed none, on accounts they already own. It is the easiest money on their "+
      "plan and a straightforward thing to coach next quarter.",
    tok: c => ({REPS:cnt(c.t.aeExpReps), SIZE:cnt(c.t.size), REV:moneyK(c.t.aeExpRev),
      REST: cnt(c.t.size-c.t.aeExpReps), RATE:pct(c.p.expRate)}) },

  { id:"mgr-c-exp-red", standing:"Conditionals", tone:"bad",
    title:"Expansion - nobody on this team closed any",
    fires: c => expSettled(c) && c.t.aeExpPaid && c.t.aeExpReps === 0,
    /* "and attempted none" is gone. It was a charge sheet, and the card is more
       useful as the thing a manager cannot see anywhere else: expansion is paid
       outside quota, so a team leaves it first when new business is tight, and
       nothing on their number ever shows it. */
    text:"None of your {{SIZE}} reps closed expansion this quarter. The plan pays them {{RATE}} on "+
      "it, on accounts they already own, and across the company {{CO_REPS}} closed {{CO_REV}} of it. "+
      "It sits outside quota, so their attainment looks the same either way and nothing on their "+
      "number will point you at it. The easiest extra money on their plan, and a good place to start "+
      "next quarter.",
    tok: c => ({SIZE:cnt(c.t.size), RATE:pct(c.p.expRate),
      CO_REPS: c.S.company.expReps===0 ? "nobody" : cnt(c.S.company.expReps)+" reps",
      CO_REV: mk0(c.S.company.expRev)}) },

  { id:"mgr-c-workload", standing:"Conditionals", tone:"warn",
    title:"{{WORK_TITLE}}",
    titleClosed:"The quarter came from two very different workloads",
    toneBy: c => c.workRatio >= 4 ? "bad" : "warn",
    fires: c => c.t.manages==="AE" && (c.closed || c.S.week>=5) &&
                c.workHi && c.workHi.deals>=20 && c.workRatio>=2.5,
    text:"{{WORK_BODY}}",
    /* Every card's tokens resolve on every screen, fired or not, so an SDR or
       CS manager screen runs this too and there is no busiest rep to read. */
    tok: c => { if (!c.workHi || !c.workLo) return {};
      const hi=c.workHi, lo=c.workLo, r=c.workRatio;
      const ratio = (Math.round(r*10)/10)+"x";
      return {WORK_TITLE: r>=4 ? "Two different jobs under one quota"
          : "Your reps are working very different amounts of pipeline",
        WORK_BODY: c.closed
          ? "Your busiest rep worked "+num(hi.deals)+" opportunities and your quietest "+num(lo.deals)+
            ", a "+ratio+" gap on the same quota, converting "+pct0(hi.wr)+" against "+pct0(lo.wr)+
            ". Whatever the quarter's number was, it came from two very different workloads. The rep "+
            "table is the record of who."
          : "Your busiest rep has worked "+num(hi.deals)+" opportunities this quarter and your "+
            "quietest "+num(lo.deals)+", a "+ratio+" gap on the same quota. The busiest converts "+
            pct0(hi.wr)+" of them and the quietest "+pct0(lo.wr)+", so the difference is how much is "+
            "being worked rather than how well it is worked."+
            (r>=4 ? " A gap that size is not a performance spread, it is two different jobs under one "+
              "quota." : "")+" The rep table has the counts rep by rep."}; } },

  { id:"mgr-c-bunched", standing:"Conditionals", tone:"warn", title:"Everyone is bunched just under quota",
    fires: c => c.late && c.bunched>=Math.max(2, Math.ceil(c.t.size*0.4)),
    titleClosed:"Everyone finished bunched just under quota",
    /* It said "finished" from week nine onward, three or four weeks before
        anybody had finished anything. */
    text:"{{BUNCHED_N}} of your {{TEAM_SIZE}} {{BUNCH_VERB}} between {{BUNCH_LOW}} and 100%. That "+
      "pattern is usually the quota rather than the people, and it is worth raising before next "+
      "quarter's numbers are set.",
    tok: c => ({BUNCHED_N:cnt(c.bunched), TEAM_SIZE:many(c.t.size,c.people), BUNCH_LOW:"85%",
      BUNCH_VERB: c.closed ? "finished" : "are sitting"}) }
  ];

/* ===========================================================================
   CEO
   Plan findings judge the design. These judge the quarter that ran.
   =========================================================================== */
  const CEO = [
  /* The title is a verdict and the card fires from any week, so a CEO in week 13
     read "The quarter landed" about a quarter with a week still in it. The body
     was already correct, "the team closed X of a Y quota", which is true whenever
     it is said. Only the headline was calling it early. */
  /* THE CEO'S STANDING 1 JUDGED A RUNNING QUARTER AGAINST THE WHOLE QUOTA.
     The three cards below it fired every week on attainment bands alone, so in
     week 1 every company was 0% of target, "The quarter missed badly", held at
     amber only by the week-five rule and followed by a line about the quarter
     closing late. Every other persona stopped doing this long ago: a rep, a
     team and a manager are all read against pace while the quarter runs and
     against target once it is over. The CEO was the one screen still reading a
     week-1 number as a result.
     These three are the open state and they mirror mgr-s1 on purpose, because
     it is the same question one level up and it was already settled there: on
     pace or already at target is green, behind pace with enough open to get
     there is amber, and red is reserved for the arithmetic case where closing
     everything still open would not reach the quota. On pace is the rounded
     comparison, so the card and the numbers it prints cannot disagree over a
     tie the reader cannot see. The original three are now closed-state only,
     and their copy is untouched. */
  { id:"ceo-s1-open-green", standing:"Is the sales number going to land", tone:"good",
    /* Same shape as mgr-s1-green: a company already past its number is not on
       pace towards it, it is there. */
    title:"{{S1_TITLE}}",
    fires: c => !c.closed && c.co.ceiling>=1 && (c.co.attain>=1 || c.coOnPace),
    text:"{{CO_STANDS}}",
    tok: c => ({CO_STANDS:c.coStands,
      S1_TITLE: c.co.attain>=1 ? "The sales number is already there"
        : "The sales number is on pace"}) },

  { id:"ceo-s1-open-amber", standing:"Is the sales number going to land", tone:"warn",
    title:"The sales number is behind pace",
    fires: c => !c.closed && c.co.ceiling>=1 && c.co.attain<1 && !c.coOnPace,
    text:"{{CO_STANDS}} That leaves {{CO_GAP}} to close, and {{CO_OPEN}} is still open.",
    tok: c => ({CO_STANDS:c.coStands, CO_GAP:moneyK(c.co.gap), CO_OPEN:moneyK(c.co.open)}) },

  { id:"ceo-s1-open-red", standing:"Is the sales number going to land", tone:"bad",
    title:"The sales number cannot get there on what is open",
    fires: c => !c.closed && c.co.ceiling<1,
    text:"{{CO_STANDS}} {{CO_CEILING}}",
    tok: c => ({CO_STANDS:c.coStands,
      CO_CEILING: Math.round(c.co.open)<=0
        ? "Nothing is open, so that is where the quarter lands."
        : "The team has "+moneyK(c.co.open)+" open, and closing every deal of it still leaves the "+
          "quarter at "+pct0(c.co.ceiling)+"."}) },

  /* It told every company at or over quota that "a number the team clears by a
     modest margin is the sign of a quota set correctly rather than a soft one",
     at 101% and at 140% alike, so the one card positioned to notice a soft quota
     certified every quota as sound. The sentence now speaks only when the margin
     is modest. Above SOFT_ATTAIN it either hands over to ceo-s1-soft, when most
     of the team beat quota, or says where the margin came from when a few
     people made it. A big accelerator payout is NOT the signal on its own: it
     comes just as easily from two reps at 230% on a team where most missed,
     which is concentration and standing 2's finding. */
  { id:"ceo-s1-green", standing:"Is the sales number going to land", tone:"good",
    title:"The number is there", titleClosed:"The sales number landed",
    fires: c => c.closed && c.co.attain>=1 && !c.softQuota,
    text:"The sales team closed {{TEAM_ACTUAL}} of a {{TEAM_QUOTA}} quota, which is {{TEAM_ATTAIN}} of target. "+
      "{{MARGIN_SAYS}}",
    tok: c => ({TEAM_ACTUAL:moneyK(c.co.closed), TEAM_QUOTA:moneyK(c.co.quota),
      TEAM_ATTAIN:pct0(c.co.attain),
      MARGIN_SAYS: c.co.attain < SOFT_ATTAIN
        ? "A number the sales team clears by a modest margin is the sign of a quota set correctly rather than a "+
          "soft one."
        : "That margin came from "+cnt(c.co.repsAboveQuota)+" of "+many(c.sellerCount,c.sellerNoun)+
          " rather than most of the sales team, so on its own it does not say the quota was set too low."}) },

  { id:"ceo-s1-soft", standing:"Is the sales number going to land", tone:"warn",
    title:"The quota may have been set too low",
    fires: c => c.closed && c.softQuota,
    text:"The sales team closed {{TEAM_ACTUAL}} of a {{TEAM_QUOTA}} quota, which is {{TEAM_ATTAIN}} of target, and "+
      "{{OVER_N}} of {{SELLERS}} beat quota. When most of a team clears a number by that much, the number "+
      "was probably set too low.{{ACCEL_CLAUSE}} Worth resetting before next quarter rather than "+
      "celebrating this one.",
    tok: c => ({TEAM_ACTUAL:moneyK(c.co.closed), TEAM_QUOTA:moneyK(c.co.quota),
      TEAM_ATTAIN:pct0(c.co.attain), OVER_N:cnt(c.co.repsAboveQuota), SELLERS:many(c.sellerCount,c.sellerNoun),
      ACCEL_CLAUSE: c.p.accel.t1>1 && c.co.accelSpend>0
        ? " The accelerator paid "+money(c.co.accelSpend)+" on top of base rate for revenue a right-sized "+
          "quota would have asked for."
        : ""}) },

  { id:"ceo-s1-amber", standing:"Is the sales number going to land", tone:"warn", title:"The sales number came up short",
    fires: c => c.closed && c.co.attain<1 && c.co.attain>=0.90,
    text:"The sales team closed {{TEAM_ACTUAL}} of a {{TEAM_QUOTA}} quota, {{TEAM_GAP}} short, which is "+
      "{{TEAM_ATTAIN}} of target. Close enough that the quota itself is defensible and the shortfall is "+
      "about execution rather than arithmetic.",
    tok: c => ({TEAM_ACTUAL:moneyK(c.co.closed), TEAM_QUOTA:moneyK(c.co.quota),
      TEAM_GAP:moneyK(c.co.gap), TEAM_ATTAIN:pct0(c.co.attain)}) },

  /* It ended "the findings below say which part of it is the plan's doing",
     and no card below said that in those words, so the reader was sent looking
     for something with no name. Standing 2 is the one that always answers at the
     close, because its four cards partition every quarter, so it is named. The
     sentence promises only what all four cards say, who carried what landed:
     "a few people or most of the team" is answered by two of the four, and the
     green and the small-team card say neither. */
  { id:"ceo-s1-red", standing:"Is the sales number going to land", tone:"bad", title:"The sales number missed badly",
    fires: c => c.closed && c.co.attain<0.90,
    text:"The sales team closed {{TEAM_ACTUAL}} of a {{TEAM_QUOTA}} quota, {{TEAM_GAP}} short, which is "+
      "{{TEAM_ATTAIN}} of target. A gap that size is not a coaching problem. The \"Who produced the "+
      "revenue\" section below shows who carried what did land.",
    tok: c => ({TEAM_ACTUAL:moneyK(c.co.closed), TEAM_QUOTA:moneyK(c.co.quota),
      TEAM_GAP:moneyK(c.co.gap), TEAM_ATTAIN:pct0(c.co.attain)}) },

  /* THE CEO SAW ONLY AEs. Every standing read the company's revenue number,
     so on #large thirty CSMs and nine SDRs were invisible to the one person
     whose job is the whole company. These two standings give each function its
     own answer to "did it deliver", in its own unit, because averaging revenue
     attainment with share of book kept with opportunities created produces a
     number nobody can act on. They mirror the manager cards for the same roles
     and read the same numbers: S.fn is built by the engine's own team builder
     over every member of the role, so the CEO and the managers cannot disagree
     about the same people. One card per standing shows at a time. The CSM and
     SDR at-target counts are said at the close only, where they are a result;
     mid-quarter they measure who has had something happen yet.
     No team comparison for either. CS accounts are assigned, so "your top three
     CSMs held most of the book" would mostly report who was given the biggest
     accounts. */
  { id:"ceo-cs-open-wait", standing:"Is the renewal book holding", tone:"good",
    title:"{{WAIT_TITLE}}",
    /* Under a tenth of the book resolved is not a rate. #early read "84% of the
       $236K that has come up" in week 1 as though it were a trend, the same
       SPREAD_MIN argument the CS manager cards already make. */
    fires: c => !c.closed && c.cs && !c.csReadable,
    text:"{{WAIT_SAYS}}{{EXP_OPEN}}",
    /* Every card's tokens are resolved on every screen, fired or not, so the
       sheet can show the ones that stayed quiet. On a plan with no CS team
       c.cs is null, and reading it here threw on 84 screens of #clean and
       #messy. */
    tok: c => !c.cs ? {} : ({WAIT_TITLE: c.cs.retentionRate===null ? "No renewals have come up yet"
                                                       : "Too little of the book has come up to read",
      WAIT_SAYS: c.cs.retentionRate===null
      ? "None of the "+moneyK(c.csBook)+" renewing this quarter has come up yet."
      : "Only "+moneyK(c.csBook-c.csPending)+" of the "+moneyK(c.csBook)+" renewing this quarter has come "+
        "up so far, too little to read a retention rate from.", EXP_OPEN:c.csExpOpenSays}) },

  { id:"ceo-cs-open-green", standing:"Is the renewal book holding", tone:"good",
    title:"The book is holding",
    fires: c => !c.closed && c.cs && c.csReadable && c.csMaxRet >= RET_FULL &&
                Math.round(c.cs.retentionRate*100) >= Math.round(RET_FULL*100),
    text:"{{CS_STANDS}}{{EXP_OPEN}}",
    tok: c => ({CS_STANDS:c.csStands, EXP_OPEN:c.csExpOpenSays}) },

  { id:"ceo-cs-open-amber", standing:"Is the renewal book holding", tone:"warn",
    title:"The book is holding below target",
    /* Amber covers everything between the target and the pay line, including a
       book that can no longer reach 95%. It used to go red the moment 95% was
       out of reach, so 94% read red in week 13 and amber at the close, the same
       number wearing two colours a week apart. Red is now the same line at both
       ends of the quarter: below 88%, where retention pay stops. */
    fires: c => !c.closed && c.cs && c.csReadable && c.csMaxRet >= RET_FLOOR &&
                !(c.csMaxRet >= RET_FULL && Math.round(c.cs.retentionRate*100) >= Math.round(RET_FULL*100)),
    text:"{{CS_STANDS}}{{LEFT_SAYS}}{{EXP_OPEN}}",
    tok: c => ({CS_STANDS:c.csStands, LEFT_SAYS:c.csLeftSays, EXP_OPEN:c.csExpOpenSays}) },

  { id:"ceo-cs-open-red", standing:"Is the renewal book holding", tone:"bad",
    title:"The book cannot reach the pay line on what is left",
    fires: c => !c.closed && c.cs && c.csReadable && c.csMaxRet < RET_FLOOR,
    text:"{{CS_STANDS}}{{LEFT_SAYS}}{{EXP_OPEN}}",
    tok: c => ({CS_STANDS:c.csStands, LEFT_SAYS:c.csLeftSays, EXP_OPEN:c.csExpOpenSays}) },

  { id:"ceo-cs-green", standing:"Is the renewal book holding", tone:"good",
    title:"The book held",
    fires: c => c.closed && c.cs && Math.round(c.csKept*100) >= Math.round(RET_FULL*100),
    text:"{{CS_WHO}} kept {{KEPT}} of the {{BOOK}} renewal book against a {{RET_FULL}} target.{{EXP_CLAUSE}} "+
      "{{AT_TARGET}}",
    tok: c => ({CS_WHO:c.csWho, KEPT:pctBar(c.csKept), BOOK:moneyK(c.csBook), RET_FULL:pct0(RET_FULL),
      EXP_CLAUSE:c.csExpSays, AT_TARGET:c.csAtTarget}) },

  { id:"ceo-cs-amber", standing:"Is the renewal book holding", tone:"warn",
    title:"The book held, short of target",
    fires: c => c.closed && c.cs && Math.round(c.csKept*100) < Math.round(RET_FULL*100) &&
                c.csKept >= RET_FLOOR,
    text:"{{CS_WHO}} kept {{KEPT}} of the {{BOOK}} renewal book against a {{RET_FULL}} target, with "+
      "{{CHURNED}} lost to churn.{{EXP_CLAUSE}} {{AT_TARGET}}",
    tok: c => ({CS_WHO:c.csWho, KEPT:pctBar(c.csKept), BOOK:moneyK(c.csBook), RET_FULL:pct0(RET_FULL),
      CHURNED:moneyK(c.csChurned), EXP_CLAUSE:c.csExpSays, AT_TARGET:c.csAtTarget}) },

  { id:"ceo-cs-red", standing:"Is the renewal book holding", tone:"bad",
    title:"The book lost more than the plan allows",
    fires: c => c.closed && c.cs && c.csKept < RET_FLOOR,
    text:"{{CS_WHO}} kept {{KEPT}} of the {{BOOK}} renewal book against a {{RET_FULL}} target, with "+
      "{{CHURNED}} lost to churn. That is below the {{RET_FLOOR}} where CS retention pay starts, so the "+
      "plan paid nothing for retention this quarter.{{EXP_CLAUSE}} {{AT_TARGET}}",
    tok: c => ({CS_WHO:c.csWho, KEPT:pctBar(c.csKept), BOOK:moneyK(c.csBook), RET_FULL:pct0(RET_FULL),
      RET_FLOOR:pct0(RET_FLOOR), CHURNED:moneyK(c.csChurned), EXP_CLAUSE:c.csExpSays,
      AT_TARGET:c.csAtTarget}) },

  { id:"ceo-sdr-open-green", standing:"Is the pipeline being built", tone:"good",
    title:"The pipeline is on pace",
    fires: c => !c.closed && c.sdr && c.sdrLands >= c.sdr.target,
    text:"{{SDR_STANDS}}",
    tok: c => ({SDR_STANDS:c.sdrStands}) },

  { id:"ceo-sdr-open-amber", standing:"Is the pipeline being built", tone:"warn",
    title:"The pipeline is behind pace",
    fires: c => !c.closed && c.sdr && c.sdrLands < c.sdr.target,
    text:"{{SDR_STANDS}}",
    tok: c => ({SDR_STANDS:c.sdrStands}) },

  { id:"ceo-sdr-green", standing:"Is the pipeline being built", tone:"good",
    title:"The pipeline was built",
    fires: c => c.closed && c.sdr && c.sdr.attain >= 1,
    text:"{{SDR_STANDS}}",
    tok: c => ({SDR_STANDS:c.sdrStands}) },

  { id:"ceo-sdr-amber", standing:"Is the pipeline being built", tone:"warn",
    title:"The pipeline came up short",
    fires: c => c.closed && c.sdr && c.sdr.attain < 1 && c.sdr.attain >= MGR_TEAM_FLOOR,
    text:"{{SDR_STANDS}}",
    tok: c => ({SDR_STANDS:c.sdrStands}) },

  { id:"ceo-sdr-red", standing:"Is the pipeline being built", tone:"bad",
    title:"The pipeline fell well short",
    fires: c => c.closed && c.sdr && c.sdr.attain < MGR_TEAM_FLOOR,
    text:"{{SDR_STANDS}}",
    /* The card never fires, so hard-to-reach prints its template, and a
       template that is one token read as nothing. spec is the wording
       SDR_STANDS builds at the close, spelled out for a reader. */
    spec:"Your SDRs {{VERB}} {{SDR_ACTUAL}} {{NOUN}} against a {{SDR_TARGET}} target, which is "+
      "{{SDR_ATTAIN}}.{{VALUE_SAYS}} {{AT_TARGET}}",
    tok: c => ({SDR_STANDS:c.sdrStands}) },

  /* STANDING 2 WENT SILENT ON THE QUARTER IT HAD MOST TO SAY ABOUT.
     Green needed 40% of reps at quota, and amber and red BOTH required
     c.co.attain>=1, which is standing 1's question sitting inside standing 2.
     A company that missed with thin participation therefore fired nothing at
     all: the standing that asks who produced the number said nothing on 24% of
     plans, measured at close over 3,000, at every size band. #miss was one of
     them, and it is the case the standing exists for.
     The four cards below partition the question they actually ask. Concentration
     first, because when it is true it is the distinctive fact; then whether
     enough of the team is carrying the number. Only the one card whose entire
     point is the contrast reads company attainment at all.
     ALL FOUR ARE CLOSED-STATE, and that is the honest shape of the standing
     rather than a gate bolted on. "Who produced it" is a post-mortem question:
     there is no answer to it until there is a number. Both halves proved it
     under test. How many reps made quota is decided at quarter end, the same
     argument that moved the four mechanic verdicts under 1g. And the share
     produced by the top reps, which looked like it could be read any week
     because it is a share of whatever has landed, turned out to measure nothing
     but who had closed first: on #clean it ran 77% in week 2, 63% at week 6,
     42% at week 10 and 26% at the close, falling every week as more of the team
     opened their account, and on #full it read 40% in week 1 against 26% at the
     close on sixteen reps who had each closed exactly one deal. Guarding it on
     how much had landed, or on how many reps were on the board, moved the noise
     around without removing it. The quarter has to be over.
     Standing 1, 3, 4 and 5 and the conditionals all still report mid-quarter, so
     the CEO view is not empty in week 6. It simply does not claim to know who
     produced a number nobody has yet. */
  /* THE SAME QUESTION WHILE THE QUARTER RUNS, asked the only way it can be.
     The top-share figure stays closed-only: it measured who closed first (see
     above). What can be read mid-quarter is how many AEs are keeping up with
     the week's pace, the same count the manager cards use, and only once half
     the sales team has closed something. Before that the count is the same
     who-closed-first noise, so the card says so instead: #clean waits until
     week 9 on its long cycle, #full reads from week 2. The 40% line is the
     one broadBased() draws at the close, so green and amber here predict the
     closed cards rather than inventing a second bar. */
  { id:"ceo-s2-open-wait", standing:"Who produced the revenue", tone:"good",
    title:"Too early to say who is carrying it",
    fires: c => !c.S.closed && c.co.zeroShare > 0.5,
    text:"{{CLOSED_ANY}} so far, so a count of who is keeping pace would mostly measure who closed "+
      "first. This section reads once half the sales team has closed something.",
    tok: c => { const n = c.p.aes - Math.round(c.co.zeroShare*c.p.aes);
      return {CLOSED_ANY: n===0 ? "None of the "+many(c.p.aes,"AE")+" has closed a deal"
        : "Only "+cnt(n)+" of "+many(c.p.aes,"AE")+" "+(n===1 ? "has" : "have")+" closed a deal"}; } },

  { id:"ceo-s2-open-green", standing:"Who produced the revenue", tone:"good",
    title:"The sales team is carrying it so far",
    fires: c => !c.S.closed && c.co.zeroShare <= 0.5 && c.aePaceN >= c.p.aes*0.4,
    text:"{{PACE_COUNT}}",
    tok: c => ({PACE_COUNT:c.aePaceSays}) },

  { id:"ceo-s2-open-amber", standing:"Who produced the revenue", tone:"warn",
    title:"Most of the sales team is behind pace",
    fires: c => !c.S.closed && c.co.zeroShare <= 0.5 && c.aePaceN < c.p.aes*0.4,
    text:"{{PACE_COUNT}} {{CO_CLAUSE}}",
    tok: c => ({PACE_COUNT:c.aePaceSays,
      CO_CLAUSE: Math.round(c.co.attain*100) >= Math.round(c.S.pace*100)
        ? "The sales number is on pace anyway, so it is being carried by fewer people than it should be."
        : "The sales number is behind pace too, so the shortfall is spread across the team rather than "+
          "sitting with a few people."}) },

  { id:"ceo-s2-green", standing:"Who produced the revenue", tone:"good", title:"The number came from the whole sales team",
    fires: c => c.S.closed && !concentrated(c) && broadBased(c),
    text:"{{AT_QUOTA}} of {{HEADCOUNT}} {{QUOTA_VERB}} and {{BELOW_70}} {{UNDER_VERB}} under 70%."+
      "{{TOP_CLAUSE}} {{SPREAD_CLAUSE}}",
    /* These fire from week 1 and said "cleared quota" and "finished under 70%"
       about a quarter nobody had finished. The counts are right; the tense was
       reporting a result four months early.
       The even-split reference is the unnameable-number rule: "your top three
       produced 26%" is not a fact the reader can place without the 19% three of
       sixteen would produce on their own. Same argument as mgr-s2-amber. */
    /* "One of 16 reps ARE at quota". The verb was a fixed string on all four of
       these, so it could not agree with the count in front of it, which is the
       rule isAre() exists for. It survived because agree-check exempted any
       sentence opening "<count> of", a rule written for "two of eight are" that
       should never have covered "one of two". */
    tok: c => ({QUOTA_VERB: c.S.closed ? "cleared quota" : isAre(c.co.atQuota)+" at quota",
      UNDER_VERB: c.S.closed ? "finished" : isAre(c.co.below70),
      AT_QUOTA:cnt(c.co.atQuota), HEADCOUNT:many(c.p.aes,"AE"), BELOW_70:cnt(c.co.below70),
      TOP_CLAUSE: smallCo(c) ? "" :
        " "+topPhrase(c)+" produced "+share(c.co.topShare)+" of the revenue, against the "+
        share(c.co.topN/Math.max(1,c.p.aes))+" an even split would give.",
      SPREAD_CLAUSE: smallCo(c)
        ? "At this size there is no distribution to read. The number is these "+cnt(c.p.aes)+" people, "+
          "and losing either one is losing half of it."
        : (c.S.closed && c.co.attain<1)
          ? "The shortfall is not a distribution problem. The work is spread across the sales team, so whatever "+
            "went wrong is the quota or the market rather than a dependency on one person."
          /* "Nothing here depends on one person staying" overclaimed. On a
             six-rep company the top 20% is one person and #messy put 27% of the
             revenue on them against an even share of 17%, which is a normal
             best rep and not a dependency, but it is not nothing either: that
             27% walks if they do. "No one person is carrying it" is the claim
             the numbers actually support at every green, and it needs no new
             threshold to decide when it is safe to say. */
          : "That spread is what makes a quarter repeatable: no one person is carrying it."}) },

  /* Concentration needs most of the team to have had a chance to land something,
     or it is not measuring concentration at all. Traced on #clean, which sells
     on a three to nine month cycle: the top-three share is 77% in week 2 when a
     quarter of the reps have closed anything, 63% at week 6 with a third of
     them, 42% at week 10 with half, and 26% at week 13 when everyone has. The
     figure was tracking who had closed FIRST and nothing else, and the card was
     calling it a forecast risk. Guarded on zeroShare rather than on revenue,
     because the thing that makes the share unreadable is the empty accounts, not
     the size of the total: an SMB team is all on the board by week 4 and reads
     honestly from there, and #clean waits until week 12 and then sits under the
     bar anyway, which is the right answer for a team that is not concentrated. */
  { id:"ceo-s2-amber", standing:"Who produced the revenue", tone:"warn", title:"The number came from a few people",
    fires: c => c.S.closed && concentrated(c),
    text:"{{AT_QUOTA}} of {{HEADCOUNT}} {{QUOTA_VERB}}, and {{TOP_N}} produced {{TOP_SHARE}} of "+
      "the revenue against the {{EVEN_SHARE}} an even split would give. {{RESTING_CLAUSE}} their next "+
      "offer letter is your forecast risk.",
    /* It used to require the company to have hit, so the one shape where
       concentration matters most, a company that missed and whose revenue still
       came from two people, was the shape it refused to speak about. */
    /* "One of 16 reps ARE at quota". The verb was a fixed string on all four of
       these, so it could not agree with the count in front of it, which is the
       rule isAre() exists for. It survived because agree-check exempted any
       sentence opening "<count> of", a rule written for "two of eight are" that
       should never have covered "one of two". */
    tok: c => ({QUOTA_VERB: c.S.closed ? "cleared quota" : isAre(c.co.atQuota)+" at quota",
      UNDER_VERB: c.S.closed ? "finished" : isAre(c.co.below70),
      AT_QUOTA:cnt(c.co.atQuota), HEADCOUNT:many(c.p.aes,"AE"), TOP_N:topPhrase(c),
      TOP_SHARE:share(c.co.topShare), EVEN_SHARE:share(c.co.topN/Math.max(1,c.p.aes)),
      RESTING_CLAUSE: !c.S.closed
        ? "What has landed so far is resting on a small number of people, and"
        : c.co.attain>=1
          ? "The quarter worked, and it worked resting on a small number of people, so"
          : "The quarter did not work, and what landed of it still rested on a small number of people, so"}) },

  { id:"ceo-s2-red", standing:"Who produced the revenue", tone:"bad",
    title:"The number landed and most of the AEs did not",
    fires: c => c.S.closed && !concentrated(c) && !broadBased(c) && c.co.attain>=1,
    text:"{{AT_QUOTA}} of {{HEADCOUNT}} {{QUOTA_VERB}} and {{BELOW_70}} {{UNDER_VERB}} below 70%."+
      "{{TOP_CLAUSE}} Those are two different facts and only one of them reaches the board. Quota "+
      "attainment of {{TEAM_ATTAIN}} in this shape usually means the quota is right for your best AEs "+
      "and wrong for everyone else.",
    /* "One of 16 reps ARE at quota". The verb was a fixed string on all four of
       these, so it could not agree with the count in front of it, which is the
       rule isAre() exists for. It survived because agree-check exempted any
       sentence opening "<count> of", a rule written for "two of eight are" that
       should never have covered "one of two". */
    tok: c => ({QUOTA_VERB: c.S.closed ? "cleared quota" : isAre(c.co.atQuota)+" at quota",
      UNDER_VERB: c.S.closed ? "finished" : isAre(c.co.below70),
      AT_QUOTA:cnt(c.co.atQuota), HEADCOUNT:many(c.p.aes,"AE"), BELOW_70:cnt(c.co.below70),
      TOP_CLAUSE: smallCo(c) ? "" :
        " "+topPhrase(c)+" produced "+share(c.co.topShare)+" of the revenue against the "+
        share(c.co.topN/Math.max(1,c.p.aes))+" an even split would give.",
      TEAM_ATTAIN:pct0(c.co.attain)}) },

  /* The card that closes the hole: a company that missed, with most of the team
     short, and no small group carrying what did land. It is the opposite claim
     to the red above and needs its own thesis, because without a hit there is no
     contrast to point at. What it points at instead is the quota. */
  { id:"ceo-s2-thin", standing:"Who produced the revenue", tone:"bad",
    title:"The shortfall is the whole team, not a few people",
    fires: c => c.S.closed && !concentrated(c) && !broadBased(c) && c.co.attain<1,
    text:"{{AT_QUOTA}} of {{HEADCOUNT}} {{QUOTA_VERB}} and {{BELOW_70}} {{UNDER_VERB}} under 70%, with "+
      "the company at {{TEAM_ATTAIN}}. This is not one or two people having a bad quarter, it is most "+
      "of the AEs missing the same number. A quota most of a team cannot reach is a quota question "+
      "before it is a performance question.",
    /* "One of 16 reps ARE at quota". The verb was a fixed string on all four of
       these, so it could not agree with the count in front of it, which is the
       rule isAre() exists for. It survived because agree-check exempted any
       sentence opening "<count> of", a rule written for "two of eight are" that
       should never have covered "one of two". */
    tok: c => ({QUOTA_VERB: c.S.closed ? "cleared quota" : isAre(c.co.atQuota)+" at quota",
      UNDER_VERB: c.S.closed ? "finished" : isAre(c.co.below70),
      AT_QUOTA:cnt(c.co.atQuota), HEADCOUNT:many(c.p.aes,"AE"), BELOW_70:cnt(c.co.below70),
      TEAM_ATTAIN:pct0(c.co.attain)}) },

  /* STANDING 3 WAS READING A UNITS BUG, AND SPLITTING ON THE WRONG THING.
     salesCost added a year of SDR and manager variable to one quarter of AE
     commission, so #full, #large, #early and #small all read past the guardrail
     when every one of them sits within a point of its own design cost. Fixed in
     the engine; what remains over the line on the presets is #messy, whose
     design is itself past its ceiling.
     The split underneath was wrong as well. Amber and red were decided by
     company attainment, so 20.6% on a beaten quarter was amber and 20.4% on a
     missed one was red: the milder overage wore the louder colour, and red
     said the same sentence at 0.4 points over as at 27. They now split on what
     caused the overage, which is the thing a CEO can act on:
       the accelerator explains it  -> amber, the plan paying for revenue
                                       above quota, which is what it is for
       it is within a tenth of the  -> amber, worth watching rather than acting
       ceiling and not the            on after one quarter
       accelerator
       further out than that        -> red, with the size said in dollars and
                                       the cause named: rates built past the
                                       ceiling by design, or a short quarter
                                       spreading calendar-paid roles over less
                                       revenue
     "Total variable" is gone from the sentence. It was AE commission alone,
     which made the total smaller than the sales figure it followed. The gross
     profit share is now the same numerator over the margin, so the two
     figures check against each other. */
  { id:"ceo-s3-green", standing:"What it costs", tone:"good", title:"The cost is defensible",
    titleClosed:"The cost was defensible",
    fires: c => c.costLive && c.co.salesCost <= c.p.guardrail,
    text:"Sales variable {{CAME_TO}} {{SALES_COST}} of new business against a {{SALES_CEILING}} "+
      "ceiling. That {{IS_WAS}} {{SALES_VAR}}{{SO_FAR}}, {{GP_SHARE}} of the gross profit on that revenue "+
      "at a {{GM}} margin.{{CS_SENTENCE}}",
    /* A company with no CS team has no CS cost, and "CS to 0% of the book it
       protects" reads as a failure rather than as an absence. The CS figure is
       the plan's design ratio, not a running actual, so it says "is set at". */
    tok: c => ({SALES_COST:c.costSays, SALES_CEILING:pct0(c.p.guardrail),
      CAME_TO: c.closed ? "came to" : "is running at", IS_WAS: c.closed ? "was" : "is",
      SO_FAR: c.closed ? "" : " so far",
      SALES_VAR:money(c.co.salesVarSpend), GP_SHARE:pct0(c.co.gpShare), GM:pct0(c.p.gm),
      CS_SENTENCE: c.p.css ? " CS variable is set at "+pct(c.co.csCost)+" of the book it protects." : ""}) },

  { id:"ceo-s3-amber", standing:"What it costs", tone:"warn",
    title:"The cost is past the guardrail because the plan is working",
    titleClosed:"The cost went past the guardrail because the plan worked",
    fires: c => c.costLive && c.co.salesCost > c.p.guardrail && !freeOver(c),
    text:"Sales variable {{CAME_TO}} {{SALES_COST}} of new business against a {{SALES_CEILING}} ceiling, "+
      "and the accelerator {{ACCOUNTS}} for {{ACCEL_COST}} of that. Without it the plan {{WOULD_SIT}} at "+
      "{{ACCEL_FREE}}, inside the ceiling, so the overage is the plan paying for revenue above quota, "+
      "which is what you built it to do. Worth knowing before someone reports it as an overrun.",
    tok: c => ({SALES_COST:c.costSays, SALES_CEILING:pct0(c.p.guardrail),
      CAME_TO: c.closed ? "came to" : "is running at",
      ACCOUNTS: c.closed ? "accounted" : "accounts",
      WOULD_SIT: c.closed ? "would have sat" : "would sit",
      /* Points, not a percent: "11.1% of that" read as a share of the 26%. */
      ACCEL_COST:gapPts(c.co.accelCost, 0),
      ACCEL_FREE: f1(d1(c.co.salesCost)-d1(c.co.accelCost))+"%"}) },

  { id:"ceo-s3-edge", standing:"What it costs", tone:"warn",
    title:"The cost is just past the guardrail",
    titleClosed:"The cost finished just past the guardrail",
    fires: c => c.costLive && c.co.salesCost > c.p.guardrail && freeOver(c) &&
                c.co.salesCost <= c.p.guardrail*1.10,
    text:"Sales variable {{CAME_TO}} {{SALES_COST}} of new business against a {{SALES_CEILING}} ceiling, "+
      "{{OVER}} over, {{ACCEL_CLAUSE}}. One quarter this close to the line is worth watching rather than acting on. "+
      "Two in a row is the rates.",
    tok: c => ({SALES_COST:c.costSays, SALES_CEILING:pct0(c.p.guardrail),
      CAME_TO: c.closed ? "came to" : "is running at",
      OVER: /\.\d\d%$/.test(c.costSays)
        ? ((c.co.salesCost-c.p.guardrail)*100).toFixed(2)+" points"
        : gapPts(c.co.salesCost, c.p.guardrail),
      ACCEL_FREE:pct(c.accelFree),
      /* With no accelerator pay the old clause printed the same figure twice,
         "running at 15.4%... without it the plan still sits at 15.4%". */
      /* "Without it the plan still sits at 17%" beside a 17% ceiling read as
         inside the line: the figure was 17.04%, rounded to the ceiling it is
         past. It widens to two decimals the same way costSays does. And "the
         accelerator does not explain it" hid how much it did explain: 18% with
         17.2% of it outside the accelerator is 0.8 of a 1-point overage. The
         clause now says the accelerator's share, worked from the printed
         figures so they subtract. */
      ACCEL_CLAUSE: pct(c.co.accelCost)==="0%"
        ? "and none of it is accelerator pay"
        : (() => { const g = c.p.guardrail, f = c.accelFree;
            const freeSays = pct(f)===pct(g) && f!==g ? (f*100).toFixed(2)+"%" : pct(f);
            const d = Math.round((parseFloat(c.costSays)-parseFloat(freeSays))*100)/100;
            const dSays = String(d)+(d===1 ? " point" : " points");
            return "and the accelerator is "+dSays+" of that: without it the plan "+
              (c.closed ? "still sat" : "still sits")+" at "+freeSays+", past the ceiling on its own"; })()}) },

  { id:"ceo-s3-red", standing:"What it costs", tone:"bad", title:"The cost is past the guardrail",
    titleClosed:"The cost finished past the guardrail",
    fires: c => c.costLive && c.co.salesCost > c.p.guardrail && freeOver(c) &&
                c.co.salesCost > c.p.guardrail*1.10,
    text:"Sales variable {{CAME_TO}} {{SALES_COST}} of new business against a {{SALES_CEILING}} ceiling, "+
      "so every $100 of new business {{COSTS}} {{PER_100}} in variable pay where the ceiling allows "+
      "{{CEIL_100}}. {{CAUSE}}",
    tok: c => ({SALES_COST:c.costSays, SALES_CEILING:pct0(c.p.guardrail),
      CAME_TO: c.closed ? "came to" : "is running at",
      COSTS: c.closed ? "cost" : "is costing",
      /* Worked from the percentage as printed, so "22.2%" reads as $22.20. $22
         and then $22.23 were both numbers the reader could not get from 22.2%
         of $100. */
      PER_100: per100(c.co.salesCost),
      CEIL_100: "$"+Math.round(c.p.guardrail*100),
      /* The two ways past the line need opposite responses, so the card says
         which one this is instead of one line for both. */
      /* Per $100 to match the sentence in front of it, and said as what the
         plan pays AT TARGET, because "designed at 22.5%" meant nothing to a
         reader who has not built a comp plan. The second branch names SDRs
         only when there are some: they are the role whose pay does not fall
         when deals slip, which is true in the real world and not only in the
         model. Manager pay does fall with the team, so it is not offered as
         the cause. */
      CAUSE: c.p.salesCostOfRev > c.p.guardrail
        ? "At target, with every AE landing exactly at quota, this plan pays "+per100(c.p.salesCostOfRev)+
          " in variable pay for every $100 of new business, against a ceiling of "+
          "$"+Math.round(c.p.guardrail*100)+". It was over the line before anyone sold anything, so no "+
          "quarter will bring it back under. That needs a change to the rates, not better performance."
        : "At target this plan pays "+per100(c.p.salesCostOfRev)+" for every $100 of new business, "+
          "inside the ceiling, so the rates are not the problem. "+
          (c.p.sdrs
            ? "SDRs are paid for the pipeline they create, not for what closes, so when a quarter lands "+
              "short their pay stays the same and is spread over less revenue."
            : "The overage is the quarter landing short, not the plan.")}) },

  { id:"ceo-s4-green", standing:"Is it paying for what you asked for", tone:"good",
    title:"The money went where you said it should",
    /* CLOSED-STATE, for the reason standing 2 is, found the same way. Traced
       week by week, the split measures when money lands rather than where it
       goes: renewals and expansion resolve evenly across the quarter while new
       business closes in the last three weeks, so mid-quarter the mix leans
       toward expansion and then swings back. #large read amber, then green from
       week 3 to 11, then amber again; #small changed colour six times; #miss
       went green, amber for nine weeks, green. A CEO watching it week to week
       would see a verdict about the plan reverse for no reason in the plan.
       The paidAny guard stays: a split of nothing printed a clean 0/100 in
       week 1 and fired green on it. ceo-s4-nocs is the one card in this
       standing that still speaks mid-quarter, because it does not depend on
       anything having been paid. */
    fires: c => c.closed && c.paidAny && c.objMatch,
    text:"You said the priority was {{OBJ}}. {{NEW_SHARE}} of commission was paid on new business and "+
      "{{EXP_SHARE}} on expansion and renewal, which is the shape that objective implies.",
    tok: c => ({OBJ:c.objLabel, NEW_SHARE:pct0(c.newShare), EXP_SHARE:pct0(1-c.newShare)}) },

  { id:"ceo-s4-amber", standing:"Is it paying for what you asked for", tone:"warn",
    title:"The money went somewhere else",
    fires: c => c.closed && c.paidAny && !c.objMatch && !(c.noCsFunction && !c.wantsNewObj),
    text:"You said the priority was {{OBJ}}, but {{NEW_SHARE}} of commission was paid on new business "+
      "against {{EXP_SHARE}} on expansion and renewal. Reps follow the payout, not the objective. If "+
      "the objective is right, the rates are wrong.",
    tok: c => ({OBJ:c.objLabel, NEW_SHARE:pct0(c.newShare), EXP_SHARE:pct0(1-c.newShare)}) },

  /* A plan whose objective is retention and expansion, with nobody on it whose
     job is retention or expansion. ceo-s4-amber used to fire here and blame the
     rates, "if the objective is right, the rates are wrong", on a plan that has
     no expansion rate to be wrong: there is no CS team and nothing to pay. The
     finding is the gap between the objective and the org, not the rates, and
     it holds from the first week because it does not depend on anything
     having been paid. #clean is the preset that reaches it. */
  { id:"ceo-s4-nocs", standing:"Is it paying for what you asked for", tone:"warn",
    title:"Nobody is paid for the priority you set",
    titleClosed:"Nobody was paid for the priority you set",
    fires: c => c.noCsFunction && !c.wantsNewObj,
    text:"You said the priority was {{OBJ}}, but this plan has no CS team, so nobody {{IS_WAS}} paid to renew "+
      "or expand an account and every dollar of commission {{GOES}} to new business. If retention and "+
      "expansion are the priority, someone has to own them before the rates can reward them.",
    tok: c => ({OBJ:c.objLabel, IS_WAS: c.closed ? "was" : "is", GOES: c.closed ? "went" : "goes"}) },

  /* ceo-s5, "Some of your findings will never show up here", is DELETED. It
     listed plan-page warnings whose damage lands after the quarter, and every
     sentence it could ever say was a plan-page sentence: the CEO view's own
     rule is that plan findings judge the design and CEO findings judge the
     quarter, and neither says the other's sentence. The one idea worth
     keeping, that a good quarter does not clear these, now sits on the plan
     page as a tag on the warnings themselves (SLOW_HARM in the engine). */

  /* Two faults at the close, both raised in the CEO read. "Any team working
     this quota against that ceiling LANDS NEAR 84%" is a forecast, and at week
     13 on #miss it sat beside "the team is at 88%", a prediction already beaten
     by the number in the same sentence. And "change the quota, or change the
     deal size the quota assumes" is advice nobody can take inside a quarter
     whose quota is already set.
     The 84% was never really a forecast anyway. It is the ceiling: closing
     every deal the cycle allows gets a rep to capDeals over dealsNeeded of
     quota, 20 of 24. So the card now says exactly that, from the two figures it
     prints, and the percentage is worked from them so the reader can check it.
     The action splits on what can still be done. While the quarter runs: plan
     this quarter's number against the ceiling rather than the quota, and fix
     the quota before the next one is set. At the close: only the second. */
  { id:"ceo-c-capacity", standing:"Conditionals", tone:"bad",
    title:"The quota cannot be worked, and coaching will not change that",
    titleClosed:"The quota could not be worked, and coaching would not have changed that",
    fires: c => c.p.capacity<1,
    text:"Reaching quota {{NEEDS}} {{DEALS_NEEDED}} closed deals a quarter from every AE, against a "+
      "realistic ceiling of {{CAP_DEALS}} for a typical AE on a {{CYCLE}} cycle, and {{CAP_DEALS}} deals "+
      "is {{CAPACITY_PCT}} of quota.{{STANDING_CLAUSE}} What {{IS_CAPPING}} them {{IS}} the length of the "+
      "cycle rather than the people, so this {{IS}} not a performance conversation. {{ACTION}}",
    tok: c => { const need=Math.round(c.p.dealsPerRepQtr), cap=Math.round(c.p.capDeals);
      return {DEALS_NEEDED:num(need), CAP_DEALS:num(cap), CYCLE:c.p.cycle,
      TEAM_ATTAIN:pct0(c.co.attain), CAPACITY_PCT:pct0(cap/Math.max(1,need)),
      NEEDS: c.closed ? "needed" : "needs",
      IS_CAPPING: c.closed ? "capped" : "is capping", IS: c.closed ? "was" : "is",
      /* Where the team is, said as a fact and never as a projection. Nothing
         before week 5, because 7% is not evidence of anything. */
      /* The ceiling is what a TYPICAL rep can close, not a hard limit: the
         strongest reps go past it, which is how #miss lands at 88% against an
         83% ceiling. Said beside the ceiling it read as a contradiction, so
         whenever the team is past it the card says why. */
      STANDING_CLAUSE: (()=>{
        const capPct = cap/Math.max(1,need);
        const past = Math.round(c.co.attain*100) > Math.round(capPct*100);
        const why = past ? ", "+(c.closed ? "a little above that because the strongest AEs closed" :
          "already past that because the strongest AEs close")+" more than a typical AE can." : ".";
        return c.closed ? " The sales team landed at "+pct0(c.co.attain)+why
          : c.S.week < 5 ? ""
          : " The sales team is at "+pct0(c.co.attain)+" "+leftSays(c.S,"words")+why; })(),
      /* Planning this quarter against the ceiling is only advice while there is
         a forecast left to set. In the last three weeks, where most of the
         quarter closes, the number is already mostly in, so only the
         next-quarter half is said. */
      // The last three weeks are weeks 11 to 13, which now count 2, 1 and 0 left.
      ACTION: (c.closed || c.S.weeksLeft <= 2)
        ? "Change the quota, or the deal size it assumes, before next quarter's numbers are set."
        : "Plan this quarter's number against that "+pct0(cap/Math.max(1,need))+" rather than against "+
          "quota, and change the quota, or the deal size it assumes, before next quarter is set."}; } },

  { id:"ceo-c-spread", standing:"Conditionals", tone:"warn",
    title:"Your sales teams are {{SPREAD_PTS}} apart on the same plan",
    titleClosed:"Your sales teams finished {{SPREAD_PTS}} apart on the same plan",
    fires: c => c.late && c.aeTeams.length>1 && c.spread>0.10,
    /* It named two managers as though they were the ones at 84% and 44%, and a
       CEO who does not know every manager by name could not tell which part of
       the company was being compared. It is their teams, and only sales teams
       are in it, so the sentence says both. */
    text:"{{TOP_TEAM_MGR}}'s sales team {{SPREAD_VERB}} {{TOP_TEAM}} and {{BOTTOM_TEAM_MGR}}'s at {{BOTTOM_TEAM}}, "+
      "{{TEAM_SPREAD_PTS}} apart. Same plan, same quota, same product, same quarter. Whatever explains "+
      "that gap is territory, management or hiring, and none of the three gets fixed by changing how "+
      "people are paid.",
    /* It has a closed title and its body never moved with it, so from week nine
       a CEO read "Grace Stanton finished at 84%" about a quarter with four weeks
       left in it. */
    tok: c => ({SPREAD_VERB: c.S.closed ? "finished at" : "is at",
      TOP_TEAM_MGR:c.topTeam.manager, TOP_TEAM:p1(c.topTeam.attain),
      BOTTOM_TEAM_MGR:c.bottomTeam.manager, BOTTOM_TEAM:p1(c.bottomTeam.attain),
      TEAM_SPREAD_PTS:gapPts(c.topTeam.attain, c.bottomTeam.attain),
      SPREAD_PTS:gapPts(c.topTeam.attain, c.bottomTeam.attain)}) },

  { id:"ceo-c-kickon", standing:"Conditionals", tone:"good", title:"The team kicker did its job",
    fires: c => c.closed && c.co.kickTeams>0,
    text:"{{KICK_TEAMS}} of {{TEAM_COUNT}} cleared the {{KICK_LINE}} line, costing {{KICK_COST}}. "+
      "Reachable and not automatic, which is the only state in which a kicker is worth its complexity.",
    tok: c => ({KICK_TEAMS:cnt(c.co.kickTeams), TEAM_COUNT:many(c.aeTeams.length,"sales team"),
      KICK_COST:money(c.co.kickCost)}) },

  { id:"ceo-c-kickoff", standing:"Conditionals", tone:"warn", title:"Nobody reached the team kicker",
    fires: c => c.closed && c.p.hasKicker && c.co.kickTeams===0 && c.aeTeams.length>0,
    /* "That nobody planned around" claimed to know what people had planned,
       which nothing in the model represents. */
    text:"No sales team cleared {{KICK_LINE}}; the closest finished at {{TOP_TEAM}}, {{TOP_GAP}} short. You are "+
      "carrying the complexity of an incentive that paid nothing this quarter.",
    tok: c => ({TOP_TEAM:p1(c.topTeam?c.topTeam.attain:0),
      TOP_GAP:gapPts(KICK_LINE, c.topTeam?c.topTeam.attain:0)}) },

  /* The kicker said nothing until the close, so a CEO paying for one had no
     view of it for thirteen weeks. The live read uses the week's pace: a team
     finishing at 110% should be at 110% of the pace now. Measured on the four
     kicker presets it predicts the close on every one: #full and #large carry
     one team on course most weeks and pay one, #miss never has one and pays
     none. #small flips week to week on a single team and closes short, which
     is what the card says a single team near the line looks like. */
  { id:"ceo-c-kicklive", standing:"Conditionals", tone:"good",
    title:"{{KICK_TITLE}}",
    /* From week 2: in week 1 the kicker's bar and the pace print as the same
       8%, and a team is "on course" on its first deal. */
    fires: c => !c.closed && c.S.week>=2 && c.p.hasKicker && c.aeTeams.length>0 && c.kickOnN>0,
    /* A team already past 110% has cleared the line, not kept pace with it.
       #full week 13 read "on course" and a pace clause beside Megan Bennett's
       team at 115%. Once any team is past the line the card says so, and the
       pace clause only speaks for teams still working toward it. */
    text:"The kicker pays a sales team that finishes at {{KICK_LINE}} of its quota{{KICK_NOW_SAYS}}. "+
      "{{KICK_STANDS}}",
    tok: c => { const n = c.kickOnN, m = c.aeTeams.length, t = c.aeTeams[0];
      const done = c.aeTeams.filter(x=>(x.attain||0) >= KICK_LINE).length, chasing = n - done;
      const Cap = x => x.replace(/^./,y=>y.toUpperCase());
      if (done > 0) return {
        KICK_NOW_SAYS: chasing>0 ? c.kickNowSays : "",
        KICK_TITLE: done===1 ? "A sales team has already cleared the kicker line"
          : Cap(cnt(done))+" sales teams have already cleared the kicker line",
        KICK_STANDS: (m===1 ? t.manager+"'s sales team is already past it, at "+pct0(t.attain)+"."
          : done===m ? (m===2 ? "Both sales teams" : "All "+cnt(m)+" sales teams")+" are already past it, led by "+
            t.manager+"'s at "+pct0(t.attain)+"."
          : Cap(cnt(done))+" of "+many(m,"sales team")+" "+isAre(done)+" already past it, led by "+
            t.manager+"'s at "+pct0(t.attain)+".")+
          (chasing>0 ? " "+Cap(cnt(chasing))+" more "+isAre(chasing)+" on course for it." : "")};
      return {KICK_NOW_SAYS:c.kickNowSays,
        KICK_TITLE: n===1 ? "A sales team is on course for the kicker"
          : Cap(cnt(n))+" sales teams are on course for the kicker",
        KICK_STANDS: m===1 ? t.manager+"'s sales team is there, at "+pct0(t.attain)+"."
          : n===m ? (m===2 ? "Both sales teams" : "All "+cnt(m)+" sales teams")+" are there, led by "+
            t.manager+"'s at "+pct0(t.attain)+"."
          : Cap(cnt(n))+" of "+many(m,"sales team")+" "+isAre(n)+
            " there, led by "+t.manager+"'s at "+pct0(t.attain)+"."}; } },

  { id:"ceo-c-kicklive-none", standing:"Conditionals", tone:"warn",
    title:"No sales team is on course for the kicker",
    fires: c => !c.closed && c.S.week>=2 && c.p.hasKicker && c.aeTeams.length>0 && c.kickOnN===0,
    text:"The kicker pays a sales team that finishes at {{KICK_LINE}} of its quota{{KICK_NOW_SAYS}}. "+
      "No sales team is there. The closest, {{TOP_MGR}}'s, is at {{TOP_TEAM}}, {{TOP_GAP}} short, {{WITH_LEFT}}.",
    tok: c => { const need = KICK_LINE*c.S.pace, t = c.aeTeams[0];
      return {KICK_NOW_SAYS:c.kickNowSays, TOP_MGR:t.manager,
        TOP_TEAM:pct0(t.attain), /* From the printed whole numbers, so the gap checks. */
        TOP_GAP: (g => g+(g===1?" point":" points"))(Math.round(need*100)-Math.round(t.attain*100))}; } },

  /* It read "$52,760 of commission was paid above quota, 23% of the total. That
     is the plan buying revenue you would probably not otherwise have booked."
     Both halves were wrong. The figure counted base-rate pay on revenue above
     quota, which that revenue earns with or without an accelerator, plus a
     selling manager's whole commission; what the accelerator added was $32,040.
     And "revenue you would not otherwise have booked" is a counterfactual
     nothing in the model can know. It now states what was paid and what it was
     paid on, which is the trade a CEO actually has to judge. */
  { id:"ceo-c-accelgood", standing:"Conditionals", tone:"good", title:"What the accelerator paid for",
    fires: c => c.closed && c.p.accel.t1>1 && c.co.accelShare>=0.10,
    text:"The accelerator added {{ACCEL_SPEND}} on top of base rate, {{ACCEL_SHARE}} of all commission, "+
      "paid to the {{OVER_N}} who finished above quota on {{REV_ABOVE}} of revenue past {{THEIR_QUOTA}}. That "+
      "is {{PER_100}} of extra pay for every $100 of revenue above quota.",
    tok: c => ({ACCEL_SPEND:money(c.co.accelSpend), ACCEL_SHARE:share(c.co.accelShare),
      OVER_N:many(c.co.repsAboveQuota,c.sellerNoun), REV_ABOVE:moneyK(c.co.revAboveQuota),
      THEIR_QUOTA: c.co.repsAboveQuota===1 ? "their quota" : "their quotas",
      /* To the cent, from the two figures on the page: $36,090 over $338K is
         $10.68, and the reader will divide those two numbers. */
      PER_100: "$"+(c.co.accelSpend/Math.max(1,asShown(c.co.revAboveQuota))*100).toFixed(2)}) },

  /* ceo-c-accelbad was deleted on 15 Sep and RESTORED on 3 Oct, gated to the
     close. The reason it was deleted is worth keeping, because the half that was
     right is still right and the half that was wrong is why it is back.

     RIGHT: it fired from week 9 and asked a quarter-end question, so on every
     plan where the accelerator eventually paid it spent weeks 9 to 12 announcing
     that the accelerator had paid nothing. Same bug as the three cards above it.
     It now fires only at the close, where "$0 was paid above quota" is a fact
     about a finished quarter rather than a premature verdict on a live one.

     WRONG: the note recorded that gating it also emptied it, on a test of 168
     plans at the close that found the accelerator paying under 10% of commission
     on none of them. "Not rarely. Never." That test varied segment, quota and
     accelerator against each preset's other answers, and every preset sits at
     capacity 1, so it swept a backbone rather than the answer space. Measured on
     3 Oct across 2,641 plans with a real accelerator, simulated to the close:
     min 0.0%, p10 0.4%, median 9.3%, max 30.9%, and 1,429 of them, 54%, finish
     under the threshold. Two of the eight presets are under it too, #mixed at
     6.3% and #messy at 8.5%. The card is not empty and never was.

     THE GATE IS NOT A SHARE. The first restored draft fired on accelShare<0.10,
     as the complement of ceo-c-accelgood, and it was wrong on its own evidence.
     On #mixed that gate fires at 6.3% with nine sellers above quota finishing at
     149%, 143%, 137% and down. The accelerator pulled people well past target
     and still only accounted for 6.3% of commission, because the uplift is small
     against a large base. A low share does not mean decoration, it means the
     plan is big. Saying "almost nobody reached it" there would be false.

     Decoration has one unambiguous form: the quarter ended and NOBODY got above
     quota, so the mechanic paid literally nothing. Measured at the close across
     2,641 accelerator plans, that is 261 of them, 9.9%, and accelShare is
     exactly 0.00% on every one. No preset produces it, so the card lives on the
     hard-to-reach page, which is what that page is for: a condition no preset
     happens to reach, rather than a warning asked the wrong question.

     The plan page still makes the answers-only version in week 1 off p.capacity,
     as "Motivation: the accelerator is decoration on this quota". That card says
     the quota puts the accelerator out of reach before a quarter is run. This one
     says the quarter finished and nobody got there. Different questions, and on a
     plan where the quota is fine and the quarter was simply bad, only this one
     fires.

     Javier, 3 Oct: the card was never meant to be deleted. */
  { id:"ceo-c-accelbad", standing:"Conditionals", tone:"warn", title:"The accelerator is decoration",
    fires: c => c.closed && c.p.accel.t1>1 && c.co.repsAboveQuota===0,
    text:"Not one {{SELLER_PL}} finished above quota, so the accelerator paid nothing at all. "+
      "{{CLOSEST}} The plan is carrying an overperformance mechanic that this quarter never "+
      "reached. If the quota is the reason, the quota is the thing to change: the accelerator "+
      "costs nothing until somebody earns it, and nobody did.",
    tok: c => {
      /* The closest seller, the way ceo-c-kicklive-none names the closest team, so the
         card says how far off the quarter was rather than only that it was off. Managers
         who sell count, because they carry a quota and the accelerator applies to them. */
      const all = (c.S.aes||[]).concat(c.S.mgrSellers||[]);
      const top = all.slice().sort((a,b)=>(b.attain||0)-(a.attain||0))[0];
      return {SELLER_PL: c.sellerNoun==="seller" ? "seller" : "AE",
        CLOSEST: top ? "The closest, "+top.name+", finished at "+pct0(top.attain)+"." : ""}; } },

  /* EXPANSION, AT THE COMPANY LEVEL.

     The CEO question is not how much expansion closed, it is whether the company
     is paying for a motion anybody is running. A rate on expansion with no target
     behind it is a real design choice and it only shows up as spend, never as a
     miss, so nothing on the revenue side of this view would ever raise it.

     Reported outside the cost-of-revenue ratio, deliberately. That ratio is
     commission over new business closed, expansion revenue is not in the
     denominator, and putting expansion pay in the numerator would make the number
     look worse every time a rep expanded an account. The capacity model carries
     the same correction on its own memo row. */
  { id:"ceo-c-exp-green", standing:"Conditionals", tone:"good",
    title:"Expansion - the team is working the installed base",
    fires: c => expSettled(c) && c.S.company.expPaid && c.S.company.expReps*2 >= c.p.aes,
    /* "your AEs" on a CEO card. They are the manager's reps, and the CEO view reads
       the company. Swept all three of these for the same possessive. */
    text:"{{REPS}} of the {{AES}} AEs closed expansion this quarter, {{REV}} of it, and the plan paid "+
      "them {{COMM}} at {{RATE}}. That is revenue off accounts the company already has, and it sits "+
      "outside the sales cost of new business because none of it is in the quota that cost is "+
      "measured against.",
    tok: c => ({REPS:cnt(c.S.company.expReps), AES:cnt(c.p.aes), REV:moneyK(c.S.company.expRev),
      COMM:money(c.S.company.expComm), RATE:pct(c.S.company.expRate)}) },

  { id:"ceo-c-exp-amber", standing:"Conditionals", tone:"warn",
    title:"Expansion - the rate is there and most of the team is not using it",
    fires: c => expSettled(c) && c.S.company.expPaid && c.S.company.expReps*4 > c.p.aes &&
                c.S.company.expReps*2 < c.p.aes,
    /* The plan setting no expansion target is a decision, not a hole, so the card
       states what that decision produces and what would change it rather than
       reading as a complaint about the plan it is describing. */
    /* A SUGGESTION FOR NEXT QUARTER, NOT A VERDICT ON THIS ONE. Naming the lever
       reads as telling a CEO their plan is wrong, and the plan deliberately pays a
       rate without a target. Both of these cards now put the target where a comp
       change actually happens, which is the next plan. */
    text:"The plan pays {{RATE}} on expansion and {{REPS}} of the {{AES}} AEs closed some, {{REV}} "+
      "between them, off accounts the company already has. It pays a rate for it and sets no number, "+
      "so expansion grows at whatever pace the team works it. If you want a faster pace, next "+
      "quarter's plan could carry an expansion target alongside the rate.",
    tok: c => ({RATE:pct(c.S.company.expRate), REPS:cnt(c.S.company.expReps), AES:cnt(c.p.aes),
      REV:moneyK(c.S.company.expRev)}) },

  /* A QUARTER OF THE TEAM OR FEWER, RATHER THAN NOBODY.

     "Not one AE closed any" was the first version and it fires on no plan the
     engine can build, because the expansion generator always gives the strongest
     rep one. A red that no plan produces is a red nobody reads, so the test is
     the share of the team rather than the absence of it, and the sentence makes
     the same point: a rate with no target behind it is optional, and optional is
     what almost all of them chose. */
  { id:"ceo-c-exp-red", standing:"Conditionals", tone:"bad",
    title:"Expansion - almost nobody is using the rate you pay",
    fires: c => expSettled(c) && c.S.company.expPaid && c.S.company.expReps*4 <= c.p.aes,
    /* No jab at the plan. Paying a rate and setting no expansion target is a
       decision, and the card's job is to show what that decision produced and name
       the lever, not to grade it. "An option that goes unused never shows up as a
       miss" was the sharpest version of the same complaint and it is gone. */
    text:"The plan pays AEs {{RATE}} on expansion and {{REPS}} of the {{AES}} closed some this "+
      "quarter, {{REV}} between them. Expansion is revenue off accounts the company already has, "+
      "which makes it the cheapest revenue available to this team. The plan pays a rate for it and "+
      "asks for no number, so the amount that lands is whatever reps work on their own. If you want "+
      "more of it, next quarter's plan could carry an expansion target alongside the rate.",
    tok: c => ({RATE:pct(c.S.company.expRate), AES:cnt(c.p.aes), REV:mk0(c.S.company.expRev),
      REPS: c.S.company.expReps===0 ? "not one" : cnt(c.S.company.expReps)}) },

  { id:"ceo-c-decel", standing:"Conditionals", tone:"warn",
    title:"The decelerator bit {{DECEL_PEOPLE}}",
    /* Closed-state, like the three cards above it. "Finished below the line"
       is a payroll fact and the line is not crossed until the quarter ends, so
       firing it from week 9 reported reps as re-rated while they still had three
       weeks to climb back over. The manager version of this card stayed live and
       went pace-relative instead, because a manager can still move somebody; a
       CEO reading a company-wide saving cannot. */
    fires: c => c.closed && c.p.decel.thr!==null && c.co.decelReps>0 && c.co.decelSaved>0,
    /* "Saving $6,240" framed pay withheld from struggling reps as a win, and
       "worth deciding on purpose rather than discovering at payroll" named no
       decision. It now says what was withheld, how close the nearest rep came,
       and the actual choice the line forces. */
    text:"{{DECEL_REPS}} finished below {{DECEL_LINE}} and {{DECEL_VERB}} paid at the reduced rate, "+
      "{{DECEL_SAVED}} less than the full rate would have paid them. The closest finished {{CLOSEST_GAP}} "+
      "under the line. Decide before next quarter what that line is for: getting people back above it, or "+
      "easing out the people who keep landing below it. Either can be right, but it should be one of them "+
      "on purpose.",
    tok: c => ({DECEL_REPS:many(c.co.decelReps,"AE"), DECEL_VERB:c.co.decelReps===1?"was":"were",
      DECEL_PEOPLE:c.co.decelReps===1?"one person":cnt(c.co.decelReps)+" people", DECEL_SAVED:money(c.co.decelSaved),
      CLOSEST_GAP: moneyK(c.p.qQuota*c.p.decel.thr -
        Math.max(...c.S.aes.filter(a=>a.belowDecel).map(a=>a.closed||0)))}) }
  ];

/* ===========================================================================
   CONTEXT BUILDERS
   Each persona's findings read one subject. This is where the subject and
   everything derived from it is assembled, once, before any finding runs.
   =========================================================================== */
  const strategicShare = deals => {
    const tot = deals.reduce((s,d)=>s+d.acv,0);
    return tot ? deals.filter(d=>d.tier==="strategic").reduce((s,d)=>s+d.acv,0)/tot : 0;
  };
  /* A rep's product mix is smoothed toward the plan's 20% exactly as their win
     rate is smoothed toward the plan's, and for the same reason: three deals, two
     of them strategic, is not a 58% leaning, it is three deals. K_MIX is the
     weight of the prior in deals, so eight closed sits halfway to their own mix
     and thirty sits almost entirely on it. The company's own share needs no
     smoothing, it is hundreds of deals. */
  const K_MIX = 8;
  const smoothShare = (deals, base) => {
    const n = deals.length;
    return (strategicShare(deals)*n + K_MIX*base) / (n + K_MIX);
  };

  function ctxAE(p,L,S,a){
    const mine = S.deals.won.filter(d=>d.rep===a.name);
    const all  = S.deals.won;
    // The closed-quarter view of coverage, and the only honest one available.
    // Deal size is drawn independently of outcome and close timing runs off one
    // company curve, so "you lost the big ones" and "you closed late" are both
    // noise. What IS modelled per rep is the win rate and the pipeline worked,
    // and those two answer the question that matters at quarter end: was this a
    // pipeline problem or a conversion problem.
    const lostMine   = S.deals.lost.filter(d=>d.rep===a.name);
    const lostValue  = lostMine.reduce((s,d)=>s+d.acv,0);
    const worked     = a.closed + lostValue + a.openRaw;
    const workedCount= mine.length + lostMine.length + a.openCount;
    const topWon     = mine.slice().sort((x,y)=>y.acv-x.acv)[0] || null;
    // The rep's team AS OF THIS WEEK. The roster record carries the team's
    // finished-quarter attainment, and printing that beside a gap measured today
    // put "your team is at 111%" next to "$969K away" on the same card.
    const team = S.teams.find(t=>t.members.some(m=>m.name===a.name)) || null;
    return Object.assign({p,L,S,a, team, subject:a, hold:p.r.CLAW==="CLAW_HOLDBACK",
      tier:{mine:smoothShare(mine, 0.20), team:strategicShare(all), deals:mine.length},
      // Which line is actually in play for this rep. Once quota is out of reach at
      // their own close rate, the reduced-rate line is the one still worth money,
      // and it is worth more per deal than the gap to a quota they cannot hit.
      decelLine: p.decel.thr===null ? null : p.qQuota*p.decel.thr,
      toLine: p.decel.thr===null ? 0 : Math.max(0, p.qQuota*p.decel.thr - a.closed),
      quotaReachable: (a.closed + a.openWeighted) >= a.quota,
      worked, workedCount, lostValue, lostCount: lostMine.length, topWon,
      topWonPct: a.closed ? (topWon?topWon.acv:0)/a.closed : 0,
      needCover: 1/Math.max(.05, a.winRate),
      haveCover: worked/Math.max(1, a.quota)},
      {}, base({p,S,subject:a}));
  }

  function ctxSDR(p,L,S,d){
    const created = (L.created||[]).filter(c=>c.sdr===d.name && c.week<=S.week);
    const top = created.slice().sort((x,y)=>y.acv-x.acv)[0]||null;
    const totalV = created.reduce((s,c)=>s+c.acv,0);
    const peers = S.sdrs.filter(x=>x.name!==d.name);
    const peerWon = peers.reduce((s,x)=>s+x.attWon,0);
    const peerLost = peers.reduce((s,x)=>s+x.attLost,0);
    const peerResolved = peerWon + peerLost;
    /* Smoothed by the same estimator that smooths the SDR's own number, one
       level up. A raw peer rate is unreliable for the reason a raw personal one
       is, and on seventeen screens the peers had resolved a little and won none,
       so the prior was exactly 0%. It does not reach the page today, because the
       cards that print it are gated on the SDR having enough of their own
       evidence, but it is the same shape the AE win rate had and it is one
       gating change away from printing "against the 0% for the rest of the
       team". Fixed here rather than left as a fact about which cards happen to
       fire. */
    const K_CONV_PRIOR = 6;
    const teamConv = (peerWon + K_CONV_PRIOR*p.winRate) / (peerResolved + K_CONV_PRIOR);
    const lateStage = S.deals.open.filter(x=>x.createdByRep===d.name &&
      ["Proposal","Negotiation"].includes(x.stage)).length;
    /* The opportunities this SDR created that are still open, and how many of
       them have not moved a stage since the quarter started. Every deal now
       carries a created week and its weeks in the stage it is in, so this is
       read off the records rather than guessed at. */
    const myOpen = S.deals.open.filter(x=>x.createdByRep===d.name);
    const mySlip = myOpen.filter(x=>x.stale);
    // The share of an SDR's variable that only pays when an AE closes.
    const wonWeight = (p.sdrWeights && p.sdrWeights.won) || 0;
    /* Conversion is smoothed toward the team rate on the same argument as the AE
       win rate. Raw, it read 50% off two resolved opportunities in week 1 and
       then flapped 50, 33, 17, 14, 33, 36 across the quarter while the SDR did
       nothing differently. K_CONV of six sits halfway to their own number at six
       resolved, and the copy only calls it theirs past twice that. */
    /* Rank and the two comparison points, all on accepted opportunities, which is
       what the target counts. Sorted descending so rank 1 is the top. */
    // No comparator when there is nobody else, or when the rest of the team has
    // not resolved enough between them to carry a rate.
    const solo = S.sdrs.length===1 || peerResolved < 12;
    const rankOf = x => p.early ? x.created : x.accepted;
    const acc = S.sdrs.map(rankOf).sort((a,b)=>b-a);
    const sdrRank = acc.indexOf(rankOf(d))+1;
    const sdrMedian = !acc.length ? 0
      : acc.length%2 ? acc[(acc.length-1)/2]
      : Math.round((acc[acc.length/2-1] + acc[acc.length/2])/2);
    const sdrTop = acc.length ? acc[0] : 0;
    const K_CONV = 6;
    const resolved = d.attWon + d.attLost;
    const conv = (d.attWon + K_CONV*teamConv) / (resolved + K_CONV);
    return Object.assign({p,L,S,d, subject:d, topOpp:top, myOpenN:myOpen.length,
      mySlipN:mySlip.length, mySlipV:mySlip.reduce((a,x)=>a+x.acv,0),
      mySlipStages:[...new Set(mySlip.map(x=>x.stage))],
      mySlipMinWeeks: Math.min(99, ...mySlip.map(x=>x.weeksInStage||0)),
      mySlipExpMin: Math.min(99, ...mySlip.map(x=>x.expectedClose||99)),
      mySlipExpMax: Math.max(0, ...mySlip.map(x=>x.expectedClose||0)),
      topShare: totalV ? (top?top.acv:0)/totalV : 0,
      conv, convResolved: resolved, convFromOwn: resolved >= 2*K_CONV,
      /* The second-placed number, so the leader has somebody to be measured
         against: comparing the top of the team to the middle of it tells them
         nothing they are trying to hold off. */
      sdrSecond: acc.length>1 ? acc[1] : 0,
      sdrRank, sdrMedian, sdrTop, solo, peerResolved, rankMine: rankOf(d), rankUnit: p.early?"meetings held":"accepted opportunities",
      teamConv, lateStage, deferredShare: wonWeight,
      /* WHAT THE MEETINGS TURNED INTO, on a plan where that is the only
         conversion the view can honestly see. The deals carrying an SDR's
         name are dealt independently of their meetings, so their win rate is
         a fact about that pipeline and not about these rooms. A meeting gets
         a fortnight before it counts against anybody. Javier, 15 Oct. */
      meetRate: meetRateFor(L, S, d.name),
      meetTeamRate: meetTeamRateFor(L, S, p, d.name)}, base({p,S,subject:d}));
  }

  function ctxCS(p,L,S,k){
    const pend = L.deals.filter(x=>x.rep===k.name && x.type==="Renewal" &&
                                  (x.week==null || x.week>S.week));
    const top = pend.slice().sort((a,b)=>b.acv-a.acv)[0]||null;
    const expDeals = L.deals.filter(x=>x.type==="Expansion");
    const expW = expDeals.filter(x=>x.status==="Won").length;
    const expL = expDeals.filter(x=>x.status==="Lost").length;
    const retFull = p.csVariable*(p.csRetWeight||0)/4;   // the component, whole
    const retIfNoMore = k.atRisk>0 ? (k.atRisk-k.churned)/k.atRisk : null;
    const retNow  = E.retentionPay(retIfNoMore, retFull, p);
    /* WHAT A CSM HAS ACTUALLY EARNED, which is not what this used to print.
       retNow is the retention component IF NOTHING MORE CHURNS, a projection
       of where the book might finish, and it was being called banked: in week
       1 a CSM with nothing resolved was told $3,240 was hers when finishing at
       70% pays her nothing. Retention does not settle until the last renewal
       does. What is earned before then is expansion commission, on expansion
       already closed. The rest is at risk, and the projection belongs there.
       The 25% "accrued" figure beside it was invented: no plan holds back a
       quarter of CS pay. The holdback answer, where a plan carries one, pays
       80% at close and 20% once the customer sticks, which is hold82. */
    const csExpComm = k.expWon*p.csExpRate;
    const retSettled = Math.round(k.pending/1000) <= 0;
    const csEarned = csExpComm + (retSettled ? retNow : 0);
    const csHoldback = p.r.CLAW==="CLAW_HOLDBACK";
    const atRisk = (retSettled ? 0 : retNow) + k.expOpen*p.csExpRate;
    const resolvedTot = k.held+k.churned+k.pending;
    return Object.assign({p,L,S,k, subject:k, topPending:top,
      retWithTop: resolvedTot ? (k.held+k.pending)/resolvedTot : 0,
      retWithoutTop: resolvedTot ? (k.held+k.pending-(top?top.acv:0))/resolvedTot : 0,
      topPendingShare: k.pending ? (top?top.acv:0)/k.pending : 0,
      expWinRate: (expW+expL)?expW/(expW+expL):0.5,
      expRate: k.book ? k.expWon/k.book : 0,
      /* Excludes this CSM, for the same reason the SDR conversion comparator does:
         pooling everyone put their own expansion inside the number they were being
         measured against. */
      teamExpRate: (()=>{ const b=p.book-(k.book||0);
        return b>0 ? (S.company.expWon-(k.expWon||0))/b : 0; })(),
      ...(()=>{ const peers=S.css.filter(x=>x.name!==k.name);
        if (!peers.length) return {peerExpWon:0, peerExpAttain:0};
        const won=peers.reduce((s2,x)=>s2+x.expWon,0)/peers.length;
        const tgt=peers.reduce((s2,x)=>s2+x.expTarget,0)/peers.length;
        return {peerExpWon:won, peerExpAttain: tgt>0 ? won/tgt : 0};
      })(),
      backloaded: pend.length>0 && pend.every(x=>x.week==null || x.week>=QTR_WEEKS-2),
      // The whole quarter's renewal schedule, not just what is left of it.
      ...(()=>{ const all = L.deals.filter(x=>x.rep===k.name && x.type==="Renewal");
        const tot = all.reduce((s2,x)=>s2+x.acv,0);
        const late = all.filter(x=>x.week==null || x.week>=QTR_WEEKS-2);
        const lateV = late.reduce((s2,x)=>s2+x.acv,0);
        return {backHeavy: tot>0 && lateV/tot >= 0.5, backValue: lateV, backCount: late.length};
      })(),
      retFull, retNow,
      // The opening sentence for cs-s1-amber. cs-s1-whole used to share it and
      // no longer does: above the full line the pending figure is noise, and in
      // the amber band it is the money still at stake.
      greenOpen: (k.held+k.churned)===0
        ? "None of your "+E.moneyK(k.atRisk)+" renewal book has resolved yet."
        : E.moneyK(k.held)+" has renewed and "+(k.churned>0?E.moneyK(k.churned):"nothing")+
          " has churned of the "+E.moneyK(k.atRisk)+" up for renewal this quarter"+
          (k.pending>0 ? ", with "+E.moneyK(k.pending)+" still to come." : "."),
      // What one more dollar of churn costs, in commission. The component spans
      // the band between the gate and the full line, so the slope is constant
      // inside it: this is the number a CSM can actually act on.
      retIfNoMore,
      retPerK: (k.atRisk>0 && retIfNoMore!==null && retIfNoMore>=RET_FLOOR && retIfNoMore<=RET_FULL)
        ? retFull/((RET_FULL-RET_FLOOR)*k.atRisk)*1000 : 0,
      csEarned, csExpComm, csRetIfHeld: retSettled ? 0 : retNow, csRetSettled: retSettled,
      csHoldback, csPaid: csHoldback ? hold82(csEarned).paid : csEarned,
      csHeld: csHoldback ? hold82(csEarned).held : 0,
      csAtRisk: atRisk,
      csAtRiskShare: atRisk/Math.max(1, atRisk+csEarned)}, base({p,S,subject:k}));
  }

  function ctxMGR(p,L,S,t){
    /* The plan's own band table, read rather than copied. This file used to hold
       a second copy of it, and the copy had drifted: it was gated on whether the
       company had sales managers at all, which has nothing to do with what an
       SDR manager's plan looks like. */
    /* mgrWeights is keyed on span alone, and at three or fewer it hands back a
       40% personal component. That is right for an AE manager, who carries a bag
       at that size, and wrong for anybody who does not sell, who would be left
       with 40% of their variable on a component with no quota behind it and no
       reps-at-quota component either. Where the span asks for a personal
       component and the manager is not a seller, the weights fall through to the
       next band, so what the card describes is always what the manager can
       actually earn. Not reachable today, since only AE managers sell and SDR
       and CS managers need five people to exist, but that is two constants
       agreeing rather than a rule. */
    const wSpan = E.mgrWeights(t.size, t.manages);
    const sellsOwn = (S.mgrSellers||[]).some(m=>m.name===t.manager);
    const w = Object.assign({}, (wSpan.personal>0 && !sellsOwn) ? E.mgrWeights(4, t.manages) : wSpan);
    const ote = t.manages==="AE"?p.salesMgrOte : t.manages==="SDR"?p.sdrMgrOte : p.csMgrOte;
    const target = ote*p.mgrVarPct/4;
    /* The plan's rule, read rather than re-derived. This used to be
       target*w.team*min(1.3, attain): no floor, so it paid a manager whose team
       sat at 9% in week 1, and a cap where the plan runs the accelerator. */
    // Local rather than an engine export: the proof sheet builds its own E and a
    // new export there is a whole extra seam. Both constants are already here.
    /* THE PLAN'S LINE, NOT THE CONSTANT. A CS manager's team floor IS the retention
       gate, so a pulled retention lever has to move it or the manager's floor and
       their CSMs' gate stop being the same number. 28 Oct. */
    const teamFloor = t.manages==="CS" ? (p.retFloor != null ? p.retFloor : RET_FLOOR)
                                       : MGR_TEAM_FLOOR;
    const fromAttain = E.teamAttainPay(p, t.attain, target*w.team, teamFloor);
    const fromPart = E.participationPay(t.participation, target*w.part, p);
    /* The expansion component, read through the same floor-and-ramp rule the
       retention half uses, so the plan has one definition of what a team number
       pays rather than two that drift. */
    /* An early-stage plan sets no expansion target at all, so the component has
       nothing to measure. Rather than paying on a division by zero, the weight
       folds back into retention and the manager is back to two components, the
       same way hasOwn reads the seller list rather than the span. */
    const expLive = w.exp>0 && t.expTarget>0;
    if (!expLive && w.exp>0) { w.team += w.exp; w.exp = 0; }
    // Expansion keeps the 70% bar: it is a growth target, not a retention one.
    const fromExp = expLive ? E.teamAttainPay(p, t.expAttain||0, target*w.exp, MGR_TEAM_FLOOR) : 0;
    /* At three reps or fewer the plan drops the reps-at-quota component and puts
       40% of the manager's variable on their own quota, because at that size
       they are still carrying a bag. This file used to ignore that: it reported
       "$0 from reps at quota" about a component the plan had not given them, and
       left the own-quota money out of the total entirely.

       The engine now deals those managers a quarter of their own, so the number
       is real rather than proxied off team attainment.

       hasOwn asks whether this manager actually has a bag, not whether the span
       says they should. Those are two different facts held apart by two unrelated
       constants: mgrWeights gives a personal component at three or fewer, while
       only AE managers sell and SDR and CS managers need five on their team to
       exist at all. They agree today because 3 is less than 5, and nothing
       enforces it. Forced apart, a CS manager of three read "Team attainment
       carries $7,560 of it and your own quota $5,040, and neither is paying
       anything yet", every week, on 40% of her variable weighted to a component
       with no quota behind it. Reading the seller list instead makes that
       unreachable however the constants move. */
    const ownSeller = (S.mgrSellers||[]).find(m=>m.name===t.manager) || null;
    const hasPart = w.part > 0, hasOwn = w.personal > 0 && !!ownSeller;
    /* What this manager's people are called, and whether their plan has the
       thing a card is about to mention. The decelerator lives on the AE
       commission schedule and nowhere else, so an SDR manager was being told
       that every deal their SDRs close pays the reduced rate: a line that is
       not on their team's plan, about deals they do not close. */
    const people  = t.manages==="AE" ? "rep" : t.manages==="SDR" ? "SDR" : "CSM";
    /* Standing 2 judges the spread, so while the quarter runs it counts people
       against the clock and at the end against the finish line. Standing 3 and
       standing 4 keep t.participation, because that is what the component pays
       on and nothing else. */
    /* Against pace, compared as the reader sees it. 62.4% against a 62.5% pace
       is behind in the floats and identical on screen, and the card then argues
       with the two numbers it has just printed: "your team attainment is 62%
       against a 62% pace" under a heading that says the total is behind. Same
       class as the retention tie, and rounding both sides makes a visible
       contradiction impossible rather than moving it to a new boundary. */
    /* On pace for a CS team is holding RET_FULL of whatever has come up, which
       lands their attainment at the share of the book already resolved. The
       sales close curve is not their curve and never was. */
    /* Standing 2 needs enough people AND something to judge them on. A CS team
       whose book has not started coming up has no retention to read, and the
       cards were saying "held 0% of what has come up so far" about a quarter in
       which nothing had. */
    /* A tenth of the book, not merely something. On #mixed in week 3 exactly one
       renewal had resolved and it churned, so the card read "held 0% of what has
       come up so far and four of five are keeping up": a 0% that is one account
       rather than a team, beside four CSMs counted as keeping up because none of
       their book had come up at all. A rate needs a denominator worth dividing. */
    const hasSpread = t.size>=SPREAD_MIN &&
      (t.manages!=="CS" || (t.retentionRate!==null && (t.resolvedShare||0) >= 0.10));
    /* And an SDR team paces FLAT. Creating opportunities is weekly work: it does
       not pile into the last three weeks the way closing does, so judging them
       against the AE close curve called them on pace from week 3 to week 11 on a
       team that was behind every single week and finished at 95%. The card said
       "the team is going to make it" all quarter about a team that did not. */
    const paceBar = t.manages==="CS" ? (t.resolvedShare||0)
                  : t.manages==="SDR" ? (S.week/QTR_WEEKS) : S.pace;
    /* For an SDR team the question standing 1 asks has a direct answer, so it
       uses that rather than a pace proxy: at the rate they are creating, do they
       reach the target. Pace and projection disagreed at the rounding on #full
       in week 5, where 37.6% against a 38.5% bar both display as 38% and the
       card fired green, then said in its own next sentence that they land near
       244 against 250. "Going to make it" should mean they make it. */
    const sdrLands = t.manages==="SDR"
      ? Math.round((t.actual/Math.max(1,S.week))*QTR_WEEKS) : null;
    const onPace = t.manages==="SDR" ? (sdrLands >= t.target)
                 : Math.round(t.attain*100) >= Math.round(paceBar*100);
    /* Mid-quarter a CSM whose book has not come up yet is neither keeping up nor
       behind, so they leave the denominator rather than counting as fine. On
       #mixed in week 3 the card read "held 0% of what has come up so far and
       four of five are keeping up", where the 0% was the one renewal that had
       resolved and the four were people nothing had happened to. It is "none of
       one" now, which is the same fact told once. At the close every CSM has
       resolved, so this changes nothing there. */
    const judged = (t.manages==="CS" && !S.closed)
      ? t.members.filter(m=>m.resolved).length : t.size;
    const spreadN     = S.closed ? t.atQuota : t.atPace;
    const spreadShare = judged ? spreadN/judged : 0;
    /* "Only" is a judgement and it is earned at fewer than half, not at any
       number below the pay gate. It lives with the count rather than in one
       card, so every card that prints the count gets it right. */
    const spreadOnly  = spreadShare < 0.5 ? "only " : "";
    /* One clause for the count, so every card says it the same way. Zero gets
       its own form, because "only zero of eight are keeping up" is not English. */
    /* In week 13 the pace curve has reached 100%, so keeping up with the quarter
       and being at target are the same thing, and the card next to this one was
       saying "at target" about the same five people. The phrase is right in week
       5 and wrong in week 13. */
    const atTargetNow = S.closed || S.pace >= 1;
    /* The count and its verb are built together here. Every tail a card passes
       in starts with "are", and at a count of one that produced "only one of
       eight are keeping up" on three Manager cards. A card cannot conjugate a
       verb that sits in its own text against a count assembled in here, so the
       verb belongs to whoever owns the count. Zero keeps the plural, because
       "none of them are keeping up" is right. */
    const spreadSays = (tail) => {
      /* The role's own bar. An AE is at quota and an SDR or CSM at target; this
         said "at target" for all three, so AE managers read "six of eight reps
         are at target" beside cards calling the same people "at quota". */
      const raw = S.closed ? "finished "+atBar : atTargetNow ? "are "+atBar : tail;
      const phrase = spreadN===1 ? raw.replace(/^are\b/, "is") : raw;
      return spreadN===0 ? "none of them "+(S.closed ? "finished "+atBar : atTargetNow ? "are "+atBar : tail)
           /* The noun, not a bare number. "Two of your four are sitting
              between 85% and 100%" left the reader asking four of what, on
              every Manager card that passes a tail through here. No "your" in
              front of it, deliberately: for a CS manager mid-quarter the
              denominator is how many CSMs have had something come up, not how
              many they manage, and "your six CSMs" would assert a team size
              that is not theirs. */
           : spreadOnly+cnt(spreadN)+" of "+many(judged,people)+" "+phrase;
    };
    const gateN       = S.closed ? t.belowGate : t.offGatePace;
    const hasDecel = t.manages==="AE" && p.decel.thr!==null;
    const attainFloorAt = t.target*teamFloor;
    const attainGap = Math.max(0, attainFloorAt - t.actual);
    const own = ownSeller;
    const ownValue = target*w.personal;
    const fromOwn = own ? ownValue*Math.min(1.3, own.attain) : 0;
    const ranked = t.members.slice().sort((a,b)=>(b.closed||b.created||b.held||0)-
                                                 (a.closed||a.created||a.held||0));
    const n = Math.max(1, Math.round(t.size*0.25));
    const totalOut = t.members.reduce((s,m)=>s+(m.closed||m.created||m.held||0),0);
    const unit = t.manages==="AE" ? (v=>moneyK(v))
               /* An early-stage plan pays SDRs on meetings held, and the SDR's own
                  cards and the CEO's say so. The manager was told "161 accepted
                  opportunities" on #early about a team being paid on meetings. */
               : t.manages==="SDR" ? (v=>num(v)+(p.early ? " meetings" : " accepted opportunities"))
               : (v=>moneyK(v));
    /* The opening clause of all three live standing 1 cards. It lives here for
       the same reason spreadSays does: the last round of feedback landed on the
       green and left the amber and the red behind, and a clause built in one
       place cannot be fixed in one card only.
       The attainment drops out when the team has closed nothing, because "$0K of
       a target of $1.20M" has already said 0% and repeating it is the sentence
       stopping to state the obvious. */
    /* "At the team's own close rate" is an attribution, and on a team a week or
       two into the quarter it is not the team's anything. The coverage figure is
       built from each member's smoothed win rate, and those smooth toward the AE
       population, so with little resolved the number IS roughly the company's
       rate wearing the team's name. On #messy in week 1 the card said "at the
       team's own close rate" about a team that had resolved one deal, a loss.
       The number is right and reconstructable either way; only the label moves.
       Same threshold the rep card uses, twice the weight of the prior. */
    const teamResolved = t.members.reduce((n,m)=>n+(m.won||0)+(m.lost||0), 0);
    const closeRateSays = teamResolved >= 16
      ? "at the team's own close rate"
      : "at the rate this company closes";
    /* THE MANAGER SET WAS WRITTEN FOR AN AE MANAGER AND POINTED AT THREE KINDS
       OF TEAM. Standing 1 opened "Your team has $0K of a target of $1.55M" on a
       CS manager, where that figure is not a target anybody was set: it is the
       book coming up for renewal this quarter, and $0K in week 1 means none of
       it has come up yet rather than that the team is behind on something. An
       SDR manager got the same sentence about opportunities created.
       These three say what each team's number actually is. They live beside
       teamStands for the reason its own note gives: a clause built in one place
       cannot be fixed in one card only. */
    /* THE NOUNS THE MANAGER SET BORROWED FROM THE AE VIEW. "Team attainment is
       46%" and "reps at quota" were printed on CS and SDR screens, where the
       number is a share of a renewal book and a count of created opportunities.
       One place, because roughly twenty card-and-role pairs said it. */
    const attainSubject = t.manages==="AE" ? "Team attainment"
                        : t.manages==="SDR" ? (p.early ? "The team's meeting number" : "The team's creation number")
                        /* NOT "the share of the book held": standing 2 already
                           uses those words for a different denominator, the
                           share of what has RESOLVED, and the two sat one card
                           apart reading 87% and 92% of apparently the same
                           thing. 92% is that 87% measured against the 95%
                           target, which is what this component pays on, so the
                           subject says which denominator it means. */
                        : "Retention against target";
    // The same subject after "Your", built rather than patched out of the above:
    // a regex on the sentence-initial form produced "Your team's team's creation
    // number" on every SDR manager screen.
    /* The opening of all four standing 2 cards, in one place. It was written
       three times inline and once into a card's own template text, which is how
       mgr-s2-red kept saying "Your team attainment is 66% against a 46% pace" on
       a CS screen after the other three had been fixed.
       A CS team is read as a RATE, not a cumulative total. The old sentence
       paired a cumulative share with a pace curve that is not theirs, and then
       said "and none of them are keeping up", where keeping up means holding
       RET_FULL of what has resolved: two different bars in one sentence. */
    const paceSays = (closed, short) =>
      t.manages==="CS"
        ? (closed
            /* "Held 87% of the book" beside standing 1's "finished at 92%" and
               standing 3's "92% against target" is three numbers and no way to
               place them. The money says which is which: 87% is of the book,
               92% is of the target, and the target is 95% of the book. */
            /* The target came out of both. "87% against a 95% target" reads as
               87% OF the 95%, when the 87% is of the book that came up and the
               95% belongs to a different denominator. Standing 3 is where the
               target lives, and it names it. */
            /* The denominator is the new information. Standing 1 already carries
               the actual held, so the actual comes out and the figure that has
               resolved goes in, in both states. */
            ? "Your team held "+pct0(t.retentionRate)+" of the "+unit(csBook)+" that came up"
            : "Your team has held "+pct0(t.retentionRate)+" of the "+
              unit(t.members.reduce((n,m)=>n+(m.held||0)+(m.churned||0),0))+" that has come up so far")
        : (closed
            ? "Your "+attainYours+" finished"+(short?" short":"")+" at "+pct0(t.attain)
            /* The role's own pace: an SDR team creates at an even rate, so its bar
               is the share of the quarter gone, not the AE close curve. This
               printed the AE curve for SDR teams, "32% against a 24% pace" in
               week 4 when the even pace is 31%. And a tie on the whole numbers
               is said as one, like the CEO line. */
            : Math.round(t.attain*100) === Math.round(paceBar*100)
              ? "Your "+attainYours+" is right on the "+pct0(paceBar)+" pace"
              : "Your "+attainYours+" is "+pct0(t.attain)+" against a "+pct0(paceBar)+" pace");
    const attainYours = t.manages==="AE" ? "team attainment"
                      : t.manages==="SDR" ? (p.early ? "meeting number" : "creation number")
                      : "share of the book held";
    const componentName = t.manages==="AE" ? "attainment"
                        : t.manages==="SDR" ? (p.early ? "meetings" : "creation") : "retention";
    const partComponent = t.manages==="AE" ? "reps-at-quota"
                        : t.manages==="SDR" ? "SDRs-at-target" : "CSMs-at-target";
    const atBar = t.manages==="AE" ? "at quota" : "at target";
    // The same two names as the manager's component table on the plan page.
    /* The third component's name, from the same place the other two get theirs. */
    const thirdName = t.manages==="SDR" ? "Pipeline value" : "Expansion";
    const partLabel = t.manages==="AE" ? "Reps at quota"
                    : t.manages==="SDR" ? "SDRs at target" : "CSMs at target";
    // Mid-sentence the label keeps its role initials. toLowerCase() on it gave
    // "csms at target" and "sdrs at target".
    const partSentence = t.manages==="AE" ? "reps at quota"
                       : t.manages==="SDR" ? "SDRs at target" : "CSMs at target";
    const teamLabel = t.manages==="AE" ? "Team attainment"
                    : t.manages==="SDR" ? (p.early ? "Meetings held" : "Opportunities created") : "Book retained";
    const holds = t.manages==="CS" ? "has held" : t.manages==="SDR" ? (p.early ? "has held" : "has created") : "has";
    /* The CS target is RET_FULL of the book, not the book, so the sentence has
       to carry both numbers or the reader cannot place either. Naming the bar is
       the point: it is the same 95% each CSM on the team carries, which is the
       question this clause was failing to answer. */
    const csBook = t.members.reduce((n,m)=>n+(m.atRisk||0), 0);
    /* The explainer earns its place while the reader is meeting the number and
       stops earning it after that, the same week-five line the early note uses.
       Past that the target is a number they have already been told. */
    const ofWhat = t.manages==="CS"
                   ? " of a "+unit(t.target)+" target"+(S.week<5 && !S.closed
                       ? ", "+pct0(RET_FULL)+" of the "+unit(csBook)+" coming up for renewal" : "")
                 // The target side drops the noun: "98 accepted opportunities
                 // against a creation target of 100 accepted opportunities" says
                 // it twice in one breath.
                 : t.manages==="SDR" ? " against a "+(p.early ? "meeting" : "creation")+" target of "+num(t.target)
                 : " of a target of "+unit(t.target);
    const teamStands = () => "Your team "+holds+" "+unit(t.actual)+ofWhat+
      (Math.round(t.actual)<=0 ? "" : ", which is "+pct0(t.attain))+
      ", "+leftSays(S)+".";
    /* What is still in front of the team, and what it would mean to land it all.
       "Closing every deal of it" is an act a CS manager cannot perform: renewals
       are not deals they close, they are revenue they keep, and what caps the
       quarter is the part of the book that has already churned. */
    const churned = t.manages==="CS"
      ? t.members.reduce((n,m)=>n+(m.churned||0), 0) : 0;
    const ceilingSays = Math.round(t.open)<=0
      ? (t.manages==="CS"
          ? "The whole book has come up, so that is where the quarter lands."
          : "The team has nothing open, so that is where the quarter lands.")
      : t.manages==="CS"
        ? "There is "+unit(t.open)+" still to come up, and holding every dollar of it still leaves "+
          "the team at "+pct0(t.ceiling)+" of that target, because "+unit(churned)+" has already churned."
        : "The team has "+unit(t.open)+" open, and "+
          (t.manages==="SDR" ? "creating every one of them" : "closing every deal of it")+
          " still leaves the quarter at "+pct0(t.ceiling)+".";
    /* The gap, split the way the team can actually act on it. For an AE team the
       gap is covered by pipeline at a close rate. For a CS team it is covered by
       renewals that have not come up yet, and whatever is left of it has already
       gone: that second half is the finding, and coverage as a multiple is not. */
    /* AN SDR TEAM HAS NO CEILING, because creation is not a pipeline that
       converts: what is created IS the number. So t.ceiling equals t.attain for
       them, "ceiling below 1" just means "has not finished yet", and mgr-s1-red
       fired on every SDR team in every week from 1 to 12. On #full in week 13 it
       told a manager at 244 of 250 opportunities, with a week to go, that the
       team was not going to make it and there was nothing open to do it with.
       A ceiling is a statement about work already in flight. Only two of the
       three kinds of team have any. */
    const hasCeiling = t.manages !== "SDR";
    /* And the ceiling has to be BELOW 100 as the reader sees it. A CS book
       churns something in week 1 on every preset, so the raw ceiling drops under
       1 immediately and the red fired with "holding every dollar of it still
       leaves the quarter at 100%" in the same breath. The display-tie rule
       again: a card cannot claim a distance the screen is rounding away. */
    const shortOfCeiling = hasCeiling && Math.round(t.ceiling*100) < 100;
    /* Not "X of it is still to come up": the target is 95% of the book, so what
       is still to come up can be LARGER than the gap, and early in the quarter
       it always is. "$5.02M of the $4.77M you have to find" is arithmetic the
       reader can see is wrong. The three figures are stated side by side and no
       subset is claimed between them. */
    const gapSays = t.manages==="CS"
      ? "That leaves "+unit(t.gap)+" to find, with "+unit(t.open)+" of the book still to come up"+
        (Math.round(churned)>0
          ? ". "+unit(churned)+" has already churned and is not coming back." : ".")
      /* An SDR team has nothing in flight for the same reason it has no ceiling:
         a created opportunity IS the number, so there is no pipeline sitting
         behind the gap and no close rate to weigh it at. The card was telling a
         manager six opportunities short in week 13 that they had "0 in flight,
         which covers it 0 times over at the rate this company closes", which is
         three wrong ideas in one clause. What is left to say is the gap. */
      /* A straight-line projection, and it is honest here and nowhere else:
         creation is dealt evenly across the quarter, so the weekly rate barely
         moves (18.0, 18.8, 18.1, 18.2 on #full from week 1 to 13) and the
         projection lands within a few of the real finish. The same sentence on
         an AE team would be a lie, because their close curve is a hockey stick.
         It is also what answers "are we going to make it", which the weeks-left
         clause never did, and it takes the sting out of week 13 reading "one
         week left" when everything has already been created. */
      : t.manages==="SDR"
      ? "That leaves "+unit(t.gap)+(p.early ? " to hold, and at the rate they are booking them " :
        " to create, and at the rate they are creating ")+"they land near "+num(Math.round((t.actual/Math.max(1,S.week))*QTR_WEEKS))+"."
      : "That leaves "+unit(t.gap)+" to find, and the team has "+unit(t.open)+
        " open, which covers it "+per(t.coverage)+" times over "+closeRateSays+".";
    return Object.assign({p,L,S,t, subject:t, unit,
      // Same flag ctxAE reads, named the same, so the manager card and the rep
      // card cannot disagree about whether the plan holds anything back.
      hold: p.r.CLAW==="CLAW_HOLDBACK",
      mgrEarned: fromAttain+fromPart+fromOwn+fromExp, mgrTarget: target,
      mgrFromAttain: fromAttain, mgrFromPart: fromPart, mgrFromOwn: fromOwn, mgrFromExp: fromExp,
      hasPart, hasOwn, own, ownValue, hasExp: w.exp>0, expValue: target*w.exp, teamFloor,
      teamValue: target*w.team, partValue: target*w.part,
      people, hasDecel, attainFloorAt, attainGap, onPace, spreadN, spreadShare, spreadOnly, spreadSays, teamStands, closeRateSays, ceilingSays, gapSays, shortOfCeiling,
      hasSpread, paceBar, paceSays, thirdName, attainSubject, attainYours, componentName, partComponent, atBar, partLabel, partSentence, teamLabel, gateN,
      second: t.peerCount>1 ? S.teams.filter(x=>x.manages===t.manages)
                .sort((a,b)=>b.attain-a.attain)[1].attain : 0,
      kickValue: t.members.reduce((s,m)=>s+(m.kickerEligible===false?0:(m.comm||0)*KICK_PCT), 0),
      kickNeed: Math.max(0, t.target*KICK_LINE - t.actual),
      kickExpected: t.members.reduce((s,m)=>s+(m.openWeighted||0),0),
      teamWin: (()=>{ const w=t.members.reduce((s,m)=>s+(m.won||0),0),
        l=t.members.reduce((s,m)=>s+(m.lost||0),0); return (w+l)? w/(w+l) : p.winRate; })(),
      kickCover: (()=>{ const need=Math.max(0, t.target*KICK_LINE - t.actual);
        const openW=t.members.reduce((s,m)=>s+(m.openWeighted||0),0);
        return need ? openW/need : 0; })(),
      topContribN: n,
      topContribShare: totalOut ? ranked.slice(0,n).reduce((s,m)=>
        s+(m.closed||m.created||m.held||0),0)/totalOut : 0,
      bunched: t.members.filter(m=>(m.attain||0)>=0.85 && (m.attain||0)<1).length,
      /* The busiest and quietest rep by opportunities worked, which is what the
         workload card compares. Open deals count: they are being worked now. */
      ...(()=>{ if (t.manages!=="AE") return {workHi:null, workLo:null, workRatio:0};
        const w = t.members.map(m=>({deals:(m.won||0)+(m.lost||0)+(m.openCount||0),
          wr: m.winRateTrue || m.winRate || 0})).sort((a,b)=>b.deals-a.deals);
        const hi=w[0], lo=w[w.length-1];
        return {workHi:hi, workLo:lo, workRatio: (hi&&lo&&lo.deals>0) ? hi.deals/lo.deals : 0}; })()},
      base({p,S,subject:t}));
  }

  /* The derived figures the two function standings print, built once. */
  function ctxFunctions(p, S){
    const o = {};
    const cs = S.fn && S.fn.CS, sdr = S.fn && S.fn.SDR;
    if (cs){
      const m = cs.members;
      const book = sum(m, x=>x.atRisk||0), held = sum(m, x=>x.held||0);
      const churned = sum(m, x=>x.churned||0), pending = sum(m, x=>x.pending||0);
      const resolved = held + churned;
      const maxRet = safeDivF(held + pending, book);
      const allIn = Math.round(pending/1000) <= 0;
      Object.assign(o, {csBook:book, csChurned:churned, csPending:pending,
        csKept: safeDivF(held, book), csMaxRet: maxRet,
        csReadable: cs.retentionRate!==null && (cs.resolvedShare||0) >= 0.10,
        /* "$0K of the book still to come up" in week 13 was a sentence about
           nothing. Once the whole book has resolved it says so instead. */
        csWho: cs.size===1 ? "Your CSM" : "Your CSMs",
        csStands: allIn
          ? (cs.size===1 ? "Your CSM has" : "Your CSMs have")+" kept "+pctBar(cs.retentionRate||0)+" of the "+moneyK(book)+" renewal book "+
            "against a "+pct0(RET_FULL)+" target, and all of it has now come up."
          : (cs.size===1 ? "Your CSM has" : "Your CSMs have")+" kept "+pctBar(cs.retentionRate||0)+" of the "+moneyK(resolved)+
            " that has come up for renewal so far, against a "+pct0(RET_FULL)+" target, with "+
            moneyK(pending)+" of the "+moneyK(book)+" book still to come up.",
        csLeftSays: allIn
          ? (maxRet < RET_FLOOR ? " That is below the "+pct0(RET_FLOOR)+" where CS retention pay starts." : "")
          : maxRet >= RET_FULL
          ? " Holding every renewal still to come up would finish the book at "+pctBar(maxRet)+"."
          : " "+moneyK(churned)+" has already churned, so even holding every renewal still to come up "+
            "finishes the book at "+pctBar(maxRet)+(maxRet < RET_FLOOR
              ? ", below the "+pct0(RET_FLOOR)+" where CS retention pay starts."
              : ", short of the "+pct0(RET_FULL)+" target."),
        /* During the quarter the card read retention only, so a CS team carrying
           an expansion target had half its number missing until the close. */
        csExpOpenSays: cs.expTarget > 0
          ? (() => { const a = (cs.expWon||0)/cs.expTarget;
              /* "$0K of a $150K target, 0% against a 15% pace" said nothing twice. */
              if (Math.round((cs.expWon||0)/1000) <= 0)
                return " No expansion has closed yet against a "+moneyK(cs.expTarget)+" target, where "+
                  "the week "+S.week+" pace is "+pct0(S.pace)+".";
              return " Expansion is at "+moneyK(cs.expWon||0)+" of a "+moneyK(cs.expTarget)+" target, "+
                (Math.round(a*100)===Math.round(S.pace*100)
                  ? "right on the "+pct0(S.pace)+" pace for week "+S.week
                  : pct0(a)+" against a "+pct0(S.pace)+" pace")+"."; })()
          : "",
        csExpSays: cs.expTarget > 0
          ? " Expansion came to "+moneyK(cs.expWon)+" against a "+moneyK(cs.expTarget)+" target."
          : "",
        csAtTarget: atTargetSays(cs.atQuota, cs.size, "CSM",
          cs.expTarget > 0 ? " on both retention and expansion" : "",
          cs.expTarget > 0 ? [{name:"retention", hit:(cs.retentionRate||0) >= RET_FULL},
                              {name:"expansion", hit:(cs.expWon||0) >= cs.expTarget}] : null)});
    }
    if (sdr){
      const noun = p.early ? "meetings" : "accepted opportunities";
      const verb = p.early ? "held" : "created";
      const lands = Math.round((sdr.actual/Math.max(1,S.week))*QTR_WEEKS);
      const valued = sdr.expTarget > 0;
      const valueSays = valued
        ? " The pipeline behind them "+(S.closed ? "was" : "is")+" worth "+moneyK(sdr.expWon)+" against a "+
          moneyK(sdr.expTarget)+" target, which is "+pct0(sdr.expAttain||0)+"."
        : "";
      o.sdrLands = lands;
      o.sdrStands = S.closed
        ? (sdr.size===1 ? "Your SDR " : "Your SDRs ")+verb+" "+num(sdr.actual)+" "+noun+" against a "+num(sdr.target)+" target, which is "+
          pct0(sdr.attain)+"."+valueSays+" "+
          atTargetSays(sdr.atQuota, sdr.size, "SDR", valued ? " on both count and value" : "",
            valued ? [{name:"count", hit:(sdr.attain||0) >= 1}, {name:"value", hit:(sdr.expAttain||0) >= 1}] : null)
        : (sdr.size===1 ? "Your SDR has " : "Your SDRs have ")+verb+" "+num(sdr.actual)+" "+noun+" against a "+num(sdr.target)+
          " target, which is "+pct0(sdr.attain)+", "+leftSays(S,"words")+". At the rate they "+
          "are "+(p.early ? "booking them" : "creating")+" they land near "+num(lands)+"."+valueSays;
    }
    return o;
  }
  const safeDivF = (a,b) => b ? a/b : 0;
  /* "None of your one SDR finished at target" is a count with nothing to count
     against. A function of one is said as a person. */
  /* A function of one with two targets was told "did not finish at target on
     both count and value" when it had hit one of them. parts names the two
     and whether each was hit, so the sentence can say which. */
  const atTargetSays = (n, size, role, tail, parts) => size===1
    ? (parts && parts.length===2 && parts[0].hit!==parts[1].hit
        ? "Your "+role+" hit the "+(parts[0].hit?parts[0]:parts[1]).name+" target but not the "+
          (parts[0].hit?parts[1]:parts[0]).name+" target."
        : parts && parts.length===2 && !parts[0].hit
        ? "Your "+role+" did not finish at target on "+parts[0].name+" or "+parts[1].name+"."
        : "Your "+role+(n ? " finished at target"+tail+"." : " did not finish at target"+tail+"."))
    : (n===0 ? "None" : cnt(n).replace(/^./,x=>x.toUpperCase()))+" of your "+many(size,role)+
      " finished at target"+tail+".";
  const sum = (xs, f) => xs.reduce((a,x)=>a+(f(x)||0), 0);

  function ctxCEO(p,L,S){
    const aeTeams = S.teams.filter(t=>t.manages==="AE").sort((a,b)=>b.attain-a.attain);
    const kickOnN = aeTeams.filter(t=>(t.attain||0) >= KICK_LINE*S.pace).length;
    /* In the final week the pace is 100% and "about 110% by now" is just the
       line again, so the clause drops out. */
    const kickNowSays = S.weeksLeft<=0 ? ""
      : ", which at the "+pct0(S.pace)+" pace for week "+S.week+" means about "+
        pct0(KICK_LINE*S.pace)+" by now";
    // OBJ_RETENTION sat here as a fifth entry and is not an option. It is how a stale
    // token survived a copy audit: it looked like a real answer everywhere it appeared.
    const objLabel = {OBJ_NEWLOGO:"net-new logos", OBJ_NRR:"retention and expansion",
      OBJ_BALANCED:"balanced growth",
      OBJ_MARGIN:"profitable growth"}[p.r.OBJ] || "growth";
    /* "Expansion and renewal" counted expansion commission only. CS retention
       pay, what a CSM earns for renewing the book, was never added, so the
       existing-customer side of the split was missing most of its money: #full
       read 96% on new business where the real split is 88%, and with the
       balanced-growth line at 90%, #full, #large and #small were told "the money
       went somewhere else" by their own missing renewal pay. */
    const expComm = S.company.expWon*p.csExpRate + (S.company.csAccrued||0);
    const newShare = S.company.commSpend/Math.max(1, S.company.commSpend+expComm);
    const wantsNew = ["OBJ_NEWLOGO","OBJ_MARGIN"].includes(p.r.OBJ);
    /* Rounded, like mgr-s1's onPace, so "on pace" and the two percentages it
       prints beside each other can never disagree over a tie the reader cannot
       see. */
    const coOnPace = Math.round(S.company.attain*100) >= Math.round(S.pace*100);
    const coStands = S.company.attain>=1
      ? "The sales team has closed "+moneyK(S.company.closed)+" of a "+moneyK(S.company.quota)+
        " quota, which is already "+pct0(S.company.attain)+" of target, "+
        leftSays(S,"words")+"."
      /* A tie on the whole numbers says so. It used to widen to one decimal,
         "33.0% against a 32.9% pace", which read as an odd number, and the
         sentence does not need the difference: on pace is decided on the whole
         numbers anyway. */
      : Math.round(S.company.attain*100) === Math.round(S.pace*100)
      ? "The sales team has closed "+moneyK(S.company.closed)+" of a "+moneyK(S.company.quota)+
        " quota, which is right on the "+pct0(S.pace)+" pace for week "+S.week+"."
      : "The sales team has closed "+moneyK(S.company.closed)+" of a "+moneyK(S.company.quota)+
        " quota, which is "+pct0(S.company.attain)+" against a "+
        pct0(S.pace)+" pace for week "+S.week+".";
    /* A share of nothing is not a split. In week 1 no commission has been paid,
       and newShare fell back to 0 over 1, which printed "0% on new business and
       100% on expansion and renewal" as though money had moved. */
    const paidAny = (S.company.commSpend + expComm) > 0;
    /* Keeping pace for the open "Who produced the revenue" cards: the AE
       close curve for the week, the same bar the AE manager cards use. */
    const aePaceN = S.aes.filter(x=>(x.attain||0) >= S.pace).length;
    const aeSlowN = S.aes.filter(x=>(x.attain||0) < 0.7*S.pace).length;
    const aePaceSays = cnt(aePaceN)+" of "+many(p.aes,"AE")+" "+isAre(aePaceN)+" keeping up with the "+
      pct0(S.pace)+" pace for week "+S.week+", and "+(aeSlowN===0 ? "none is" : cnt(aeSlowN)+" "+isAre(aeSlowN))+
      " under 70% of it.";
    return Object.assign({p,L,S, co:S.company, subject:S.company, aeTeams, aePaceN, aePaceSays, kickOnN, kickNowSays,
      topTeam: aeTeams[0], bottomTeam: aeTeams[aeTeams.length-1],
      spread: aeTeams.length>1 ? aeTeams[0].attain-aeTeams[aeTeams.length-1].attain : 0,
      objLabel, newShare, objMatch: wantsNew ? newShare>=0.7 : newShare<0.9,
      coOnPace, coStands, paidAny, noCsFunction: !p.css, wantsNewObj: wantsNew,
      /* Below a quarter of the quota the ratio is a small denominator, not a
         cost, so the standing waits. Unchanged from before, named once. */
      costLive: S.company.closed > S.company.quota*0.25,
      cs: S.fn && S.fn.CS, sdr: S.fn && S.fn.SDR,
      ...ctxFunctions(p, S),
      sellerCount: S.aes.length + (S.mgrSellers||[]).length,
      /* "Sellers" only when a selling manager is in the count; otherwise the
         people are AEs and the CEO view now has CSMs and SDRs on it too. */
      sellerNoun: (S.mgrSellers||[]).length ? "seller" : "AE",
      /* Soft quota: the company well over AND most of the sellers over. Either
         alone is something else, a few stars or a slow team that nearly got
         there. The simulator holds company attainment near 105% by design, so
         no preset reaches this; it is here so the tool does not certify a soft
         quota as sound when a real plan produces one. */
      softQuota: S.company.attain >= SOFT_ATTAIN &&
        S.company.repsAboveQuota >= 0.6*(S.aes.length + (S.mgrSellers||[]).length),
      accelFree: S.company.salesCost - S.company.accelCost,
      /* The cost figure beside its ceiling, widened to two decimals only when
         one decimal would print it identical to the ceiling it is past. */
      costSays: pct(S.company.salesCost)===pct(p.guardrail) && S.company.salesCost!==p.guardrail
        ? (S.company.salesCost*100).toFixed(2)+"%" : pct(S.company.salesCost),
      },
      base({p,S,subject:S.company}));
  }

/* --------------------------------------------------------------------------
   RESOLVE
   Renders one finding against one context. Returns the sentence with its
   tokens filled, whether it fired, and any token it could not resolve, which
   is the whole reason the proof sheet exists.
   -------------------------------------------------------------------------- */
  /* Before week five a red is HELD AT AMBER. Held means recoloured, not hidden.
     Four findings used to carry their own week>=5 gate in the condition, which
     removed the card entirely: a rep sitting under the reduced-rate line in week
     two was told nothing at all, and then met two reds at once in week five. The
     hold belongs here, in one place, so the finding still reports what is true
     and only the colour waits for the calendar to earn it. */
  /* This used to open "Nobody is at quota in week {{WEEK}}", asserted as a fact
     and never checked against one. On an enterprise motion a rep can clear a
     quarterly quota on a single deal in week 2, so the line was contradicting
     the card it was appended to: ae-s1-past, all three mgr-s1 variants and
     ceo-s1-red carried it on 98 screens where somebody was in fact at quota,
     and adding "Who produced it" to the list below put it directly after a
     sentence reading "Four of 16 reps are at quota". The pacing half was always
     the useful half and is always true, so the claim comes out and the calendar
     stays. The SDR line keeps its own wording: creation paces flat, so nobody
     genuinely is on target in the opening weeks, checked across every preset. */
  const EARLY_LINE = " It is week {{WEEK}}, and most of this quarter "+
    "closes in the last three weeks.";
  // An SDR's number does not close, it accumulates, and creation paces flat by
  // design. The second half of the line above is simply not true for them, and it
  // contradicts the sentence it lands after.
  const EARLY_LINE_SDR = " Nobody is on target in week {{WEEK}}.";
  /* A CS team got the AE line, "most of this quarter closes in the last three
     weeks", and renewals do not bunch at the end: they come up evenly across
     the quarter, which is how the renewal timing was fixed. What is true of a
     CS team in the opening weeks is that most of its book is still ahead. */
  const EARLY_LINE_CS = " It is week {{WEEK}}, and most of the book has not come up for renewal yet.";
  function resolveFinding(f, c){
    let fired=false, err=null;
    try { fired = !!f.fires(c); } catch(e){ err = "condition: "+e.message; }
    let toks = {};
    try { toks = Object.assign({}, c, f.tok(c)); } catch(e){ err = err || ("tokens: "+e.message); }
    const missing = [];
    const fill = s => s.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m,k)=>{
      const v = toks[k];
      if (v===undefined || v===null || (typeof v==="number" && !isFinite(v))){ missing.push(k); return m; }
      return String(v);
    });
    // Before week five a red is held at amber and the standing that reports the
    // calendar says so out loud.
    const early = c.WEEK<5;
    /* Most findings carry one tone, because the condition that fires them IS
       the judgement. A few report rather than judge, and for those the colour
       has to come from what they found: mgr-s4 sat on green at 51% with nothing
       earned, directly under a red saying neither half was paying. toneBy is
       evaluated against the same context the tokens get. */
    const written = f.toneBy ? f.toneBy(c) : f.tone;
    const tone  = (early && written==="bad") ? "warn" : written;
    /* THE SENTENCE COMES OUT OF THE LOOKUP TABLE, not off the object. The
       application the mandate describes reads its copy from
       commission_rules.json as data, and this is the one line that makes that
       true: every finding the tool prints is resolved from the table.
       The sentences are still AUTHORED here, beside the condition that fires
       them and the comment explaining the wording, which is the only sane place
       for them. `make-rules.js` extracts them into the table rather than
       retyping them, so what ships is character for character what this file
       holds, and `findings-copy-check.js` fails if the two ever disagree.
       Same arrangement as the engine: authored in one readable place,
       generated into the artifact that ships, verified equal. */
    let text = copyFor(f, "text");
    // "Who produced it" is deliberately NOT in this list: every card in that
    // standing is closed-state, so none of them can reach week five.
    // mgr-s1-red is the exception inside its own standing: the line says most of
    // the quarter is still to close, which softens a card whose whole point is
    // that everything still to come cannot get there.
    if (early && f.id!=="mgr-s1-red" && f.id!=="ceo-s1-open-red"
        && /Where you stand|Is the team going to make it|Is the sales number going to land/.test(f.standing||"")
        && !/nothing has closed for you yet/.test(text))
  /* Routed by whose number the card is about, not by the card's id prefix.
    // A manager OF SDRs was getting the AE line, "most of this quarter closes in
    // the last three weeks", about a team whose work does not close at all. */
    text += (/^sdr-/.test(f.id) || (c.t && c.t.manages==="SDR")) ? EARLY_LINE_SDR
          : (c.t && c.t.manages==="CS") ? EARLY_LINE_CS
          : EARLY_LINE;
    // A count token that lands at the start of a sentence used to print lower
    // case: "one of two cleared quota". Capitalising after a full stop happens
    // once, here and AFTER the tokens are filled, rather than by writing two
    // versions of every sentence that can begin with a count.
    const capitalise = t => t.replace(/(^|[.!?]\s+)([a-z])/g, (m,pre,ch)=>pre+ch.toUpperCase());
    /* "Against a 8% pace" was on 33 screens, "a 88% gate" on 39 and "a 80%
       line" on 45, because the article is written into the template and the
       number arrives later. Same shape as the capitalise pass above and fixed
       the same way, once and after the tokens are filled, rather than by
       writing two articles into forty templates and hoping the next one
       remembers. The test is how the number is SPOKEN: eight, eighty, eleven
       and eighteen open on a vowel and take "an", and so does anything starting
       with an eight, including $8M and 800. A hundred does not, which is why
       110% and 180% are excluded by the digit that follows. */
    const article = t => t.replace(/\b([Aa]) (?=\$?(?:8[\d.,]*|1[18](?![\d.,]*\d)))/g,
      (m,a) => (a==="A" ? "An " : "an "));
    // A title is a label, but "The team is going to make it" is a claim about the
    // future, and at quarter end the future is over. Findings whose title only
    // works while the quarter is live carry a titleClosed; everything else keeps
    // the one title it has.
    /* And a title can be false the other way round. "The team total is hiding
       most of the team" needs a total worth hiding, and in week 1 at 9% there is
       none: the card was making the claim in its heading after the sentence
       making it had been dropped. A titleEarly runs while the quarter is too
       young for the claim, on the same week boundary the amber hold uses. */
    const titleSrc = (c.closed && f.titleClosed) ? f.titleClosed
                   : (early && f.titleEarly) ? f.titleEarly
                   : copyFor(f, "title");
    return {id:f.id, standing:f.standing, tone, toneWritten:written,
            held: early && written==="bad",
            title:article(fill(titleSrc)), text:article(capitalise(fill(text))), fired, missing, error:err};
  }

  return {AE, SDR, CS, MGR, CEO, ctxAE, ctxSDR, ctxCS, ctxMGR, ctxCEO, resolveFinding};
}

/* The contract with the engine, in one line. Callers that hold the whole engine
   object pass it straight through; callers that hand-build one read this list. */
makeFindings.DEPS = ["money", "moneyK", "pct", "pct0", "num", "commAt",
  "retentionPay", "participationPay", "teamAttainPay", "mgrWeights",
  "RET_FLOOR", "RET_FULL", "KICK_LINE", "KICK_PCT", "PARTICIPATION_TARGET",
  "MGR_TEAM_FLOOR", "QTR_WEEKS", "STALL_WEEKS"];

if (typeof module!=="undefined") module.exports = { makeFindings };
