# Oche Club Preview downloads

Use the corrected **Oche Club Preview 1.0.1** package:

- [Download Android Preview APK](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.1-alpha.1/OcheClub-1.0.1-preview.apk)
- [Download web ZIP](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.1-alpha.1/OcheClub-web.zip)
- [Checksums](v1.0.1-alpha.1/SHA256SUMS.txt)
- [Build identity and public signing-certificate fingerprint](v1.0.1-alpha.1/BUILD_INFO.json)
- [Test-release notes](../store/TEST_RELEASE.md)

Preview uses `dk.pigeonarmy.ocheclub.preview`, a separate ID from the earlier app, and displays **Oche Club Preview** on Android. It can be installed alongside an older Oche Club copy without deleting its saved games. The two apps have separate local storage.

The earlier `v1.0.0-alpha.1` files are retained for reproducibility but are superseded. Its local and CI APKs had different signing certificates for the same app ID, so they cannot update one another. Use the new Preview download instead.

The APK is a debug development build for personal testing. The versioned APK is the canonical download; the release workflow copies its exact bytes and checks its certificate, hashes and current app assets instead of publishing a fresh random-key CI build. Native install/launch checks must pass before an alpha release is published. Signing keys are never included in Git.

The web ZIP needs HTTPS hosting before browser installation on Android or Safari → Add to Home Screen on iPhone. A native iPhone application is a later milestone.

[GitHub test release](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.1-alpha.1) · [Build and native-install results](https://github.com/Pigeonhunt3r/Dart-app/actions)
