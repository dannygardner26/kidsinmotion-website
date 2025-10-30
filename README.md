# Kids in Motion - Sports Program Management System

A full-stack web application for managing children's sports programs, events, and volunteer coordination.

## Project Structure

```
KidsInMotion/
├── backend/complete/          # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/example/restservice/
│   │       ├── model/         # JPA entities
│   │       ├── repository/    # Data repositories
│   │       ├── security/      # Firebase authentication
│   │       ├── config/        # Configuration classes
│   │       └── *.java         # REST controllers
│   └── build.gradle           # Backend dependencies
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context (auth)
│   │   └── firebaseConfig.js # Firebase client config
│   └── package.json          # Frontend dependencies
└── plan.md                   # Development roadmap
```

## Features Implemented

### Backend (Spring Boot + Firebase)
✅ **Authentication System**
- Firebase Admin SDK integration
- JWT token validation
- User profile management
- Role-based access control (USER, ADMIN)

✅ **Event Management**
- CRUD operations for events
- Public event viewing
- Event capacity management
- Admin-only event creation/editing

✅ **Participant Registration**
- Child registration for events
- Registration cancellation
- Capacity checking
- Parent-child relationship management

✅ **Volunteer Management**
- Volunteer signup for events
- Role assignment and skills tracking
- Volunteer status management
- Admin oversight of volunteer activities

### Frontend (React + Firebase Auth)
✅ **Authentication**
- Email/password and Google OAuth
- Protected routes
- User profile management

✅ **Event Features**
- Browse events
- View event details
- Registration and volunteer flows

✅ **Dashboard**
- User profile overview
- Registration management
- Volunteer activity tracking

## Technology Stack

### Backend
- **Framework:** Spring Boot 3.3.0
- **Database:** H2 (development) / PostgreSQL (production)
- **Authentication:** Firebase Admin SDK
- **Build Tool:** Gradle
- **Java Version:** 17

### Frontend
- **Framework:** React 18
- **Auth:** Firebase Auth
- **Styling:** Tailwind CSS + Bootstrap
- **Build Tool:** Webpack
- **Routing:** React Router

## Setup Instructions

### Prerequisites
- Java 17+
- Node.js 16+
- Firebase project with Authentication enabled

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend/complete
   ```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Generate a service account key
   - Save as `src/main/resources/firebase-service-account.json`
   - Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

3. **Update application.properties:**
   ```properties
   # Update CORS origin for your frontend URL
   cors.allowed.origins=http://localhost:3000
   ```

4. **Run the backend:**
   ```bash
   ./gradlew bootRun
   ```
   Backend will start on http://localhost:8080

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Update `src/firebaseConfig.js` with your Firebase project config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```
   Frontend will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/sync-user` - Sync Firebase user with backend
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Events
- `GET /api/events` - List all events
- `GET /api/events/upcoming` - List upcoming events
- `GET /api/events/{id}` - Get event details
- `POST /api/events` - Create event (Admin)
- `PUT /api/events/{id}` - Update event (Admin)
- `DELETE /api/events/{id}` - Delete event (Admin)

### Participants
- `GET /api/participants/me` - Get user's registrations
- `POST /api/participants` - Register for event
- `DELETE /api/participants/{id}` - Cancel registration
- `GET /api/participants/event/{eventId}` - Get event participants (Admin)

### Volunteers
- `GET /api/volunteers/me` - Get user's volunteer signups
- `POST /api/volunteers` - Sign up as volunteer
- `DELETE /api/volunteers/{id}` - Cancel volunteer signup
- `GET /api/volunteers/event/{eventId}` - Get event volunteers (Admin)
- `PUT /api/volunteers/{id}/status` - Update volunteer status (Admin)

## User Roles and Permissions

### Guest Users
- Browse events
- View event details
- Access registration/login pages

### Authenticated Users (Parents/Volunteers)
- All guest permissions
- Register children for events
- Sign up as volunteers
- Manage their registrations and volunteer commitments
- Update profile information

### Administrators
- All user permissions
- Create/edit/delete events
- View all registrations and volunteers
- Manage volunteer statuses
- Access administrative features

## Development Status

### ✅ Completed (Phase 1)
- Firebase authentication integration
- Complete CRUD operations for all entities
- Role-based access control
- Basic frontend-backend integration

### 🔄 In Progress
- Database migration to PostgreSQL
- Admin interface development
- Frontend API integration updates

### 📋 Next Steps
1. Complete PostgreSQL setup
2. Build admin dashboard
3. Add email notifications
4. Implement testing
5. Production deployment

## Contributing

1. Follow the development plan in `plan.md`
2. Run tests before submitting changes
3. Update documentation for new features
4. Use meaningful commit messages

## License

MIT License - see LICENSE file for details