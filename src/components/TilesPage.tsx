import React, { useEffect } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { PLACEHOLDER_TILE_SETS, type TileSetCatalogItem } from '../data/placeholderTileSets';

const TITLE = 'GridSmith — Tile sets';
const DESCRIPTION = 'Browse GridSmith tile packs and themed STL sets.';

const EXCERPT_LEN = 160;

function excerpt(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  let cut = t.slice(0, maxLen);
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf(' '));
  if (lastBreak >= Math.floor(maxLen * 0.55)) {
    cut = cut.slice(0, lastBreak);
  }
  return `${cut.trimEnd()}…`;
}

function TileSetCardImage({ set }: { set: TileSetCatalogItem }) {
  const img = (
    <img
      className="tile-shop-card-image"
      src={set.imageSrc}
      alt=""
      loading="lazy"
      width={512}
      height={512}
    />
  );
  if (set.disabled) {
    return img;
  }
  return (
    <a
      href={`/tile-details/${set.slug}`}
      className="tile-shop-card-image-hit"
      aria-label={`View details for ${set.name}`}
    >
      {img}
    </a>
  );
}

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
    <main className="home-page tile-shop-page">
      <section className="home-section home-section-hero home-section-hero--child">
        <div className="home-page-container">
          <p className="home-eyebrow">Shop</p>
          <h1 className="home-h1">Tile sets</h1>
          <p className="home-subhead">
            Themed tile packs for your GridSmith grids. Checkout and downloads will connect here in a future release.
          </p>
        </div>
      </section>

      <section className="home-section home-section-alt tile-shop-grid-section">
        <div className="home-page-container">
          <div className="grid">
            {PLACEHOLDER_TILE_SETS.map((set) => (
              <div key={set.slug} className="col-12 sm:col-6 xl:col-4">
                <div className="tile-shop-card-shell">
                  {set.disabled ? (
                    <div className="tile-shop-card-coming-soon" role="status">
                      Coming soon
                    </div>
                  ) : null}
                  <Card
                    className={[
                      'tile-shop-card',
                      'h-full',
                      set.slug === 'tavern-set' ? 'tile-shop-card--border-red' : '',
                      set.disabled ? 'tile-shop-card--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-disabled={set.disabled ? true : undefined}
                    header={
                      <div className="tile-shop-card-image-wrap">
                        <TileSetCardImage set={set} />
                        <div className="tile-shop-card-tag">
                          <Tag value={set.tagLabel} rounded />
                        </div>
                      </div>
                    }
                    title={set.name}
                    subTitle={set.priceLabel}
                  >
                    <p className="tile-shop-card-blurb m-0 line-height-3">{excerpt(set.description, EXCERPT_LEN)}</p>
                    <div className="mt-3">
                      {set.disabled ? (
                        <Button type="button" label="View details" className="w-full font-bold" disabled />
                      ) : (
                        <a
                          href={`/tile-details/${set.slug}`}
                          className="p-button p-component font-bold w-full text-center block"
                        >
                          <span className="p-button-label">View Details</span>
                        </a>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
