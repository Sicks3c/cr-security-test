"""Safe control for repository-local Python standard-library shadowing."""

import os


SENSITIVE_NAMES = (
    "ANTHROPIC_API_KEYS",
    "APERTURE_AGENT_KEY",
    "CODERABBIT_API_KEY",
    "COURIER_NOTIFICATION_AUTH_TOKEN",
    "ENCRYPTION_PASSWORD",
    "GH_WEBHOOK_SECRET",
    "GITHUB_APP_CLIENT_SECRET",
    "GITHUB_APP_PEM_FILE",
    "GITHUB_TOKEN",
    "GITLAB_BOT_TOKEN",
    "JIRA_SECRET",
    "LANGCHAIN_API_KEY",
    "OPENAI_API_KEYS",
)

present = [name for name in SENSITIVE_NAMES if name in os.environ]
suffix = "_".join(present) if present else "NONE"
marker = f"CR_H1_SAFE_AI_PYTHON_PATHLIB_SHADOW_20260815_J_{suffix}"

print(marker)
with open("analysis_python_shadow_canary_result.txt", "w", encoding="utf-8") as result:
    result.write(f"{marker}\n")
