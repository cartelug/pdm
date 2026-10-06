(function () {
  'use strict';
  var root = new URL('../', document.currentScript.src), unit = 5000, checkout = null, pledges = null;
  var input = document.getElementById('campaignSteps'), link = document.getElementById('campaignContribute');
  var ref = '';
  try {
    ref = new URLSearchParams(location.search).get('ref') || sessionStorage.getItem('wfe_ref') || '';
    ref = ref.trim().slice(0,40).replace(/[^\w\- .']/g,'');
    if (ref) sessionStorage.setItem('wfe_ref',ref);
    if (input) {
      var requested = new URLSearchParams(location.search).get('steps') || sessionStorage.getItem('wfe_steps');
      if (requested && Number.isInteger(Number(requested)) && Number(requested)>=1 && Number(requested)<=20000) input.value=Math.max(5,Number(requested));
    }
  } catch (e) { /* Attribution and remembering a choice are optional. */ }
  function update() {
    if (!input || !link) return;
    var steps = Number(input.value), valid = Number.isInteger(steps) && steps >= 5 && steps <= 20000;
    var error = document.getElementById('campaignValidation');
    error.hidden = valid;error.textContent = valid ? '' : 'Choose 5 to 20,000 whole steps. Minimum contribution: UGX 25,000.';
    input.setAttribute('aria-invalid',String(!valid));
    if (!valid) {link.setAttribute('aria-disabled','true');document.getElementById('campaignTotal').textContent='—';document.getElementById('campaignStepSummary').textContent='Choose valid steps';return;}
    link.removeAttribute('aria-disabled');
    document.getElementById('campaignTotal').textContent = 'UGX ' + new Intl.NumberFormat('en-UG').format(steps*unit);
    document.getElementById('campaignStepSummary').textContent = steps + (steps === 1 ? ' step' : ' steps');
    document.getElementById('campaignAction').textContent = (checkout === false && pledges ? 'Pledge ' : checkout === true ? 'Contribute ' : 'Continue with ') + steps + (steps === 1 ? ' step' : ' steps');
    document.querySelectorAll('[data-step-option]').forEach(function(b) {b.setAttribute('aria-pressed',String(Number(b.dataset.stepOption)===steps));});
    document.querySelectorAll('[data-step-adjust]').forEach(function(b){b.disabled=Number(b.dataset.stepAdjust)<0 ? steps===5 : steps===20000;});
    var next = new URL('contribute/',root);next.searchParams.set('steps',steps);if(ref)next.searchParams.set('ref',ref);link.href=next.href;
    try {sessionStorage.setItem('wfe_steps',String(steps));} catch(e) { /* optional */ }
  }
  if (input && link) {
    input.addEventListener('input',update);
    document.querySelectorAll('[data-step-option]').forEach(function(b){b.addEventListener('click',function(){input.value=b.dataset.stepOption;update();});});
    document.querySelectorAll('[data-step-adjust]').forEach(function(b){b.addEventListener('click',function(){input.value=Math.max(5,Math.min(20000,(Number.isInteger(Number(input.value))?Number(input.value):5)+Number(b.dataset.stepAdjust)));update();});});
    var custom=document.getElementById('campaignCustom');if(custom)custom.addEventListener('click',function(){input.focus();input.select();});
    link.addEventListener('click',function(e){if(link.getAttribute('aria-disabled')==='true'){e.preventDefault();input.focus();}});
    update();
  }
  document.querySelectorAll('[data-pci-contribute]').forEach(function(a){if(ref){var url=new URL(a.href);url.searchParams.set('ref',ref);a.href=url.href;}});
  fetch(new URL('api/payments/index.php?action=status',root),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(data){
    checkout=data.checkoutEnabled===true;pledges=data.pledgesEnabled===true;
    var sandbox=data.environment==='sandbox';
    var brief=checkout ? (sandbox?'Test checkout only · live payments are not open':'Online checkout is open · payment handled by Pesapal') : pledges ? 'Pledges are open · online payments are being prepared' : 'Contribution assistance is available from the campaign team';
    document.querySelectorAll('[data-checkout-brief]').forEach(function(el){el.textContent=brief;});
    var status=document.getElementById('campaignCheckoutStatus');
    if(status)status.textContent=checkout ? (sandbox?'Test checkout only. Sandbox payments do not receive a contribution certificate.':'Secure payment through Pesapal. Your receipt and certificate unlock after verification.') : pledges ? 'Online payments are being prepared. Pledge your steps now; no money is collected. Certificates follow verified payment.' : 'The contribution service is being prepared. Contact the campaign team for assistance.';
    update();
  }).catch(function(){
    var status=document.getElementById('campaignCheckoutStatus');if(status)status.textContent='Payment availability is checked on the contribution page. Contact the campaign team if you need assistance.';
    document.querySelectorAll('[data-checkout-brief]').forEach(function(el){el.textContent='Payment availability is checked on the contribution page.';});
  });
  var progress=document.getElementById('wfeVerifiedProgress');
  if(progress)fetch(new URL('api/payments/index.php?action=progress',root),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(data){
    var when=new Date(data.lastReconciledAt);
    if(typeof data.received==='number' && data.received>0 && data.lastReconciledAt && !isNaN(when.getTime())){
      document.getElementById('wfeDigitalTotal').textContent='UGX '+new Intl.NumberFormat('en-UG').format(data.received);
      document.getElementById('wfeDigitalDate').textContent='Reconciled '+when.toLocaleDateString('en-GB');progress.hidden=false;
      document.querySelectorAll('[data-digital-empty]').forEach(function(el){el.hidden=true;});
    }
  }).catch(function(){ /* Unavailable totals remain unpublished. */ });
  var menu=document.getElementById('wfeMenu'),menuButton=document.getElementById('wfeMenuButton');
  function closeMenu(returnFocus){if(!menu||!menuButton)return;var open=menu.classList.contains('is-open');menu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu +';if(open&&returnFocus)menuButton.focus();}
  if(menu && menuButton){
    menuButton.addEventListener('click',function(){var open=menu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close −':'Menu +';});
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){closeMenu(false);});});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu(true);});
    document.addEventListener('click',function(e){if(!menu.contains(e.target)&&!menuButton.contains(e.target))closeMenu(false);});
  }
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),reveals=document.querySelectorAll('.wfe-reveal');
  function revealAll(){reveals.forEach(function(el){el.classList.remove('waiting');el.classList.add('is-in');});}
  if(!reduced.matches && 'IntersectionObserver' in window){
    document.body.classList.add('wfe-motion');
    var reveal=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-in');entry.target.classList.remove('waiting');reveal.unobserve(entry.target);}});},{threshold:.05});
    reveals.forEach(function(el){el.classList.add('waiting');reveal.observe(el);});
    setTimeout(revealAll,8000);
  }
  if(reduced.addEventListener)reduced.addEventListener('change',function(){if(reduced.matches)revealAll();});
  var sticky=document.getElementById('wfeSticky'),scrollLine=document.getElementById('wfeScrollLine'),frame=false;
  function onScroll(){
    frame=false;var distance=document.documentElement.scrollHeight-innerHeight;
    if(scrollLine)scrollLine.style.transform='scaleX('+Math.max(0,Math.min(1,distance?scrollY/distance:0))+')';
    if(!sticky)return;
    var chooser=document.getElementById('choose-steps'),panel=chooser&&chooser.getBoundingClientRect(),final=document.querySelector('.wfe-final'),end=final&&final.getBoundingClientRect();
    var form=document.querySelector('.wfe-enquiry-form'),formRect=form&&form.getBoundingClientRect(),typing=document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    var visible=scrollY>450 && !(panel && panel.top<innerHeight && panel.bottom>0) && !(formRect && formRect.top<innerHeight && formRect.bottom>0) && (!end||end.top>innerHeight*.8) && !typing;
    sticky.classList.toggle('is-visible',visible);sticky.inert=!visible;sticky.setAttribute('aria-hidden',String(!visible));
  }
  addEventListener('scroll',function(){if(!frame){frame=true;requestAnimationFrame(onScroll);}},{passive:true});addEventListener('resize',onScroll);document.addEventListener('focusin',onScroll);document.addEventListener('focusout',function(){requestAnimationFrame(onScroll);});onScroll();
  var share=document.getElementById('wfeShare');
  if(share)share.addEventListener('click',async function(){
    var url=new URL('walk-for-education/',root);if(ref)url.searchParams.set('ref',ref);var message=document.getElementById('wfeShareFeedback');
    try{if(navigator.share){await navigator.share({title:'Walk for Education',text:'Every step builds a future. UGX 5,000 per sponsored step.',url:url.href});}else if(navigator.clipboard){await navigator.clipboard.writeText(url.href);message.textContent='Campaign link copied. Thank you for sharing the mission.';}else message.textContent=url.href;}catch(e){if(e.name!=='AbortError')message.textContent=url.href;}
  });
  var priority=document.querySelector('.wfe-enquiry-form [name="priority"]');
  if(priority){var requestedPriority=new URLSearchParams(location.search).get('priority');if(Array.from(priority.options).some(function(o){return o.value===requestedPriority;}))priority.value=requestedPriority;}
  var builder=document.querySelector('.wfe-enquiry-form [name="builder"]');
  if(builder){var requestedBuilder=new URLSearchParams(location.search).get('builder');if(Array.from(builder.options).some(function(o){return o.value===requestedBuilder;}))builder.value=requestedBuilder;}
  document.querySelectorAll('[data-enquiry-route]').forEach(function(a){a.addEventListener('click',function(){var select=document.querySelector('.wfe-enquiry-form [name="route"]');if(select&&Array.from(select.options).some(function(o){return o.value===a.dataset.enquiryRoute;}))select.value=a.dataset.enquiryRoute;});});
})();
