(function () {
  'use strict';
  var script = document.currentScript.src;
  var root = script.replace(/js\/contributions\.js(?:\?.*)?$/, '');
  var api = root + 'api/payments/index.php';
  var csrf = '', settings = null, submitting = false;
  var requestId = newRequestId();
  function newRequestId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'PCI-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '-request'; }
  function money(v) { return 'UGX ' + new Intl.NumberFormat('en-UG').format(v); }
  async function call(action, data) {
    var options = data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(data) };
    var response = await fetch(api + '?action=' + action, Object.assign({ credentials: 'same-origin', cache: 'no-store' }, options));
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Please try again later.');
    return result;
  }
  function message(text, error) { var e = document.getElementById('feedback'); if (e) { e.textContent = text; e.className = 'collection-feedback ' + (error ? 'error' : 'good'); } }
  function kind() { return document.querySelector('[data-kind][aria-pressed="true"]').dataset.kind; }
  function amount() { return Number(document.getElementById('amount').value); }
  function update() {
    var stepField = document.getElementById('stepCount');
    if (stepField) document.getElementById('amount').value = Number.isInteger(Number(stepField.value)) ? Number(stepField.value)*5000 : 0;
    document.getElementById('summaryAmount').textContent = money(amount() || 0);
    if (document.getElementById('summarySteps')) document.getElementById('summarySteps').textContent = (Number(stepField.value)||0) + (Number(stepField.value)===1?' step':' steps');
    var isPledge = kind() === 'pledge';
    document.getElementById('summaryType').textContent = isPledge ? 'Your intended pledge' : 'Your contribution';
    document.getElementById('submitContribution').textContent = isPledge ? 'Record my pledge' : 'Continue to secure payment';
    document.getElementById('submitContribution').disabled = submitting || !settings || (isPledge ? !settings.pledgesEnabled : !settings.checkoutEnabled);
    document.getElementById('kindHint').textContent = isPledge ? 'A pledge records your intention to support. No money is collected.' : 'You will choose a payment method inside Pesapal checkout.';
    document.querySelectorAll('[data-amount]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.amount) === amount())); });
  }
  async function initForm() {
    var form = document.getElementById('contributionForm');
    var steps = document.getElementById('stepCount'), selected = Number(new URLSearchParams(location.search).get('steps'));
    if (steps && Number.isInteger(selected) && selected>=1 && selected<=20000) steps.value=selected;
    document.querySelectorAll('[data-checkout-adjust]').forEach(function(b){b.addEventListener('click',function(){steps.value=Math.max(1,Math.min(20000,(Number(steps.value)||1)+Number(b.dataset.checkoutAdjust)));requestId=newRequestId();update();});});
    document.querySelectorAll('[data-kind]').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); requestId = newRequestId(); message('', false); update(); }); });
    document.querySelectorAll('[data-amount]').forEach(function (b) { b.addEventListener('click', function () { if(steps) steps.value=Number(b.dataset.amount)/5000; document.getElementById('amount').value = b.dataset.amount; requestId = newRequestId(); update(); }); });
    form.addEventListener('input', function () { if (!submitting) requestId = newRequestId(); update(); });
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); if (submitting || !form.reportValidity()) return;
      if (!Number.isInteger(amount())) { message('Please enter a whole UGX amount.', true); return; }
      try { sessionStorage.setItem('pci-storage-check', '1'); sessionStorage.removeItem('pci-storage-check'); } catch (error) { message('Enable session storage to keep your private payment reference on this device.', true); return; }
      submitting = true; update(); message('Preparing your ' + (kind() === 'pledge' ? 'pledge' : 'payment') + '…', false);
      try {
        var referral = new URLSearchParams(location.search).get('ref') || sessionStorage.getItem('wfe_ref') || '';
        var r = await call('create', { campaign: document.getElementById('campaign').value, kind: kind(), amount: amount(), steps: Number(steps.value), name: document.getElementById('supporterName').value.trim(), email: document.getElementById('email').value.trim(), phone: document.getElementById('phone').value.trim(), referral: referral.slice(0, 60), consent: document.getElementById('consent').checked, requestId: requestId });
        sessionStorage.setItem('pci-view-' + r.contribution.reference, r.token);
        if (r.redirectUrl) { location.assign(r.redirectUrl); return; }
        location.assign(root + 'contribute/payment/?reference=' + encodeURIComponent(r.contribution.reference));
      } catch (error) { message(error.message, true); submitting = false; update(); }
    });
    try {
      var results = await Promise.all([call('status'), call('session')]); settings = results[0]; csrf = results[1].csrf;
      if (!settings.checkoutEnabled) {
        document.querySelectorAll('[data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.kind === 'pledge')); });
        document.getElementById('checkoutNotice').textContent = 'Online payments are being prepared. You can record a pledge now or contact the campaign team. A pledge is not a payment.';
      } else if (settings.environment === 'sandbox') document.getElementById('checkoutNotice').textContent = 'TEST CHECKOUT — this is the Pesapal sandbox. Test payments do not count toward campaign collections.';
      else document.getElementById('checkoutNotice').hidden = true;
      if (!settings.pledgesEnabled) message('The contribution service is being prepared. Please contact the campaign team.', true);
    } catch (error) { message('The contribution service is unavailable. Please use the campaign contact below.', true); }
    update();
  }
  async function initReceipt() {
    var ref = new URLSearchParams(location.search).get('reference') || '', token = '';
    try { token = sessionStorage.getItem('pci-view-' + ref) || ''; } catch (error) { /* session storage unavailable */ }
    if (!ref || !token) { message('Open the payment result on the device and browser used for your contribution. If you need help, contact PCI with your transaction reference.', true); return; }
    var refresh = document.getElementById('refreshPayment');
    var pollTimer=null, pollUntil=Date.now()+300000, lastState='';
    function queueStatusCheck(){clearTimeout(pollTimer);if(lastState==='pending' && Date.now()<pollUntil)pollTimer=setTimeout(function(){if(document.hidden)queueStatusCheck();else load();},25000);}
    var certificatePanel = document.getElementById('certificatePanel'), certificateButton = document.getElementById('downloadCertificate'), certificateCode='';
    if(certificateButton) certificateButton.addEventListener('click',async function(){certificateButton.disabled=true;var feedback=document.getElementById('certificateFeedback');feedback.textContent='Preparing your certificate…';try{var response=await fetch(api+'?action=certificate',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({reference:ref,token:token})});if(!response.ok){var error=await response.json();throw new Error(error.error||'Please check payment status again.');}var blob=await response.blob();if(!response.headers.get('Content-Type').includes('application/pdf'))throw new Error('Certificate download unavailable');var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=certificateCode+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);feedback.textContent='Certificate downloaded. Thank you for your contribution.';}catch(e){feedback.textContent=e.message;}certificateButton.disabled=false;});
    var messages = { pledged: 'Your pledge is recorded. No payment has been taken. The campaign team can follow up with you.', successful: 'Your payment has been verified. Thank you for supporting the campaign.', pending: 'Your payment is awaiting verification. This page checks automatically for five minutes. Please check its status before starting another payment.', failed: 'The provider reports that this payment failed. Contact PCI if money was deducted.', cancelled: 'Checkout was cancelled. Payment status will still be checked in case a payment completed.', refunded: 'The provider reports that this payment was reversed. Contact PCI for assistance.', closed: 'This pledge has been closed by the finance team.' };
    async function load() {
      if(refresh.disabled)return;clearTimeout(pollTimer);
      refresh.disabled = true;
      try {
        var r = await call('lookup', { reference: ref, token: token }), row = r.contribution;
        lastState=row.status;
        document.getElementById('receiptState').textContent = row.status;
        document.getElementById('receiptState').className = 'receipt-state ' + row.status;
        document.getElementById('receiptAmount').textContent = money(row.amount);
        document.getElementById('receiptReference').textContent = row.reference;
        document.getElementById('receiptNumber').textContent = row.receipt || 'Issued after verified payment';
        document.getElementById('receiptDate').textContent = new Date(row.created_at).toLocaleString('en-GB');
        document.getElementById('receiptReconciled').textContent = row.reconciled_at ? 'Reconciled by PCI finance' : (row.kind === 'pledge' ? 'Pledge only — not received funds' : 'Separate finance reconciliation pending');
        document.getElementById('receiptEnvironment').textContent = row.environment === 'sandbox' ? 'TEST — excluded from collections' : 'Live campaign record';
        if(document.getElementById('receiptSteps'))document.getElementById('receiptSteps').textContent=row.steps>0?row.steps+(row.steps===1?' step':' steps')+' × UGX '+new Intl.NumberFormat('en-UG').format(row.step_unit):'Not recorded as sponsored steps';
        if(certificatePanel){certificateCode=row.certificate||'';certificatePanel.hidden=!(certificateCode && row.status==='successful' && row.environment==='live' && !r.verificationDelayed);document.getElementById('certificateNumber').textContent=certificateCode;}
        document.getElementById('receiptContent').hidden = false;
        document.getElementById('printReceipt').hidden = row.status !== 'successful';
        document.getElementById('receiptHeading').textContent = row.kind === 'pledge' ? 'Your pledge record' : 'Your contribution';
        message((row.environment==='sandbox' && row.status==='successful'?'Test payment verified. Sandbox payments do not receive a contribution certificate.':messages[row.status]) + (r.verificationDelayed ? ' The latest provider check is delayed; this is the last verified status.' : ''), row.status === 'failed');
      } catch (error) { message(error.message, true); }
      refresh.disabled = false;
      queueStatusCheck();
    }
    try { csrf = (await call('session')).csrf; } catch (error) { message('Unable to check payment status. Please contact PCI.', true); return; }
    refresh.addEventListener('click', load); document.getElementById('printReceipt').addEventListener('click', function () { window.print(); });
    document.addEventListener('visibilitychange',function(){if(!document.hidden && lastState==='pending' && Date.now()<pollUntil)load();});
    addEventListener('pagehide',function(){clearTimeout(pollTimer);});
    await load();
  }
  if (document.getElementById('contributionForm')) initForm();
  if (document.getElementById('receiptContent')) initReceipt();
})();
