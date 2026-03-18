import React from 'react';

export default function HomePage() {
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
      <h1 style={{ marginBottom: '0.75rem' }}>GridSmith Baseplate Generator</h1>
      <p style={{ maxWidth: 640, opacity: 0.85 }}>
        Configure modular base grids for your tabletop terrain and export printable STL files. Use the
        viewer to adjust rows, columns, and cell size, then generate a baseplate that fits your tiles.
      </p>
    </main>
  );
}

