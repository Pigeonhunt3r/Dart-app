# Oche Club Preview downloads

Use **Oche Club Preview 1.0.7** package:

- [Download Android Preview APK](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.7-alpha.1/OcheClub-1.0.7-preview.apk)
- [Download web ZIP](https://github.com/Pigeonhunt3r/Dart-app/raw/refs/heads/main/downloads/v1.0.7-alpha.1/OcheClub-web.zip)
- [Checksums](v1.0.7-alpha.1/SHA256SUMS.txt)
- [Build identity and public signing-certificate fingerprint](v1.0.7-alpha.1/BUILD_INFO.json)
- [Test-release notes](../store/TEST_RELEASE.md)

Preview uses `dk.pigeonarmy.ocheclub.preview`, a separate ID from the earlier app, and displays **Oche Club Preview** on Android. It can be installed alongside an older Oche Club copy without deleting its saved games. The two apps have separate local storage.

The earlier `v1.0.0-alpha.1` files are retained for reproducibility but are superseded. Its local and CI APKs had different signing certificates for the same app ID, so they cannot update one another. Use the new Preview download instead.

The APK is a debug development build for personal testing. The versioned APK is the canonical download; the release workflow copies its exact bytes and checks its certificate, hashes and current app assets instead of publishing a fresh random-key CI build. Native installation, scoring and immediate process-death persistence checks on Android 15 and 16 must pass before an alpha release is published. Signing keys are never included in Git.

The web ZIP needs HTTPS hosting before browser installation on Android or Safari → Add to Home Screen on iPhone. A native iPhone application is a later milestone.

[GitHub test release](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.7-alpha.1) · [Build and native-install results](https://github.com/Pigeonhunt3r/Dart-app/actions)

Version 1.0.2 added acknowledged Android disk saves so the latest score survives an abrupt process stop. The generic Samsung fresh-install error has not yet been reproduced on the user’s phone; no existing-install signature conflict is assumed.

Version 1.0.3 adds English throughout, with Danish selected from device settings. Android also supports its system per-app language setting. Native tests check changing between English and Danish while retaining the saved score.

Version 1.0.5 adds required player names and post-game choices for a rematch, another mode with the same players, or ending the session.

Version 1.0.6 redesigns the interface with a light slate-and-blue palette, large active scores and a visible regular number pad for X01/Count Up. The dartboard icon opens the calculator. Exact-hit entry uses repeated target taps for single/double/triple, followed by Add dart, with no separate multiplier selector.

If the language does not match your phone, use the EN/DA button and select **English**, or **System language** to follow Android. Preview 1.0.6 reads the Android locale service directly and saves optional language choices on the device.

Version 1.0.7 puts all player scores above entry, darkens the background and explains the current target and next action in every mode. Fresh Around the World games allow single/double/triple number skips, then require numbered Double → numbered Triple → Bull. Fresh Cricket/Cut-throat games add separate Double and Triple rows before Bull; each dart credits one selected row. Classic variants remain selectable, and older saved games keep their Classic rules. Available X01 checkout alternatives now appear beside score entry.
