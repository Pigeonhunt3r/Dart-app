Oche Club Preview 1.0.7 — Player scores on top, live instructions and extended Around the World/Cricket rules.

- **OcheClub-1.0.7-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums. No private key is included.

All player scores now sit above score entry. A darker slate background and cool gray panels replace the bright white surfaces. Every game explains the current target, what counts and the next action. X01 checkout alternatives are shown beside score entry, including other valid combinations when a direct double finish is available. Routes still obey the finish rule and remaining dart count; when only one route is legal, the app shows one.

Fresh **Around the World** games use extended rules. A hit on the current number advances one/two/three numbers for a single/double/triple, stopping at the separate Double stage. Then hit any numbered double (D1–D20), any numbered triple (T1–T20), and finally Bull (25) or Bullseye (50). These final stages must be completed in order; Bullseye does not satisfy the numbered Double stage.

Fresh **Cricket and Cut-throat Cricket** games have nine rows: 20–15, Double, Triple and Bull. Close each with three marks. A double or triple can count toward its number row or give one mark to its separate category row; choose one row per dart. For example, D20 gives two marks on 20 or one on Double. Extra category hits score the actual numbered field value while opponents have that category open, adding your score in Cricket or their penalty points in Cut-throat. Bullseye gives two Bull marks.

Both games offer **Classic** rules during setup. Existing saved games without a variant setting retain their Classic rules, including after undo or rematch. Player names, post-game session choices, the visible number pad, repeated-tap dart entry, dartboard calculator, Bust and acknowledged local saving remain available.

English is the default; Danish follows the device or Android per-app language. The EN/DA button also offers System, English and Dansk explicitly. The choice survives restart without changing the saved game. Rulebooks, live instructions, controls, checkout advice, calculator, errors, privacy text and Android dialogs support both languages.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode **8**). It can be installed alongside the original `dk.pigeonarmy.ocheclub` alpha. Earlier Preview versions update in place with the preserved Preview signing key. Names and saved games stay on the device; no network permission, ads, accounts, subscriptions or remote service were added.

Publication requires the exact immutable APK to pass Android 15 and 16 checks, including installation, same-key reinstall, scoring, undo, numeric totals, process-stop recovery, languages and the new guidance/extended-rule flows. The workflow publishes those tested bytes without rebuilding or re-signing them. The publisher must preserve the private Preview key outside Git.

This is a development preview. Commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.
