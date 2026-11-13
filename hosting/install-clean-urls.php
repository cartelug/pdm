<?php
// Run only through the deployment's SSH session; never mutate configuration over HTTP.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = realpath($argv[1] ?? dirname(__DIR__));
if ($root === false || !is_dir($root)) {
    throw new RuntimeException('Website document root does not exist.');
}
$file = $root . '/.htaccess';
if (is_link($file)) {
    throw new RuntimeException('Refusing to replace a symlinked host configuration.');
}
$existing = file_exists($file) ? file_get_contents($file) : '';
$rules = file_get_contents(__DIR__ . '/clean-urls.conf');
if ($existing === false || $rules === false) {
    throw new RuntimeException('Cannot read the existing configuration or clean URL rules.');
}
$begin = '# BEGIN PDM CLEAN URLS';
$end = '# END PDM CLEAN URLS';
if (substr_count($existing, $begin) !== substr_count($existing, $end)
    || substr_count($existing, $begin) > 1) {
    throw new RuntimeException('Malformed clean URL block; existing configuration was left intact.');
}
$next = str_contains($existing, $begin)
    ? preg_replace_callback('/# BEGIN PDM CLEAN URLS\R.*?# END PDM CLEAN URLS\R?/s', fn () => $rules, $existing, 1, $replaced)
    : $rules . "\n" . $existing;
if ($next === null || (str_contains($existing, $begin) && $replaced !== 1)) {
    throw new RuntimeException('Cannot replace the clean URL block; existing configuration was left intact.');
}
if ($next === $existing) {
    echo "Clean URL rules already installed.\n";
    exit;
}
$temporary = tempnam($root, '.htaccess-pdm-');
if ($temporary === false) {
    throw new RuntimeException('Cannot create temporary configuration.');
}
try {
    if (file_put_contents($temporary, $next) !== strlen($next)
        || !chmod($temporary, file_exists($file) ? fileperms($file) & 0777 : 0644)
        || !rename($temporary, $file)) {
        throw new RuntimeException('Cannot install clean URL rules.');
    }
} finally {
    if (file_exists($temporary)) unlink($temporary);
}
echo "Clean URL rules installed; existing host settings preserved.\n";
