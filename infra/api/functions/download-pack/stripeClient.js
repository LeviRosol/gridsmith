'use strict';

const Stripe = require('stripe');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

function secretsManagerRegion() {
  const arn = process.env.STRIPE_SECRET_ARN || '';
  const m = arn.match(/^arn:aws:secretsmanager:([^:]+):/);
  return m ? m[1] : process.env.AWS_REGION || 'us-east-1';
}

function secretsClient() {
  return new SecretsManagerClient({ region: secretsManagerRegion() });
}

let stripeKeyCache;
let stripeClient;

const SK_KEY_RE = /^(sk|rk)_(test|live)_[A-Za-z0-9_]+$/;

function findStripeKeyInParsedJson(val, depth = 0) {
  if (depth > 8) return null;
  if (typeof val === 'string') {
    const s = val.trim().replace(/^['"]|['"]$/g, '');
    return SK_KEY_RE.test(s) ? s : null;
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      for (const el of val) {
        const found = findStripeKeyInParsedJson(el, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const k of Object.keys(val)) {
      const found = findStripeKeyInParsedJson(val[k], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function getStripeSecretKey() {
  if (stripeKeyCache) return stripeKeyCache;
  const arn = process.env.STRIPE_SECRET_ARN;
  if (!arn) throw new Error('Missing STRIPE_SECRET_ARN');
  const out = await secretsClient().send(new GetSecretValueCommand({ SecretId: arn }));
  const raw = out.SecretString;
  if (!raw) throw new Error('Secret has no SecretString');
  const trimmed = raw.trim();
  const bare = trimmed.replace(/^['"]|['"]$/g, '');
  if (SK_KEY_RE.test(bare)) {
    stripeKeyCache = bare;
    return stripeKeyCache;
  }
  if (trimmed.startsWith('{')) {
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Secret looks like JSON but is invalid: ${e.message || e}`);
    }
    const explicit =
      (typeof obj.STRIPE_SECRET_KEY === 'string' && obj.STRIPE_SECRET_KEY.trim()) ||
      (typeof obj.stripe_secret_key === 'string' && obj.stripe_secret_key.trim()) ||
      (typeof obj.secret === 'string' && obj.secret.trim()) ||
      (typeof obj.sk_test === 'string' && obj.sk_test.trim()) ||
      (typeof obj.sk_live === 'string' && obj.sk_live.trim()) ||
      (typeof obj.apiKey === 'string' && obj.apiKey.trim()) ||
      (typeof obj.api_key === 'string' && obj.api_key.trim());
    if (explicit && SK_KEY_RE.test(explicit.replace(/^['"]|['"]$/g, ''))) {
      stripeKeyCache = explicit.replace(/^['"]|['"]$/g, '');
      return stripeKeyCache;
    }
    const deep = findStripeKeyInParsedJson(obj);
    if (deep) {
      stripeKeyCache = deep;
      return stripeKeyCache;
    }
    throw new Error('Secret JSON has no Stripe key');
  }
  throw new Error('Secret must be Stripe sk_/rk_ key or JSON containing it');
}

async function getStripe() {
  if (stripeClient) return stripeClient;
  const key = await getStripeSecretKey();
  stripeClient = new Stripe(key);
  return stripeClient;
}

module.exports = { getStripe };
