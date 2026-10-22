package dk.pigeonarmy.ocheclub;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
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
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(18, 23, 19));
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
        webView.addJavascriptInterface(new GameStore(
            getSharedPreferences("oche-game", MODE_PRIVATE)), "OcheGameStore");
        webView.loadUrl(START);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { requestBack(); }
        });
    }

    public static final class GameStore {
        private final SharedPreferences preferences;
        GameStore(SharedPreferences preferences) { this.preferences = preferences; }

        @JavascriptInterface public String load() {
            return preferences.getString("game", null);
        }

        @JavascriptInterface public boolean save(String value) {
            if (value == null || value.length() > 4 * 1024 * 1024) return false;
            // An empty value records deletion, so old WebView data cannot reappear.
            return preferences.edit().putString("game", value).commit();
        }
    }

    private void requestBack() {
        webView.evaluateJavascript("window.ocheClubBack ? window.ocheClubBack() : false", result -> {
            if (!"true".equals(result) && !isFinishing()) confirmExit();
        });
    }

    private void confirmExit() {
        if (exitDialog != null && exitDialog.isShowing()) return;
        exitDialog = new AlertDialog.Builder(this)
            .setTitle(R.string.close_title).setMessage(R.string.close_message)
            .setPositiveButton(R.string.close_yes, (dialog, which) -> finish())
            .setNegativeButton(R.string.close_no, null).show();
    }

    @Override protected void onPause() { webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        if (exitDialog != null) exitDialog.dismiss();
        webView.destroy();
        super.onDestroy();
    }
}
