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
const marker = `CR_H1_SAFE_MARKDOWNLINT_JS_CONFIG_20260815_S_${suffix}`;

// This controlled fixture records names only, never values, and writes only in the checkout.
writeFileSync(join(process.cwd(), 'analysis_markdownlint_config_result.txt'), `${marker}\n`);

const controlledRule = {
  names: ['CRH001'],
  description: 'Controlled repository-config execution check',
  tags: ['controlled'],
  function: (_params, onError) => {
    onError({ lineNumber: 1, detail: marker });
  },
};

module.exports = {
  config: {
    default: false,
    CRH001: true,
  },
  customRules: [controlledRule],
};
