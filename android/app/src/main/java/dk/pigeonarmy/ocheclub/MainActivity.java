package dk.pigeonarmy.ocheclub;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.app.AlertDialog;
import android.app.LocaleManager;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.LocaleList;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

/** Offline application shell: packaged assets and a narrowly scoped local game store. */
public final class MainActivity extends ComponentActivity {
    private WebView webView;
    private AlertDialog exitDialog;
    private String deviceLanguage;
    private SharedPreferences languageSettings;
    private static final Object LANGUAGE_LOCK = new Object();
    private static String committedLanguagePreference;
    private static GameStore gameStore;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Read Android's locale service before WebView can alter a resource context.
        deviceLanguage = effectiveAndroidLanguage();
        languageSettings = getApplicationContext().getSharedPreferences("oche-settings", MODE_PRIVATE);
        synchronized (LANGUAGE_LOCK) {
            if (committedLanguagePreference == null) committedLanguagePreference = languageSettings.getString("language", "system");
        }
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(16, 24, 39));
        setContentView(webView);
        // Keep the scoreboard and controls out of system bars, cutouts and the IME.
        if (Build.VERSION.SDK_INT >= 30) {
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
            webView.requestApplyInsets();
        } else {
            webView.setFitsSystemWindows(true);
        }
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        webView.setWebViewClient(new WebViewClient() {
            private boolean local(android.net.Uri uri) {
                return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
                    && uri.getPath() != null && uri.getPath().startsWith("/assets/www/");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !local(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (local(request.getUrl()) && "GET".equals(request.getMethod())) {
                    WebResourceResponse response = assets.shouldInterceptRequest(request.getUrl());
                    if (response != null) return response;
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked",
                    java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });
        webView.setWebChromeClient(new android.webkit.WebChromeClient());
        // Only packaged pages can load. These two methods acknowledge disk writes
        // before the scoreboard advances, including when Android kills the process.
        if (gameStore == null) gameStore = new GameStore(
            getApplicationContext().getSharedPreferences("oche-game", MODE_PRIVATE));
        webView.addJavascriptInterface(gameStore, "OcheGameStore");
        webView.addJavascriptInterface(new DeviceLocale(), "OcheLocale");
        webView.addJavascriptInterface(new AppActions(), "OcheApp");
        webView.loadUrl(START);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { requestBack(); }
        });
    }

    public static final class GameStore {
        private final SharedPreferences preferences;
        private String committedState;
        GameStore(SharedPreferences preferences) {
            this.preferences = preferences;
            committedState = preferences.getString("game", null);
        }

        @JavascriptInterface public synchronized String load() {
            return committedState;
        }

        @JavascriptInterface public synchronized boolean save(String value) {
            if (value == null || value.length() > 8 * 1024 * 1024) return false;
            // An empty value records deletion, so old WebView data cannot reappear.
            if (!preferences.edit().putString("game", value).commit()) return false;
            // SharedPreferences updates its in-memory map even on disk failure.
            // Expose only acknowledged state, including across Activity recreation.
            committedState = value;
            return true;
        }
    }

    /** Packaged pages may close only this Activity, after their own confirmation. */
    public final class AppActions {
        @JavascriptInterface public void close() {
            runOnUiThread(() -> {
                if (!isFinishing()) finish();
            });
        }
    }

    public final class DeviceLocale {
        @JavascriptInterface public String language() {
            String selected = preference();
            return "system".equals(selected) ? deviceLanguage : selected;
        }
        @JavascriptInterface public String preference() {
            synchronized (LANGUAGE_LOCK) { return committedLanguagePreference; }
        }
        @JavascriptInterface public boolean setPreference(String value) {
            if (!"system".equals(value) && !"en".equals(value) && !"da".equals(value)) return false;
            synchronized (LANGUAGE_LOCK) {
                if (!languageSettings.edit().putString("language", value).commit()) return false;
                committedLanguagePreference = value;
                return true;
            }
        }
    }

    private String effectiveAndroidLanguage() {
        if (Build.VERSION.SDK_INT >= 33) {
            LocaleManager manager = getSystemService(LocaleManager.class);
            LocaleList selected = manager.getApplicationLocales();
            if (selected.isEmpty()) selected = manager.getSystemLocales();
            if (!selected.isEmpty()) return selected.get(0).toLanguageTag();
        }
        LocaleList selected = Resources.getSystem().getConfiguration().getLocales();
        return selected.isEmpty() ? "en" : selected.get(0).toLanguageTag();
    }

    private void requestBack() {
        webView.evaluateJavascript("window.ocheClubBack ? window.ocheClubBack() : false", result -> {
            if (!"true".equals(result) && !isFinishing()) confirmExit();
        });
    }

    private void confirmExit() {
        if (exitDialog != null && exitDialog.isShowing()) return;
        Configuration localized = new Configuration(getResources().getConfiguration());
        localized.setLocale(java.util.Locale.forLanguageTag(new DeviceLocale().language()));
        Resources strings = createConfigurationContext(localized).getResources();
        exitDialog = new AlertDialog.Builder(this)
            .setTitle(strings.getString(R.string.close_title)).setMessage(strings.getString(R.string.close_message))
            .setPositiveButton(strings.getString(R.string.close_yes), (dialog, which) -> finish())
            .setNegativeButton(strings.getString(R.string.close_no), null).show();
    }

    @Override protected void onPause() { webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        if (exitDialog != null) exitDialog.dismiss();
        webView.destroy();
        super.onDestroy();
    }
}
