import React from 'react';

const TermsOfService = () => {
  return (
    <>
      <section className="section" style={{ paddingTop: '6rem' }}>
        <div className="container">
          <div className="card">
            <div className="card-header">
              <h1 style={{ color: '#2f506a', marginBottom: '0.5rem' }}>Terms of Service</h1>
              <p style={{ marginBottom: 0, color: '#666' }}>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="card-body" style={{ lineHeight: '1.6' }}>

              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing and using Kids in Motion's website and services ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, you should not use our Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Kids in Motion is a non-profit organization that provides free sports clinics, equipment donations, and volunteer opportunities to make sports accessible to all children. Our Service includes:
              </p>
              <ul>
                <li>Event registration and management</li>
                <li>Volunteer application and coordination</li>
                <li>Community outreach and education</li>
                <li>Equipment donation programs</li>
              </ul>

              <h2>3. User Accounts and Responsibilities</h2>

              <h3>3.1 Account Creation</h3>
              <p>To access certain features of our Service, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of unauthorized use of your account</li>
              </ul>

              <h3>3.2 Age Requirements</h3>
              <ul>
                <li>Users under 13 must have parental consent to create an account</li>
                <li>Parents/guardians are responsible for their minor children's use of the Service</li>
                <li>Volunteers must be at least 14 years old or have appropriate supervision</li>
              </ul>

              <h2>4. Acceptable Use Policy</h2>
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Violate any laws or regulations</li>
                <li>Harass, abuse, or harm minors or other users</li>
                <li>Impersonate others or provide false information</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Spam or send unsolicited communications</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Access unauthorized areas of the system</li>
                <li>Use the Service for commercial purposes without permission</li>
              </ul>

              <h2>5. Events and Activities</h2>

              <h3>5.1 Participation</h3>
              <ul>
                <li>Participation in events is subject to availability and eligibility requirements</li>
                <li>Parents/guardians must provide consent for minors to participate</li>
                <li>All participants must follow safety guidelines and instructions</li>
                <li>We reserve the right to remove disruptive participants</li>
              </ul>

              <h3>5.2 Assumption of Risk</h3>
              <p>
                Sports activities involve inherent risks. By participating, you acknowledge and assume these risks. Parents/guardians assume responsibility for their children's participation.
              </p>

              <h3>5.3 Medical Information</h3>
              <p>
                You agree to provide accurate medical information and emergency contacts. You are responsible for ensuring participants are physically able to participate in activities.
              </p>

              <h2>6. Volunteer Terms</h2>
              <p>If you apply to volunteer, you agree to:</p>
              <ul>
                <li>Undergo background checks as required</li>
                <li>Follow all organizational policies and procedures</li>
                <li>Maintain professional conduct with all participants</li>
                <li>Report any safety concerns or incidents</li>
                <li>Respect confidentiality of participant information</li>
                <li>Complete required training programs</li>
              </ul>

              <h2>7. Content and Intellectual Property</h2>

              <h3>7.1 User Content</h3>
              <p>
                You retain ownership of content you submit, but grant us a license to use, modify, and display such content in connection with our Service.
              </p>

              <h3>7.2 Our Content</h3>
              <p>
                All content on our Service, including text, graphics, logos, and software, is owned by Kids in Motion or our licensors and is protected by copyright and other laws.
              </p>

              <h2>8. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>

              <h2>9. Disclaimers and Limitations of Liability</h2>

              <h3>9.1 Service "As Is"</h3>
              <p>
                Our Service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free service.
              </p>

              <h3>9.2 Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Kids in Motion shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Kids in Motion from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
              </p>

              <h2>11. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or our organization.
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our website. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>

              <h2>13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to conflict of law principles.
              </p>

              <h2>14. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li><strong>Email:</strong> kidsinmotion0@gmail.com</li>
                <li><strong>Phone:</strong> (484) 885-6284</li>
              </ul>

              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                <strong>Important:</strong> These terms are legally binding. If you do not agree to these terms, please do not use our services. For questions about legal implications, consult with a qualified attorney.
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TermsOfService;