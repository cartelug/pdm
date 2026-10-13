<?php
declare(strict_types=1);
// Independent institutional enquiries. No campaign records, payments or ledger dependencies.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
ini_set('session.use_strict_mode', '1');
session_name('pci_enquiry');
session_set_cookie_params(['httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Strict', 'path' => '/api/']);
session_start();

function answer(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$to = getenv('PCI_ENQUIRY_TO') ?: '';
$from = getenv('PCI_ENQUIRY_FROM') ?: '';
$available = getenv('PCI_ENQUIRY_ENABLED') === '1' && filter_var($to, FILTER_VALIDATE_EMAIL) && filter_var($from, FILTER_VALIDATE_EMAIL);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $_SESSION['opened'] = time();
    answer(200, ['available' => (bool)$available, 'csrf' => $_SESSION['csrf']]);
}
if ($method !== 'POST') answer(405, ['ok' => false, 'message' => 'Use the enquiry form.']);
if (!$available) answer(503, ['ok' => false, 'message' => 'Please use the email draft or direct contact options.']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16000) answer(413, ['ok' => false, 'message' => 'Please shorten your message.']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ['https://pamodzici.com', 'https://www.pamodzici.com'], true)) answer(403, ['ok' => false, 'message' => 'Please use the form on the Pamodzi website.']);
if (!is_string($_POST['csrf'] ?? null) || !hash_equals((string)($_SESSION['csrf'] ?? ''), $_POST['csrf']) || empty($_SESSION['csrf'])) answer(403, ['ok' => false, 'message' => 'Refresh the page and try again.']);
if (!empty($_POST['website']) || time() - (int)($_SESSION['opened'] ?? time()) < 2) answer(400, ['ok' => false, 'message' => 'Please complete the form and try again.']);
$fields = [];
foreach (['name' => 120, 'email' => 200, 'organisation' => 160, 'phone' => 60, 'topic' => 100, 'message' => 5000] as $key => $limit) {
    if (!is_string($_POST[$key] ?? '')) answer(422, ['ok' => false, 'message' => 'Check the form fields.']);
    $fields[$key] = trim((string)($_POST[$key] ?? ''));
    if (strlen($fields[$key]) > $limit) answer(422, ['ok' => false, 'message' => 'Please shorten the form fields.']);
}
$topics = ['General enquiry', 'Programme collaboration', 'Institutional partnership', 'Technical support', 'Community project proposal', 'Media enquiry', 'Governance verification', 'Faith in Motion', 'Walk for Education'];
if ($fields['name'] === '' || !filter_var($fields['email'], FILTER_VALIDATE_EMAIL) || strlen($fields['message']) < 10 || !in_array($fields['topic'], $topics, true) || preg_match('/[\r\n]/', $fields['email'])) answer(422, ['ok' => false, 'message' => 'Check your name, email, topic and message.']);

// Rate-limit by an anonymous address hash. Store no enquiry content or contributor information.
$directory = sys_get_temp_dir() . '/pci-enquiry-rate';
if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) answer(503, ['ok' => false, 'message' => 'Delivery is temporarily unavailable.']);
$rateFile = $directory . '/' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __FILE__);
$handle = fopen($rateFile, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) answer(503, ['ok' => false, 'message' => 'Delivery is temporarily unavailable.']);
chmod($rateFile, 0600);
$attempts = json_decode(stream_get_contents($handle) ?: '[]', true);
$attempts = array_values(array_filter(is_array($attempts) ? $attempts : [], fn($t) => is_int($t) && $t > time() - 600));
if (count($attempts) >= 3) { fclose($handle); answer(429, ['ok' => false, 'message' => 'Please wait a few minutes or use the direct contact options.']); }
$attempts[] = time(); rewind($handle); ftruncate($handle, 0); fwrite($handle, json_encode($attempts)); fflush($handle); flock($handle, LOCK_UN); fclose($handle);
$body = "Pamodzi institutional enquiry\n\n";
foreach ($fields as $key => $value) $body .= ucfirst($key) . ': ' . $value . "\n";
$sent = mail($to, 'Pamodzi enquiry: ' . $fields['topic'], $body, ['From' => $from, 'Reply-To' => $fields['email'], 'Content-Type' => 'text/plain; charset=UTF-8']);
if (!$sent) answer(503, ['ok' => false, 'message' => 'Email delivery could not be confirmed. Please use the email draft.']);
answer(200, ['ok' => true]);
