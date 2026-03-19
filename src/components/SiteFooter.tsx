import React from 'react';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        <a href="/" className="app-footer-link">Home</a>
        <a href="/viewer" className="app-footer-link">Build</a>
        <a href="/tiles" className="app-footer-link">Get Tiles</a>
        <a href="/about" className="app-footer-link">About</a>
        <a href="/profile" className="app-footer-link">Profile</a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        <a href="/tos" className="app-footer-link">Terms of Service</a>
        <a href="/privacy" className="app-footer-link">Privacy Policy</a>
      </div>
      <div>© {year} GridSmith. All rights reserved.</div>
    </footer>
  );
}

