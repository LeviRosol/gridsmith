import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Galleria } from 'primereact/galleria';
import { Image } from 'primereact/image';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import type { MenuItem } from 'primereact/menuitem';
import { trackTileSetAddClick } from '../analytics.ts';
import { startGridSmithCheckoutForCartPriceIds } from '../billing/gridSmithBilling';
import { useAuth } from './AuthContext';
import { useTileCart } from '../cart/TileCartContext';
import { isTileSetBuyable, cartHasPriceId } from '../cart/tileCartEligibility';
import type { TileSetCatalogItem } from '../data/placeholderTileSets';
import { getTileSetBySlug } from '../data/placeholderTileSets';
import {
  findTileSetBySlug,
  loadTilePackCatalog,
  tilePackCatalogApiConfigured,
} from '../data/tilePackCatalog';
import {
  buildGalleryFileUrls,
  DEFAULT_TILE_PACK_INCLUDED_FILES_BULLETS,
  fetchTilePackContent,
  isSafeTilePackGalleryFolder,
} from '../data/tilePackContent';
import type { TilePackContent } from '../data/tilePackContent';

const DESIGNED_FOR_TABLE_BULLETS = [
  '30mm scale — works with standard 1" minis',
  'Flat, playable surfaces — no awkward elevation issues',
  'Dual-sided walls — fewer tiles, more flexibility',
  'Clean, consistent style — built to look good and print well',
];

/** Shown under the price on every tile set detail page. */
const BUYBOX_HIGHLIGHT_BULLETS = [
  "True 5' hallways",
  'Tiles stay locked in place (no magnets or bulky bases)',
  'Designed for real gameplay, not display',
];

type TileDetailGalleriaItem = { itemImageSrc: string };

function TileDetailGalleriaSlide({
  item,
  setSlug,
  previewEnabled,
  onOpenFullscreen,
}: {
  item: TileDetailGalleriaItem;
  setSlug: string;
  previewEnabled: boolean;
  onOpenFullscreen: () => void;
}) {
  const image = (
    <Image
      key={`${setSlug}-${item.itemImageSrc}`}
      src={item.itemImageSrc}
      alt=""
      preview={false}
      imageClassName="tile-detail-image"
      loading="eager"
      className="tile-detail-image-wrap"
    />
  );

  if (!previewEnabled) {
    return image;
  }

  return (
    <div
      className="tile-detail-image-preview-trigger"
      role="button"
      tabIndex={0}
      aria-label="Open image gallery preview"
      onClick={(e) => {
        e.stopPropagation();
        onOpenFullscreen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onOpenFullscreen();
        }
      }}
    >
      {image}
      <span className="tile-detail-image-preview-icon pi pi-search-plus" aria-hidden />
    </div>
  );
}

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
  const auth = useAuth();
  const { addOrUpdateLine, items, isPackOwned } = useTileCart();
  const [set, setSet] = useState<TileSetCatalogItem | undefined>(() =>
    slug && !tilePackCatalogApiConfigured() ? getTileSetBySlug(slug) : undefined,
  );
  const [catalogLoading, setCatalogLoading] = useState(() => tilePackCatalogApiConfigured());
  const [activeIndex, setActiveIndex] = useState(0);
  const [comingSoonDialogVisible, setComingSoonDialogVisible] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cartAddedFlash, setCartAddedFlash] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [detailPackContent, setDetailPackContent] = useState<TilePackContent | null | undefined>(undefined);
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);
  const fullscreenGalleriaRef = useRef<Galleria>(null);

  useEffect(() => {
    if (!slug) {
      setSet(undefined);
      setCatalogLoading(false);
      return undefined;
    }
    if (!tilePackCatalogApiConfigured()) {
      setSet(getTileSetBySlug(slug));
      setCatalogLoading(false);
      return undefined;
    }
    let cancelled = false;
    setCatalogLoading(true);
    void loadTilePackCatalog().then((list) => {
      if (cancelled) return;
      setSet(findTileSetBySlug(list, slug));
      setCatalogLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setActiveIndex(0);
    setComingSoonDialogVisible(false);
    setCheckoutError(null);
    setCartAddedFlash(false);
    setCheckoutBusy(false);
    setDetailPackContent(undefined);
  }, [set?.slug]);

  useEffect(() => {
    if (!set || set.slug !== slug) {
      setDetailPackContent(undefined);
      return undefined;
    }
    let cancelled = false;
    setDetailPackContent(undefined);
    void fetchTilePackContent(slug).then((content) => {
      if (!cancelled) setDetailPackContent(content);
    });
    return () => {
      cancelled = true;
    };
  }, [set, slug]);

  const breadcrumbItems: MenuItem[] = useMemo(() => {
    if (!set) return [];
    return [
      { label: 'Tile sets', url: '/tiles' },
      { label: set.name },
    ];
  }, [set]);

  const owned = useMemo(() => (set ? isPackOwned(set) : false), [set, isPackOwned]);

  const inCart = useMemo(() => {
    if (!set || owned) return false;
    return isTileSetBuyable(set) && cartHasPriceId(items, set.stripePriceId);
  }, [set, items, owned]);

  const mergedDescription = useMemo(() => {
    if (!set) return '';
    const fromJson = detailPackContent?.description?.trim();
    if (fromJson) return fromJson;
    return (set.description && set.description.trim()) || '';
  }, [set, detailPackContent]);

  const mergedWhatYouGet = useMemo(() => {
    return detailPackContent?.whatYouGet ?? set?.whatYouGet;
  }, [detailPackContent, set]);

  const includedFilesSection = useMemo(() => {
    const heading =
      detailPackContent?.includedFiles?.heading?.trim() || 'Included Files';
    if (detailPackContent?.includedFiles?.bullets?.length) {
      return { heading, bullets: detailPackContent.includedFiles.bullets };
    }
    return { heading, bullets: DEFAULT_TILE_PACK_INCLUDED_FILES_BULLETS };
  }, [detailPackContent]);

  const gallerySupportingUrls = useMemo(() => {
    if (!set || set.slug !== slug) return [];
    const pack = detailPackContent;
    if (pack === undefined) return [];
    if (!pack?.gallery?.length) return [];
    const folder = (pack.galleryFolder ?? set.imagePath ?? '').trim();
    if (!isSafeTilePackGalleryFolder(folder)) return [];
    return buildGalleryFileUrls(folder, pack.gallery);
  }, [set, slug, detailPackContent]);

  const allImages = useMemo(() => {
    if (!set) return [] as string[];
    const hero = set.imageSrc?.trim() || '/logo512.png';
    return [hero, ...gallerySupportingUrls];
  }, [set, gallerySupportingUrls]);

  useEffect(() => {
    setActiveIndex((prev) => {
      const maxIdx = Math.max(0, allImages.length - 1);
      return Math.min(prev, maxIdx);
    });
  }, [allImages.length]);

  const galleriaItems: TileDetailGalleriaItem[] = useMemo(
    () => allImages.map((itemImageSrc) => ({ itemImageSrc })),
    [allImages],
  );

  const clampGalleryIndex = useCallback(
    (index: number) => Math.max(0, Math.min(Math.max(0, allImages.length - 1), index)),
    [allImages.length],
  );

  const openFullscreenPreview = useCallback(() => {
    if (!set || set.disabled || allImages.length === 0) return;
    fullscreenGalleriaRef.current?.show();
  }, [set, allImages.length]);

  const stepFullscreenPreview = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => clampGalleryIndex(prev + delta));
    },
    [clampGalleryIndex],
  );

  useEffect(() => {
    if (!fullscreenPreviewOpen) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        fullscreenGalleriaRef.current?.hide();
        return;
      }
      if (allImages.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFullscreenPreview(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFullscreenPreview(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenPreviewOpen, allImages.length, stepFullscreenPreview]);

  useEffect(() => {
    if (catalogLoading) return undefined;
    if (set) {
      document.title = `GridSmith — ${set.name}`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', metaExcerpt(mergedDescription, 155));
      }
    } else if (slug) {
      document.title = 'GridSmith — Tile set not found';
    }
    return () => {
      document.title = 'GridSmith';
    };
  }, [set, slug, catalogLoading, mergedDescription]);

  if (catalogLoading) {
    return (
      <main className="home-page tile-shop-page">
        <section className="home-section home-section-hero home-section-hero--child">
          <div className="home-page-container flex justify-content-center py-6">
            <ProgressSpinner style={{ width: '48px', height: '48px' }} />
          </div>
        </section>
      </main>
    );
  }

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

  const buyable = isTileSetBuyable(set);

  const addButtonLabel = set.addToCartDisabled
    ? 'Coming soon'
    : !buyable
      ? 'Unavailable'
      : owned
        ? 'You own this pack'
        : inCart
          ? 'Checkout'
          : 'Add to cart';
  const addButtonIcon =
    set.addToCartDisabled || !buyable
      ? 'pi pi-shopping-cart'
      : owned
        ? 'pi pi-check'
        : inCart
          ? 'pi pi-credit-card'
          : 'pi pi-shopping-cart';
  const addButtonClassName = [
    'w-full',
    'font-bold',
    'tile-detail-add-cart',
    inCart && buyable && !set.addToCartDisabled && !owned ? null : 'p-button-outlined',
  ]
    .filter(Boolean)
    .join(' ');
  const addButtonDisabled = Boolean(
    set.disabled || (!buyable && !set.addToCartDisabled) || checkoutBusy || owned,
  );

  const handleCheckoutFromCart = async () => {
    if (!auth.isSignedIn) {
      setCheckoutError(null);
      auth.login();
      return;
    }
    if (!items.length) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const { url } = await startGridSmithCheckoutForCartPriceIds(
        items.map((row) => row.priceId),
        { successPath: '/cart?checkout=success', cancelPath: '/cart' },
      );
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout could not be started.';
      setCheckoutError(msg);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const handlePrimaryClick = () => {
    trackTileSetAddClick(set.name);
    if (owned) {
      return;
    }
    if (set.addToCartDisabled) {
      setComingSoonDialogVisible(true);
      return;
    }
    if (!set.stripePriceId?.trim()) {
      setCheckoutError('Checkout is not available for this listing yet.');
      return;
    }
    if (!auth.isSignedIn) {
      setCheckoutError(null);
      auth.login();
      return;
    }
    if (!buyable) {
      setCheckoutError('This pack cannot be added to the cart yet.');
      return;
    }
    if (inCart) {
      void handleCheckoutFromCart();
      return;
    }
    const priceId = set.stripePriceId.trim();
    setCheckoutError(null);
    addOrUpdateLine({
      priceId,
      slug,
      name: set.name,
      priceLabel: set.priceLabel,
      imageSrc: set.imageSrc,
    });
    setCartAddedFlash(true);
    window.setTimeout(() => {
      setCartAddedFlash(false);
    }, 3500);
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
                    <Galleria
                      key={set.slug}
                      value={galleriaItems}
                      activeIndex={activeIndex}
                      onItemChange={(e) => {
                        const max = Math.max(0, galleriaItems.length - 1);
                        setActiveIndex(Math.max(0, Math.min(max, e.index)));
                      }}
                      numVisible={5}
                      responsiveOptions={[
                        { breakpoint: '1024px', numVisible: 4 },
                        { breakpoint: '768px', numVisible: 3 },
                      ]}
                      showThumbnails={galleriaItems.length > 1}
                      showItemNavigators={galleriaItems.length > 1}
                      showThumbnailNavigators={galleriaItems.length > 4}
                      item={(item: TileDetailGalleriaItem) => (
                        <TileDetailGalleriaSlide
                          item={item}
                          setSlug={set.slug}
                          previewEnabled={!set.disabled}
                          onOpenFullscreen={openFullscreenPreview}
                        />
                      )}
                      thumbnail={(item: TileDetailGalleriaItem) => (
                        <img
                          src={item.itemImageSrc}
                          alt=""
                          className="tile-detail-galleria-thumb-img"
                          loading="lazy"
                        />
                      )}
                      className="tile-detail-galleria w-full max-w-full"
                    />
                    {set.disabled ? (
                      <div className="tile-detail-image-badge">
                        <Tag value="Coming soon" />
                      </div>
                    ) : null}
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
                  {checkoutError ? (
                    <Message severity="error" text={checkoutError} className="w-full mb-2" />
                  ) : null}
                  {cartAddedFlash ? (
                    <Message severity="success" text="Added to your cart." className="w-full mb-2" />
                  ) : null}
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
                    {mergedDescription
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
                    label={addButtonLabel}
                    icon={addButtonIcon}
                    className={addButtonClassName}
                    disabled={addButtonDisabled}
                    loading={checkoutBusy}
                    onClick={() => {
                      handlePrimaryClick();
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

                  <div className="flex flex-column gap-4 mt-4">
                    <TileDetailSpecList
                      heading={includedFilesSection.heading}
                      items={includedFilesSection.bullets}
                      sectionId="tile-detail-included-files"
                    />

                    {mergedWhatYouGet ? (
                      <section
                        className="tile-detail-spec-section tile-detail-what-you-get"
                        aria-labelledby={`tile-detail-what-you-get-${set.slug}`}
                      >
                        <h3 className="tile-detail-spec-heading" id={`tile-detail-what-you-get-${set.slug}`}>
                          {mergedWhatYouGet.heading}
                        </h3>
                        {mergedWhatYouGet.intro ? (
                          <p className="tile-detail-spec-prose tile-detail-spec-prose--preline m-0 line-height-3">
                            {normalizeMultilineField(mergedWhatYouGet.intro)}
                          </p>
                        ) : null}
                        <ul className={`tile-detail-spec-list${mergedWhatYouGet.intro ? ' mt-2' : ''}`}>
                          {mergedWhatYouGet.bullets.map((item, i) => (
                            <li key={i}>{normalizeMultilineField(item)}</li>
                          ))}
                        </ul>
                        {mergedWhatYouGet.closing ? (
                          <p className="tile-detail-spec-prose tile-detail-spec-prose--preline m-0 mt-3 line-height-3">
                            {normalizeMultilineField(mergedWhatYouGet.closing)}
                          </p>
                        ) : null}
                      </section>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!set.disabled && galleriaItems.length > 0 ? (
            <Galleria
              ref={fullscreenGalleriaRef}
              value={galleriaItems}
              activeIndex={activeIndex}
              onItemChange={(e) => {
                setActiveIndex(clampGalleryIndex(e.index));
              }}
              fullScreen
              closeOnEscape
              circular={galleriaItems.length > 1}
              showItemNavigators={galleriaItems.length > 1}
              showThumbnails={false}
              onShow={() => setFullscreenPreviewOpen(true)}
              onHide={() => setFullscreenPreviewOpen(false)}
              item={(item: TileDetailGalleriaItem) => (
                <img
                  src={item.itemImageSrc}
                  alt=""
                  className="tile-detail-fullscreen-image"
                />
              )}
              thumbnail={(item: TileDetailGalleriaItem) => (
                <img src={item.itemImageSrc} alt="" className="tile-detail-galleria-thumb-img" />
              )}
              className="tile-detail-galleria-fullscreen"
            />
          ) : null}

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
