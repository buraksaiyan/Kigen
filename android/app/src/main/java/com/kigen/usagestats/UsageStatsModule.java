package com.kigen.usagestats;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.Calendar;
import java.util.List;
import java.util.Map;

public class UsageStatsModule extends ReactContextBaseJavaModule {
    
    private final ReactApplicationContext reactContext;

    public UsageStatsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UsageStats";
    }

    @ReactMethod
    public void hasUsageStatsPermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), reactContext.getPackageName());
            boolean granted = mode == AppOpsManager.MODE_ALLOWED;
            promise.resolve(granted);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getUsageStats(Promise promise) {
        try {
            // Check permission first
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), reactContext.getPackageName());
            
            if (mode != AppOpsManager.MODE_ALLOWED) {
                promise.reject("NO_PERMISSION", "Usage stats permission not granted");
                return;
            }

            UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            
            // Get stats for today
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();

            Map<String, UsageStats> statsMap = usageStatsManager.queryAndAggregateUsageStats(
                    startTime, endTime);

            WritableMap result = Arguments.createMap();
            WritableArray appsArray = Arguments.createArray();
            
            long totalScreenTime = 0;
            PackageManager packageManager = reactContext.getPackageManager();

            for (Map.Entry<String, UsageStats> entry : statsMap.entrySet()) {
                UsageStats stats = entry.getValue();
                
                if (stats.getTotalTimeInForeground() > 0) {
                    totalScreenTime += stats.getTotalTimeInForeground();
                    
                    try {
                        ApplicationInfo appInfo = packageManager.getApplicationInfo(stats.getPackageName(), 0);
                        String appName = packageManager.getApplicationLabel(appInfo).toString();
                        
                        WritableMap appData = Arguments.createMap();
                        appData.putString("packageName", stats.getPackageName());
                        appData.putString("appName", appName);
                        appData.putDouble("timeInForeground", stats.getTotalTimeInForeground());
                        appData.putDouble("lastTimeUsed", stats.getLastTimeUsed());
                        appData.putInt("launchCount", stats.getLastTimeUsed() > startTime ? 1 : 0); // Simplified
                        
                        appsArray.pushMap(appData);
                    } catch (PackageManager.NameNotFoundException e) {
                        // App might be uninstalled, skip it
                    }
                }
            }

            result.putDouble("totalScreenTime", totalScreenTime);
            result.putInt("pickups", 0); // Would need additional implementation
            result.putInt("notifications", 0); // Would need additional implementation
            result.putArray("apps", appsArray);

            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("USAGE_STATS_ERROR", e.getMessage(), e);
        }
    }
}
