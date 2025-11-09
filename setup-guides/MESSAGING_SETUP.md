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

### 4. **SendGrid Domain Authentication** (Critical for Deliverability):

Domain authentication is required to avoid email delivery issues, including Office365 relay errors. This step authenticates your domain (kidsinmotionpa.org) with SendGrid to ensure emails are sent directly through SendGrid, not through Microsoft 365 relay.

#### Setup Steps:
1. **Go to SendGrid Sender Authentication:**
   - Navigate to: Settings → Sender Authentication → Authenticate Your Domain
   - Click "Get Started"

2. **Configure Domain:**
   - Select your DNS provider (e.g., GoDaddy, Cloudflare, etc.)
   - Enter your domain: `kidsinmotionpa.org`
   - Keep "Automated security" enabled (recommended)
   - Click "Next"

3. **Add CNAME Records to DNS:**
   SendGrid will provide 3 CNAME records to add to your DNS:

   | Type  | Host (Name)        | Points To (Value)                          | TTL  |
   |-------|--------------------|--------------------------------------------|------|
   | CNAME | em####             | u#####.wl###.sendgrid.net                  | 3600 |
   | CNAME | s1._domainkey      | s1.domainkey.u#####.wl###.sendgrid.net     | 3600 |
   | CNAME | s2._domainkey      | s2.domainkey.u#####.wl###.sendgrid.net     | 3600 |

   **Important Notes:**
   - The `em####` subdomain is for email sending
   - The `s1._domainkey` and `s2._domainkey` are DKIM signature keys for email authentication
   - Replace `####` and `#####` with the actual values provided by SendGrid
   - When adding to GoDaddy or other DNS providers, enter ONLY the subdomain part (e.g., "em1234"), not the full domain
   - DNS propagation can take up to 48 hours, but usually completes within 15 minutes

4. **Verify Domain Authentication:**
   - After adding all 3 CNAME records to your DNS, go back to SendGrid
   - Click "Verify" to check if the records are properly configured
   - You should see a green checkmark indicating successful authentication
   - If verification fails, wait longer for DNS propagation and try again

5. **Optional: Add SPF and DMARC Records:**

   Add these TXT records to your DNS for improved deliverability:

   **SPF Record:**
   - Type: TXT
   - Host: @
   - Value: `v=spf1 include:sendgrid.net ~all`
   - TTL: 3600

   **DMARC Record:**
   - Type: TXT
   - Host: _dmarc
   - Value: `v=DMARC1; p=none; rua=mailto:admin@kidsinmotionpa.org`
   - TTL: 3600

### 6. **GoDaddy DNS Configuration** (if using GoDaddy):

If you're using GoDaddy as your DNS provider, follow these steps to add the SendGrid CNAME records:

1. **Log in to GoDaddy:**
   - Go to https://www.godaddy.com/
   - Sign in to your account

2. **Navigate to DNS Management:**
   - Go to "My Products"
   - Find your domain `kidsinmotionpa.org`
   - Click "DNS" or "Manage DNS"

3. **Add CNAME Records:**
   For each of the 3 CNAME records provided by SendGrid:

   - Click "Add" to create a new DNS record
   - **Type:** Select "CNAME"
   - **Host:** Enter ONLY the subdomain part (e.g., "em1234", "s1._domainkey", "s2._domainkey")
     - **IMPORTANT:** Do NOT enter the full domain (e.g., "em1234.kidsinmotionpa.org")
     - GoDaddy will automatically append your domain
   - **Points to:** Enter the target value from SendGrid (e.g., "u12345.wl123.sendgrid.net")
   - **TTL:** Select "1 Hour" or "Custom" and enter "3600"
   - Click "Save"

4. **Common GoDaddy Mistakes to Avoid:**
   - ❌ Don't enter the full domain in the "Host" field
   - ❌ Don't include "@" in the Host field for CNAME records
   - ✅ Do enter only the subdomain (e.g., "em1234")
   - ✅ Do copy the exact "Points to" value from SendGrid

5. **Wait for DNS Propagation:**
   - DNS changes can take up to 48 hours to propagate, but typically complete within 15-60 minutes
   - You can check DNS propagation status at: https://dnschecker.org/

6. **Verify in SendGrid:**
   - After waiting for DNS propagation, return to SendGrid
   - Click "Verify" to confirm all records are correctly configured
   - You should see a green checkmark for successful authentication

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

1. **Office365 Relay Errors (5.7.8 SmtpClientAuthentication disabled):**

   **Error Message:**
   ```
   554 5.7.8 smtp; SmtpClientAuthentication is disabled for the Tenant.
   Visit https://aka.ms/smtp_auth_disabled for more information.
   ```

   **Root Cause:**
   This error occurs when emails are trying to relay through Microsoft 365 (Office365) instead of sending directly through SendGrid. This happens when the sender email domain is not properly authenticated in SendGrid.

   **Solution:**
   1. **Complete SendGrid Domain Authentication** (see Step 3, Section 4 above)
      - Navigate to SendGrid: Settings → Sender Authentication → Authenticate Your Domain
      - Add all 3 CNAME records to your DNS (GoDaddy, Cloudflare, etc.)
      - Wait for DNS propagation (up to 48 hours, typically 15-60 minutes)
      - Verify domain authentication shows green checkmark in SendGrid

   2. **Verify DNS Records:**
      - Check that all CNAME records are correctly added to your DNS
      - Use https://dnschecker.org/ to verify DNS propagation
      - Ensure Host field contains only the subdomain (not the full domain)

   3. **Verify SendGrid Configuration:**
      - Ensure you're using SendGrid API (not SMTP relay)
      - Verify `SENDGRID_API_KEY` environment variable is set correctly
      - Check that sender email (`info@kidsinmotionpa.org`) matches the authenticated domain

   4. **Check Application Logs:**
      ```bash
      gcloud run services logs read kidsinmotion-website --region=us-east4 --project=kids-in-motion-website-b1c09 --limit=50
      ```
      Look for detailed error messages from `EmailDeliveryService`

   5. **Test Email Delivery:**
      - Check SendGrid activity feed: https://app.sendgrid.com/email_activity
      - Look for delivery status and error messages
      - Verify emails are being sent through SendGrid, not Office365

2. **Email Delivery Failures:**
   - **Verify domain authentication status** in SendGrid (must show green checkmark)
   - **Check DNS records** are properly configured
   - **Verify SendGrid API key** permissions (must have "Mail Send" permission)
   - **Test with SendGrid's email testing tool**: https://app.sendgrid.com/guide/integrate/langs/curl
   - **Check SendGrid activity feed** for detailed error messages

3. **"Permission denied" errors:**
   - Check Firestore security rules
   - Verify admin email is in rules

4. **SMS not sending:**
   - Verify Twilio phone number is SMS-enabled
   - Check Twilio console for error logs

5. **Messages not appearing in inbox:**
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
- [ ] **SendGrid domain authentication completed** (all 3 CNAME records added)
- [ ] **Domain authentication verified** (green checkmark in SendGrid)
- [ ] **DNS records propagated** (verified via dnschecker.org)
- [ ] Cloud Run service updated with all secrets
- [ ] Test message sent successfully
- [ ] Message appears in user inbox
- [ ] SMS notifications working (if enabled)
- [ ] **Email notifications working** (no Office365 relay errors)
- [ ] SendGrid activity feed shows successful delivery

