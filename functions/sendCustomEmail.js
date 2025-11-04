const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API key
sgMail.setApiKey(functions.config().sendgrid.key);

exports.sendCustomEmail = functions.auth.user().onCreate(async (user) => {
  const msg = {
    to: user.email,
    from: {
      email: 'info@kidsinmotionpa.org',
      name: 'Kids in Motion'
    },
    subject: 'Welcome to Kids in Motion!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2F506A;">Welcome to Kids in Motion!</h2>
        <p>Hi ${user.displayName || 'there'},</p>
        <p>Thank you for joining the Kids in Motion community! We're excited to have you as part of our mission to support children and families in our community.</p>
        <p>To get started, please verify your email address by clicking the link below:</p>
        <a href="${generateEmailVerificationLink(user)}"
           style="background-color: #2F506A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Verify Email Address
        </a>
        <p>If you have any questions, feel free to reply to this email or contact us at info@kidsinmotionpa.org.</p>
        <p>Best regards,<br>The Kids in Motion Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Custom welcome email sent successfully');
  } catch (error) {
    console.error('Error sending custom email:', error);
  }
});

function generateEmailVerificationLink(user) {
  // Generate Firebase email verification link
  // This requires Firebase Admin SDK setup
  return `https://kidsinmotionpa.org/verify-email?token=${user.uid}`;
}