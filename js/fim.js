/* FAITH IN MOTION — shared page script.
   Reads window.ROLL_DATA from js/roll-data.js. Every feature checks for its
   elements first, so any page can include this file and use only what it has. */
(function(){
  "use strict";
  var STEP_UGX=1000, TOTAL_STEPS=466200, ROUTE_KM=345;
  var M_PER_STEP=(ROUTE_KM*1000)/TOTAL_STEPS;
  var REDUCE=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $=function(id){return document.getElementById(id);};
  var ROLL=(window.ROLL_DATA||[]).slice();

  function fmt(n){return Number(n).toLocaleString('en-US');}
  function ugx(n){return 'UGX '+fmt(n);}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* ---------- totals ---------- */
  var T={amt:0,steps:0,paid:0,paidS:0,paidN:0,pled:0,pledS:0,pledN:0,n:ROLL.length};
  ROLL.forEach(function(r){
    T.amt+=r[1]; T.steps+=r[2];
    if(r[3]==='paid'){T.paid+=r[1];T.paidS+=r[2];T.paidN++;}
    else {T.pled+=r[1];T.pledS+=r[2];T.pledN++;}
  });
  var LEFT=TOTAL_STEPS-T.steps;

  /* ---------- count-up ---------- */
  function countTo(el,to,dur,pre){
    if(!el) return;
    if(REDUCE){ el.textContent=(pre||'')+fmt(to); return; }
    var t0=null;
    function tick(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3);
      el.textContent=(pre||'')+fmt(Math.round(to*e)); if(p<1)requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }

  /* ---------- hero stats (home) ---------- */
  var heroRan=false;
  function runHero(){
    if(heroRan||!$('hRaised')) return; heroRan=true;
    countTo($('hSteps'),TOTAL_STEPS,1200);
    countTo($('hRaised'),T.amt,1500,'UGX ');
    countTo($('hSponsors'),T.n,900);
  }

  /* ---------- road figure ---------- */
  var roadRan=false;
  function runRoad(){
    if(roadRan) return;
    var fill=$('rFill'), walker=$('rWalker');
    countTo($('roadCount'),T.steps,1500);
    countTo($('gapSteps'),LEFT,1500);
    if(!fill||!fill.getTotalLength){ roadRan=true; return; }
    roadRan=true;
    var L=fill.getTotalLength();
    var frac=Math.max(T.steps/TOTAL_STEPS,0.014);
    fill.style.strokeDasharray=L;
    function place(f){ if(!walker) return; var pt=fill.getPointAtLength(L*f); walker.setAttribute('transform','translate('+pt.x+','+pt.y+')'); }
    if(REDUCE){ fill.style.strokeDashoffset=L-(L*frac); place(frac); return; }
    fill.style.strokeDashoffset=L;
    var t0=null;
    function tk(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/1700,1); var e=1-Math.pow(1-p,3);
      fill.style.strokeDashoffset=L-(L*frac*e); place(frac*e); if(p<1)requestAnimationFrame(tk); }
    requestAnimationFrame(tk);
  }

  /* ---------- sponsor instrument ---------- */
  var steps=100;
  var tiers=Array.prototype.slice.call(document.querySelectorAll('.tier'));
  var cIn=$('cSteps');
  function refresh(){
    if(!$('outAmt')) return;
    var amt=steps*STEP_UGX;
    $('outAmt').textContent=ugx(amt);
    var m=steps*M_PER_STEP;
    if($('outDist')) $('outDist').textContent = m>=1000 ? (m/1000).toFixed(2)+' kilometres' : Math.round(m)+' metres';
    if($('outBar')) $('outBar').style.width=Math.min((steps/2000)*100,100)+'%';
    if($('waPledge')){
      var msg='I am sponsoring '+fmt(steps)+' steps ('+ugx(amt)+') for Faith in Motion — the walk to complete St Joseph Rwembyo Catholic Church. Please record my pledge on the Roll of Honour.';
      if(window.__ref) msg+=' (Invited by: '+window.__ref+')';
      $('waPledge').href='https://wa.me/256772495733?text='+encodeURIComponent(msg);
    }
  }
  if(tiers.length){
    tiers.forEach(function(t){ t.addEventListener('click',function(){
      tiers.forEach(function(x){x.classList.remove('on');}); t.classList.add('on');
      steps=parseInt(t.getAttribute('data-s'),10); if(cIn) cIn.value=''; refresh();
    });});
  }
  if(cIn){
    cIn.addEventListener('input',function(){
      var v=parseInt(cIn.value,10);
      if(v>0){ tiers.forEach(function(x){x.classList.remove('on');}); steps=v; refresh(); }
    });
  }
  /* deep links: ?steps= & ?ref= */
  (function(){
    var qs=new URLSearchParams(window.location.search);
    var q=parseInt(qs.get('steps'),10), qr=qs.get('ref');
    if(qr) window.__ref=qr.slice(0,40);
    if(q>0 && tiers.length){
      steps=q; var hit=false;
      tiers.forEach(function(x){ x.classList.remove('on');
        if(parseInt(x.getAttribute('data-s'),10)===q){x.classList.add('on');hit=true;} });
      if(!hit && cIn) cIn.value=q;
      setTimeout(function(){ var el=$('sponsor'); if(el) el.scrollIntoView({behavior:REDUCE?'auto':'smooth',block:'start'}); },420);
    }
  })();
  refresh();

  /* ---------- roll ledger ---------- */
  var body=$('ledgerBody');
  if(body){
    var full = body.hasAttribute('data-full');
    var expanded=full;
    function renderRoll(){
      var rows=expanded?ROLL:ROLL.slice(0,8);
      body.innerHTML=rows.map(function(r,i){
        return '<div class="lrow"><span class="i">'+String(i+1).padStart(2,'0')+'</span>'
          +'<span class="n">'+esc(r[0])+(r[4]?'<em>'+esc(r[4])+'</em>':'')+'</span>'
          +'<span class="a">'+ugx(r[1])+'<i>'+fmt(r[2])+' steps</i></span>'
          +'<span class="s"><span class="pill '+r[3]+'">'+r[3]+'</span></span></div>';
      }).join('');
      if($('rollToggle')) $('rollToggle').textContent=expanded?'Show fewer':('Show all '+ROLL.length+' sponsors');
    }
    if($('rollToggle')) $('rollToggle').addEventListener('click',function(){ expanded=!expanded; renderRoll(); });
    renderRoll();
  }
  if($('tPaid')){
    $('tPaid').textContent=ugx(T.paid); if($('tPaidC')) $('tPaidC').textContent=fmt(T.paidS)+' steps · '+T.paidN+' sponsors';
    $('tPled').textContent=ugx(T.pled); if($('tPledC')) $('tPledC').textContent=fmt(T.pledS)+' steps · '+T.pledN+' sponsors';
    $('tTot').textContent=ugx(T.amt);   if($('tTotC')) $('tTotC').textContent=fmt(T.steps)+' steps · '+T.n+' sponsors';
  }
  /* generic stat mounts: any element with data-t="amt|steps|left|n|paid|pled" */
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'),function(el){
    var k=el.getAttribute('data-t');
    var map={amt:ugx(T.amt),steps:fmt(T.steps),left:fmt(LEFT),n:fmt(T.n),paid:ugx(T.paid),pled:ugx(T.pled)};
    if(map[k]!==undefined) el.textContent=map[k];
  });

  /* ---------- copy & share ---------- */
  var toast=$('toast');
  function showToast(t){ if(!toast) return; toast.textContent=t; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show');},1700); }
  function copy(txt,label){
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){showToast(label);},function(){showToast('Could not copy — please copy it by hand');});}
    else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(label);}catch(e){showToast('Could not copy — please copy it by hand');}ta.remove();}
  }
  if($('copyNo')) $('copyNo').addEventListener('click',function(){copy('0772495733','Number copied');});
  if($('copyLink')) $('copyLink').addEventListener('click',function(){copy(window.location.href,'Link copied');});
  if($('waShare')) $('waShare').href='https://wa.me/?text='+encodeURIComponent('Faith in Motion — 345 km on foot to finish St Joseph Rwembyo Catholic Church. Sponsor a step for UGX 1,000: '+window.location.href);

  /* ---------- photographs ---------- */
  var ASSETS=window.FIM_ASSETS||{};
  var CAPTIONS={walker:"On the road to Rwembyo",church:"St Joseph Rwembyo, as it stands today",road:"The road ahead",parish:"The parish community",build:"Construction progress"};
  Object.keys(ASSETS).forEach(function(k){
    var src=ASSETS[k]; if(!src) return;
    var el=document.querySelector('[data-slot="'+k+'"]'); if(!el) return;
    var img=new Image();
    img.alt=CAPTIONS[k]||""; img.loading="lazy"; img.decoding="async";
    img.onload=function(){
      el.classList.remove('pending');
      el.insertBefore(img,el.firstChild);
      var fb=el.querySelector('.fallback'); if(fb) fb.style.display='none';
      var cap=el.querySelector('.cap'); if(cap) cap.textContent=CAPTIONS[k]||"";
    };
    img.src=src;
  });

  /* ---------- header, rail, reveals ---------- */
  var hdr=$('hdr'), rail=$('rail'), railFill=$('railFill'), railBead=$('railBead'), railKm=$('railKm');
  var hero=$('top');
  function onScroll(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    var hh=hero?hero.offsetHeight:320;
    if(hdr){ if(y>hh*0.6) hdr.classList.add('solid'); else hdr.classList.remove('solid'); }
    if(rail){
      if(y>hh*0.72) rail.classList.add('show'); else rail.classList.remove('show');
      var doc=document.documentElement.scrollHeight-window.innerHeight;
      var p=doc>0?Math.min(Math.max(y/doc,0),1):0;
      if(railFill) railFill.style.height=(p*100)+'%';
      if(railBead) railBead.style.top=(p*100)+'%';
      if(railKm) railKm.textContent=Math.round(p*ROUTE_KM)+' km';
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll); onScroll();

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
    var rs=$('road');
    if(rs){
      var ro=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ runRoad(); ro.disconnect(); } });
      },{threshold:0.25});
      ro.observe(rs);
    } else { runRoad(); }
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
    runRoad();
  }

  if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(function(){setTimeout(runHero,80);}); }
  window.addEventListener('load',function(){setTimeout(runHero,140);});
  setTimeout(runHero,800);
})();
