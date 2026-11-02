/* ===========================================================================
   tour.js  -  the tutorial, ported into the mock-up from tour-harness.html.

   WHAT CHANGED FROM THE HARNESS. The harness drove scenery: a fake tree, a
   fake hovercard, a fake build-page preview with an arrow drawn up to it.
   All of that is gone. This file touches nothing inside app.js and knows
   nothing about ST or render(): every act is the gesture a reader would make,
   performed on the real DOM. Changing the seat fires the real picker's change
   event, the caret click is the real caret, the hover is a real mouseover
   that the real hovercard answers.

   SO EVERY ACT HAS TO BE IDEMPOTENT. show() replays the acts from step 0 on
   every move, which is what makes Back and the jump box land in the right
   state, and the real gestures are TOGGLES: clicking an open caret closes it,
   clicking a selected row deselects it. Each ensure* below reads the state
   before touching it. Never call .click() here without checking first.

   NAMES ARE NOT IN THE COPY. The harness could say "Marcus" because its
   screen never changed. The real tour runs on whatever plan the reader built,
   where the first rep is Imani on #full, Alice on #early and Aisha on #mixed.
   {first} is filled from the row the tour actually hovers. Javier, 20 Oct.

   THE BUILD-PAGE GIST IS THE REAL PAGE, NOT A COPY OF IT. I deleted this on
   19 Oct off Javier's "tutorial doesn't open this, it just shows you where
   the buttons are and what they do", which was about not navigating the
   reader away, not about showing nothing. Restored 20 Oct. The panel is
   FILLED FROM #buildlayer at run time: the heading, the first paragraph and
   the six section titles are cloned out of the real page, so there is no
   second copy of that text to drift. Javier: "no need of new copy".

   THE BLUR-ON-EXIT BUG. The harness's stop() cleared the overlay and the
   acts but never took `blurred` off, so leaving the tour early left the
   console blurred with no way back. stop() is now the single exit and it
   unblurs, unrings, unbeats and closes any open hovercard.
   ======================================================================== */
(function(){
"use strict";

/* =========================================================================
   EVERY WORD THE TOUR SAYS IS IN HERE.

   target : CSS selector(s). null means a centred card with NO dimming, used
            where the point is the whole screen rather than one thing on it.
   prefer : "left" | "right" | "below" | "above". The card never covers what
            it highlights.
   seat   : switches the real person picker. {role:"ae", who:"<name>"} or a
            function returning one.
   act    : "open" | "hover" | "select". The tour performs it.
   beat   : selector that gets the heartbeat while the step shows.
   ring   : outline the targets instead of cutting a hole, card centred.
   wide   : bigger card, for the opening.
   ====================================================================== */
var STEPS = [

{ id:"welcome", target:null, wide:true,
  title:"Your plan is ready",
  body:"Congratulations, your comp plan is built. Everything you are about to see came out "+
       "of the 20 answers you just gave, and a quarter is already running against it. Give "+
       "me a few minutes and I will show you around. Click next and we will start where "+
       "your plan lives." },

{ id:"start", target:"#nav-retake,#nav-plan", prefer:"below",
  title:"This is where it all started",
  body:"YOUR COMP PLAN takes you back to the plan itself, and you can print the one-page "+
       "summary from there. Change your mind about something and RETAKE THE QUESTIONNAIRE "+
       "brings your 20 answers back, with everything rebuilding around them. Now let me "+
       "show you what else came out of it." },

{ id:"files", target:"#f-contract,#f-deck,#f-capacity,#f-tracker", prefer:"left",
  title:"Your plan did not stop at a plan",
  body:"Four documents came out of it while you were answering, every one written from what "+
       "you told me rather than pulled off a shelf. Let me take you through them, starting "+
       "with the one people sign." },

{ id:"agreement", target:"#f-contract", prefer:"left", beat:"#f-contract",
  title:"The COMPENSATION AGREEMENT",
  body:"I have given it a page for every role, so you can hand somebody theirs without "+
       "sending them everybody else's numbers. The [square brackets] are the blanks only "+
       "you can fill in, like your company name. Next, the one you get to present." },

{ id:"deck", target:"#f-deck", prefer:"left", beat:"#f-deck",
  title:"The LAUNCH DECK",
  body:"How the plan is built, the quota tiers, and what it pays at different levels of "+
       "performance. I wrote it from your plan, so every slide is about the team you "+
       "actually have. Now the two for finance." },

{ id:"finance", target:"#f-capacity,#f-tracker", prefer:"left", beat:"#f-capacity,#f-tracker",
  title:"The two finance files",
  body:"The CAPACITY MODEL stress-tests what your plan costs if the team lands under "+
       "target, on it, or well over. The FINANCE TRACKER hands finance the quarter as a "+
       "spreadsheet, exactly as it stood the week you downloaded it. That quarter is the "+
       "simulator, and it is where I am taking you. Click next and watch it come into "+
       "focus." },

{ id:"sim", target:null, pos:"bottom", seat:{role:"revops"}, unblur:true,
  title:"Here is your quarter",
  body:"A full quarter is already running against your plan, and you are watching it as "+
       "RevOps (Admin), the one seat that sees everybody. Let me take you through it, "+
       "starting with time." },

{ id:"week", target:"#lever-week", prefer:"below",
  title:"Move through the quarter",
  body:"Drag WEEK and the quarter plays out: deals close, the numbers move, the findings "+
       "change with them. Drag past week 13 and you have the finished quarter, which is the "+
       "version you want before downloading the FINANCE TRACKER. Now the headline "+
       "numbers." },

{ id:"tiles", target:"#tiles", prefer:"below",
  title:"The headline numbers",
  body:"The numbers that matter most to whoever you are looking as. Every role has their "+
       "own set, so these change as you move around. Underneath them, the people." },

/* The expand is this step's act rather than a step of its own. On a plan with
   managers the tree opens collapsed, so without it the next step has nothing
   to hover: #full shows the company, the CEO and four managers and not one
   rep. 20 steps was already the ceiling. */
{ id:"table", target:"#orgbox", prefer:"right", act:"open",
  title:"Everybody who earns commission",
  body:"Their target, where they stand, and the problems found for them this week in red "+
       "and amber on the right. Every view has a table like this, and this seat gets the "+
       "whole company, so the teams start closed. I have opened one. Click next and we "+
       "will hover over somebody in it." },

{ id:"hover", target:null, prefer:"right", act:"hover", at:"person",
  title:"Hovering over {first}",
  body:"Every bar explains itself: the target, where they stand, and the part of the plan "+
       "they are sitting inside. Now let's pick {first} out and see the quarter from there. "+
       "Click next." },

{ id:"click", target:"#tiles,#deals,#findings", ring:true, act:"select",
  title:"The whole screen is {first}'s now",
  body:"Those headline numbers, those deals, and underneath them the findings: what the "+
       "simulator noticed about {first} this week, coloured by how much it matters. Let me "+
       "show you those deals." },

{ id:"deals", target:"#deals", prefer:"right",
  title:"Where the quarter lives",
  body:"Every deal in it, won, lost and still open. It fills up as you move through the "+
       "weeks, and everything else on screen is counted from it. Now let's see how the same "+
       "quarter looks to the people inside it." },

{ id:"switch", target:"#personas", prefer:"right",
  title:"WHO ARE YOU LOOKING AS",
  body:"This is where you pick the seat you are sitting in. Every role on your plan is in "+
       "here, and each sees the quarter their own way. Click next and I will put you in an "+
       "Account Executive's chair." },

/* The seat is the rep the tour just picked out, so the reader walks into the
   chair of somebody they have already met rather than a stranger. */
{ id:"rep", target:null, pos:"bottom", seat:"picked",
  title:"What an Account Executive sees",
  body:"Same quarter, different job. Their own headline numbers, their own table with "+
       "nobody else's figures on it, and their own findings, written to them rather than "+
       "about them. Now let's look at the same quarter from the very top. Click next for "+
       "the CEO's view." },

{ id:"ceo", target:null, pos:"bottom", seat:{role:"ceo"},
  title:"What the CEO sees",
  body:"Same quarter again, and the question changes completely. Not what am I owed, but is "+
       "this plan buying the revenue we need at a price I can defend. There are four "+
       "controls here I want to show you. Click next." },

{ id:"levers", target:"#lever-quota,#lever-reps,#lever-ret,#lever-ceil", prefer:"below",
  title:"Four what-ifs",
  body:"Move the quota, how many reps have to hit it, the retention lines, or what you are "+
       "willing to spend. The quarter never changes, the same deals close in the same "+
       "weeks. What moves is what they are measured against and what they pay, and it "+
       "follows you into every view and into the files. Almost done, two more things I want "+
       "you to see." },

{ id:"resume", target:"#f-resume", prefer:"left", beat:"#f-resume",
  title:"MY RESUME",
  body:"You can download my resume and my contact details here. And then one last thing, "+
       "the one I really want you to see." },

{ id:"build", target:"#nav-build", prefer:"left", anchor:"#tour-build", panel:true,
  title:"This is the part I would most like you to read",
  body:"Why I built this, how I went about it, and what I used. Each section opens on its "+
       "own, so take the short version or all of it. If any of it is worth a conversation, "+
       "that is what I am hoping for." },

{ id:"finish", target:"#nav-tour", prefer:"below",
  title:"That's the tour",
  body:"Thank you for giving me a few minutes. You can start it again whenever you like "+
       "from TAKE THE TOUR up here, and everything else is yours to explore." }

];

var CONFIRM = {
  title:"Leaving already?",
  body:"There is a lot I would like to show you, and it only takes a few minutes.",
  leave:"Skip the tour",
  stay:"Keep going"
};
var DONE_NOTE = "The tour is always up top, under TAKE THE TOUR.";

/* ---- small helpers ---------------------------------------------------- */
function el(id){ return document.getElementById(id); }
function $(s){ return document.querySelector(s); }
function $$(s){ return [].slice.call(document.querySelectorAll(s)); }
function fire(n, t){ n.dispatchEvent(new Event(t, {bubbles:true})); }
function frame(){ return $(".frame"); }

/* The rep the tour picked out. Filled by the act, read by the copy. */
var PICK = {full:"", first:""};
function fill(t){
  return String(t).replace(/\{first\}/g, PICK.first || "this rep");
}

/* ---- the acts, every one of them idempotent --------------------------- */
function seatOf(s){
  if (s.seat === "picked") return PICK.full ? {role:"ae", who:PICK.full} : {role:"ae"};
  return s.seat || null;
}
function ensureSeat(seat){
  if (!seat) return;
  var rs = el("roleSel");
  if (rs && seat.role && rs.value !== seat.role){ rs.value = seat.role; fire(rs, "change"); }
  if (!seat.who) return;
  var ws = el("whoSel");
  if (!ws) return;
  var has = $$("#whoSel option").some(function(o){ return o.value === seat.who; });
  if (has && ws.value !== seat.who){ ws.value = seat.who; fire(ws, "change"); }
}
/* The first team, opened only if it is shut. The caret carries the glyph:
   ▸ closed, ▾ open. */
function ensureOpen(){
  var c = $('#tree [data-node^="team:"]');
  if (c && (c.textContent || "").indexOf("▸") >= 0) c.click();
}
function personRow(){ return $('#orgbox tr[data-kind="person"]'); }
function remember(r){
  var n = r && r.cells[0] ? (r.cells[0].innerText || "").trim() : "";
  if (n){ PICK.full = n; PICK.first = n.split(/\s+/)[0]; }
}
function ensureHover(){
  var r = personRow(); if (!r) return;
  remember(r);
  r.dispatchEvent(new MouseEvent("mouseover", {bubbles:true}));
}
function ensureSelected(){
  var r = personRow(); if (!r) return;
  remember(r);
  if (r.className.indexOf("sel") < 0) r.click();
}
/* THE PANELS THE BLUR WORKS ON. Fine enough that every step's target sits
   inside exactly one of them: the nav pair is one unit so the `start` step
   clears both, each lever is its own unit so `week` clears one and `levers`
   clears four, each file is its own so `agreement` clears one of five. */
var UNITS = ".topbar > *, #view > .headrow, #view .cols .left > *, " +
            "#levers > *, #tiles, #orgbox, #findings, #rail > *";
function setBlur(on, targetSel){
  $$(".tblur").forEach(function(e){ e.classList.remove("tblur"); });
  /* `tourblur` not `blurred`: `blurred` belongs to HOW DID I BUILD THIS and
     blurs the whole frame, which would defeat the per-panel work below. */
  var f = frame(); if (f) f.classList.toggle("tourblur", !!on);
  if (!on) return;
  var tgts = targetSel ? $$(targetSel) : [];
  $$(UNITS).forEach(function(u){
    var keep = tgts.some(function(t){ return u === t || u.contains(t) || t.contains(u); });
    if (!keep) u.classList.add("tblur");
  });
}
function clearActs(){
  $$(".ringed").forEach(function(e){ e.classList.remove("ringed"); });
  if (window.CARDS && window.CARDS.close) try { window.CARDS.close(); } catch(e){}
}

/* ---- the build-page gist ---------------------------------------------- */
var cycle = null, filled = false;

/* Cloned out of #buildlayer. The heading, the opening paragraph and the six
   section titles come from the real page; the only thing trimmed is the rest
   of the lede, because a preview that never reaches the sections is not
   showing the thing the step is talking about. */
function fillPreview(pan){
  var sheet = $("#buildlayer .sheet"); if (!sheet) return false;
  var h2 = sheet.querySelector("h2");
  var lede = sheet.querySelector(".lede p");
  var secs = $$("#buildlayer .secs details");
  var html = "";
  if (h2) html += "<h2>" + h2.innerHTML + "</h2>";
  if (lede) html += "<p>" + lede.innerHTML + "</p>";
  secs.forEach(function(d){
    var sm = d.querySelector("summary");
    var bp = d.querySelector(".sbody p");
    html += '<div class="sec"><b>' + (sm ? sm.innerHTML : "") + '</b><span class="c">\u25b8</span></div>' +
            '<div class="secbody">' + (bp ? bp.outerHTML : "") + '</div>';
  });
  pan.innerHTML = html;
  return !!html;
}

/* The curve leaves the button going left and slightly UP, then turns down and
   arrives vertically, with the head landing clear of the panel rather than on
   its corner where it vanished into the white. Bowing it the other way made
   it sag like a smile. Harness geometry, unchanged. */
function showPreview(on){
  var pan = el("tour-build"), arr = el("tour-arrow");
  if (!pan || !arr) return;
  if (cycle){ cycle.clear(); cycle = null; }
  if (!on){ pan.style.display = "none"; arr.style.display = "none"; return; }
  if (!filled) filled = fillPreview(pan);
  if (!filled){ pan.style.display = "none"; arr.style.display = "none"; return; }

  pan.style.display = "block";
  var btn = el("nav-build").getBoundingClientRect();
  var top = btn.bottom + scrollY + 74;
  pan.style.top = top + "px";
  pan.style.left = (btn.right + scrollX - pan.offsetWidth) + "px";

  var px = btn.right + scrollX - pan.offsetWidth, py = top;
  var S = { x: btn.left + scrollX + btn.width*0.35, y: btn.bottom + scrollY + 6 };
  var En = { x: px + 78, y: py - 16 };
  var PADX = 26, PADY = 22;
  var bx = Math.min(S.x, En.x) - PADX, by = Math.min(S.y, En.y) - PADY;
  var bw = Math.abs(S.x - En.x) + PADX*2, bh = Math.abs(S.y - En.y) + PADY*2;
  arr.style.display = "block";
  arr.style.left = bx + "px"; arr.style.top = by + "px";
  arr.setAttribute("width", bw); arr.setAttribute("height", bh);
  var sx = S.x - bx, sy = S.y - by, ex = En.x - bx, ey = En.y - by;
  el("tour-arrowpath").setAttribute("d",
    "M" + sx + "," + sy +
    " C " + (sx - (sx-ex)*0.55) + "," + (sy - 16) +
    " "   + ex + "," + (ey - (ey-sy)*0.8) +
    " "   + ex + "," + ey);
  el("tour-arrowhead").setAttribute("d",
    "M" + ex + "," + (ey+4) + " L" + (ex-8) + "," + (ey-11) + " L" + (ex+8) + "," + (ey-11) + " Z");

  /* Two sections, opened and closed, slowly enough to be seen. Cycling all
     six was a carousel; opening one once was over before anybody noticed. */
  var secs = $$("#tour-build .sec"), bods = $$("#tour-build .secbody");
  function set(k, open){
    if (!secs[k]) return;
    secs[k].classList.toggle("open", open);
    var c = secs[k].querySelector("span.c");
    if (c) c.textContent = open ? "\u25be" : "\u25b8";
    if (bods[k]) bods[k].classList.toggle("on", open);
  }
  secs.forEach(function(e, k){ set(k, false); });
  var timers = [ setTimeout(function(){ set(0,true);  }, 800),
                 setTimeout(function(){ set(0,false); }, 3000),
                 setTimeout(function(){ set(2,true);  }, 3700) ];
  cycle = { clear: function(){ timers.forEach(clearTimeout); } };
}

/* ---- placement -------------------------------------------------------- */
var spot, card, block;

function rectOf(sel){
  var els = $$(sel);
  if (!els.length) return null;
  var t=1e9,l=1e9,b=-1e9,r=-1e9;
  els.forEach(function(e){ var q=e.getBoundingClientRect();
    t=Math.min(t,q.top); l=Math.min(l,q.left); b=Math.max(b,q.bottom); r=Math.max(r,q.right); });
  if (!isFinite(t)) return null;
  return { top:t+scrollY, left:l+scrollX, width:r-l, height:b-t };
}
/* The card must never cover what it points at. Candidates are tried in order
   and the first that fits without touching the highlight wins. */
function place(r, prefer){
  var W = card.offsetWidth, H = card.offsetHeight, G = 16, M = 12;
  var rev = $(".review");
  var topGuard = scrollY + (rev ? rev.getBoundingClientRect().bottom + 8 : M);
  var vb = scrollY + innerHeight - M;
  var vl = scrollX + M, vr = scrollX + innerWidth - M;
  var mid = { x: r.left + r.width/2 - W/2, y: r.top + r.height/2 - H/2 };
  var cand = {
    below:{ x:mid.x, y:r.top + r.height + G },
    above:{ x:mid.x, y:r.top - H - G },
    left: { x:r.left - W - G, y:mid.y },
    right:{ x:r.left + r.width + G, y:mid.y }
  };
  var order = prefer ? [prefer].concat(Object.keys(cand).filter(function(k){ return k!==prefer; }))
                     : ["below","above","right","left"];
  for (var n=0;n<order.length;n++){
    var k = order[n], x = cand[k].x, y = cand[k].y;
    x = Math.min(Math.max(x, vl), vr - W);
    y = Math.min(Math.max(y, topGuard), vb - H);
    var hit = !(x + W < r.left - 2 || x > r.left + r.width + 2 ||
                y + H < r.top - 2  || y > r.top + r.height + 2);
    if (!hit && y >= topGuard && y + H <= vb && x >= vl && x + W <= vr) return { x:x, y:y };
  }
  return { x: Math.min(Math.max(mid.x, vl), vr - W),
           y: Math.min(Math.max(mid.y, topGuard), vb - H) };
}

/* ---- the tour --------------------------------------------------------- */
var i = 0, live = false, warned = false, everFinished = false, hovT = null;

function show(n){
  i = Math.max(0, Math.min(STEPS.length-1, n));
  var s = STEPS[i], k;

  /* Replay the seat and the acts from the top, so Back and the jump box land
     in the right state. Everything called here checks before it touches. */
  var seat = {role:"revops"};
  for (k = 0; k <= i; k++){ var q = seatOf(STEPS[k]); if (q) seat = q; }
  ensureSeat(seat);

  clearActs();
  for (k = 0; k <= i; k++){
    if (STEPS[k].act === "open") ensureOpen();
    if (STEPS[k].act === "select" && k <= i) ensureSelected();
  }
  /* THE HOVERCARD IS PART OF THE OBSTACLE, NOT JUST THE ROW. The card is
     placed against the row below, but the hovercard the hover summons is
     318px wide and lands beside it, and placing against the row alone put
     the tour card straight on top of the thing the step is explaining. It
     takes 120ms to appear (cards.js debounces the hover), so it cannot be
     measured on this pass: re-place once it is up. */
  clearTimeout(hovT);
  if (s.act === "hover"){
    ensureHover();
    hovT = setTimeout(function(){ if (live && STEPS[i] === s) replaceOverHover(s); }, 230);
  }

  var clear = false;
  for (k = 0; k <= i; k++) if (STEPS[k].unblur) clear = true;
  /* The gist step re-blurs, the way the harness did: the preview is a layer
     over the simulator and it has to be the only sharp thing on screen. */
  setBlur(!clear || !!s.panel, s.target);
  showPreview(!!s.panel);

  $$(".file.beat").forEach(function(e){ e.classList.remove("beat"); });
  if (s.beat) $$(s.beat).forEach(function(e){ e.classList.add("beat"); });

  card.classList.toggle("wide", !!s.wide);
  el("tour-title").textContent = fill(s.title);
  el("tour-body").textContent  = fill(s.body);
  el("tour-back").style.visibility = i ? "visible" : "hidden";
  el("tour-next").textContent = i === STEPS.length-1 ? "Finish" : "Next";
  card.style.display = "block";

  var PAD = 7;
  if (s.ring){
    spot.style.display = "none";
    $$(s.target).forEach(function(e){ e.classList.add("ringed"); });
    var hole = rectOf(s.over || "#orgbox") || rectOf("#view");
    if (hole){
      card.style.left = (hole.left + hole.width/2 - card.offsetWidth/2) + "px";
      card.style.top  = (hole.top  + hole.height/2 - card.offsetHeight/2) + "px";
    }
    return;
  }
  /* at:"person" points the card at the row the act just hovered, which has no
     id of its own and is rebuilt on every render, so it cannot be a selector. */
  var r = s.at === "person" ? rowRect() : (s.target ? rectOf(s.target) : null);
  if (!r){
    spot.style.display = "none";
    card.style.left = (scrollX + innerWidth/2 - card.offsetWidth/2) + "px";
    card.style.top  = s.pos === "bottom"
      ? (scrollY + innerHeight - card.offsetHeight - 22) + "px"
      : (scrollY + innerHeight/2 - card.offsetHeight/2) + "px";
    return;
  }
  spot.style.display = "block";
  spot.style.top = (r.top-PAD)+"px"; spot.style.left = (r.left-PAD)+"px";
  spot.style.width = (r.width+PAD*2)+"px"; spot.style.height = (r.height+PAD*2)+"px";
  /* `anchor` lets a step highlight one thing and sit the card beside another,
     which is what the gist step needs: the BUTTON is highlighted, the card
     belongs next to the PANEL. */
  var an = s.anchor ? rectOf(s.anchor) : null;
  var p = an ? place(an, s.prefer)
             : place({ top:r.top-PAD, left:r.left-PAD, width:r.width+PAD*2, height:r.height+PAD*2 },
                     s.prefer);
  card.style.top = p.y+"px"; card.style.left = p.x+"px";
}
function rowRect(){
  var r = personRow(); if (!r) return null;
  var q = r.getBoundingClientRect();
  return { top:q.top+scrollY, left:q.left+scrollX, width:q.width, height:q.height };
}
function union(a, b){
  if (!a) return b; if (!b) return a;
  var t = Math.min(a.top, b.top), l = Math.min(a.left, b.left),
      r = Math.max(a.left+a.width, b.left+b.width),
      m = Math.max(a.top+a.height, b.top+b.height);
  return { top:t, left:l, width:r-l, height:m-t };
}
/* Called once the hovercard is actually on screen. The SPOT stays on the row,
   because the row is what the reader should look at; only the card moves. */
function replaceOverHover(s){
  var hc = $(".hovcard.on") || $(".hovcard");
  if (hc && getComputedStyle(hc).display === "none") hc = null;
  var hr = null;
  if (hc){ var q = hc.getBoundingClientRect();
    hr = { top:q.top+scrollY, left:q.left+scrollX, width:q.width, height:q.height }; }
  var r = union(rowRect(), hr);
  if (!r) return;
  var PAD = 7;
  var p = place({ top:r.top-PAD, left:r.left-PAD, width:r.width+PAD*2, height:r.height+PAD*2 },
                s.prefer);
  card.style.top = p.y+"px"; card.style.left = p.x+"px";
}

function start(){
  live = true; i = 0;
  block.style.display = "block";
  show(0);
}
/* PUT THE SCREEN BACK. The tour walks you from RevOps to a rep's seat to the
   CEO's, so wherever it stops is somewhere the reader never chose to be, and
   leaving them there reads as the tour having moved their furniture. Javier,
   20 Oct. Applied to SKIP as well as FINISH for the same reason: bailing out
   at the levers step should not strand you on a CEO view either.

   The selection goes too, because a rep left selected means the tiles, the
   deal table and the findings are still filtered to one person, which is not
   RevOps. Clicking the COMPANY row is how app.js clears it ("the company row
   IS the unselected state"), which beats toggling the person row off.

   The opened team is left open. The tour opened it in front of the reader and
   shutting it again would undo something they watched happen. */
function restore(){
  ensureSeat({role:"revops"});
  if ($('#orgbox tr[data-kind="person"].sel')){
    var co = $('#orgbox tr[data-kind="co"]');
    if (co) co.click();
  }
}

/* THE ONE WAY OUT. Everything the tour turned on is turned off here: the
   blur above all, which is what used to survive an early exit. */
function stop(){
  live = false;
  clearTimeout(hovT);
  spot.style.display = "none";
  card.style.display = "none";
  block.style.display = "none";
  clearActs();
  $$(".file.beat").forEach(function(e){ e.classList.remove("beat"); });
  showPreview(false);
  setBlur(false);
  restore();
}
function finish(){
  everFinished = true; stop();
  var d = el("tour-done");
  d.textContent = DONE_NOTE; d.style.display = "block";
  setTimeout(function(){ d.style.display = "none"; }, 5000);
}
function tryClose(){
  if (warned || everFinished) return stop();
  warned = true;
  el("tour-cfttl").textContent  = CONFIRM.title;
  el("tour-cfbody").textContent = CONFIRM.body;
  el("tour-cfleave").textContent = CONFIRM.leave;
  el("tour-cfstay").textContent  = CONFIRM.stay;
  el("tour-confirm").style.display = "flex";
}

function mount(){
  spot = el("tour-spot"); card = el("tour-card"); block = el("tour-block");
  if (!spot || !card || !block) return;
  el("tour-next").onclick = function(){ return i===STEPS.length-1 ? finish() : show(i+1); };
  el("tour-back").onclick = function(){ show(i-1); };
  el("tour-x").onclick = tryClose;
  el("tour-cfstay").onclick  = function(){ el("tour-confirm").style.display="none"; };
  el("tour-cfleave").onclick = function(){ el("tour-confirm").style.display="none"; stop(); };
  var nav = el("nav-tour");
  if (nav) nav.onclick = function(){ warned = false; start(); };
  document.addEventListener("keydown", function(e){
    if (!live) return;
    if (e.key === "ArrowRight") el("tour-next").click();
    if (e.key === "ArrowLeft" && i) show(i-1);
    if (e.key === "Escape") tryClose();
  });
  addEventListener("resize", function(){ if (live) show(i); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();

window.TOUR = { start:start, stop:stop, show:show, steps:STEPS, at:function(){ return i; } };
})();
