import React from 'react';

export default function ProfilePage() {
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
      <h1 style={{ marginBottom: '0.75rem' }}>Profile</h1>
      <p style={{ maxWidth: 640, opacity: 0.85 }}>
        Profile and account settings will appear here in a future release. For now this page is a stub
        to reserve the `/profile` route.
      </p>
    </main>
  );
}

