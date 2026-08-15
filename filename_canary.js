const fs = require('node:fs');
const path = require('node:path');

// Boolean-only presence canary for names published in CodeRabbit's 2025
// incident. It never emits values or hashes and performs no network, identity,
// process-spawning, or filesystem reads.
const sensitiveEnvironmentNames = [
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
const presentSensitiveEnvironmentNames = sensitiveEnvironmentNames.filter(
  (name) => typeof process.env[name] === 'string' && process.env[name].length > 0,
);
const suffix = presentSensitiveEnvironmentNames.length > 0
  ? presentSensitiveEnvironmentNames.join('_')
  : 'NONE';
const marker = `CR_H1_SAFE_AI_FILENAME_TOOL_USE_20260815_H_${suffix}`;

console.log(marker);
fs.writeFileSync(
  path.join(__dirname, 'analysis_filename_canary_result.txt'),
  `${marker}\n`,
  { encoding: 'utf8' },
);
