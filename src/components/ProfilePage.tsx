import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { useAuth } from './AuthContext';

export default function ProfilePage() {
  const auth = useAuth();
  const [localOptIn, setLocalOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                <p style={{ marginBottom: '1.25rem' }}>
                  Signed in as <strong>{auth.user?.email ?? auth.user?.name ?? 'your account'}</strong>.
                </p>

                <div
                  className="flex align-items-center gap-3 flex-wrap"
                  style={{ marginBottom: '1rem' }}
                >
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
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
