Oche Club Preview 1.0.9 — App-styled confirmations.

- **OcheClub-1.0.9-preview.apk**: signed Android Preview for Android 8.0+ with an updated Android System WebView.
- **OcheClub-web.zip**: installable web app after HTTPS hosting, including iPhone Add to Home Screen. No native iPhone IPA is included.
- **BUILD_INFO.json / SHA256SUMS.txt**: public build identity, signing-certificate fingerprint and checksums.

End game and Delete saved data now use themed dialogs with the app's slate-blue colours, dartboard icon, clear action labels and large buttons. Android Back uses the same design to confirm closing the app. Browser URL headers and generic OK/Cancel prompts are removed from these normal flows.

Keep playing/Keep data receive initial focus. Cancel, Escape and Android Back preserve the current game and dismiss only the top dialog. Cancelling deletion returns to About. Failed saves keep the confirmation open with an inline retry message, preserving scores, names and undo history. Confirmed Close app retains the saved game for the next launch. English and Danish follow the app language; all dialogs work offline and respect reduced-motion settings.

Around Double/Triple hit buttons, larger scoring text, the darker Miss button, one-step X01 Done handoff, up to three legal checkout suggestions, player names, post-game choices, all 12 game modes and their rulebooks remain available.

The Preview ID is `dk.pigeonarmy.ocheclub.preview` (versionCode **10**). Earlier Preview versions update in place with the preserved Preview signing key. The original alpha app uses a separate ID. Names and saved games stay on the device; there are no ads, accounts, subscriptions or network permission. Signing keys are never included in Git.

Publication requires the exact immutable APK to pass Android 15 and 16 installation, scoring, languages, themed confirmations, close/relaunch and persistence checks. The workflow publishes those tested bytes without rebuilding or re-signing them.

This is a development preview. Commercial signing, store submission, broader real-device testing and the later native iPhone app remain separate milestones.
