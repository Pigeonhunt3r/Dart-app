# Validation record — 22 October 2026

This records development checks, not commercial store readiness.

## Local Preview 1.0.3 checks

- Frozen-lockfile npm installation, JavaScript syntax and **41 unit tests: 41 passed, 0 failed, 0 skipped**. Covers all game modes, checkout routes, totals, Bust, storage migration/failure/deletion and language selection.
- Danish browser regression: all 12 games and rulebooks, checkout victory, calculator, numeric totals, undo, privacy deletion, mobile layout and offline play.
- English browser regression: all 12 rulebooks, goals/examples, numeric Done, checkout victory, saved names, privacy deletion and offline reload. Also checks Danish device locale, English fallback for German and Android app-locale priority over browser locale.
- Android debug APK, unsigned release APK and unsigned release AAB build with SDK/target 36, JDK 21 and checksum-pinned Gradle 8.13. Android lint: **0 errors, 2 warnings** (newer AndroidX Activity available, JavaScript required for packaged assets). No lint baseline or disabled errors.
- APK signatures, ZIP integrity, alignment, identity, preserved Preview certificate and exact bundled web assets are verified during snapshot creation. No native `.so` libraries or ABI restriction, Internet permission or billing permission.
- PWA export contains only public app assets. No public web deployment or native IPA is included.

## Confirmed native baseline: Preview 1.0.2

GitHub Actions [39765506469](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39765506469) and [39765506572](https://github.com/Pigeonhunt3r/Dart-app/actions/runs/39765506572) passed installation and scoring on accelerated API 35 and 36 emulators. The exact immutable APK installs, reinstalls, opens all 12 game cards, records dartboard hits and numeric totals, supports undo and retains score 401 after immediate force-stop/relaunch. [Preview 1.0.2](https://github.com/Pigeonhunt3r/Dart-app/releases/tag/v1.0.2-alpha.1) was published after its tagged checks passed.

The preceding Preview 1.0.1 diagnosis failed specifically at **process-death persistence**: score 401 was displayed before the stop, then reopened at 501. Private SharedPreferences commits in 1.0.2 fixed that independently confirmed defect. Storage is exposed only through fixed-purpose load/save methods; 1.0.3 adds a read-only locale method. Navigation and requests remain restricted to packaged assets.

## Preview 1.0.3 native language checks

The new native smoke also changes the Android app language to Danish, checks score 401 and translated controls, opens the real Danish exit dialog, then switches to English and rechecks the score. Both API 35 and 36 must pass on the exact tagged APK before release. These new checks are pending at this source commit; consult the associated Actions result for their completed outcome.

## Samsung device report

The user has a Galaxy S24+ on the latest software Samsung offered them, with no previous installation and Auto Blocker off. Their generic “App not installed” message has not been reproduced on that phone. A signing conflict between original alpha distributions was real, but does not explain their confirmed fresh install. Emulator/static checks do not validate Samsung’s file-installer behavior.

## Remaining publication work

- Full matches and accessibility, rotation, large fonts, airplane mode and upgrade testing on real phones.
- Final UI artwork and logo, publisher-owned commercial signing, account/merchant setup, support identity, price, hosted privacy policy, store screenshots and Play declarations/review.
- Later native iOS project, macOS/Xcode, Apple provisioning, signing and iPhone testing. Current iPhone support is the PWA after HTTPS hosting.
- Direct web sales/payment, public web hosting, IPA distribution and store submission have not been performed.

The cloud machine has no KVM. Its original software-emulator attempt did not complete boot and was stopped. Successful native results above come from GitHub’s accelerated emulators. Runtime processes do not survive environment snapshots.
