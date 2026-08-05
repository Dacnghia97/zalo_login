// Zalo Real OAuth 2.0 PKCE Helper Utilities
export const ZALO_CONFIG = {
  appId: '415431868461604271',
  secretKey: 'nUBrL4jFY9bIVKPlEi4E'
};

// Generate random string for code_verifier
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// SHA-256 hash helper
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Base64URL encode helper
function base64urlencode(a) {
  let str = '';
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate PKCE Challenge from Verifier
async function generateCodeChallenge(v) {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

// Initiate Real Zalo OAuth Login
export async function startZaloRealLogin(customRedirectUri) {
  try {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);

    // Save PKCE verifier & state in localStorage for persistent retrieval across redirects
    localStorage.setItem('zalo_code_verifier', codeVerifier);
    localStorage.setItem('zalo_auth_state', state);

    // Selected redirect URI (must match Zalo console whitelist)
    const redirectUri = customRedirectUri || (window.location.origin + '/');

    const authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${ZALO_CONFIG.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;

    return { authUrl, codeVerifier, state, redirectUri };
  } catch (error) {
    console.error('Error starting Zalo login:', error);
    throw error;
  }
}

// Exchange Code for Access Token and Fetch User Profile
export async function handleZaloCallbackCode(code) {
  // Retrieve code_verifier from localStorage (or fallback to sessionStorage)
  const codeVerifier = localStorage.getItem('zalo_code_verifier') || sessionStorage.getItem('zalo_code_verifier') || '';

  try {
    // Call Vercel Serverless Function /api/zalo-token
    const apiRes = await fetch('/api/zalo-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier
      })
    });

    const data = await apiRes.json();

    if (data.success && data.user) {
      return {
        success: true,
        user: data.user,
        rawProfile: data.rawProfile,
        zaloError: data.zaloError
      };
    } else {
      return {
        success: false,
        error: data.error || 'Không thể xác thực token Zalo',
        details: data
      };
    }
  } catch (err) {
    console.error('Zalo OAuth error:', err);
    return { success: false, error: err.message };
  }
}
