import React from 'react';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      © {year} GridSmith. All rights reserved.
    </footer>
  );
}

