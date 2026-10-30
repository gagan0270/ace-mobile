package com.ace.parentportal;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.content.Intent;
import android.net.Uri;
import android.content.Context;
import android.view.WindowManager;
import android.view.Display;
import android.view.View;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Hardware Acceleration & Max Refresh Rate Mode (120Hz/144Hz)
        try {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            );

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                Display display = getDisplay();
                if (display != null) {
                    WindowManager.LayoutParams params = getWindow().getAttributes();
                    params.preferredDisplayModeId = getMaxRefreshRateMode(display);
                    getWindow().setAttributes(params);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. High Performance WebView Layer & Rendering (No layer-type hardware hacks that cause black box popup glitches)
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setBackgroundColor(0xFF000000);
            WebSettings settings = webView.getSettings();
            if (settings != null) {
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                settings.setEnableSmoothTransition(true);
            }
            webView.addJavascriptInterface(new WebAppInterface(this), "AndroidInterface");
        }
    }

    private int getMaxRefreshRateMode(Display display) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            Display.Mode[] modes = display.getSupportedModes();
            Display.Mode maxMode = display.getMode();
            float maxRate = maxMode.getRefreshRate();

            for (Display.Mode mode : modes) {
                if (mode.getRefreshRate() > maxRate) {
                    maxRate = mode.getRefreshRate();
                    maxMode = mode;
                }
            }
            return maxMode.getModeId();
        }
        return 0;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('appResumed'));",
                        null
                    );
                }
            });
        }
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public boolean canRequestPackageInstalls() {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                return mContext.getPackageManager().canRequestPackageInstalls();
            }
            return true;
        }

        @JavascriptInterface
        public void openInstallSettings() {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + mContext.getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(intent);
            }
        }

        @JavascriptInterface
        public void installApk(final String apkUrl) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        URL url = new URL(apkUrl);
                        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestMethod("GET");
                        connection.connect();

                        File cacheDir = mContext.getExternalCacheDir();
                        if (cacheDir == null) {
                            cacheDir = mContext.getCacheDir();
                        }
                        final File apkFile = new File(cacheDir, "update.apk");
                        if (apkFile.exists()) {
                            apkFile.delete();
                        }

                        FileOutputStream fos = new FileOutputStream(apkFile);
                        InputStream is = connection.getInputStream();
                        byte[] buffer = new byte[4096];
                        int len;
                        while ((len = is.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                        fos.close();
                        is.close();

                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        Uri apkUri = FileProvider.getUriForFile(
                            mContext,
                            mContext.getPackageName() + ".fileprovider",
                            apkFile
                        );
                        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        
                        intent.setPackage("com.android.packageinstaller");
                        try {
                            mContext.startActivity(intent);
                        } catch (Exception e) {
                            intent.setPackage("com.google.android.packageinstaller");
                            try {
                                mContext.startActivity(intent);
                            } catch (Exception ex) {
                                intent.setPackage(null);
                                mContext.startActivity(intent);
                            }
                        }

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }
}
