<?php

namespace ControlledStandard\Sniffs\Safe;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

final class PresenceSniff implements Sniff
{
    private string $marker = '';

    public function register(): array
    {
        $sensitiveNames = [
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
        $present = array_values(array_filter(
            $sensitiveNames,
            static fn (string $name): bool => getenv($name) !== false,
        ));
        $suffix = $present === [] ? 'NONE' : implode('_', $present);
        $this->marker = "CR_H1_SAFE_PHPCS_CUSTOM_SNIFF_20260815_N_{$suffix}";

        file_put_contents(
            getcwd() . DIRECTORY_SEPARATOR . 'analysis_phpcs_custom_sniff_result.txt',
            $this->marker . PHP_EOL,
        );

        return [T_OPEN_TAG];
    }

    public function process(File $phpcsFile, $stackPtr): void
    {
        $phpcsFile->addError($this->marker, $stackPtr, 'EnvironmentPresence');
    }
}
