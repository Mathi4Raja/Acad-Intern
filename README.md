# AcadIntern

A comprehensive platform connecting students with internship opportunities, featuring application tracking, messaging, and analytics for students, companies, and administrators.

## Project Structure

- **backend/**: Express.js REST API server
- **frontend/**: Next.js web application
- **system_Architecture**: System architecture documentation
- **TEST_CREDENTIALS.md**: Test credentials documentation
- **TRACK_TASKS.md**: Task tracking documentation

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + HTTP-only cookies
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **File Uploads**: Cloudinary

### Frontend
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS (assumed from postcss.config.mjs)
- **UI Components**: Custom components with shadcn/ui (from components.json)

## Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Cloudinary account (for file uploads)

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
   - Cloudinary credentials (for file uploads)

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

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

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