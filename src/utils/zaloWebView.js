/**
 * Zalo WebView Bridge Utility
 * 
 * Khi user mở website từ bên trong Zalo app (qua link OA, chat, story...)
 * Zalo sẽ render website trong WebView nội bộ của Zalo.
 * Trong môi trường này, zmp-sdk hoạt động như Mini App và có thể
 * gọi getPhoneNumber() để lấy SĐT thật của user.
 */

/**
 * Detect xem có đang chạy trong Zalo WebView không
 */
export function isZaloWebView() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Zalo in-app browser thường có "ZaloApp" hoặc "Zalo/" trong User-Agent
  return /ZaloApp/i.test(ua) || /Zalo\//i.test(ua);
}

/**
 * Khởi tạo Zalo Mini App SDK trong WebView
 * SDK sẽ kết nối với Zalo native app
 */
export async function initZaloSDK() {
  try {
    const { init } = await import('zmp-sdk');
    await init({
      // App ID của Zalo App
      appId: '836228948044012533',
    });
    return true;
  } catch (err) {
    console.warn('[ZaloWebView] SDK init failed:', err);
    return false;
  }
}

/**
 * Lấy số điện thoại thật của user qua Zalo Mini App SDK
 * Chỉ hoạt động khi đang trong Zalo WebView
 * 
 * @returns {Promise<{phone: string|null, token: string|null, error: string|null}>}
 */
export async function getPhoneViaZaloSDK() {
  if (!isZaloWebView()) {
    return { phone: null, token: null, error: 'NOT_ZALO_WEBVIEW' };
  }

  try {
    const inited = await initZaloSDK();
    if (!inited) {
      return { phone: null, token: null, error: 'SDK_INIT_FAILED' };
    }

    const { getPhoneNumber } = await import('zmp-sdk');

    return new Promise((resolve) => {
      getPhoneNumber({
        success: (data) => {
          // data.token là phone_token, cần decode phía server
          // data.number là SĐT trực tiếp (nếu Zalo trả về)
          const phone = data?.number
            ? normalizeVietnamPhone(data.number)
            : null;

          resolve({
            phone,
            token: data?.token || null,
            error: null,
          });
        },
        fail: (err) => {
          console.warn('[ZaloWebView] getPhoneNumber failed:', err);
          resolve({
            phone: null,
            token: null,
            error: err?.message || 'GET_PHONE_FAILED',
          });
        },
      });
    });
  } catch (err) {
    console.error('[ZaloWebView] Unexpected error:', err);
    return { phone: null, token: null, error: err.message };
  }
}

/**
 * Lấy thông tin user (tên, avatar) qua Zalo SDK
 * Chỉ hoạt động khi đang trong Zalo WebView
 */
export async function getUserInfoViaZaloSDK() {
  if (!isZaloWebView()) return null;

  try {
    const inited = await initZaloSDK();
    if (!inited) return null;

    const { getUserInfo } = await import('zmp-sdk');

    return new Promise((resolve) => {
      getUserInfo({
        success: (data) => resolve(data?.userInfo || null),
        fail: () => resolve(null),
      });
    });
  } catch {
    return null;
  }
}

/**
 * Chuẩn hóa SĐT Việt Nam
 * Chuyển +84xxx hoặc 84xxx → 0xxx
 */
function normalizeVietnamPhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    return '0' + cleaned.slice(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned;
  }
  return phone;
}
