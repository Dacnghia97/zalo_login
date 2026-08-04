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

    // Save PKCE verifier & state in sessionStorage
    sessionStorage.setItem('zalo_code_verifier', codeVerifier);
    sessionStorage.setItem('zalo_auth_state', state);

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
  const codeVerifier = sessionStorage.getItem('zalo_code_verifier') || '';

  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append('app_id', ZALO_CONFIG.appId);
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code);
    bodyParams.append('code_verifier', codeVerifier);

    const tokenRes = await fetch('/zalo-oauth/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': ZALO_CONFIG.secretKey
      },
      body: bodyParams.toString()
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      const profileRes = await fetch(`/zalo-graph/v2.0/me?fields=id,name,picture`, {
        headers: {
          'access_token': tokenData.access_token
        }
      });
      const profileData = await profileRes.json();

      // Parse Zalo user avatar picture URL
      let avatarUrl = '';
      if (profileData.picture?.data?.url) {
        avatarUrl = profileData.picture.data.url;
      } else if (typeof profileData.picture === 'string') {
        avatarUrl = profileData.picture;
      } else if (profileData.avatar) {
        avatarUrl = profileData.avatar;
      }

      return {
        success: true,
        user: {
          id: profileData.id || 'zalo_' + Date.now(),
          name: profileData.name || 'Người dùng Zalo',
          avatar: avatarUrl,
          provider: 'Zalo'
        }
      };
    } else {
      console.warn('Zalo Token response:', tokenData);
      return {
        success: false,
        error: tokenData.error_name || tokenData.message || 'Không thể lấy Access Token từ Zalo'
      };
    }
  } catch (err) {
    console.error('Zalo OAuth error:', err);
    return { success: false, error: err.message };
  }
}
