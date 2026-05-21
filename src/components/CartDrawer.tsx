import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { Sidebar } from 'primereact/sidebar';
import { startGridSmithCheckoutForCartPriceIds } from '../billing/gridSmithBilling';
import { useTileCart } from '../cart/TileCartContext';
import { useAuth } from './AuthContext';

export default function CartDrawer() {
  const auth = useAuth();
  const { items, drawerVisible, closeDrawer, removeLine, itemCount } = useTileCart();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!drawerVisible) setCheckoutError(null);
  }, [drawerVisible]);

  const startCheckout = async () => {
    if (!auth.isSignedIn) {
      closeDrawer();
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

  const footer = (
    <div className="flex flex-column gap-2 w-full pt-3 border-top-1 surface-border">
      {checkoutError ? <Message severity="error" text={checkoutError} className="w-full" /> : null}
      <div className="flex flex-row gap-2 flex-wrap justify-content-end">
        <Button
          type="button"
          label="View full cart"
          className="p-button-outlined"
          onClick={() => {
            closeDrawer();
            window.location.assign('/cart');
          }}
        />
        <Button
          type="button"
          label="Checkout"
          icon="pi pi-credit-card"
          disabled={!items.length || checkoutBusy}
          loading={checkoutBusy}
          onClick={() => {
            void startCheckout();
          }}
        />
      </div>
    </div>
  );

  return (
    <Sidebar
      visible={drawerVisible}
      position="right"
      onHide={closeDrawer}
      header="Cart"
      className="tile-cart-sidebar"
      style={{ width: 'min(100vw, 380px)' }}
    >
      <div className="flex flex-column gap-3" style={{ minHeight: 'min(70vh, 520px)' }}>
        <div className="flex flex-column gap-2 flex-1" style={{ minHeight: 0 }}>
          {!auth.isSignedIn ? (
            <p className="m-0 line-height-3" style={{ opacity: 0.9 }}>
              Sign in to save packs to your cart and checkout.
            </p>
          ) : null}
          {items.length === 0 ? (
            <p className="m-0 line-height-3 mt-2" style={{ opacity: 0.85 }}>
              Your cart is empty. Browse{' '}
              <a href="/tiles" className="tile-cart-inline-link" onClick={closeDrawer}>
                tile sets
              </a>
              .
            </p>
          ) : (
            <ul className="tile-cart-line-list p-0 m-0 list-none">
              {items.map((row) => (
                <li key={row.priceId} className="tile-cart-line">
                  <img className="tile-cart-line-thumb" src={row.imageSrc} alt="" width={56} height={56} />
                  <div className="tile-cart-line-body">
                    <a
                      href={`/tile-details/${encodeURIComponent(row.slug)}`}
                      className="tile-cart-line-title"
                      onClick={closeDrawer}
                    >
                      {row.name}
                    </a>
                    {row.priceLabel ? <div className="tile-cart-line-price">{row.priceLabel}</div> : null}
                  </div>
                  <Button
                    type="button"
                    icon="pi pi-times"
                    rounded
                    text
                    severity="secondary"
                    aria-label={`Remove ${row.name}`}
                    onClick={() => {
                      removeLine(row.priceId);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {itemCount > 0 ? (
            <>
              <Divider className="my-2" />
              <p className="m-0 text-sm" style={{ opacity: 0.8 }}>
                In addition to the STL downloads, you will be able to use these packs in the GridSmith Tile Builder.
              </p>
            </>
          ) : null}
        </div>
        {footer}
      </div>
    </Sidebar>
  );
}
