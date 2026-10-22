#!/usr/bin/env python3
"""Prepare the isolated Linux cloud toolchain using checksum-verified artifacts.

Writes only to /workspace tool/cache directories, never installs into system paths.
SDK package installation accepts the Android SDK license prompts for this build.
Use an existing checkout; do not create a Git worktree.
"""
import hashlib
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import urllib.parse
import urllib.request
import zipfile
import sys

TOOLS = Path('/workspace/.tools')
SDK = Path('/workspace/.android-sdk')
ANDROID_USER = Path('/workspace/.android-user')
JDK_NAME = 'jdk-21.0.12.1+1'
JDK_URL = ('https://github.com/adoptium/temurin21-binaries/releases/download/'
           'jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz')
JDK_SHA256 = 'ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94'
SDK_URL = 'https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip'
# Google's HTTPS repository metadata publishes SHA-1 for this specific archive.
SDK_SHA1 = '5fdcc763663eefb86a5b8879697aa6088b041e70'


def download(url, expected, algorithm, destination):
    urllib.request.urlretrieve(url, destination)
    with open(destination, 'rb') as stream:
        actual = hashlib.file_digest(stream, algorithm).hexdigest()
    if actual != expected:
        Path(destination).unlink(missing_ok=True)
        raise RuntimeError('Artifact checksum mismatch; installation stopped')


def main():
    for directory in [TOOLS, SDK, ANDROID_USER]:
        directory.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='oche-android-') as tmp:
        if not (TOOLS / JDK_NAME / 'bin/javac').exists():
            archive = Path(tmp) / 'jdk.tar.gz'
            download(JDK_URL, JDK_SHA256, 'sha256', archive)
            with tarfile.open(archive) as tar:
                tar.extractall(TOOLS, filter='data')
        link = TOOLS / 'jdk'
        if not link.exists() and not link.is_symlink():
            link.symlink_to(JDK_NAME, target_is_directory=True)
        manager = SDK / 'cmdline-tools/19.0/bin/sdkmanager'
        if not manager.exists():
            archive = Path(tmp) / 'sdk.zip'
            download(SDK_URL, SDK_SHA1, 'sha1', archive)
            staging = Path(tmp) / 'sdk'
            with zipfile.ZipFile(archive) as zipped:
                zipped.extractall(staging)
            target = SDK / 'cmdline-tools/19.0'
            target.parent.mkdir(parents=True, exist_ok=True)
            (staging / 'cmdline-tools').rename(target)
            for binary in (target / 'bin').iterdir():
                binary.chmod(0o755)
    env = os.environ.copy()
    env.update(ANDROID_HOME=str(SDK), ANDROID_USER_HOME=str(ANDROID_USER))
    command = [str(manager), '--sdk_root=' + str(SDK)]
    proxy = urllib.parse.urlparse(env.get('HTTPS_PROXY', ''))
    if proxy.hostname:
        if proxy.username or proxy.password:
            raise RuntimeError('Use the platform-supported proxy authentication; do not copy credentials')
        command += ['--proxy=http', '--proxy_host=' + proxy.hostname,
                    '--proxy_port=' + str(proxy.port or 80)]
    packages = ['platform-tools', 'platforms;android-36', 'build-tools;35.0.0']
    if '--emulator' in sys.argv:
        packages += ['emulator', 'system-images;android-36;google_apis;x86_64']
    for arguments in [['--licenses'], packages]:
        result = subprocess.run(command + arguments, input='y\n' * 100, text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env)
        if result.returncode:
            print(result.stdout[-6000:])
            raise SystemExit(result.returncode)
    subprocess.run([str(TOOLS / JDK_NAME / 'bin/javac'), '-version'], check=True)
    print('Android toolchain prepared. Run ./scripts/android.sh assembleDebug lintDebug bundleRelease.')


if __name__ == '__main__':
    main()
