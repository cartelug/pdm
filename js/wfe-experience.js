(function () {
  'use strict';
  var root = new URL('../', document.currentScript.src), unit = 5000, checkout = null;
  var input = document.getElementById('campaignSteps'), link = document.getElementById('campaignContribute');
  var ref = '';
  try { ref = new URLSearchParams(location.search).get('ref') || sessionStorage.getItem('wfe_ref') || ''; ref = ref.slice(0,60); if(ref) sessionStorage.setItem('wfe_ref',ref); } catch (e) { /* optional attribution */ }
  function update() {
    var steps = Number(input.value), valid = Number.isInteger(steps) && steps >= 1 && steps <= 20000;
    document.getElementById('campaignValidation').hidden = valid;
    document.getElementById('campaignValidation').textContent = valid ? '' : 'Choose a whole number from 1 to 20,000 steps.';
    if (!valid) { link.setAttribute('aria-disabled','true'); return; }
    link.removeAttribute('aria-disabled');
    document.getElementById('campaignTotal').textContent = 'UGX ' + new Intl.NumberFormat('en-UG').format(steps*unit);
    document.getElementById('campaignStepSummary').textContent = steps + (steps === 1 ? ' step' : ' steps');
    document.getElementById('campaignAction').textContent = (checkout === false ? 'Pledge ' : checkout === true ? 'Contribute ' : 'Continue with ') + steps + (steps === 1 ? ' step' : ' steps');
    document.querySelectorAll('[data-step-option]').forEach(function(b) { b.setAttribute('aria-pressed',String(Number(b.dataset.stepOption) === steps)); });
    var next = new URL('contribute/',root); next.searchParams.set('steps',steps); if(ref) next.searchParams.set('ref',ref);link.href = next.href;
  }
  input.addEventListener('input',update);
  document.querySelectorAll('[data-step-option]').forEach(function(b) { b.addEventListener('click',function() {input.value = b.dataset.stepOption;update();}); });
  document.querySelectorAll('[data-step-adjust]').forEach(function(b) {b.addEventListener('click',function(){input.value = Math.max(1,Math.min(20000,(Number(input.value)||1)+Number(b.dataset.stepAdjust)));update();});});
  link.addEventListener('click',function(e){if(link.getAttribute('aria-disabled')==='true'){e.preventDefault();input.focus();}});
  update();
  fetch(new URL('api/payments/index.php?action=status',root),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(data){checkout = data.checkoutEnabled;document.getElementById('campaignCheckoutStatus').textContent = checkout ? (data.environment === 'sandbox' ? 'Test checkout only. Sandbox payments do not receive a contribution certificate.' : 'Secure payment through Pesapal. Your receipt and certificate unlock after verification.') : 'Online payments are being prepared. Pledge your steps now; no money is collected. Certificates follow verified payment.';update();}).catch(function(){document.getElementById('campaignCheckoutStatus').textContent = 'For contribution assistance, contact the campaign team. Payment availability is checked on the next page.';});
  fetch(new URL('api/payments/index.php?action=progress',root),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(data){if(data.received > 0 && data.lastReconciledAt){document.getElementById('wfeDigitalTotal').textContent = 'UGX '+new Intl.NumberFormat('en-UG').format(data.received);document.getElementById('wfeDigitalDate').textContent='Reconciled '+new Date(data.lastReconciledAt).toLocaleDateString('en-GB');document.getElementById('wfeVerifiedProgress').hidden=false;}}).catch(function(){});
  var menu = document.getElementById('wfeMenu'), menuButton = document.getElementById('wfeMenuButton');
  function closeMenu(){menu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu +';}
  menuButton.addEventListener('click',function(){var open=menu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close −':'Menu +';});
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeMenu);});document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!reduced.matches && 'IntersectionObserver' in window){document.body.classList.add('wfe-motion');var reveals=document.querySelectorAll('.wfe-reveal');var reveal=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-in');entry.target.classList.remove('waiting');reveal.unobserve(entry.target);}});},{threshold:.06});reveals.forEach(function(el){el.classList.add('waiting');reveal.observe(el);});}
  var sticky=document.getElementById('wfeSticky'), frame=false;
  function onScroll(){frame=false;var distance=document.documentElement.scrollHeight-innerHeight;document.getElementById('wfeScrollLine').style.transform='scaleX('+Math.max(0,Math.min(1,distance?scrollY/distance:0))+')';var panel=document.getElementById('choose-steps').getBoundingClientRect(), final=document.querySelector('.wfe-final').getBoundingClientRect();sticky.classList.toggle('is-visible',scrollY>450 && !(panel.top<innerHeight && panel.bottom>0) && final.top>innerHeight*.8);}
  addEventListener('scroll',function(){if(!frame){frame=true;requestAnimationFrame(onScroll);}},{passive:true});addEventListener('resize',onScroll);onScroll();
  document.getElementById('wfeShare').addEventListener('click',async function(){var url=new URL('walk-for-education/',root);if(ref)url.searchParams.set('ref',ref);var message=document.getElementById('wfeShareFeedback');try{if(navigator.share){await navigator.share({title:'Walk for Education',text:'Buy a step. Build a future. UGX 5,000 per step.',url:url.href});}else if(navigator.clipboard){await navigator.clipboard.writeText(url.href);message.textContent='Campaign link copied. Thank you for carrying the message.';}else message.textContent=url.href;}catch(e){if(e.name!=='AbortError')message.textContent=url.href;}});
})();
