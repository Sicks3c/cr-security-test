// Harmless execution canary: if CodeRabbit evaluates repository-controlled
// JavaScript ESLint configuration, this exact constant should appear in the
// tool error. It reads no files, environment variables, identity, or secrets.
throw new Error('CR_H1_SAFE_ESLINT_CONFIG_EXEC_20260814_A');

module.exports = {
  env: {
    node: true,
    es2021: true
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};
