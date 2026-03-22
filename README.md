# AcadIntern

A comprehensive platform connecting students with internship opportunities, featuring application tracking, messaging, and analytics for students, companies, and administrators.

## Project Structure

- **backend/**: Express.js REST API server
- **frontend/**: Next.js web application
- **mobile/**: Flutter student mobile application
- **system_Architecture**: System architecture documentation
- **TEST_CREDENTIALS.md**: Test credentials documentation
- **TRACK_TASKS.md**: Task tracking documentation
- **PASSWORD_RESET_FEATURE.md**: Complete password reset documentation
- **PASSWORD_RESET_QUICKSTART.md**: Quick start guide for password reset

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + HTTP-only cookies
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **File Uploads**: Cloudflare R2 (via AWS SDK)

#### CI/CD
This project uses GitHub Actions for continuous integration.

### Frontend
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS (assumed from postcss.config.mjs)
- **UI Components**: Custom components with shadcn/ui (from components.json)

### Mobile
- **Framework**: Flutter
- **Language**: Dart
- **Navigation**: go_router
- **State Management**: flutter_riverpod

#### Mobile runtime variables and recommended commands

- Recommended `--dart-define` values:
  - `API_BASE_URL` (defaults to Render URL if omitted)
  - `SOCKET_BASE_URL` (defaults to Render URL if omitted)
  - `FRONTEND_BASE_URL` (used for shared internship links)
  - `GOOGLE_SERVER_CLIENT_ID` (Google OAuth Web client ID, required for Google Sign-In ID token)
  - `MOBILE_DEEP_LINK_BASE` (defaults to `acadintern://auth` if omitted)

Example local run:

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

#### Mobile Notes

- Uploads are backend-mediated through `/api/upload`.
- Session auth uses bearer tokens stored in secure storage.
- Rotated bearer tokens are read from the `X-Auth-Token` response header.
- Android and iOS wrappers are already generated in this folder.
- For push notifications and Google sign-in native setup, see `mobile/FIREBASE_SETUP.md`.
- Keep `env.local.json` local (ignored in git).

#### Universal Links / App Links

- Android app links are configured for:
  - `https://acadintern.mathi.live`
  - `https://acadintern.in`
- iOS associated domains are configured for the same domains in `Runner.entitlements`.
- Your web domain must host platform association files for verification:
  - `https://<domain>/.well-known/assetlinks.json` (Android)
  - `https://<domain>/.well-known/apple-app-site-association` (iOS)

#### Launch Screen Assets

You can customize the launch screen with your own desired assets by replacing the image files in `mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset`.
Or open the Flutter Xcode workspace with `open ios/Runner.xcworkspace`, select `Runner/Assets.xcassets` in the Project Navigator and drop in the desired images.

## Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Cloudflare R2 account (for file uploads)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AcadIntern
```

2. Install dependencies for both backend and frontend:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mobile && flutter pub get && cd ..
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
   - MongoDB Atlas connection string
   - JWT secret key
   - Cloudflare R2 credentials (account ID, access key, secret, bucket name, public URL)

4. Run development server:
```bash
npm run dev
```

The backend server will start on `http://localhost:5000` (or configured port).

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Mobile Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install Flutter dependencies:
```bash
flutter pub get
```

3. Run on Android emulator/device:
```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:5000/api \
  --dart-define=SOCKET_BASE_URL=http://10.0.2.2:5000 \
  --dart-define=GOOGLE_CLIENT_ID_ANDROID=<google-client-id> \
  --dart-define=MOBILE_DEEP_LINK_BASE=acadintern://auth
```

4. For Firebase native files and push setup, see `mobile/FIREBASE_SETUP.md`.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/reset-password/:token` - Verify reset token
- `POST /api/auth/reset-password/:token` - Reset password

### Internships
- `GET /api/internships` - List internships
- `POST /api/internships` - Create internship (company)
- `PUT /api/internships/:id` - Update internship
- `DELETE /api/internships/:id` - Delete internship

### Applications
- `POST /api/internships/:id/apply` - Apply to internship
- `GET /api/applications/my` - Get my applications
- `PATCH /api/applications/:id/status` - Update application status

### Other Endpoints
- Companies, Messages, Notifications, Reports, Students, Admin routes available

## Development

### Running Tests
```bash
cd backend
npm test
```

### Building for Production
```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
