# EAS / Standalone APK Build Guide

This document explains how to produce a standalone Android APK/AAB for Kigen (Inzone) and lists native modules and configuration you must verify before building. Follow these steps to avoid runtime errors like "View config not found for component BVLinearGradient".

## Quick build steps (recommended: EAS Build)

1. Install EAS CLI (if not installed):

```powershell
npm i -g eas-cli
```

2. Login and configure

```powershell
eas login
# follow prompts
```

3. Ensure `app.json`/`eas.json` is configured for your release. We use `expo` SDK 54 in this repo. If you modified native modules, run `expo prebuild` or use EAS prebuild.

4. Build for Android (AAB recommended):

```powershell
# Use a production profile in eas.json or the default
eas build -p android --profile production
```

5. Download/install the built artifact and test on device.

## Native modules checklist

The following packages require native code and must be included in the build. With EAS they’re picked up automatically; if you prebuild or use bare RN, follow the manual install steps.

- `react-native-reanimated` (v4): requires `react-native-reanimated/plugin` in `babel.config.js` and a native rebuild.
- `expo-notifications`: requires manifest and permission configuration on Android; configure notification channels on app start.
- `expo-task-manager` / `expo-background-task`: background tasks need proper Android service configuration and may require additional manifest entries.
- `react-native-device-info`: native install required for bare RN (EAS will include it).
- `react-native-vector-icons`: included in builds, fonts must be linked (expo handles this).
- `react-native-svg`: native library used by SVG components.
- `expo-linear-gradient`: included for gradients (preferred in Expo-managed apps).
- `react-native-linear-gradient`: REMOVED from this repo; do not use in Expo-managed builds. If you still need it in a bare workflow, install and rebuild natively.

## Common gotchas and fixes

- "View config not found for component BVLinearGradient": Replace `react-native-linear-gradient` with `expo-linear-gradient` or install and rebuild native code. This repo has switched to `expo-linear-gradient`.
- Reanimated crashes: ensure `react-native-reanimated/plugin` is installed in `babel.config.js` (already added) and that Hermes is configured if using it.
- Notifications not working in standalone: configure channels and request runtime permissions on start.
- Background tasks: verify `expo-task-manager` registration and that the Android manifest contains required services.

## Local testing

- Running in Expo Go will surface most JS errors but not missing native modules. For a full verification, build a local dev client or a production build via EAS:

```powershell
# dev client (prebuilds native code for dev)
eas build -p android --profile development --local
# or production build
eas build -p android --profile production
```

## Files to inspect when adding new native features

- `android/app/src/main/AndroidManifest.xml` (if prebuilding or on bare RN)
- `ios/` Podfile and Info.plist
- `app.json` / `eas.json` for build profiles
- `babel.config.js` for reanimated plugin

## Post-build verification

1. Install the AAB/APK on a device.
2. Run through screens that use gradients, notifications, background tasks, SVGs, reanimated animations.
3. Monitor device logs (`adb logcat`) for native errors.

## Summary

- Use `expo-linear-gradient` for Expo-managed builds.
- Build with EAS after changing native modules.
- Keep `babel.config.js` updated for Reanimated.

If you want, I can:
- Remove `react-native-linear-gradient` entirely from the repo (I already removed it from package.json but can also delete any leftover imports — there are none).
- Add an `eas.json` sample or CI config to automate builds.
- Add an automated smoke test script to run within a dev-client that verifies gradient and reanimated screens.
