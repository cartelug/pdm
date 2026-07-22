/* PAMODZI — shared page script. Every feature is guarded by element checks. */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var REDUCE=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var toast=$('toast');
  function showToast(t){ if(!toast) return; toast.textContent=t; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show');},2100); }

  if($('send')){
    $('send').addEventListener('click',function(){
      var nm=$('iName').value.trim(), ct=$('iContact').value.trim();
      if(!nm||!ct){ showToast('Please add your name and how we can reach you'); return; }
      var pj=$('iProject')?$('iProject').value:'General', tp=$('iType')?$('iType').value:'Enquiry', ms=$('iMsg')?$('iMsg').value.trim():'';
      var body='Name: '+nm+'\nContact: '+ct+'\nProject: '+pj+'\nReason: '+tp+'\n\n'+(ms||'(no message)');
      window.location.href='mailto:shyakaneeza@gmail.com?subject='+encodeURIComponent('Pamodzi enquiry — '+pj)+'&body='+encodeURIComponent(body);
      showToast('Opening your email app…');
    });
  }

  var bar=$('lbar');
  if(bar){
    var pct=Math.max((5040000/410000000)*100,1.2);
    if(REDUCE){ bar.style.width=pct+'%'; }
    else { setTimeout(function(){ bar.style.transition='width 1.5s cubic-bezier(.22,1,.36,1)'; bar.style.width=pct+'%'; },400); }
  }

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
