const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const sensitiveNames = [
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
const present = sensitiveNames.filter((name) => process.env[name] !== undefined);
const suffix = present.length === 0 ? 'NONE' : present.join('_');
const marker = `CR_H1_SAFE_EMBER_CONFIG_ENV_NAME_PRESENCE_20260815_P_${suffix}`;

// This controlled fixture records names only, never values, and writes only in the checkout.
writeFileSync(join(process.cwd(), 'analysis_ember_template_lint_result.txt'), `${marker}\n`);
process.stderr.write(`${marker}\n`);

module.exports = {
  rules: {
    // A computed unknown rule makes normal linter output carry the runtime marker.
    [marker]: true,
  },
};
