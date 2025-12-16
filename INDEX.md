# 📚 Eventix MySQL Backend - Documentation Index

Welcome to the Eventix MySQL Backend! This is your complete guide to understanding and using the system.

## 🎯 Start Here

**New to the project?** Follow this order:

1. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** ⭐ START HERE
   - Quick overview of what's been created
   - Complete file structure
   - Features list
   - Technologies used

2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** 🚀 ESSENTIAL
   - One-page quick start guide
   - Essential commands
   - Common queries
   - Troubleshooting

3. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** 📖 DETAILED SETUP
   - Step-by-step installation
   - Database configuration
   - Testing instructions
   - Troubleshooting details

## 📁 Core Documentation

### Getting Started
- **[README.md](README.md)** - Full project documentation
  - Features overview
  - Tech stack details
  - API endpoints
  - Project structure
  - Deployment guide

### Architecture & Design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
  - Visual diagrams
  - Request flow
  - Database relationships
  - Authentication flow
  - Security layers

### Migration & Comparison
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Prisma to MySQL
  - Key differences
  - Code comparisons
  - Migration steps
  - Performance considerations
  - When to use each backend

## 🗄️ Database

### Schema
- **[database.sql](database.sql)** - Complete database schema
  - 15 tables with comments
  - Foreign key relationships
  - Indexes for performance
  - Sample data (commented)

### Tables Overview

#### Authentication & Users
- `users` - User accounts
- `user_otp_verification` - OTP verification
- `profiles` - Extended user information

#### Events
- `events` - Event listings
- `pending_verification_events` - Events awaiting approval
- `event_attendance` - Attendance tracking

#### Clubs
- `clubs` - Club information
- `pending_club_approvals` - Club approval workflow

#### Teams
- `team_registrations` - Team registrations
- `team_members` - Team member details
- `confirmation_tokens` - Email confirmation tokens

#### Staff & Appointments
- `staff` - Staff accounts
- `staff_otp_verification` - Staff OTP verification
- `time_slots` - Available appointment slots
- `appointments` - Appointment bookings

## 🔧 Configuration

### Environment Variables
See **[.env](.env)** - Environment configuration
- Database credentials (UPDATE DB_PASSWORD!)
- JWT secrets
- Email service keys
- Cloudinary credentials
- AI API keys

### Dependencies
See **[package.json](package.json)** - Node.js dependencies
- Express.js v5
- mysql2
- bcrypt
- jsonwebtoken
- cloudinary
- resend
- multer
- and more...

## 📂 Source Code

### Entry Points
- **[src/index.js](src/index.js)** - Application entry point
- **[src/app.js](src/app.js)** - Express configuration

### Configuration
- **[src/config/database.js](src/config/database.js)** - MySQL connection pool

### Controllers (Business Logic)
- **[src/controllers/user.controller.js](src/controllers/user.controller.js)**
  - User registration, login, logout
  - Password management
  - Token refresh
  
- **[src/controllers/event.controller.js](src/controllers/event.controller.js)**
  - Event CRUD operations
  - Search functionality
  
- **[src/controllers/profile.controller.js](src/controllers/profile.controller.js)**
  - Profile management
  
- **[src/controllers/organiser.controller.js](src/controllers/organiser.controller.js)**
  - Club management
  - Approval workflow
  
- **[src/controllers/team.controller.js](src/controllers/team.controller.js)**
  - Team registration
  - Member confirmation
  
- **[src/controllers/staff.controller.js](src/controllers/staff.controller.js)**
  - Staff OTP login
  - Staff management
  
- **[src/controllers/appointment.controller.js](src/controllers/appointment.controller.js)**
  - Appointment booking
  - Time slot management
  
- **[src/controllers/poster.controller.js](src/controllers/poster.controller.js)**
  - AI poster suggestions
  - Tagline generation
  
- **[src/controllers/email.controller.js](src/controllers/email.controller.js)**
  - Email sending
  - Event reminders

- **[src/controllers/registerEvents.controller.js](src/controllers/registerEvents.controller.js)**
  - Event registration
  - Registration management

### Middlewares
- **[src/middlewares/auth.middleware.js](src/middlewares/auth.middleware.js)**
  - JWT verification
  - Role-based access control
  - User/Admin/Club/Staff authentication
  
- **[src/middlewares/multer.middleware.js](src/middlewares/multer.middleware.js)**
  - File upload handling
  - Image validation

### Routes
- **[src/routes/user.route.js](src/routes/user.route.js)** - User endpoints
- **[src/routes/event.route.js](src/routes/event.route.js)** - Event endpoints
- **[src/routes/profile.route.js](src/routes/profile.route.js)** - Profile endpoints
- **[src/routes/organiser.route.js](src/routes/organiser.route.js)** - Organiser endpoints
- **[src/routes/team.route.js](src/routes/team.route.js)** - Team endpoints
- **[src/routes/staff.route.js](src/routes/staff.route.js)** - Staff endpoints
- **[src/routes/appointment.route.js](src/routes/appointment.route.js)** - Appointment endpoints
- **[src/routes/poster.route.js](src/routes/poster.route.js)** - Poster endpoints
- **[src/routes/email.route.js](src/routes/email.route.js)** - Email endpoints
- **[src/routes/registerEvents.route.js](src/routes/registerEvents.route.js)** - Registration endpoints

### Utilities
- **[src/utils/ApiError.js](src/utils/ApiError.js)** - Error handling class
- **[src/utils/ApiResponse.js](src/utils/ApiResponse.js)** - Response formatting
- **[src/utils/asyncHandler.js](src/utils/asyncHandler.js)** - Async error wrapper
- **[src/utils/jwt.js](src/utils/jwt.js)** - JWT token utilities
- **[src/utils/cloudinary.js](src/utils/cloudinary.js)** - Image upload service
- **[src/utils/emailService.js](src/utils/emailService.js)** - Email sending service

## 🚀 Quick Actions

### Setup & Installation
```bash
# Quick setup
cd "mysql backend"
npm install
mysql -u root -p < database.sql
# Edit .env (set DB_PASSWORD)
npm run dev
```

### Testing
```bash
# Health check
curl http://localhost:8000/health

# See QUICK_REFERENCE.md for more test commands
```

### Database Management
```bash
# Login to MySQL
mysql -u root -p

# Use database
USE eventix;

# Show tables
SHOW TABLES;

# See table structure
DESCRIBE users;

# See QUICK_REFERENCE.md for common queries
```

## 📊 API Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints Overview

**Authentication**
- POST `/users/register`
- POST `/users/login`
- POST `/users/logout`
- POST `/users/refresh-token`

**Events**
- GET/POST/PATCH/DELETE `/admin/events`

**Profiles**
- GET/POST/PATCH `/profile`

**Teams**
- POST `/team`
- GET `/team/:id`

**Appointments**
- POST `/appointments`
- GET `/appointments/user`

See **[README.md](README.md)** for complete endpoint documentation.

## 🔍 Finding Information

### Need to...

**Understand the project?**
→ Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**Set up the backend?**
→ Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Quick command reference?**
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Understand architecture?**
→ Read [ARCHITECTURE.md](ARCHITECTURE.md)

**Compare with Prisma?**
→ Read [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

**Troubleshoot issues?**
→ Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section

**API documentation?**
→ Read [README.md](README.md) API section

**Database schema?**
→ Review [database.sql](database.sql)

**Modify code?**
→ Check controller/route files in [src/](src/)

## 🎓 Learning Path

### Beginner
1. Read PROJECT_SUMMARY.md
2. Follow SETUP_GUIDE.md
3. Test with QUICK_REFERENCE.md commands
4. Explore README.md

### Intermediate
1. Study ARCHITECTURE.md
2. Review controller code
3. Understand authentication flow
4. Modify and extend features

### Advanced
1. Read MIGRATION_GUIDE.md
2. Optimize database queries
3. Implement new features
4. Deploy to production

## 🛠️ Development Tools

### Recommended
- **MySQL Workbench** - Database management
- **Postman** - API testing
- **VS Code** - Code editing
- **Git** - Version control

### Useful Commands
```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# Database backup
mysqldump -u root -p eventix > backup.sql
```

## 📞 Support & Resources

### Documentation Files
- 📄 All .md files in this directory
- 📄 Code comments in source files
- 📄 SQL comments in database.sql

### External Resources
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Documentation](https://jwt.io/)

## ✅ Checklist

Before starting development:
- [ ] Read PROJECT_SUMMARY.md
- [ ] Read QUICK_REFERENCE.md
- [ ] MySQL installed
- [ ] Node.js installed
- [ ] Database created (ran database.sql)
- [ ] .env configured
- [ ] Dependencies installed (npm install)
- [ ] Server starts successfully
- [ ] Health check passes

## 🎯 Next Steps

1. **Setup**: Follow SETUP_GUIDE.md
2. **Test**: Use QUICK_REFERENCE.md commands
3. **Develop**: Modify controllers/routes as needed
4. **Deploy**: Follow README.md deployment section

## 📝 Notes

- All API endpoints maintain compatibility with frontend
- JWT authentication is fully implemented
- Database has proper indexes and foreign keys
- Error handling is comprehensive
- File uploads work with Cloudinary
- Email service is configured

---

**Everything you need is documented. Happy coding! 🚀**

**Quick Links:**
- [Project Summary](PROJECT_SUMMARY.md) ⭐
- [Quick Reference](QUICK_REFERENCE.md) 🚀
- [Setup Guide](SETUP_GUIDE.md) 📖
- [Architecture](ARCHITECTURE.md) 🏗️
- [README](README.md) 📚
