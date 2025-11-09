# Messaging Setup Plan

## Current Status
✅ **Twilio SMS**: Credentials provided - ready to deploy
🔄 **SendGrid Email**: Need API key and DNS setup
✅ **Code**: All messaging services already implemented

## Twilio Credentials (Ready to Deploy)
```
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=REMOVED_FOR_SECURITY
TWILIO_AUTH_TOKEN=REMOVED_FOR_SECURITY
TWILIO_FROM_NUMBER=+14846853129
```

## SendGrid Setup Steps

### 1. Find Your DNS Provider
- Go to https://www.whois.net/
- Enter: `kidsinmotionpa.org`
- Check "Name Servers" section

### 2. Create SendGrid Account
- Go to https://sendgrid.com/
- Sign up with your email
- Verify your account

### 3. Get API Key
- Go to Settings → API Keys
- Click "Create API Key"
- Choose "Full Access" or "Restricted Access" with Mail Send permissions
- Copy the API key (starts with "SG.")

### 4. Domain Authentication (Critical for Deliverability)

**Why This is Important:**
Domain authentication is required to avoid Office365 relay errors and ensure emails are sent directly through SendGrid. Without proper authentication, emails may try to relay through Microsoft 365, resulting in errors like "SmtpClientAuthentication is disabled."

**Setup Steps:**

1. **Go to SendGrid Sender Authentication:**
   - Navigate to: Settings → Sender Authentication → Authenticate Your Domain
   - Click "Get Started"

2. **Configure Domain:**
   - Select your DNS provider (GoDaddy, Cloudflare, etc.)
   - Enter your domain: `kidsinmotionpa.org`
   - Keep "Automated security" enabled
   - Click "Next"

3. **SendGrid will provide 3 CNAME records:**

   | Type  | Host (Name)        | Points To (Value)                          |
   |-------|--------------------|--------------------------------------------|
   | CNAME | em####             | u#####.wl###.sendgrid.net                  |
   | CNAME | s1._domainkey      | s1.domainkey.u#####.wl###.sendgrid.net     |
   | CNAME | s2._domainkey      | s2.domainkey.u#####.wl###.sendgrid.net     |

   (The `####` and `#####` will be actual numbers provided by SendGrid)

4. **Add Records to Your DNS Provider** (see GoDaddy instructions below)

5. **Verify Domain Authentication:**
   - After adding records, return to SendGrid and click "Verify"
   - You should see a green checkmark indicating successful authentication
   - DNS propagation can take up to 48 hours (usually 15-60 minutes)

### 4a. GoDaddy DNS Configuration

If you're using GoDaddy as your DNS provider:

1. **Log in to GoDaddy:**
   - Go to https://www.godaddy.com/
   - Sign in to your account

2. **Navigate to DNS Management:**
   - Go to "My Products"
   - Find your domain `kidsinmotionpa.org`
   - Click "DNS" or "Manage DNS"

3. **Add Each CNAME Record:**
   - Click "Add" to create a new DNS record
   - **Type:** Select "CNAME"
   - **Host:** Enter ONLY the subdomain (e.g., "em1234", NOT "em1234.kidsinmotionpa.org")
     - **CRITICAL:** GoDaddy automatically appends your domain - don't include it in Host
   - **Points to:** Enter the exact target from SendGrid
   - **TTL:** Select "1 Hour" (3600 seconds)
   - Click "Save"

4. **Repeat for all 3 records:**
   - em#### → u#####.wl###.sendgrid.net
   - s1._domainkey → s1.domainkey.u#####.wl###.sendgrid.net
   - s2._domainkey → s2.domainkey.u#####.wl###.sendgrid.net

5. **Common GoDaddy Mistakes:**
   - ❌ Don't enter full domain in Host field
   - ❌ Don't include "@" for CNAME records
   - ✅ Do enter only the subdomain part
   - ✅ Do copy exact "Points to" value from SendGrid

6. **Verify DNS Propagation:**
   - Use https://dnschecker.org/ to check propagation
   - Wait for propagation before verifying in SendGrid

### 4b. Add SPF and DMARC Records (Optional but Recommended)

**SPF Record:**
- Type: TXT
- Host: @ (or leave blank for root domain)
- Value: `v=spf1 include:sendgrid.net ~all`
- TTL: 1 Hour

**DMARC Record:**
- Type: TXT
- Host: _dmarc
- Value: `v=DMARC1; p=none; rua=mailto:admin@kidsinmotionpa.org`
- TTL: 1 Hour

### 5. Test Configuration
```
EMAIL_ENABLED=true
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=info@kidsinmotionpa.org
```

## Troubleshooting Office365 Relay Errors

### Error: "554 5.7.8 smtp; SmtpClientAuthentication is disabled for the Tenant"

**What This Means:**
This error indicates that emails are trying to relay through Microsoft 365 (Office365) instead of sending directly through SendGrid. This happens when the sender email domain is not properly authenticated in SendGrid.

**Root Cause:**
- Sender email domain (`kidsinmotionpa.org`) not authenticated in SendGrid
- Missing or incorrect DNS CNAME records
- DNS records not fully propagated

**Solution Steps:**

1. **Complete Domain Authentication in SendGrid:**
   - Go to Settings → Sender Authentication → Authenticate Your Domain
   - Verify all 3 CNAME records are added to your DNS
   - Look for green checkmark indicating successful authentication

2. **Verify DNS Records in GoDaddy:**
   - Log in to GoDaddy DNS Management
   - Confirm all 3 CNAME records exist:
     - em#### pointing to u#####.wl###.sendgrid.net
     - s1._domainkey pointing to s1.domainkey.u#####.wl###.sendgrid.net
     - s2._domainkey pointing to s2.domainkey.u#####.wl###.sendgrid.net
   - Verify Host field contains ONLY the subdomain (not full domain)

3. **Check DNS Propagation:**
   - Visit https://dnschecker.org/
   - Search for each CNAME record
   - Ensure records are propagated globally
   - Wait up to 48 hours if records are not propagated

4. **Verify SendGrid Configuration:**
   - Ensure `SENDGRID_API_KEY` environment variable is set
   - Verify sender email matches authenticated domain
   - Check that you're using SendGrid API (not SMTP)

5. **Test Email Delivery:**
   - Check SendGrid activity feed: https://app.sendgrid.com/email_activity
   - Look for delivery status and error messages
   - Verify emails are being sent through SendGrid, not Office365

6. **Check Application Logs:**
   ```bash
   gcloud run services logs read kidsinmotion-website --region=us-east4 --project=kids-in-motion-website-b1c09 --limit=50
   ```
   Look for detailed error messages from `EmailDeliveryService`

### Other Email Issues:

**Emails Not Sending:**
- Verify SendGrid API key has "Mail Send" permissions
- Check SendGrid activity feed for error details
- Ensure `EMAIL_ENABLED=true` in environment variables

**Email Delivery Delayed:**
- DNS propagation can take up to 48 hours
- Check SendGrid activity feed for delivery status

**Domain Authentication Failing:**
- Verify all 3 CNAME records are correctly added
- Check for typos in Host or Points to fields
- Ensure you didn't include full domain in Host field (GoDaddy mistake)

## Deployment Plan
1. Fix Firestore configuration ✅
2. Deploy with Twilio SMS enabled
3. **Complete SendGrid domain authentication** (critical!)
4. Add SendGrid API key when ready
5. Verify no Office365 relay errors
6. Test both email and SMS functionality

## Next Steps
1. **Complete SendGrid domain authentication** (see section 4 above)
2. **Add all 3 CNAME records to GoDaddy** (see section 4a)
3. **Verify domain authentication** (green checkmark in SendGrid)
4. Check DNS propagation at https://dnschecker.org/
5. Get SendGrid API key and deploy
6. Test email delivery and check for errors