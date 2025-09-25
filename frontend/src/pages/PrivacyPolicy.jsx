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

              <h2>6. Children's Privacy</h2>
              <p>
                Our services are designed for children and families. We take special care to protect children's privacy:
              </p>
              <ul>
                <li>We require parental consent for children under 13</li>
                <li>We limit collection of personal information from minors</li>
                <li>Parents can review and delete their child's information</li>
                <li>We do not use children's information for marketing purposes</li>
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

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li><strong>Email:</strong> kidsinmotion0@gmail.com</li>
                <li><strong>Phone:</strong> (484) 885-6284</li>
              </ul>

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