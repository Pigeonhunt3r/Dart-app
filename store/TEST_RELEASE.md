Oche Club Preview 1.0.11 — Live calculator totals.

- **OcheClub-1.0.11-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums.

The calculator shows its running total above the dartboard, including the addition for the hits entered (for example, 60 + 40 + 25 = 125). Undo and Miss update it immediately. A second total stays visible with Done while scrolling, and updates on every digit, backspace and Clear in the numeric tab. Hits remain a draft until Done applies the game’s scoring rules. Closing the calculator leaves the saved game unchanged.

Dark navy/slate surfaces and per-player three-dart averages for X01/Count Up remain available. Existing saved games retain their scores and names.

English/Danish language support, all 12 modes/rulebooks, top player scores, Around Double/Triple buttons, one-step X01 Done, up to three legal checkout routes and themed confirmations remain available offline.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode **13**). Earlier Preview versions update in place with the preserved Preview signing key. The original alpha app uses a separate ID. Names and saved games stay on the device; there are no ads, accounts, subscriptions or network permission. Signing keys are never included in Git.

Publication requires the exact immutable APK to pass Android 15 and 16 installation, scoring, averages, languages, themed confirmations, close/relaunch and persistence checks. The workflow publishes the tested bytes without rebuilding or re-signing them.

This is a development preview. Commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.
