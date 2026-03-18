import React from 'react';

export default function TilesPage() {
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
      <h1 style={{ marginBottom: '0.75rem' }}>Get Tiles</h1>
      <p style={{ maxWidth: 640, opacity: 0.85 }}>
        Tile packs and tile generation tools will live here in a future release. For now, you can use
        the baseplate generator viewer to create grids that match your existing tiles.
      </p>
    </main>
  );
}

