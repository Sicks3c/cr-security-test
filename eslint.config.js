const markerRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Controlled CodeRabbit static-analysis fixture' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        context.report({
          node,
          message: 'CR_H1_SAFE_ESLINT_FIXED_DIAGNOSTIC_20260815_I',
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
