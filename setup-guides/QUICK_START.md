# 🚀 Quick Start - Essential Setup Commands

## Run These Commands in Order:

### 1. Enable Firestore:
```bash
gcloud services enable firestore.googleapis.com --project=kids-in-motion-website-b1c09
gcloud firestore databases create --region=us-central1 --project=kids-in-motion-website-b1c09
```

### 2. Deploy Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Set Up Twilio (get credentials from twilio.com):
```bash
echo "YOUR_ACCOUNT_SID" | gcloud secrets create twilio-account-sid --data-file=- --project=kids-in-motion-website-b1c09
echo "YOUR_AUTH_TOKEN" | gcloud secrets create twilio-auth-token --data-file=- --project=kids-in-motion-website-b1c09
echo "YOUR_PHONE_NUMBER" | gcloud secrets create twilio-phone-number --data-file=- --project=kids-in-motion-website-b1c09
```

### 4. Set Up SendGrid (get API key from sendgrid.com):
```bash
echo "YOUR_SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key --data-file=- --project=kids-in-motion-website-b1c09
```

### 5. Update Cloud Run:
```bash
gcloud run services update kidsinmotion-website \
  --region=us-east4 \
  --project=kids-in-motion-website-b1c09 \
  --set-env-vars="FIRESTORE_PROJECT_ID=kids-in-motion-website-b1c09" \
  --set-secrets="TWILIO_ACCOUNT_SID=twilio-account-sid:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest,TWILIO_PHONE_NUMBER=twilio-phone-number:latest,SENDGRID_API_KEY=sendgrid-api-key:latest"
```

### 6. Test:
- Go to https://kidsinmotionpa.org/admin
- Try sending a message to a user
- Check if it appears in their inbox

## That's it! 🎉
