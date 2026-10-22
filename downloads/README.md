# Oche Club Preview downloads

Use **Oche Club Preview 1.0.3** package:

- [Download Android Preview APK](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.3-alpha.1/OcheClub-1.0.3-preview.apk)
- [Download web ZIP](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.3-alpha.1/OcheClub-web.zip)
- [Checksums](v1.0.3-alpha.1/SHA256SUMS.txt)
- [Build identity and public signing-certificate fingerprint](v1.0.3-alpha.1/BUILD_INFO.json)
- [Test-release notes](../store/TEST_RELEASE.md)

Preview uses `dk.pigeonarmy.ocheclub.preview`, a separate ID from the earlier app, and displays **Oche Club Preview** on Android. It can be installed alongside an older Oche Club copy without deleting its saved games. The two apps have separate local storage.

The earlier `v1.0.0-alpha.1` files are retained for reproducibility but are superseded. Its local and CI APKs had different signing certificates for the same app ID, so they cannot update one another. Use the new Preview download instead.

The APK is a debug development build for personal testing. The versioned APK is the canonical download; the release workflow copies its exact bytes and checks its certificate, hashes and current app assets instead of publishing a fresh random-key CI build. Native installation, scoring and immediate process-death persistence checks on Android 15 and 16 must pass before an alpha release is published. Signing keys are never included in Git.

The web ZIP needs HTTPS hosting before browser installation on Android or Safari → Add to Home Screen on iPhone. A native iPhone application is a later milestone.

[GitHub test release](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.3-alpha.1) · [Build and native-install results](https://github.com/Pigeonhunt3r/Dart-app/actions)

Version 1.0.2 added acknowledged Android disk saves so the latest score survives an abrupt process stop. The generic Samsung fresh-install error has not yet been reproduced on the user’s phone; no existing-install signature conflict is assumed.

Version 1.0.3 adds English throughout, with Danish selected from device settings. Android also supports its system per-app language setting. Native tests check changing between English and Danish while retaining the saved score.
