import React from 'react';

export default function TosPage() {
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
      <h1 style={{ marginBottom: '0.75rem' }}>Terms of Service</h1>
      <p style={{ maxWidth: 640, opacity: 0.85 }}>
        This is a placeholder for the GridSmith Terms of Service. The full terms will be provided here in a future
        update.
      </p>
    </main>
  );
}

