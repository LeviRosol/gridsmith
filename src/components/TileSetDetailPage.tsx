import React, { useEffect, useMemo, useState } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import type { MenuItem } from 'primereact/menuitem';
import { getTileSetBySlug } from '../data/placeholderTileSets';

const THUMB_KEYS = [0, 1, 2] as const;

const DESIGNED_FOR_TABLE_BULLETS = [
  '30mm scale — works with standard 1" minis',
  'Flat, playable surfaces — no awkward elevation issues',
  'Dual-sided walls — fewer tiles, more flexibility',
  'Clean, consistent style — built to look good and print well',
];

const INCLUDED_FILES_BULLETS = [
  'High resolution STLs (128 and 256 variants)',
  'Ready for FDM printing (0.4 nozzle friendly)',
  'Clean geometry optimized for slicing',
];

/** Shown under the price on every tile set detail page. */
const BUYBOX_HIGHLIGHT_BULLETS = [
  "True 5' hallways",
  'Tiles stay locked in place (no magnets or bulky bases)',
  'Designed for real gameplay, not display',
];

function TileDetailSpecList({
  heading,
  items,
  sectionId,
  afterList,
}: {
  heading: string;
  items: string[];
  sectionId: string;
  afterList?: React.ReactNode;
}) {
  return (
    <section className="tile-detail-spec-section" aria-labelledby={sectionId}>
      <h3 className="tile-detail-spec-heading" id={sectionId}>
        {heading}
      </h3>
      <ul className="tile-detail-spec-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {afterList}
    </section>
  );
}

/** Trim each line so template-literal indentation does not show; keeps intentional line breaks. */
function normalizeMultilineField(s: string): string {
  return s
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function metaExcerpt(text: string, maxLen: number) {
  const t = text.replace(/\s+/g, ' ').trim();
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

  const priceForAddToCart = set.priceLabel ?? priceDisplay;
  const addToCartLabel =
    priceForAddToCart != null && priceForAddToCart !== ''
      ? `Add ${set.name}\u2013 ${priceForAddToCart}`
      : `Add ${set.name}`;

  const handleAddToCartClick = () => {
    if (set.addToCartDisabled) {
      setComingSoonDialogVisible(true);
    }
  };

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

          <div className="grid tile-detail-main-row">
            <div className="col-12 lg:col-6 tile-detail-main-col">
              <div className="tile-detail-column tile-detail-column--left">
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

                <div className="mt-4">
                  <TileDetailSpecList
                    heading="Designed for the Table"
                    items={DESIGNED_FOR_TABLE_BULLETS}
                    sectionId="tile-detail-designed-for-table"
                    afterList={
                      <p className="tile-detail-spec-prose m-0 mt-3 line-height-3">
                        Bring your own furniture and scatter terrain—GridSmith is built to work with what you already
                        have.
                      </p>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-6 tile-detail-main-col">
              <div className="tile-detail-column tile-detail-column--right">
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

                  <ul
                    className={`tile-detail-spec-list m-0${priceDisplay ? ' mt-2' : ' mt-3'}`}
                    aria-label="Product highlights"
                  >
                    {BUYBOX_HIGHLIGHT_BULLETS.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <div className="tile-detail-description-block mt-3">
                    <h2 className="tile-detail-description-heading">Description</h2>
                    {set.description
                      .trim()
                      .split(/\n\n+/)
                      .map((para, i) => (
                        <p
                          key={i}
                          className={`tile-detail-description-body m-0 line-height-3${i > 0 ? ' mt-3' : ''}`}
                        >
                          {para.trim()}
                        </p>
                      ))}
                  </div>

                  <Divider className="my-4" />

                  <Button
                    type="button"
                    label={addToCartLabel}
                    icon="pi pi-shopping-cart"
                    className="w-full font-bold tile-detail-add-cart"
                    onClick={handleAddToCartClick}
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

                  <div className="flex flex-column gap-4 mt-4">
                    <TileDetailSpecList
                      heading="Included Files"
                      items={INCLUDED_FILES_BULLETS}
                      sectionId="tile-detail-included-files"
                    />

                    {set.whatYouGet ? (
                      <section
                        className="tile-detail-spec-section tile-detail-what-you-get"
                        aria-labelledby={`tile-detail-what-you-get-${set.slug}`}
                      >
                        <h3 className="tile-detail-spec-heading" id={`tile-detail-what-you-get-${set.slug}`}>
                          {set.whatYouGet.heading}
                        </h3>
                        {set.whatYouGet.intro ? (
                          <p className="tile-detail-spec-prose tile-detail-spec-prose--preline m-0 line-height-3">
                            {normalizeMultilineField(set.whatYouGet.intro)}
                          </p>
                        ) : null}
                        <ul className={`tile-detail-spec-list${set.whatYouGet.intro ? ' mt-2' : ''}`}>
                          {set.whatYouGet.bullets.map((item, i) => (
                            <li key={i}>{normalizeMultilineField(item)}</li>
                          ))}
                        </ul>
                        {set.whatYouGet.closing ? (
                          <p className="tile-detail-spec-prose tile-detail-spec-prose--preline m-0 mt-3 line-height-3">
                            {normalizeMultilineField(set.whatYouGet.closing)}
                          </p>
                        ) : null}
                      </section>
                    ) : null}
                  </div>

                  <Divider className="my-4" />

                  <Button
                    type="button"
                    label={addToCartLabel}
                    icon="pi pi-shopping-cart"
                    className="w-full font-bold tile-detail-add-cart"
                    onClick={handleAddToCartClick}
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
