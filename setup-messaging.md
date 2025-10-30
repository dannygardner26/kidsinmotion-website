# 🔧 Firestore & Twilio Messaging Setup

## 1. Firestore Database Setup

### Enable Firestore:
```bash
gcloud services enable firestore.googleapis.com --project=kids-in-motion-website-b1c09
gcloud firestore databases create --region=us-central1 --project=kids-in-motion-website-b1c09
```

### Deploy Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

## 2. Twilio Setup

### Get Twilio Credentials:
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from Console
3. Get a Twilio phone number

### Set Environment Variables:
```bash
# For Cloud Run (use Google Secret Manager)
echo "your-account-sid" | gcloud secrets create twilio-account-sid --data-file=-
echo "your-auth-token" | gcloud secrets create twilio-auth-token --data-file=-
echo "your-phone-number" | gcloud secrets create twilio-phone-number --data-file=-
```

## 3. SendGrid Setup (Email)

### Get SendGrid API Key:
1. Sign up at https://sendgrid.com/
2. Create an API key with Mail Send permissions

### Set Environment Variable:
```bash
echo "your-sendgrid-api-key" | gcloud secrets create sendgrid-api-key --data-file=-
```

## 4. Update Cloud Run Environment

### Set environment variables for your Cloud Run service:
```bash
gcloud run services update kidsinmotion-website \
  --region=us-east4 \
  --set-env-vars="FIRESTORE_PROJECT_ID=kids-in-motion-website-b1c09" \
  --set-secrets="TWILIO_ACCOUNT_SID=twilio-account-sid:latest" \
  --set-secrets="TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
  --set-secrets="TWILIO_PHONE_NUMBER=twilio-phone-number:latest" \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
```

## 5. Test the Setup

### Test with curl:
```bash
# Test sending a message
curl -X POST "https://kidsinmotion-website-839796180413.us-east4.run.app/api/messages/send/USER_FIREBASE_UID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Message",
    "message": "This is a test message from admin",
    "type": "admin"
  }'
```
