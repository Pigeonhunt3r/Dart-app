#!/usr/bin/env python3
"""Create and verify immutable preview snapshots; publication never re-signs an APK."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXPECTED_CERT = ROOT / 'android/preview-signing-cert.sha256'


def digest(file):
    with Path(file).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def source_files():
    files = [ROOT / name for name in ['index.html', 'manifest.webmanifest', 'PRIVACY.md']]
    for folder in ['src', 'public']:
        files += sorted(p for p in (ROOT / folder).rglob('*') if p.is_file())
    return files


def build_inputs():
    files = source_files() + [ROOT / 'service-worker.js'] + [ROOT / name for name in [
        'android/app/build.gradle', 'android/build.gradle', 'android/settings.gradle',
        'android/gradle.properties', 'android/gradle/wrapper/gradle-wrapper.jar',
        'android/gradle/wrapper/gradle-wrapper.properties']]
    files += sorted(p for p in (ROOT / 'android/app/src/main').rglob('*') if p.is_file())
    return {p.relative_to(ROOT).as_posix(): digest(p) for p in files}


def build_tool(name):
    sdk = Path(os.environ.get('ANDROID_HOME', '/workspace/.android-sdk'))
    file = sdk / 'build-tools/35.0.0' / name
    if not file.exists():
        raise RuntimeError('Install Android Build Tools 35.0.0 before packaging downloads')
    return str(file)


def inspect_apk(apk):
    verified = subprocess.run([build_tool('apksigner'), 'verify', '--verbose', '--print-certs', str(apk)],
                              check=True, text=True, capture_output=True)
    cert = re.search(r'Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]+)', verified.stdout)
    if not cert:
        raise RuntimeError('Cannot determine the APK signing certificate')
    expected = EXPECTED_CERT.read_text().strip()
    if cert.group(1).lower() != expected:
        raise RuntimeError('Preview signing key changed. Restore the existing private preview keystore; do not publish a differently signed update.')
    badging = subprocess.run([build_tool('aapt'), 'dump', 'badging', str(apk)],
                            check=True, text=True, capture_output=True).stdout
    package = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging, re.M)
    if not package or package.group(1) != 'dk.pigeonarmy.ocheclub.preview':
        raise RuntimeError('Only the isolated Preview application ID may be published as a test APK')
    with zipfile.ZipFile(apk) as zipped:
        if zipped.testzip():
            raise RuntimeError('APK ZIP integrity check failed')
        for file in source_files():
            if zipped.read('assets/www/' + file.relative_to(ROOT).as_posix()) != file.read_bytes():
                raise RuntimeError('APK contains stale web assets: ' + str(file.relative_to(ROOT)))
    return {'applicationId': package.group(1), 'versionCode': int(package.group(2)),
            'versionName': package.group(3), 'signingCertificateSha256': cert.group(1).lower()}


def tag_directory(tag):
    if not re.fullmatch(r'v\d+\.\d+\.\d+-alpha\.\d+', tag):
        raise RuntimeError('Expected an alpha version tag, e.g. v1.0.1-alpha.1')
    return ROOT / 'downloads' / tag


def checksums(directory, names):
    return ''.join(digest(directory / name) + '  ' + name + '\n' for name in names)


def verify_snapshot(directory, tag):
    metadata = json.loads((directory / 'BUILD_INFO.json').read_text())
    if metadata['releaseTag'] != tag or metadata['sourceInputs'] != build_inputs():
        raise RuntimeError('Snapshot does not match this source version. Build a new preview and create a new versioned snapshot.')
    for line in (directory / 'SHA256SUMS.txt').read_text().splitlines():
        expected, name = line.split('  ', 1)
        if name not in [metadata['apkFile'], 'OcheClub-web.zip', 'BUILD_INFO.json']:
            raise RuntimeError('Unexpected snapshot file in checksum list')
        if digest(directory / name) != expected:
            raise RuntimeError('Snapshot checksum mismatch: ' + name)
    with zipfile.ZipFile(directory / 'OcheClub-web.zip') as zipped:
        web_files = source_files() + [ROOT / 'service-worker.js']
        if set(zipped.namelist()) != {p.relative_to(ROOT).as_posix() for p in web_files}:
            raise RuntimeError('Web ZIP includes unexpected or missing files')
        for file in web_files:
            if zipped.read(file.relative_to(ROOT).as_posix()) != file.read_bytes():
                raise RuntimeError('Web ZIP contains stale assets')
    required = [metadata['apkFile'], 'OcheClub-web.zip', 'BUILD_INFO.json']
    if (directory / 'SHA256SUMS.txt').read_text() != checksums(directory, required):
        raise RuntimeError('Snapshot checksum list is incomplete')
    if inspect_apk(directory / metadata['apkFile']) != metadata['android']:
        raise RuntimeError('Snapshot APK identity differs from its metadata')
    return metadata


def create_snapshot(tag):
    destination = tag_directory(tag)
    if destination.exists():
        raise RuntimeError('Versioned snapshots are immutable. Choose a new release tag.')
    apk = ROOT / 'android/app/build/outputs/apk/debug/app-debug.apk'
    info = inspect_apk(apk)
    version = json.loads((ROOT / 'package.json').read_text())['version']
    if not tag.startswith('v' + version + '-alpha.') or info['versionName'] != version + '-preview':
        raise RuntimeError('Package, Android and snapshot versions do not agree')
    name = 'OcheClub-' + version + '-preview.apk'
    destination.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.preview-', dir=destination.parent) as temporary:
        staged = Path(temporary) / 'files'
        staged.mkdir()
        shutil.copy2(apk, staged / name)
        # Explicit source allowlist: stale or unrelated dist files cannot enter a public ZIP.
        with zipfile.ZipFile(staged / 'OcheClub-web.zip', 'w', zipfile.ZIP_DEFLATED) as zipped:
            for file in source_files() + [ROOT / 'service-worker.js']:
                zipped.write(file, file.relative_to(ROOT).as_posix())
        metadata = {'formatVersion': 1, 'releaseTag': tag, 'apkFile': name,
                    'android': info, 'sourceInputs': build_inputs()}
        (staged / 'BUILD_INFO.json').write_text(json.dumps(metadata, indent=2) + '\n')
        (staged / 'SHA256SUMS.txt').write_text(checksums(staged, [name, 'OcheClub-web.zip', 'BUILD_INFO.json']))
        verify_snapshot(staged, tag)
        staged.rename(destination)
    print('Created immutable preview snapshot:', destination.relative_to(ROOT))


def publish_snapshot(tag):
    source = tag_directory(tag)
    metadata = verify_snapshot(source, tag)
    output = ROOT / 'artifacts/release-downloads' / tag
    names = [metadata['apkFile'], 'OcheClub-web.zip', 'BUILD_INFO.json', 'SHA256SUMS.txt']
    output.mkdir(parents=True, exist_ok=True)
    if any(file.name not in names for file in output.iterdir()):
        raise RuntimeError('Unexpected files in release output directory')
    for name in names:
        shutil.copy2(source / name, output / name)
    print('Verified and copied exact signed snapshot bytes for publication:', output.relative_to(ROOT))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--create-snapshot')
    group.add_argument('--publish-snapshot')
    group.add_argument('--verify-snapshot')
    args = parser.parse_args()
    if args.create_snapshot:
        create_snapshot(args.create_snapshot)
    elif args.publish_snapshot:
        publish_snapshot(args.publish_snapshot)
    else:
        verify_snapshot(tag_directory(args.verify_snapshot), args.verify_snapshot)
        print('Preview snapshot verified; signing certificate and sources match.')
