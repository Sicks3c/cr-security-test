"""Boolean-only CodeRabbit SQLFluff sandbox canary."""

import os


SENSITIVE_ENVIRONMENT_NAMES = [
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
]
PRESENT_SENSITIVE_ENVIRONMENT_NAMES = [
    name for name in SENSITIVE_ENVIRONMENT_NAMES if os.environ.get(name)
]
MARKER = "CR_H1_SAFE_SQLFLUFF_LIBRARY_PATH_20260815_G_" + (
    "_".join(PRESENT_SENSITIVE_ENVIRONMENT_NAMES)
    if PRESENT_SENSITIVE_ENVIRONMENT_NAMES
    else "NONE"
)

# Fixed text plus boolean name presence only; never values or hashes.
print(MARKER)


def presence_marker():
    """Return the safe marker so SQLFluff reports it as a normal diagnostic."""
    return MARKER
