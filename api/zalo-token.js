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

    const appId = '836228948044012533';
    const secretKey = 'Ce3dmWEyBHIYWUTVOrd7';

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
      
      // Calculate HMAC-SHA256 appsecret_proof
      const appSecretProof = crypto.createHmac('sha256', secretKey).update(accessToken).digest('hex');

      // Server-side profile fetch (including phone scope if user granted permission)
      let profileData = {};
      try {
        const profileUrl = `https://graph.zalo.me/v2.0/me?access_token=${encodeURIComponent(accessToken)}&appsecret_proof=${appSecretProof}&fields=id,name,picture,phone`;
        const profileRes = await fetch(profileUrl, {
          headers: {
            'access_token': accessToken
          }
        });
        profileData = await profileRes.json();
      } catch (e) {
        console.error('Server profile fetch error:', e);
      }

      // Dedicated phone number fetch via Zalo Graph API me/info (including Zalo Mini App phone_token support)
      let extractedPhone = profileData.phone || profileData.number || profileData.data?.number || profileData.data?.phone || null;
      
      const { phone_token } = body || {};
      if (phone_token) {
        try {
          const tokenPhoneRes = await fetch('https://graph.zalo.me/v2.0/me/info', {
            method: 'GET',
            headers: {
              'access_token': accessToken,
              'code': phone_token,
              'secret_key': secretKey
            }
          });
          const tokenPhoneJson = await tokenPhoneRes.json();
          if (tokenPhoneJson?.data?.number) {
            extractedPhone = tokenPhoneJson.data.number;
          }
        } catch (tpErr) {
          console.error('Mini App phone_token decoding error:', tpErr);
        }
      }

      if (!extractedPhone) {
        try {
          const phoneUrl = `https://graph.zalo.me/v2.0/me/info?access_token=${encodeURIComponent(accessToken)}&appsecret_proof=${appSecretProof}`;
          const phoneRes = await fetch(phoneUrl, {
            headers: {
              'access_token': accessToken
            }
          });
          const phoneJson = await phoneRes.json();
          if (phoneJson?.data?.number) {
            extractedPhone = phoneJson.data.number;
          } else if (phoneJson?.number) {
            extractedPhone = phoneJson.number;
          }
        } catch (phoneErr) {
          console.error('Dedicated phone fetch error:', phoneErr);
        }
      }

      // Fetch Zalo OA User ID Mapping for SmaxAi
      let oaUserId = null;
      let oaMappingRaw = null;

      if (profileData.id) {
        try {
          const oaRes = await fetch(`https://openapi.zalo.me/v3.0/oa/user/getuseridbyapp?app_user_id=${profileData.id}`, {
            method: 'GET',
            headers: {
              'access_token': accessToken
            }
          });
          oaMappingRaw = await oaRes.json();
          if (oaMappingRaw?.data?.oa_user_id) {
            oaUserId = oaMappingRaw.data.oa_user_id;
          }
        } catch (oaErr) {
          console.error('OA Mapping error:', oaErr);
        }
      }

      return res.status(200).json({
        success: true,
        access_token: accessToken,
        appsecret_proof: appSecretProof,
        serverProfile: profileData,
        phone: extractedPhone,
        oa_user_id: oaUserId,
        oa_mapping_raw: oaMappingRaw
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
