package com.botimagen.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.net.Uri;
import android.view.ViewGroup;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private WebView webView;
    private final ExecutorService network = Executors.newSingleThreadExecutor();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.addJavascriptInterface(new NativeImageBridge(), "BotImagenNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                // Keep the privileged JavaScript bridge on the bundled local app only.
                return !"file".equalsIgnoreCase(uri.getScheme()) ||
                    !"android_asset".equalsIgnoreCase(uri.getAuthority());
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    private final class NativeImageBridge {
        @JavascriptInterface public void generateImage(String requestId, String endpoint, String apiKey, String bodyJson) {
            network.execute(() -> {
                int status = 0;
                String response = "";
                HttpURLConnection connection = null;
                try {
                    URL url = new URL(endpoint);
                    if (!"https".equalsIgnoreCase(url.getProtocol()) || apiKey == null || apiKey.isEmpty()) {
                        throw new IllegalArgumentException("Se requiere endpoint HTTPS y clave de sesión.");
                    }
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("POST");
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(180000);
                    connection.setDoOutput(true);
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    connection.setRequestProperty("Authorization", "Bearer " + apiKey);
                    byte[] payload = bodyJson.getBytes(StandardCharsets.UTF_8);
                    connection.setFixedLengthStreamingMode(payload.length);
                    try (OutputStream out = connection.getOutputStream()) { out.write(payload); }
                    status = connection.getResponseCode();
                    InputStream stream = status >= 200 && status < 400 ? connection.getInputStream() : connection.getErrorStream();
                    if (stream != null) {
                        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                            StringBuilder text = new StringBuilder();
                            char[] buffer = new char[8192];
                            int count;
                            while ((count = reader.read(buffer)) != -1) {
                                text.append(buffer, 0, count);
                                if (text.length() > 20_000_000) throw new IllegalStateException("La respuesta supera 20 MB.");
                            }
                            response = text.toString();
                        }
                    }
                } catch (Exception error) {
                    try { response = new JSONObject().put("error", new JSONObject().put("message", error.getMessage() == null ? "Error de red" : error.getMessage())).toString(); }
                    catch (Exception ignored) { response = "{\"error\":{\"message\":\"Error de red\"}}"; }
                    if (status == 0) status = 599;
                } finally {
                    if (connection != null) connection.disconnect();
                }
                final int resultStatus = status;
                final String resultBody = response;
                final String safeId = JSONObject.quote(requestId);
                final String safeBody = JSONObject.quote(resultBody);
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                        "window.__nativeAiResult && window.__nativeAiResult(" + safeId + "," + safeBody + "," + resultStatus + ")", null);
                });
            });
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.removeJavascriptInterface("BotImagenNative");
            webView.destroy();
            webView = null;
        }
        network.shutdownNow();
        super.onDestroy();
    }
}
