// Static-analysis fixture for the controlled CodeRabbit security-test repository.
// This file is never executed. The intentionally unsafe eval call gives the
// controlled Semgrep rule a deterministic syntax match without reading files,
// environment variables, identity data, network resources, or secrets.
function evaluateFixture(userInput) {
  return eval(userInput);
}

module.exports = { evaluateFixture };
