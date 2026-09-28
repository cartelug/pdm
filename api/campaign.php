<?php
/* Walk for Education live campaign record.

   GET  /api/campaign.php               -> window.WFE_LIVE = {...}; (for a <script> tag)
   GET  /api/campaign.php?format=json   -> {"campaign": {...}, "updated": "..."} (admin console)
   POST /api/campaign.php  {"password": "...", "campaign": {...}}
                                         -> validates the password and every field,
                                            then writes the new live record.

   The live record only ever holds the fields listed in wfe_validate() —
   verified dates, route progress, payment channels, reconciled totals and
   field notes. Source-document facts (distance, goal, student numbers) stay
   in js/wfe-data.js and cannot be overridden from here.

   data/wfe-live.json is never committed and never touched by a deploy, the
   same way data/roll-live.json works for Faith in Motion. If it doesn't exist
   yet, GET returns an empty record and the bundled js/wfe-data.js stands. */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

require __DIR__ . '/config.php';

$dataDir  = __DIR__ . '/data';
$liveFile = $dataDir . '/wfe-live.json';

function wfe_load(string $liveFile): array {
  if (is_file($liveFile)) {
    $raw = @file_get_contents($liveFile);
    $data = $raw === false ? null : json_decode($raw, true);
    if (is_array($data) && isset($data['campaign']) && is_array($data['campaign'])) return $data;
  }
  return ['campaign' => new stdClass(), 'updated' => null];
}

function wfe_str($v, int $max, bool $required = false): bool {
  if ($v === null) return !$required;
  return is_string($v) && mb_strlen($v) <= $max && (!$required || trim($v) !== '');
}

function wfe_date($v): bool {
  if ($v === null) return true;
  if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) return false;
  [$y, $m, $d] = array_map('intval', explode('-', $v));
  return checkdate($m, $d, $y);
}

function wfe_timestamp($v): bool {
  if ($v === null) return true;
  return is_string($v) && strlen($v) <= 40 && strtotime($v) !== false;
}

function wfe_num($v, float $max): bool {
  if ($v === null) return true;
  return (is_int($v) || is_float($v)) && $v >= 0 && $v <= $max;
}

function wfe_image($v): bool {
  if ($v === null || $v === '') return true;
  if (!is_string($v) || mb_strlen($v) > 300) return false;
  return (bool) preg_match('#^(https://[^\s"<>]+|assets/[A-Za-z0-9/_\-.]+\.(jpe?g|png|webp))$#', $v);
}

function wfe_validate($c): bool {
  if (!is_array($c)) return false;

  $allowed = [
    'status', 'statusLabel', 'campaignStartDate', 'campaignEndDate', 'routeStatus',
    'distanceCoveredKm', 'routeStages', 'contributionUnitValue', 'contributionUnitLabel',
    'paymentChannels', 'paymentVerificationNote', 'receivedTotal', 'pledgedTotal',
    'lastReconciledAt', 'publicReportingState', 'updates', 'confirmedPartners'
  ];
  foreach (array_keys($c) as $key) {
    if (!in_array($key, $allowed, true)) return false;
  }

  if (isset($c['status']) && !in_array($c['status'], ['preparing', 'launched', 'on-the-road', 'completed', 'paused'], true)) return false;
  if (!wfe_str($c['statusLabel'] ?? null, 60)) return false;
  if (!wfe_date($c['campaignStartDate'] ?? null) || !wfe_date($c['campaignEndDate'] ?? null)) return false;
  if (!wfe_str($c['routeStatus'] ?? null, 300)) return false;
  if (!wfe_num($c['distanceCoveredKm'] ?? null, 5000)) return false;
  if (!wfe_num($c['contributionUnitValue'] ?? null, 100000000)) return false;
  if (!wfe_str($c['contributionUnitLabel'] ?? null, 30)) return false;
  if (!wfe_str($c['paymentVerificationNote'] ?? null, 400)) return false;
  if (!wfe_num($c['receivedTotal'] ?? null, 1.0e12) || !wfe_num($c['pledgedTotal'] ?? null, 1.0e12)) return false;
  if (!wfe_timestamp($c['lastReconciledAt'] ?? null)) return false;
  if (!wfe_str($c['publicReportingState'] ?? null, 300)) return false;

  if (isset($c['routeStages'])) {
    if (!is_array($c['routeStages']) || count($c['routeStages']) > 80) return false;
    foreach ($c['routeStages'] as $s) {
      if (!is_array($s) || !wfe_str($s['name'] ?? null, 80, true)) return false;
      if (!wfe_str($s['country'] ?? null, 40) || !wfe_num($s['km'] ?? null, 5000) || !wfe_date($s['date'] ?? null)) return false;
      if (isset($s['reached']) && !is_bool($s['reached'])) return false;
    }
  }

  if (isset($c['paymentChannels'])) {
    if (!is_array($c['paymentChannels']) || count($c['paymentChannels']) > 6) return false;
    foreach ($c['paymentChannels'] as $p) {
      if (!is_array($p) || !in_array($p['type'] ?? '', ['mobile-money', 'bank'], true)) return false;
      if (!wfe_str($p['provider'] ?? null, 60, true) || !wfe_str($p['number'] ?? null, 40, true)) return false;
      if (!wfe_str($p['accountName'] ?? null, 100, true)) return false;
      if (!wfe_str($p['branch'] ?? null, 80) || !wfe_str($p['currency'] ?? null, 8) || !wfe_str($p['referenceHint'] ?? null, 160)) return false;
    }
  }

  if (isset($c['updates'])) {
    if (!is_array($c['updates']) || count($c['updates']) > 300) return false;
    foreach ($c['updates'] as $u) {
      if (!is_array($u) || !wfe_date($u['date'] ?? null) || empty($u['date'])) return false;
      if (!wfe_str($u['title'] ?? null, 140, true) || !wfe_str($u['body'] ?? null, 2000, true)) return false;
      if (!wfe_str($u['location'] ?? null, 80) || !wfe_str($u['stage'] ?? null, 80) || !wfe_str($u['source'] ?? null, 140)) return false;
      if (!wfe_image($u['image'] ?? null) || !wfe_str($u['imageAlt'] ?? null, 200)) return false;
      if (!empty($u['image']) && !wfe_str($u['imageAlt'] ?? null, 200, true)) return false;
    }
  }

  if (isset($c['confirmedPartners'])) {
    if (!is_array($c['confirmedPartners']) || count($c['confirmedPartners']) > 60) return false;
    foreach ($c['confirmedPartners'] as $p) {
      if (!is_array($p) || !wfe_str($p['name'] ?? null, 120, true) || !wfe_str($p['role'] ?? null, 120, true)) return false;
    }
  }

  return true;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');

  $raw = file_get_contents('php://input');
  $body = $raw === false || strlen($raw) > 400000 ? null : json_decode($raw, true);
  if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Malformed request']);
    exit;
  }

  $password = $body['password'] ?? '';
  if (!is_string($password) || $password === '' || !password_verify($password, FIM_ADMIN_PASSWORD_HASH)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Wrong password']);
    exit;
  }

  $campaign = $body['campaign'] ?? null;
  if (!wfe_validate($campaign)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Campaign record failed validation']);
    exit;
  }

  if (!is_dir($dataDir) && !@mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Data directory is not writable']);
    exit;
  }

  $updated = gmdate('c');
  $payload = ['campaign' => (object) $campaign, 'updated' => $updated];
  $tmp = $liveFile . '.' . bin2hex(random_bytes(4)) . '.tmp';
  $written = @file_put_contents($tmp, json_encode($payload, JSON_UNESCAPED_UNICODE), LOCK_EX);
  if ($written === false || !@rename($tmp, $liveFile)) {
    @unlink($tmp);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not write the live campaign record']);
    exit;
  }

  echo json_encode(['ok' => true, 'updated' => $updated]);
  exit;
}

/* ---- GET ---- */
$data = wfe_load($liveFile);
$format = $_GET['format'] ?? 'js';

if ($format === 'json') {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');
/* Default slash escaping keeps a "</script>" inside any text from closing the tag. */
echo 'window.WFE_LIVE = ' . json_encode($data['campaign'], JSON_UNESCAPED_UNICODE) . ";\n";
echo 'window.WFE_LIVE_UPDATED = ' . json_encode($data['updated']) . ";\n";
