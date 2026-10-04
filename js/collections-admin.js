(function () {
  'use strict';
  var root = document.currentScript.src.replace(/js\/collections-admin\.js(?:\?.*)?$/, '');
  var api = root + 'api/payments/index.php', csrf = '', role = '', rows = [], selected = null, busy = false;
  function id(name) { return document.getElementById(name); }
  function money(n) { return 'UGX ' + new Intl.NumberFormat('en-UG').format(n || 0); }
  function note(text, error) { id('consoleMessage').textContent = text; id('consoleMessage').className = 'collection-feedback ' + (error ? 'error' : 'good'); }
  async function call(action, data, csv) {
    var response = await fetch(api + '?action=' + action, { credentials: 'same-origin', cache: 'no-store', method: data === undefined ? 'GET' : 'POST', headers: data === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: data === undefined ? undefined : JSON.stringify(data) });
    if (csv && response.ok) return response.blob();
    var r = await response.json(); if (!response.ok) throw new Error(r.error || 'Request failed'); return r;
  }
  function node(tag, text) { var e = document.createElement(tag); e.textContent = text; return e; }
  function action(label, callback) { var b = node('button', label); b.type = 'button'; b.addEventListener('click', callback); return b; }
  async function run(actionName, body, message) {
    if (busy) return; busy = true;
    try { await call(actionName, body); note(message, false); await load(); } catch (e) { note(e.message, true); } finally { busy = false; }
  }
  function renderRows() {
    var body = id('registerBody'); body.replaceChildren();
    var search = id('searchRows').value.trim().toLowerCase(), status = id('filterStatus').value, environment = id('filterEnvironment').value;
    var filtered = rows.filter(function (r) { return (!status || r.status === status) && (!environment || r.environment === environment) && (!search || [r.reference, r.name, r.email, r.phone, r.campaign].join(' ').toLowerCase().indexOf(search) !== -1); });
    filtered.forEach(function (r) {
      var tr = document.createElement('tr'), ref = node('td', r.reference); ref.append(node('small', r.campaign), node('small', r.environment === 'sandbox' ? 'SANDBOX — excluded from totals' : 'LIVE')); tr.append(ref);
      var person = node('td', r.name); person.append(node('small', [r.phone, r.email].filter(Boolean).join(' · '))); tr.append(person);
      var value = node('td', money(r.amount)); value.append(node('small', r.kind)); tr.append(value);
      var state = node('td', r.status); if (r.receipt) state.append(node('small', r.receipt)); tr.append(state);
      var finance = node('td', r.reconciled_at ? 'Reconciled' : 'Not reconciled'); if (r.settlement_reference) finance.append(node('small', r.settlement_reference), node('small', 'Net ' + money(r.net))); tr.append(finance);
      var controls = document.createElement('td');
      if (role !== 'viewer') {
        if (r.kind === 'payment' && r.tracking_id) controls.append(action('Check provider', function () { run('recheck', { reference: r.reference }, 'Provider status checked.'); }));
        if (r.status === 'successful' && r.environment === 'live') controls.append(action(r.reconciled_at ? 'Edit settlement' : 'Reconcile', function () { selected = r; id('settlementReference').value = r.settlement_reference || ''; id('settlementFee').value = r.fee || 0; id('settlementFee').max = r.amount; id('settlementInfo').textContent = r.reference + ' · ' + money(r.amount); id('settlementError').textContent = ''; id('settlementDialog').showModal(); }));
        if (r.kind === 'pledge' && r.status === 'pledged') controls.append(action('Close pledge', function () { if (window.confirm('Close this pledge? This does not record a payment.')) run('close-pledge', { reference: r.reference }, 'Pledge closed.'); }));
      }
      if (r.kind === 'payment' && !r.tracking_id) controls.append(node('small', 'Submission needs provider review; do not recreate automatically.'));
      tr.append(controls); body.append(tr);
    });
    if (!filtered.length) { var tr = document.createElement('tr'), td = node('td', 'No matching contributions yet.'); td.colSpan = 6; tr.append(td); body.append(tr); }
    id('recordCount').textContent = filtered.length + ' shown from ' + rows.length + ' loaded records. CSV includes all records.';
  }
  async function load() {
    var r = await call('dashboard', {}); rows = r.rows;
    id('loginPanel').hidden = true; id('dashboard').hidden = false;
    id('totalSuccessful').textContent = money(r.totals.successful); id('totalReconciled').textContent = money(r.totals.reconciled); id('totalPledged').textContent = money(r.totals.pledged); id('totalNet').textContent = money(r.totals.net);
    id('accountLabel').textContent = 'Signed in · ' + role;
    id('exportCsv').hidden = role === 'viewer'; id('backupLedger').hidden = role !== 'admin'; id('registerIpn').hidden = role !== 'admin';
    var setup = id('setupList'); setup.replaceChildren();
    [['Environment', r.setup.environment.toUpperCase()], ['Credentials', r.setup.credentialsConfigured ? 'Configured' : 'Awaiting Pesapal access'], ['Notifications', r.setup.ipnRegistered ? 'Registered' : 'Not registered'], ['Approved wording', r.setup.policiesApproved ? 'Approved' : 'PCI review required'], ['Live approval', r.setup.liveApproved ? 'Approved' : 'Not enabled'], ['Checkout', r.setup.checkoutEnabled ? 'OPEN' : 'CLOSED']].forEach(function (s) { var e = document.createElement('li'); e.append(node('strong', s[0]), node('span', s[1])); setup.append(e); });
    var audit = id('auditTrail'); audit.replaceChildren(); r.audit.forEach(function (a) { audit.append(node('li', new Date(a.created_at).toLocaleString('en-GB') + ' · ' + a.actor + ' · ' + a.event + (a.reference ? ' · ' + a.reference : '') + (a.detail ? ' · ' + a.detail : ''))); });
    renderRows(); if (r.totalRecords > r.limit) note('Latest ' + r.limit + ' records loaded. Download the CSV for the full register.', false);
  }
  id('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); id('loginButton').disabled = true;
    try { var r = await call('login', { username: id('username').value, password: id('password').value }); csrf = r.csrf; role = r.role; id('password').value = ''; await load(); note('Collections console ready.', false); } catch (err) { note(err.message, true); } finally { id('loginButton').disabled = false; }
  });
  id('refreshConsole').addEventListener('click', function () { load().catch(function (e) { note(e.message, true); }); });
  ['searchRows', 'filterStatus', 'filterEnvironment'].forEach(function (key) { id(key).addEventListener('input', renderRows); });
  id('logout').addEventListener('click', async function () { try { await call('logout', {}); location.reload(); } catch (e) { note(e.message, true); } });
  id('registerIpn').addEventListener('click', function () { run('register-ipn', {}, 'Pesapal notification endpoint registered.'); });
  id('backupLedger').addEventListener('click', function () { run('backup', {}, 'Backup created in the private server backup directory.'); });
  id('exportCsv').addEventListener('click', async function () { try { var blob = await call('export', {}, true); var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'PCI-Collections-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); } catch (e) { note(e.message, true); } });
  id('cancelSettlement').addEventListener('click', function () { id('settlementDialog').close(); });
  id('settlementForm').addEventListener('submit', async function (e) { e.preventDefault(); id('saveSettlement').disabled = true; try { await call('reconcile', { reference: selected.reference, settlementReference: id('settlementReference').value, fee: Number(id('settlementFee').value) }); id('settlementDialog').close(); await load(); note('Finance reconciliation saved.', false); } catch (error) { id('settlementError').textContent = error.message; } finally { id('saveSettlement').disabled = false; } });
  (async function () { try { var s = await call('session'); csrf = s.csrf; role = s.role || ''; if (s.signedIn) await load(); } catch (e) { note('Collections service is unavailable. Please contact the site administrator.', true); } })();
})();
