# AcadIntern Student Mobile

Flutter student app that shares the existing `backend/` API and data model.

## Recommended `--dart-define` values

- `API_BASE_URL` (defaults to Render URL if omitted)
- `SOCKET_BASE_URL` (defaults to Render URL if omitted)
- `FRONTEND_BASE_URL` (used for shared internship links)
- `GOOGLE_SERVER_CLIENT_ID` (Google OAuth Web client ID, required for Google Sign-In ID token)
- `MOBILE_DEEP_LINK_BASE` (defaults to `acadintern://auth` if omitted)

Example:

```bash
flutter run \
  --dart-define=API_BASE_URL=https://your-render-backend.onrender.com/api \
  --dart-define=SOCKET_BASE_URL=https://your-render-backend.onrender.com \
  --dart-define=FRONTEND_BASE_URL=https://acadintern.mathi.live \
  --dart-define=GOOGLE_SERVER_CLIENT_ID=your-web-client-id.apps.googleusercontent.com \
  --dart-define=MOBILE_DEEP_LINK_BASE=acadintern://auth
```

Recommended for team workflows:

```bash
cp env.example.json env.local.json
flutter run --dart-define-from-file=env.local.json
flutter build apk --release --dart-define-from-file=env.local.json
```

## Notes

- Uploads are backend-mediated through `/api/upload`.
- Session auth uses bearer tokens stored in secure storage.
- Rotated bearer tokens are read from the `X-Auth-Token` response header.
- Android and iOS wrappers are already generated in this folder.
- For push notifications and Google sign-in native setup, see `FIREBASE_SETUP.md`.
- Keep `env.local.json` local (ignored in git).

## Universal Links / App Links

- Android app links are configured for:
  - `https://acadintern.mathi.live`
  - `https://acadintern.in`
- iOS associated domains are configured for the same domains in `Runner.entitlements`.
- Your web domain must host platform association files for verification:
  - `https://<domain>/.well-known/assetlinks.json` (Android)
  - `https://<domain>/.well-known/apple-app-site-association` (iOS)
