import React, { useEffect } from 'react';

const TITLE = 'GridSmith — Get Tiles';
const DESCRIPTION =
  'Download free GridSmith starter tiles, plan future tile packs, and learn about physical terrain options.';

export default function TilesPage() {
  useEffect(() => {
    document.title = TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', DESCRIPTION);
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  return (
    <main className="home-page">
      <section className="home-section home-section-hero">
        <div className="home-page-container">
          <p className="home-eyebrow">Get tiles</p>
          <h1 className="home-h1">Tile pack downloads &amp; what&apos;s next</h1>
          <p className="home-subhead">
            Tile packs and tile generation tools will expand here in future releases. For now, you can use the baseplate
            generator to create grids that match your tiles, and watch this space for downloadable starter sets.
          </p>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="home-page-container">
          <p className="home-eyebrow">Physical tiles</p>
          <h2 className="home-h2">Coming soon</h2>
          <p className="home-subhead">
            Physical starter packs are not available yet. When they launch, this is where you&apos;ll be able to buy base
            grids and core tiles without a printer.
          </p>
          <p className="home-supporting">
            In the meantime, generate a base grid and grab the free starter tiles to print at home.
          </p>
          <div className="home-actions">
            <a href="/baseplate" className="p-button p-component home-page-cta">
              <span className="p-button-label">Open the generator</span>
            </a>
            <a href="/" className="p-button p-component p-button-outlined home-page-cta">
              <span className="p-button-label">Back to home</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
