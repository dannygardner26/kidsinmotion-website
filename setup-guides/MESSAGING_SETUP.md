# 📧 Kids in Motion - Messaging System Setup Guide

## 🎯 Overview
This guide will help you set up Twilio SMS, SendGrid email, and Firestore messaging for your Kids in Motion website.

## 📋 Prerequisites
- Google Cloud access to `kids-in-motion-website-b1c09` project
- Firebase admin access
- Twilio account
- SendGrid account

---

## 🔥 Step 1: Firestore Database Setup

### Enable Firestore:
```bash
gcloud services enable firestore.googleapis.com --project=kids-in-motion-website-b1c09
```

### Create Firestore Database:
```bash
gcloud firestore databases create --region=us-central1 --project=kids-in-motion-website-b1c09
```

### Deploy Security Rules:
```bash
firebase deploy --only firestore:rules
```

---

## 📱 Step 2: Twilio Setup (SMS)

### 1. Create Twilio Account:
- Go to https://www.twilio.com/
- Sign up for a free account
- Verify your phone number

### 2. Get Credentials:
- **Account SID**: Found in Console Dashboard
- **Auth Token**: Found in Console Dashboard  
- **Phone Number**: Purchase a phone number in Console

### 3. Store in Google Secret Manager:
```bash
# Replace with your actual values
echo "your-account-sid-here" | gcloud secrets create twilio-account-sid --data-file=- --project=kids-in-motion-website-b1c09
echo "your-auth-token-here" | gcloud secrets create twilio-auth-token --data-file=- --project=kids-in-motion-website-b1c09
echo "+1234567890" | gcloud secrets create twilio-phone-number --data-file=- --project=kids-in-motion-website-b1c09
```

---

## 📧 Step 3: SendGrid Setup (Email)

### 1. Create SendGrid Account:
- Go to https://sendgrid.com/
- Sign up for a free account
- Verify your email

### 2. Create API Key:
- Go to Settings → API Keys
- Create new API key with "Mail Send" permissions
- Copy the API key (you won't see it again!)

### 3. Store in Google Secret Manager:
```bash
# Replace with your actual API key
echo "SG.your-api-key-here" | gcloud secrets create sendgrid-api-key --data-file=- --project=kids-in-motion-website-b1c09
```

---

## ☁️ Step 4: Configure Cloud Run Service

### Update your Cloud Run service with the secrets:
```bash
gcloud run services update kidsinmotion-website \
  --region=us-east4 \
  --project=kids-in-motion-website-b1c09 \
  --set-env-vars="FIRESTORE_PROJECT_ID=kids-in-motion-website-b1c09" \
  --set-secrets="TWILIO_ACCOUNT_SID=twilio-account-sid:latest" \
  --set-secrets="TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
  --set-secrets="TWILIO_PHONE_NUMBER=twilio-phone-number:latest" \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
```

---

## 🧪 Step 5: Test the Setup

### Test Admin Messaging:
1. Log in as admin at https://kidsinmotionpa.org/admin
2. Go to User Management
3. Send a test message to a user
4. Check if message appears in their inbox

### Test with cURL:
```bash
# Get admin Firebase token first (from browser dev tools)
curl -X POST "https://kidsinmotion-website-839796180413.us-east4.run.app/api/messages/send/USER_FIREBASE_UID" \
  -H "Authorization: Bearer YOUR_ADMIN_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Message",
    "message": "This is a test message from admin",
    "type": "admin"
  }'
```

---

## 🔧 Troubleshooting

### Common Issues:

1. **"Permission denied" errors:**
   - Check Firestore security rules
   - Verify admin email is in rules

2. **SMS not sending:**
   - Verify Twilio phone number is SMS-enabled
   - Check Twilio console for error logs

3. **Email not sending:**
   - Verify SendGrid API key permissions
   - Check SendGrid activity feed

4. **Messages not appearing in inbox:**
   - Check browser console for Firestore errors
   - Verify user is logged in correctly

### Debug Commands:
```bash
# Check Cloud Run logs
gcloud run services logs read kidsinmotion-website --region=us-east4 --project=kids-in-motion-website-b1c09

# Check secrets are set
gcloud secrets list --project=kids-in-motion-website-b1c09

# Check Cloud Run service configuration
gcloud run services describe kidsinmotion-website --region=us-east4 --project=kids-in-motion-website-b1c09
```

---

## 📞 Support

If you need help with setup:
1. Check the Cloud Run logs for error messages
2. Verify all secrets are properly set in Google Secret Manager
3. Test each service (Twilio, SendGrid) independently first
4. Contact Claude Code for advanced troubleshooting

---

## ✅ Verification Checklist

- [ ] Firestore database created and rules deployed
- [ ] Twilio account created and credentials stored
- [ ] SendGrid account created and API key stored
- [ ] Cloud Run service updated with all secrets
- [ ] Test message sent successfully
- [ ] Message appears in user inbox
- [ ] SMS notifications working (if enabled)
- [ ] Email notifications working (if enabled)

