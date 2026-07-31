#!/usr/bin/env bash
# Installed on VDS as /opt/reframe/restart.sh (executable by reframe user).
# Used by CI when sudoers is broken / unavailable.
set -euo pipefail
systemctl --user restart reframe-backend 2>/dev/null \
  || /bin/systemctl restart reframe-backend 2>/dev/null \
  || { echo "Cannot restart reframe-backend"; exit 1; }
