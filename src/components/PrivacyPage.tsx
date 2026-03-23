import React, { useEffect } from 'react';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'GridSmith — Privacy Policy';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Read how GridSmith collects, uses, and protects information across website usage, accounts, uploads, and communications.'
      );
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-container">
          <h1>Privacy Policy</h1>
          <p className="legal-last-updated">Last updated: March 22, 2026</p>
          <p>
            This Privacy Policy explains how GridSmith collects, uses, and protects your information when you use our
            website, tools, and related services.
          </p>
        </div>
      </section>

      <section className="legal-section">
        <div className="legal-container legal-content">
          <h2>1. Information We Collect</h2>

          <h3>Information You Provide</h3>
          <p>We may collect information you provide directly, including:</p>
          <ul>
            <li>Email address (for accounts, downloads, or future updates)</li>
            <li>Account details (if accounts are enabled)</li>
            <li>Payment information (processed securely by third-party providers)</li>
            <li>Content you upload (such as images, heightmaps, or other inputs)</li>
            <li>Messages or inquiries you send to us</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>We may automatically collect certain technical and usage information, including:</p>
          <ul>
            <li>IP address and general location (e.g., country or region)</li>
            <li>Device type, browser, and operating system</li>
            <li>Pages visited, actions taken, and time spent on the site</li>
            <li>Referring websites or sources</li>
          </ul>

          <h2>2. How We Use Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and operate GridSmith tools and services</li>
            <li>Generate files, previews, and outputs you request</li>
            <li>Process transactions and deliver purchased products</li>
            <li>Improve performance, usability, and features</li>
            <li>Monitor usage and detect abuse or technical issues</li>
            <li>Communicate with you about updates, changes, or support requests</li>
          </ul>

          <h2>3. Email and Marketing Communications</h2>
          <p>
            We may collect your email address to send important updates about your account, purchases, or the service.
          </p>
          <p>
            In the future, we may also use your email address to send product updates, new releases, or promotional
            content related to GridSmith.
          </p>
          <p>
            You can opt out of marketing emails at any time using the unsubscribe link included in those emails.
            Transactional or service-related communications may still be sent when necessary.
          </p>

          <h2>4. Cookies and Analytics</h2>
          <p>
            GridSmith may use cookies and similar technologies to improve your experience and understand how the service
            is used.
          </p>
          <p>
            We may use analytics tools (such as Google Analytics or similar services) to collect aggregated usage data.
            These tools may use cookies or other tracking technologies.
          </p>
          <p>
            We use Google Analytics, a web analytics service provided by Google LLC. Google Analytics uses cookies and
            similar technologies to collect information about how users interact with our website.
          </p>
          <p>
            This information may include your IP address, device information, browser type, pages visited, and
            interactions with the site. Google may use this data in accordance with its own privacy policies.
          </p>
          <p>
            We may also use tools such as Google Tag Manager to manage and deploy analytics and other tracking
            technologies on our site.
          </p>
          <p>
            You can learn more about how Google uses data here:{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">
              https://policies.google.com/technologies/partner-sites
            </a>
          </p>
          <p>
            You can opt out of Google Analytics tracking by using browser extensions such as the Google Analytics
            Opt-out Browser Add-on, or by adjusting your browser settings to limit cookies.
          </p>
          <p>
            You can control cookies through your browser settings. Disabling cookies may affect certain features of the
            site.
          </p>
          <p>
            When required by applicable law, we will request your consent before placing non-essential cookies on your
            device, including those used for analytics.
          </p>
          <p>
            You can manage your cookie preferences through the cookie banner presented on the site. You may update or
            withdraw your consent at any time.
          </p>

          <h2>5. Sharing of Information</h2>
          <p>We do not sell your personal information.</p>
          <p>We may share information in the following limited cases:</p>
          <ul>
            <li>With service providers (e.g., hosting, analytics, payment processing)</li>
            <li>To comply with legal obligations or valid legal requests</li>
            <li>To protect the security, integrity, or operation of GridSmith</li>
            <li>In connection with a business transfer (e.g., merger or acquisition)</li>
          </ul>

          <h2>6. User Content</h2>
          <p>
            If you upload content (such as images or heightmaps), that content is processed to provide the requested
            functionality.
          </p>
          <p>
            We do not use your uploaded content for marketing or public display without your permission. However, we may
            temporarily store or process it to operate the service.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain information only as long as necessary to provide the service, comply with legal obligations,
            resolve disputes, and enforce agreements.
          </p>
          <p>
            Uploaded content may be stored temporarily or deleted automatically after processing, depending on how the
            service is implemented.
          </p>

          <h2>8. Security</h2>
          <p>
            We take reasonable measures to protect your information from unauthorized access, loss, misuse, or
            alteration. However, no system can be guaranteed to be completely secure.
          </p>

          <h2>9. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access or request a copy of your personal information</li>
            <li>Request correction or deletion of your information</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
          <p>To make a request, contact us using the information below.</p>

          <h2>Legal Basis for Processing (GDPR)</h2>
          <p>
            If you are located in the European Economic Area (EEA) or United Kingdom, we process your personal
            information based on one or more of the following:
          </p>
          <ul>
            <li>Your consent (e.g., for analytics cookies and marketing emails)</li>
            <li>Performance of a contract (e.g., providing downloads or purchases)</li>
            <li>Legitimate interests (e.g., improving and securing the service)</li>
          </ul>

          <h2>California Privacy Rights</h2>
          <p>We do not sell your personal information.</p>
          <p>
            California residents may have the right to request access to or deletion of their personal information. To
            make a request, contact us using the information below.
          </p>

          <h2>10. Third-Party Services</h2>
          <p>
            GridSmith may link to or rely on third-party services. This Privacy Policy does not apply to those third
            parties. We encourage you to review their privacy policies separately.
          </p>

          <h2>11. Children&apos;s Privacy</h2>
          <p>
            GridSmith is not intended for children under the age of 13. We do not knowingly collect personal information
            from children. If you believe a child has provided personal information, please contact us so we can remove
            it.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised
            effective date. Continued use of the service after changes are posted constitutes acceptance of the updated
            policy.
          </p>

          <h2>13. Contact</h2>
          <p>If you have questions about this Privacy Policy, contact:</p>
          <p>
            <strong>Email:</strong> hello@gridsmith.io
            <br />
            <strong>Website:</strong>{' '}
            <a href="https://www.gridsmith.io" target="_blank" rel="noreferrer">
              https://www.gridsmith.io
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

