// Zalo Real OAuth 2.0 PKCE Helper Utilities
export const ZALO_CONFIG = {
  appId: '836228948044012533',
  secretKey: 'Ce3dmWEyBHIYWUTVOrd7'
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
export async function startZaloRealLogin(customRedirectUri, isOaAuth = false) {
  try {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);

    localStorage.setItem('zalo_code_verifier', codeVerifier);
    localStorage.setItem('zalo_auth_state', state);

    const redirectUri = customRedirectUri || (window.location.origin + '/');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const path = isOaAuth ? 'v4/oa/permission' : 'v4/permission';
    const authUrl = `https://oauth.zaloapp.com/${path}?app_id=${ZALO_CONFIG.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;
    const zaloAppScheme = `zalo://oauth?app_id=${ZALO_CONFIG.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;

    return { authUrl, zaloAppScheme, isMobile, codeVerifier, state, redirectUri };
  } catch (error) {
    console.error('Error starting Zalo login:', error);
    throw error;
  }
}

// Exchange Code for Access Token and Fetch User Profile + OA SmaxAi User ID
export async function handleZaloCallbackCode(code) {
  const codeVerifier = localStorage.getItem('zalo_code_verifier') || sessionStorage.getItem('zalo_code_verifier') || '';

  try {
    let accessToken = null;
    let serverData = null;

    // 1. Attempt Vercel API endpoint /api/zalo-token
    try {
      const apiRes = await fetch('/api/zalo-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: codeVerifier })
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const json = await apiRes.json();
        if (json.success && json.access_token) {
          accessToken = json.access_token;
          serverData = json;
        }
      }
    } catch (e) {
      console.warn('/api/zalo-token endpoint not active locally, using Vite client proxy fallback:', e);
    }

    // 2. Local Fallback: Call Zalo OAuth directly via Vite proxy /zalo-oauth
    if (!accessToken) {
      const bodyParams = new URLSearchParams();
      bodyParams.append('app_id', ZALO_CONFIG.appId);
      bodyParams.append('grant_type', 'authorization_code');
      bodyParams.append('code', code);
      bodyParams.append('code_verifier', codeVerifier || '');

      const tokenRes = await fetch('/zalo-oauth/v4/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'secret_key': ZALO_CONFIG.secretKey
        },
        body: bodyParams.toString()
      });

      const tokenJson = await tokenRes.json();
      if (tokenJson.access_token) {
        accessToken = tokenJson.access_token;
        serverData = { access_token: accessToken, details: tokenJson };
      } else {
        return {
          success: false,
          error: tokenJson.error_name || tokenJson.message || 'Không thể đổi access_token từ Zalo OAuth',
          details: tokenJson
        };
      }
    }

    // 3. Fetch User Profile from Zalo Graph API
    let profileData = {};
    try {
      const graphUrl = `/zalo-graph/v2.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,picture,phone`;
      const clientRes = await fetch(graphUrl, {
        method: 'GET',
        headers: { 'access_token': accessToken }
      });
      profileData = await clientRes.json();
    } catch (clientErr) {
      console.warn('Client graph fetch error:', clientErr);
      profileData = serverData?.serverProfile || {};
    }

    if (!profileData || !profileData.name) {
      profileData = serverData?.serverProfile || profileData || {};
    }

    // 4. Fetch Phone Number from Zalo me/info
    let userPhone = serverData?.phone || profileData.phone || profileData.number || profileData.data?.number || profileData.data?.phone || null;
    if (!userPhone && accessToken) {
      try {
        const phoneRes = await fetch(`/zalo-graph/v2.0/me/info?access_token=${encodeURIComponent(accessToken)}`, {
          headers: { 'access_token': accessToken }
        });
        const phoneJson = await phoneRes.json();
        if (phoneJson?.data?.number) {
          userPhone = phoneJson.data.number;
        } else if (phoneJson?.number) {
          userPhone = phoneJson.number;
        }
      } catch (phoneErr) {
        console.warn('Phone info fetch error:', phoneErr);
      }
    }

    if (userPhone && typeof userPhone === 'string' && userPhone.startsWith('84')) {
      userPhone = '0' + userPhone.slice(2);
    }

    // 5. Check real OA User ID
    let realOaUserId = serverData?.oa_user_id || null;
    let oaMappingStatus = 'Đã kết nối tài khoản Zalo';

    const userName = profileData.name || profileData.data?.name || profileData.user_name || profileData.display_name || (profileData.id ? `Zalo User (${profileData.id.slice(-4)})` : 'Thành viên Zalo');

    let avatarUrl = '';
    if (profileData.picture?.data?.url) {
      avatarUrl = profileData.picture.data.url;
    } else if (profileData.data?.picture?.data?.url) {
      avatarUrl = profileData.data.picture.data.url;
    } else if (typeof profileData.picture === 'string') {
      avatarUrl = profileData.picture;
    }

    return {
      success: true,
      user: {
        id: profileData.id || 'zalo_' + Date.now(),
        oa_user_id: realOaUserId,
        name: userName,
        phone: userPhone,
        avatar: avatarUrl,
        provider: 'Zalo'
      },
      rawProfile: {
        ...profileData,
        phone_number: userPhone,
        real_oa_user_id: realOaUserId,
        oa_mapping_note: oaMappingStatus
      }
    };

  } catch (err) {
    console.error('Zalo OAuth callback error:', err);
    return { success: false, error: err.message };
  }
}
