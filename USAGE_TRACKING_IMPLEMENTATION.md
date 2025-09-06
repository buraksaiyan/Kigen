# Android Usage Access Implementation

This implementation provides real Android usage access permissions and statistics for the Kigen app, following Android's special permissions guidelines.

## Overview

We've implemented a comprehensive solution that:
1. **Follows Android Best Practices**: Implements special permissions workflow as per Android documentation
2. **Works in Standalone Apps**: Full native implementation with Java modules
3. **Graceful Expo Go Fallback**: Demo mode for development in Expo Go
4. **Real Usage Statistics**: Accesses actual app usage data from Android's UsageStatsManager
5. **App Icons**: Fetches real app icons for better UI

## Architecture

### Native Layer (`android/`)
- **UsageStatsModule.java**: Main native module implementing Android's special permissions
- **UsageStatsPackage.java**: React Native package registration
- **MainActivity.java & MainApplication.java**: Standard React Native Android setup
- **AndroidManifest.xml**: Declares PACKAGE_USAGE_STATS permission

### Service Layer (`src/services/`)
- **digitalWellbeingService.ts**: High-level service following Android guidelines
- **nativeUsageTracker.ts**: Direct native module interface with fallbacks
- **UsageStatsNative.ts**: TypeScript interface for native module

### UI Layer (`src/components/`)
- **DigitalWellbeing.tsx**: Updated to use new service with app icons support

## Key Features

### 1. Proper Permission Handling
- **Rationale First**: Shows clear explanation before requesting permission
- **Multiple Methods**: Tries various ways to open usage access settings
- **Auto-Detection**: Monitors app state to detect when permission is granted
- **User Guidance**: Clear instructions throughout the process

### 2. Real Usage Statistics
- **Today's Stats**: Gets comprehensive daily usage data
- **Date Ranges**: Supports custom time period queries
- **App Details**: Package names, display names, usage time, launch counts
- **Icons**: Fetches actual app icons as base64 for display

### 3. Android Integration
- **UsageStatsManager**: Direct access to Android's usage statistics API
- **PackageManager**: Gets app names and icons
- **Special Permissions**: Follows Android's special permission workflow
- **Content Providers**: Ready for Digital Wellbeing integration (when possible)

## Usage

### In Standalone App:
1. App requests usage access permission following Android guidelines
2. User grants permission in Android settings
3. App gets real usage statistics from system
4. Displays actual screen time and app usage with real icons

### In Expo Go (Development):
1. Demo mode available for development
2. Shows sample data structure
3. Permission flow works but uses fallback data
4. All UI components work as intended

## Android Permissions

The app requests `PACKAGE_USAGE_STATS` permission which is a special permission that:
- Requires user to manually grant in Settings > Apps > Special app access > Usage access
- Cannot be requested via runtime permission dialog
- Is considered sensitive system access
- Must follow Android's special permission workflow

## Files Created/Modified

### New Android Files:
- `android/app/src/main/java/com/kigen/UsageStatsModule.java`
- `android/app/src/main/java/com/kigen/UsageStatsPackage.java`
- `android/app/src/main/java/com/kigen/MainActivity.java`
- `android/app/src/main/java/com/kigen/MainApplication.java`
- `android/app/src/main/AndroidManifest.xml`
- `android/build.gradle`
- `android/app/build.gradle`
- `android/gradle.properties`
- `android/gradle/wrapper/gradle-wrapper.properties`

### New Service Files:
- `src/services/digitalWellbeingService.ts`

### Modified Files:
- `src/modules/UsageStatsNative.ts` (updated interface)
- `src/services/nativeUsageTracker.ts` (new methods)
- `src/components/DigitalWellbeing.tsx` (app icons support)

## Building Standalone App

To test the real usage access functionality:

1. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

2. **Install on Device:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Grant Permission:**
   - Open Settings > Apps > Special app access > Usage access
   - Find "Kigen" and enable usage access
   - Return to app to see real data

## Digital Wellbeing Integration

The implementation is ready for Digital Wellbeing integration:
- Placeholder methods for checking Digital Wellbeing availability
- Framework for content provider access
- Comprehensive data structure compatible with system APIs

Future enhancement could add direct integration with Google's Digital Wellbeing app when APIs become available.

## Development Notes

- **Expo Go Limitations**: Cannot access usage stats, shows demo data
- **Standalone Required**: Full functionality only works in built APK
- **Android Only**: iOS doesn't provide public Screen Time APIs
- **Permission Required**: Must be manually granted by user in system settings

This implementation provides a production-ready foundation for Digital Wellbeing features in Android standalone apps while maintaining development-friendly fallbacks for Expo Go.
