import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { fetchGridSmithCapabilities, fetchTilePackDownloadUrl } from '../billing/gridSmithBilling';
import { catalogOwnedPacksWithPurchases, type OwnedPackWithPurchase } from '../data/ownedPacksMatch';
import { loadTilePackCatalog, tilePackCatalogApiConfigured } from '../data/tilePackCatalog';
import { useAuth } from './AuthContext';

function formatPurchasedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const auth = useAuth();
  const [localOptIn, setLocalOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedError, setOwnedError] = useState<string | null>(null);
  const ownedSectionRef = useRef<HTMLElement | null>(null);

  const [ownedCatalogItems, setOwnedCatalogItems] = useState<OwnedPackWithPurchase[]>([]);
  const [downloadBusyPriceId, setDownloadBusyPriceId] = useState<string | null>(null);
  const [downloadErrorByPriceId, setDownloadErrorByPriceId] = useState<Record<string, string>>({});
  const downloadInFlightRef = useRef(false);

  useEffect(() => {
    document.title = 'GridSmith — Profile';
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  useEffect(() => {
    if (auth.marketingOptIn !== undefined) {
      setLocalOptIn(auth.marketingOptIn);
    }
  }, [auth.marketingOptIn]);

  const signedIn = auth.isSignedIn && !auth.loading;

  const scrollOwnedIntoView = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#owned-packs') return;
    requestAnimationFrame(() => {
      ownedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setOwnedCatalogItems([]);
      setOwnedError(null);
      setOwnedLoading(false);
      return undefined;
    }
    if (!tilePackCatalogApiConfigured()) {
      setOwnedLoading(false);
      setOwnedError(null);
      setOwnedCatalogItems([]);
      return undefined;
    }

    let cancelled = false;
    setOwnedLoading(true);
    setOwnedError(null);
    void (async () => {
      try {
        const [caps, catalog] = await Promise.all([fetchGridSmithCapabilities(), loadTilePackCatalog()]);
        if (cancelled) return;
        setOwnedCatalogItems(catalogOwnedPacksWithPurchases(catalog, caps));
      } catch (e) {
        if (!cancelled) {
          setOwnedError(e instanceof Error ? e.message : 'Could not load owned packs.');
          setOwnedCatalogItems([]);
        }
      } finally {
        if (!cancelled) setOwnedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || ownedLoading) return undefined;
    const onHash = () => {
      scrollOwnedIntoView();
    };
    scrollOwnedIntoView();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [signedIn, ownedLoading, scrollOwnedIntoView]);

  const onSaveMarketing = async () => {
    setError(null);
    setSaving(true);
    try {
      await auth.setMarketingOptIn(localOptIn);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update preference.');
    } finally {
      setSaving(false);
    }
  };

  const shopApiConfigured = tilePackCatalogApiConfigured();

  const startPackDownload = useCallback(async (priceId: string) => {
    if (downloadInFlightRef.current) return;
    downloadInFlightRef.current = true;
    setDownloadBusyPriceId(priceId);
    setDownloadErrorByPriceId((prev) => {
      const next = { ...prev };
      delete next[priceId];
      return next;
    });
    try {
      const { url } = await fetchTilePackDownloadUrl(priceId);
      window.location.assign(url);
    } catch (e) {
      setDownloadErrorByPriceId((prev) => ({
        ...prev,
        [priceId]: e instanceof Error ? e.message : 'Download failed.',
      }));
    } finally {
      downloadInFlightRef.current = false;
      setDownloadBusyPriceId(null);
    }
  }, []);

  return (
    <main className="home-page">
      <section className="home-section home-section-alt">
        <div className="home-page-container">
          <h1 className="home-h1">Profile</h1>
          <div className="home-prose" style={{ maxWidth: 560 }}>
            {auth.loading ? (
              <p>Loading account…</p>
            ) : !signedIn ? (
              <>
                <p>Sign in to manage your account and email preferences.</p>
                <Button
                  type="button"
                  label="Sign in with Google"
                  icon="pi pi-google"
                  className="mt-2"
                  onClick={() => auth.login()}
                />
              </>
            ) : (
              <>
                <p style={{ marginBottom: '1.5rem' }}>
                  Signed in as <strong>{auth.user?.email ?? auth.user?.name ?? 'your account'}</strong>.
                </p>

                <div
                  ref={ownedSectionRef}
                  id="owned-packs"
                  role="region"
                  aria-labelledby="owned-packs-heading"
                  tabIndex={-1}
                >
                  <h2 className="home-h2" id="owned-packs-heading">
                    Owned Packs
                  </h2>
                  <p className="m-0 mb-3 line-height-3" style={{ opacity: 0.88 }}>
                    Packs from your completed checkouts. <strong>Download</strong> starts one pack at a time from
                    secure storage (sign-in required).
                  </p>

                  {!shopApiConfigured ? (
                    <Message
                      severity="info"
                      text="Configure GRIDSMITH_API_BASE_URL to load purchases from your account."
                      className="w-full"
                    />
                  ) : ownedLoading ? (
                    <div className="flex justify-content-center py-4">
                      <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                    </div>
                  ) : ownedError ? (
                    <Message severity="error" text={ownedError} className="w-full" />
                  ) : ownedCatalogItems.length === 0 ? (
                    <p className="m-0 line-height-3" style={{ opacity: 0.9 }}>
                      No purchased packs yet.
                    </p>
                  ) : (
                    <ul className="tile-cart-page-line-list p-0 m-0 list-none">
                      {ownedCatalogItems.map((item) => {
                        const purchasedLabel = formatPurchasedAt(item.purchasedAt);
                        return (
                        <li key={item.slug} className="tile-cart-page-line tile-cart-page-line--owned">
                          <img className="tile-cart-page-line-thumb" src={item.imageSrc} alt="" width={72} height={72} />
                          <div className="tile-cart-page-line-main">
                            <a
                              href={`/tile-details/${encodeURIComponent(item.slug)}`}
                              className="tile-cart-page-line-title"
                            >
                              {item.name}
                            </a>
                            {item.priceLabel ? (
                              <div className="tile-cart-page-line-price">{item.priceLabel}</div>
                            ) : null}
                            {purchasedLabel ? (
                              <div className="tile-cart-page-line-price" style={{ fontSize: '0.85rem', opacity: 0.78 }}>
                                Purchased {purchasedLabel}
                              </div>
                            ) : null}
                          </div>
                          <div className="tile-cart-page-line-actions">
                            {item.stripePriceId ? (
                              <>
                                <Button
                                  type="button"
                                  label={downloadBusyPriceId === item.stripePriceId ? 'Preparing…' : 'Download'}
                                  icon="pi pi-download"
                                  className="p-button-sm p-button-outlined"
                                  disabled={Boolean(downloadBusyPriceId && downloadBusyPriceId !== item.stripePriceId)}
                                  loading={downloadBusyPriceId === item.stripePriceId}
                                  onClick={() => void startPackDownload(item.stripePriceId!)}
                                />
                                {downloadErrorByPriceId[item.stripePriceId] ? (
                                  <p
                                    className="m-0 mt-1"
                                    style={{
                                      fontSize: '0.85rem',
                                      color: 'var(--red-500, #b91c1c)',
                                      maxWidth: 220,
                                    }}
                                    role="alert"
                                  >
                                    {downloadErrorByPriceId[item.stripePriceId]}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                  <Button
                    type="button"
                    label="View tile packs"
                    icon="pi pi-th-large"
                    className="mt-3 p-button-outlined"
                    onClick={() => {
                      window.location.assign('/tiles');
                    }}
                  />
                </div>

                <Divider className="my-4" />

                <div role="region" aria-labelledby="email-preferences-heading">
                  <h2 className="home-h2" id="email-preferences-heading">
                    Email Preferences
                  </h2>
                  <p className="m-0 mb-3 line-height-3" style={{ opacity: 0.88 }}>
                    Choose whether GridSmith may send you product updates and marketing email.
                  </p>

                  <div className="flex align-items-center gap-3 flex-wrap" style={{ marginBottom: '1rem' }}>
                    <InputSwitch
                      inputId="marketing-opt-in"
                      checked={localOptIn}
                      onChange={(e) => setLocalOptIn(!!e.value)}
                      disabled={saving}
                    />
                    <label htmlFor="marketing-opt-in" style={{ cursor: 'pointer' }}>
                      Email me product updates and marketing from GridSmith
                    </label>
                  </div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: '1rem' }}>
                    You can turn this off anytime. New accounts are opted in by default; we only use this flag to
                    decide whether to include you in GridSmith email campaigns.
                  </p>

                  {error ? (
                    <Message severity="error" text={error} className="mb-3 w-full" style={{ maxWidth: '100%' }} />
                  ) : null}

                  <Button
                    type="button"
                    label={saving ? 'Saving…' : 'Save email preference'}
                    icon="pi pi-check"
                    disabled={saving || localOptIn === auth.marketingOptIn}
                    onClick={() => void onSaveMarketing()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
