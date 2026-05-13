'use strict';

const { CognitoJwtVerifier } = require('aws-jwt-verify');

let verifier;

function getVerifier() {
  if (verifier) return verifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new Error('Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID');
  }
  verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',
  });
  return verifier;
}

async function verifyIdToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    const e = new Error('missing_authorization');
    e.statusCode = 401;
    throw e;
  }
  const m = authorizationHeader.match(/^\s*Bearer\s+(.+)$/i);
  if (!m) {
    const e = new Error('missing_bearer');
    e.statusCode = 401;
    throw e;
  }
  const token = m[1].trim();
  if (!token) {
    const e = new Error('empty_token');
    e.statusCode = 401;
    throw e;
  }
  try {
    const payload = await getVerifier().verify(token);
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) {
      const e = new Error('no_sub');
      e.statusCode = 401;
      throw e;
    }
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    return { sub, email };
  } catch (err) {
    if (err.statusCode) throw err;
    const e = new Error('invalid_token');
    e.statusCode = 401;
    e.cause = err;
    throw e;
  }
}

module.exports = { verifyIdToken };
