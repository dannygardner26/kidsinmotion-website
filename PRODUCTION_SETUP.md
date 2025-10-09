# Kids in Motion - Production Setup Guide

## 🚀 Production Deployment Checklist

### 1. Environment Configuration

#### Frontend Environment Variables
Create `.env.production` in the frontend directory with your production values:

```bash
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_production_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_production_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_production_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
REACT_APP_FIREBASE_APP_ID=your_production_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_production_measurement_id
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENVIRONMENT=production
```

#### Backend Environment Variables
Set these environment variables on your production server:

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=production

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=kidsinmotion
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json

# Server Configuration
PORT=8080
```

### 2. Database Setup

#### PostgreSQL Installation and Configuration
1. Install PostgreSQL on your production server
2. Create database and user:
```sql
CREATE DATABASE kidsinmotion;
CREATE USER kidsinmotion WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE kidsinmotion TO kidsinmotion;
```

#### Database Migration
1. Set `spring.jpa.hibernate.ddl-auto=create` for initial deployment
2. After first run, change to `spring.jpa.hibernate.ddl-auto=validate`
3. For future updates, use proper database migration tools

### 3. Firebase Setup

#### Service Account Configuration
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Download the JSON file
4. Store the JSON securely (NOT in the repository). For Google Cloud Run deployments, create a Secret Manager secret named `firebase-service-account` containing the JSON and grant the Cloud Run service account `Secret Manager Secret Accessor`.
5. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the JSON file. When using Cloud Run, the deployment pipeline mounts the secret at `/var/secrets/google/firebase-service-account.json` automatically.

#### Firebase Authentication Rules
Ensure your Firebase project has proper authentication rules configured.

### 4. SSL/HTTPS Configuration

#### Frontend (if self-hosting)
Configure your web server (nginx/Apache) to serve HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Backend SSL
For production, consider running behind a reverse proxy with SSL termination.

### 5. Security Considerations

#### CORS Configuration
- Update `cors.allowed.origins` to your actual domain
- Never use `*` in production

#### Environment Variables
- Never commit sensitive data to Git
- Use proper secret management
- Rotate credentials regularly

#### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups

### 6. Performance Optimization

#### Frontend Bundle Optimization
```bash
# Build for production with optimization
npm run build

# Consider code splitting for large applications
# Implement lazy loading for routes
```

#### Backend Performance
- Configure proper connection pooling
- Enable response compression
- Implement caching where appropriate
- Monitor memory usage

### 7. Monitoring and Logging

#### Application Health
- Use Spring Boot Actuator endpoints
- Monitor `/actuator/health`
- Set up alerts for downtime

#### Logging
- Configure proper log rotation
- Use centralized logging (ELK stack, etc.)
- Monitor error rates

### 8. Backup Strategy

#### Database Backups
```bash
# Daily backup script
pg_dump -U kidsinmotion -h localhost kidsinmotion > backup_$(date +%Y%m%d).sql
```

#### Application Backups
- Regular code repository backups
- Configuration backups
- Media/upload file backups

### 9. Deployment Process

#### Backend Deployment
```bash
# Build the application
./gradlew build

# Run with production profile
java -jar -Dspring.profiles.active=production build/libs/rest-service-0.0.1-SNAPSHOT.jar
```

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your web server
rsync -av build/ user@server:/var/www/html/
```

### 10. Post-Deployment Verification

#### Health Checks
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Database connections work
- [ ] Authentication works
- [ ] Admin functions accessible
- [ ] User registration works
- [ ] Event creation/management works

#### Performance Checks
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Database query performance
- [ ] Memory usage within limits

## 🔒 Security Checklist

- [ ] All secrets moved to environment variables
- [ ] HTTPS enabled
- [ ] Firebase security rules configured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Input validation in place
- [ ] Error messages don't expose sensitive data
- [ ] Regular security updates applied

## 📊 Monitoring Checklist

- [ ] Application logs configured
- [ ] Error tracking set up
- [ ] Performance monitoring in place
- [ ] Uptime monitoring configured
- [ ] Database monitoring enabled
- [ ] Backup procedures tested

## 🚨 Incident Response

1. **Application Down**: Check server status, logs, database connectivity
2. **Database Issues**: Check disk space, connections, recent queries
3. **Authentication Problems**: Verify Firebase configuration and service account
4. **Performance Issues**: Check resource usage, slow queries, network latency

Remember: This is a comprehensive checklist for production deployment. Some items may not apply to your specific infrastructure setup.
