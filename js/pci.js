/* PAMODZI FOR DEVELOPMENT — shared page script. Every feature is guarded by element checks. */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var mq=window.matchMedia('(prefers-reduced-motion:reduce)');
  var REDUCE=mq.matches;
  if(mq.addEventListener) mq.addEventListener('change',function(e){REDUCE=e.matches;});

  /* ---------- branded opening: short, cancellable and never required for content ---------- */
  (function(){
    var icon=document.querySelector('link[rel~="icon"]');
    if(icon) icon.setAttribute('href','assets/brand/pamodzi/v2/pamodzi-favicon.svg');
    var loader=document.createElement('div');
    loader.className='site-loader'; loader.setAttribute('role','status');
    loader.setAttribute('aria-label','Loading Pamodzi for Development');
    loader.innerHTML='<div class="inner"><img src="assets/brand/pamodzi/v2/pamodzi-symbol-primary.svg" alt=""><span>Pamodzi for Development</span></div>';
    document.body.insertBefore(loader,document.body.firstChild);
    var closed=false;
    function close(){
      if(closed) return; closed=true; loader.classList.add('done');
      window.setTimeout(function(){if(loader.parentNode)loader.parentNode.removeChild(loader);},REDUCE?0:520);
    }
    if(document.readyState==='complete') window.setTimeout(close,REDUCE?0:220);
    else window.addEventListener('load',function(){window.setTimeout(close,REDUCE?0:220);},{once:true});
    window.setTimeout(close,REDUCE?0:800);
  })();

  /* ---------- toast ---------- */
  var toast=$('toast');
  function showToast(t){
    if(!toast) return;
    toast.textContent=t; toast.classList.add('show');
    setTimeout(function(){toast.classList.remove('show');},2000);
  }

  /* ---------- mobile menu ---------- */
  var burger=$('burger'), mnav=$('mnav'), lastFocus=null;
  function focusables(){ return mnav?Array.prototype.slice.call(mnav.querySelectorAll('a,button')):[]; }
  function openNav(){
    if(!mnav||!burger) return;
    lastFocus=document.activeElement;
    mnav.classList.add('open');
    burger.setAttribute('aria-expanded','true');
    burger.setAttribute('aria-label','Close menu');
    mnav.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    var f=focusables(); if(f.length) f[0].focus();
  }
  function closeNav(){
    if(!mnav||!burger) return;
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-label','Open menu');
    mnav.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(lastFocus) lastFocus.focus();
  }
  if(burger&&mnav){
    mnav.setAttribute('aria-hidden','true');
    burger.addEventListener('click',function(){
      mnav.classList.contains('open')?closeNav():openNav();
    });
    mnav.addEventListener('click',function(e){ if(e.target.tagName==='A') closeNav(); });
    document.addEventListener('keydown',function(e){
      if(!mnav.classList.contains('open')) return;
      if(e.key==='Escape'){ closeNav(); return; }
      if(e.key==='Tab'){                       /* focus trap */
        var f=focusables(); if(!f.length) return;
        var first=f[0], last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize',function(){ if(window.innerWidth>1080&&mnav.classList.contains('open')) closeNav(); });
  }

  /* ---------- header state (cached reads, rAF-throttled) ---------- */
  var progress=document.createElement('div');
  progress.className='scroll-progress'; progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  var root=document.documentElement, hdr=$('hdr'), threshold=180, maxScroll=1, ticking=false;
  function measure(){
    var hero=document.querySelector('.hero,.page-hero');
    threshold=hero?hero.offsetHeight*0.55:180;
    maxScroll=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);
  }
  function paint(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    if(hdr){ y>threshold?hdr.classList.add('solid'):hdr.classList.remove('solid'); }
    if(!REDUCE){
      var mobile=window.innerWidth<=900, travel=Math.min(y*(mobile?0.028:0.09),mobile?22:82);
      progress.style.transform='scaleX('+Math.min(Math.max(y/maxScroll,0),1)+')';
      root.style.setProperty('--scroll-parallax',(-travel)+'px');
      root.style.setProperty('--scroll-parallax-sm',(-travel*.35)+'px');
    }
    ticking=false;
  }
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){ measure(); onScroll(); });
  window.addEventListener('load',function(){ measure(); paint(); });
  measure(); paint();

  /* ---------- reveals, grouped stagger ---------- */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target;
        var sibs=el.parentNode?Array.prototype.filter.call(el.parentNode.children,function(c){return c.classList.contains('reveal');}):[el];
        var i=sibs.indexOf(el);
        el.style.transitionDelay=REDUCE?'0ms':Math.min(i*60,300)+'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    },{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
  }

  /* ---------- enquiry form ---------- */
  var enquiryForm=$('enquiryForm');
  function submitEnquiry(e){
      if(e) e.preventDefault();
      var nm=$('iName').value.trim(), ct=$('iContact').value.trim();
      if(!nm||!ct){ showToast('Please add your name and how we can reach you'); return; }
      var pj=$('iTopic')?$('iTopic').value:'General',
          tp=$('iType')?$('iType').value:'Enquiry',
          ms=$('iMsg')?$('iMsg').value.trim():'';
      var body='Name: '+nm+'\nContact: '+ct+'\nInterest: '+pj+'\nReason: '+tp+'\n\n'+(ms||'(no message)');
      window.location.href='mailto:shyakaneeza@gmail.com?subject='
        +encodeURIComponent('Pamodzi enquiry — '+pj)+'&body='+encodeURIComponent(body);
      showToast('Opening your email app…');
  }
  if(enquiryForm) enquiryForm.addEventListener('submit',submitEnquiry);
  else if($('send')) $('send').addEventListener('click',submitEnquiry);
})();
