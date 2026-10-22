Oche Club Preview 1.0.1 — installation fix for personal testing.

Downloads:

- **OcheClub-1.0.1-preview.apk** — signed Android Preview APK, Android 8.0+ with an up-to-date Android System WebView.
- **OcheClub-web.zip** — web installation after HTTPS hosting; supports Android and iPhone browser home-screen installation. No native iPhone IPA is included.
- **BUILD_INFO.json** — public package identity, signing-certificate fingerprint and source hashes. Contains no private signing key.
- **SHA256SUMS.txt** — download checksums.

Install this new **Oche Club Preview** package. Its ID is `dk.pigeonarmy.ocheclub.preview`, so it installs alongside the earlier `dk.pigeonarmy.ocheclub` test app and does not require deleting that app or its saved games. Games saved in the old app remain in that app and are not automatically copied to Preview.

The earlier alpha offered two APKs with the same app ID but different signing certificates. Android rejects one as an update over the other. This release publishes the exact versioned APK from the repository, without rebuilding or re-signing it during publication. Snapshot verification rejects a changed signing certificate or stale source assets. The private Preview key stays outside Git; the publisher must preserve it securely for compatible Preview updates.

The release workflow installs and reinstalls the exact download in an isolated accelerated Android emulator and checks real WebView gameplay before publishing. Check the associated GitHub Actions result for current validation. Real-phone testing is still required; this is a development preview, not a commercially signed Play Store release.

If Android still refuses installation, note the exact error and the phone model/Android version. The generic "App not installed" screen can also have causes unrelated to signing. Do not delete an older app merely to try this separate Preview package.

Includes 12 game modes, alternative X01 finishes, beginner info rulebooks, dartboard calculator, numeric totals, Bust, undo and local saving. Final branding, commercial signing, Play Store publication and native iPhone work remain separate.
