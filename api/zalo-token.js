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
      let profileData = {};

      // Method 1: Official Header format
      try {
        const profileRes = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
          method: 'GET',
          headers: {
            'access_token': accessToken
          }
        });
        profileData = await profileRes.json();
      } catch (e) {
        console.error('Method 1 failed:', e);
      }

      // Method 2: Query param format
      if (!profileData.name && !profileData.id) {
        try {
          const profileRes = await fetch(`https://graph.zalo.me/v2.0/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,picture`);
          profileData = await profileRes.json();
        } catch (e) {
          console.error('Method 2 failed:', e);
        }
      }

      // Method 3: Bearer header format
      if (!profileData.name && !profileData.id) {
        try {
          const profileRes = await fetch('https://graph.zalo.me/v2.0/me?fields=id,name,picture', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'access_token': accessToken
            }
          });
          profileData = await profileRes.json();
        } catch (e) {
          console.error('Method 3 failed:', e);
        }
      }

      console.log('Final Zalo Graph Profile Response:', profileData);

      // Parse user name
      const rawName = profileData.name || profileData.data?.name || profileData.user_name || profileData.display_name;
      let userName = rawName;

      if (!userName) {
        if (profileData.error !== undefined && profileData.error !== 0) {
          userName = `Zalo User (Lỗi ${profileData.error}: ${profileData.message || 'User not visible'})`;
        } else if (profileData.id) {
          userName = `Zalo User (${profileData.id})`;
        } else {
          userName = 'Tài khoản Zalo';
        }
      }

      // Parse user avatar
      let avatarUrl = '';
      if (profileData.picture?.data?.url) {
        avatarUrl = profileData.picture.data.url;
      } else if (profileData.data?.picture?.data?.url) {
        avatarUrl = profileData.data.picture.data.url;
      } else if (typeof profileData.picture === 'string') {
        avatarUrl = profileData.picture;
      }

      let zaloNote = null;
      if (profileData.error && profileData.error !== 0) {
        zaloNote = `Lỗi Zalo ${profileData.error}: ${profileData.message || 'Cần cấp quyền user_profile'}`;
      }

      return res.status(200).json({
        success: true,
        user: {
          id: profileData.id || 'zalo_' + Date.now(),
          name: userName,
          avatar: avatarUrl,
          provider: 'Zalo'
        },
        rawProfile: profileData,
        zaloNote: zaloNote
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
