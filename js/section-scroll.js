/* ═══════════════════════════════════════════════════════════════════
   PCI UGANDA — custom section scroll
   One gesture makes one deliberate move, on our own easing curve, on
   desktop and on touch alike.

   What keeps it usable is that a section's behaviour follows its size
   (see the modes at measure()): sections that fit hand straight on to the
   next one, mid-length sections page through themselves first so nothing
   is skipped, and genuinely long copy keeps native scrolling and hands
   over only at its edges — a reader is never trapped in a wall of text.

     desktop   wheel · arrows/page keys/space · dot rail · in-page links
     touch     swipe to move; long sections scroll natively and then
               settle onto the nearest section
     always    prefers-reduced-motion disables interception entirely

   Opt out per page with <body class="ss-off">, per section with
   data-ss-skip, and per scrollable widget with data-ss-native.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var doc=document, root=doc.documentElement;
if(!window.requestAnimationFrame || !doc.body) return;
var body=doc.body;
if(body.classList.contains('ss-off')) return;

var reduceMQ=window.matchMedia('(prefers-reduced-motion:reduce)');
var REDUCE=reduceMQ.matches;
if(reduceMQ.addEventListener) reduceMQ.addEventListener('change',function(e){
  REDUCE=e.matches; if(REDUCE) cancel();
});

var SEL='.hero,.page-hero,body > section,main > section,body > footer';
var GAP=430;          /* cooldown between gesture-driven jumps (ms) */
var EDGE=3;           /* px tolerance when testing a section edge */
var T=[], cur=0, maxY=0, headH=0;

/* ───────── targets ───────── */

function label(el,i){
  var d=el.getAttribute('data-ss-label');
  if(d) return d;
  var lead=el.querySelector('.eyebrow,.survey,.spec,.livetag,.crumb');
  var t=lead && lead.textContent;
  if(!t){ var h=el.querySelector('h1,h2'); t=h && h.textContent; }
  if(!t) t=(el.tagName==='FOOTER') ? 'End' : 'Section '+(i+1);
  t=t.replace(/\s+/g,' ').trim();
  t=t.split('·')[0].trim() || t;            /* eyebrows qualify after a middot */
  return t.length>32 ? t.slice(0,31).trim()+'…' : t;
}

function collect(){
  var seen=[], all=[].slice.call(doc.querySelectorAll(SEL));
  all.forEach(function(el){
    if(seen.indexOf(el)>-1) return;
    if(el.hasAttribute('data-ss-skip')) return;
    if(!el.getClientRects().length) return;                 /* hidden */
    if(all.some(function(o){return o!==el && o.contains(el);})) return;
    seen.push(el);
  });
  T=seen.map(function(el,i){ return {el:el,label:label(el,i)}; });
}

function fixedHeaderHeight(){
  var h=doc.querySelector('header');
  if(!h) return 0;
  var cs=window.getComputedStyle(h);
  return (cs.position==='fixed' && cs.display!=='none') ? h.offsetHeight : 0;
}

/* Each section gets one of three modes, from how it sizes against the
   viewport. This is what keeps the scroller adaptive rather than dogmatic:

     snap  fits (or nearly) — one gesture moves to the next section
     page  up to a bit over two screens — a gesture pages through it,
           landing squarely on its top or bottom, then moves on
     free  genuinely long copy — native scrolling, handing over only at
           the edges, because paging a wall of text helps nobody          */
var SNAP_MAX=1.15, PAGE_MAX=2.2;

function measure(){
  headH=fixedHeaderHeight();
  maxY=Math.max(0, root.scrollHeight - window.innerHeight);
  var y=window.pageYOffset, vh=window.innerHeight;
  T.forEach(function(t){
    var r=t.el.getBoundingClientRect();
    /* heroes are designed to sit *under* the transparent header, so they get
       the whole viewport; every other section parks below the solid header */
    var overlay=t.el.classList.contains('hero')||t.el.classList.contains('page-hero');
    var pad=overlay?0:headH;
    var avail=Math.max(120, vh-pad);
    t.y=r.top+y;                                   /* absolute top */
    t.h=r.height;
    t.pad=pad;
    t.mode = r.height<=avail*SNAP_MAX ? 'snap'
           : r.height<=avail*PAGE_MAX ? 'page' : 'free';
    t.fits = t.mode==='snap';
    t.to=Math.max(0, Math.min(maxY, Math.round(t.y-pad)));
    t.end=Math.max(t.to, Math.min(maxY, Math.round(t.y+t.h-vh)));
  });
}

/* index of the section that owns a given scroll position */
function indexAt(y){
  if(!T.length) return 0;
  if(y>=maxY-2) return T.length-1;
  var probe=y+headH+Math.min(window.innerHeight*0.34,240), i=0;
  for(var k=0;k<T.length;k++) if(T[k].y<=probe) i=k;
  return i;
}

/* ───────── the glide ───────── */

var anim=null, lastJump=0;

function easeInOutQuint(t){
  return t<0.5 ? 16*t*t*t*t*t : 1-Math.pow(-2*t+2,5)/2;
}

function cancel(){
  if(anim){ cancelAnimationFrame(anim); anim=null; }
  root.classList.remove('ss-gliding');
}

function glide(y){
  cancel();
  y=Math.max(0,Math.min(maxY,Math.round(y)));
  var from=window.pageYOffset, dist=y-from;
  if(Math.abs(dist)<2) return;
  if(REDUCE){ window.scrollTo(0,y); return; }
  /* duration tracks distance but stays inside a deliberate band, so a
     short hop never feels sluggish and a long one never feels flung */
  var dur=Math.max(430,Math.min(920,270+Math.abs(dist)*0.4));
  var t0=null;
  root.classList.add('ss-gliding');
  anim=requestAnimationFrame(function step(now){
    if(t0===null) t0=now;
    var p=Math.min(1,(now-t0)/dur);
    window.scrollTo(0,Math.round(from+dist*easeInOutQuint(p)));
    if(p<1){ anim=requestAnimationFrame(step); }
    else{ anim=null; root.classList.remove('ss-gliding'); }
  });
}

function goTo(i,mark){
  if(!T.length) return;
  i=Math.max(0,Math.min(T.length-1,i));
  measure();
  if(mark!==false) lastJump=Date.now();
  cur=i; paint();
  glide(T[i].to);
}

/* where one deliberate move in this direction should land */
function nextStop(dir){
  var y=window.pageYOffset, i=indexAt(y), t=T[i];
  if(!t) return null;
  if(t.mode==='snap') return {i:i+dir};
  /* keep a sliver of overlap so no line falls in the crack between pages */
  var pageBy=Math.max(180,(window.innerHeight-t.pad)*0.92);
  if(dir>0){
    if(y>=t.end-EDGE) return {i:i+1};
    return {i:i, y:Math.min(t.end, y+pageBy)};
  }
  if(y<=t.to+EDGE) return {i:i-1};
  return {i:i, y:Math.max(t.to, y-pageBy)};
}

function step(dir){
  measure();
  var s=nextStop(dir);
  if(!s) return;
  if(s.y===undefined){
    if(s.i<0 || s.i>T.length-1) return;
    goTo(s.i);
    return;
  }
  lastJump=Date.now();
  glide(s.y);
  cur=indexAt(s.y); paint();
}

/* ───────── when may a gesture be taken over? ───────── */

function blocked(e){
  if(REDUCE) return true;
  if(!T.length) return true;
  /* an open overlay owns the gesture */
  if(doc.querySelector('.mnav.open')) return true;
  if(body.style.overflow==='hidden') return true;
  var t=e && e.target;
  if(t && t.closest && t.closest('[data-ss-native],input,textarea,select,[contenteditable="true"]'))
    return true;
  return false;
}

/* space and the arrow keys belong to whatever the reader has focused */
function keyOwnedByControl(e){
  var t=e.target;
  return !!(t && t.closest && t.closest('a,button,summary,[role="button"],[tabindex]'));
}

/* Only 'free' sections can refuse the gesture, and only while there is
   still copy left to scroll in the direction of travel. */
function ownsGesture(i,dir){
  var t=T[i], y=window.pageYOffset;
  if(!t) return true;
  if(t.mode!=='free') return true;
  return dir>0 ? y>=t.end-EDGE : y<=t.to+EDGE;
}

/* ───────── wheel ───────── */

var wheelAcc=0, wheelDir=0;

function onWheel(e){
  if(blocked(e)) return;
  if(e.ctrlKey) return;                                  /* pinch zoom */
  if(Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;     /* sideways */

  var dir=e.deltaY>0?1:-1;
  var i=indexAt(window.pageYOffset);

  if(!ownsGesture(i,dir)){ wheelAcc=0; return; }          /* let copy scroll */

  if((dir>0 && i>=T.length-1 && window.pageYOffset>=maxY-2) ||
     (dir<0 && i<=0 && window.pageYOffset<=2)) return;     /* let the page bounce */

  /* swallow the tail of a trackpad flick so one gesture is one move */
  if(Date.now()-lastJump<GAP){ e.preventDefault(); return; }

  /* a little intent, so one stray trackpad tick does nothing */
  if(dir!==wheelDir){ wheelAcc=0; wheelDir=dir; }
  wheelAcc+=e.deltaY;
  e.preventDefault();
  if(Math.abs(wheelAcc)<12) return;
  wheelAcc=0;
  step(dir);
}

/* ───────── keyboard ───────── */

function onKey(e){
  if(e.key==='Escape'){ cancel(); return; }
  if(blocked(e)) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  var k=e.key;
  if((k===' '||k==='ArrowDown'||k==='ArrowUp') && keyOwnedByControl(e)) return;
  var i=indexAt(window.pageYOffset);
  if(k==='ArrowDown'||k==='PageDown'||(k===' '&&!e.shiftKey)){
    if(!ownsGesture(i,1)) return;
    e.preventDefault(); step(1);
  } else if(k==='ArrowUp'||k==='PageUp'||(k===' '&&e.shiftKey)){
    if(!ownsGesture(i,-1)) return;
    e.preventDefault(); step(-1);
  } else if(k==='Home'){ e.preventDefault(); goTo(0); }
  else if(k==='End'){ e.preventDefault(); goTo(T.length-1); }
}

/* ───────── touch ─────────
   On a section that fits, the swipe is taken over: touchmove is cancelled so
   native scrolling — and therefore momentum — never starts, and one swipe
   moves one section. Inside a long section nothing is intercepted at all; the
   reader scrolls normally and we only ease onto the nearest section once
   everything has come to rest.                                            */

var tY=0, tT=0, tLock=false, tFired=false, tTracking=false, settle=null;

function onTouchStart(e){
  tTracking=false; tLock=false; tFired=false;
  if(blocked(e) || e.touches.length!==1) return;
  cancel();
  if(settle){ clearInterval(settle); settle=null; }
  measure();
  tY=e.touches[0].clientY; tT=Date.now(); tTracking=true;
  var t=T[indexAt(window.pageYOffset)];
  tLock=!!(t && t.mode!=='free');
}

function onTouchMove(e){
  if(!tTracking || !tLock || e.touches.length!==1) return;
  /* hold the page still: this is our gesture now */
  if(e.cancelable) e.preventDefault();
  if(tFired) return;
  var dy=tY-e.touches[0].clientY;
  if(Math.abs(dy)<42) return;
  var dir=dy>0?1:-1;
  var i=indexAt(window.pageYOffset);
  if(!ownsGesture(i,dir)) return;
  if(Date.now()-lastJump<GAP) return;
  if(dir>0 && i>=T.length-1 && window.pageYOffset>=maxY-2) return;
  if(dir<0 && i<=0 && window.pageYOffset<=2) return;
  tFired=true;
  step(dir);
}

function onTouchEnd(){
  if(!tTracking) return;
  tTracking=false;
  if(tLock) return;                       /* handled during the gesture */
  scheduleSettle();                       /* let momentum run, then tidy up */
}

function scheduleSettle(){
  if(settle) clearInterval(settle);
  var lastY=-1, quiet=0;
  settle=setInterval(function(){
    var y=window.pageYOffset;
    quiet = Math.abs(y-lastY)<1.2 ? quiet+1 : 0;
    lastY=y;
    if(quiet<2) return;
    clearInterval(settle); settle=null;
    if(REDUCE||anim||tTracking) return;
    measure();
    var i=indexAt(y), t=T[i];
    if(!t||!t.fits) return;                 /* long copy is left alone */
    var off=t.to-y;
    /* only tidy a near miss — never yank the reader across a screen */
    if(Math.abs(off)>6 && Math.abs(off)<window.innerHeight*0.42){
      cur=i; paint(); glide(t.to);
    }
  },70);
}

/* ───────── in-page links ───────── */

function onClick(e){
  if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button) return;
  var a=e.target.closest && e.target.closest('a[href*="#"]');
  if(!a) return;
  var href=a.getAttribute('href')||'';
  var hash=href.slice(href.indexOf('#'));
  if(hash.length<2) return;
  /* only same-document links */
  if(a.pathname!==location.pathname||a.host!==location.host) return;
  var el=doc.getElementById(hash.slice(1));
  if(!el) return;
  e.preventDefault();
  toElement(el);
  if(history.replaceState) history.replaceState(null,'',hash);
}

function toElement(el){
  measure();
  var i=T.findIndex ? T.findIndex(function(t){return t.el===el;}) : -1;
  if(i>-1){ goTo(i); return; }
  lastJump=Date.now();
  glide(el.getBoundingClientRect().top+window.pageYOffset-headH-8);
}

/* ───────── rail, bar, counter ───────── */

var nav=null, bar=null, fill=null, count=null, dots=[], countTimer=null;

function buildUI(){
  if(T.length<3) return;
  nav=doc.createElement('nav');
  nav.className='ssnav';
  nav.setAttribute('aria-label','Page sections');
  var ol=doc.createElement('ol');
  T.forEach(function(t,i){
    var li=doc.createElement('li');
    var b=doc.createElement('button');
    b.type='button';
    b.innerHTML='<span class="sslabel"></span><span class="ssdot"></span>';
    b.querySelector('.sslabel').textContent=t.label;
    b.setAttribute('aria-label','Go to '+t.label);
    b.addEventListener('click',function(){ goTo(i); });
    li.appendChild(b); ol.appendChild(li); dots.push(b);
  });
  nav.appendChild(ol);

  bar=doc.createElement('div');
  bar.className='ssbar'; bar.setAttribute('aria-hidden','true');
  fill=doc.createElement('i'); bar.appendChild(fill);

  count=doc.createElement('div');
  count.className='sscount'; count.setAttribute('aria-hidden','true');

  body.appendChild(nav); body.appendChild(bar); body.appendChild(count);
  requestAnimationFrame(function(){
    nav.classList.add('ready'); bar.classList.add('ready');
  });
}

/* dark sections need the inverted rail treatment */
function isDark(el){
  if(!el) return false;
  if(el.classList.contains('on-dark')||el.classList.contains('on-ink')||
     el.classList.contains('hero')||el.classList.contains('page-hero')||
     el.tagName==='FOOTER') return true;
  var bg=window.getComputedStyle(el).backgroundColor||'';
  var m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if(!m) return false;
  if(m[4]!==undefined && parseFloat(m[4])<0.5) return false;
  var lum=(0.2126*+m[1]+0.7152*+m[2]+0.0722*+m[3])/255;
  return lum<0.45;
}

function paint(){
  if(!nav) return;
  dots.forEach(function(b,i){
    if(i===cur) b.setAttribute('aria-current','step');
    else b.removeAttribute('aria-current');
  });
  var dark=isDark(T[cur]&&T[cur].el);
  nav.classList.toggle('on-dark-bg',dark);
  bar.classList.toggle('on-dark-bg',dark);
  var p=maxY>0 ? Math.min(1,window.pageYOffset/maxY) : 1;
  fill.style.transform='scaleX('+p.toFixed(4)+')';
  count.innerHTML='<b>'+String(cur+1).padStart(2,'0')+'</b> / '+
                  String(T.length).padStart(2,'0');
  count.classList.add('show');
  clearTimeout(countTimer);
  countTimer=setTimeout(function(){ count.classList.remove('show'); },1100);
}

/* ───────── wiring ───────── */

var ticking=false;
function onScroll(){
  if(ticking) return;
  ticking=true;
  requestAnimationFrame(function(){
    ticking=false;
    var i=indexAt(window.pageYOffset);
    if(i!==cur){ cur=i; paint(); }
    else if(nav){
      var p=maxY>0?Math.min(1,window.pageYOffset/maxY):1;
      fill.style.transform='scaleX('+p.toFixed(4)+')';
    }
  });
}

function start(){
  collect();
  if(!T.length) return;
  root.classList.add('ss-on');
  measure();
  buildUI();
  cur=indexAt(window.pageYOffset);
  paint();
  if(count) count.classList.remove('show');

  window.addEventListener('wheel',onWheel,{passive:false});
  window.addEventListener('keydown',onKey);
  window.addEventListener('touchstart',onTouchStart,{passive:true});
  window.addEventListener('touchmove',onTouchMove,{passive:false});
  window.addEventListener('touchend',onTouchEnd,{passive:true});
  window.addEventListener('touchcancel',function(){
    tTracking=false; tLock=false;
  },{passive:true});
  doc.addEventListener('click',onClick);
  window.addEventListener('scroll',onScroll,{passive:true});

  var re=null;
  window.addEventListener('resize',function(){
    clearTimeout(re);
    re=setTimeout(function(){ cancel(); measure(); onScroll(); },140);
  });
  window.addEventListener('load',function(){
    measure();
    if(location.hash.length>1){
      var el=doc.getElementById(location.hash.slice(1));
      if(el) setTimeout(function(){ toElement(el); },60);
    }
  });
  /* late-arriving content (roll of honour, galleries) changes the geometry */
  if(window.ResizeObserver){
    var ro=new ResizeObserver(function(){ measure(); });
    ro.observe(doc.body);
  }

  window.PCIScroll={
    to:toElement, next:function(){step(1);}, prev:function(){step(-1);},
    goTo:goTo, sections:function(){return T.slice();}, remeasure:measure
  };
}

if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start);
else start();
})();
