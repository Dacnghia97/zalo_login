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

    const messageText = custom_message || `🎉 Chào mừng ${user_name || 'bạn'} đã đăng nhập thành công vào hệ thống đào tạo Bot.vn! Trang Zalo OA SmaxAi hân hạnh hỗ trợ bạn trong suốt khóa học.`;

    // 1. If oa_access_token is provided, call real Zalo OA Open API to send CS message
    if (oa_access_token) {
      // Step A: Attempt OA User ID Mapping if only app_user_id was provided
      let mappedOaUserId = targetUserId;
      try {
        const mapRes = await fetch(`https://openapi.zalo.me/v3.0/oa/user/getuseridbyapp?app_user_id=${app_user_id}`, {
          method: 'GET',
          headers: {
            'access_token': oa_access_token
          }
        });
        const mapData = await mapRes.json();
        if (mapData?.data?.oa_user_id) {
          mappedOaUserId = mapData.data.oa_user_id;
        }
      } catch (e) {
        console.warn('OA mapping fetch attempt:', e);
      }

      // Step B: Send CS Message via Zalo OA Open API
      const zaloMessageRes = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': oa_access_token
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

      return res.status(200).json({
        success: zaloMessageData.error === 0,
        mapped_oa_user_id: mappedOaUserId,
        zalo_api_response: zaloMessageData,
        message: zaloMessageData.error === 0 
          ? `Đã gửi thành công tin nhắn chào mừng từ Zalo OA SmaxAi tới ${user_name}!` 
          : `Zalo OA API Note (Error ${zaloMessageData.error}): ${zaloMessageData.message || 'Cần cấp quyền oa_message'}`
      });
    }

    // 2. Demo / Test Simulation Response when OA token is pending
    return res.status(200).json({
      success: true,
      simulated: true,
      target_user_id: targetUserId,
      message_payload: {
        recipient: { user_id: targetUserId },
        message: { text: messageText }
      },
      message: `Đã khởi tạo lệnh gửi tin nhắn chào mừng cho ${user_name || 'khách hàng'} qua Zalo OA SmaxAi! (Vui lòng điền OA Access Token để phát tin thực tế).`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
