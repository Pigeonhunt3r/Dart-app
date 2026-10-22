Oche Club Preview 1.0.3 — English and Danish, with durable offline game saving.

- **OcheClub-1.0.3-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums. No private key is included.

English is the default. Danish follows the device’s preferred language; Android 13+ also supports the system per-app language setting. Controls, all 12 rulebooks, examples, checkout guidance, calculator, errors, privacy text and Android dialogs are localized. Names and games are preserved when language changes.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode 4). It can be installed alongside the original `dk.pigeonarmy.ocheclub` alpha without deleting that app or its data. Earlier Preview versions can update in place using the same preserved Preview signing key.

Android game updates use acknowledged private disk saves, including deletion and migration from older Preview WebView data. Browser games use localStorage. No network permission or remote service was added.

Publication requires checks of the exact immutable download on Android 15 and 16: install, same-key reinstall, real scoring, undo, numeric totals, abrupt process stop/reopen and English/Danish app language, including a Danish native dialog. The workflow publishes those tested bytes without rebuilding or re-signing. The publisher must preserve the private Preview key outside Git.

The Samsung S24+ user’s original fresh-install rejection has not been reproduced. They confirmed no earlier installation and Auto Blocker off; neither is assumed as the cause. If this APK is also rejected, an Android package-installer error code or device log is needed for a precise diagnosis.

This is a development preview. Final artwork, commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.
