# Validation record — 23 October 2026

This records development checks, not commercial store readiness.

## Preview 1.0.10 dark surfaces and averages

This revision changes the entire interface and Android/web shell to dark navy/slate surfaces. New X01/Count Up games track per-player three-dart averages with immutable scores: misses, Bust, numeric totals, partial visits, actual checkout dart counts, Undo, reload and Rematch. Older saves remain playable without fabricated historical averages.

Local validation passed: **77 unit tests** and all **eight browser suites**, JavaScript syntax, web export, Android debug/unsigned release APK/AAB builds, and lint (0 errors, 2 existing warnings). Tests cover independent player averages, live/exact/manual scoring, zero-point darts, natural/explicit/numeric Bust, failed saves, Undo, reload, short exact/manual checkouts, Count Up, Rematch and honest legacy-save handling. English/Danish average formatting and checkout count fields pass.

Visual checks covered home, setup, scoring, calculators, rules and confirmations in English/Danish at 320, 390, 412 and 1440px without overflow. Text/control contrast passed; body and Android/web shells use #101827. The immutable 1.0.10 snapshot verifies its preserved signing certificate and exact source assets. Exact tagged-APK Android 15/16 checks remain release gates. Historical results below describe earlier revisions.

## Preview 1.0.9 themed confirmations

End game, data deletion and normal Android app closing now use app-styled dialogs. Browser checks cover cancellation, Escape, focus containment/restoration, nested Back handling, failed writes with retry, English/Danish text, and absence of browser JavaScript prompts. Native checks exercise real Android Back, cancelling exit/end-game, confirming Activity close and restoring the saved match on relaunch.

Local validation passed: **67 unit tests**, all **seven browser suites**, JavaScript syntax, web export, Android debug/unsigned release APK/AAB builds, and lint (0 errors, 2 existing warnings). Confirmation layouts fit 320, 390 and 412px, with 48px buttons, keyboard focus containment, reduced-motion support and English/Danish labels. The immutable 1.0.9 snapshot verifies its preserved signing certificate and exact bundled source assets.

The exact tagged APK must pass Android 15 and 16 installation, scoring, themed-dialog, close/relaunch and persistence checks before release publication. Historical results below describe earlier revisions.

## Preview 1.0.8 turn entry and readability

This revision adds explicit Around Double/Triple buttons, larger scoring text and a darker Miss button. X01 Done commits the score and next player in one saved action; partial calculator visits, exact hits, numeric totals, Bust, undo and failed-save retries share the new flow. Checkout help is capped at three distinct legal routes.

Local validation passed: **67 unit tests**, all **six browser suites**, JavaScript syntax, web export, Android debug/unsigned release APK/AAB builds, and lint (0 errors, 2 existing warnings). Browser fault tests verify that calculator Done keeps the draft on failed save, retries once, persists the next player, and restores score/player with one Undo. Exact-hit Done, numeric totals, Bust, winning checkouts, Around shortcuts and three-route limits pass. English/Danish layouts fit at 320, 390, 412 and 1440px, including 24-character names; Miss text contrast is 8.02:1. The immutable 1.0.8 snapshot verifies its preserved signing certificate and exact bundled source assets.

The exact tagged APK must pass Android 15 and 16 before release publication. Native exit-dialog checks wait for the resumed app window, keyboard dismissal and accessibility readiness before sending Back, and capture window/input evidence on failure. Historical checks below describe earlier versions.

## Preview 1.0.7 scores, guidance and rule variants

This source revision puts every player's score above entry, uses darker slate/gray surfaces, and adds live target/action guidance for all 12 modes. Fresh Around the World games use multiplier skips followed by numbered Double, numbered Triple and Bull. Fresh Cricket/Cut-throat games add separate Double/Triple rows with one-row-per-dart credit. Classic variants remain selectable, and older saved games retain Classic behavior through undo and rematch. Available X01 checkout alternatives now appear beside entry instead of being reduced to a two-route preview.

Local validation passed: **62 unit tests**, all five browser suites, JavaScript syntax, web export and Android debug/unsigned release APK/AAB builds. Lint reports 0 errors and 2 warnings. Tests cover the new progression, nine-row closures/points, exclusive category credit, legacy rules/rematches, top scores and dynamic guidance. Visual checks found no horizontal overflow at 320, 390, 412 and 1440px. The exact snapshot and tagged Android 15/16 checks remain publication gates. Do not treat historical results below as validation of this new source revision.

## Preview 1.0.6 redesign checks

The redesigned interface adds a visible standard keypad to X01/Count Up, a real dartboard calculator launcher and repeated-tap exact-field selection. New browser/native checks cover a pending single/double/triple selection before Add dart, Bull/Bullseye cycling, scoring after confirmation, failed-save retries and an empty selection after rematch. The existing full-game, rulebook, checkout, storage, language and session suites remain required. Native versionCode 7 checks exercise the regular keypad and repeated-tap entry in the real Android WebView.

Local checks passed: 43 unit tests and all four browser suites; debug APK, unsigned release APK/AAB and lint (0 errors, 2 warnings). Browser checks cover inline keypad clearing/backspace, invalid totals, required final-double confirmation, repeated-tap exact darts, failed-save retries, system/manual language choices and preserved games. Layout checks found no horizontal overflow at 320, 390, 412, 915 and 1440px. Android 15 and 16 passed in [tag run 39826917350](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39826917350) and [main run 39826906805](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39826906805). All four published [1.0.6 assets](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.6-alpha.2) matched the committed snapshot byte-for-byte.

## Confirmed local baseline: Preview 1.0.5

- Frozen-lockfile npm installation, JavaScript syntax and **42 unit tests: 42 passed, 0 failed, 0 skipped**. Covers all game modes, checkout routes, totals, Bust, storage migration/failure/deletion and language selection.
- Danish browser regression: all 12 games and rulebooks, checkout victory, calculator, numeric totals, undo, privacy deletion, mobile layout and offline play.
- English browser regression: all 12 rulebooks, goals/examples, numeric Done, checkout victory, saved names, privacy deletion and offline reload. Also checks Danish device locale, English fallback for German and Android app-locale priority over browser locale.
- Session browser checks: all 12 fresh name prompts; blank/whitespace rejection; trimmed one-character names; escaped carried names; rematch options, scores, undo and multiplier reset; a different mode with the same roster; Back/reload recovery; ending/deleting names; a solo roster adding a second player for Killer.
- Storage UI fault checks: failed game start, score, undo and privacy deletion retain the previous state, retries succeed, deletion survives reload, and a 120-turn game retains 200 undo actions and can still undo.
- The classic compatibility bootstrap parses as ES5; English and Danish update messages appear when modern WebView features are unavailable.
- Android debug APK, unsigned release APK and unsigned release AAB build with SDK/target 36, JDK 21 and checksum-pinned Gradle 8.13. Android lint: **0 errors, 2 warnings** (newer AndroidX Activity available, JavaScript required for packaged assets). No lint baseline or disabled errors.
- APK signatures, ZIP integrity, alignment, identity, preserved Preview certificate and exact bundled web assets are verified during snapshot creation. No native `.so` libraries or ABI restriction, Internet permission or billing permission.
- PWA export contains only public app assets. No public web deployment or native IPA is included.

## Confirmed native baseline: Preview 1.0.2

GitHub Actions [39765506469](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39765506469) and [39765506572](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39765506572) passed installation and scoring on accelerated API 35 and 36 emulators. The exact immutable APK installs, reinstalls, opens all 12 game cards, records dartboard hits and numeric totals, supports undo and retains score 401 after immediate force-stop/relaunch. [Preview 1.0.2](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.2-alpha.1) was published after its tagged checks passed.

The preceding Preview 1.0.1 diagnosis failed specifically at **process-death persistence**: score 401 was displayed before the stop, then reopened at 501. Private SharedPreferences commits in 1.0.2 fixed that independently confirmed defect. Storage is exposed only through fixed-purpose load/save methods; 1.0.3 adds a read-only locale method. Navigation and requests remain restricted to packaged assets.

## Preview 1.0.5 native session checks

The native smoke enters required names, checks post-game rematch, carrying players into another mode and ending the session. It also changes the Android app language to Danish, checks score 401 and translated controls, opens the real Danish exit dialog, then switches to English and rechecks the score. Both API 35 and 36 must pass on the exact tagged APK before release. Both passed in [tag run 39797831263](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39797831263) and [main run 39797828746](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39797828746). All four published 1.0.5 assets were downloaded and matched the committed snapshot byte-for-byte.

## Samsung device report

The user has a Galaxy S24+ on the latest software Samsung offered them, with no previous installation and Auto Blocker off. Their generic “App not installed” message has not been reproduced on that phone. A signing conflict between original alpha distributions was real, but does not explain their confirmed fresh install. Emulator/static checks do not validate Samsung’s file-installer behavior.

## Remaining publication work

- Full matches and accessibility, rotation, large fonts, airplane mode and upgrade testing on real phones.
- Final UI artwork and logo, publisher-owned commercial signing, account/merchant setup, support identity, price, hosted privacy policy, store screenshots and Play declarations/review.
- Later native iOS project, macOS/Xcode, Apple provisioning, signing and iPhone testing. Current iPhone support is the PWA after HTTPS hosting.
- Direct web sales/payment, public web hosting, IPA distribution and store submission have not been performed.

The cloud machine has no KVM. Its original software-emulator attempt did not complete boot and was stopped. Successful native results above come from GitHub’s accelerated emulators. Runtime processes do not survive environment snapshots.
