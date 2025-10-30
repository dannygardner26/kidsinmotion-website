import React from 'react';

const PrivacyPolicy = () => {
  return (
    <>
      <section className="section" style={{ paddingTop: '6rem' }}>
        <div className="container">
          <div className="card">
            <div className="card-header">
              <h1 style={{ color: '#2f506a', marginBottom: '0.5rem' }}>Privacy Policy</h1>
              <p style={{ marginBottom: 0, color: '#666' }}>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="card-body" style={{ lineHeight: '1.6' }}>

              <h2>1. Introduction</h2>
              <p>
                Kids in Motion ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>

              <h2>2. Information We Collect</h2>

              <h3>2.1 Personal Information</h3>
              <p>We may collect personal information that you provide directly to us, including:</p>
              <ul>
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Profile information (grade level, school, skills, interests)</li>
                <li>Event registration and participation data</li>
                <li>Volunteer application information</li>
                <li>Emergency contact information for minors</li>
              </ul>

              <h3>2.2 Automatically Collected Information</h3>
              <p>When you use our website, we may automatically collect:</p>
              <ul>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, clicks)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Process event registrations and manage participation</li>
                <li>Communicate with you about our programs and events</li>
                <li>Screen and manage volunteer applications</li>
                <li>Ensure the safety and security of participants</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>4. Information Sharing and Disclosure</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul>
                <li><strong>With your consent:</strong> When you explicitly agree to share your information</li>
                <li><strong>For safety purposes:</strong> To protect the safety of minors and participants</li>
                <li><strong>Legal compliance:</strong> When required by law or to respond to legal process</li>
                <li><strong>Emergency situations:</strong> To protect someone's health or safety</li>
                <li><strong>Service providers:</strong> With trusted third-party service providers who assist in our operations</li>
              </ul>

              <h2>5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>

              <h2>6. Children's Privacy (COPPA Compliance)</h2>
              <p>
                Our services are designed for children and families. We are committed to complying with the Children's Online Privacy Protection Act (COPPA) and take special care to protect children's privacy:
              </p>

              <h3>6.1 Information Collection from Children Under 13</h3>
              <ul>
                <li>We do not knowingly collect personal information from children under 13 without verifiable parental consent</li>
                <li>We require explicit parental consent before registering children under 13 for events or accounts</li>
                <li>We only collect information necessary for participation in our programs and safety purposes</li>
                <li>We do not require children to provide more information than reasonably necessary to participate</li>
              </ul>

              <h3>6.2 Parental Rights and Controls</h3>
              <ul>
                <li>Parents can review their child's personal information at any time</li>
                <li>Parents can refuse to allow further collection or use of their child's information</li>
                <li>Parents can request deletion of their child's personal information</li>
                <li>Parents will be notified if we need to collect additional information from their child</li>
                <li>We provide parents with direct contact information for privacy-related concerns</li>
              </ul>

              <h3>6.3 Information Use and Sharing</h3>
              <ul>
                <li>We do not use children's information for marketing or promotional purposes</li>
                <li>Children's information is only shared with staff necessary for program operations</li>
                <li>We may share information in emergencies or for child safety purposes</li>
                <li>Background-checked volunteers may access limited information necessary for their role</li>
              </ul>

              <h2>7. Your Rights and Choices</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Request a copy of your data</li>
              </ul>

              <h2>8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our website. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
              </p>

              <h2>9. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>

              <h2>10. Data Retention and Deletion</h2>
              <p>
                We retain personal information only as long as necessary to fulfill the purposes outlined in this policy:
              </p>
              <ul>
                <li><strong>Event participation data:</strong> Retained for the duration of the program year plus one additional year for safety records</li>
                <li><strong>Volunteer information:</strong> Retained as long as the individual remains a volunteer plus three years for background check compliance</li>
                <li><strong>Children's information:</strong> Deleted upon parental request or when no longer necessary for the stated purpose</li>
                <li><strong>Account information:</strong> Deleted within 30 days of account closure request</li>
                <li><strong>Safety incident records:</strong> Retained as required by law and organizational liability insurance requirements</li>
              </ul>

              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. For changes affecting children's privacy rights, we will provide additional notice to parents.
              </p>

              <h2>12. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, our privacy practices, or wish to exercise your parental rights under COPPA, please contact us at:
              </p>
              <div style={{ marginLeft: '1rem' }}>
                <p><strong>Kids in Motion - Privacy Officer</strong></p>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  <li><strong>Email:</strong> info@kidsinmotionpa.org</li>
                  <li><strong>Phone:</strong> (484) 885-6284</li>
                  <li><strong>Website:</strong> www.kidsinmotionpa.org</li>
                </ul>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                  <em>For urgent child safety concerns, please contact us immediately by phone.</em>
                </p>
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                <strong>Note:</strong> This privacy policy is designed to comply with applicable privacy laws including COPPA (Children's Online Privacy Protection Act) and general data protection regulations. For specific legal advice, consult with a qualified attorney.
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicy;