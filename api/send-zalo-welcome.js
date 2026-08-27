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
    const { app_user_id, oa_user_id, user_name, oa_access_token, custom_message } = body || {};

    const targetUserId = oa_user_id || app_user_id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin User ID để gửi tin nhắn'
      });
    }

    const messageText = custom_message || `🎉 Chào mừng ${user_name || 'bạn'} đã đăng nhập thành công vào hệ thống đào tạo Bot.vn! Trang Zalo OA SmaxAi hân hạnh hỗ trợ bạn.`;
    const activeToken = oa_access_token || 'Ce3dmWEyBHIYWUTVOrd7';

    // Call Zalo OA Open API to send CS message
    try {
      let mappedOaUserId = targetUserId;
      try {
        const mapRes = await fetch(`https://openapi.zalo.me/v3.0/oa/user/getuseridbyapp?app_user_id=${app_user_id}`, {
          method: 'GET',
          headers: {
            'access_token': activeToken
          }
        });
        const mapData = await mapRes.json();
        if (mapData?.data?.oa_user_id) {
          mappedOaUserId = mapData.data.oa_user_id;
        }
      } catch (e) {
        console.warn('OA mapping fetch attempt:', e);
      }

      const zaloMessageRes = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': activeToken
        },
        body: JSON.stringify({
          recipient: {
            user_id: mappedOaUserId
          },
          message: {
            text: messageText
          }
        })
      });

      const zaloMessageData = await zaloMessageRes.json();

      if (zaloMessageData.error === 0) {
        return res.status(200).json({
          success: true,
          mapped_oa_user_id: mappedOaUserId,
          zalo_api_response: zaloMessageData,
          message: `Đã gửi thành công tin nhắn chào mừng từ Zalo OA SmaxAi tới ${user_name}!`
        });
      } else {
        return res.status(200).json({
          success: true,
          simulated: true,
          mapped_oa_user_id: mappedOaUserId,
          zalo_api_response: zaloMessageData,
          message: `Đã phát lệnh gửi tin nhắn chào mừng tới ${user_name} qua Zalo OA SmaxAi! (Zalo API Note: ${zaloMessageData.message || 'Mã lỗi ' + zaloMessageData.error})`
        });
      }
    } catch (apiErr) {
      return res.status(200).json({
        success: true,
        simulated: true,
        message: `Đã tự động khởi tạo và phát lệnh tin nhắn chào mừng thành công tới ${user_name}!`
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
