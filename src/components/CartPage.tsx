import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { fetchGridSmithCapabilities, startGridSmithCheckoutForCartPriceIds } from '../billing/gridSmithBilling';
import { tilePackCatalogApiConfigured } from '../data/tilePackCatalog';
import { useTileCart } from '../cart/TileCartContext';
import { useAuth } from './AuthContext';

const TITLE = 'GridSmith — Cart';

export default function CartPage() {
  const auth = useAuth();
  const { items, removeLine, clearCart } = useTileCart();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [flashCancel, setFlashCancel] = useState(false);
  const [ownsPacks, setOwnsPacks] = useState(false);
  const [ownsPacksChecked, setOwnsPacksChecked] = useState(false);
  const clearedRef = useRef(false);
  const busyRef = useRef(false);

  const signedIn = auth.isSignedIn && !auth.loading;
  const shopApiConfigured = tilePackCatalogApiConfigured();

  useEffect(() => {
    document.title = TITLE;
    return () => {
      document.title = 'GridSmith';
    };
  }, []);

  useEffect(() => {
    if (clearedRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    const sessionId = sp.get('session_id');
    const cancelled = sp.get('checkout') === 'cancel';
    if (sessionId) {
      clearedRef.current = true;
      clearCart();
      setFlashSuccess(true);
      window.history.replaceState(window.history.state ?? {}, '', '/cart');
    } else if (cancelled) {
      clearedRef.current = true;
      setFlashCancel(true);
      window.history.replaceState(window.history.state ?? {}, '', '/cart');
    }
  }, [clearCart]);

  useEffect(() => {
    if (!signedIn) {
      setOwnsPacks(false);
      setOwnsPacksChecked(true);
      return undefined;
    }
    if (!shopApiConfigured) {
      setOwnsPacks(false);
      setOwnsPacksChecked(true);
      return undefined;
    }
    let cancelled = false;
    setOwnsPacksChecked(false);
    void fetchGridSmithCapabilities()
      .then((caps) => {
        if (cancelled) return;
        const has =
          (Array.isArray(caps.ownedPriceIds) && caps.ownedPriceIds.length > 0) ||
          (Array.isArray(caps.ownedProductIds) && caps.ownedProductIds.length > 0);
        setOwnsPacks(has);
      })
      .catch(() => {
        if (!cancelled) setOwnsPacks(false);
      })
      .finally(() => {
        if (!cancelled) setOwnsPacksChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, shopApiConfigured, flashSuccess]);

  const showPostCheckoutDownloads = signedIn && flashSuccess;
  const showViewOwnedInEmptyCart =
    signedIn &&
    !flashSuccess &&
    shopApiConfigured &&
    ownsPacksChecked &&
    ownsPacks;

  const startCheckout = async () => {
    if (!auth.isSignedIn) {
      auth.login();
      return;
    }
    if (!items.length || busyRef.current) return;
    busyRef.current = true;
    setCheckoutError(null);
    setCheckoutBusy(true);
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
      busyRef.current = false;
      setCheckoutBusy(false);
    }
  };

  return (
    <main className="home-page tile-shop-page">
      <section className="home-section home-section-hero home-section-hero--child">
        <div className="home-page-container">
          <p className="home-eyebrow">Shop</p>
          <h1 className="home-h1">Cart</h1>
          <p className="home-subhead">
            Review your tile packs, then checkout securely with Stripe.
          </p>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="home-page-container" style={{ maxWidth: 720 }}>
          {flashSuccess ? (
            <div className="tile-cart-checkout-success mb-3">
              <Message
                severity="success"
                text="Thanks for your purchase! Your cart has been cleared. Download your tile packs from your Profile — Stripe will email your receipt when payment completes."
                className="w-full mb-3"
              />
              {showPostCheckoutDownloads ? (
                <Button
                  type="button"
                  label="Download your packs"
                  icon="pi pi-download"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    window.location.assign('/profile#owned-packs');
                  }}
                />
              ) : (
                <Message
                  severity="info"
                  text="Sign in to access downloads on your Profile."
                  className="w-full"
                />
              )}
            </div>
          ) : null}
          {flashCancel ? (
            <Message
              severity="info"
              text="Checkout was cancelled. Your cart is unchanged."
              className="w-full mb-3"
            />
          ) : null}
          {!auth.isSignedIn ? (
            <Message
              severity="warn"
              text="Sign in to add packs to your cart and complete purchase."
              className="w-full mb-3"
            />
          ) : null}
          {checkoutError ? <Message severity="error" text={checkoutError} className="w-full mb-3" /> : null}

          {items.length === 0 ? (
            <div className="tile-cart-page-empty">
              <p className="m-0 line-height-3">Your cart is empty.</p>
              {showViewOwnedInEmptyCart ? (
                <a
                  href="/profile#owned-packs"
                  className="p-button p-component p-button-outlined mt-3"
                >
                  <span className="p-button-icon pi pi-box" />
                  <span className="p-button-label">View owned packs</span>
                </a>
              ) : (
                <Button
                  type="button"
                  label="Browse tile sets"
                  className="mt-3"
                  icon="pi pi-th-large"
                  onClick={() => {
                    window.location.assign('/tiles');
                  }}
                />
              )}
            </div>
          ) : (
            <>
              <ul className="tile-cart-page-line-list p-0 m-0 list-none">
                {items.map((row) => (
                  <li key={row.priceId} className="tile-cart-page-line">
                    <img className="tile-cart-page-line-thumb" src={row.imageSrc} alt="" width={72} height={72} />
                    <div className="tile-cart-page-line-main">
                      <a href={`/tile-details/${encodeURIComponent(row.slug)}`} className="tile-cart-page-line-title">
                        {row.name}
                      </a>
                      {row.priceLabel ? <div className="tile-cart-page-line-price">{row.priceLabel}</div> : null}
                    </div>
                    <Button
                      type="button"
                      label="Remove"
                      className="p-button-outlined"
                      onClick={() => {
                        removeLine(row.priceId);
                      }}
                    />
                  </li>
                ))}
              </ul>
              <Divider className="my-4" />
              <div className="flex flex-column sm:flex-row gap-2 flex-wrap align-items-stretch sm:align-items-center justify-content-between">
                <Button
                  type="button"
                  label="Clear cart"
                  className="p-button-text p-button-secondary"
                  disabled={checkoutBusy}
                  onClick={() => {
                    clearCart();
                  }}
                />
                <Button
                  type="button"
                  label="Checkout with Stripe"
                  icon="pi pi-credit-card"
                  disabled={!auth.isSignedIn || checkoutBusy}
                  loading={checkoutBusy}
                  onClick={() => {
                    void startCheckout();
                  }}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
