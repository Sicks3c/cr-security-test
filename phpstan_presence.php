<?php

declare(strict_types=1);

// Boolean-only environment-presence canary. No value is emitted or retained.
$sensitiveEnvironmentNames = [
    'ANTHROPIC_API_KEYS',
    'APERTURE_AGENT_KEY',
    'CODERABBIT_API_KEY',
    'COURIER_NOTIFICATION_AUTH_TOKEN',
    'ENCRYPTION_PASSWORD',
    'GH_WEBHOOK_SECRET',
    'GITHUB_APP_CLIENT_SECRET',
    'GITHUB_APP_PEM_FILE',
    'GITHUB_TOKEN',
    'GITLAB_BOT_TOKEN',
    'JIRA_SECRET',
    'LANGCHAIN_API_KEY',
    'OPENAI_API_KEYS',
];
$presentSensitiveEnvironmentNames = array_values(array_filter(
    $sensitiveEnvironmentNames,
    static fn (string $name): bool => ($value = getenv($name)) !== false && $value !== '',
));
$suffix = $presentSensitiveEnvironmentNames === []
    ? 'NONE'
    : implode('_', $presentSensitiveEnvironmentNames);
$marker = "CR_H1_SAFE_PHPSTAN_ENV_NAME_PRESENCE_20260815_F_{$suffix}";
fwrite(STDOUT, "{$marker}\n");

// Make the boolean result observable as a normal PHPStan diagnostic. This
// writes only a fixed canary inside the disposable repository checkout.
$generatedCanaryPath = __DIR__ . '/src/generated_phpstan_presence.php';
$generatedCanary = "<?php\n\ndeclare(strict_types=1);\n\n{$marker}();\n";
file_put_contents($generatedCanaryPath, $generatedCanary);
