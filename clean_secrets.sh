#!/bin/bash
# Script to clean API keys from application-production.properties

FILE="backend/complete/src/main/resources/application-production.properties"

if [ -f "$FILE" ]; then
    # Replace SendGrid API key
    sed -i 's/sendgrid\.api\.key=\${SENDGRID_API_KEY:SG\.[^}]*}/sendgrid.api.key=${SENDGRID_API_KEY:}/g' "$FILE"

    # Replace Twilio Account SID
    sed -i 's/twilio\.account-sid=\${TWILIO_ACCOUNT_SID:AC[^}]*}/twilio.account-sid=${TWILIO_ACCOUNT_SID:}/g' "$FILE"

    # Replace Twilio Auth Token
    sed -i 's/twilio\.auth-token=\${TWILIO_AUTH_TOKEN:[^}]*}/twilio.auth-token=${TWILIO_AUTH_TOKEN:}/g' "$FILE"

    echo "Cleaned secrets from $FILE"
else
    echo "File $FILE not found"
fi