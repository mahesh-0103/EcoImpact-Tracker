
import DescopeClient from '@descope/node-sdk';
import dotenv from 'dotenv';
import tokenStore from '../services/tokenStore.js';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

const projectId = process.env.DESCOPE_PROJECT_ID;
const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;
let descope = null;

if (projectId) {
  try {
    descope = DescopeClient({ projectId, managementKey });
    console.log(`[AUTH] Descope client initialized for Project ID: ${projectId}`);
  } catch (err) {
    console.error("[AUTH] FATAL: Failed to initialize Descope client:", err.message);
    // Prevent the server from running with a misconfigured Descope client.
    throw new Error(`Descope client initialization failed: ${err.message}`);
  }
} else {
  console.warn("[AUTH] WARNING: DESCOPE_PROJECT_ID is not set. API calls requiring authentication will fail.");
  // Allow server to start, but auth-dependent routes will be non-functional.
}

/**
 * Finds Google and Slack provider tokens within a decoded Descope JWT.
 * @param {object} decodedToken - The decoded Descope session or access token.
 * @returns {{google: object|null, slack: object|null}}
 */
function findProviderTokens(decodedToken) {
  const found = { google: null, slack: null };
  if (!decodedToken || typeof decodedToken !== 'object') return found;

  const providersInAmr = decodedToken.amr?.filter(p => typeof p === 'object' && p.provider) || [];
  for (const method of providersInAmr) {
    const provider = method.provider.toLowerCase();
    if (provider === 'google' && method.accessToken && !found.google) {
      found.google = { accessToken: method.accessToken, refreshToken: method.refreshToken, expiresAt: method.expiration };
    }
    if (provider === 'slack' && method.accessToken && !found.slack) {
      found.slack = { accessToken: method.accessToken, refreshToken: method.refreshToken, expiresAt: method.expiration };
    }
  }

  const tenants = decodedToken.tenants ? Object.values(decodedToken.tenants) : [];
  for (const tenant of tenants) {
    const providersInTenant = tenant?.providers?.filter(p => p.provider) || [];
    for (const providerInfo of providersInTenant) {
      const provider = providerInfo.provider.toLowerCase();
      if (provider === 'google' && providerInfo.accessToken && !found.google) {
        found.google = providerInfo;
      }
      if (provider === 'slack' && providerInfo.accessToken && !found.slack) {
        found.slack = providerInfo;
      }
    }
  }
  
  return found;
}

/**
 * Express middleware for validating Descope session tokens.
 */
export default async function descopeAuth(req, res, next) {
  const header = req.headers.authorization;
  
  // Gracefully handle requests without an Authorization header.
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Missing, malformed, or empty Authorization header. Please include a Bearer token.'
    });
  }

  const sessionTokenStr = header.substring(7);
  if (!sessionTokenStr) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Blank session token provided.' });
  }

  // This ensures the server doesn't crash if the Descope client wasn't initialized.
  if (!descope) {
    console.error('[AUTH] Middleware invoked, but Descope client is not available. Check project ID env var.');
    return res.status(503).json({ error: 'Service Unavailable', details: 'Authentication service is not configured.' });
  }

  try {
    const validationData = await descope.validateSession(sessionTokenStr, { includeToken: true });
    const decodedToken = validationData?.token;
    const userId = decodedToken?.sub;

    if (!userId) {
      console.warn("[AUTH] Token validation succeeded but no 'sub' (user ID) claim was found.");
      return res.status(401).json({ error: 'Invalid Session', details: 'User identifier could not be determined from the token.' });
    }

    const { google, slack } = findProviderTokens(decodedToken);
    
    // Asynchronously save provider tokens without blocking the request flow.
    if (google) await tokenStore.saveToken(userId, 'google', google);
    if (slack) await tokenStore.saveToken(userId, 'slack', slack);

    // Attach a simplified, clean user object to the request.
    req.user = {
      id: userId,
      email: decodedToken.email,
      name: decodedToken.name,
      _rawDescopeToken: process.env.NODE_ENV === 'development' ? decodedToken : undefined
    };

    return next();
  } catch (err) {
    console.error('[AUTH] Descope token validation failed:', err.message);
    
    // Specific check for Google Cloud KMS permission errors
    if (err.message?.includes('cloudkms.cryptoKeyVersions.useToEncrypt')) {
      console.error("[AUTH] >>> IAM PERMISSION ERROR: The backend service account is missing the 'Cloud KMS CryptoKey Encrypter/Decrypter' role. <<<");
      return res.status(503).json({ 
        error: 'Service Unavailable', 
        details: 'A critical server-side permission error occurred with Google Cloud KMS. Check IAM roles.' 
      });
    }

    // For other validation errors, return a clear 401 Unauthorized.
    return res.status(401).json({ 
      error: 'Unauthorized', 
      details: `Session token is invalid or expired. Reason: ${err.message}`
    });
  }
}
