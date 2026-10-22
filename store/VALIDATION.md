# Validation record — 22 October 2026

This is development validation, not a claim of commercial release readiness.

## Passed in this cloud machine

- `npm ci --ignore-scripts --cache /workspace/.npm-cache` using the committed lockfile content.
- `python scripts/setup-android.py`: repeatable SDK/JDK preparation using verified official artifacts.
- `npm run check` and `npm test`: **38 passed, 0 failed, 0 skipped**. Includes all 12 game modes, X01 bust/double-out/bull, multiple legal checkout choices across scores and dart budgets, numeric whole-visit input, finish validation, explicit Bust and Elimination rollback. Eleven storage tests cover browser storage, acknowledged native commits, migration, failure handling and deletion tombstones.
- `npm run test:browser` with Chromium: all game modes and all per-card rulebooks, novice examples, 501 checkout victory, multiple finishing routes, undo, reload persistence, rematch, filters, mobile overflow, privacy deletion, web-side Android-back handler, dartboard draft/Done, keypad total entry, Bust, and offline PWA play/reload.
- `npm run build:web`: standalone export. No public deployment performed.
- `./scripts/android.sh assembleDebug lintDebug bundleRelease assembleRelease`: success with SDK/target 36, full JDK 21 and checksum-pinned Gradle 8.13.
- Android lint: **0 errors, 3 warnings**. Warnings are a newer available AndroidX Activity version, JavaScript being enabled for the bundled game and an unused app-name resource. The only JavaScript bridge exposes fixed-purpose local game load/save methods; remote content is blocked. No lint baseline/error disabling is used.
- Debug APK signature verified with `apksigner` (v2 signing). Manifest inspected: correct application ID/version/min SDK/target SDK, no Internet or billing permission.
- Debug APK and release AAB inspected: current HTML/JS/CSS/icons are bundled byte-for-byte; neither contains native `.so` libraries.
- Release AAB checked with `jarsigner`: **unsigned**, as intended until the publisher supplies their own release signing configuration. Release APK is also unsigned. Neither is a store-ready signed release.

## Original alpha 1 native runtime attempt

An Android 16/API 36 software emulator was installed and started. This machine has no `/dev/kvm` hardware acceleration. The guest exposed package/activity services but did not finish booting during the test attempt. `adb install` returned **device is still booting**. The emulator was stopped; no successful native launch, Android UI test or real-device test is claimed.

The actual APK still needs installation and validation on a real Android phone or a working accelerated emulator: full games, calculator, single/double/bull target selection, numeric totals and final-hit confirmation, automatic and explicit bust, back gestures/dialogs, airplane mode, process death/reopen, rotation, large fonts and accessibility. The APK offered for personal download is explicitly a **debug test build**.

## Publication/platform work still required

- Final visual design and final logo (the launcher icon is a placeholder, per the core-first plan).
- Publisher-controlled release signing and key/channel ownership strategy.
- Developer/merchant account, confirmed package/name availability, publisher/support details, price, public privacy-policy URL, actual Android screenshots, Play declarations and applicable testing/review requirements.
- Native iOS project, macOS/Xcode build, provisioning/signing and iPhone testing. These have not been performed on Linux. The existing iPhone-compatible installation route is a web app after HTTPS hosting, not a native IPA.
- Public web hosting, payment/paywall for direct web distribution, native IPA distribution and store submission remain separate. The repository includes a debug test APK/web ZIP and a workflow for alpha prereleases; those are development downloads, not a commercial store release.

The GitHub publication includes the application sources, Android build files, tests, documentation and versioned personal-test downloads. A tagged prerelease is confirmed only after its GitHub Actions release job or GitHub release page confirms completion. No store release or public web deployment is implied.


## Preview 1.0.1 installation correction

The original locally built APK and GitHub-CI-built APK have identical uncompressed application contents but different signing certificates for the same original application ID/version. Both pass signature, ZIP integrity and alignment verification. A signer mismatch is a confirmed distribution defect and prevents installing one over the other; the user's generic installer screenshot alone does not establish the exact device error.

Preview 1.0.1 uses a separate `dk.pigeonarmy.ocheclub.preview` application ID and "Oche Club Preview" label so an old original-ID app can remain installed. The canonical download is now an immutable, versioned APK snapshot with a checked public signing-certificate fingerprint. Publication copies its exact signed bytes and rejects stale assets, changed certificates and checksum mismatches. An altered-snapshot regression check passed locally.

The updated GitHub workflow runs `npm run test:android` in an accelerated API 35 emulator. It installs the old original-ID app, installs Preview alongside it, reinstalls Preview with the same key, opens the real Android WebView, exercises scoring and confirms saved state after force-stop/relaunch. For tagged releases it tests the exact snapshot download and gates publication on success. See the associated Actions run for its completed result; local static checks do not establish that native runtime checks passed. Real Samsung/device-specific validation remains useful.

## Preview 1.0.2 native storage validation

The API 35 emulator successfully installed and opened the 1.0.1 Preview APK. The gameplay smoke then reported score 501 where 401 was expected; phase-labelled API 35/36 diagnostics are retained in Actions to distinguish numeric input from process-death persistence. A fresh Samsung installation failure has not been reproduced: the user confirmed no earlier app was installed.

Version 1.0.2 adds private SharedPreferences storage through only `load()` and `save(String)`, acknowledges `commit()` before returning, and blocks remote/file/content navigation as before. Legacy WebView state migrates after a successful commit; a persisted empty value records deletion. Browser storage remains localStorage. The exact versioned APK must pass real WebView scoring and immediate force-stop/relaunch on both API 35 and 36 before tagged publication. At this commit these native checks are pending; do not infer a pass from the local build.
