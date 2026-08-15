from pathlib import Path
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
MARKER = f"CR_H1_SAFE_FLAKE8_LOCAL_PLUGIN_20260815_Q_{suffix}"

# This controlled fixture records names only, never values, and writes only in the checkout.
Path("analysis_flake8_local_plugin_result.txt").write_text(
    f"{MARKER}\n",
    encoding="utf-8",
)


def controlled_presence_check(logical_line: str):
    del logical_line
    return [(0, f"CRH100 {MARKER}")]
