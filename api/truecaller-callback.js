/**
 * api/truecaller-callback.js
 * 
 * Serverless endpoint nhận callback từ Truecaller sau khi user nhấn "Cho phép"
 * Truecaller POST accessToken đến URL này → ta dùng token để lấy profile user
 * 
 * Flow:
 * 1. Website trigger deeplink → Truecaller app mở popup
 * 2. User nhấn "Continue" → Truecaller POST accessToken vào đây
 * 3. Ta dùng accessToken GET profile → lấy phone, name, avatar
 * 4. Lưu vào memory/DB → frontend polling để nhận kết quả
 */

// In-memory store để lưu kết quả (dùng Redis/KV cho production)
// Map: requestNonce → { phone, name, avatar, status }
const pendingResults = new Map();

export default async function handler(req, res) {
  // Cho phép CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === POST: Truecaller gửi accessToken sau khi user đồng ý ===
  if (req.method === 'POST') {
    try {
      const { requestId, accessToken, endpoint } = req.body;

      if (!accessToken || !requestId) {
        return res.status(400).json({ error: 'Missing accessToken or requestId' });
      }

      // Lấy profile từ Truecaller API bằng accessToken
      const profileRes = await fetch(
        endpoint || 'https://profile4-noneu.truecaller.com/v1/default',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!profileRes.ok) {
        console.error('[Truecaller] Profile fetch failed:', profileRes.status);
        return res.status(200).json({ success: false });
      }

      const profile = await profileRes.json();

      // Chuẩn hóa SĐT Việt Nam
      const rawPhone = profile?.phones?.[0]?.e164Format 
        || profile?.phoneNumbers?.[0] 
        || profile?.mobile
        || '';
      
      const phone = normalizePhone(rawPhone);
      const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() 
        || profile?.name 
        || '';
      const avatar = profile?.avatarUrl || profile?.avatar || '';

      // Lưu kết quả theo requestId để frontend polling lấy
      pendingResults.set(requestId, {
        phone,
        name,
        avatar,
        status: 'success',
        timestamp: Date.now(),
      });

      // Dọn dẹp sau 5 phút
      setTimeout(() => pendingResults.delete(requestId), 5 * 60 * 1000);

      console.log('[Truecaller] User verified:', { name, phone: phone ? '***' + phone.slice(-4) : 'none' });

      // Trả về 200 ngay để Truecaller biết đã nhận
      return res.status(200).json({ success: true });

    } catch (err) {
      console.error('[Truecaller] Callback error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // === GET: Frontend polling để lấy kết quả ===
  if (req.method === 'GET') {
    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    const result = pendingResults.get(requestId);

    if (!result) {
      return res.status(200).json({ status: 'pending' });
    }

    // Trả về kết quả và xóa khỏi memory
    pendingResults.delete(requestId);
    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    return '0' + cleaned.slice(2);
  }
  return cleaned.startsWith('0') ? cleaned : phone;
}
