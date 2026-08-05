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

    localStorage.setItem('zalo_code_verifier', codeVerifier);
    localStorage.setItem('zalo_auth_state', state);

    const redirectUri = customRedirectUri || (window.location.origin + '/');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${ZALO_CONFIG.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`;
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
    // 1. Call Vercel Serverless Function /api/zalo-token
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

    const tokenData = await apiRes.json();

    if (tokenData.success && tokenData.access_token) {
      const accessToken = tokenData.access_token;
      let profileData = null;

      // 2. Client-side profile fetch directly from Browser (Vietnam IP)
      try {
        const clientRes = await fetch(`https://graph.zalo.me/v2.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,picture`, {
          method: 'GET',
          headers: {
            'access_token': accessToken
          }
        });
        profileData = await clientRes.json();
      } catch (clientErr) {
        console.warn('Client fetch failed, using server profile:', clientErr);
        profileData = tokenData.serverProfile;
      }

      if (!profileData || !profileData.name) {
        profileData = tokenData.serverProfile || profileData || {};
      }

      // 3. Check for genuine oa_user_id returned by Zalo OA Mapping API
      let realOaUserId = tokenData.oa_user_id || null;
      let oaMappingStatus = 'Cần OA Access Token để lấy OA ID thật';

      if (realOaUserId && realOaUserId !== profileData.id) {
        oaMappingStatus = 'Đã lấy thành công OA User ID từ SmaxAi';
      } else {
        realOaUserId = null; // Do not fallback to same App User ID
      }

      console.log('Final Client Zalo Profile Data:', profileData);
      console.log('Real Zalo OA SmaxAi User ID:', realOaUserId);

      // Parse user name
      const userName = profileData.name || profileData.data?.name || profileData.user_name || profileData.display_name || (profileData.id ? `Zalo User (${profileData.id.slice(-4)})` : 'Thành viên Zalo');

      // Parse user avatar
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
          avatar: avatarUrl,
          provider: 'Zalo'
        },
        rawProfile: {
          ...profileData,
          real_oa_user_id: realOaUserId,
          oa_mapping_note: oaMappingStatus
        }
      };
    } else {
      return {
        success: false,
        error: tokenData.error || 'Không thể đổi access_token Zalo',
        details: tokenData
      };
    }
  } catch (err) {
    console.error('Zalo OAuth error:', err);
    return { success: false, error: err.message };
  }
}
