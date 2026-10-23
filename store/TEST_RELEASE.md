Oche Club Preview 1.0.10 — Dark theme and player averages.

- **OcheClub-1.0.10-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums.

The full interface now uses dark navy/slate surfaces with light text: home cards, setup, player cards, number pads, targets, checkout suggestions, calculator, rulebooks and confirmation dialogs. Android system bars/startup and the web installation theme match.

New X01 (301/501/701/1001) and Count Up games show each player's three-dart average beside the score, displayed to two decimal places. The calculation is points scored ÷ darts counted × 3. Misses count; Bust scores zero for a three-dart visit. Averages persist, follow Undo, and reset on Rematch.

Numeric turn totals normally count as three darts. For a checkout total, choose the actual 1–3 darts used; impossible combinations are rejected. Exact-hit checkouts use the actual recorded count. Older saved games keep their scores and names but have no historical dart count, so their averages stay unavailable until a new game/rematch. About averages explains the rules in the app.

English/Danish language support, all 12 modes/rulebooks, top player scores, Around Double/Triple buttons, one-step X01 Done, up to three legal checkout routes and themed confirmations remain available offline.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode **12**). Earlier Preview versions update in place with the preserved Preview signing key. The original alpha app uses a separate ID. Names and saved games stay on the device; there are no ads, accounts, subscriptions or network permission. Signing keys are never included in Git.

Publication requires the exact immutable APK to pass Android 15 and 16 installation, scoring, averages, languages, themed confirmations, close/relaunch and persistence checks. The workflow publishes the tested bytes without rebuilding or re-signing them.

This is a development preview. Commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.
