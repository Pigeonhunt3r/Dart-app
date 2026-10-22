# Oche Club: paid Android release

## Product

- Name: **Oche Club** (chosen working name; publisher must check store/trademark availability).
- Package/application ID: `dk.pigeonarmy.ocheclub`. Confirm before the first Play upload; the ID cannot subsequently be changed for that listing.
- Model: one-time paid download, no ads, subscriptions or in-app purchases. Set the price in Play Console; no billing integration is required for an upfront paid listing. Choose paid before launch: Google Play does not allow a published free app to become paid under the same listing.
- Primary language: English, with Danish localization selected from system settings. Game category: Sports (confirm against the actual Console choices).
- Minimum Android: 8.0 / API 26; an up-to-date Android System WebView is required.
- Compile/target SDK: 36. Check the current Play target API deadline again at submission.
- Android App Bundle (AAB) for Play. Debug APK is only for local testing, not sale.
- No Internet, advertising ID, contacts, location, storage or other runtime permissions.
- No third-party analytics/ads SDKs. No native `.so` libraries; still run Play's compatibility checks, including current 16 KB page-size requirements.

## English listing draft

**Short description**

Your darts partner: 12 game variants, live checkouts and scores for everyone.

**Full description**

Make darts night simple with Oche Club. Pick a game, enter the players and let the app keep score and track turns.

• 301, 501, 701 and 1001 with double-out or straight-out.
• Several live checkout routes show singles, triples, doubles and bull finishes for your remaining darts.
• Cricket, Cut-throat Cricket, Around the World, Around the Doubles, Shanghai, Halve-it, Count Up, Baseball, Killer, Elimination and Golf.
• 1–8 players sharing one device; some games require at least two.
• Tap the dartboard to record hits, then Done; or enter a full X01 turn using the number pad. Bust cancels the turn.
• Beginner rulebooks behind each game’s info button, undo and automatic local saving.
• English by default, Danish when selected by device settings.
• Offline play. No ads, accounts, subscriptions or in-app purchases.

Local rules vary. The in-app guide describes the supported variants. No online multiplayer or cross-device sync.

## Danish listing draft

**Short description**

Din dartmakker: 12 spilvarianter, live lukkeveje og point til hele holdet.

**Full description**

Gør dart-aftenen enkel med Oche Club. Vælg et spil, skriv spillernes navne, og lad appen holde styr på point og tur.

• 301, 501, 701 og 1001 med double-out eller straight-out.
• Flere live lukkemuligheder viser præcis hvilke singler, tripler, doubler og bull du kan lukke med — tilpasset de pile, du har tilbage.
• Cricket, Cut-throat Cricket, Jorden rundt, Double-runden, Shanghai, Halve-it, Count Up, Baseball, Killer, Elimination og Golf.
• 1–8 spillere på samme enhed (nogle spil kræver mindst to).
• Tryk på dartskiven, registrér dine træffere og tryk Færdig — eller indtast en samlet X01-score med taltasterne. Bust-knappen annullerer turen.
• Begyndervenlige regelbøger bag hvert spils info-knap, fortryd og automatisk lokal lagring af dit igangværende spil.
• Spil offline. Ingen reklamer, konti, abonnementer eller køb i appen.

Lokale dartregler kan variere. Appens regelguide beskriver de implementerede varianter. Appen understøtter ikke online multiplayer eller synkronisering mellem enheder.

## Publisher-owned prerequisites

1. Register/verify a Google Play developer account and payment/merchant profile eligible to sell in the chosen countries. Complete any identity, device verification and account-specific testing requirements shown in Play Console. Do not assume a new personal account can immediately publish to production.
2. Confirm name, package ID, developer/legal name, monitored support email, sale price, distribution countries and refund/support obligations. The repository does not invent these details.
3. Create an **upload key** and enroll in Play App Signing. Keep the private upload keystore and passwords outside source control and back them up securely. Do not send passwords in chat.
4. Complete `PRIVACY.md` with the publisher identity and contact and host it on a stable public HTTPS URL. Provide that URL in Play Console. The in-app privacy text already explains local storage and deletion.
5. Complete Data safety based on the final binary: current app code collects/shares no data, uses no SDK telemetry and has no network permission. Google Play payment handling is separate. Reassess if any SDK, network or feature is added.
6. Complete the ads declaration (none), app access (no login), content rating questionnaire, target audience and other applicable Console declarations honestly. Do not target children without checking the relevant requirements.
7. Supply the Play listing icon (512×512), feature graphic (1024×500), real Android device screenshots and support information. The launcher vector is included, but browser screenshots are not a substitute for verified Android screenshots.
8. Run a signed internal/closed test on real devices: all games, checkout, touch targets, TalkBack, font/display scaling, keyboard, portrait/landscape, system back, screen cutouts, process death/resume, airplane mode, storage deletion and Android upgrade. Do not claim these passed merely because the web tests passed.
9. Check the current Google Play policies, upload the signed AAB to a test track, inspect pre-launch reports and warnings, then submit for review. Store acceptance is a Google decision, not guaranteed by a build.

## Build and signing

Use JDK 17 or 21, Android SDK platform 36 and Build Tools 35.0.0. Android Studio can install these. In this cloud environment, `scripts/android.sh` supplies SDK/cache paths and the existing proxy configuration.

```sh
npm ci --ignore-scripts
npm run check
npm test
./scripts/android.sh assembleDebug lintDebug bundleRelease
```

An unsigned release bundle is useful for build verification and cannot be uploaded to Play. No debug signing fallback exists for release builds.

Create your publisher upload key on a secure machine (the tool asks for passwords; do not put them in command arguments):

```sh
keytool -genkeypair -v -keystore /secure/path/oche-club-upload.jks \
  -alias upload -keyalg RSA -keysize 3072 -validity 10000
```

Copy `android/keystore.properties.example` to ignored `android/keystore.properties` and set the real local path/passwords securely. Then run `./scripts/android.sh bundleRelease`. Verify the resulting bundle is signed before upload. Never commit either file or expose credentials in logs. Increment `versionCode` for every subsequent upload.

Outputs:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/reports/lint-results-debug.html`

Official references (recheck at release):

- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.android.com/studio/publish/app-signing
- https://support.google.com/googleplay/android-developer/answer/9858738
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/14151465
