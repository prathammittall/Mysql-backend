# Eventix MySQL Backend

A Node.js backend application for Eventix using MySQL database.

## Features

- **User Management**: Registration, login, authentication with JWT
- **Event Management**: Create, read, update, delete events
- **Profile Management**: User profiles with skills and education
- **Team Registration**: Team-based event registration system
- **Staff Appointments**: Appointment booking system for staff
- **Club Management**: Club creation and approval system
- **File Upload**: Image upload with Cloudinary integration
- **Email Service**: Email notifications with Resend and Nodemailer

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Email**: Resend API + Nodemailer
- **AI Integration**: Google Gemini AI (for poster generation)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- NPM or Yarn

## Installation

1. Clone the repository:
```bash
cd "mysql backend"
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and update the values:
     - `DB_HOST`: MySQL host (default: localhost)
     - `DB_PORT`: MySQL port (default: 3306)
     - `DB_USER`: MySQL username (default: root)
     - `DB_PASSWORD`: Your MySQL password
     - `DB_NAME`: Database name (default: eventix)
     - Other API keys and secrets as needed

4. Set up the database:
```bash
# Login to MySQL
mysql -u root -p

# Run the database.sql script
source database.sql

# Or use the npm script (if mysql is in PATH)
npm run db:setup
```

## Database Schema

The application uses the following main tables:
- **users**: User accounts and authentication
- **profiles**: User profile information
- **events**: Event details and management
- **clubs**: Club information and approval status
- **team_registrations**: Team-based event registrations
- **team_members**: Individual team member details
- **staff**: Staff member information
- **time_slots**: Available appointment slots
- **appointments**: Appointment bookings
- **event_attendance**: Event attendance tracking

See `database.sql` for complete schema definition.

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh access token

### Users
- `GET /api/v1/users/current-user` - Get current user
- `PATCH /api/v1/users/update-account` - Update account details
- `POST /api/v1/users/change-password` - Change password
- `GET /api/v1/users/all` - Get all users (Admin only)

### Events
- `GET /api/v1/admin/events` - Get all events
- `GET /api/v1/admin/events/:id` - Get event by ID
- `POST /api/v1/admin/events` - Create event (Admin only)
- `PATCH /api/v1/admin/events/:id` - Update event (Admin only)
- `DELETE /api/v1/admin/events/:id` - Delete event (Admin only)
- `GET /api/v1/admin/events/search` - Search events

### Profiles
- `POST /api/v1/profile` - Create profile
- `GET /api/v1/profile` - Get user profile
- `PATCH /api/v1/profile` - Update profile
- `DELETE /api/v1/profile` - Delete profile
- `GET /api/v1/profile/:username` - Get profile by username
- `GET /api/v1/profile/all/profiles` - Get all profiles (Admin only)

### Other Routes
- `/api/v1/organiser` - Organiser management
- `/api/v1/registerEvent` - Event registration
- `/api/v1/team` - Team management
- `/api/v1/poster` - Poster generation
- `/api/v1/email` - Email services
- `/api/v1/staff` - Staff management
- `/api/v1/appointments` - Appointment booking

## Project Structure

```
mysql backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection configuration
│   ├── controllers/
│   │   ├── user.controller.js   # User management logic
│   │   ├── event.controller.js  # Event management logic
│   │   └── profile.controller.js # Profile management logic
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Authentication middleware
│   │   └── multer.middleware.js # File upload middleware
│   ├── routes/
│   │   ├── user.route.js        # User routes
│   │   ├── event.route.js       # Event routes
│   │   └── profile.route.js     # Profile routes
│   ├── utils/
│   │   ├── ApiError.js          # Error handling utility
│   │   ├── ApiResponse.js       # Response formatting utility
│   │   ├── asyncHandler.js      # Async error handler
│   │   ├── jwt.js               # JWT utilities
│   │   ├── cloudinary.js        # Cloudinary integration
│   │   └── emailService.js      # Email service
│   ├── app.js                   # Express app configuration
│   └── index.js                 # Application entry point
├── public/
│   └── temp/                    # Temporary file storage
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── database.sql                 # Database schema
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Environment Variables

Required environment variables:

```env
# Server
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eventix

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d

# Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=your_email
AUTH_EMAIL=your_gmail
AUTH_PASS=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
GEMINI_API_KEY=your_gemini_key
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies
- CORS configuration
- Input validation
- SQL injection prevention with parameterized queries
- File upload restrictions

## Error Handling

The application uses a centralized error handling system:
- Custom `ApiError` class for consistent error responses
- `asyncHandler` wrapper for async route handlers
- Global error middleware for unhandled errors

## Development

### Code Style
- ES6+ JavaScript
- ESM modules (import/export)
- Async/await for asynchronous operations

### Testing
- Test endpoints using Postman or similar tools
- Check `/health` endpoint for server status

## Deployment

1. Set `NODE_ENV=production` in environment variables
2. Update database credentials for production
3. Configure proper CORS origins
4. Use a process manager like PM2:
```bash
pm2 start src/index.js --name eventix-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
