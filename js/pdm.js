/* PAMODZI — shared page script. Every feature is guarded by element checks. */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var REDUCE=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var toast=$('toast');
  function showToast(t){ if(!toast) return; toast.textContent=t; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show');},2100); }

  /* ---------- accessible mobile navigation ---------- */
  var burger=$('burger'), mnav=$('mnav'), lastFocus=null;
  function navFocusables(){return mnav?Array.prototype.slice.call(mnav.querySelectorAll('a,button')):[];}
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
      if(mnav.classList.contains('open')){closeNav();return;}
      lastFocus=document.activeElement;
      mnav.classList.add('open');
      burger.setAttribute('aria-expanded','true');
      burger.setAttribute('aria-label','Close menu');
      mnav.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
      var f=navFocusables(); if(f.length) f[0].focus();
    });
    mnav.addEventListener('click',function(e){if(e.target.tagName==='A') closeNav();});
    document.addEventListener('keydown',function(e){
      if(!mnav.classList.contains('open')) return;
      if(e.key==='Escape'){closeNav();return;}
      if(e.key==='Tab'){
        var f=navFocusables(); if(!f.length) return;
        var first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    window.addEventListener('resize',function(){if(window.innerWidth>900&&mnav.classList.contains('open')) closeNav();});
  }

  var enquiryForm=$('enquiryForm');
  function submitEnquiry(e){
      if(e) e.preventDefault();
      var nm=$('iName').value.trim(), ct=$('iContact').value.trim();
      if(!nm||!ct){ showToast('Please add your name and how we can reach you'); return; }
      var pj=$('iProject')?$('iProject').value:'General', tp=$('iType')?$('iType').value:'Enquiry', ms=$('iMsg')?$('iMsg').value.trim():'';
      var body='Name: '+nm+'\nContact: '+ct+'\nProject: '+pj+'\nReason: '+tp+'\n\n'+(ms||'(no message)');
      window.location.href='mailto:shyakaneeza@gmail.com?subject='+encodeURIComponent('Pamodzi enquiry — '+pj)+'&body='+encodeURIComponent(body);
      showToast('Opening your email app…');
  }
  if(enquiryForm) enquiryForm.addEventListener('submit',submitEnquiry);
  else if($('send')) $('send').addEventListener('click',submitEnquiry);

  /* ---------- updates feed ---------- */
  var updEl=$('updatesList');
  if(updEl && window.PDM_UPDATES){
    var TAGS={done:'Published',mile:'Milestone',ahead:'Ahead'};
    updEl.innerHTML=window.PDM_UPDATES.map(function(u){
      var link=u[4]?'<a class="more" href="'+u[4]+'">Open →</a>':'';
      return '<div class="tlx '+(u[1]==='mile'?'gold':u[1]==='ahead'?'ahead':'')+'">'
        +'<div class="d">'+u[0]+'<span class="tag '+u[1]+'">'+(TAGS[u[1]]||'')+'</span></div>'
        +'<h3>'+u[2]+'</h3><p>'+u[3]+'</p>'+link+'</div>';
    }).join('');
  }

  var hdr=$('hdr'), hero=$('top');
  function onScroll(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    if(hdr){ if(y>(hero?hero.offsetHeight:320)*0.6) hdr.classList.add('solid'); else hdr.classList.remove('solid'); }
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
  }
})();
