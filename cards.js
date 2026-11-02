/* cards.js - the hover card, the "?" explainers and the download warnings.

   Rewritten 7 Oct after Javier's review. The first version put a title, a list
   of facts and a sentence of mechanics on every surface, which told the reader
   what the bar had already told them. The card now has a shape:

     the verdict, in money, in the row's own tone
     the components, as bars, because a split is a picture not a list
     the facts that are not already on the screen
     ONE forward line: the next thing that changes the number

   Attainment, pace and how a mechanic works moved out to the "?", because
   those are identical on every row and the card is for what is different
   about this one. */
(function(){
"use strict";

var A = null;

/* The same three, against the card api's live plan. See the note beside RF()
   in app.js: the cards read the frozen constants too, so a CS hover card went
   on quoting a 95% target while the lever said 87%. */
function RF(){  var E=A.E,P=A.P; return (P && P.retFloor   != null) ? P.retFloor   : E.RET_FLOOR; }
function RFU(){ var E=A.E,P=A.P; return (P && P.retFull    != null) ? P.retFull    : E.RET_FULL; }
function PT(){  var E=A.E,P=A.P; return (P && P.partTarget != null) ? P.partTarget : E.PARTICIPATION_TARGET; }

var box, pinned = null, inT = null, outT = null, over = false;
/* What the open card is about, so a click ON the card can pin that same
   subject rather than re-deriving it from the pointer. */
var lastEl = null;

/* ---------------------------------------------------------------- helpers */
var WORDS = ["no","one","two","three","four","five","six","seven","eight","nine","ten"];
function many(n, noun){
  return (n <= 10 ? WORDS[n] : String(n)) + " " + noun + (n === 1 ? "" : "s");
}
/* A count that opens a sentence. many() spells it lowercase, which is right
   mid-sentence and wrong at the front of one. */
function Many(n, noun){ var t = many(n, noun); return t.charAt(0).toUpperCase() + t.slice(1); }
function word(n){ return n <= 10 ? WORDS[n] : String(n); }
function Word(n){ var t = word(n); return t.charAt(0).toUpperCase() + t.slice(1); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>]/g, function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
function m0(v){ return A.E.money(Math.round(v || 0)); }

/* `role` sits under the name on the left. `tag` is a status and belongs on the
   right of the head, where a reader looks for one. Javier, 7 Oct. */
function head(name, role, tone, tag){
  return '<div class="hh ' + (tone || "") + '">' +
    (tag ? '<span class="tag ' + (tag.cls || "") + '">' + esc(tag.text) + '</span>' : '') +
    '<h5>' + esc(name) + '</h5>' +
    (role ? '<span class="rol">' + esc(role) + '</span>' : '') + '</div>';
}
function verdict(s){ return s ? '<p class="vd">' + esc(s) + '</p>' : ''; }
/* "VIEW AS IMANI INGRAM", AT THE FOOT OF THE CARD. It was built on the row and
   Javier moved it here, 14 Oct: "The control needs to be slightly different, I
   think the look you used I don't think works on the card."

   It does not. On the row it had to be found against a dense table, it came and
   went with the cursor, and it sat on top of the finding pills, so it needed
   enough weight to read as a control rather than a rendering fault. None of
   that holds in a card you have already moved into on purpose, which is a quiet
   white panel whose job is the numbers; a filled button in the corner becomes
   the loudest thing in it and makes the card look like it is asking for
   something. So: a hairline rule, accent text, no fill, and the whole strip is
   the hit area, which is what pays for the lighter text. One action, so there
   is no primary and secondary to tell apart, which is most of what a filled
   button is for. The full name fits here where the row only had room for the
   first. Person and manager cards only: a deal, a tile or a department is not
   somebody whose screen you can go and look at. No chevron: it was doing no
   work the words were not already doing, and it pushed the text against the
   card's edge. The text is inset to the same 13px as every other block, with
   room under it. Javier, 14 Oct. */
function foot(role, name){
  if (!role || !name) return "";
  return '<button class="cardgo" data-viewas="' + esc(role) + '" data-who="' +
    esc(name) + '">View as ' + esc(name) + '</button>';
}
/* A component is a bar, not a row of text: two halves of a manager's pay are
   two different sizes and that is the whole point of showing them. */
function comps(list){
  var max = 0;
  list.forEach(function(c){ max = Math.max(max, c[2] || c[1] || 0); });
  if (!max) max = 1;
  return '<div class="cmps">' + list.map(function(c){
    var paid = c[1] || 0, full = c[2] || paid;
    /* "of X" only while X is still ahead. Retention at 100% pays 1.2x its
       target value and a team past quota accelerates the same way, so on those
       the reference is behind the figure and reading "$3,240 of $2,700" makes
       it look like a mistake. The pale part of the bar still shows the target. */
    return '<div class="cmp"><span class="cl">' + esc(c[0]) + '</span>' +
      '<span class="cv">' + m0(paid) + (c[2] && c[2] > paid
        ? ' <em>of ' + m0(full) + '</em>' : '') + '</span>' +
      '<div class="cb"><i style="width:' + (full / max * 100).toFixed(1) + '%"></i>' +
      '<b style="width:' + (paid / max * 100).toFixed(1) + '%"></b></div></div>';
  }).join('') + '</div>';
}
/* A value can carry its own delta beside it, coloured by direction. That is
   what the pace row needed: 46% says where the line is, +5% in green says
   which side of it you are on, and one row does both. Javier, 7 Oct. */
function facts(pairs){
  var live = pairs.filter(Boolean);
  if (!live.length) return "";
  return '<dl>' + live.map(function(p){
    var v = p[1], body;
    if (v && typeof v === "object")
      body = esc(v.v) + (v.d ? ' <em class="d ' + (v.cls || "") + '">' + esc(v.d) + '</em>' : '');
    else body = esc(v);
    /* A label is escaped text unless it is explicitly handed over as {html},
       which only the attainment card's colour swatches use. Loosening esc()
       for everybody to get one swatch in is how an injection hole starts. */
    var lab = (p[0] && typeof p[0] === "object" && p[0].html !== undefined)
      ? p[0].html : esc(p[0]);
    return '<dt>' + lab + '</dt><dd' + (p[2] ? ' class="' + p[2] + '"' : '') +
      '>' + body + '</dd>'; }).join('') + '</dl>';
}
/* Bind the last two words. Every sentence on these cards is short enough that
   the final word lands alone often, and "it takes more than / one." reads as a
   mistake. This kills the whole class rather than the one sentence. */
/* "you" on your own screen, a first name anywhere else. The SDR credit line
   never uses this: that is genuinely somebody else. */
function who(name, cap){
  if (name && A.viewer === name) return cap ? "You" : "you";
  return String(name || "").split(" ")[0];
}
function widow(t){ return String(t).replace(/\s+(\S+)\s*$/, "\u00a0$1"); }
function fwd(s){ return s ? '<p class="fw">' + esc(widow(s)) + '</p>' : ''; }
function cap(s){ s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function note(s){ return s ? '<p class="nt">' + esc(widow(s)) + '</p>' : ''; }

/* ------------------------------------------------------------ the element */
function ensure(){
  if (box) return box;
  box = document.createElement("div");
  box.className = "hovcard";
  box.addEventListener("mouseenter", function(){ over = true; clearTimeout(outT); });
  box.addEventListener("mouseleave", function(){ over = false; if (!pinned) hide(80); });
  document.body.appendChild(box);
  return box;
}
function place(el){
  var r = el.getBoundingClientRect(), b = ensure().getBoundingClientRect();
  var pad = 10, left = r.right + pad;
  /* A PEOPLE-TABLE ROW NEVER FLIPS LEFT. The deal table sits to the LEFT of the
     people table at every width, and the people table's right edge is always
     too close to the window for the card to fit beside it, so the flip fired
     every time and dropped the card onto the deals the click had just
     filtered. The card right-aligns to the PEOPLE TABLE instead, which is the
     "right side of the person's table" Javier asked for and keeps it off both
     the deals and the window edge. `#tree` is only rendered by RevOps, the CEO
     and the managers, which is exactly the three views this is for; the AE,
     SDR and CS views have no people table and are parked, because there the
     deal table IS the screen and the rule will be a different one.
     Javier, 15 Oct. */
  var mgrRow = el.closest && el.closest("#tree");
  if (left + b.width > window.innerWidth - 8){
    if (mgrRow){
      var ob = document.getElementById("orgbox");
      left = ob ? ob.getBoundingClientRect().right - b.width
                : window.innerWidth - 8 - b.width;
    } else left = r.left - b.width - pad;
  }
  if (left < 8) left = 8;
  var top = r.top + r.height / 2 - b.height / 2;
  top = Math.max(8, Math.min(top, window.innerHeight - b.height - 8));
  box.style.left = Math.round(left) + "px";
  box.style.top  = Math.round(top) + "px";
}
function show(el, html, pin){
  clearTimeout(outT);
  /* An X top right, not a button at the bottom. */
  ensure().innerHTML = (pin ? '<button class="hovx" title="Close">×</button>' : '') + html;
  box.classList.add("on");
  box.classList.toggle("pinned", !!pin);
  place(el);
  pinned = pin ? el : null;
}
function hide(ms){
  clearTimeout(inT);
  outT = setTimeout(function(){
    if (over || pinned) return;
    if (box) { box.classList.remove("on"); box.innerHTML = ""; }
  }, ms === undefined ? 260 : ms);
}
function unpin(){ pinned = null; over = false; hide(0); }

/* ================================================================= CONTENT */

/* The next deal that clears this person's next line. Open deals only, the
   smallest one that does it on its own, and an honest answer when none does. */
function nextDeal(rep){
  var E = A.E, P = A.P, q = rep.quota;
  if (!q || A.S.closed) return "";
  var closed = rep.closed || 0;
  var lines = [];
  if ((P.decel || {}).thr) lines.push([P.decel.thr, "clears the " + E.pct0(P.decel.thr) + " line"]);
  lines.push([(P.accel || {}).from || 1, "takes " + who(rep.name) + " past quota"]);
  var next = lines.filter(function(l){ return closed < q * l[0]; })
                  .sort(function(a, b){ return a[0] - b[0]; })[0];
  if (!next) return "";
  var need = q * next[0] - closed;
  var mine = A.find.openFor(rep.name).sort(function(a, b){ return a.acv - b.acv; });
  var one  = mine.filter(function(d){ return d.acv >= need; })[0];
  if (one){
    var now  = E.commAt(P, closed / q) / 4;
    var then = E.commAt(P, (closed + one.acv) / q) / 4;
    return one.name + ", " + m0(one.acv) + ", week " + one.expectedClose + ". Winning it " +
      next[1] + " and takes the cheque from " + m0(now) + " to " + m0(then) + ".";
  }
  if (!mine.length) return m0(need) + " short of the line, with nothing open to close it.";
  return m0(need) + " short of the line. No single open deal covers it, and the biggest " +
    "is " + m0(mine[mine.length - 1].acv) + ".";
}

/* ---- a person -------------------------------------------------------- */
function personCard(role, m, tone){
  if (role === "CS")  return csCard(m, tone);
  if (role === "SDR") return sdrCard(m, tone);
  var E = A.E, P = A.P, S = A.S;
  var q = m.quota || P.qQuota, closed = m.closed || 0, at = m.attain || 0;
  var earned = E.commAt(P, at) / 4;
  var flat   = P.rate * closed;
  var d = P.decel || {}, ac = P.accel || {};
  var was = S.closed, v;
  if (d.thr && at < d.thr){
    v = (was ? "Paid " : "Paying ") + m0(earned) + ". " +
      (d.mult ? "The reduced rate " + (was ? "cost " : "is costing ") + m0(flat - earned) + "."
              : "Under the " + E.pct0(d.thr) + " line nothing is earned at all.");
  } else if (at >= (ac.from || 1) && ac.t1){
    v = (was ? "Paid " : "Paying ") + m0(earned) + ". The accelerator added " +
      m0(earned - flat) + ".";
  } else {
    v = (was ? "Paid " : "Paying ") + m0(earned) + " at the base " + E.pct(P.rate) + ".";
  }
  var atQ = E.commAt(P, 1) / 4;
  /* THE REP'S OWN CARD WAS THINNER THAN THEIR MANAGER'S VIEW OF THEM. A
     manager hovering an AE got win rate, coverage and stuck against the team,
     and the AE's own card got two rows. Javier, 19 Oct: "the hover on the
     views of AEs needs a line for how much money they made on expansion, and
     a line for Win rate, Coverage, Stuck, with the same wording and style the
     Sales Manager sees". Same helpers, same comparisons, so the two cards
     cannot drift apart. */
  var t = null;
  try { t = A.teamOfRep(m.name, "AE"); } catch(e){}
  var openN = 0, stale = 0;
  try { A.find.openFor(m.name).forEach(function(d){ openN++; if (d.stale) stale++; }); }
  catch(e){}
  var tw = t ? teamWin(t) : 0;
  var body = comps([["New business", earned, Math.max(earned, atQ)]].concat(
      m.expComm ? [["Expansion", m.expComm, m.expComm]] : [])) +
    facts([
      ["Closed", m0(closed) + " of " + m0(q)],
      [was ? "Finished at" : "Attainment", E.pct0(at)],
      m.expWon ? ["Expansion closed", E.moneyK(m.expWon) + " at " + E.pct(m.expRate || 0)]
               : null,
      (m.winRate !== undefined)
        ? ["Win rate", t ? {v: E.pct0(m.winRate), d: "team " + E.pct0(tw),
                            cls: m.winRate < tw * 0.8 ? "bad"
                               : m.winRate < tw ? "warn" : ""}
                        : E.pct0(m.winRate)] : null,
      (!was && m.coverage !== undefined)
        ? ["Coverage", {v: m.coverage.toFixed(1) + "x on " + E.moneyK(m.open || 0),
                        d: need(m) ? "needs " + need(m).toFixed(1) + "x" : "",
                        cls: need(m) && m.coverage < need(m) ? "bad"
                           : need(m) && m.coverage < need(m) * 1.3 ? "warn" : ""}] : null,
      (!was && openN)
        ? ["Stuck", {v: stale + " of " + openN + " open",
                     d: E.pct0(stale / openN) + " stale",
                     cls: stale / openN >= .4 ? "bad"
                        : stale / openN >= .2 ? "warn" : ""}] : null
    ]);
  /* NOT ON THE CEO'S SCREEN. "$36,000 short of the line, no single open deal
     covers it" is a thing to go and do about one rep's pipeline, and a CEO
     does not work a rep's pipeline. The card ends on its facts instead:
     `fwd("")` renders nothing at all, so there is no gap where it was.
     Javier, 15 Oct. */
  return head(m.name, role, tone) + verdict(v) + body +
         fwd(A.role === "ceo" ? "" : nextDeal(m));
}

/* ---- a CSM ----------------------------------------------------------- */
function csCard(m, tone){
  var E = A.E, c = null;
  try { c = A.FIND.ctxCS(A.P, A.L, A.S, m); } catch(e){}
  if (!c || !c.k) return head(m.name, A.roleLabel("CS"), tone) +
    verdict("No renewal book comes up this quarter.");
  var k = c.k, r = c.retIfNoMore, was = A.S.closed;
  var allowed = k.atRisk * (1 - RFU());     /* churn the full line permits */
  var toGate  = k.atRisk * (1 - RF()) - k.churned;
  var whole = r >= RFU();
  /* It had no money on it either. Retention pay comes from the context the
     findings already build; expansion pay is what the plan rates it at. */
  var retPay = c.retNow || 0, retFull = c.retFull || 0;
  var expPay = (m.expWon || 0) * (A.P.csExpRate || 0);
  var expFull = (m.expTarget || 0) * (A.P.csExpRate || 0);
  var total = retPay + expPay;
  var v = (was ? "Paid " : "Paying ") + m0(total) + ". " + (whole
    ? (was ? "Retention paid in full." : "The retention component is whole.")
    : r >= RF()
    ? (was ? "Retention did not pay in full." :
       "Retention can no longer be whole this quarter.")
    : (was ? "The gate was missed, so retention paid nothing."
           : "The gate has gone, so retention pays nothing."));
  var body = comps([
    ["Retention", retPay, retFull],
    expFull ? ["Expansion", expPay, expFull] : null
  ].filter(Boolean)) +
  facts([
    ["Up for renewal", E.moneyK(k.atRisk)],
    ["Renewed", E.moneyK(k.held)],
    /* THE ROW THAT EXPLAINS THE COLOUR. Printing what churned without printing
       what the line allows to churn is why two CS cards could read alike and
       draw different bars. Javier, 7 Oct. */
    ["Churned", (k.churned ? E.moneyK(k.churned) : "nothing") +
      " of " + E.moneyK(allowed) + " allowed", k.churned > allowed ? "over" : ""],
    /* Both of these are questions about a book that has not resolved. Once it
       has, they are noise. Javier, 8 Oct. */
    was ? null : ["Still to come", k.pending ? E.moneyK(k.pending) : "nothing"],
    was ? ["Retention", E.pct0(r)]
        : ["Retention if nothing more churns", E.pct0(r)]
  ]);
  /* Churn only accumulates, so retention-if-nothing-more-churns is the BEST
     case and it only ever falls. Once it is under the full line the component
     cannot come back, and nothing on the first version of this card said so. */
  var tail = whole
    ? (was ? "" : m0(allowed - k.churned) + " of churn left before that changes.")
    : r >= RF()
    ? (was ? "" : "Churn only accumulates, so this cannot recover. What is left to protect " +
       "is the gate, " + m0(toGate) + " of churn away.")
    : "";
  /* THE WHOLE CLASS, not the AE's line alone. The CEO suppression built
     earlier today only covered `nextDeal`, so "$32,750 of churn left before
     that changes" survived on a screen that has no business coaching one
     CSM's book. Javier, 15 Oct. */
  return head(m.name, A.roleLabel("CS"), tone) + verdict(v) + body +
         fwd(A.role === "ceo" ? "" : tail);
}

/* ---- an SDR ---------------------------------------------------------- */
function sdrCard(m, tone){
  var E = A.E, P = A.P, was = A.S.closed;
  /* It said "Finished at 114% of target" and nothing about money, which is the
     one thing a comp tool owes a rep. Same shape as the AE card. */
  var val = (P.sdrVariable || 0) / 4;
  var pay = val ? E.roleEarn(P, val, m.attain || 0) : 0;
  /* A PERCENTAGE OF WHAT. "At 74%, 26 of 35" never said what was being
     counted, and on a plan paying three ways it did not say that the other
     two existed. Javier, 15 Oct. */
  var w0 = P.sdrWeights || {}, unitN = P.sdrUnit || "accepted opportunities";
  var others = [];
  if (w0.value) others.push("pipeline created");
  if (w0.won)   others.push("deals won from it");
  var v = pay
    ? (was ? "Paid " : "Paying ") + m0(pay) +
      ((m.attain || 0) > 1 ? ". The target is cleared, so the rest came at the " +
        "accelerated rate." : " at " + E.pct0(m.attain || 0) + " of target.") +
      (others.length ? " The count is " + E.num(m.created || 0) + " " + unitN + " of " +
        E.num(m.target || 0) + ", and the plan also pays on " +
        (others.length === 2 ? others[0] + " and " + others[1] : others[0]) + "."
       : " That is " + E.num(m.created || 0) + " " + unitN + " of " +
        E.num(m.target || 0) + ".")
    : (was ? "Paid nothing." : "Paying nothing yet.");
  /* EVERY COMPONENT THE PLAN PAYS, NAMED FOR WHAT IT COUNTS. One bar called
     "Pipeline component" was wrong twice: it hid a plan that pays on up to
     three different things, and it borrowed the name of the VALUE component
     for the whole lot, which is the same collision that printed "Pipeline 30
     of 50" about a number of opportunities. Javier, 15 Oct. */
  var w = P.sdrWeights || {}, qv = (P.sdrVariable || 0) / 4, tg = m.target || 0;
  var on = function(share, got, per){
    return (!share || !per) ? 0 : E.roleEarn(P, qv * share, (got || 0) / per); };
  var bars = [];
  if (tg){
    if (w.count) bars.push([cap(P.sdrUnit || "accepted opportunities"),
                            on(w.count, m.created, tg), qv * w.count]);
    if (w.value) bars.push(["Pipeline created",
                            on(w.value, m.createdValue, tg * P.acv), qv * w.value]);
    if (w.won)   bars.push(["Deals won",
                            on(w.won, m.attWon, tg * P.winRate), qv * w.won]);
  }
  if (!bars.length) bars = [[cap(P.sdrUnit || "target"), pay, Math.max(pay, val)]];
  return head(m.name, A.roleLabel("SDR"), tone) + verdict(v) +
    comps(bars) +
    facts([
      m.unit ? [cap(m.unit), E.num(m.created || 0) + " of " + E.num(m.target || 0)] : null,
      /* THE RATE SITS UNDER THE COUNT IT IS A RATE OF, and the raw "Accepted"
         row is gone: the count row above already says how many were accepted,
         which is what the target counts. An EARLY-STAGE plan has no acceptance
         step at all, it pays for the meeting being held, so neither row
         belongs there. Javier, 15 Oct: "Meetings held and accepted as two
         different things, that must be an error". */
      (!P.early && m.acceptRate !== undefined)
        ? ["Acceptance rate", E.pct0(m.acceptRate)] : null,
      /* IT SITS WITH THE COUNT, NOT AT THE BOTTOM. Last in the list, after
         pipeline value and wins, "Needed per week" did not say per week of
         WHAT. Against the count rows it needs no label at all. Javier,
         19 Oct. */
      (!was && m.perWeek !== undefined)
        ? ["Needed per week", E.num(Math.ceil(m.perWeek))] : null,
      (w.value && tg) ? ["Pipeline created",
        E.moneyK(m.createdValue || 0) + " of " + E.moneyK(tg * P.acv)] : null,
      (w.won && tg) ? ["Deals won from it",
        E.num(m.attWon || 0) + " of " + E.num(Math.round(tg * P.winRate))] : null
    ]);
}

/* WHAT THIS PERSON EARNS, by role, and what the same components pay at
   target. The SDR row already carries `earned`; the other two are priced the
   way their own cards price them. */
function repEarned(kind, m){
  var E = A.E, P = A.P;
  try {
    if (kind === "SDR") return E.sdrEarn(P, m);
    if (kind === "CS")  return E.retentionPay(m.retention, P.csVariable * (P.csRetWeight || 0) / 4, A.P) +
      (m.expTarget ? E.roleEarn(P, P.csVariable * (1 - (P.csRetWeight || 0)) / 4,
                                (m.expWon || 0) / m.expTarget) : 0);
    return E.commAt(P, (m.closed || 0) / (m.quota || P.qQuota)) / 4;
  } catch(e){ return 0; }
}
/* Every component the plan pays this person, named for what it counts. Falls
   back to the single total on a plan with one component, which is what an AE
   has. */
function repComps(kind, m){
  var E = A.E, P = A.P, out = [];
  try {
    if (kind === "SDR"){
      var w = P.sdrWeights || {}, qv = (P.sdrVariable || 0) / 4, tg = m.target || 0;
      var on = function(share, got, per){
        return (!share || !per) ? 0 : E.roleEarn(P, qv * share, (got || 0) / per); };
      if (tg){
        if (w.count) out.push([cap(P.sdrUnit || "accepted opportunities"),
                               on(w.count, m.created, tg), qv * w.count]);
        if (w.value) out.push(["Pipeline created",
                               on(w.value, m.createdValue, tg * P.acv), qv * w.value]);
        if (w.won)   out.push(["Deals won", on(w.won, m.attWon, tg * P.winRate), qv * w.won]);
      }
    } else if (kind === "CS"){
      var retFull = (P.csVariable || 0) * (P.csRetWeight || 0) / 4,
          expFull = (P.csVariable || 0) * (P.csExpWeight || 0) / 4;
      var r = m.retention == null ? 0 : m.retention;
      try { var cx = A.FIND.ctxCS(P, A.L, A.S, m);
            if (cx && cx.retIfNoMore != null) r = cx.retIfNoMore; } catch(e){}
      out.push(["Retention", E.retentionPay(r, retFull, A.P) || 0, retFull]);
      if (m.expTarget) out.push(["Expansion",
        expFull * Math.min(1, (m.expWon || 0) / m.expTarget), expFull]);
    }
  } catch(e){ out = []; }
  if (!out.length) out = [["Commission",
    (m.earned !== undefined ? m.earned : repEarned(kind, m)) || 0, repTarget(kind, m) || 0]];
  return out;
}
function repTarget(kind, m){
  var E = A.E, P = A.P;
  try {
    if (kind === "SDR") return (P.sdrVariable || 0) / 4;
    if (kind === "CS")  return (P.csVariable || 0) / 4;
    return E.commAt(P, 1) / 4;
  } catch(e){ return 0; }
}
/* ---- the SDR's four tiles, one card each --------------------------------
   Copy approved by Javier, 18 Oct. */
function sdrTileCard(i, m, tone){
  var E = A.E, P = A.P, w = P.sdrWeights || {}, tg = m.target || 0;
  var unit = P.sdrUnit || "accepted opportunities", one = cap(unit);
  var h = function(t){ return head(t, m.name + " \u00b7 " + A.roleLabel("SDR"), tone || ""); };
  if (i === 0)
    return h("My number") +
      verdict(E.num(m.created || 0) + " of " + E.num(tg) + " " + unit + ".") +
      facts([
        [one, E.num(m.created || 0) + " of " + E.num(tg)],
        (!P.early && m.acceptRate !== undefined)
          ? ["Acceptance rate", E.pct0(m.acceptRate)] : null,
        (!A.S.closed && m.perWeek !== undefined)
          ? ["Needed per week", E.num(Math.ceil(m.perWeek))] : null,
        (w.value && tg) ? ["Pipeline created",
          E.moneyK(m.createdValue || 0) + " of " + E.moneyK(tg * P.acv)] : null,
        (w.won && tg) ? ["Deals won from it",
          E.num(m.attWon || 0) + " of " + E.num(Math.round(tg * P.winRate))] : null
      ]) +
      note("Every " + (P.sdrUnit1 || "accepted opportunity") + " counts one toward the " +
        "target, and the rate climbs once you pass it." +
        (w.value ? " This plan pays on value as well as count." : ""));
  if (i === 1){
    var earned = 0; try { earned = E.sdrEarn(P, m) || 0; } catch(e){}
    var baseQ = ((P.sdrOte || 0) - (P.sdrOte || 0) * (P.sdrVarPct || 0)) / 4,
        oteQ  = (P.sdrOte || 0) / 4, qv = (P.sdrVariable || 0) / 4;
    var on = function(share, got, per){
      return (!share || !per) ? 0 : E.roleEarn(P, qv * share, (got || 0) / per); };
    return h("Earned so far") + verdict(m0(baseQ + earned) + " of " + m0(oteQ) + " at target.") +
      facts([["Base this quarter", m0(baseQ)],
        (w.count && tg) ? [one, m0(on(w.count, m.created, tg))] : null,
        (w.value && tg) ? ["Pipeline created", m0(on(w.value, m.createdValue, tg * P.acv))] : null,
        (w.won && tg) ? ["Deals won", m0(on(w.won, m.attWon, tg * P.winRate))] : null]) +
      note("The tick is the quarter's OTE at target, so the gap is what clearing every " +
        "measure is still worth.");
  }
  /* THE SAME CARD THE AE GETS, not a sentence about rates in general. "Priced
     where you stand now" told an SDR nothing they could act on and the note
     under it described a mechanic rather than their quarter. The AE card names
     the money now, the money past the next line, and the line: so does this
     one. Javier, 18 Oct. */
  if (i === 2){
    var one1 = P.sdrUnit1 || "accepted opportunity";
    if (A.S.closed)
      return h("What the next one is worth") +
        verdict("The quarter is closed, so there is no next one.");
    var qv2 = (P.sdrVariable || 0) / 4, share = qv2 * (w.count || 1);
    var payAt = function(n){ return tg ? E.roleEarn(P, share, n / tg) : 0; };
    var got1 = m.created || 0;
    var nowOne = payAt(got1 + 1) - payAt(got1);
    /* Target is the only rate change an SDR plan has, so "past target" is a
       real line here rather than the AE's ladder of them. Already past it and
       the rate they are on IS the accelerated one, which is why that branch
       prints the same figure and says so. */
    var below = !!tg && got1 < tg;
    var thenOne = below ? payAt(tg + 1) - payAt(tg) : nowOne;
    var need = below ? tg - got1 : 0;
    /* A PLAN WITH NO ACCELERATOR HAS NO SECOND RATE, and printing "$100 now,
       and $100 once you are past target" is the same error the AE card made
       before 14 Oct: two rows with one number, telling the rep nothing. The
       step has to exist before it can be named. */
    var steps = below && Math.round(thenOne) !== Math.round(nowOne);
    /* PAST TARGET THEY ARE ALREADY ON THE HIGHER RATE. The card said "this
       plan pays the same rate above target", which is false for anyone who
       has crossed: $216 IS the accelerated rate and it is exactly double the
       $108 below. Javier, 19 Oct. The multiple is computed rather than
       written, because it is 2x on five presets and 1.5x on #mixed and
       #messy. */
    var baseRate = tg ? payAt(1) - payAt(0) : 0;
    var mult = (!below && baseRate) ? nowOne / baseRate : 0;
    /* PAST TARGET THE CARD STOPS FACING IT. The AE's own version at the top of
       its ladder says "at the top rate this plan pays" with one rate row and a
       note, and carries nothing about the step it has already cleared. Mine
       kept "rate past target" and "rate below target" after the crossing,
       which is the line Javier caught talking about target once you are past
       it. The multiple is computed, because it is double on five presets and
       one and a half times on #mixed and #messy. Copy approved 19 Oct. */
    return h("What the next one is worth") +
      verdict(!below
        ? "Every " + one1 + " from here pays " + m0(nowOne) +
          (mult >= 1.05 ? ", " + multWord(mult) + " the rate below target."
                        : ", the top rate this plan pays.")
        : !steps
        ? "One more " + one1 + " pays " + m0(nowOne) + ", and this plan pays the same " +
          "rate above target."
        : need === 1
        ? "One more " + one1 + " pays " + m0(nowOne) +
          ", and it is the one that takes you past target."
        : "One more " + one1 + " pays " + m0(nowOne) + " now, and " + m0(thenOne) +
          " once you are past target.") +
      facts([["Current rate", m0(nowOne) + " per " + one1],
        steps ? ["Rate past target", m0(thenOne) + " per " + one1] : null,
        (below && steps && need) ? ["Needed to get there", E.num(need)] : null]) +
      (!below ? note("You are past every rate step on this plan.") : "");
  }
  var meet = !!A.meetRate;
  return h(meet ? "What your meetings turn into" : "What happens to what you create") +
    verdict(meet
      ? "How many of the rooms you booked became an opportunity at all."
      : "How much of the pipeline you hand over goes on to close.") +
    note("Your plan pays the same whatever happens next. This is the number an AE seat is " +
      "decided on.");
}
/* Named rather than printed as a decimal, because "2x the rate below target"
   reads like a spreadsheet and this is a sentence a rep reads once. */
function multWord(x){
  var r = Math.round(x * 100) / 100;
  if (Math.abs(r - 2) < 0.04) return "double";
  if (Math.abs(r - 3) < 0.04) return "triple";
  if (Math.abs(r - 1.5) < 0.04) return "one and a half times";
  return (Math.round(r * 10) / 10) + " times";
}
/* ---- the CSM's tiles, one card each ------------------------------------- */
function csTileCard(i, m, tone){
  var E = A.E, P = A.P;
  var h = function(t){ return head(t, m.name + " \u00b7 " + A.roleLabel("CS"), tone || ""); };
  var risk = m.atRisk || 0, allowed = risk * (1 - RFU());
  /* Tile two is absent on a plan with no expansion component, so the cards
     after it shift up with the faces. */
  var map = [0, 1, 2, 3];
  if (!m.expTarget) map = [0, 2, 3];
  var which = map[i] === undefined ? 3 : map[i];
  if (which === 0)
    return h("What I am holding") +
      verdict(E.moneyK((m.held || 0) + (m.pending || 0)) + " of " + E.moneyK(risk) +
        " is holding.") +
      /* THE ROWS CARRY THE COLOUR, the way the AE attainment card's rows carry
         the band they name. A sentence saying "solid is renewed, light is
         still up" made the reader hold a legend in their head and look back
         at the bar. Javier, 19 Oct: "we don't need that wording, what you
         need is the colour on the line, like we do on My Attainment on AEs." */
      facts([[{html: '<span class="csw held"></span>Renewed'}, E.moneyK(m.held || 0)],
        A.S.closed ? null
          : [{html: '<span class="csw open"></span>Still up'}, E.moneyK(m.pending || 0)],
        ["Churned", E.moneyK(m.churned || 0) + " of " + E.moneyK(allowed) + " allowed",
         (m.churned || 0) > allowed ? "over" : ""]]);
  if (which === 1){
    var toLand = Math.max(0, (m.expTarget || 0) - (m.expWon || 0));
    var wksLeft = Math.max(1, (E.QTR_WEEKS || 13) - (A.S.week || 0) + 1);
    return h("What I am growing") +
      verdict(E.moneyK(m.expWon || 0) + " of " + E.moneyK(m.expTarget || 0) + " landed.") +
      facts([["Landed", E.moneyK(m.expWon || 0)],
        ["Still to land", toLand ? E.moneyK(toLand) : "nothing"],
        (A.S.closed || !toLand) ? null
          : ["Needed per week", E.moneyK(toLand / wksLeft)]]);
  }
  if (which === 2){
    var retFull = (P.csVariable || 0) * (P.csRetWeight || 0) / 4,
        expFull = (P.csVariable || 0) * (P.csExpWeight || 0) / 4;
    var ret = m.retention == null ? 0 : m.retention;
    try { var cx = A.FIND.ctxCS(P, A.L, A.S, m);
          if (cx && cx.retIfNoMore != null) ret = cx.retIfNoMore; } catch(e){}
    var retPay = 0; try { retPay = E.retentionPay(ret, retFull, A.P) || 0; } catch(e){}
    var expPay = m.expTarget ? expFull * Math.min(1, (m.expWon || 0) / m.expTarget) : 0;
    /* THE CARD AND THE TILE WERE COUNTING DIFFERENT THINGS. The face reads
       base plus components against OTE and the card read components alone, so
       "$21,672" sat above "$3,672 of $4,500" with nothing to connect them. The
       per-component denominators were wrong on top of that: retention pays
       above its at-target amount, so "$3,240 of $2,700" printed a number
       bigger than the number it was out of. The SDR card already had the right
       shape, base first and each component as money. Javier, 18 Oct. */
    var baseQ2 = ((P.csOte || 0) - (P.csVariable || 0)) / 4, oteQ2 = (P.csOte || 0) / 4;
    return h("Earned so far") +
      verdict(m0(baseQ2 + retPay + expPay) + " of " + m0(oteQ2) + " at target.") +
      facts([["Base this quarter", m0(baseQ2)],
        ["Retention", m0(retPay)],
        m.expTarget ? ["Expansion", m0(expPay)] : null,
        (!m.expTarget && P.early)
          ? ["Onboarding", E.pct0(1 - (P.csRetWeight || 0)) + " of the plan, not simulated here"]
          : null]) +
      note(m.expTarget ? "You are paid on both: holding the book, and growing it." : "");
  }
  /* THE AE'S CARD, FOR A BOOK, AND FOR BOTH COMPONENTS. A CSM has two levers,
     so this picks the same item the tile face picks: the soonest open thing in
     their book that actually pays, renewal or expansion. The rule is
     self-correcting, because when retention is outside its band every renewal
     is worth zero and the choice falls through to expansion on its own.
     Javier, 19 Oct. */
  if (A.S.closed)
    return h("What the next one is worth") +
      verdict("The quarter is closed, so there is no next one.");
  var expFull2 = (P.csVariable || 0) * (P.csExpWeight || 0) / 4;
  var LAD = A.csLadder(m);
  var perK = m.expTarget ? expFull2 / m.expTarget * 1000 : 0;
  var tail = perK ? [["Per $1,000 of expansion", m0(perK)]] : [];
  var mine2 = [];
  try { mine2 = A.find.openFor(m.name).filter(function(d){
    return d.type === "Renewal" || d.type === "Expansion"; })
    .sort(function(x, y){ return (x.expectedClose - y.expectedClose) || (y.acv - x.acv); });
  } catch(e){}
  var nx = null, pays = 0;
  for (var k2 = 0; k2 < mine2.length; k2++){
    var d2 = mine2[k2];
    var v2 = d2.type === "Renewal" ? A.csWorthAdd(LAD, d2.acv)
           : (m.expTarget ? expFull2 * Math.min(1, (d2.acv || 0) / m.expTarget) : 0);
    if (v2 > 0){ nx = d2; pays = v2; break; }
  }
  var capped = LAD && LAD.lvl >= A.csCap();
  /* THE CARD IS ABOUT ONE THING, AND IT SAYS WHICH. It never named the type,
     so "Beacon Learning at $4K comes up Wk 9" could have been either, and it
     carried the expansion rate underneath a renewal and the retention ladder
     underneath an expansion. A renewal gets the ladder rows, an expansion gets
     the expansion rows, and neither gets the other's. The per-$1,000 line is
     gone. Javier, 19 Oct. */
  if (!nx)
    return h("What the next one is worth") +
      verdict("Nothing open in your book pays more this quarter.") +
      facts([["Renewed so far", E.moneyK(LAD ? LAD.secured : 0) + " of " +
        E.moneyK(LAD ? LAD.book : 0)]]) +
      note(!LAD ? ""
        : capped
        ? "Renewed is past " + E.pct0(A.csCap()) + ", the ceiling of the retention " +
          "component, so another renewal adds nothing to it."
        : LAD.ceiling < RF()
        ? "The book can no longer reach " + E.pct0(RF()) + ", so retention is out " +
          "this quarter whatever else lands."
        : "Retention pays nothing until renewed reaches " + E.moneyK(LAD.gateAt) + ", the " +
          E.pct0(RF()) + " gate. The second mark is " + E.pct0(RFU()) + ".");
  var acct = esc(nx.account || String(nx.name || "").split(" - ")[0]);
  if (nx.type === "Renewal")
    return h("What the next one is worth") +
      verdict(acct + ", a renewal of " + E.moneyK(nx.acv || 0) + ", comes up " +
        A.weekLabel(nx.expectedClose) + ". Holding it pays " + m0(pays) + ".") +
      facts([["Comes up", A.weekLabel(nx.expectedClose)],
        ["Renewed so far", E.moneyK(LAD ? LAD.secured : 0) + " of " +
          E.moneyK(LAD ? LAD.book : 0)],
        ["Holding it pays", m0(pays)]]) +
      note(!LAD ? ""
        : capped
        ? "Renewed is past " + E.pct0(A.csCap()) + ", the ceiling of the component."
        : LAD.lvl >= RF()
        ? "Renewed is inside the band, so every renewal dollar pays until " +
          E.pct0(A.csCap()) + "."
        : "The marks on the tile are " + E.pct0(RF()) + ", where the component " +
          "starts paying, and " + E.pct0(RFU()) + ", where it pays in full.");
  return h("What the next one is worth") +
    verdict(acct + ", an expansion of " + E.moneyK(nx.acv || 0) + ", comes up " +
      A.weekLabel(nx.expectedClose) + ". Landing it pays " + m0(pays) + ".") +
    facts([["Comes up", A.weekLabel(nx.expectedClose)],
      ["Expansion landed", E.moneyK(m.expWon || 0) + " of " + E.moneyK(m.expTarget || 0)],
      ["Landing it pays", m0(pays)]]) +
    /* THE MARK NEEDS NAMING. The renewal branch explains its two dotted lines
       and this one explained nothing, so the tick sat over the fill with no
       way to tell what it was. Javier, 19 Oct. */
    note(A.S.closed
      ? "Expansion has no gate, so every dollar paid from the first one."
      : "The mark on the tile is week " + A.S.week + " pace. Expansion has no gate, so " +
        "every dollar pays from the first one.");
}
/* ---- a rep, read by their manager ---------------------------------------
   THE SAME PERSON, A DIFFERENT READER. A manager hovering one of their people
   was getting that person's own card, which answers "how am I doing" when the
   question on this screen is "where does my money move". Javier, 14 Oct: "The
   manager hover of an AE should have a Manager's lens to it."

   So: where they rank on the team, how far they are from their nearest line in
   both money and deals, their win rate against the team's, their coverage and
   how much of their pipe is stuck. And the fact no other view can carry, what
   getting them over that line is worth to the MANAGER, through team attainment
   and through the participation count. That last number is the whole reason
   this card exists rather than reusing the rep's. */
function mgrRepCard(role, m, tone){
  var E = A.E, P = A.P, S = A.S, t = A.mgrTeam, was = S.closed;
  if (!t) return personCard(role, m, tone);
  var f = A.mgrFacts(t), kind = t.manages || "AE";
  var ranked = A.mgrRank(t), n = ranked.length;
  var mine = ranked.filter(function(r){ return r.m.name === m.name; })[0] || {};
  var now = A.mgrNow(kind, m);
  /* THE RANK IS WHERE THEY STAND, NOT WHERE THEY SIT IN THE TABLE. The table is
     ordered by what is reachable, which deliberately does not tell you who is
     ahead, and that is exactly why the card carries the other one. Reading the
     table's own order back as "first of eight" said Eleanor at 67% was second
     to somebody at 65%, which is true of the order and false of the sentence.
     Javier, 14 Oct: "these are actually two different things". */
  var pos = 1;
  (t.members || []).forEach(function(x){
    if (x.name !== m.name && A.mgrNow(kind, x) > now) pos++; });

  /* WHAT THIS PERSON IS WORTH TO THE READER, and only on lines the READER is
     paid at. The first version priced the rep's NEXT RATE STEP, so a rep at
     107% got "getting them past 120% is worth $6,298 to you": 120% is an AE's
     accelerator tier and means nothing to a manager, whose team number moves
     per dollar closed, and $6,125 of that $6,298 was a participation increment
     added because the step sat above quota, for somebody already counted. The
     manager has exactly two lines on a rep: the at-target test, which is worth
     a participation step the first time it is crossed, and after that nothing
     but dollars. Javier, 15 Oct. */
  var worth = 0, lineLab = "", per100 = 0, counted = false;
  try {
    try { counted = E.atTargetTest(P, kind)(m); } catch(e){ counted = now >= 1; }
    var floor = E.mgrTeamFloor(kind, A.P);
    var teamAt = function(extra){
      return E.teamAttainPay(P, f.want ? (f.got + extra) / f.want : 0, f.pay.team, floor); };
    var teamNow = E.teamAttainPay(P, f.attain, f.pay.team, floor);
    var partStep = (!counted && f.n && f.atq < f.gate)
      ? E.participationPay((f.atq + 1) / f.n, f.pay.part, A.P) -
        E.participationPay(f.atq / f.n, f.pay.part, A.P) : 0;
    if (!was && kind === "AE"){
      if (!counted){
        lineLab = "quota";
        worth = (teamAt(Math.max(0, (m.quota || P.qQuota) - (m.closed || 0))) - teamNow) + partStep;
      } else {
        per100 = teamAt(100000) - teamNow;
      }
    } else if (!was && !counted && f.n){
      lineLab = kind === "CS" ? E.pct0(RFU()) : "target";
      worth = partStep;
    }
  } catch(e){}

  var stale = 0, openN = 0;
  try {
    A.find.openFor(m.name).forEach(function(d){ openN++; if (d.stale) stale++; });
  } catch(e){}

  /* The quantity beside the percentage, everywhere. A percentage on its own is
     the one thing none of these roles can act on. */
  var qty = kind === "CS"
    ? E.moneyK((m.held || 0) + (m.pending || 0)) + " of " + E.moneyK(m.atRisk || 0)
    : kind === "SDR"
    ? E.num(m.created || 0) + " of " + E.num(m.target || 0) + " " +
      (P.sdrUnit || "accepted opportunities")
    : E.moneyK(m.closed || 0) + " of " + E.moneyK(m.quota || P.qQuota);
  var verd = (kind === "CS"
    ? "Holding " + E.pct0(now) + " of their book"
    : (was ? "Finished at " : "At ") + E.pct0(now)) +
    ", " + qty + ".";
  return head(m.name, (kind === "SDR" ? "SDR" : kind === "CS" ? "CSM" : "AE") +
              " \u00b7 " + (t.manager || "").split(" ")[0] + "'s team", tone || "") +
    verdict(verd) +
    /* THE TWO FORWARD LINES CARRY A COLOUR. A manager scanning eight of these
       wants the problem to find them, so coverage reads against the cover this
       rep's own gap actually needs rather than a number invented here, and
       stale reads on the SHARE of their pipe rather than a raw count, which is
       the only version that compares between a rep with six open deals and one
       with sixty. Javier, 14 Oct. */
    /* THE SAME BAR THE TEAM CARD CARRIES. Javier, 15 Oct: it belongs on each
       rep they manage as well, because the consistency is the point. This one
       is the REP's own commission, not the manager's: on this card the reader
       is asking what this person is earning. */
    /* ONE BAR CALLED "COMMISSION" ON A PLAN THAT PAYS THREE WAYS. A manager
       hovering an SDR or a CSM got a single total and no way to see which
       component was carrying it or which one was dead, which is the only
       reading that tells them what to coach. The rep's own card already
       splits it; this is the same split, read by their manager. Javier,
       18 Oct. */
    comps(repComps(kind, m)) +
    fwd("Variable only. Base is not in these numbers.") +
    facts([
      ["Rank on the team", Word(pos === 1 ? "first" : ordinal(pos)) + " of " + word(n)],
      (!was && mine.gap !== undefined)
        ? ["To " + mine.step.label, E.moneyK(mine.gap) + ", " +
           (mine.deals === 1 ? "one deal" : word(mine.deals) + " deals")] : null,
      (!was && mine.worth) ? ["That is worth", m0(mine.worth) + " to them"] : null,
      (was && mine.why) ? ["How it went", mine.why] : null,
      /* A CSM'S CARD IS ABOUT A BOOK, NOT A PIPELINE. This inherited the AE
         rows, so a CS manager hovering one of their people was told how much
         of their pipe was stale and nothing about retention, how much of the
         book is left or what has churned. Javier, 15 Oct: "it has no
         reference to retention, how much is left, how much churned". */
      kind === "CS" ? ["Up for renewal", E.moneyK(m.atRisk || 0)] : null,
      kind === "CS" ? ["Renewed", E.moneyK(m.held || 0)] : null,
      kind === "CS" ? (function(){
        var allowed = (m.atRisk || 0) * (1 - RFU());
        return ["Churned", E.moneyK(m.churned || 0) + " of " + E.moneyK(allowed) +
                " allowed", (m.churned || 0) > allowed ? "over" : ""];
      })() : null,
      (kind === "CS" && !was) ? ["Still to come up", E.moneyK(m.pending || 0)] : null,
      (kind === "CS" && m.expTarget)
        ? ["Expansion", E.moneyK(m.expWon || 0) + " of " + E.moneyK(m.expTarget),
           (m.expWon || 0) < m.expTarget * (was ? 1 : (S.pace || 0)) ? "under" : ""] : null,
      /* AN SDR MANAGER WAS GETTING A RANK AND NOTHING ELSE. The AE and CS
         versions of this card carry what the manager can act on and the SDR
         one carried a league position. It now says what they have against
         their target, in the unit their plan counts, what share of what they
         log gets accepted against the team's, the other components where the
         plan has them, how their handover converts against the team's, and
         what the week needs. Javier, 15 Oct. */
      kind === "SDR" ? [cap(P.sdrUnit || "accepted opportunities"),
        E.num(m.created || 0) + " of " + E.num(m.target || 0)] : null,
      (kind === "SDR" && !P.early && m.acceptRate !== undefined)
        ? ["Acceptance rate", {v: E.pct0(m.acceptRate), d: "team " + E.pct0(teamAccept(t)),
            cls: m.acceptRate < teamAccept(t) * 0.9 ? "bad"
               : m.acceptRate < teamAccept(t) ? "warn" : ""}] : null,
      (kind === "SDR" && (P.sdrWeights || {}).value && m.target)
        ? ["Pipeline created", E.moneyK(m.createdValue || 0) + " of " +
           E.moneyK(m.target * P.acv)] : null,
      (kind === "SDR" && (P.sdrWeights || {}).won && m.target)
        ? ["Deals won from it", E.num(m.attWon || 0) + " of " +
           E.num(Math.round(m.target * P.winRate))] : null,
      /* The same step the tile reports: on a meetings plan what the view can
         see is meeting to opportunity, not the win rate of pipeline that did
         not come from these meetings. */
      (kind === "SDR" && A.meetRate)
        ? (function(){
            var mine = {}; mine[m.name] = 1;
            var r = A.meetRate(mine), tr = A.meetRateTeam(t);
            return r.seen ? ["Meetings that became opportunities",
              {v: E.pct0(r.rate), d: "team " + E.pct0(tr),
               cls: r.rate < tr * 0.8 ? "bad" : r.rate < tr ? "warn" : ""}] : null;
          })()
        : (kind === "SDR" && m.conv !== undefined)
        ? ["Converting", {v: E.pct0(m.conv), d: "team " + E.pct0(teamConv(t)),
            cls: m.conv < teamConv(t) * 0.8 ? "bad"
               : m.conv < teamConv(t) ? "warn" : ""}] : null,
      /* IT SITS WITH THE COUNT, NOT AT THE BOTTOM. Last in the list, after
         pipeline value and wins, "Needed per week" did not say per week of
         WHAT. Against the count rows it needs no label at all. Javier,
         19 Oct. */
      (kind === "SDR" && !was && m.perWeek !== undefined)
        ? ["Needed per week", E.num(Math.ceil(m.perWeek))] : null,
      /* WHY THEY DO NOT COUNT, where they do not. At-target is every measure
         the plan pays on, so an SDR at 117% of the count can still be missing
         from the gate because the wins are short, and only this card is in a
         position to say which measure it is. */
      (kind === "SDR" && !was && !counted && shortOn(m))
        ? ["Short on", shortOn(m)] : null,
      (kind !== "CS" && m.winRate !== undefined)
        ? ["Win rate", {v: E.pct0(m.winRate),
                        d: "team " + E.pct0(teamWin(t)),
                        cls: m.winRate < teamWin(t) * 0.8 ? "bad"
                           : m.winRate < teamWin(t) ? "warn" : ""}] : null,
      (!was && kind === "AE" && m.coverage !== undefined)
        ? ["Coverage", {v: m.coverage.toFixed(1) + "x on " + E.moneyK(m.open || 0),
                        d: need(m) ? "needs " + need(m).toFixed(1) + "x" : "",
                        cls: need(m) && m.coverage < need(m) ? "bad"
                           : need(m) && m.coverage < need(m) * 1.3 ? "warn" : ""}] : null,
      (!was && kind !== "CS" && openN)
        ? ["Stuck", {v: stale + " of " + openN + " open",
                     d: E.pct0(stale / openN) + " stale",
                     cls: stale / openN >= .4 ? "bad" : stale / openN >= .2 ? "warn" : ""}] : null
    ]) +
    /* The week, named by what caused it, instead of an arrow that cannot tell
       a renewal landing from an account churning. */
    (kind === "CS" ? note(csMove(m.name)) : "") +
    /* THE ANSWER IS STILL AN ANSWER WHEN IT IS NOTHING. Moving a rep past 70%
       does nothing for a manager whose team component has not reached its own
       floor, and that is the single most useful thing this card can tell them,
       so it says it rather than dropping the line. */
    /* WHAT THIS PERSON IS WORTH TO THE READER, pointed at participation rather
       than at team attainment. The team-attainment version read "getting them
       past 70% pays you nothing yet" and Javier was right that it confuses: it
       answers with a different component from the one the reader is looking at
       a person about. Participation is the component a single name moves. */
    note(was ? ""
       : worth > 0
       ? "Getting them to " + lineLab + " is worth " + m0(worth) + " to you."
       : per100 > 0
       ? "They are already in your count. From here they only move the team number, "
         + "about " + m0(per100) + " for every $100K they close."
       : counted && kind === "AE"
       ? "They are already in your count, and your team component pays nothing until the "
         + "team reaches " + E.pct0(E.mgrTeamFloor(kind, A.P)) + "."
       : f.atq >= f.gate
       ? "Your participation component is already clear at " + word(f.gate) + "."
       : "Your participation component needs " + word(f.gate - f.atq) + " more at target" +
         /* NAMED OFF THE AT-TARGET TEST, not off the attainment rank, and
            singular when one person is the whole answer. Javier, 15 Oct. */
         ((f.nextUp || []).indexOf(m.name) < 0 ? "."
          : f.nextUp.length === 1 ? ", and they are the closest."
          : ", and they are one of the closest."));
}
/* LAST WEEK'S NUMBER FOR ONE PERSON. `A.SP` is the previous week's state, the
   same source the company tile reads for its WoW arrows. Null at week one and
   at the close, where there is no movement to show. */
function prevRoster(kind){
  if (!A.SP) return null;
  return kind === "CS" ? (A.SP.css || []) : kind === "SDR" ? (A.SP.sdrs || []) : (A.SP.aes || []);
}
function prevOf(kind, name){
  var r = prevRoster(kind); if (!r) return null;
  var x = r.filter(function(y){ return y.name === name; })[0];
  if (!x) return null;
  return kind === "CS" ? (x.retention == null ? null : x.retention) : (x.attain || 0);
}
function prevUnit(kind, name){
  var r = prevRoster(kind); if (!r) return null;
  var x = r.filter(function(y){ return y.name === name; })[0];
  if (!x) return null;
  return kind === "CS" ? (x.expWon || 0) : kind === "SDR" ? (x.created || 0) : (x.closed || 0);
}
/* A RETENTION NUMBER ON ITS OWN SAYS NOTHING IN WEEK 2. 100% with the whole
   book still to come up and 100% with the book resolved are the same figure
   and opposite facts, so the untested share travels with the number. It drops
   at the close, where nothing is left to come up. Javier, 15 Oct: without it
   "the table doesn't really say anything". */
function retText(m){
  var E = A.E, v = A.mgrNow("CS", m);
  if (A.S.closed) return E.pct0(v);
  var risk = m.atRisk || 0, pend = m.pending || 0;
  return E.pct0(v) + (risk && pend ? " (" + E.pct0(pend / risk) + " still open)" : "");
}
/* AND THE WEEK'S MOVEMENT NAMES ITS CAUSE. An up arrow on retention read as
   nonsense to Javier, because the mental model is "start whole and lose from
   there". The arrow was not lying, a pending renewal landing really does move
   the number up, but it never said which had happened. Renewed and churned
   are two different events and the card says which. */
function csMove(name){
  var E = A.E, r = prevRoster("CS");
  if (!r || A.S.closed) return "";
  var was = r.filter(function(y){ return y.name === name; })[0];
  if (!was) return "";
  var now = (A.S.css || []).filter(function(y){ return y.name === name; })[0];
  if (!now) return "";
  var ren = (now.held || 0) - (was.held || 0),
      ch  = (now.churned || 0) - (was.churned || 0);
  if (ren <= 0 && ch <= 0) return "";
  var bits = [];
  if (ren > 0) bits.push(E.moneyK(ren) + " renewed");
  if (ch  > 0) bits.push(E.moneyK(ch) + " churned");
  return "Since last week: " + bits.join(", ") + ".";
}
function csMoveTeam(t){
  var E = A.E, r = prevRoster("CS");
  if (!r || A.S.closed) return "";
  var ren = 0, ch = 0, seen = false;
  (t.members || []).forEach(function(m){
    var was = r.filter(function(y){ return y.name === m.name; })[0];
    if (!was) return;
    seen = true;
    ren += (m.held || 0) - (was.held || 0);
    ch  += (m.churned || 0) - (was.churned || 0);
  });
  if (!seen || (ren <= 0 && ch <= 0)) return "";
  var bits = [];
  if (ren > 0) bits.push(E.moneyK(ren) + " renewed");
  if (ch  > 0) bits.push(E.moneyK(ch) + " churned");
  return "Since last week: " + bits.join(", ") + ".";
}
/* The cover this rep's own gap needs, from their record rather than a number
   invented here: the gap divided by what they typically win. */
function need(m){
  var q = m.quota || A.P.qQuota, gap = Math.max(0, q - (m.closed || 0));
  var wr = m.winRate || A.P.winRate || 0;
  return (gap && wr) ? (gap / wr) / Math.max(1, gap) : 0;
}
/* The team's acceptance and conversion rates, the SDR equivalents of the win
   rate a rep is measured against. */
function teamAccept(t){
  var n = 0, s = 0;
  (t.members || []).forEach(function(m){
    if (m.acceptRate === undefined) return; n++; s += m.acceptRate; });
  return n ? s / n : 0;
}
function teamConv(t){
  var n = 0, s = 0;
  (t.members || []).forEach(function(m){
    if (m.conv === undefined) return; n++; s += m.conv; });
  return n ? s / n : 0;
}
/* THE SAME QUESTION FOR EVERY ROLE: which measure is a person short on. The
   SDR version existed; a CSM at 100% retention with no expansion was simply
   told "missing". */
function missingOn(kind, m){
  var P = A.P, E = A.E;
  /* THE CHIP SAYS WHAT THE PERCENTAGE CANNOT. Beside a figure already reading
     "42% renewed", "short on retention" is the same fact twice, so the chip
     only ever reports the EXPANSION half. It also ran on the forecast while
     the figure and the test ran on renewed, which is why seven people read
     "short on expansion" and one read "short on retention and expansion" on a
     team where nobody had renewed enough. Javier, 19 Oct. */
  if (kind === "CS"){
    var retOk = A.mgrSecured("CS", m) >= RFU();
    if (!m.expTarget) return "";
    var expOk = (m.expWon || 0) >= m.expTarget;
    if (expOk) return retOk ? "at target" : "at target on expansion";
    return retOk ? "short on expansion" : "also short on expansion";
  }
  if (kind === "SDR"){ var s = shortOn(m); return s ? "short on " + s : "missing"; }
  return "missing";
}
/* WHICH MEASURE IS HOLDING THEM OUT of the manager's participation count.
   `atTargetTest` is the one definition and it tests every measure the plan
   pays on, so the answer is whichever of them is under its own line. */
function shortOn(m){
  var P = A.P, w = P.sdrWeights || {}, t = m.target || 0, out = [], cleared = 0;
  if (!t) return "";
  var test = function(live, got, bar, label){
    if (!live) return;
    if ((got || 0) >= bar) cleared++; else out.push(label);
  };
  test(w.count, m.created, t, "the count");
  test(w.value, m.createdValue, t * P.acv, "pipeline value");
  test(w.won, m.attWon, t * P.winRate, "wins");
  /* ONLY WHEN IT DISCRIMINATES. In week 6 every measure is short on every
     person, so a row saying so is noise. The row earns its place when a rep
     has CLEARED something and missed something else, which is the case a
     manager cannot see from the numbers above: at 117% of the count and still
     missing from the gate because the wins are behind. */
  if (!cleared || !out.length) return "";
  return out.length === 2 ? out[0] + " and " + out[1]
       : out.length > 2 ? out.slice(0, -1).join(", ") + " and " + out[out.length - 1]
       : out[0];
}
/* The team's own win rate, which is what a rep's is worth comparing against
   rather than the company's. */
function teamWin(t){
  var w = 0, l = 0;
  (t.members || []).forEach(function(m){ w += m.won || 0; l += m.lost || 0; });
  return (w + l) ? w / (w + l) : 0;
}

/* ---- the manager's four tile cards -------------------------------------
   Copy approved in chat 14 Oct, open and closed, written against Megan Bennett,
   Nathan Boyd and Jasmine Doyle on #full and measured off the live state rather
   than invented. The three types share every sentence; what changes is the
   measure each one reads, which is the whole design of the view. */
function mgrTileCard(i, t, tone){
  var E = A.E, P = A.P, S = A.S, was = S.closed;
  var f = A.mgrFacts(t), kind = f.kind, who = String(t.manager || "");
  var role = kind === "SDR" ? "SDR Manager" : kind === "CS" ? "CS Manager" : "Sales Manager";
  var head2 = function(ttl){ return head(ttl, who + " \u00b7 " + role, tone || ""); };
  var people = kind === "CS" ? "CSMs" : kind === "SDR" ? "SDRs" : "reps";
  var num = function(v){ return f.unit === "money" ? E.moneyK(v) : E.num(v); };

  if (i === 0){
    var hi = f.bands[0], mid = f.bands[1], lo = f.bands[2];
    var v = kind === "CS"
      ? (was ? Many(f.n, "CSM") + ". " + Word(hi[1]) + " held " + E.pct0(RFU()) +
               " or more of their book, the highest at " + E.pct0(f.hi) +
               " and the lowest at " + E.pct0(f.lo) + "."
             : Many(f.n, "CSM") + ". " + Word(hi[1]) + " are holding " + E.pct0(RFU()) +
               " or more of their book, the highest at " + E.pct0(f.hi) +
               " and the lowest at " + E.pct0(f.lo) + ".")
      : Many(f.n, kind === "SDR" ? "SDR" : "rep") + ". " +
        (hi[1] ? (was ? Word(hi[1]) + " finished at or above " : Word(hi[1]) + " are at or above ")
               : (was ? "Nobody finished at " : "Nobody is at ")) +
        (kind === "SDR" ? "target" : "quota") + ", the highest at " + E.pct0(f.hi) +
        " and the lowest at " + E.pct0(f.lo) + ".";
    /* THE LIST, NOT JUST THE BANDS. Javier, 14 Oct: this tile is the company's
       "where it came from" one level down, so its card does what that one does
       and names the people, biggest first. The bands move into the note, where
       they are a summary of the list rather than a replacement for it. */
    var ranked = (t.members || []).slice().sort(function(a, b){
      return (kind === "CS" ? (b.retention || 0) - (a.retention || 0)
                            : (b.attain || 0) - (a.attain || 0)); });
    return head2(kind === "CS" ? "Who is holding what" : "Who is where") + verdict(v) +
      /* WITH THE WEEK'S MOVEMENT, the way the company tile carries it. A list of
         where eight people stand is a roster; the same list with what moved
         since last week is a read on the team. Javier, 14 Oct: "it wasn't
         suppose to be a boring list". */
      facts(ranked.map(function(m){
        var v = A.mgrNow(kind, m), was0 = prevOf(kind, m.name);
        var d = was0 === null ? 0 : v - was0;
        /* CS carries no arrow. The movement is renewals landing and accounts
           churning, two different events that an arrow cannot tell apart, and
           it lives on the person's own card where it can say which. */
        if (kind === "CS") return [m.name, {v: retText(m), d: "", cls: ""}];
        return [m.name, {v: E.pct0(v),
                         d: (!was && d) ? arrow(d) + " " + Math.round(Math.abs(d) * 100) +
                            (Math.abs(d) * 100 < 1 ? "" : "") + " pts" : "",
                         cls: d > 0 ? "up" : ""}]; })) +
      /* Only the bands that have somebody in them. "0 above quota, 0 from 70%
         to quota, 8 below 70%" is three facts where one was wanted, and two of
         them are nothing. */
      note(f.bands.filter(function(b){ return b[1]; })
             .map(function(b, i){ var t = word(b[1]) + " " + b[0].toLowerCase();
               return i ? t : t.charAt(0).toUpperCase() + t.slice(1); }).join(", ") +
           (kind === "AE" && lo && lo[1]
             ? ", where everything they " + (was ? "closed paid " : "have closed so far pays ") +
               E.pct0(P.decel.mult || 0) + " of the rate." : ".")) +
      "";
  }

  if (i === 1){
    var pct = f.want ? f.got / f.want : 0;
    /* THE SDR UNIT IS A PROPERTY OF THE PLAN. An early-stage plan pays an SDR
       per meeting HELD, and this card was telling Ben Fischer's team they had
       "108 accepted opportunities" against a target counted in meetings. The
       engine has computed `p.sdrUnit` since the wizard was built and nothing in
       the mockup read it. The verb has to follow the noun: you accept an
       opportunity, you hold a meeting. Javier, 15 Oct. */
    var sdrNoun = P.sdrUnit || "accepted opportunities",
        sdrVerb = P.sdrVerb || "accept";
    var v1 = kind === "CS"
      ? num(f.got) + " landed against a " + num(f.want) + " team target, which is " +
        E.pct0(pct) + (was ? " of it." : ".")
      : kind === "SDR"
      ? E.num(f.got) + " " + sdrNoun + " against a " + E.num(f.want) +
        " team target, which is " + E.pct0(pct) + (was ? " of it." : ".")
      : E.moneyK(f.got) + " closed against a " + E.moneyK(f.want) +
        " team quota, which is " + E.pct0(pct) +
        (was ? " of target." : " against a " + E.pct0(S.pace) + " pace for week " + S.week + ".");
    /* WHERE THE NUMBER CAME FROM, which is a different question from who is
       where: a team at 115% carried by one person and a team at 115% evenly
       are different teams and only this card can tell them apart. Tile 1 ranks
       by how each person is doing, this one by what each person put in. */
    var unitOf = kind === "CS" ? function(m){ return m.expWon || 0; }
               : kind === "SDR" ? function(m){ return m.created || 0; }
               : function(m){ return m.closed || 0; };
    var by = (t.members || []).slice().sort(function(a, b){ return unitOf(b) - unitOf(a); });
    return head2(kind === "CS" ? "Team expansion" : "Team against target") + verdict(v1) +
      facts([was
        ? (pct >= 1 ? ["Over target", num(f.got - f.want)] : ["Short by", num(f.want - f.got)])
        : ["Still to " + (kind === "CS" ? "land" : kind === "SDR" ? sdrVerb : "close"),
           num(Math.max(0, f.want - f.got))]]
        .concat(by.map(function(m){
          var now2 = unitOf(m), b4 = prevUnit(kind, m.name);
          var d = b4 === null ? 0 : now2 - b4;
          return [m.name, {v: num(now2),
                           d: (!was && d) ? arrow(d) + " " + num(Math.abs(d)) : "",
                           cls: d > 0 ? "up" : ""}]; })));
  }

  if (i === 2 && !f.pay.part){
    /* The same slot, a different question. A manager of three or fewer has no
       participation component at all, so the gate tile was offering a threshold
       their plan does not contain and a component worth nothing. What they have
       instead is a quota of their own, and it is the larger half of their pay. */
    var oa = f.pay.ownAttain;
    return head2("My own number") +
      verdict(E.moneyK(f.pay.ownClosed) + (was ? " closed against a " : " closed so far against a ") +
        E.moneyK(f.pay.ownQuota) + " quota of your own, which is " + E.pct0(oa) +
        (was ? "." : " against a " + E.pct0(S.pace) + " pace for week " + S.week + ".")) +
      facts([[was ? "Short by" : "Still to close",
              E.moneyK(Math.max(0, f.pay.ownQuota - f.pay.ownClosed))],
             ["This component", m0(f.pay.ownPaid) + " of " + m0(f.pay.own)]]) +
      note("Your own deals are kept out of the team's number, so nothing here is " +
           "counted twice.");
  }
  if (i === 2){
    var v2 = (f.atq ? (was ? Word(f.atq) + " of your " + word(f.n) + " finished at target"
                           : Word(f.atq) + " of your " + word(f.n) + " are at target")
                    : (was ? "None of your " + word(f.n) + " finished at target"
                           : "None of your " + word(f.n) + " are at target")) +
      (was ? ", against the " + word(f.gate) + " this component needs."
           : ". The component starts paying at " + word(f.gate) + ".");
    /* The marginal person, not the whole overage: what the one who crossed
       actually bought is the number a manager can act on. */
    var step = f.pay.part && f.n
      ? E.participationPay(f.atq / f.n, f.pay.part, A.P) -
        E.participationPay(Math.max(0, f.atq - 1) / f.n, f.pay.part, A.P) : 0;
    /* NAMES AND A VERDICT EACH. A count tells a manager how far off the gate
       they are; the list tells them who. Javier, 14 Oct. */
    var test = E.atTargetTest(P, kind);
    /* THE ORDER FOLLOWS THE FIGURE ON SCREEN. It sorted CS on the forecast
       while the column printed renewed, so 88% sat below 87%. Javier would
       have found it; I found it in a screenshot of my own work. */
    var ppl = (t.members || []).slice().sort(function(a, b){
      var d = (test(b) ? 1 : 0) - (test(a) ? 1 : 0);
      var of2 = function(x){ return kind === "CS" ? A.mgrSecured("CS", x) : (x.attain || 0); };
      return d || (of2(b) - of2(a)); });
    return head2("Participation against the gate") + verdict(v2) +
      facts([["At target", f.atq + " of " + f.n], ["The gate", f.gate + " of " + f.n]]
        .concat(ppl.map(function(m){
          var ok = test(m);
          /* The verdict belongs to the PERSON, so it sits with the name rather
             than trailing the number. Javier, 14 Oct. */
          /* WHY, NOT JUST WHETHER. "100% missing" reads as a bug and is not
             one: at-target is every measure the plan pays on, so a CSM
             holding the whole book is still out if their expansion is short.
             The chip names the measure instead of leaving the manager to
             work it out from a number that looks perfect. Javier, 18 Oct. */
          var why = ok ? "at target" : missingOn(kind, m);
          /* THE CHIP IS COLOURED BY WHAT IT SAYS, not by the overall verdict.
             "AT TARGET ON EXPANSION" came out red, because the person is not
             at target overall, which reads as a contradiction of its own
             words. An empty chip renders nothing at all. */
          var chipOk = ok || why.indexOf("at target") === 0;
          return [{html: esc(m.name) + (why ? '<em class="d ' + (chipOk ? "good" : "bad") +
                         '">' + esc(why) + '</em>' : '')},
                  /* NAMED, because the people table beside this card shows the
                     same CSM at 100% and this one shows 42%. They are two
                     different questions and the word is what stops the second
                     reading as a contradiction of the first. */
                  /* THE WORD MOVES TO THE NOTE. "76% renewed" beside a name
                     and a chip is three things in a 318px row. The figure is
                     the same kind on every line, so it only needs saying
                     once. Javier, 19 Oct. */
                  E.pct0(A.mgrSecured(kind, m))]; }))) +
      note(was
        ? (f.atq >= f.gate && step > 0
            ? "The " + ordinal(f.atq) + " was worth " + m0(step) +
              ", because the component keeps climbing above the gate rather than stopping at it." +
              ((kind === "CS" && f.want)
                ? " The figure beside each name is the share of their book they held."
                : "")
            : f.atq < f.gate
            /* NO SUBSET CLAIM. "N of those also landed" says the people who
               landed expansion are among the people who held the book, and
               measured across every preset and seven weeks that is false in 10
               of 301 CSM-weeks. The two counts now stand side by side. The
               clause naming the figure replaces the live version's "share of
               their book renewed so far", which is wrong at the close because
               nothing is still to come. Javier, 19 Oct. */
            ? ((kind === "CS" && f.want)
               ? Word(f.bands[0][1]) + " held the book at " + E.pct0(RFU()) +
                 " or more, which is the figure beside each name. " +
                 (f.atq === 1 ? "One landed" : Word(f.atq) + " landed") +
                 " the expansion target, and at target means both."
               : "A " + ordinal(f.gate) + " would have been worth " + m0(f.pay.part) + ".")
            : "")
        /* BOTH HALVES ONLY WHERE THERE ARE TWO. On an early-stage plan CS is
           paid retention and onboarding with a zero expansion target, and the
           card still told the manager at target meant landing an expansion
           target that does not exist. Same condition the tile already uses to
           drop itself. Javier, 18 Oct. */
        : (kind === "CS" && f.want)
        ? "At target means both halves: the book held at " + E.pct0(RFU()) +
          " and the expansion target landed. The figure beside each name is the share of " +
          "their book renewed so far."
        : kind === "CS"
        ? "At target means the book held at " + E.pct0(RFU()) + ". This component is " +
          m0(f.pay.part) + " of your quarter and pays nothing until the " + ordinal(f.gate) +
          " CSM crosses."
        : "This component is " + m0(f.pay.part) + " of your quarter and pays nothing until the " +
          ordinal(f.gate) + " " + (kind === "SDR" ? "SDR" : "rep") + " crosses.");
  }

  /* A component with no weight is not a component. "Reps at quota $0 of $0" on
     a selling manager's card was arithmetic about something their plan does not
     have. Same rule the opening sentence already follows. */
  var rows = [];
  if (f.pay.own)  rows.push(["My own quota", m0(f.pay.ownPaid) + " of " + m0(f.pay.own)]);
  if (f.pay.team) rows.push([kind === "CS" ? "Team retention" : "Team attainment",
                             m0(f.pay.teamPaid) + " of " + m0(f.pay.team)]);
  if (f.pay.exp)  rows.push([kind === "SDR" ? "Pipeline value" : "Expansion",
                             m0(f.pay.expPaid) + " of " + m0(f.pay.exp)]);
  if (f.pay.part) rows.push([kind === "CS" ? "CSMs at target" : kind === "SDR" ? "SDRs at target"
                                            : "Reps at quota",
                             m0(f.pay.partPaid) + " of " + m0(f.pay.part)]);
  rows.push(["Base this quarter", m0(f.pay.base)]);
  var paidSomething = f.pay.total > 0;
  var only = [["your own quota", f.pay.ownPaid],
              [kind === "CS" ? "the team's retention" : "the team's number", f.pay.teamPaid],
              [kind === "SDR" ? "pipeline value" : "expansion", f.pay.expPaid],
              [kind === "CS" ? "CSMs at target" : kind === "SDR" ? "SDRs at target"
                             : "reps at quota", f.pay.partPaid]]
             .filter(function(x){ return x[1] > 0; });
  var v3 = !paidSomething
    ? (was ? "Nothing. No component reached the line it starts paying at."
           : "Nothing yet. No component has reached the line it starts paying at.")
    : only.length === 1
    ? m0(f.pay.total) + (was ? ", all of it on " : " so far, all of it on ") + only[0][0] +
      ". " + (was ? "No other component reached its line."
                  : "The others are below the line they start at.")
    : m0(f.pay.total) + (was ? " of variable against the " : " so far, against the ") +
      m0(f.pay.target) + " this plan pays at target.";
  return head2("What this pays me") + verdict(v3) + facts(rows) +
    note(!paidSomething
      ? (kind === "CS" ? "Retention starts paying at " : "Team attainment starts paying at ") +
        E.pct0(E.mgrTeamFloor(kind, A.P)) + ", and the team is at " + E.pct0(f.attain) + "."
      : (!was && f.pay.expPaid > 0 && f.pay.teamPaid === 0)
      ? "Expansion pays from the first dollar rather than at a gate, which is why it is the " +
        "only component paying anything yet."
      : (was && f.attain > 1 && f.pay.teamPaid > f.pay.team)
      ? "The team's " + E.pct0(f.attain) + " took the accelerator on the attainment component."
      : "");
}
/* Spelled, to match every other count on these cards. Past ten the digit form
   is what a reader expects anyway. */
var ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth",
           "seventh", "eighth", "ninth", "tenth"];
function ordinal(n){
  if (ORD[n]) return ORD[n];
  var s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ---- a manager ------------------------------------------------------- */
function mgrCard(t, tone){
  var E = A.E, P = A.P, was = A.S.closed;
  var mem = t.members || [], n = mem.length;
  var w = {}, teamPay = 0, partPay = 0, ownPay = 0, expPay = 0;
  var teamVal = 0, partVal = 0, ownVal = 0, expVal = 0, ownClosed = 0, ownQuota = 0;
  try {
    /* TWO BUGS, BOTH FOUND 14 Oct AND BOTH ONLY VISIBLE OFF THE AE MANAGER.
       This read raw mgrWeights, so on a plan whose third component does not
       exist the 20% that folds back into team attainment was simply dropped:
       an SDR manager on #full was paid on a 45% component where his plan says
       65%, "Paid $5,119 of $5,400" against a true $7,394 of $7,800. And the
       third component was never paid at all where it DOES exist, so a CS
       manager read "Paid $5,792, all of it on the team's number" with a fifth
       of her plan uncounted. Both rules live in the engine now and this reads
       them rather than carrying a third copy. */
    w = E.mgrFold(P, t.size || n, t.manages || "AE");
    var ote = (t.manages === "SDR") ? P.sdrMgrOte : (t.manages === "CS") ? P.csMgrOte
            : P.salesMgrOte;
    var qv = (ote || 0) * (P.mgrVarPct || 0) / 4;
    teamVal = qv * (w.team || 0); partVal = qv * (w.part || 0);
    ownVal  = qv * (w.personal || 0); expVal = qv * (w.exp || 0);
    teamPay = E.teamAttainPay(P, t.attain || 0, teamVal,
                              E.mgrTeamFloor(t.manages || "AE", A.P)) || 0;
    partPay = E.participationPay(t.participation || 0, partVal, A.P) || 0;
    expPay  = E.mgrThirdPay(P, t, expVal) || 0;
    /* A SELLING MANAGER CARRIES A QUOTA OF THEIR OWN, and on a small team it is
       the biggest single piece of their pay. Their deals are deliberately kept
       out of the team's number, so without this the card showed a team figure
       that excluded them and said nothing about the rest. The engine keeps no
       person record for a selling manager, so their production comes from the
       ledger. Javier, 8 Oct. */
    if (ownVal){
      ownQuota = P.qQuota || 0;
      A.find.wonFor(t.manager).forEach(function(d){ ownClosed += d.acv || 0; });
      ownPay = ownQuota ? E.roleEarn(P, ownVal, ownClosed / ownQuota) : 0;
    }
  } catch(e){}
  /* The gate is a percentage in the plan and a HEADCOUNT on the floor. A
     manager counts people, so print the people and leave the percentage to
     the "?". Javier, 7 Oct. */
  var gateN = Math.ceil((t.participationGate || PT()) * n);
  var parts = [];
  if (ownVal)  parts.push([ownPay,  "their own quota", "Own quota", ownVal]);
  if (teamVal) parts.push([teamPay, "the team's number", "Team number", teamVal]);
  if (expVal)  parts.push([expPay, t.manages === "SDR" ? "pipeline value" : "expansion",
                           t.manages === "SDR" ? "Pipeline value" : "Expansion", expVal]);
  if (partVal) parts.push([partPay, "reps at quota", "Reps at quota", partVal]);
  var total = parts.reduce(function(a, c){ return a + c[0]; }, 0);
  /* A plan where one component carries all the weight read "Paid $11,155:
     $11,155 on the team's number and $0 on reps at quota", which is arithmetic
     nobody needs. A half with no weight is not a half. Javier, 8 Oct. */
  /* The SENTENCE names what paid. A component that exists and paid nothing is
     still information, so it keeps its bar below, but reciting "$0 on reps at
     quota" in the opening line is arithmetic nobody needs. The first version
     filtered on WEIGHT, which only caught components the plan does not have,
     and left Javier's actual case untouched. Javier, 8 Oct. */
  var live = parts.filter(function(c){ return c[3] > 0; });
  var paying = parts.filter(function(c){ return c[0] > 0; });
  var v;
  if (!total) v = (was ? "Paid nothing. No component cleared its gate."
                       : "Paying nothing yet. No component has cleared its gate.");
  else if (paying.length === 1)
    v = (was ? "Paid " : "Paying ") + m0(total) + ", all of it on " + paying[0][1] + ".";
  else
    v = (was ? "Paid " : "Paying ") + m0(total) + ": " +
        paying.map(function(c){ return m0(c[0]) + " on " + c[1]; }).join(", ")
              .replace(/, ([^,]*)$/, " and $1") + ".";
  return head(t.manager, (t.manages || "AE") + " Manager", tone) + verdict(v) +
    comps(live.map(function(c){ return [c[2], c[0], c[3]]; })) +
    facts([
      ownVal ? ["Their own closed", m0(ownClosed) + " of " + m0(ownQuota)] : null,
      ["Team", n + (n === 1 ? " person" : " people")],
      /* TWO NUMBERS, DELIBERATELY. A CS manager's bar shows retention if
         nothing more churns, the measure their people are on. Their PAY is
         computed on team attainment, which is renewals landed against the
         whole book and therefore much lower mid-quarter. Showing only one of
         them meant the card and the bar disagreed with no explanation; showing
         only attainment is what made the bar look broken. Javier's call,
         13 Oct: the card carries both, and each says what it is for. */
      (t.csRet && t.csRet.ret !== null)
        ? ["Team retention", E.pct0(t.csRet.ret) +
            (t.csRet.pend > 0 ? " if nothing more churns"
                              : A.S.closed ? ", final" : ", nothing left to come up")]
        : null,
      ["Team attainment", E.pct0(t.attain || 0) +
        " (the floor is " + E.pct0(E.MGR_TEAM_FLOOR) + ")",
        (t.attain || 0) < E.MGR_TEAM_FLOOR ? "under" : ""],
      partVal ? ["At quota", (t.atQuota || 0) + " of " + n + ", and the gate is " + gateN,
        (t.atQuota || 0) < gateN ? "under" : ""] : null
    ]) +
    note(t.csRet && t.csRet.ret !== null
        ? "The bar shows retention. Pay is computed on attainment, which counts only the renewals that have landed."
        : (ownVal ? "Their own deals are not in the team's number." : "")) +
    fwd(A.role === "ceo" ? "" : nearestLine(t, was));
}
/* The manager's version of "the next deal": which of their people is closest
   to the quota the participation half is counting. */
function nearestLine(t, was){
  var n = t.nearest;
  if (!n || was) return "";
  if (typeof n === "string") return "Closest to quota: " + n;
  var name = n.name || n.rep;
  if (!name) return "";
  var gap = n.gap !== undefined ? n.gap
          : (n.quota && n.closed !== undefined ? n.quota - n.closed : null);
  return "Closest to the gate: " + name +
    (gap !== null ? ", " + m0(gap) + " short of quota." : ".");
}

/* ---- a department and the company ------------------------------------ */
/* THE COMPANY READS ITS OWN NUMBERS. Summing the teams excludes every selling
   manager's own production, because a selling manager stays out of their own
   team's number by design. On #small that put "$316,000 of $300,000, 105% of
   target" on a card whose own bar was amber at 97%, the missing $121K being
   the manager's. A department genuinely has nothing but the sum of its teams,
   so it keeps summing and says so. Javier, 8 Oct. */
/* The department's figures come from app.js, the same calculation its bar
   uses, so the card and the row can never disagree. The company reads its own
   number. Nothing needs explaining any more, because a department now counts
   everyone in it. */
/* "if nothing more churns" is a promise about money still to come, so it keys
   off there BEING money still to come, not off the quarter being over. A book
   can run out before week 13, and the sentence is wrong then too.
   Javier, 13 Oct. */
function retLine(ret, pend, done){
  var pc = A.E.pct0(ret);
  if (pend > 0) return "Retention is " + pc + " if nothing more churns.";
  return done ? "Retention finished at " + pc + "."
              : "Retention is " + pc + ", and nothing is left to come up.";
}

function rollCard(r, tone, isCo){
  var E = A.E, M = r.m;
  var actual = isCo ? A.S.company.closed : r.actual;
  var target = isCo ? A.S.company.quota  : r.target;
  /* Each department says what it is measured ON. The roll-up used to print
     every unit as money, so an SDR department reading 24 accepted
     opportunities out of 50 said "$24 of $50". Javier, 13 Oct. */
  /* THE QUARTER ENDS FOR THESE TWO AS WELL. A manager's card goes to "Paid
     $21,564" at the close and a rep's to "Finished at 149%", but the company
     and the departments kept reading like it was still week 6. Javier, 13 Oct. */
  var done = !!A.S.closed;
  var line = !target ? ""
    : done
      ? (actual >= target
          ? "Finished at " + E.pct0(actual / target) + " of target, " +
            E.money(actual) + " against " + E.money(target) + "."
          : "Finished at " + E.pct0(actual / target) + " of target, " +
            E.money(target - actual) + " short.")
      : E.money(actual) + " of " + E.money(target) + ", " +
        E.pct0(actual / target) + " of target.";
  var rows = [];
  if (!isCo && M && M.kind === "count"){
    line = !M.target ? ""
      : done
        ? "Finished at " + M.actual + " of " + M.target + " " + M.noun + ", " +
          E.pct0(M.actual / M.target) + " of target."
        : M.actual + " of " + M.target + " " + M.noun + ", " +
          E.pct0(M.actual / M.target) + " of target.";
  }
  if (!isCo && M && M.kind === "ret"){
    line = M.ret === null ? "Nothing has come up for renewal yet." : retLine(M.ret, M.pend, done);
    rows = [
      ["Up for renewal", E.money(M.book)],
      ["Renewed",        E.money(M.held)],
      ["Churned",        E.money(M.churn)],
      /* No row for a number that can only be zero. */
      M.pend > 0 ? ["Still to come", E.money(M.pend)] : null
    ];
  }
  /* A department nobody manages was printing "Teams 0" under a row that says
     "1 person, no manager". */
  if (!rows.length && r.teams.length) rows.push(["Teams", String(r.teams.length)]);
  rows.push(["People", String(r.people)]);
  rows.push(["Findings", (r.bad || 0) + " red, " + (r.warn || 0) + " amber"]);
  return head(r.label, "roll-up", tone) +
    verdict(line) +
    facts(rows) +
    (isCo ? "" : note("A department carries no findings of its own. " +
      (M && M.kind === "ret"
        ? "The bar is retention if nothing more churns, on the same scale as the people under it."
        : "The bar and the colour are the roll-up of the " +
          (r.teams.length ? "teams" : "people") + " under it.")));
}

/* ---- a deal ----------------------------------------------------------- */
function dealCard(d){
  var E = A.E, P = A.P;
  var rep = ownerOf(d.rep);
  var tone = d.status === "Won" ? "good" : d.status === "Lost" ? "bad"
           : d.stale ? "warn" : "";
  /* WHO ACTUALLY GETS PAID. An AE is paid on a won deal, would be paid on an
     open one, and is never paid on a lost one, so the row is absent there
     rather than reworded. An SDR is paid for sourcing the opportunity whatever
     happens to it, so their row is always past tense. The first version had
     "would pay" on both names on a LOST deal, which was wrong twice over.
     Javier, 8 Oct. */
  var pay = d.status === "Lost" ? null : marginal(rep, d);
  /* WHAT ONE DEAL IS WORTH TO THE SDR WHO SOURCED IT. The first version used
     `sdrShare`, which is the share of pipeline SDRs source, as though it were
     a commission rate, and put $5,100 on a $17,000 deal. An SDR is not paid a
     percentage of ACV at all: they carry a COUNT target, accepted
     opportunities or meetings held, and a sourced deal is one unit of it. So
     the figure is the same marginal the AE row uses, their pay with that unit
     minus their pay without it, which prices the accelerator in: $108 below
     target on #full and $216 once they are past it. Javier, 8 Oct. */
  /* EVERY COMPONENT THE DEAL MOVED, not the whole variable off the count. The
     engine now pays an SDR on up to three measures and this priced all of it as
     if the count carried everything. One opportunity moves the count by one, the
     pipeline value by its ACV, and, once it closes, the won count by one. The
     third is Javier's "except in the plans that they win money for closing":
     on a plan with a won component the sourcing SDR is paid again when the AE
     closes it, and the row has to say so. 14 Oct. */
  /* EARNED AND STILL AT STAKE ARE TWO DIFFERENT NUMBERS. An SDR banks the
     count and the pipeline value the moment the opportunity is created, so
     that part is PAID whatever happens to the deal afterwards. The won
     component is not: it is money the deal might still bring if it closes,
     which is a "would pay" until it resolves. And a deal created LAST quarter
     earned neither the count nor the value this quarter, so crediting it with
     them was simply wrong. Javier, 15 Oct. */
  var con = consequence(d, rep);
  var v = d.status === "Won"
    ? E.money(d.acv) + " closed in week " + d.week + "."
    : d.status === "Lost"
    ? E.money(d.acv) + " lost in week " + d.week + "."
    : E.money(d.acv) + " forecast for week " + d.expectedClose + ".";
  return head(d.name, "", tone, {text: d.stale ? "Stale" : d.status,
      cls: d.stale ? "warn" : d.status.toLowerCase()}) + verdict(v) +
    (con ? '<p class="cn">' + esc(con) + '</p>' : '') +
    facts([
      ["Account", d.account],
      ["Product", d.product + " (" + d.tier + ")"],
      ["Type", d.type],
      ["Owner", d.rep],
      ["Sourced", (d.createdBy === "SDR"
        ? "SDR" + (d.createdByRep ? ", " + d.createdByRep : "") : "AE") +
        ", " + A.weekLabel(d.createdWeek)],
      ["Stage", d.stage || ""],
      ["Weeks in stage", String(d.weeksInStage), d.stale ? "over" : ""],
      /* NOT ON AN SDR'S TABLE. Every row there is owned by an AE who is a
         stranger to this screen, so "Would pay Nigel Vaughan" is somebody
         else's business on a table about the SDR's own number. Javier,
         15 Oct. */
      /* EVERY PERSON THIS ROW PAYS, from one model. The AE's row still comes
         off an SDR table, where the owner is a stranger. */
      null,
      /* WHAT SOMEBODY ELSE WAS PAID IS NOT A DEAL FACT. Javier, 14 Oct: "The
         hoover card on the deals for the AE can't have the reference of how
         much it paid the SDR." Same rule as the crossing mark: a fact about
         the DEAL travels to every table, a fact about a PERSON stays on the
         screens entitled to it. A rep opening their own deal has no business
         seeing the sourcing SDR's cheque. The row survives wherever nobody is
         being viewed AS, which today is RevOps and the CEO, and on the SDR's
         own screen, where the pay is theirs. When the manager views land they
         set `viewer` too, and the question is whether a sales manager should
         see an SDR's pay; I would say no, and the rule above already gives
         that answer for free. */
      null
    ].concat(payRows(d))) +
    /* State the RULE, not what clears it, and name the colour so the sentence
       connects to the row. */
    note(d.stale ? "Amber because it has been in " + d.stage + " for " +
      many(d.weeksInStage, "week") + " and is still forecast to close this quarter. " +
      "A deal is flagged once it has sat in one stage for " +
      many(E.STALL_WEEKS, "week") + " or more." : "");
}
function ownerOf(name){
  var S = A.S, all = (S.aes || []).concat(S.sdrs || [], S.css || []);
  return all.filter(function(x){ return x.name === name; })[0] || null;
}
/* ---- ONE PAY MODEL FOR A DEAL ROW ---------------------------------------
   The card carried three ad-hoc rules bolted on at different times: one for
   the AE who owns the deal, one for the SDR who sourced it, and NONE for the
   CSM whose renewal or expansion it is. That is why the combinations read
   wrong and inconsistent across the views, why a CSM's own renewal showed
   them nothing, and why the CS table had no PAID column. Javier, 18 Oct.

   `dealPay(d)` answers one question for every role at once: for each person
   this row touches, what has it already PAID them and what WOULD it pay. A
   fourth rule beside the other three would have produced the same complaint
   again. */
function dealPay(d){
  var E = A.E, P = A.P, out = [];
  var push = function(name, role, paid, would, says){
    if (!name || (!paid && !would && !says)) return;
    out.push({name: name, role: role, paid: paid || 0, would: would || 0, says: says || ""});
  };
  /* THE OWNER. An AE banks a won deal and would bank an open one; a lost deal
     pays nobody, which is why there is no row rather than a zero. */
  var own = ownerOf(d.rep);
  if (own && own.quota){
    var m = marginal(own, d);
    if (d.status === "Won")       push(d.rep, "AE", m, 0);
    else if (d.status === "Open") push(d.rep, "AE", 0, m);
  }
  /* THE CSM. A renewal holds the book they are measured on and an expansion
     is the component they grow, and neither had a row at all. Retention is a
     ladder rather than a switch, so a renewal is worth what SECURING it pays
     on that ladder, the same two-point difference an AE's deal takes. */
  var cs = csOwnerOf(d.rep);
  if (cs && (d.type === "Renewal" || d.type === "Expansion")){
    if (d.type === "Expansion"){
      var expFull = (P.csVariable || 0) * (P.csExpWeight || 0) / 4,
          per = cs.expTarget ? expFull / cs.expTarget : 0,
          v = per * (d.acv || 0);
      if (d.status === "Won")       push(d.rep, "CS", v, 0);
      else if (d.status === "Open") push(d.rep, "CS", 0, v);
    } else if (cs.atRisk){
      /* WHAT HOLDING IT PAYS, NOT WHAT LOSING IT COSTS. The old comment here
         stated the premise Javier rejected on 19 Oct: "a renewal is not worth
         a slice of the component, it is worth whatever LOSING it would cost".
         Everything downstream inherited it, and it reads as money leaving a
         CSM's pay. `csLadder` runs on secured over book, which a renewal
         actually moves, so the row can answer the AE's question instead. */
      var L0 = A.csLadder(cs);
      if (L0){
        var got = d.status === "Won" ? A.csWorthHad(L0, d.acv) : A.csWorthAdd(L0, d.acv);
        /* A zero is a real answer and is stated, not dropped. Which zero it is
           depends on where they stand on the ladder, and neither form prices a
           loss or claims a component that has not landed. */
        var says = got ? "" : (L0.lvl >= A.csCap()
          ? "nothing more, the component is already at its ceiling"
          : L0.ceiling < RF()
          ? "nothing, the book can no longer reach " + E.pct0(RF())
          : "a step toward " + E.moneyK(L0.gateAt) + " secured, where the component starts paying");
        if (d.status === "Won")       push(d.rep, "CS", got, 0, says);
        else if (d.status === "Open") push(d.rep, "CS", 0, got, says);
      }
    }
  }
  /* THE SOURCING SDR, unchanged in substance: the count and the value are
     banked at creation, the won component is at stake until it resolves, and
     a deal created last quarter earned neither this quarter. */
  var sdr = d.createdByRep ? ownerOf(d.createdByRep) : null;
  if (sdr && sdr.target && sdr.created !== undefined){
    var w = P.sdrWeights || {}, qv = (P.sdrVariable || 0) / 4, t = sdr.target;
    var marg = function(share, got, per2, step){
      if (!share || !per2 || !step) return 0;
      return E.roleEarn(P, qv * share, (got || 0) / per2) -
             E.roleEarn(P, qv * share, Math.max(0, (got || 0) - step) / per2);
    };
    var inQ = d.createdWeek >= 1,
        made = inQ ? marg(w.count, sdr.created, t, 1) +
                     marg(w.value, sdr.createdValue, t * P.acv, d.acv) : 0,
        wonM = marg(w.won, sdr.attWon, t * P.winRate, 1);
    if (d.status === "Won") push(d.createdByRep, "SDR", made + wonM, 0);
    else push(d.createdByRep, "SDR", made, d.status === "Open" ? wonM : 0);
  }
  return out;
}
/* WHOSE CHEQUE A READER MAY SEE. The 14 Oct rule stands: a rep never sees
   another rep's pay. A manager reading their own team is not a stranger, and
   nor is an admin or a CEO, who are viewing as nobody. */
function payRows(d){
  return dealPay(d).filter(function(p){
    if (A.sdrLens && p.role === "AE") return false;
    return !A.viewer || A.viewer === p.name || A.mgrTeam;
  }).reduce(function(rows, p){
    /* A RENEWAL READS AS A PAYMENT, like everything else. The labels were the
       last place the old model survived: the figures moved to what holding
       pays on 19 Oct and the row above them still said "Costs Felix if it
       churns", which is the sentence Javier rejected wearing a different hat.
       A renewal is secured rather than won, so it keeps its own verb, and
       nothing on this card prices a loss. */
    var isRen = p.role === "CS" && d.type === "Renewal";
    if (p.says){ rows.push([(isRen ? "Worth to " : "Pays ") + who(p.name), p.says]); return rows; }
    if (p.paid)  rows.push([(isRen ? "Secured for " : "Paid ") + who(p.name), m0(p.paid)]);
    if (p.would) rows.push([
      isRen ? (p.paid ? "And would secure for " : "Would secure for ") + who(p.name) +
              (d.status === "Open" ? " if it holds" : "")
            : (p.paid ? "And would pay " : "Would pay ") + who(p.name) +
              (d.status === "Open" ? " if it wins" : ""),
      m0(p.would)]);
    return rows;
  }, []);
}
/* Retention falls and expansion climbs, so the two cross in opposite
   directions and the sentence has to as well. */
function csConsequence(d, m){
  var E = A.E, P = A.P;
  if (d.type === "Expansion"){
    if (!m.expTarget || d.status === "Lost") return "";
    var now = (m.expWon || 0) / m.expTarget,
        then = ((m.expWon || 0) + (d.status === "Won" ? 0 : d.acv)) / m.expTarget;
    if (d.status === "Won" && now >= 1 && (now - d.acv / m.expTarget) < 1)
      return "This one took " + who(m.name) + " past the expansion target.";
    if (d.status === "Open" && now < 1 && then >= 1)
      return "Winning this takes " + who(m.name) + " past the expansion target.";
    return "";
  }
  if (!m.atRisk || d.status === "Lost") return "";
  /* UPWARD, like the expansion branch above it and like the AE's. */
  var L0 = A.csLadder(m);
  if (!L0 || !L0.next) return "";
  var bar = L0.book * L0.next.at;
  var before = L0.secured - (d.status === "Won" ? (d.acv || 0) : 0);
  var after  = before + (d.acv || 0);
  if (before >= bar || after < bar) return "";
  return (d.status === "Won" ? "This one took " : "Holding this takes ") + who(m.name) +
    " past " + L0.next.label + " secured, where retention " +
    (L0.next.on ? "starts paying." : "tops out.");
}
function csOwnerOf(name){
  return (A.S.css || []).filter(function(x){ return x.name === name; })[0] || null;
}
function marginal(rep, d){
  if (!rep || !rep.quota) return null;
  var E = A.E, P = A.P, q = rep.quota, closed = rep.closed || 0;
  var a2 = (d.status === "Won" ? closed : closed + d.acv) / q;
  var a1 = (d.status === "Won" ? Math.max(0, closed - d.acv) : closed) / q;
  return (E.commAt(P, a2) - E.commAt(P, a1)) / 4;
}
/* ONE deal gets the credit. The first version asked "would removing this deal
   drop them below the line", which is true of every deal once they are just
   over it: four of Ryan Pike's won deals each claimed to be the one. Order his
   wins by the week they closed and credit the one where the running total
   first crosses. Javier, 7 Oct. */
function consequence(d, rep){
  /* A RENEWAL AND AN EXPANSION CROSS LINES TOO. This returned nothing unless
     the row belonged to an AE with a quota, so "winning this takes Hugo past
     the 70% line" existed only for New business while the other two deal
     types said nothing at all. Javier, 18 Oct. */
  var csm = csOwnerOf(d.rep);
  if (csm && (d.type === "Renewal" || d.type === "Expansion"))
    return csConsequence(d, csm);
  if (!rep || !rep.quota) return "";
  var E = A.E, P = A.P, q = rep.quota;
  /* EACH LINE HAS A LONG FORM AND A SHORT ONE. Both descriptions carry a
     trailing clause, and one deal can cross both, which produced "past the
     50% line, where the reduced rate stops and quota, and into the
     accelerator". The long form is used when a deal crosses one line and the
     short one when it crosses two, so the sentence stays a sentence. */
  var lines = [];
  if ((P.decel || {}).thr) lines.push([P.decel.thr,
    "the " + E.pct0(P.decel.thr) + " line, where the reduced rate stops",
    "the " + E.pct0(P.decel.thr) + " line"]);
  var af = (P.accel || {}).from || 1;
  lines.push([af, af === 1 ? "quota, and into the accelerator"
                           : "the " + E.pct0(af) + " accelerator line",
                  af === 1 ? "quota" : "the " + E.pct0(af) + " line"]);
  if (d.status === "Won"){
    var wins = A.find.wonFor(rep.name).sort(function(a, b){
      return (a.week - b.week) || (a.id < b.id ? -1 : 1); });
    var run = 0, hit = [];
    wins.forEach(function(x){
      var before = run; run += x.acv;
      if (x.id !== d.id) return;
      lines.forEach(function(l){
        if (before < q * l[0] && run >= q * l[0]) hit.push(l); });
    });
    if (!hit.length) return "";
    return "This is the deal that took " + who(rep.name) + " past " +
      phrase(hit) + ".";
  }
  if (d.status !== "Open") return "";
  var closed = rep.closed || 0, got = [];
  lines.forEach(function(l){
    if (closed < q * l[0] && closed + d.acv >= q * l[0]) got.push(l); });
  if (!got.length) return "";
  return "Winning this takes " + who(rep.name) + " past " + phrase(got) + ".";
}
/* One line gets its full description; two get the short ones, because two
   trailing clauses in one sentence stop being a sentence. */
function phrase(hit){
  return hit.length === 1 ? hit[0][1]
       : hit.map(function(l){ return l[2]; }).join(" and ");
}

/* ---- what moved since last week ---------------------------------------
   A card that only prints where a number IS reads as a fact sheet. The same
   number with its movement reads as a quarter in progress, and the engine can
   give any week, so this is real rather than decoration. */
function arrow(d){ return d > 0 ? "\u25b2" : d < 0 ? "\u25bc" : ""; }
function delta(now, was, fmt){
  if (was === null || was === undefined) return "";
  var d = now - was;
  if (!d) return "";
  return arrow(d) + " " + (fmt || m0)(Math.abs(d));
}
function signed(v, fmt){
  return (v > 0 ? "+" : v < 0 ? "\u2212" : "") + (fmt || m0)(Math.abs(v));
}
function deltaCls(d, goodUp){
  if (!d) return "";
  return (goodUp !== false) === (d > 0) ? "up" : "down";
}

/* ---- the four headline figures ---------------------------------------- */
function tileCard(i, tone){
  var E = A.E, P = A.P, S = A.S, co = S.company, was = S.closed;
  if (i === 0){
    /* The unsigned "against pace" row was the confusing one: 14% told you
       nothing about which side of the line you were on. It joins the headline
       as a signed, coloured figure instead. Javier, 7 Oct. */
    var vp = co.attain - S.pace;
    var pco = A.SP ? A.SP.company : null, pco2 = A.SP2 ? A.SP2.company : null;
    var thisWeek = pco ? co.closed - pco.closed : null;
    var lastWeek = (pco && pco2) ? pco.closed - pco2.closed : null;
    var pctSign = function(x){ return (x >= 0 ? "+" : "\u2212") +
      Math.abs(Math.round(x * 100)) + "%"; };
    /* The quota is written short so the opening line never wraps. The figure
       that matters is what closed; the quota is a known commodity and $2.4M
       says it as well as $2,400,000 does. Javier, 8 Oct. */
    var onPace = (S.aes || []).filter(function(r){ return (r.attain || 0) >= S.pace; }).length;
    return head("Revenue against plan", "", tone) +
      verdict(E.money(co.closed) + (was ? " closed, " : " closed so far, ") +
        E.pct0(co.attain) + " of a " + E.moneyK(co.quota || 0) + " quota.") +
      facts([
        /* The row says which side of the line you are on and by how much. The
           pace figure itself was the thing being highlighted and it is not the
           thing anybody reads: 35% (+2%) is, and the label carries the verdict. */
        was ? ["Finished at", E.pct0(co.attain)]
            : [vp >= 0 ? "Ahead of pace" : "Behind pace",
               {v: E.pct0(co.attain), d: pctSign(vp), cls: deltaCls(vp)}],
        (!was && thisWeek !== null) ? ["Closed this week",
          {v: m0(thisWeek), d: lastWeek !== null && lastWeek !== thisWeek
             ? arrow(thisWeek - lastWeek) + " " + E.moneyK(Math.abs(thisWeek - lastWeek)) + " WoW" : "",
           cls: lastWeek !== null ? deltaCls(thisWeek - lastWeek) : ""}] : null,
        ["Still to close", co.attain >= 1 ? "nothing, the number landed"
                                          : E.money(Math.max(0, (co.quota || 0) - co.closed))],
        was ? null : ["Open pipeline", {v: E.moneyK(co.open || 0),
          d: co.coverage ? co.coverage.toFixed(1) + "x cover" : "",
          cls: co.coverage && co.coverage < 3 ? "down" : "up"}],
        /* The denominator is the people ON a quota, not everyone employed, and
           a count with no pace beside it is the only figure on the card with
           nothing to be measured against. */
        ["Reps at quota", (co.atQuota || 0) + " of " + (S.aes || []).length +
          (was ? "" : " (" + onPace + " on pace)")],
        was ? null : ["Weeks left", E.QTR_WEEKS - S.week === 0 ? "this is the last one"
                                   : String(E.QTR_WEEKS - S.week)]
      ]);
  }
  if (i === 1){
    var reps = (S.aes || []).slice().sort(function(a, b){
      return (b.closed || 0) - (a.closed || 0); });
    var tot = reps.reduce(function(s, r){ return s + (r.closed || 0); }, 0) || 1;
    var top2 = ((reps[0] || {}).closed || 0) + ((reps[1] || {}).closed || 0);
    var shown = Math.min(10, reps.length);
    /* The chart caps at ten bars. On a team of ten or fewer there is no cap at
       all, so the label has to say which case this is. Javier, 7 Oct. */
    var sub = shown < reps.length
      ? "the " + WORDS[shown] + " biggest, of " + reps.length
      : "one bar per rep, biggest first";
    var prevBy = {};
    if (A.SP) (A.SP.aes || []).forEach(function(r){ prevBy[r.name] = r.closed || 0; });
    var mover = null, best = 0;
    reps.forEach(function(r){
      var d = (r.closed || 0) - (prevBy[r.name] || 0);
      if (d > best){ best = d; mover = r.name; }
    });
    return head("Where it came from", sub, tone) +
      verdict("The top two produced " + E.pct0(top2 / tot) + " of it.") +
      (mover ? '<p class="vd sub2 up">' + esc("\u25b2 " + mover.split(" ")[0] +
        " moved most this week, " + m0(best)) + '</p>' : '') +
      facts(reps.slice(0, 10).map(function(r){
        var d = A.SP ? (r.closed || 0) - (prevBy[r.name] || 0) : 0;
        return [r.name, E.moneyK(r.closed || 0) + (d ? "   " + delta(r.closed || 0,
          prevBy[r.name] || 0, E.moneyK) : ""), d ? "up" : ""]; })) +
      note("An even split across " + reps.length + " would put the top two at " +
        E.pct0(2 / reps.length) + ".");
  }
  if (i === 2){
    /* The tile face and this card read the same live figure as of 22 Oct. The
       tile used to print the number the PLAN was designed to, which never moved
       all quarter, so the card existed partly to supply the live one. It still
       carries what the tile has no room for: the trajectory, the design figure
       to compare against, and the ceiling. */
    var live = co.salesCost, over = live > P.guardrail;
    var pv = A.SP ? A.SP.company.salesCost : null;
    return head("What it cost", "", tone) +
      /* The verdict states the share and nothing else. The amount, the
         revenue and the ceiling are all rows underneath, and the ceiling was
         being said three times on one card. Javier, 8 Oct. */
      verdict("Variable pay " + (was ? "took " : "is taking ") + E.pct(live) +
        " of revenue.") +
      (over ? '<p class="vd sub2 down">' + esc("Over the " + E.pct0(P.guardrail) +
        " ceiling") + '</p>' : '') +
      (!was && pv !== null && Math.abs(live - pv) > .0005
        ? '<p class="vd sub2 ' + deltaCls(live - pv, false) + '">' +
          esc(arrow(live - pv) + " " + E.pct(Math.abs(live - pv)) + " since last week") + '</p>'
        : '') +
      facts([
        /* THE ROW HAS TO DIVIDE INTO THE PERCENTAGE BELOW IT. This showed
           co.commSpend, which is AE and selling-manager commission, while the
           cost of revenue two rows down is ALL sales variable: on #full at
           closed the card read "$227K against $2.52M" and then "11.7%", and
           $227K over $2.52M is 9.0%. The missing $67K was the SDR and manager
           pay, which no row named. Same hole before 22 Oct, when those two were
           prorated targets rather than accruals. Javier, 22 Oct. */
        [was ? "Variable paid" : "Variable paid so far", m0(co.salesVarSpend)],
        [was ? "On revenue of" : "Against revenue closed", m0(co.closed)],
        [was ? "Cost of revenue" : "Live cost of revenue", E.pct(live), over ? "over" : ""],
        ["The plan was designed at", E.pct(P.salesCostOfRev)],
        ["Ceiling", E.pct0(P.guardrail)]
      ]) +
      note("The ceiling starts at 15% and widens with the funnel you built, 3 points for " +
        "SDRs and 2 for managers.");
  }
  var gp = co.gpShare || P.shareOfGp, hot = gp > .25;
  var pgp = A.SP ? A.SP.company.gpShare : null;
  var gross = co.closed * (P.gm || 0);
  return head("Comp vs gross profit", "", tone) +
    /* Same rule. The dollar figure is the first row below, so the opening
       line never carries it and never wraps. The 25% verdict is a verdict, not
       part of the sentence, so it rides the coloured sub-line. */
    verdict("Variable pay " + (was ? "took " : "takes ") + E.pct(gp) + " of gross profit.") +
    (function(){
      var bits = [];
      if (!was && pgp !== null && Math.abs(gp - pgp) > .0005)
        bits.push(arrow(gp - pgp) + " " + E.pct(Math.abs(gp - pgp)) + " since last week");
      if (hot) bits.push("past the 25% line");
      return bits.length ? '<p class="vd sub2 ' + (hot ? "down" : deltaCls(gp - pgp, false)) +
        '">' + esc(bits.join(" \u00b7 ")) + '</p>' : '';
    })() +
    facts([
      [was ? "Gross profit" : "Gross profit so far", m0(gross)],
      /* Same correction as the cost card above, same reason: the share on the
         next row is all sales variable over gross profit, so the dollar figure
         beside it cannot be commission alone. */
      ["Variable pay", m0(co.salesVarSpend), hot ? "over" : ""],
      ["Share", E.pct(gp), hot ? "over" : ""],
      ["Gross margin", E.pct0(P.gm)],
      ["The line", "25%"]
    ]) +
    note(hot ? "Fine if you are deliberately buying growth, tight if not. The bar is the " +
      "whole of gross profit and the line is 25% of it."
      : "Inside the line. The bar is the whole of gross profit and the line is 25% of it.");
}

/* ------------------------------------------------------------ "?" copy */
var Q = {
  "lever-quota": ["Quota",
    "Moves every rep's quota, and with it their attainment, since what they closed stays " +
    "exactly the same. The accelerator and the reduced-rate line are set against quota, so " +
    "they move too.",
    "What it does not change: a single deal. This is the same quarter read against a " +
    "different number."],
  "lever-reps": ["Reps at quota",
    "Moves how many of a manager's reps have to reach quota before their participation " +
    "component pays anything. At 60% on an eight-person team that is five of them, at 40% " +
    "it is four.",
    "What it does not change: what any rep earns. It sets the bar their manager's pay sits " +
    "behind."],
  "lever-ret": ["Retention",
    "Moves the two retention lines together, the gate where CS retention pay starts and the " +
    "target where it pays in full, keeping the seven points between them. Drop the gate and " +
    "a book that paid nothing starts paying.",
    "What it does not change: expansion pay, or anything an AE or SDR earns."],
  "lever-ceil": ["Cost ceiling",
    "Moves what the company is willing to spend on variable pay, as a share of the revenue " +
    "it produced. The number already includes the allowance for the team you built, which " +
    "is why a full funnel sits higher than an AE-only one.",
    "What it does not change: anybody's cheque. This lever changes the verdict rather than " +
    "the money, which is the point of it."],
  /* WHY THE TABLE IS IN THIS ORDER. The rule is identical on all eight rows, so
     it lives here once rather than in eight reason clauses. Javier, 14 Oct. */
  "mgr-order": ["Why this order",
    "Not by attainment. The table is ordered by how much money sits at each person's nearest " +
    "threshold, divided by how many of their own deals it takes to get there.",
    "Anyone without the open pipeline to cover that gap drops to the bottom, because nothing " +
    "you do this week changes their quarter. Their own rank is on their hover.",
    /* WHAT HAPPENS AT THE CLOSE, as two extra lines rather than a second card.
       Javier, 15 Oct: "I don't want a different version for closed quarter,
       just adding a couple of lines of what happens at closed quarter." */
    "When the quarter closes this column stops being advice. The order becomes how the quarter " +
    "went, biggest contribution first, and the line beside each name is what they finished at " +
    "rather than what it would take to move them."],
  /* THE PERMISSION RULE. Spec'd long ago, never rendered: the marker lived on
     the #personas heading and that heading is display:none, so it has been
     invisible on every view since the heading was hidden. Copy approved by
     Javier, 14 Oct. */
  /* `mgr-gate` deleted 19 Oct with the marker that opened it. It was one
     generic block for three roles, so a Sales Manager read about CSMs, and
     the question it answered is the one the people table's own column "?"
     answers properly. Javier: "This IS SO BAD ... I am not even going to try
     to fix that text." */
  "who": ["Who can see what",
    "On a real screen this picker would not be here. An AE sees their own numbers and nobody " +
    "else's, a manager sees their team, and a CEO can look down the whole org but a rep can " +
    "never look across it.",
    "Every view here is built that way. The picker stays open so you can see all of them."],
  "lever-week": ["Week",
    "Advance the weeks and watch the quarter play out. Deals close the way they closed, and " +
    "the numbers, the tables and the findings move with them.",
    "Move it past week 13 to see the quarter closed, where the numbers are final and " +
    "commission is owed. Drag it back and nothing is lost: the quarter is already dealt."],
  "q-who": ["Who are you looking as",
    "Switching persona shows you the screen that person would see. It states the access " +
    "rule rather than enforcing it: a rep only ever sees their own money and a manager only " +
    "their own team.",
    "This admin view is the one place that is deliberately off, because a RevOps admin " +
    "genuinely does see every number."],
  "q-target": ["Against target",
    "The bar is where that person stands on the thing they are paid on, and the tick is the " +
    "line they are measured against. On a quota row the tick is this week's pace, which " +
    "follows the close curve rather than an even thirteenth of the quarter, and the track " +
    "runs to 1.3x because a rep CAN finish past quota.",
    "A CS row is measured on retention, which cannot go above 100%, so a CS bar can never " +
    "reach the end of its track. It starts at the gate where the retention component pays " +
    "nothing and its tick is the line where the component pays in full."]
};
/* EVERY PARAGRAPH, not the first two. The renderer was hard-wired to q[1] and
   q[2], so a third line written into a card simply never appeared. Found when
   the mgr-order card gained its closing-quarter lines. Javier, 15 Oct. */
/* THE BAR COLUMN ON A MANAGER'S PEOPLE TABLE. Three roles, three answers,
   because what the tick means is not the same for a quota, a count and a
   level that cannot be beaten. Copy approved by Javier, 19 Oct. */
function mgrColCard(){
  var E = A.E, P = A.P, S = A.S, t = A.mgrTeam;
  var kind = (t && t.manages) || "AE";
  var close = "The quarter is finished, so the tick is the target itself and the bar is " +
    "where they landed.";
  if (kind === "CS")
    return head("Retention", "", "") +
      note("Each CSM's book. The tick is " + E.pct0(RFU()) + ", the level the retention " +
        "component pays in full at, and nothing pays at all below " + E.pct0(RF()) + ".") +
      note("Retention cannot go over 100%, so unlike a quota there is no upside above the " +
        "line. The bar is about protecting what is there, not beating it.") +
      (S.closed ? note(close) : "");
  var what = kind === "SDR"
    ? "Each SDR against their " + (P.sdrUnit1 || "accepted opportunity") + " target."
    : "Each rep against their quota for the quarter.";
  var over = kind === "SDR"
    ? "SDRs can finish over target, and the bar keeps going when they do."
    : "Reps can finish over quota, and the bar keeps going when they do.";
  return head(kind === "SDR" ? "Against target" : "Against target", "", "") +
    note(what + " The tick is where they need to be by this week to land on target, so a bar " +
      "short of it is behind pace.") +
    note(over) +
    (S.closed ? note(close) : "");
}
/* THE LEADERBOARD'S OWN COLUMN. First person, because this board is the
   reader's own team and their row is in it. Javier, 19 Oct. */
function boardColCard(){
  var E = A.E, P = A.P, role = A.boardRole || "AE";
  if (role === "CS")
    return head("Against target", "", "") +
      note("Where you sit against the others on your team. The buttons switch both the bar " +
        "and the order between the two halves of your plan.") +
      note("Retention is each CSM's book, where the solid part is renewed and the light part " +
        "is still up, and the tick is the " + E.pct0(RFU()) + " the component pays in " +
        "full at. Expansion fills from zero against each person's own target.");
  return head("Against target", "", "") +
    note("Where you sit against the others on your team, each of them against their own " +
      (role === "SDR" ? (P.sdrUnit1 || "accepted opportunity") + " target" : "quota") +
      ". The tick is this week's pace.") +
    note("Your own row is highlighted and carries your real rank, even when that puts you " +
      "outside the top five.");
}
function qCard(id){
  if (id === "mgr-col") return mgrColCard();
  if (id === "board-col") return boardColCard();
  var q = Q[id];
  if (!q) return head("Nothing here yet", "", "");
  var out = head(q[0], "", "");
  for (var i = 1; i < q.length; i++) out += note(q[i]);
  return out;
}

/* ------------------------------------------- the download warnings */
/* The count is the PLAN findings, which is what the one-pager prints. Counting
   the CEO quarter findings put "the one thing the one-pager flagged" on a plan
   whose one-pager flagged nothing. Javier, 7 Oct. */
function reds(){
  return ((A.P || {}).flags || []).filter(function(f){ return f.t === "bad"; }).length;
}
function warnFor(which){
  var n = reds(), P = A.P, blocks = [];
  var mgrs = (P.salesMgrs || 0) + (P.sdrMgrs || 0) + (P.csMgrs || 0);
  if (n) blocks.push(['warn', which === "deck"
    ? "This deck rolls out your plan exactly as it stands, including the " +
      many(n, "thing") + " the one-pager flagged. It explains how people get paid, it does " +
      "not argue with the plan in front of them. If you want to change something, now is " +
      "better than after the all-hands."
    : "This agreement puts your plan in writing exactly as it stands, including the " +
      many(n, "thing") + " the one-pager flagged. Once people have signed it, changing " +
      "those is a renegotiation rather than an edit. If you want to fix something, this is " +
      "the moment."]);
  if (which === "deck" && mgrs) blocks.push(['note',
    "Manager compensation is not in this deck. Nobody presents it at a team all-hands, and " +
    "the role slides are built to be hidden depending on who is in the room, so there is " +
    "nowhere to put it that survives that. Each manager's terms are in the COMPENSATION " +
    "AGREEMENT instead."]);
  if (!blocks.length) return null;
  return {
    title: which === "deck" ? "Before you present this" : "Before you send this out",
    go:    which === "deck" ? "Download the deck" : "Download the agreement",
    blocks: blocks
  };
}
/* `go` is what the primary button does. Without it the dialog's "Download the
   deck" only closed the dialog, which is the whole rail's problem in one
   button. It still returns FALSE when there is nothing to warn about, and the
   caller downloads straight through: before 20 Oct that false meant a clean
   plan's deck button did nothing at all, no dialog, no file, no feedback. */
function openWarn(which, go){
  var w = warnFor(which);
  if (!w) return false;
  var wrap = document.createElement("div");
  wrap.className = "modalwrap";
  /* Secondary left, primary filled right, the way the tour already does it. */
  wrap.innerHTML = '<div class="modal"><h5>' + esc(w.title) + '</h5>' +
    w.blocks.map(function(b){
      return '<div class="blk ' + b[0] + '">' + esc(b[1]) + '</div>'; }).join('') +
    '<div class="btns"><button class="back">Back to the plan</button>' +
    '<button class="go">' + esc(w.go) + '</button></div></div>';
  function close(){ wrap.remove(); }
  wrap.addEventListener("click", function(e){
    var went = e.target.closest && e.target.closest(".go");
    if (e.target === wrap || (e.target.closest && e.target.closest(".back")) || went){
      close();
      if (went && typeof go === "function") go();
    }
  });
  document.body.appendChild(wrap);
  return true;
}

/* ====================================================== wiring it all up */
/* THE THREE AE TILE CARDS. Copy approved in chat 13 Oct, figures measured off
   the live #full render rather than invented: an earlier draft of this copy
   carried a 4.0% rate and a $37,500 quarter that the plan does not contain.

   The attainment card deliberately carries NO closing line. The standing
   finding directly below the tiles already says where the rep is and what is
   left, so this card's job is the one thing that finding does not carry, the
   zones the bar is drawn from. */
function aeTileCard(i, m, tone){
  var E = A.E, P = A.P, S = A.S;
  var q = m.quota || P.qQuota, closed = m.closed || 0, at = m.attain || 0;
  var comm = E.commAt(P, at) / 4, oteQ = (P.ote || 0) / 4, baseQ = (P.base || 0) / 4;
  var hold = (P.clawHoldback === true) || false;
  var d = P.decel || {}, ac = P.accel || {}, r = P.rate || 0;

  if (i === 0){
    /* Each row carries the colour of the band it names, so the card explains
       the bar rather than sitting beside it. Javier, 13 Oct: the marks were
       too subtle and "the hover doesn't reference those colors". */
    var zones = [], zi = 0;
    var sw = function(n, label){
      return {html: '<span class="zsw z' + n + '"></span>' + esc(label)}; };
    if (d.thr) zones.push([sw(++zi, "Below " + E.pct0(d.thr) + ", under " + m0(q * d.thr)),
                           E.pct(r * (d.mult || 0))]);
    zones.push([sw(++zi, d.thr ? "From " + E.pct0(d.thr) + " to quota" : "Up to quota"),
                E.pct(r)]);
    if (ac.t1) zones.push([sw(++zi, "Above quota"), E.pct(r * ac.t1)]);
    if (ac.t2 && ac.at) zones.push([sw(++zi, "Above " + E.pct0(ac.at) + ", over " +
                                    m0(q * ac.at)), E.pct(r * ac.t2)]);
    return head("My attainment", m.name, tone) +
      verdict(S.closed
        ? "Finished at " + E.pct0(at) + ", " + m0(closed) + " against a " + m0(q) +
          " quota."
        : m0(closed) + " closed against a " + m0(q) + " quota.") +
      facts(zones);
  }

  if (i === 1){
    return head("Earned so far", m.name, "") +
      /* "OF THE" ONLY WORKS BELOW THE LINE. Same class as the past-quota
         sentence on the next-deal card, found while fixing it: a rep at 107%
         read "You have earned $24,480 of the $22,500 this plan pays at quota",
         which is a fraction with the wrong sign. Past the line it is "past",
         not "of". Javier reported the other one, 14 Oct; this is the sweep. */
      verdict(baseQ + comm > oteQ
        ? (S.closed ? "You finished on " : "You have earned ") +
          m0(baseQ + comm) + ", past the " + m0(oteQ) +
          " this plan pays at quota."
        : S.closed
        ? "You finished on " + m0(baseQ + comm) + " against the " + m0(oteQ) +
          " this plan pays at quota."
        : "You have earned " + m0(baseQ + comm) + " of the " + m0(oteQ) +
          " this plan pays at quota.") +
      facts([
        /* "Is this his salary part of the OTE? I am confused about this
           number." Javier, 14 Oct. It is, and the label never said so: "Base"
           alone names neither the thing nor the period, while the row under it
           is a quarter and the row below that says so out loud. If the label
           made him ask, the label is the bug. */
        ["Base salary this quarter", m0(baseQ)],
        [S.closed ? "Commission" : "Commission so far", m0(comm)],
        ["At quota this quarter", m0(oteQ)]
      ]) +
      note(hold ? m0(comm * 0.2) + " of that is held until the customer sticks." : "");
  }

  /* The real next deal, the one closing soonest, not a hypothetical average. */
  var mine = A.find.openFor(m.name).sort(function(x, y){
    return (x.expectedClose - y.expectedClose) || (y.acv - x.acv); });
  var dl = mine[0];
  if (!q || !dl) return head("What the next deal is worth", m.name, "") +
    verdict(S.closed ? "The quarter is closed, so there is no next deal."
                     : "Nothing is open this quarter.");
  var size = dl.acv || 0;
  var c = function(x){ return E.commAt(P, x) / 4; };
  var now  = c((closed + size) / q) - c(closed / q);
  /* THE SECOND FIGURE IS THE NEXT STEP UP, NOT "PAST QUOTA". Javier, 14 Oct, on
     a rep who was already past it: "Sentence makes no sense on the hoover once
     pass quota", and the two rows read "Rate where you are 16.2% / Rate past
     quota 16.2%", which tells a rep nothing. Worse, the note underneath then
     said the accelerator adds nothing on this plan, which is false: it adds
     nothing MORE, because they are already inside it.

     So the card names the nearest rate change ABOVE where they stand, whatever
     that happens to be on their plan: the reduced rate coming off at 70, the
     accelerator going on at quota, or the second tier at 120. "Instead of Rate
     past quota it should be rate past 120% so the rep can see that there's
     something more for him." That also retires the sentence explaining that
     the step was two things at once, which he asked the value of: with the
     step named on the row, there is nothing left for it to explain. */
  var step = A.nextStep(P, at);
  var bar  = step ? q * step.at : 0;
  var then = step ? c((Math.max(closed, bar) + size) / q) -
                    c(Math.max(closed, bar) / q) : now;
  /* THE DEAL THAT CLEARS THE GATE IS WORTH MORE NOW THAN LATER, and the card
     has to say so rather than print the two figures side by side. The
     decelerator pays back retroactively: a rep on #early at 54% closing a
     $17,000 deal lands at 73% and is paid the full rate on everything, so that
     deal pays $4,603 where the same deal at 70% pays $2,186. "Pays $4,603 now,
     and $2,186 once you are past 70%" is true and reads like an error. */
  var crosses = !!(step && closed < bar && closed + size >= bar);
  var acct = esc(dl.account || String(dl.name || "").split(" - ")[0]);
  /* THE RATE ROWS ARE PLAN RATES, NOT THIS DEAL'S BLENDED MARGINAL. Dividing
     the marginal by the deal size put 27% on a plan whose top rate is 12.9%,
     because a deal spanning a threshold carries the retroactive catch-up with
     it. A row labelled "Current rate" has to be the rate where the rep stands,
     which is what Javier asked for. The money in the sentence stays marginal,
     since that is the money. */
  var rows = [["Forecast to close", A.weekLabel(dl.expectedClose)],
              ["Current rate", E.pct(A.rateAt(P, at))]];
  if (step) rows.push(["Rate past " + step.label, E.pct(A.rateAt(P, step.at))]);
  return head("What the next deal is worth", m.name, "") +
    verdict(!step
      ? acct + " at " + m0(size) + " pays " + m0(now) +
        ", at the top rate this plan pays."
      : crosses
      ? acct + " at " + m0(size) + " pays " + m0(now) +
        ", and it is the deal that takes you past " + step.label + "."
      : acct + " at " + m0(size) + " pays " + m0(now) + " now, and " + m0(then) +
        " once you are past " + step.label + ".") +
    facts(rows) +
    /* A REP WILL DIVIDE THE MONEY BY THE DEAL. On a crossing that clears the
       DECELERATOR, $3,808 on an $8,000 deal is 48%, against a "Current rate"
       row saying 4.8%, and the card has to explain the gap rather than leave
       it to be found. It only happens on a retroactive gate: the accelerator
       tiers are marginal, so Eleanor's crossing needs no such line. */
    note(step && crosses && then < now
      ? "Most of that is the catch-up on what you have already closed, which " +
        "the plan pays in full once you are past " + step.label + "."
      : !step && ac.t1 && ac.t1 !== 1
      ? "You are past every rate step on this plan." : "");
}
/* The rate ladder and the rate at a point both live in app.js, so the tile
   and the card cannot disagree about which step comes next. */
/* THE LEADERBOARD HOVER IS THE PERMISSION MODEL. Your own row opens in full;
   everyone else's says so as a boundary, never as an error. "Access denied"
   reads as a bug and invites a support ticket; a sentence about whose numbers
   these are reads as a rule somebody wrote on purpose, which is what it is.
   Javier's spec, Sep 2026. */
/* THE ROLE COMES FROM THE ROW. Both branches said "AE", so an SDR and a CSM
   were labelled AE on their own leaderboard while every other view had them
   right. Javier, 18 Oct. */
function boardCard(el, tone){
  var n = el.getAttribute("data-key"), r = el.getAttribute("data-role") || "AE";
  if (el.getAttribute("data-me")) return personCard(r, A.find.person(el), tone);
  return head(n, A.roleLabel(r), "") +
    note("Only your own numbers are visible here.");
}

function subjectCard(el){
  var kind = el.getAttribute("data-kind"), tone = el.getAttribute("data-tone") || "";
  if (kind === "mgrteam"){
    /* The roll-up its own row deserves: what the team is made of, not a second
       copy of the tile above it. `E` is local here: subjectCard has no outer
       one, and reaching for it threw into the try/catch above, which swallowed
       the card and produced nothing on hover rather than an error. */
    var E = A.E;
    var tt = A.mgrTeam;
    if (!tt) return null;
    var ff = A.mgrFacts(tt), kk = ff.kind;
    /* WHAT THE READER EARNS, after the top line and before the breakdown.
       It is on the RevOps hover and was missing from every manager's, and
       commission is the word that holds across all three because they all
       earn it, they just earn it for different things. Javier, 15 Oct. */
    var payBar = comps([["Commission", ff.pay.total || 0, ff.pay.target || 0]]);
    if (kk === "CS"){
      var held = 0, churn = 0, pend = 0, risk = 0, expW = 0, expT = 0;
      (tt.members || []).forEach(function(m){ held += m.held || 0; churn += m.churned || 0;
        pend += m.pending || 0; risk += m.atRisk || 0;
        expW += m.expWon || 0; expT += m.expTarget || 0; });
      var allowed = risk * (1 - RFU());
      return head("The team", (tt.manager || "") + "'s book", tone || "") +
        verdict(E.moneyK(held + pend) + " of " + E.moneyK(risk) + " is holding, " +
                E.pct0(risk ? (held + pend) / risk : 0) + " of the book at risk.") +
        payBar +
        facts([["Up for renewal", E.moneyK(risk)],
               ["Renewed", E.moneyK(held)],
               ["Churned", E.moneyK(churn) + " of " + E.moneyK(allowed) + " allowed",
                churn > allowed ? "over" : ""],
               A.S.closed ? null : ["Still to come up", E.moneyK(pend)],
               expT ? ["Expansion", E.moneyK(expW) + " of " + E.moneyK(expT),
                       expW < expT * (A.S.closed ? 1 : (A.S.pace || 0)) ? "under" : ""] : null,
               ["CSMs at or above " + E.pct0(RFU()), ff.bands[0][1] + " of " + ff.n]]) +
        note(csMoveTeam(tt));
    }
    var unitN = function(v){ return kk === "SDR" ? E.num(v) : E.moneyK(v); };
    var openV = 0;
    (tt.members || []).forEach(function(m){ openV += m.open || 0; });
    return head("The team", (tt.manager || "") + "'s team", tone || "") +
      verdict(unitN(ff.got) + " of " + unitN(ff.want) + ", " +
              E.pct0(ff.want ? ff.got / ff.want : 0) +
              (A.S.closed ? " of target." : " against a " + E.pct0(A.S.pace) + " pace.")) +
      payBar +
      facts([[A.S.closed ? (ff.got >= ff.want ? "Over" : "Short by")
                         : "Still to go",
              unitN(Math.abs(ff.want - ff.got))],
             (kk === "AE" && openV) ? ["Open", E.moneyK(openV)] : null,
             ["At target", ff.atq + " of " + ff.n],
             ["The gate", ff.gate + " of " + ff.n]]);
  }
  if (kind === "person"){
    var pr = el.getAttribute("data-role");
    if (A.mgrTeam) return mgrRepCard(pr, A.find.person(el), tone) +
      foot(pr === "SDR" ? "sdr" : pr === "CS" ? "cs" : "ae", el.getAttribute("data-key"));
    return personCard(pr, A.find.person(el), tone) +
      foot(pr === "SDR" ? "sdr" : pr === "CS" ? "cs" : "ae", el.getAttribute("data-key"));
  }
  if (kind === "board")  return boardCard(el, tone);
  if (kind === "team"){
    var t = A.find.team(el), mg = t.manages || "AE";
    return mgrCard(t, tone) +
      foot(mg === "SDR" ? "sdrmgr" : mg === "CS" ? "csmgr" : "mgr", t.manager);
  }
  if (kind === "ceo") return ceoCard(el.getAttribute("data-key") || "", tone);
  if (kind === "dept" || kind === "co"){
    var r = A.find.roll(el);
    return r ? rollCard(r, tone, kind === "co") : null;
  }
  return null;
}
/* THE CEO IS A PERSON, NOT THE ORG. Javier, 15 Oct: his row has to behave like
   anyone else's, which means a card of his own and a View as on the foot. The
   company's card already says what the organisation is made of, so this one
   says what he is on the hook for: the number, the span, and what the plan is
   costing to get it. */
function ceoCard(name, tone){
  var E = A.E, S = A.S, co = S.company || {}, was = S.closed;
  var depts = {}, mgrs = (S.teams || []).length;
  (S.teams || []).forEach(function(t){ depts[t.manages || "AE"] = 1; });
  var nDept = Object.keys(depts).length;
  var aeN = (S.aes || []).length;
  var line = was
    ? "Finished at " + E.pct0(co.attain || 0) + " of target, " +
      E.moneyK(co.closed || 0) + " against " + E.moneyK(co.quota || 0) + "."
    : E.moneyK(co.closed || 0) + " of " +
      E.moneyK(co.quota || 0) + ", " + E.pct0(co.attain || 0) +
      " against a " + E.pct0(S.pace || 0) + " pace for week " + S.week + ".";
  var cost = (co.closed && co.commSpend !== undefined)
    ? E.pct0(co.commSpend / co.closed) + " of revenue" : "";
  var rolled = null;
  try { rolled = A.find.rollCo ? A.find.rollCo() : null; } catch(e){}
  return head(name, "CEO", tone || "") + verdict(line) +
    facts([
      ["Accountable for", E.moneyK(co.quota || 0)],
      ["Reports", mgrs + (mgrs === 1 ? " manager" : " managers") + " across " +
        nDept + (nDept === 1 ? " department" : " departments")],
      aeN ? ["Reps at quota", (co.atQuota || 0) + " of " + aeN] : null,
      ["Headcount", String(co.headcount || 0)],
      cost ? ["Cost of sales", cost] : null
    ]) +
    foot("ceo", name);
}
/* ---- a meeting ----------------------------------------------------------
   THE ONLY ROW IN THE TOOL WITH NO CARD, until 22 Oct. Every meetings row has
   carried a `data-meet` key since the table was built and nothing read it, so a
   meeting was the one thing you could not hover on a screen where everything
   else answers. Javier: "it makes sense because everything has it."

   The three tones are the three the row's own dot already draws, so the card and
   the dot cannot disagree: green for yes, red for no, grey while it is too new
   to count either way. Every rule behind the figures lives in app.js and is
   resolved by A.find.meet before it gets here. */
function meetCard(m){
  var tone = m.state === "yes" ? "good" : m.state === "no" ? "bad" : "";
  var cls  = m.state === "yes" ? "won"  : m.state === "no" ? "lost" : "open";
  /* "week 5", not weekLabel's "Wk 5", because this is a sentence and that is a
     table cell. Safe to write longhand: a meeting is always held inside the
     quarter, weeks 1 to 13 across every preset, so there is no LQ case for
     weekLabel to handle. The Held row below still uses weekLabel, so the card
     and the table's own cell read identically. */
  /* A MEETING THAT CONVERTS IN ITS OWN WEEK gets its own sentence. "Held in
     week 13, became an opportunity in week 13" is true and reads like a
     stammer, and it is 9% of conversions, 14 of 149 across the presets.
     Javier, 22 Oct. */
  var v = m.state === "yes"
    ? (m.oppWeek === m.week
        ? "Held in week " + m.week + " and became an opportunity the same week."
        : "Held in week " + m.week + ", became an opportunity in week " + m.oppWeek + ".")
    : m.state === "soon"
    ? "Held in week " + m.week + ". Too recent to count either way."
    : "Held in week " + m.week + " and never became an opportunity.";
  return head(m.account, "", tone, {text: m.label, cls: cls}) + verdict(v) +
    facts([
      ["Held by", who(m.sdr, true)],
      ["Held", A.weekLabel(m.week)],
      ["Led to an opp", m.label],
      /* Absent rather than $0 on a plan whose SDRs carry no count component,
         the same rule the table's Paid column follows. A meeting is paid when
         it is held whatever becomes of it, so this is always past tense. */
      m.paid ? ["Paid", m0(m.paid)] : null
    ]) +
    /* Only on the state that needs it. A yes and a no explain themselves. */
    note(m.state === "soon"
      ? "A meeting gets a fortnight to turn into something before it counts against anyone."
      : "");
}

function hoverable(t){
  return t.closest("tr[data-meet]") || t.closest("tr[data-kind]") || t.closest("tr[data-deal]")
      || t.closest("[data-tile]") || t.closest("[data-aetile]")
      || t.closest("[data-mgrtile]") || t.closest("[data-sdrtile]")
      || t.closest("[data-cstile]");
}
function htmlFor(el){
  if (el.hasAttribute("data-deal")) return dealCard(A.find.deal(el.getAttribute("data-deal")));
  if (el.hasAttribute("data-meet")){
    var mm = A.find.meet(el);
    return mm ? meetCard(mm) : null;
  }
  if (el.hasAttribute("data-tile")) return tileCard(+el.getAttribute("data-tile"),
    el.getAttribute("data-tone") || "");
  /* The attainment tile's hover is the rep's own card, which is already the
     dollar explanation the spec asks for. The other two AE tiles have no card
     yet: their copy has not been written, and inventing it here is how copy
     nobody approved ends up on screen. */
  if (el.hasAttribute("data-mgrtile")){
    var mt = A.find.team(el);
    return mt ? mgrTileCard(+el.getAttribute("data-mgrtile"), mt,
                            el.getAttribute("data-tone") || "") : null;
  }
  /* EACH TILE ITS OWN CARD. All eight opened the person's card, so hovering
     any of them said the same thing, and the long captions had nowhere to go
     but the face, where they made the four tiles different sizes. The caption
     moves here and the face keeps only its tick. Javier, 18 Oct. */
  if (el.hasAttribute("data-sdrtile")){
    var s2 = A.find.person(el);
    return s2 ? sdrTileCard(+el.getAttribute("data-sdrtile"), s2,
                            el.getAttribute("data-tone") || "") : null;
  }
  if (el.hasAttribute("data-cstile")){
    var c2 = A.find.person(el);
    return c2 ? csTileCard(+el.getAttribute("data-cstile"), c2,
                           el.getAttribute("data-tone") || "") : null;
  }
  if (el.hasAttribute("data-aetile")){
    var me = A.find.person(el);
    return me ? aeTileCard(+el.getAttribute("data-aetile"), me,
                           el.getAttribute("data-tone") || "") : null;
  }
  return subjectCard(el);
}
function bind(){
  document.addEventListener("mouseover", function(e){
    if (pinned) return;
    var el = e.target.closest ? hoverable(e.target) : null;
    if (!el) return;
    clearTimeout(inT); clearTimeout(outT);
    inT = setTimeout(function(){
      var html = null;
      try { html = htmlFor(el); } catch(err){ html = null; }
      if (html){ lastEl = el; show(el, html, false); }
    }, 120);
  });
  document.addEventListener("mouseout", function(e){
    if (pinned || !e.target.closest) return;
    if (hoverable(e.target)) { clearTimeout(inT); hide(); }
  });
  document.addEventListener("click", function(e){
    /* First, before the card's own "a click inside me does nothing" rule. */
    var v = e.target.closest ? e.target.closest("[data-viewas]") : null;
    if (v && A.viewAs){
      e.stopPropagation(); unpin(); hide(0);
      A.viewAs(v.getAttribute("data-viewas"), v.getAttribute("data-who"));
      return;
    }
    var q = e.target.closest ? e.target.closest("[data-q]") : null;
    if (q){ e.stopPropagation(); show(q, qCard(q.getAttribute("data-q")), true); return; }
    if (e.target.closest && e.target.closest(".hovx")){ unpin(); return; }
    if (e.target.closest && e.target.closest("[data-node]")) { unpin(); return; }
    /* TWO GESTURES, TWO JOBS. Clicking a person used to pin their card, and
       the pin suppresses every other hover, so after filtering the screen to
       one rep you could no longer hover their deals: the card you had asked
       for was in the way of the cards you wanted next. Javier, 19 Oct.

       So a click on a ROW only selects. A click on the CARD ITSELF pins it,
       which is the gesture you make when the card is the thing you want to
       keep. The X still closes a pinned one. */
    if (box && box.contains(e.target)){
      if (!pinned && lastEl) show(lastEl, box.innerHTML, true);
      return;
    }
    if (pinned){ unpin(); return; }
  }, true);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") unpin(); });
  window.addEventListener("resize", function(){ unpin(); });
}

window.CARDS = {
  mount: function(api){ A = api; bind(); },
  sync:  function(api){ A = api; },
  close: unpin,
  warn:  openWarn,
  /* A CLICK THAT RE-RENDERS MUST PUT THE CARD BACK. Picking a rep on a
     manager's table filters the deal panel, which rebuilds the screen, which
     closed the card the same click had just pinned: Javier, 14 Oct, "it is
     disappearing all the time". The caller hands back the element it wants
     pinned once the new DOM exists. */
  pin: function(el){
    if (!el) return;
    var html = null;
    try { html = htmlFor(el); } catch(e){ html = null; }
    if (html) show(el, html, true);
  }
};
})();
