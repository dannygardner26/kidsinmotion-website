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

### Firebase Storage CORS Configuration

To resolve CORS issues with logo images and other assets served from Firebase Storage, you need to configure CORS rules.

**Steps to configure CORS:**

1. **Install Google Cloud SDK** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Follow installation instructions for your platform

2. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   gcloud config set project kids-in-motion-website-b1c09
   ```

3. **Deploy CORS configuration:**
   ```bash
   gsutil cors set cors.json gs://kids-in-motion-website-b1c09.appspot.com
   ```

4. **Verify CORS configuration:**
   ```bash
   gsutil cors get gs://kids-in-motion-website-b1c09.appspot.com
   ```

**Troubleshooting CORS issues:**
- Ensure all your frontend domains are listed in the `cors.json` file
- Wait 5-10 minutes for CORS changes to propagate
- Clear browser cache and test again
- Check browser console for specific CORS error messages
- Verify Firebase Storage bucket name matches your project

**Common issues:**
- Missing trailing slash in bucket URL
- Incorrect project ID in bucket name
- Frontend domain not matching exactly (include/exclude www)
- Using HTTP instead of HTTPS in production

### Twilio SMS Configuration

The application supports phone number verification via SMS using Twilio. This feature is optional but recommended for enhanced security.

**Prerequisites:**
1. **Create a Twilio Account:**
   - Sign up at https://www.twilio.com/
   - Verify your account and phone number
   - Note your Account SID and Auth Token from the Console Dashboard

2. **Obtain a Twilio Phone Number:**
   - Go to Phone Numbers → Manage → Buy a number
   - Select a phone number capable of SMS (usually US numbers work best)
   - Note the phone number in E.164 format (e.g., +15551234567)

**Environment Variables Setup:**

**For Cloud Run/Production:**
```bash
# Enable SMS functionality
SMS_ENABLED=true

# Twilio credentials (store these in Google Secret Manager for Cloud Run)
TWILIO_ACCOUNT_SID=your_account_sid_from_twilio_console
TWILIO_AUTH_TOKEN=your_auth_token_from_twilio_console
TWILIO_FROM_NUMBER=+15551234567  # Your Twilio phone number in E.164 format
```

**For Local Development:**
Add to your `application.properties`:
```properties
# SMS Configuration
app.messaging.sms.enabled=true
twilio.account-sid=${TWILIO_ACCOUNT_SID:your_account_sid}
twilio.auth-token=${TWILIO_AUTH_TOKEN:your_auth_token}
twilio.from-number=${TWILIO_FROM_NUMBER:+15551234567}
```

**Cloud Run Secret Manager Setup:**
```bash
# Store Twilio credentials as secrets
gcloud secrets create twilio-account-sid --data-file=- <<< "your_account_sid"
gcloud secrets create twilio-auth-token --data-file=- <<< "your_auth_token"
gcloud secrets create twilio-from-number --data-file=- <<< "+15551234567"

# Update Cloud Run service to use secrets
gcloud run services update kidsinmotion-website \
  --update-env-vars SMS_ENABLED=true \
  --update-secrets TWILIO_ACCOUNT_SID=twilio-account-sid:latest \
  --update-secrets TWILIO_AUTH_TOKEN=twilio-auth-token:latest \
  --update-secrets TWILIO_FROM_NUMBER=twilio-from-number:latest \
  --region us-east4
```

**Testing SMS Delivery:**
1. **Test via Application:**
   - Register or login as a user
   - Go to Account Details page
   - Enter a phone number
   - Try the phone verification flow

2. **Check Twilio Console:**
   - Go to Twilio Console → Messaging → Logs
   - Verify SMS messages are being sent successfully
   - Check for any error messages or delivery failures

**Troubleshooting Common Issues:**

1. **SMS not sending:**
   - Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
   - Check Twilio Console for error logs
   - Ensure your Twilio account is not in trial mode for production use
   - Verify the FROM number is a valid Twilio phone number

2. **Phone number format issues:**
   - Ensure phone numbers are in E.164 format (+1XXXXXXXXXX for US)
   - The application normalizes US numbers automatically
   - International numbers should include proper country codes

3. **Rate limiting:**
   - Twilio has rate limits on SMS sending
   - The application limits users to 3 verification codes per hour
   - Consider implementing exponential backoff for failed attempts

**Security Notes:**
- Never commit Twilio credentials to version control
- Use environment variables or secret management systems
- Monitor Twilio usage to prevent abuse
- Consider implementing additional rate limiting for production
- Review Twilio's security best practices documentation

**Cost Considerations:**
- SMS messages cost approximately $0.0075 per message in the US
- Monitor usage in Twilio Console to track costs
- Consider setting up billing alerts in Twilio
- International SMS rates vary significantly

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
