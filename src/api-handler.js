// Static-analysis fixture for the controlled CodeRabbit security-test repository.
// This file is never executed. The intentionally unsafe eval call gives the
// controlled Semgrep rule a deterministic syntax match without reading files,
// environment variables, identity data, network resources, or secrets.
// Review canary refreshed on 2026-08-15; this comment is the only runtime delta.
function evaluateFixture(userInput) {
  return eval(userInput);
}

module.exports = { evaluateFixture };
