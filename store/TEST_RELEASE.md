Oche Club development preview for personal testing.

Downloads:

- **OcheClub-1.0.0-debug.apk** — directly installable Android debug build, Android 8.0+ with a current Android System WebView. The application's internal version is 1.0.0. Enable installation from the selected source if Android requires it.
- **OcheClub-web.zip** — installable web version after hosting on HTTPS; Android and iPhone can add it to the home screen. This is not a native iPhone IPA and no website is deployed by this release.
- **SHA256SUMS.txt** — checksums of the two downloads.

Includes 12 dart game modes, X01 alternative checkout combinations, per-game beginner rulebooks, the interactive dartboard calculator, numeric X01/Count Up turn entry, Bust, undo and local match saving.

This is a test prerelease. Automated/browser tests and Android build/lint have passed locally. Native real-phone testing is still required; the cloud software emulator did not finish booting. There is no signed commercial Play Store release or native iPhone app yet. Final visual branding and the final app logo are still planned.

Debug builds made on different machines may use different debug signing keys and may require uninstalling the earlier test app before installation, which removes its local game data. A stable publisher-controlled signing key is required for commercial updates. Release signing keys are deliberately not included.

See store/PLAY_STORE.md, store/DISTRIBUTION.md and PRIVACY.md in the repository for remaining publication requirements.
