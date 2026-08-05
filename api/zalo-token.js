import crypto from 'crypto';

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { code, code_verifier } = body || {};

    const appId = '415431868461604271';
    const secretKey = 'nUBrL4jFY9bIVKPlEi4E';

    // 1. Exchange authorization code for access token with Zalo OAuth API
    const bodyParams = new URLSearchParams();
    bodyParams.append('app_id', appId);
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code);
    bodyParams.append('code_verifier', code_verifier || '');

    const tokenRes = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': secretKey
      },
      body: bodyParams.toString()
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      const accessToken = tokenData.access_token;
      
      // Calculate HMAC-SHA256 appsecret_proof for Zalo Security
      const appSecretProof = crypto.createHmac('sha256', secretKey).update(accessToken).digest('hex');

      // 2. Fetch Zalo user profile from Graph API with appsecret_proof
      let profileUrl = `https://graph.zalo.me/v2.0/me?access_token=${encodeURIComponent(accessToken)}&appsecret_proof=${appSecretProof}&fields=id,name,picture`;
      
      let profileRes = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'access_token': accessToken,
          'secret_key': secretKey,
          'app_id': appId
        }
      });
      let profileData = await profileRes.json();

      // If appsecret_proof fetch returned error, try fallback without appsecret_proof
      if (profileData.error || !profileData.id) {
        console.warn('Fallback without appsecret_proof:', profileData);
        profileUrl = `https://graph.zalo.me/v2.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,picture`;
        profileRes = await fetch(profileUrl, {
          method: 'GET',
          headers: {
            'access_token': accessToken
          }
        });
        profileData = await profileRes.json();
      }

      console.log('Zalo User Profile Data:', profileData);

      // Extract user name across Zalo payload formats
      const rawName = profileData.name || profileData.data?.name || profileData.user_name || profileData.display_name;
      const userName = rawName ? rawName : (profileData.id ? `Thành viên Zalo (${profileData.id.slice(-4)})` : 'Thành viên Zalo');

      // Extract user avatar across Zalo payload formats
      let avatarUrl = '';
      if (profileData.picture?.data?.url) {
        avatarUrl = profileData.picture.data.url;
      } else if (profileData.data?.picture?.data?.url) {
        avatarUrl = profileData.data.picture.data.url;
      } else if (typeof profileData.picture === 'string') {
        avatarUrl = profileData.picture;
      } else if (profileData.avatar) {
        avatarUrl = profileData.avatar;
      } else if (profileData.picture?.url) {
        avatarUrl = profileData.picture.url;
      }

      return res.status(200).json({
        success: true,
        user: {
          id: profileData.id || 'zalo_' + Date.now(),
          name: userName,
          avatar: avatarUrl,
          provider: 'Zalo'
        },
        rawProfile: profileData
      });
    } else {
      return res.status(400).json({
        success: false,
        error: tokenData.error_name || tokenData.message || 'Không thể đổi token từ Zalo OAuth',
        details: tokenData
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
