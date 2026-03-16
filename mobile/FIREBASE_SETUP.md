# Firebase Setup (Android-first, iOS-ready)

## Android

1. Create/select your Firebase project.
2. Add an Android app with package name:
   - `mathi.acadintern.app`
3. Download `google-services.json`.
4. Place it at:
   - `mobile/android/app/google-services.json`
5. Re-run:
   - `flutter pub get`
   - `flutter run`

`android/app/build.gradle.kts` conditionally applies the Google Services plugin only when `google-services.json` exists, so local builds still work without Firebase.

## iOS (ready for later)

1. Add an iOS app in Firebase with the bundle identifier from Xcode project settings.
2. Download `GoogleService-Info.plist`.
3. Place it at:
   - `mobile/ios/Runner/GoogleService-Info.plist`
4. Enable Push Notifications + Background Modes in Xcode before shipping iOS push.

## Backend requirements

Set one of the following in `backend/.env` for server-side push delivery:

- `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string), or
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

The mobile app registers FCM tokens with:

- `POST /api/mobile/devices`
- `DELETE /api/mobile/devices`
