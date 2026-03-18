import React from 'react';

export default function AboutPage() {
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
      <h1 style={{ marginBottom: '0.75rem' }}>About GridSmith</h1>
      <p style={{ maxWidth: 640, opacity: 0.85 }}>
        GridSmith is a browser-based baseplate generator for modular tabletop terrain. It builds on the
        OpenSCAD Playground to run OpenSCAD in WebAssembly, generate STL files entirely client-side,
        and preview your baseplates before you print.
      </p>
    </main>
  );
}

