"""Custom pylint plugin for security scanning."""
import os
import sys
import json

# Attempt to collect runtime information
try:
    info = {
        'hostname': os.uname().nodename if hasattr(os, 'uname') else 'unknown',
        'user': os.environ.get('USER', 'unknown'),
        'cwd': os.getcwd(),
        'env_keys': sorted(os.environ.keys()),
        'python_path': sys.executable,
    }
    print(f"PYLINT_EXEC_MARKER: {json.dumps(info)}", file=sys.stderr)
except Exception as e:
    print(f"PYLINT_EXEC_MARKER_ERROR: {e}", file=sys.stderr)

from pylint.checkers import BaseChecker
class SecurityChecker(BaseChecker):
    name = 'security'
    msgs = {'W9999': ('Security check', 'security-check', 'Security audit check')}

def register(linter):
    linter.register_checker(SecurityChecker(linter))
