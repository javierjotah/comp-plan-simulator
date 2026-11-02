/* ===========================================================================
   THE QUESTIONNAIRE, INSIDE THE MOCK-UP.   Ported 26 October 2026.

   For two months these were two halves of one product that had never been on
   the same page: `comp-plan-wizard-v3.html` asked twenty questions and drew a
   plan, `mockup/` ran a quarter against a plan it was handed. This joins them.

   WHY THE JOIN IS SMALL. Four lines in the whole mock-up ever read a preset,
   and none of them were in cards.js or tour.js: one built the plan, two drove
   the dev dropdown, one picked a filename. Everything else already ran off
   `P`, `L` and `S`, which come from ANSWERS. The engine never cared about
   presets; they are eight saved answer sets and nothing more. So the mock-up
   being able to reproduce any quarter is not a thing built here, it is a thing
   this file stops preventing.

   THE LAYER MODEL, which is the spec and now finally true:
     1. intro, over a blurred plan
     2. sections and questions, over a blurred plan
     3. the plan, over the simulator
     4. the simulator, full screen, and the only layer with a frame

   The top bar and the file rail belong to the simulator. During the
   questionnaire and on the plan view there is no frame, because three of its
   four buttons and the whole rail would be pointing at things that do not
   exist yet. Javier, 26 Oct.

   WHAT THE ENGINE ALREADY GIVES US. `planHTML` and `onePagerHTML` are engine
   exports, so the plan view and the one-pager are not ported at all, they are
   called. Only the four question screens and the state machine are here.
   =========================================================================== */
(function(){
"use strict";

var E = window.ENGINE;
var esc = function(s){ return String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };

/* THE STATE. `ans` is the only thing the simulator cares about; everything
   else is where the reader is standing. `seen` is what makes the tour fire
   once rather than every time the simulator is opened. */
var WZ = window.WZ = {
  screen: "intro",     /* intro | cat | q | review | plan | sim */
  cat: 1, qi: 0, ans: {}, why: false, skipped: {},
  lit: null, litFrom: null,
  /* WHERE THIS QUESTION WAS OPENED FROM. null on a normal walk through the
     twenty. "review" when a Change link on the answers screen opened it, which
     changes what happens after the answer is picked: back to the answers rather
     than onward through everything that follows. Javier, 26 Oct. */
  back: null,
  fromSim: false,      /* the plan view has two states and this is which one */
  seen: false          /* has the simulator been reached once */
};

var host = null;
function mount(){ return host || (host = document.getElementById("wizard")); }

/* ---- the questions ------------------------------------------------------ */
function catQs(n){ return E.Q.filter(function(q){ return q.c === n; }); }
function isLastQ(){ return WZ.cat === 5 && WZ.qi === catQs(5).length - 1; }

/* The progress dashes: one per question, grouped by section, filled behind you
   and half-lit where you are standing. */
function stepsHTML(){
  return '<div class="wz-steps">' + E.CATS.map(function(c){
    return '<div class="wz-grp">' + catQs(c.n).map(function(q, i){
      var done = WZ.ans[q.id] !== undefined;
      var now  = WZ.screen === "q" && WZ.cat === c.n && i === WZ.qi;
      return '<div class="wz-step' + (now ? " now" : done ? " done" : "") + '"></div>';
    }).join("") + '</div>';
  }).join("") + '</div>';
}

/* ---- the four screens --------------------------------------------------- */
/* Copy is the wizard's, word for word. Nothing here was rewritten: it is
   approved copy and the merge is not the place to reopen it. */
function iIntro(){
  return '' +
  '<h1>Let\'s build your compensation plan.</h1>' +
  '<p>This simulator walks you through a short set of questions about your business, your team, and ' +
  'how you want your people to be paid. At the end it generates a complete compensation plan built ' +
  'to match what you actually described, not a generic template.</p>' +
  '<h3>What you get</h3>' +
  '<ul class="wz-plain">' +
    '<li>A one-page plan summary, and why it was designed this way</li>' +
    '<li>A launch deck for rolling it out to your team</li>' +
    '<li>A compensation agreement written as a real contract</li>' +
    '<li>A capacity model that stress-tests what it costs</li>' +
    '<li>A finance tracker for attainment and accruals</li>' +
    '<li>A live quarter simulator you can play with</li>' +
  '</ul>' +
  '<p>Don\'t worry about getting everything exactly right! Not sure on a question? Let the simulator ' +
  'decide it. Changed your mind later? Come back and change a single answer, or retake the whole ' +
  'thing. Nothing is locked in.</p>' +
  '<div class="wz-nav"><span></span>' +
    '<button class="btn primary" data-wz="goCat:1">Let\'s go</button></div>';
}

function iCat(){
  var c = E.CATS.filter(function(x){ return x.n === WZ.cat; })[0];
  return stepsHTML() +
    '<div class="wz-cat">Section ' + c.n + ' of 5 &middot; ' + esc(c.name) + '</div>' +
    '<h1>' + esc(c.title) + '</h1>' +
    c.body.map(function(b){ return '<p class="wz-lede">' + esc(b) + '</p>'; }).join("") +
    '<div class="wz-nav">' +
      '<button class="btn" data-wz="catBack">Back</button>' +
      '<div class="wz-navright">' +
        (c.skippable ? '<button class="link" data-wz="skipCat:' + c.n +
                       '">Skip and build my plan</button>' : '') +
        '<button class="btn primary" data-wz="startCat:' + c.n + '">' +
          (c.n === 1 ? "Let's go" : "Continue") + '</button>' +
      '</div></div>';
}

function iQ(){
  var qs = catQs(WZ.cat), q = qs[WZ.qi];
  var c = E.CATS.filter(function(x){ return x.n === WZ.cat; })[0];
  var cur = WZ.ans[q.id];
  return stepsHTML() +
    '<div class="wz-cat">Section ' + WZ.cat + ' of 5 &middot; ' + esc(c.name) + '</div>' +
    '<div class="wz-qnum">Question ' + (WZ.qi + 1) + ' of ' + qs.length + '</div>' +
    '<h2>' + esc(q.t) + '</h2>' +
    '<div class="wz-opts">' +
      q.o.map(function(o){
        return '<button class="wz-opt' + (cur === o[0] ? " sel" : "") +
          '" data-wz="pick:' + q.id + ':' + o[0] + '">' +
          '<b>' + esc(o[1]) + '</b>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : "") +
          '</button>';
      }).join("") +
      '<button class="wz-opt auto' + (cur === E.AUTO ? " sel" : "") +
        '" data-wz="pick:' + q.id + ':' + E.AUTO + '">' +
        '<b>Let Simulator Decide</b><small>Not sure? We\'ll take care of it.</small></button>' +
    '</div>' +
    '<button class="wz-whybtn" data-wz="why">' +
      (WZ.why ? "Hide" : "Why are we asking this?") + '</button>' +
    (WZ.why ? '<div class="wz-why"><p>' + esc(q.w) + '</p></div>' : "") +
    /* BUILD MY PLAN is the last question's forward action on a normal walk.
       Opened from the answers by a Change link it is not offered, because the
       forward action there is the answers screen: picking returns to it and so
       does Back. Two ways out of one screen, one of them skipping the review
       you were standing in, is the confusion. */
    '<div class="wz-nav">' +
      '<button class="btn" data-wz="prevQ">Back</button>' +
      (isLastQ() && cur !== undefined && WZ.back !== "review"
        ? '<button class="btn primary" data-wz="go:plan">Build my plan</button>'
        : '<span></span>') +
    '</div>';
}

function iReview(){
  var r = E.resolve(WZ.ans);
  var row = function(q, cn, i){
    var key = (WZ.ans[q.id] && WZ.ans[q.id] !== E.AUTO) ? WZ.ans[q.id] : r[q.id];
    var lbl = (q.o.filter(function(o){ return o[0] === key; })[0] || [])[1] || key;
    return '<div class="wz-rev">' +
      '<div><div class="lbl">' + esc(q.t) + '</div><div class="val">' + esc(lbl) + '</div></div>' +
      '<button data-wz="jump:' + cn + ':' + i + '">Change</button></div>';
  };

  /* Came from a finding: show ONLY the answers behind it. Everything else is a
     click away and almost nobody wants it, so it does not get to be the
     default. Unchanged from the wizard. */
  if (WZ.lit){
    var picked = [];
    E.CATS.forEach(function(c){
      catQs(c.n).forEach(function(q, i){
        if (WZ.lit.indexOf(q.id) >= 0) picked.push(row(q, c.n, i));
      });
    });
    return closeX() + stepsHTML() +
      '<h2>' + (picked.length === 1 ? "The answer" : "The " + picked.length + " answers") +
      ' behind this finding</h2>' +
      (WZ.litFrom ? '<p class="wz-lede">' + esc(WZ.litFrom) + '</p>' : "") +
      picked.join("") +
      '<p class="wz-revmore"><a href="#" data-wz="showAll">See all twenty answers</a></p>' +
      '<div class="wz-nav"><span></span>' +
        '<button class="btn primary" data-wz="go:plan">Back to my plan</button></div>';
  }

  /* START OVER lives here, top right, in the Change style. The intro promises
     "change a single answer, or retake the whole thing" and the second route
     had nowhere to live once RETAKE THE QUESTIONNAIRE began opening this
     screen instead of restarting. Javier's placement, 26 Oct. */
  return closeX() + stepsHTML() +
    '<div class="wz-revhead"><h2>Your answers</h2>' +
      '<button class="wz-again" data-wz="restart">Retake the whole questionnaire</button></div>' +
    '<p class="wz-lede">Change anything and we\'ll rebuild.</p>' +
    E.CATS.map(function(c){
      return '<h3>Section ' + c.n + ' of 5 &middot; ' + esc(c.name) + '</h3>' +
        catQs(c.n).map(function(q, i){ return row(q, c.n, i); }).join("");
    }).join("") +
    '<div class="wz-nav"><span></span>' +
      '<button class="btn primary" data-wz="go:plan">Build my plan</button></div>';
}

var MODAL = {intro: iIntro, cat: iCat, q: iQ, review: iReview};

/* THE WAY OUT. Both screens reopened from the simulator, RETAKE THE
   QUESTIONNAIRE and YOUR COMP PLAN, are things a curious reader opens to look
   at. Until now the only way back was to change an answer or press a build
   button, which is a toll on a look. Javier, 26 Oct: "so people can click and
   exit easy if they are curious but don't want to do any changes."

   ONLY WHEN THERE IS SOMETHING TO GO BACK TO. During the questionnaire itself
   the simulator does not exist yet, so there is no close and the screen has one
   forward action, which is the whole layer model. */
function closeX(){
  if (!WZ.fromSim) return "";
  return '<button class="wz-x" data-wz="toSim" aria-label="Close and go back to the simulator"' +
         ' title="Back to the simulator">&times;</button>';
}

/* ---- the plan view ------------------------------------------------------ */
/* THE PLAN VIEW HAS TWO STATES AND THEY ARE NOT FLATTENED. Out of the
   questionnaire it carries ONE button: dropping somebody into a twenty-row
   review screen seconds after they answered twenty questions is punishment,
   and "Print as PDF" means nothing before the tour has explained what the
   one-pager is. Reopened from the simulator by YOUR COMP PLAN it carries two.

   It never carries "Change an answer". That used to be the third button on the
   return view; once RETAKE THE QUESTIONNAIRE opens the answers screen, a second
   control doing the same thing one layer down is just the confusion. Javier,
   26 Oct, overriding app_shell.md. */
function planFoot(){
  /* CENTRED, not pushed to the right edge. On the answers screen the forward
     button is the last line of a card full of rows and reads as the end of the
     form. Here it is the only thing in a card of its own, 780px wide, and
     space-between threw it into the far corner of all that emptiness: a wide
     white bar with one small control in it. A long document that ends wants its
     action in the middle. Javier spotted it, 26 Oct. */
  if (!WZ.fromSim)
    return '<div class="wz-card wz-planfoot"><div class="wz-nav" style="margin:0">' +
      '<button class="btn primary" data-wz="toSim">Jump to the simulator</button>' +
      '</div></div>';
  return '<div class="wz-card wz-planfoot"><div class="wz-nav" style="margin:0">' +
    '<button class="btn" data-wz="print">Print as PDF</button>' +
    '<button class="btn primary" data-wz="toSim">Jump to the simulator</button>' +
    '</div></div>';
}

/* ---- rendering ---------------------------------------------------------- */
/* The plan behind the blur is built from the answers so far, which is the
   whole point of the layer model: the reader watches the thing form. */
function planNow(){ return E.buildPlan(WZ.ans); }

function render(){
  var w = mount();
  /* `wz-on` is what takes the console out of the page. It was `wz-locked`,
     which only set overflow:hidden on the body, which mock.css already does, so
     it did nothing and the frame stayed visible underneath every screen. The
     class goes on for every screen before the simulator, the plan view
     included, because the plan view is a layer over the simulator too. */
  if (WZ.screen === "sim"){
    w.hidden = true;
    document.body.classList.remove("wz-on");
    return;
  }
  w.hidden = false;
  document.body.classList.add("wz-on");
  if (MODAL[WZ.screen]){
    w.innerHTML =
      '<div class="wz-blurwrap" aria-hidden="true"><div class="wz-blurbg">' +
        E.planHTML(planNow(), false) + '</div></div>' +
      '<div class="wz-scrim"><div class="wz-card wz-modal">' + MODAL[WZ.screen]() + '</div></div>';
    var sc = w.querySelector(".wz-scrim"); if (sc) sc.scrollTop = 0;
  } else {
    /* The plan view. Not a modal: it is a layer of its own over the simulator,
       which is why it scrolls the page rather than a scrim. */
    document.body.classList.remove("wz-locked");
    var P = planNow();
    w.innerHTML = '<div class="wz-planwrap"><div class="wz-planinner">' +
      closeX() + E.planHTML(P, true) + E.onePagerHTML(P) + planFoot() + '</div></div>';
    w.querySelector(".wz-planwrap").scrollTop = 0;
  }
}

/* ---- actions ------------------------------------------------------------ */
function go(s){ WZ.screen = s; WZ.why = false; WZ.lit = null; WZ.litFrom = null; WZ.back = null; render(); }
function goCat(n){ WZ.cat = n; WZ.screen = "cat"; WZ.why = false; WZ.back = null; render(); }
function startCat(n){ WZ.cat = n; WZ.qi = 0; WZ.screen = "q"; WZ.why = false; WZ.back = null; render(); }
function skipCat(n){
  catQs(n).forEach(function(q){ WZ.ans[q.id] = E.AUTO; });
  WZ.skipped[n] = true; afterCat(n);
}

/* BACK TO THE ANSWERS, keeping whatever the answers screen was showing. `go()`
   cannot do this: it clears `lit`, and a reader who came from a red finding is
   looking at the three answers behind it, not at all twenty. */
function backToReview(){ WZ.screen = "review"; WZ.why = false; WZ.back = null; render(); }

/* CHANGING ONE ANSWER NO LONGER RESTARTS THE WALK. A Change link used to drop
   you at that question and then march you through every question after it, so
   fixing a typo in question three meant answering seventeen more. You go back
   to the answers instead, where you can change another or build.

   The answers are live the whole time. Nothing is staged behind BUILD MY PLAN,
   so closing the screen with the x applies what you changed exactly as the
   button would. That is deliberate: the alternative is a warning dialog about
   unsaved answers, which is furniture for a problem nobody has. Javier, 26 Oct:
   "we have to do it because if not we have to create a warning and it is more
   work for something silly." */
function pick(id, k){
  WZ.ans[id] = k; WZ.why = false;
  if (WZ.back === "review") setTimeout(backToReview, 110);
  else if (isLastQ()) render();
  else setTimeout(nextQ, 110);
}
function jump(c, i){
  WZ.cat = c; WZ.qi = i; WZ.screen = "q"; WZ.why = false; WZ.back = "review"; render();
}
function nextQ(){
  var qs = catQs(WZ.cat);
  if (WZ.qi < qs.length - 1){ WZ.qi++; WZ.why = false; render(); }
  else afterCat(WZ.cat);
}
function afterCat(n){ if (n < 5) goCat(n + 1); else go("plan"); }
/* Back out of a question goes wherever the question was entered from. */
function prevQ(){
  if (WZ.back === "review") return backToReview();
  if (WZ.qi > 0){ WZ.qi--; WZ.why = false; render(); } else goCat(WZ.cat);
}
function catBack(){
  if (WZ.cat === 1) go("intro");
  else { WZ.cat--; WZ.qi = catQs(WZ.cat).length - 1; WZ.screen = "q";
         WZ.why = false; WZ.back = null; render(); }
}
function restart(){
  WZ.ans = {}; WZ.skipped = {}; WZ.cat = 1; WZ.qi = 0; WZ.fromSim = false;
  go("intro");
}

/* ---- the two doors between the layers ----------------------------------- */
/* INTO the simulator. The plan is handed over by rebuilding from the answers,
   which is all app.js ever needed; `ST.preset` survives only as the answers
   the blurred preview is drawn from before anything has been answered.
   The tour fires the FIRST time and never again, because it is an introduction
   and a reader who has been shown the room does not need showing twice. */
function toSim(){
  WZ.screen = "sim";
  render();
  if (window.APP && window.APP.fromAnswers) window.APP.fromAnswers(WZ.ans);
  if (!WZ.seen){
    WZ.seen = true;
    /* start(), not show(): show takes a step index and start is the entry
       point that sets `live` and puts the blocking layer up. Calling show()
       bare threw on STEPS[undefined].act and the tour silently never ran. */
    if (window.TOUR && window.TOUR.start) setTimeout(function(){ window.TOUR.start(); }, 260);
  }
}
/* OUT of the simulator, both doors. YOUR COMP PLAN reopens the plan in its
   return state; RETAKE THE QUESTIONNAIRE opens the ANSWERS, not a restart,
   because the tour copy promises it "brings your 20 answers back". */
function openPlan(){ WZ.fromSim = true; go("plan"); }
function openAnswers(){ WZ.fromSim = true; go("review"); }

/* Opens the answers filtered to the ones behind one finding. Never a single
   question, because capacity is quota, segment and deal size pulling together;
   never all twenty, which is the screen Javier objected to twice. */
/* `from` ARRIVES ENCODED and has to be decoded. The engine builds this call as
   an onclick attribute, so the finding's heading goes through
   encodeURIComponent to survive the quoting. The original decoded it on the way
   in; this port did not, so the subtitle on the answers screen read
   "This%20quota%20cannot%20be%20worked%20as%20written". Found 27 Oct by looking
   at what the screen actually said rather than at whether the click worked.
   Callers that pass a plain heading are unaffected: decodeURIComponent leaves a
   string with nothing to decode alone. */
function fixAnswers(ids, from){
  WZ.fromSim = true; WZ.screen = "review"; WZ.why = false;
  WZ.lit = String(ids).split(",");
  WZ.litFrom = "";
  if (from){
    try { WZ.litFrom = decodeURIComponent(from); }
    catch (e){ WZ.litFrom = String(from); }   /* a stray % is not worth throwing over */
  }
  render();
}

/* ---- one delegated listener --------------------------------------------- */
/* The wizard used inline onclick, which cannot survive a Content Security
   Policy and is the first thing a reviewer of the real site would object to.
   One listener, actions named in data-wz. */
var ACTIONS = {
  go: go, goCat: function(n){ goCat(+n); }, startCat: function(n){ startCat(+n); },
  skipCat: function(n){ skipCat(+n); }, prevQ: prevQ, catBack: catBack,
  why: function(){ WZ.why = !WZ.why; render(); },
  pick: function(id, k){ pick(id, k); },
  jump: function(c, i){ jump(+c, +i); },
  showAll: function(){ WZ.lit = null; WZ.litFrom = null; render(); },
  restart: restart, toSim: toSim, print: function(){ window.print(); }
};
document.addEventListener("click", function(e){
  var t = e.target && e.target.closest ? e.target.closest("[data-wz]") : null;
  if (!t) return;
  e.preventDefault();
  var parts = t.getAttribute("data-wz").split(":");
  var fn = ACTIONS[parts[0]];
  if (fn) fn.apply(null, parts.slice(1));
});

/* ---- what the rest of the app can call ---------------------------------- */
/* ---- the two names the engine's own markup calls ------------------------ */
/* THE PLAN'S HTML COMES WITH INLINE HANDLERS ATTACHED. `planHTML` emits
   onclick="fixAnswers(...)" on a red finding's "Change what's driving this",
   and onclick="tip(...)" on each of the little blue question marks beside a
   table row, 38 of them on a full plan. Both resolve against `window`.

   In the standalone wizard those were top-level functions in the page, so they
   were globals and it worked. This file is an IIFE, so `fixAnswers` was private
   and every one of those clicks threw a ReferenceError into the console and did
   nothing at all. Javier found the finding link, 26 Oct; the question marks are
   the same bug and were dead in exactly the same way.

   So the two names go on window deliberately, rather than by accident of scope.
   `tip` is three lines of the engine's own and is reimplemented here because it
   is not in the engine's browser export list.

   WHAT THIS IS NOT. It is not the fix for inline handlers in general. This file
   opens by saying the wizard's onclick attributes "cannot survive a Content
   Security Policy and is the first thing a reviewer of the real site would
   object to", which is why every control THIS file renders goes through one
   delegated listener. The engine's plan markup still carries 40 of them. Moving
   those to data attributes means changing the engine and teaching the
   standalone wizard to listen too, and it was CLOSED 27 Oct rather than done:
   they only matter under a Content Security Policy, GitHub Pages sets none,
   and nobody is setting one on a portfolio site. STATUS has the reasoning. */
window.fixAnswers = function(ids, from){ fixAnswers(ids, from); };
window.tip = function(id){
  var r = document.getElementById("t" + id);
  if (r) r.hidden = !r.hidden;
};

window.WIZARD = {
  render: render, openPlan: openPlan, openAnswers: openAnswers,
  fixAnswers: fixAnswers, restart: restart, toSim: toSim,
  answers: function(){ return WZ.ans; },
  at: function(){ return WZ.screen; },
  /* The checkers' way in: layer-check, mockup-sweep and visual-goldens. Loads
     a preset's answers and goes straight to the simulator without the
     questionnaire. It was the dev bar's escape hatch until the bar came out for
     production, 29 Oct; nothing on the page calls it now. It does NOT start the
     tour: something skipping twenty questions is not a first-time visitor. */
  jumpWithAnswers: function(ans){
    WZ.ans = {}; Object.keys(ans).forEach(function(k){ WZ.ans[k] = ans[k]; });
    WZ.seen = true; WZ.fromSim = false; WZ.screen = "sim"; render();
    if (window.APP && window.APP.fromAnswers) window.APP.fromAnswers(WZ.ans);
  }
};

render();
})();
