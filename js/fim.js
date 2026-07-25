/* FAITH IN MOTION — shared page script.
   Reads window.ROLL_DATA (js/roll-data.js). Every feature checks for its
   elements first, so any page can include this file and use only what it has.

   Everything below is DERIVED from the roll. No total, distance, percentage
   or segment is ever hard-coded. */
(function(){
  "use strict";
  var STEP_UGX=1000, TOTAL_STEPS=466200, ROUTE_KM=345;
  var M_PER_STEP=(ROUTE_KM*1000)/TOTAL_STEPS;          /* 0.74003 m — 74 cm */
  var mq=window.matchMedia('(prefers-reduced-motion:reduce)');
  var REDUCE=mq.matches;
  if(mq.addEventListener) mq.addEventListener('change',function(e){REDUCE=e.matches;});
  var $=function(id){return document.getElementById(id);};
  var ROLL=(window.ROLL_DATA||[]).slice();
  var WAYS=(window.ROUTE_WAYPOINTS||[]).slice();
  var LIVE=window.WALK_LIVE||{active:false};

  function fmt(n){return Number(n).toLocaleString('en-US');}
  function ugx(n){return 'UGX '+fmt(n);}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* ── totals ─────────────────────────────────────────────────── */
  var T={amt:0,steps:0,paid:0,paidS:0,paidN:0,pled:0,pledS:0,pledN:0,n:ROLL.length};
  ROLL.forEach(function(r){
    T.amt+=r[1]; T.steps+=r[2];
    if(r[3]==='paid'){T.paid+=r[1];T.paidS+=r[2];T.paidN++;}
    else {T.pled+=r[1];T.pledS+=r[2];T.pledN++;}
  });
  var LEFT=TOTAL_STEPS-T.steps;
  var PCT=T.steps/TOTAL_STEPS;

  /* ── 1 · STEP ATTRIBUTION ───────────────────────────────────────
     Sponsors are allocated sequentially along the road, so the gold
     line on the route graphic IS the sponsored road and every sponsor
     owns a real, locatable piece of it. */
  function kmOf(step){ return (step*M_PER_STEP)/1000; }
  function placeAt(km){
    if(!WAYS.length) return "";
    var best=WAYS[0];
    for(var i=0;i<WAYS.length;i++){ if(WAYS[i][0]<=km) best=WAYS[i]; }
    var next=null;
    for(var j=0;j<WAYS.length;j++){ if(WAYS[j][0]>km){ next=WAYS[j]; break; } }
    if(next && (next[0]-km) < (km-best[0])) return "approaching "+next[1];
    return "past "+best[1];
  }
  var cursor=0;
  ROLL.forEach(function(r){
    r._from=cursor; cursor+=r[2]; r._to=cursor;
    r._kmFrom=kmOf(r._from); r._kmTo=kmOf(r._to);
    r._place=placeAt(r._kmFrom);
  });
  function segLabel(kmFrom,kmTo){
    return 'km '+kmFrom.toFixed(3)+' – '+kmTo.toFixed(3);
  }

  /* ── 3 · THE UNIT TRADE ─────────────────────────────────────────
     One sentence, injected anywhere [data-unit] appears. */
  var CM=Math.round(M_PER_STEP*100);
  var UNIT='UGX '+fmt(STEP_UGX)+' = one step = '+CM+' centimetres of road';
  Array.prototype.forEach.call(document.querySelectorAll('[data-unit]'),function(el){
    el.textContent=UNIT;
  });

  /* ── 4 · MILESTONES ─────────────────────────────────────────────
     25/50/75/100 are pinned on the graphic. The *next* threshold is
     chosen from a finer ladder, because a near target converts. */
  var LADDER=[0.01,0.025,0.05,0.10,0.25,0.50,0.75,1.00];
  var nextPct=null;
  for(var li=0;li<LADDER.length;li++){ if(LADDER[li]>PCT){ nextPct=LADDER[li]; break; } }
  var nextSteps=nextPct?Math.ceil(TOTAL_STEPS*nextPct)-T.steps:0;
  function pctLabel(p){ return (p*100)%1===0 ? (p*100)+'%' : (p*100).toFixed(1)+'%'; }
  if($('msNext')&&nextPct){
    $('msNext').textContent=fmt(nextSteps)+' steps to the '+pctLabel(nextPct)+' marker';
  }
  if($('msPct')) $('msPct').textContent=(PCT*100).toFixed(2)+'%';

  /* ── count-up ───────────────────────────────────────────────── */
  function countTo(el,to,dur,pre,suf){
    if(!el) return;
    if(REDUCE){ el.textContent=(pre||'')+fmt(to)+(suf||''); return; }
    var t0=null;
    function tick(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3);
      el.textContent=(pre||'')+fmt(Math.round(to*e))+(suf||''); if(p<1)requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }

  var heroRan=false;
  function runHero(){
    if(heroRan||!$('hRaised')) return; heroRan=true;
    countTo($('hSteps'),TOTAL_STEPS,1200);
    countTo($('hRaised'),T.amt,1500,'UGX ');
    countTo($('hSponsors'),T.n,900);
  }

  /* ── road figure + milestone pins ───────────────────────────── */
  var roadRan=false;
  function runRoad(){
    if(roadRan) return;
    var fill=$('rFill'), walker=$('rWalker'), path=$('rPath');
    countTo($('roadCount'),T.steps,1500);
    countTo($('gapSteps'),LEFT,1500);
    if(!fill||!fill.getTotalLength){ roadRan=true; return; }
    roadRan=true;
    var L=fill.getTotalLength();

    /* place 25/50/75 pins along the real path geometry */
    var pinLayer=$('rPins');
    if(pinLayer&&path&&path.getPointAtLength){
      var PL=path.getTotalLength();
      [0.25,0.5,0.75].forEach(function(p){
        var pt=path.getPointAtLength(PL*p);
        var g=document.createElementNS('http://www.w3.org/2000/svg','g');
        g.setAttribute('transform','translate('+pt.x+','+pt.y+')');
        g.setAttribute('class','pin');
        g.innerHTML='<line x1="0" y1="-9" x2="0" y2="9" stroke="#8B7C63" stroke-width="2"/>'
          +'<text x="0" y="-15" text-anchor="middle" font-family="JetBrains Mono, monospace"'
          +' font-size="11" fill="#8B7C63">'+(p*100)+'%</text>';
        pinLayer.appendChild(g);
      });
    }

    var frac=Math.max(PCT,0.014);
    fill.style.strokeDasharray=L;
    function place(f){ if(!walker) return; var pt=fill.getPointAtLength(L*f); walker.setAttribute('transform','translate('+pt.x+','+pt.y+')'); }
    if(REDUCE){ fill.style.strokeDashoffset=L-(L*frac); place(frac); return; }
    fill.style.strokeDashoffset=L;
    var t0=null;
    function tk(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/1700,1); var e=1-Math.pow(1-p,3);
      fill.style.strokeDashoffset=L-(L*frac*e); place(frac*e); if(p<1)requestAnimationFrame(tk); }
    requestAnimationFrame(tk);
  }

  /* ── sponsor instrument ─────────────────────────────────────── */
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

    /* 1 · show the exact segment these steps would claim next */
    if($('outSeg')){
      var from=kmOf(T.steps), to=kmOf(T.steps+steps);
      $('outSeg').textContent=segLabel(from,to);
      if($('outPlace')) $('outPlace').textContent=placeAt(from);
    }
    if($('waPledge')){
      var seg=$('outSeg')?(' That claims '+segLabel(kmOf(T.steps),kmOf(T.steps+steps))+' of the road.'):'';
      var msg='I am sponsoring '+fmt(steps)+' steps ('+ugx(amt)+') for Faith in Motion — the walk to complete St Joseph Rwembyo Catholic Church.'+seg+' Please record my pledge on the Roll of Honour.';
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

  /* ── 6 · ROLL OF HONOUR, live ───────────────────────────────── */
  function recency(iso){
    if(!iso) return '';
    var t=Date.parse(iso+'T12:00:00Z'); if(isNaN(t)) return '';
    var days=Math.floor((Date.now()-t)/86400000);
    if(days<0) return '';
    if(days===0) return 'today';
    if(days===1) return 'yesterday';
    if(days<7) return days+' days ago';
    if(days<14) return 'last week';
    if(days<61) return Math.floor(days/7)+' weeks ago';
    return Math.floor(days/30)+' months ago';
  }
  var body=$('ledgerBody');
  if(body){
    var full = body.hasAttribute('data-full');
    var expanded=full;
    function renderRoll(){
      var rows=expanded?ROLL:ROLL.slice(0,8);
      body.innerHTML=rows.map(function(r,i){
        var when=recency(r[5]);
        return '<div class="lrow"><span class="i">'+String(i+1).padStart(2,'0')+'</span>'
          +'<span class="n">'+esc(r[0])
            +(r[4]?'<em>'+esc(r[4])+'</em>':'')
            +'<i class="seg">'+segLabel(r._kmFrom,r._kmTo)+' · '+esc(r._place)+'</i>'
            +(when?'<i class="when">sponsored '+when+'</i>':'')
          +'</span>'
          +'<span class="a">'+ugx(r[1])+'<i>'+fmt(r[2])+' steps</i></span>'
          +'<span class="s"><span class="pill '+r[3]+'">'+r[3]+'</span></span></div>';
      }).join('');
      if($('rollToggle')) $('rollToggle').textContent=expanded?'Show fewer':('Show all '+ROLL.length+' sponsors');
    }
    if($('rollToggle')) $('rollToggle').addEventListener('click',function(){ expanded=!expanded; renderRoll(); });
    renderRoll();
  }

  /* leading sponsors band */
  var lead=$('leadBand');
  if(lead){
    var top=ROLL.slice().sort(function(a,b){return b[1]-a[1];}).slice(0,3);
    lead.innerHTML=top.map(function(r,i){
      return '<div class="lead"><span class="r">'+(i+1)+'</span><span><b>'+esc(r[0])+'</b>'
        +'<span>'+fmt(r[2])+' steps · '+segLabel(r._kmFrom,r._kmTo)+'</span></span></div>';
    }).join('');
  }

  /* ── 7 · PLEDGED vs FULFILLED ───────────────────────────────── */
  if($('tPaid')){
    $('tPaid').textContent=ugx(T.paid); if($('tPaidC')) $('tPaidC').textContent=fmt(T.paidS)+' steps · '+T.paidN+' sponsors';
    $('tPled').textContent=ugx(T.pled); if($('tPledC')) $('tPledC').textContent=fmt(T.pledS)+' steps · '+T.pledN+' sponsors';
    $('tTot').textContent=ugx(T.amt);   if($('tTotC')) $('tTotC').textContent=fmt(T.steps)+' steps · '+T.n+' sponsors';
  }
  var pf=$('pfBar');
  if(pf){
    var share=T.amt?(T.paid/T.amt):0;
    if(!REDUCE){ pf.style.transition='transform 1.2s cubic-bezier(.22,1,.36,1)'; }
    pf.style.transformOrigin='left';
    pf.style.transform='scaleX('+(REDUCE?share:0)+')';
    if(!REDUCE) setTimeout(function(){ pf.style.transform='scaleX('+share+')'; },320);
    if($('pfPaid')) $('pfPaid').textContent=ugx(T.paid);
    if($('pfPled')) $('pfPled').textContent=ugx(T.pled);
    if($('pfPct'))  $('pfPct').textContent=Math.round(share*100)+'% fulfilled';
  }
  if($('waFulfil')){
    $('waFulfil').href='https://wa.me/256772495733?text='+encodeURIComponent(
      'I would like to complete the pledge I made to Faith in Motion. Please confirm the steps recorded against my name so I can send the balance.');
  }

  /* generic stat mounts */
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'),function(el){
    var m=Math.round(T.steps*M_PER_STEP);
    var map={amt:ugx(T.amt),steps:fmt(T.steps),left:fmt(LEFT),n:fmt(T.n),
             paid:ugx(T.paid),pled:ugx(T.pled),pct:(PCT*100).toFixed(2)+'%',
             km:(m/1000).toFixed(2)+' km',
             next:nextPct?(fmt(nextSteps)+' steps'):'—',
             nextpct:nextPct?pctLabel(nextPct):'—'};
    if(map[el.getAttribute('data-t')]!==undefined) el.textContent=map[el.getAttribute('data-t')];
  });

  /* ── 9 · WALK-DAY LIVE MODE ─────────────────────────────────── */
  var band=$('liveBand');
  if(band&&LIVE&&LIVE.active){
    var pctWalked=Math.min(Math.max((LIVE.km||0)/ROUTE_KM,0),1);
    band.innerHTML='<div class="wrap liveIn">'
      +'<span class="dot"></span>'
      +'<b>Walking now · km '+esc(String(LIVE.km))+' of '+ROUTE_KM+'</b>'
      +(LIVE.note?'<span class="note">'+esc(LIVE.note)+'</span>':'')
      +'<span class="tr"><i style="width:'+(pctWalked*100).toFixed(1)+'%"></i></span>'
      +(LIVE.updated?'<span class="upd">confirmed '+esc(LIVE.updated)+'</span>':'')
      +'<a class="btn btn-gold" href="give.html">Sponsor a step →</a>'
      +'</div>';
    band.classList.add('on');
    document.body.classList.add('has-live');
  }

  /* ── copy & share ───────────────────────────────────────────── */
  var toast=$('toast');
  function showToast(t){ if(!toast) return; toast.textContent=t; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show');},1800); }
  function copy(txt,label){
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){showToast(label);},function(){showToast('Could not copy — please copy it by hand');});}
    else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(label);}catch(e){showToast('Could not copy — please copy it by hand');}ta.remove();}
  }
  if($('copyNo')) $('copyNo').addEventListener('click',function(){copy('0772495733','Number copied');});
  if($('copyLink')) $('copyLink').addEventListener('click',function(){copy(window.location.href,'Link copied');});
  if($('copyIban')) $('copyIban').addEventListener('click',function(){
    var el=$('intlRef'); copy(el?el.textContent.trim():'','Reference copied');
  });
  /* share carries the unit trade — item 3 */
  var shareMsg='Faith in Motion — 345 km on foot to finish St Joseph Rwembyo Catholic Church. '
    +UNIT+'. Sponsor a step: ';
  if($('waShare')) $('waShare').href='https://wa.me/?text='+encodeURIComponent(shareMsg+window.location.href);
  if($('sysShare')){
    $('sysShare').addEventListener('click',function(e){
      if(navigator.share){ e.preventDefault();
        navigator.share({title:'Faith in Motion',text:shareMsg,url:window.location.href}).catch(function(){});
      }
    });
  }

  /* ── photographs ────────────────────────────────────────────── */
  var ASSETS=window.FIM_ASSETS||{};
  var CAPTIONS={walker:"On the road to Rwembyo",church:"St Joseph Rwembyo",road:"The road ahead",parish:"The parish community",build:"Construction in progress"};
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

  /* ── header, rail, reveals (cached reads, rAF-throttled) ────── */
  var hdr=$('hdr'), rail=$('rail'), railFill=$('railFill'), railBead=$('railBead'), railKm=$('railKm');
  var hero=$('top'), heroH=320, docH=1, ticking=false;
  function measure(){
    heroH=hero?hero.offsetHeight:320;
    docH=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);
  }
  function paint(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    if(hdr){ y>heroH*0.6?hdr.classList.add('solid'):hdr.classList.remove('solid'); }
    if(rail){
      y>heroH*0.72?rail.classList.add('show'):rail.classList.remove('show');
      var p=Math.min(Math.max(y/docH,0),1);
      if(railFill) railFill.style.height=(p*100)+'%';
      if(railBead) railBead.style.top=(p*100)+'%';
      if(railKm) railKm.textContent=Math.round(p*ROUTE_KM)+' km';
    }
    ticking=false;
  }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){measure();onScroll();});
  window.addEventListener('load',function(){measure();paint();});
  measure(); paint();

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
