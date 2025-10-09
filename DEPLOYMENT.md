# Kids in Motion - Deployment Guide

## Production Deployment Setup

### Admin Configuration

The application now automatically assigns admin roles to specified email addresses. Users who register with these emails will automatically receive both USER and ADMIN roles.

### Configuration

#### Backend Configuration

**Environment Variables for Production:**

```bash
# Admin emails (comma-separated)
ADMIN_EMAILS=kidsinmotion0@gmail.com,admin@example.com,danny@example.com

# Database (for platforms like Heroku, Railway, etc.)
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=kidsinmotion
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Firebase (upload your service account JSON)
# When deploying to Cloud Run, store the JSON in Secret Manager as `firebase-service-account`; the pipeline mounts it at /var/secrets/google/firebase-service-account.json.
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json

# Server
PORT=8080
SPRING_PROFILES_ACTIVE=production

# CORS (your frontend domain)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

#### Frontend Configuration

Update the frontend environment variables:

```bash
# .env.production
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### Deployment Platforms

#### Option 1: Heroku

**Backend:**
1. Install Heroku CLI
2. Create Heroku app: `heroku create kidsinmotion-api`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
4. Set environment variables:
   ```bash
   heroku config:set ADMIN_EMAILS="kidsinmotion0@gmail.com,admin@example.com"
   heroku config:set SPRING_PROFILES_ACTIVE=production
   ```
5. Upload Firebase service account JSON as config var
6. Deploy: `git push heroku main`

**Frontend:**
1. Build for production: `npm run build`
2. Deploy to Netlify/Vercel or Heroku static

#### Option 2: Railway

**Backend:**
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway automatically detects Spring Boot and deploys

**Frontend:**
1. Deploy to Netlify or Vercel with environment variables

#### Option 3: DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure environment variables
3. Set up managed PostgreSQL database
4. Deploy both frontend and backend

### Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project: "Kids in Motion"

2. **Enable Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (optional)

3. **Generate Service Account:**
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file
   - Upload to your hosting platform or set as environment variable

4. **Configure Firebase Storage:**
   - Go to Storage → Get Started
   - Set up security rules for public read access to images

### Database Setup

**For Production (PostgreSQL):**

1. Create database named `kidsinmotion`
2. The application will automatically create tables on first run
3. Admin users will be automatically created when they first sign up

### Testing Admin Access

1. Deploy the application
2. Register a new account using one of the admin emails configured in `ADMIN_EMAILS`
3. The user will automatically receive admin privileges
4. Access admin features at `/admin` route

### Security Checklist

- [ ] Set up HTTPS for both frontend and backend
- [ ] Configure CORS to only allow your frontend domain
- [ ] Set secure cookie settings in production
- [ ] Use environment variables for all sensitive data
- [ ] Set up database backups
- [ ] Configure proper Firebase security rules
- [ ] Set up monitoring and logging

### Admin Management

**To add new admin users:**
1. Update the `ADMIN_EMAILS` environment variable
2. Restart the application
3. New users registering with those emails will automatically get admin access

**To remove admin access:**
1. Remove email from `ADMIN_EMAILS` environment variable
2. Manually update the database to remove admin role from existing users if needed

### Monitoring

Consider setting up:
- Application monitoring (e.g., New Relic, DataDog)
- Database monitoring
- Log aggregation (e.g., LogDNA, Papertrail)
- Uptime monitoring (e.g., Pingdom, UptimeRobot)

## Local Development

For local development, the admin emails are configured in `application.properties`:

```properties
app.admin.emails=kidsinmotion0@gmail.com,danny@example.com,admin@kidsinmotion.org
```

You can modify this list and restart the application to test admin functionality locally.
