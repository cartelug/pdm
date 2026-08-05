<?php
/* Faith in Motion collections API.

   GET  /api/roll.php               -> window.ROLL_DATA = [...]; (for a <script> tag)
   GET  /api/roll.php?format=json   -> {"roll":[...], "updated": "..."} (for the admin console)
   POST /api/roll.php  {"password": "...", "roll": [...]}
                                     -> validates the password and the shape of
                                        `roll`, then writes it as the new live
                                        register. Every campaign page picks up
                                        the change on its next load.

   The live register lives at data/roll-live.json, which is never committed to
   git and is never touched by a code deploy (deploys only add/overwrite files
   that exist in the repository; a file that only ever exists on the server
   is left alone). Until a first write happens, GET falls back to the
   committed data/roll-seed.json and also copies it into roll-live.json so
   later reads are consistent. */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

require __DIR__ . '/config.php';

$dataDir  = __DIR__ . '/data';
$liveFile = $dataDir . '/roll-live.json';
$seedFile = $dataDir . '/roll-seed.json';

function fim_load_roll(string $liveFile, string $seedFile): array {
  if (is_file($liveFile)) {
    $raw = @file_get_contents($liveFile);
    $data = $raw === false ? null : json_decode($raw, true);
    if (is_array($data) && isset($data['roll']) && is_array($data['roll'])) {
      return $data;
    }
  }
  $raw = @file_get_contents($seedFile);
  $data = $raw === false ? null : json_decode($raw, true);
  if (!is_array($data) || !isset($data['roll']) || !is_array($data['roll'])) {
    $data = ['roll' => [], 'updated' => null];
  }
  @file_put_contents($liveFile, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
  return $data;
}

function fim_validate_roll($roll): bool {
  if (!is_array($roll) || count($roll) > 2000) return false;
  $allowedStatus = ['paid', 'pledged', 'promised'];
  foreach ($roll as $entry) {
    if (!is_array($entry) || count($entry) < 4 || count($entry) > 6) return false;
    $name = $entry[0]; $amount = $entry[1]; $steps = $entry[2]; $status = $entry[3];
    if (!is_string($name) || $name === '' || mb_strlen($name) > 120) return false;
    if (!is_numeric($amount) || $amount < 0 || $amount > 1000000000) return false;
    if (!is_numeric($steps) || $steps < 0 || $steps > 1000000) return false;
    if (!in_array($status, $allowedStatus, true)) return false;
    if (isset($entry[4]) && $entry[4] !== null && (!is_string($entry[4]) || mb_strlen($entry[4]) > 300)) return false;
    if (isset($entry[5]) && $entry[5] !== null && (!is_string($entry[5]) || mb_strlen($entry[5]) > 20)) return false;
  }
  return true;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');

  $raw = file_get_contents('php://input');
  $body = $raw === false ? null : json_decode($raw, true);
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

  $roll = $body['roll'] ?? null;
  if (!fim_validate_roll($roll)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Roll data failed validation']);
    exit;
  }

  if (!is_dir($dataDir) && !@mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Data directory is not writable']);
    exit;
  }

  $updated = gmdate('c');
  $payload = ['roll' => array_values($roll), 'updated' => $updated];
  $tmp = $liveFile . '.' . bin2hex(random_bytes(4)) . '.tmp';
  $written = @file_put_contents($tmp, json_encode($payload, JSON_UNESCAPED_UNICODE), LOCK_EX);
  if ($written === false || !@rename($tmp, $liveFile)) {
    @unlink($tmp);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not write the live register']);
    exit;
  }

  echo json_encode(['ok' => true, 'updated' => $updated, 'count' => count($roll)]);
  exit;
}

/* ---- GET ---- */
$data = fim_load_roll($liveFile, $seedFile);
$format = $_GET['format'] ?? 'js';

if ($format === 'json') {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');
/* JSON_UNESCAPED_SLASHES is intentionally NOT set here: default slash
   escaping turns a "</script>" inside a contributor name or note into
   "<\/script>", which keeps it from closing this script tag early. */
echo 'window.ROLL_DATA = ' . json_encode($data['roll'], JSON_UNESCAPED_UNICODE) . ";\n";
echo 'window.ROLL_DATA_UPDATED = ' . json_encode($data['updated']) . ";\n";
