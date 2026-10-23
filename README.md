# Oche Club

[Download Android-testappen og webversionen](downloads/README.md) · [Automatiske builds](https://github.com/Pigeonhunt3r/Dart-app/actions)

Offline darts scorekeeper for Android and an installable web version, for 1–8 players. English is the default; Danish is selected automatically when the device’s preferred language is Danish. Android 13+ also supports the system’s per-app language setting. Ingen konto, database eller eksterne JavaScript-afhængigheder. Aktuelle spil og fortryd-historik gemmes automatisk lokalt: med bekræftede disk-skrivninger på Android og localStorage i webversionen.

## Kør lokalt

Kræver Node.js 22 eller nyere.

```sh
npm ci --ignore-scripts
npm start
```

Serveren lytter på port 3000 på alle netværksinterfaces. Brug `PORT` for en anden port. Åbn appen via din udviklingsplatforms normale portadgang. Serveren har en eksplicit liste over offentlige filer og eksponerer ikke Git-metadata eller projektets øvrige filer.

```sh
npm run check
npm test
```

## Spil

- X01: 301, 501, 701 og 1001; double-out eller straight-out. Bust annullerer hele turen. Flere live lukkemuligheder viser single, double, triple og bull med de tilbageværende pile.
- Cricket og Cut-throat Cricket: Udvidet variant med 15–20, Double, Triple og Bull; klassisk variant uden de ekstra rækker kan vælges. Lukninger, point og strafpoint følger den valgte variant.
- Jorden rundt: Udvidet variant med spring på 1/2/3 tal ved single/double/triple, derefter nummereret Double, nummereret Triple og Bull. Klassisk 1–20 og Bull kan vælges.
- Double-runden: D1–D20.
- Shanghai: syv runder, øjeblikkelig sejr ved single + double + triple.
- Halve-it: ni mål, start på 40, halvering ved ingen træffere.
- Count Up: otte ture.
- Baseball: ni innings.
- Killer: tildelte numre, tre liv, egen double aktiverer killer-status.
- Elimination: præcis 301, nulstilling ved samme score.
- Golf: ni huller, sidste pil bestemmer resultatet, tidligt stop muligt.

Lokale dartregler varierer. Appens regelguide beskriver præcis de implementerede varianter. Det er ikke en udtømmende liste over alle dartspil. X01-lukkeveje er gyldige alternative kombinationer, hvor nogle bruger færre pile end andre; spillere kan foretrække andre kombinationer.

Der er ingen online multiplayer eller synkronisering mellem enheder. Spillere deler samme enhed. Skrifttyperne Barlow Condensed og DM Sans leveres lokalt under SIL Open Font License; licenser ligger i `src/fonts/`. Appen laver ingen eksterne netværkskald.

## Struktur

`src/engine.js` indeholder spilleregler og checkout-beregning som rene funktioner. `src/guidance.js` forklarer næste mål og handling ud fra den aktuelle spilstilling. `src/app.js` styrer brugerflade og lokal lagring. `server.js` leverer de statiske filer uden frameworks. `test/engine.test.js` tester spilforløb, sejre, bust og lukkeveje.


## Android og salg

**Oche Club** sælges som én betalt download uden reklamer, konti, abonnementer eller køb i appen. Android-projektet i `android/` pakker hele spillet lokalt med AndroidX WebViewAssetLoader; det kræver ingen Internet-tilladelse eller appserver. Brug en opdateret Android System WebView.

```sh
./scripts/android.sh assembleDebug lintDebug bundleRelease assembleRelease
```

Det kræver fuld JDK 17/21 (ikke kun JRE), SDK 36 og Build Tools 35.0.0. Cloudværktøjer og caches ligger uden for checkout. Gradle-wrapperen er versionslåst med SHA-256. Debug-APK kan installeres direkte til test; release-APK/AAB kræver din egen signeringsopsætning før udgivelse.

Se [Play Store-vejledningen](store/PLAY_STORE.md), [distribution på Android og iPhone](store/DISTRIBUTION.md) og [privatlivspolitikken](PRIVACY.md). Play-udgivelse, signering med udgiverens nøgle og test på rigtige Android-enheder er separate trin. Ingen release-nøgler er oprettet eller lagt i Git.

## Uden appbutikker og senere iPhone-app

`npm run build:web` eksporterer en selvstændig PWA til `dist/`. Host den på HTTPS, og installér fra browseren på Android eller via Safari → Del → Føj til hjemmeskærm på iPhone. Første indlæsning kræver net; derefter caches spillet til offlinebrug. Det er en webapp, ikke en native iPhone-app, og der er ingen betalingsmur eller offentlig hosting opsat.

En native iOS-version er planlagt som næste platform og skal bygges og signeres med macOS/Xcode og Apple-provisionering. Apple tillader ikke generel installation af vilkårlige IPA-filer; se distributionsvejledningen for egne enheder, Ad Hoc og regionale alternativer.


## Gentagelige browser- og Android-checks

```sh
# Cloud-installation af compiler og SDK (checksum-verificerede downloads):
python scripts/setup-android.py
# Kør npm start i en separat terminal først:
npm run test:browser
```

Browser-testen kræver Chromium på `/usr/bin/chromium` eller `CHROMIUM_PATH`, og kan få en alternativ webadresse via `TEST_BASE_URL`. Den gennemgår alle 12 spil og deres info-knapper, flere lukkeveje, fortryd, genindlæsning, lokal sletning og offline PWA-spil. Skærmbilleder skrives til ignorerede `artifacts/`.

Android lint er aktiveret uden baseline eller deaktiverede fejl. Toolchain-scriptet skriver kun til `/workspace` og accepterer SDK-licenser ved installation. En Android-emulator kan installeres valgfrit med `python scripts/setup-android.py --emulator`; real-device-test er stadig nødvendig før salg.


## Score entry and beginner guides

X01 and Count Up open with a regular **0–9 number pad** on the scoring screen. Enter the points scored in the turn (0–180), use Clear or backspace to correct them, then press **Done**. A total is a full turn and can only be entered before any individual darts have been recorded. A double-out finish asks what the final dart hit; an invalid finish is a Bust.

The **Dart hits** view uses repeated target taps instead of separate Single, Double and Triple buttons. Tap a number once for single, twice for double or three times for triple, then press **Add dart**. The selected dart is a preview until confirmed. A fourth tap returns to single. Bull cycles between 25 and Bullseye (50), and Miss records zero. The next dart starts with a fresh selection, including when it hits the same number. Extended Cricket shows nine scoring rows, with Double and Triple before Bull. Choose whether a dart counts toward its number or its separate Double/Triple row, then select the actual numbered field when using a category row. Classic Cricket keeps the original seven rows. All target-based modes keep exact field information so marks, closures and wins remain correct.

Tap the **dartboard icon** to open the hit calculator. Choose the exact single, double or triple field on the board, or use the large Bull/Miss buttons, review the dart previews, and press **Done**. Closing this calculator discards its unconfirmed draft. It also has a numeric-total tab for X01 and Count Up. **Bust** in X01/Elimination cancels the whole turn, including any opponent resets.

Every game card has an **ⓘ** rulebook with the aim, rules and an example. X01 shows several legal checkout combinations, including bull routes, when the remaining score is low enough. Only combinations that fit the darts left and finish rule are shown. English is the default; Danish follows the device language.

## GitHub-builds og testdownloads

Kildekode, Gradle-wrapper, lokale skrifter/licenser, tests og vejledninger ligger i dette repository. `downloads/v1.0.11-alpha.1/` indeholder den versionslåste Preview-APK og en web-ZIP, så de kan hentes direkte fra GitHub uden en appbutik.

GitHub Actions-workflowen bygger og tester ved pushes til `main` og ved pull requests. `v*-alpha.*`-tags udløser desuden en test-prerelease med APK, web-ZIP og checksums, hvis repositoryets Actions og tokenrettigheder tillader det. Et push eller et tag beviser ikke, at workflowen er gennemført; se Actions-resultatet. Ingen Play Store-, App Store- eller hjemmesideudgivelse udføres.

Efter et lokalt Android-build oprettes en ny, versionslåst Preview-download med `npm run package:downloads -- --create-snapshot v1.0.11-alpha.1` (vælg et nyt tag for næste version). Kontroller den med `--verify-snapshot <tag>`. Udgivelsesworkflowen bruger `--publish-snapshot <tag>` til at kopiere de eksakte signerede filer og afviser ændrede certifikater eller forældede kildefiler. Eksisterende snapshots overskrives ikke.


## Android-installation og lokal lagring

De oprindelige to testdownloads havde samme app-ID og forskellige debug-signaturer. De kan ikke installeres oven på hinanden. Den nye testapp hedder **Oche Club Preview**, har ID `dk.pigeonarmy.ocheclub.preview`, versionCode 13 og versionName `1.0.11-preview`. Den kan installeres ved siden af den gamle app uden at slette dens data. Produktions-ID'et er fortsat `dk.pigeonarmy.ocheclub`.

Preview-signerens offentlige certifikatfingeraftryk ligger i `android/preview-signing-cert.sha256`. Den private nøgle ligger uden for Git og skal bevares sikkert af udgiveren. En ny tilfældig nøgle bliver afvist ved oprettelse af offentlige previews; CI må gerne bygge med sin egen midlertidige debug-nøgle, men den build erstatter ikke den versionslåste download.

GitHub Actions bruger KVM-accelererede Android 15- og 16-emulatorer til `npm run test:android`: installation ved siden af den gamle app, geninstallation med samme certifikat, native opstart, 12 spilkort i den faktiske Android WebView, beregner/Færdig, fortryd, taltaster og lagring efter stop/genstart af processen. Ved tags testes den eksakte APK, der derefter udgives.

Android 1.0.2 og nyere gemmer spillet gennem en snæver lokal bro til appens private lager. Hver vellykket ændring er skrevet til disk før næste visning. Gamle Preview-spil fra WebView-lageret migreres ved opstart; sletning gemmes også, så et slettet spil ikke kommer tilbage. Webversionen bruger fortsat localStorage.

Samsung-telefonens generelle installationsfejl er endnu ikke diagnosticeret: brugeren havde ikke appen installeret i forvejen, så signaturkonflikten forklarer ikke den konkrete fejl. De automatiske checks kan kontrollere APK og Android-runtime, men ikke Samsungs indstillinger for installation fra filer.

## Language

All 12 rulebooks, goals and examples, game controls, calculators, checkout advice, validation messages, privacy/deletion text and Android exit dialogs support English and Danish. Other device languages fall back to English. Language changes preserve games and player names; generated winner and Bust messages use the current language. The PWA follows browser/device language, and Android reads the app’s effective system locale. `src/i18n.js` contains the Danish catalogue and English fallback. No translation service or network access is used.

From 1.0.4, a failed save leaves the score, undo state or deletion unchanged and shows an error. Undo retains the last 200 actions so long games keep a bounded save file. The compatibility message also works before modern JavaScript features are available.

## Players and the next game

Every fresh game setup starts with blank name fields. Each player must enter 1–24 characters, with at least one non-space character; surrounding whitespace is trimmed. Rematch preserves the same names, mode and settings while resetting scores and undo. After a win or shared win, choose Rematch, Another mode with the same players, or End session. Continuing shows the named group and pre-fills the next setup; names stay editable, and games that require two players explain when another person must be added. The completed result stays saved until the next game starts successfully. End session clears the game, names and undo history, so the next fresh setup is blank.

## Interface refresh (Preview 1.0.6)

The scoring interface uses cool light surfaces, slate text, a blue accent, larger active-player scores and touch-sized controls. A visible numeric keypad, a real dartboard calculator button and repeated-tap field entry replace the previous multiplier selector. Player setup, rematches, continuing with the same group, rulebooks, offline scoring and acknowledged local saves remain available.

From Preview 1.0.6, the EN/DA button opens App language: follow the system, English or Dansk. Android reads its system/per-app locale from LocaleManager before creating WebView. An explicit choice is saved separately from the game and persists after restart; returning to System language restores the Android or browser preference. Language changes preserve the saved game and undo history.

## Scores, live guidance and extended rules (Preview 1.0.7)

All player scores appear above score entry, with the active player highlighted. The interface uses a darker slate backdrop and cool gray panels. Every mode explains the current target, what counts, and whether to add a dart, finish the turn or move to the next player. X01 shows its available checkout alternatives beside score entry; a direct double finish does not hide other valid combinations. If only one finish is legal with the darts left, only that finish is shown.

Fresh Around the World games use the extended variant: hit the current numbered target to advance one/two/three numbers for single/double/triple, stopping at the separate Double stage. Finish with any numbered double (D1–D20), any numbered triple (T1–T20), then Bull or Bullseye. Those three stages must be completed in order; Bullseye does not satisfy the numbered Double stage. Classic mode advances one target per hit and goes directly from 20 to Bull.

Fresh Cricket and Cut-throat games use nine rows: 20–15, Double, Triple and Bull. Each row needs three marks. A D20 can count as two marks on 20 **or** one mark on Double; one dart credits one row. Three numbered doubles close Double, and three numbered triples close Triple. Extra category hits use the actual field value while an opponent has that category open, either adding your points in Cricket or penalty points in Cut-throat. Bullseye gives two Bull marks. Classic mode has the original numbers and Bull only.

The setup screen offers Extended and Classic rules. Existing saved games with no variant setting retain Classic rules, including undo and rematch, so an update does not change a match already underway.


## Easier turn entry (Preview 1.0.8)

Around the World has explicit **Double** and **Triple** hit buttons. On numbered targets they record D/T of the current number and apply the selected variant's progression; at the final Double/Triple stages they record the required numbered ring. Bull remains a separate final target. Repeated number taps still work.

Player cards, target boxes, hit buttons, number keys and guidance use larger text, and **Miss** has a darker slate background. X01 **Done** now saves the score and advances to the next player in one action, whether using the regular keypad, dartboard calculator or exact-hit input. Partial calculator visits end on Done; a winning checkout stays on the results screen. Undo restores both the score and player, while failed saves keep the entered score or calculator draft for retry. Bust also completes the X01 turn and identifies whose turn was cancelled.

X01 checkout help shows **up to three** distinct legal routes. Fewer appear only when fewer are possible with the remaining darts and finish rule.


## Themed confirmations (Preview 1.0.9)

End game and Delete saved data use app-styled dialogs instead of browser confirmations. Each dialog clearly names its action and offers Keep playing or Keep data as the initially focused button. Cancel, Escape and Android Back dismiss only the top dialog; cancelling data deletion returns to About. A failed save keeps the confirmation open with an inline error and a retry button, preserving the current scores and player names.

Android Back also uses the same themed dialog when closing the app. Close app finishes only this Android Activity through a narrow local bridge, keeping the saved game for the next launch. The native resource dialog remains a fallback if the packaged app page is unavailable. Confirmations follow the app's English/Danish language setting and work offline.


## Dark surfaces and score averages (Preview 1.0.10)

The entire app now uses a dark navy background, slate panels and lighter text. Player cards, number pads, target buttons, rulebooks, calculators and confirmation dialogs follow the same palette. Android system bars, startup background and the installable web theme use the matching dark colour.

New X01 and Count Up games show each player's **three-dart average** beside the score: points scored ÷ darts counted × 3, displayed to two decimal places. Misses count, and an X01 Bust cancels the turn's points while counting a three-dart visit. Averages update with exact hits and numeric totals, persist with the match, follow Undo, and reset on Rematch.

A normal numeric turn total counts as three darts. When entering a checkout total, choose the actual 1–3 darts used; the app checks that the finish is possible in that count. Exact-hit checkouts already know their dart count. Older saved games retain their scores and names, but cannot have a reliable historical average calculated without dart counts: start a new game or rematch to enable tracking. The About averages disclosure explains this beside the player cards.


## Live calculator total (Preview 1.0.11)

The dartboard calculator shows a large running total above the board, with each dart’s points in an addition such as 60 + 40 + 25 = 125. The total also stays visible with Done while scrolling. The numeric tab updates this footer total on every digit, deletion and Clear. Undo removes the last dart from the sum. These are draft hit totals; Done applies the selected game’s scoring rules.
