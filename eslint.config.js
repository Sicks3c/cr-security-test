// Controlled evaluation canary for the CodeRabbit security test repository.
// It emits only fixed text and boolean presence for already-publicly-known
// secret variable names. It never emits values or accesses files/network.
console.log('CR_H1_SAFE_ESLINT_FLAT_CONFIG_TOPLEVEL_EVAL_20260815_C');

const sensitiveEnvironmentNames = [
  'ANTHROPIC_API_KEYS',
  'CODERABBIT_API_KEY',
  'GITHUB_APP_PEM_FILE',
  'GITHUB_TOKEN',
  'GITLAB_BOT_TOKEN',
  'OPENAI_API_KEYS',
];
const presentSensitiveEnvironmentNames = sensitiveEnvironmentNames.filter(
  (name) => typeof process.env[name] === 'string' && process.env[name].length > 0,
);
const environmentPresenceMarker =
  `CR_H1_SAFE_ESLINT_ENV_NAME_PRESENCE_20260815_D_${
    presentSensitiveEnvironmentNames.length > 0
      ? presentSensitiveEnvironmentNames.join('_')
      : 'NONE'
  }`;
console.log(environmentPresenceMarker);

const markerRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Controlled CodeRabbit config evaluation canary' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        context.report({
          node,
          message: environmentPresenceMarker,
        });
      },
    };
  },
};

module.exports = [
  {
    files: ['src/**/*.js'],
    plugins: {
      security: { rules: { controlledMarker: markerRule } },
    },
    rules: {
      'security/controlledMarker': 'error',
    },
  },
];
