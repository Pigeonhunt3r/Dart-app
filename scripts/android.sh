#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
# Existing cloud caches are outside the checkout; local Android Studio settings remain usable.
if [[ -d /workspace/.android-sdk ]]; then
  export ANDROID_HOME="${ANDROID_HOME:-/workspace/.android-sdk}"
  export ANDROID_USER_HOME="${ANDROID_USER_HOME:-/workspace/.android-user}"
  export GRADLE_USER_HOME="${GRADLE_USER_HOME:-/workspace/.gradle}"
fi
if [[ -n "${ANDROID_USER_HOME:-}" ]]; then mkdir -p "$ANDROID_USER_HOME"; fi
if [[ -d /workspace/.tools/jdk ]]; then
  export JAVA_HOME="${JAVA_HOME:-/workspace/.tools/jdk}"
fi
proxy_args=()
if [[ -n "${HTTPS_PROXY:-}" ]] && command -v python3 >/dev/null; then
  mapfile -t proxy_args < <(python3 - <<'PY'
import os,urllib.parse
u=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])
if u.hostname and not (u.username or u.password):
 for scheme in ['http','https']:
  print(f'-D{scheme}.proxyHost={u.hostname}')
  print(f'-D{scheme}.proxyPort={u.port or 80}')
  print(f'-D{scheme}.nonProxyHosts=localhost|127.*')
PY
)
fi
if [[ -f /etc/ssl/certs/java/cacerts && -d /workspace/.tools/jdk ]]; then
  proxy_args+=("-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts")
fi
cd "$project_root/android"
exec ./gradlew "${proxy_args[@]}" --no-daemon "$@"
