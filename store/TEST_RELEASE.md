Oche Club Preview 1.0.6 — A redesigned scoring interface with a visible number pad and repeated-tap dart entry.

- **OcheClub-1.0.6-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums. No private key is included.

English is the default. Danish follows the device’s preferred language; Android 13+ also supports the system per-app language setting. Controls, all 12 rulebooks, examples, checkout guidance, calculator, errors, privacy text and Android dialogs are localized. Names and games are preserved when language changes.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode 7). It can be installed alongside the original `dk.pigeonarmy.ocheclub` alpha without deleting that app or its data. Earlier Preview versions can update in place using the same preserved Preview signing key.

Android game updates use acknowledged private disk saves, including deletion and migration from older Preview WebView data. Browser games use localStorage. No network permission or remote service was added.

Publication requires checks of the exact immutable download on Android 15 and 16: install, same-key reinstall, real scoring, undo, numeric totals, abrupt process stop/reopen and English/Danish app language, including a Danish native dialog. The workflow publishes those tested bytes without rebuilding or re-signing. The publisher must preserve the private Preview key outside Git.

The Samsung S24+ user’s original fresh-install rejection has not been reproduced. They confirmed no earlier installation and Auto Blocker off; neither is assumed as the cause. If this APK is also rejected, an Android package-installer error code or device log is needed for a precise diagnosis.

This is a development preview. Final artwork, commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.

Version 1.0.4 keeps scores and deletions unchanged when a save fails, allows retry, retains the last 200 undo actions and preserves the update-WebView message on older browsers.

Version 1.0.5 requires an entered name for each player in every fresh setup (1–24 characters, with at least one non-space character). After any completed game, choose a rematch with the same settings, another mode with the same players, or End session. Continuing pre-fills an editable roster and preserves the old result until the new game saves. End session clears names and history.

Version 1.0.6 replaces the olive/lime interface with cool light surfaces, slate text and a blue accent. X01 and Count Up show the standard 0–9 keypad immediately; Clear, backspace and Done work on that screen. A dartboard icon opens the exact-field calculator. The Dart hits view replaces multiplier buttons: tap a target once/twice/three times for single/double/triple, review the selected dart, then Add dart. Bull cycles between 25 and 50. Nothing is saved from a pending target until Add dart succeeds, and calculator drafts remain uncommitted until Done. Existing rulebooks, checkouts, Bust, undo, name entry and session choices are retained.

This version also reads Android language directly from the locale service before WebView starts. The EN/DA button lets you choose System, English or Dansk explicitly; that preference survives restart without changing the saved game. Native checks include English system detection and switching the in-app choice while preserving score.
