import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { trackTileSetAddClick, trackTileSetViewDetails } from '../analytics.ts';
import type { TileSetCatalogItem } from '../data/placeholderTileSets';
import { PLACEHOLDER_TILE_SETS } from '../data/placeholderTileSets';
import { loadTilePackCatalog, tilePackCatalogApiConfigured } from '../data/tilePackCatalog';
import { isTileSetBuyable, cartHasPriceId } from '../cart/tileCartEligibility';
import { useAuth } from './AuthContext';
import { useTileCart } from '../cart/TileCartContext';
import { Message } from 'primereact/message';
import { startGridSmithCheckoutForCartPriceIds } from '../billing/gridSmithBilling';

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
      onClick={() => trackTileSetViewDetails(set.name)}
    >
      {img}
    </a>
  );
}

function TilePackCartOrCheckoutButton({
  set,
  onCheckoutError,
}: {
  set: TileSetCatalogItem;
  onCheckoutError: (msg: string | null) => void;
}) {
  const auth = useAuth();
  const { addOrUpdateLine, items } = useTileCart();
  const [busy, setBusy] = useState(false);
  const pid = set.stripePriceId?.trim() ?? '';
  const inCart = Boolean(pid && cartHasPriceId(items, pid));

  return (
    <Button
      type="button"
      label={inCart ? 'Checkout' : 'Add to cart'}
      icon={inCart ? 'pi pi-credit-card' : 'pi pi-shopping-cart'}
      className={`w-full font-bold${inCart ? '' : ' p-button-outlined'}`}
      loading={busy}
      disabled={busy}
      onClick={() => {
        trackTileSetAddClick(set.name);
        if (!auth.isSignedIn) {
          auth.login();
          return;
        }
        if (!pid) return;
        if (inCart) {
          setBusy(true);
          onCheckoutError(null);
          void (async () => {
            try {
              const { url } = await startGridSmithCheckoutForCartPriceIds(
                items.map((row) => row.priceId),
                { successPath: '/cart?checkout=success', cancelPath: '/cart' },
              );
              window.location.assign(url);
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Checkout could not be started.';
              onCheckoutError(msg);
            } finally {
              setBusy(false);
            }
          })();
          return;
        }
        setBusy(true);
        try {
          addOrUpdateLine({
            priceId: pid,
            slug: set.slug,
            name: set.name,
            priceLabel: set.priceLabel,
            imageSrc: set.imageSrc,
          });
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export default function TilesPage() {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [sets, setSets] = useState<TileSetCatalogItem[] | null>(() =>
    tilePackCatalogApiConfigured() ? null : [...PLACEHOLDER_TILE_SETS],
  );

  useEffect(() => {
    let cancelled = false;
    if (!tilePackCatalogApiConfigured()) return undefined;
    void loadTilePackCatalog().then((list) => {
      if (!cancelled) setSets(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
            Add themed tile packs to your cart and checkout when you&apos;re ready.
          </p>
        </div>
      </section>

      <section className="home-section home-section-alt tile-shop-grid-section">
        <div className="home-page-container">
          {checkoutError ? (
            <div className="flex align-items-start gap-2 w-full mb-3">
              <Message severity="error" text={checkoutError} className="flex-1 w-full m-0" />
              <Button
                type="button"
                icon="pi pi-times"
                rounded
                text
                severity="secondary"
                aria-label="Dismiss error"
                className="flex-shrink-0 mt-1"
                onClick={() => setCheckoutError(null)}
              />
            </div>
          ) : null}
          {sets == null ? (
            <div className="flex justify-content-center py-6">
              <ProgressSpinner style={{ width: '48px', height: '48px' }} />
            </div>
          ) : (
            <div className="grid">
              {sets.map((set) => (
                <div key={set.slug} className="col-12 sm:col-6 lg:col-4 xl:col-3">
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
                        set.slug === 'tavern-set' || set.slug === 'tavern-core-set'
                          ? 'tile-shop-card--border-red'
                          : '',
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
                      <p className="tile-shop-card-blurb m-0 line-height-3">
                        {excerpt(set.description, EXCERPT_LEN)}
                      </p>
                      <div className="mt-3 flex flex-column gap-2">
                        {set.disabled ? (
                          <Button type="button" label="View details" className="w-full font-bold" disabled />
                        ) : (
                          <>
                            <a
                              href={`/tile-details/${set.slug}`}
                              className="p-button p-component font-bold w-full text-center block"
                              onClick={() => trackTileSetViewDetails(set.name)}
                            >
                              <span className="p-button-label">View details</span>
                            </a>
                            {isTileSetBuyable(set) ? (
                              <TilePackCartOrCheckoutButton set={set} onCheckoutError={setCheckoutError} />
                            ) : null}
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
