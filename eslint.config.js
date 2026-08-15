// Constant-only evaluation canary for the CodeRabbit security test repository.
// This inline rule accesses no files, environment, identity, network, or secrets.
console.log('CR_H1_SAFE_ESLINT_FLAT_CONFIG_TOPLEVEL_EVAL_20260815_C');

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
          message: 'CR_H1_SAFE_ESLINT_FLAT_CONFIG_EVAL_20260814_B',
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
