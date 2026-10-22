# Oche Club

[Download Android-testappen og webversionen](downloads/README.md) · [Automatiske builds](https://github.com/Pigeonhunt3r/Dart-app/actions)

Dansk dart-scoreapp til Android og en installérbar webversion til 1–8 spillere. Ingen konto, database eller eksterne JavaScript-afhængigheder. Aktuelle spil og fortryd-historik gemmes automatisk lokalt: med bekræftede disk-skrivninger på Android og localStorage i webversionen.

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
- Cricket og Cut-throat Cricket: 15–20 og bull, lukninger og point.
- Jorden rundt: 1–20 og bull.
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

`src/engine.js` indeholder spilleregler og checkout-beregning som rene funktioner. `src/app.js` styrer brugerflade og lokal lagring. `server.js` leverer de statiske filer uden frameworks. `test/engine.test.js` tester spilforløb, sejre, bust og lukkeveje.


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


## Pointberegner og begynderguider

Tryk på dartskive-knappen i et spil for at åbne en beregner. Vælg felterne på skiven (single/double/triple, bull eller forbi), kontrollér pilene og tryk **Færdig** for at registrere dem. Ændringer forbliver en kladde indtil Færdig. Bull og bullseye har også store knapper til små skærme.

X01 og Count Up har desuden en **Samlet score**-fane med 0–9, ryd og slet. Den registrerer hele turens sum (0–180) og kan kun bruges ved turens start. Ved en X01-lukning med double-out skal sidste felt bekræftes; en forkert afslutning bliver bust. Cricket og målbaserede spil kræver de konkrete felter, så rene totaler ikke ødelægger reglerne. **Bust** i X01/Elimination annullerer hele turen, inklusive eventuelle nulstillinger af modstandere.

Alle spilkort har en **ⓘ**-knap med mål, regler, eksempler og en forklaring på skivens felter. X01 viser flere mulige lukninger, inklusive bull-ruter, når scoren kommer inden for rækkevidde. Kun kombinationer, der passer til de resterende pile og slutreglen, vises.


## GitHub-builds og testdownloads

Kildekode, Gradle-wrapper, lokale skrifter/licenser, tests og vejledninger ligger i dette repository. `downloads/v1.0.2-alpha.1/` indeholder den første lokalt verificerede debug-APK og en web-ZIP, så de kan hentes direkte fra GitHub uden en appbutik.

GitHub Actions-workflowen bygger og tester ved pushes til `main` og ved pull requests. `v*-alpha.*`-tags udløser desuden en test-prerelease med APK, web-ZIP og checksums, hvis repositoryets Actions og tokenrettigheder tillader det. Et push eller et tag beviser ikke, at workflowen er gennemført; se Actions-resultatet. Ingen Play Store-, App Store- eller hjemmesideudgivelse udføres.

Efter et lokalt Android-build oprettes en ny, versionslåst Preview-download med `npm run package:downloads -- --create-snapshot v1.0.2-alpha.1` (vælg et nyt tag for næste version). Kontroller den med `--verify-snapshot <tag>`. Udgivelsesworkflowen bruger `--publish-snapshot <tag>` til at kopiere de eksakte signerede filer og afviser ændrede certifikater eller forældede kildefiler. Eksisterende snapshots overskrives ikke.


## Android-installation og lokal lagring

De oprindelige to testdownloads havde samme app-ID og forskellige debug-signaturer. De kan ikke installeres oven på hinanden. Den nye testapp hedder **Oche Club Preview**, har ID `dk.pigeonarmy.ocheclub.preview`, versionCode 3 og versionName `1.0.2-preview`. Den kan installeres ved siden af den gamle app uden at slette dens data. Produktions-ID'et er fortsat `dk.pigeonarmy.ocheclub`.

Preview-signerens offentlige certifikatfingeraftryk ligger i `android/preview-signing-cert.sha256`. Den private nøgle ligger uden for Git og skal bevares sikkert af udgiveren. En ny tilfældig nøgle bliver afvist ved oprettelse af offentlige previews; CI må gerne bygge med sin egen midlertidige debug-nøgle, men den build erstatter ikke den versionslåste download.

GitHub Actions bruger KVM-accelererede Android 15- og 16-emulatorer til `npm run test:android`: installation ved siden af den gamle app, geninstallation med samme certifikat, native opstart, 12 spilkort i den faktiske Android WebView, beregner/Færdig, fortryd, taltaster og lagring efter stop/genstart af processen. Ved tags testes den eksakte APK, der derefter udgives.

Android 1.0.2 gemmer spillet gennem en snæver lokal bro til appens private lager. Hver vellykket ændring er skrevet til disk før næste visning. Gamle Preview-spil fra WebView-lageret migreres ved opstart; sletning gemmes også, så et slettet spil ikke kommer tilbage. Webversionen bruger fortsat localStorage.

Samsung-telefonens generelle installationsfejl er endnu ikke diagnosticeret: brugeren havde ikke appen installeret i forvejen, så signaturkonflikten forklarer ikke den konkrete fejl. De automatiske checks kan kontrollere APK og Android-runtime, men ikke Samsungs indstillinger for installation fra filer.
