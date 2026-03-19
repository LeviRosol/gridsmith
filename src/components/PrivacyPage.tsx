import React from 'react';

export default function PrivacyPage() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ marginBottom: '0.75rem' }}>Privacy Policy</h1>

      <p style={{ maxWidth: 760, opacity: 0.85, marginBottom: '1rem' }}>
        GridSmith (“we”, “us”, “our”) is committed to protecting your privacy.
        This Privacy Policy explains how we handle information when you use gridsmith.io.
      </p>

      <div style={{ maxWidth: 760, textAlign: 'left', opacity: 0.9, lineHeight: 1.6 }}>
        <h3 style={{ marginTop: '1.25rem' }}>1. What information we collect</h3>
        <p>
          GridSmith is primarily a client-side application. Your baseplate configuration and generation
          happen in your browser. When you sign in, authentication and identity information are handled by
          Amazon Cognito and Google Sign-In.
        </p>

        <h3 style={{ marginTop: '1.25rem' }}>2. How we use information</h3>
        <p>
          We use information provided through authentication to determine access to authenticated features
          (such as the `/viewer` route) and to personalize your experience where applicable.
        </p>

        <h3 style={{ marginTop: '1.25rem' }}>3. Cookies and local storage</h3>
        <p>
          We may store user preferences in your browser (for example, theme settings). Browser storage is
          used to improve the usability of the site.
        </p>

        <h3 style={{ marginTop: '1.25rem' }}>4. Data retention</h3>
        <p>
          We retain authentication-related data according to the policies of Amazon Cognito and your account’s
          settings.
        </p>

        <h3 style={{ marginTop: '1.25rem' }}>5. Changes to this policy</h3>
        <p>
          We may update this Privacy Policy from time to time. The updated version will be posted on this page.
        </p>
      </div>
    </main>
  );
}

