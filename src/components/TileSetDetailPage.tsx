import React, { useEffect, useMemo, useState } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import type { MenuItem } from 'primereact/menuitem';
import { getTileSetBySlug } from '../data/placeholderTileSets';

const THUMB_KEYS = [0, 1, 2] as const;

function metaExcerpt(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

export default function TileSetDetailPage({ slug }: { slug: string }) {
  const set = slug ? getTileSetBySlug(slug) : undefined;
  const [activeThumb, setActiveThumb] = useState(0);
  const [comingSoonDialogVisible, setComingSoonDialogVisible] = useState(false);

  useEffect(() => {
    setActiveThumb(0);
    setComingSoonDialogVisible(false);
  }, [set?.slug]);

  useEffect(() => {
    if (set) {
      document.title = `GridSmith — ${set.name}`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', metaExcerpt(set.description, 155));
      }
    } else {
      document.title = 'GridSmith — Tile set not found';
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, [set, slug]);

  const breadcrumbItems: MenuItem[] = useMemo(() => {
    if (!set) return [];
    return [
      { label: 'Tile sets', url: '/tiles' },
      { label: set.name },
    ];
  }, [set]);

  if (!slug || !set) {
    return (
      <main className="home-page tile-shop-page">
        <section className="home-section home-section-hero home-section-hero--child">
          <div className="home-page-container">
            <h1 className="home-h1">Tile set not found</h1>
            <p className="home-subhead">No tile pack matches that link.</p>
            <div className="home-actions mt-2">
              <Button
                type="button"
                label="Back to tile sets"
                onClick={() => {
                  window.location.assign('/tiles');
                }}
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  const priceDisplay = set.priceLabel ?? (set.disabled ? 'Coming soon' : null);

  return (
    <main className="home-page tile-detail-page">
      <section className="home-section home-section-alt tile-detail-section">
        <div className="home-page-container tile-detail-container">
          <nav className="tile-detail-breadcrumb" aria-label="Breadcrumb">
            <BreadCrumb
              home={{ icon: 'pi pi-home', url: '/' }}
              model={breadcrumbItems}
            />
          </nav>
          <Divider className="my-3" />

          <div className="grid">
            <div className="col-12 lg:col-6">
              <div className="tile-detail-gallery">
                <div className="tile-detail-image-frame">
                  <img
                    className="tile-detail-image"
                    src={set.imageSrc}
                    alt=""
                    loading="eager"
                    width={512}
                    height={512}
                  />
                  {set.disabled ? (
                    <div className="tile-detail-image-badge">
                      <Tag value="Coming soon" />
                    </div>
                  ) : null}
                </div>
                <div className="tile-detail-thumbs" role="list">
                  {THUMB_KEYS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      role="listitem"
                      className={`tile-detail-thumb${activeThumb === i ? ' tile-detail-thumb--active' : ''}`}
                      onClick={() => setActiveThumb(i)}
                      aria-label={`Product image ${i + 1}`}
                      aria-current={activeThumb === i ? 'true' : undefined}
                    >
                      <img src={set.imageSrc} alt="" width={96} height={96} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-6">
              <div className="tile-detail-buybox">
                <Tag value={set.tagLabel} rounded className="mb-2" />
                <h1 className="tile-detail-title">{set.name}</h1>
                {priceDisplay ? (
                  <div
                    className={`tile-detail-price${set.priceLabel ? '' : ' tile-detail-price--muted'}`}
                  >
                    {priceDisplay}
                  </div>
                ) : null}

                <div className="tile-detail-description-block mt-3">
                  <h2 className="tile-detail-description-heading">Description</h2>
                  <p className="tile-detail-description-body m-0 line-height-3">{set.description}</p>
                </div>

                <Divider className="my-4" />

                <Button
                  type="button"
                  label="Add to cart"
                  icon="pi pi-shopping-cart"
                  className="w-full font-bold tile-detail-add-cart"
                  onClick={() => {
                    if (set.addToCartDisabled) {
                      setComingSoonDialogVisible(true);
                    }
                  }}
                />
                <div className="text-center mt-2">
                  <Button
                    type="button"
                    label="Continue shopping"
                    text
                    className="w-full"
                    onClick={() => {
                      window.location.assign('/tiles');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Dialog
            header="Coming soon"
            visible={comingSoonDialogVisible}
            modal
            dismissableMask
            closable
            onHide={() => {
              setComingSoonDialogVisible(false);
            }}
            style={{ width: 'min(96vw, 440px)' }}
            footer={
              <div className="flex flex-row gap-2 justify-content-end flex-wrap">
                <Button
                  type="button"
                  label="Ok"
                  onClick={() => {
                    setComingSoonDialogVisible(false);
                  }}
                />
              </div>
            }
          >
            <div className="line-height-3">
              <p className="m-0">
                We are putting the finishing touches on the {set.name} tiles, and will be releasing them very soon.
              </p>
              <p className="m-0 mt-3">
                Check back in a couple days, or create an account to get notified when they are released.
              </p>
            </div>
          </Dialog>
        </div>
      </section>
    </main>
  );
}
