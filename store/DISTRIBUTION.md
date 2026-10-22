# Android, iPhone and direct installation

For the latest test download, use **Oche Club Preview 1.0.7** from `downloads/README.md`. Its separate preview ID avoids conflicts with the original alpha app.

The shared scorekeeping code and UI are local web assets. Android packages those assets in a native application shell. Export them with `npm run build:web` for an installable web app and for the later iOS shell; no desktop Node server is embedded in the native Android app.

| Route | File or delivery | Status / prerequisites |
| --- | --- | --- |
| Android personal testing | Debug APK | Build with `./scripts/android.sh assembleDebug`; install outside Play |
| Android direct release | Publisher-signed release APK | Build with `./scripts/android.sh assembleRelease` after configuring your signing key |
| Google Play paid download | Publisher-signed AAB | Play developer/merchant account, signing, real-device tests, listing and review |
| Android/iPhone web installation | HTTPS-hosted `dist/` | Installable web version implemented; not hosted or sold automatically |
| Native iPhone personal testing | Xcode development build / registered-device IPA | Planned later; Mac, Xcode and Apple provisioning required |
| Native iPhone registered-device distribution | Ad Hoc-signed IPA | Planned later; paid Apple Developer membership and registered device IDs, subject to Apple's limits |
| iPhone App Store paid download | App Store-signed app | Planned later; Apple Developer account, App Store Connect, review and pricing |
| Broader iPhone distribution outside the App Store | Eligible Apple distribution programme | Depends on region, OS version, developer eligibility, signing/notarization and current Apple terms; not a general unsigned-IPA download |

## Install Android on your own phone now

1. Transfer `android/app/build/outputs/apk/debug/app-debug.apk` to your phone by USB, or download it from your own secure file host. A local build does not upload files. The GitHub Actions tagged-prerelease job uploads test downloads when its release step succeeds.
2. Open it in the phone's file manager and allow installation from that specific source if Android asks. This is a **debug build for testing**, not the paid release.
3. With USB debugging and Android platform tools available, an alternative is `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
4. Test in airplane mode, close/reopen, rotate the screen and play full matches.

Published previews now copy a verified immutable APK snapshot instead of re-signing a new CI build. Preserve the existing private Preview key outside Git for future Preview updates.

For a direct production APK, use your own release signing key. An unsigned APK is not installable. Preserve the signing key and increase `versionCode` for updates. If Play App Signing uses a different app-signing certificate from your direct APK, the two builds cannot replace each other in place. Plan key/channel ownership before launch; an upload key is not necessarily the Play app-signing key. Use separate package IDs for independent channels if that is the chosen strategy.

## Install without either store: web version

Run `npm run build:web` and host only the generated `dist/` directory on an HTTPS static host. This is a distinct web installation, not a native IPA/APK and not an App Store listing. Public hosting makes this version publicly accessible; there is no checkout, paywall or download-sales service in this repository. Nothing is deployed automatically.

- Android: open the site in a compatible browser and select **Install app** or **Add to Home screen**.
- iPhone: open the site in Safari, choose **Share → Add to Home Screen**, and enable opening as a web app when offered.
- Load the app online once before relying on offline play. The service worker caches the UI, all game rules and fonts. Match state is stored locally for that web origin. System/browser storage clearing can remove it.
- Native app storage, browser storage and installed web app storage may be separate. No cross-device or native/web synchronization exists.
- After changing files, bump `CACHE` in `service-worker.js`; an updated cache becomes active after old app windows close. Do not add third-party scripts to an allegedly offline/no-data-collection release without reassessing the privacy policy.

## Later native iPhone milestone

Use a maintained iOS local-asset shell (for example Capacitor + WKWebView) consuming the exported assets. Do not simply navigate WKWebView to a development server, and do not assume file URLs can load ES modules with the right origin. Provide a stable local origin, local storage, bundled fonts, safe-area handling, back/close behavior and no unnecessary bridge permissions.

This Linux cloud environment cannot build, codesign or validate an iOS app: those steps require macOS, Xcode, an Apple team and appropriate provisioning profiles. No native iOS project or installable IPA is claimed to exist yet. The next iOS task must create the project, set its bundle ID, add icons/launch assets, run the game and persistence tests on iPhone/simulator, archive and codesign, then export the selected distribution format.

For personal development, Xcode may provision your own device with an Apple account subject to Apple's current expiry and capability limits. For Ad Hoc distribution, register each intended device and export using the corresponding profile; an IPA cannot be installed on arbitrary iPhones just because it is downloadable. TestFlight is a useful testing route but uses Apple's distribution service, so it is not an independent direct-download route.

Before offering direct iPhone downloads to the public, check the current Apple rules for the actual region and developer account. EU web distribution and alternative marketplace routes have specific eligibility and notarization requirements; do not assume a new individual developer qualifies. Enterprise signing is not a general-purpose way to sell an app to consumers.

Official starting points:

- https://developer.apple.com/programs/
- https://developer.apple.com/help/account/provisioning-profiles/create-an-ad-hoc-provisioning-profile
- https://developer.apple.com/support/web-distribution-eu/
- https://developer.apple.com/support/alternative-app-marketplace-in-the-eu/
