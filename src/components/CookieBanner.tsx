import React from 'react';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';

export default function CookieBanner({
  showClose,
  marketingEmails,
  onMarketingEmailsChange,
  onAccept,
  onEssentialOnly,
  onClose,
}: {
  showClose: boolean;
  marketingEmails: boolean;
  onMarketingEmailsChange: (value: boolean) => void;
  onAccept: () => void;
  onEssentialOnly: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      id="cookie-settings"
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc cookie-banner-marketing-desc"
    >
      <div className="cookie-banner-inner">
        <div className="cookie-banner-copy">
          <h2 id="cookie-banner-title" className="cookie-banner-title">
            Cookies and privacy
          </h2>
          <p id="cookie-banner-desc" className="cookie-banner-text">
            We use cookies and similar technologies to run the site, remember preferences, and—only if you
            allow—measure how the site is used through Google Tag Manager and analytics partners. See our{' '}
            <a href="/privacy" className="cookie-banner-link">
              Privacy Policy
            </a>{' '}
            for details.
          </p>
          <div className="cookie-banner-marketing">
            <InputSwitch
              inputId="cookie-banner-marketing-switch"
              checked={marketingEmails}
              onChange={(e) => onMarketingEmailsChange(!!e.value)}
            />
            <div className="cookie-banner-marketing-copy">
              <label htmlFor="cookie-banner-marketing-switch" className="cookie-banner-marketing-label">
                Email me product updates and marketing from GridSmith
              </label>
              <p id="cookie-banner-marketing-desc" className="cookie-banner-marketing-hint">
                Separate from analytics cookies. You can change this anytime in your profile when signed in. Defaults
                to on; turn it off if you prefer not to receive marketing email.
              </p>
            </div>
          </div>
        </div>
        <div className="cookie-banner-actions">
          {showClose && onClose ? (
            <Button type="button" label="Close" text onClick={onClose} className="cookie-banner-close" />
          ) : null}
          <Button
            type="button"
            label="Essential only"
            outlined
            onClick={onEssentialOnly}
            className="cookie-banner-btn-secondary"
          />
          <Button type="button" label="Accept analytics" onClick={onAccept} className="cookie-banner-btn-primary" />
        </div>
      </div>
    </div>
  );
}
