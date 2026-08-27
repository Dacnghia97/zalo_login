/**
 * src/utils/truecaller.js
 * 
 * Truecaller Web SDK Integration
 * 
 * Luồng hoạt động:
 * 1. Tạo requestNonce ngẫu nhiên
 * 2. Trigger deeplink truecallersdk:// → mở Truecaller app
 * 3. User nhấn "Continue" trong Truecaller
 * 4. Truecaller POST accessToken vào /api/truecaller-callback
 * 5. Backend fetch profile → lưu kết quả
 * 6. Frontend polling /api/truecaller-callback?requestId=xxx
 * 7. Nhận phone, name, avatar → đăng nhập thành công
 * 
 * Yêu cầu: User phải có app Truecaller trên điện thoại
 */

// Truecaller App Key từ https://developer.truecaller.com/
const TRUECALLER_APP_KEY = 'AHMt6dc683fb9f0854f9182ea9ce147afd4c3';
const TRUECALLER_APP_NAME = 'GET PHONE';
const TRUECALLER_CALLBACK_URL = 'https://botvn-seven.vercel.app/api/truecaller-callback';

/**
 * Kiểm tra xem user có thể dùng Truecaller không
 * (Chỉ hoạt động trên mobile browser có cài Truecaller)
 */
export function isTruecallerAvailable() {
  // Chỉ hoạt động trên mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile;
}

/**
 * Tạo nonce ngẫu nhiên (8-64 ký tự)
 */
function generateNonce(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Bắt đầu luồng xác thực Truecaller
 * 
 * @returns {Promise<{phone: string, name: string, avatar: string}>}
 */
export async function loginWithTruecaller() {
  if (!isTruecallerAvailable()) {
    throw new Error('MOBILE_ONLY: Truecaller chỉ hoạt động trên điện thoại có cài app Truecaller');
  }

  const requestNonce = generateNonce();

  // Lưu nonce vào sessionStorage để polling sau khi quay lại
  sessionStorage.setItem('truecaller_nonce', requestNonce);
  sessionStorage.setItem('truecaller_pending', 'true');

  // Tạo deeplink theo đúng format của Truecaller Web SDK
  const deepLink = [
    `truecallersdk://truesdk/web_verify`,
    `?requestNonce=${requestNonce}`,
    `&partnerKey=${TRUECALLER_APP_KEY}`,
    `&partnerName=${encodeURIComponent(TRUECALLER_APP_NAME)}`,
    `&lang=vi`,
    `&callbackUrl=${encodeURIComponent(TRUECALLER_CALLBACK_URL)}`,
    `&privacyUrl=${encodeURIComponent('https://botvn-seven.vercel.app/privacy')}`,
    `&termsUrl=${encodeURIComponent('https://botvn-seven.vercel.app/terms')}`,
    `&loginPrefix=use`,
    `&loginSuffix=number`,
    `&ctaPrefix=use`,
    `&ctaColor=%230068FF`,
    `&ctaTextColor=%23FFFFFF`,
    `&btnShape=round`,
  ].join('');

  // Trigger deeplink — mở Truecaller app
  window.location.href = deepLink;

  // Sau 600ms, nếu app không mở được → ném lỗi để fallback
  await new Promise((_, reject) => {
    setTimeout(() => {
      if (document.hasFocus()) {
        reject(new Error('TRUECALLER_NOT_FOUND: Không tìm thấy app Truecaller'));
      }
    }, 600);
  });

  // Polling chờ kết quả từ callback (max 60 giây)
  return pollForResult(requestNonce, 60);
}

/**
 * Polling API để lấy kết quả sau khi Truecaller callback
 * Được gọi khi trang load lại hoặc trong luồng hiện tại
 */
export async function pollForResult(requestNonce, timeoutSeconds = 60) {
  const startTime = Date.now();
  const timeout = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeout) {
    try {
      const res = await fetch(`/api/truecaller-callback?requestId=${requestNonce}`);
      const data = await res.json();

      if (data.status === 'success' && data.phone) {
        sessionStorage.removeItem('truecaller_nonce');
        sessionStorage.removeItem('truecaller_pending');
        return {
          phone: data.phone,
          name: data.name || '',
          avatar: data.avatar || '',
        };
      }

      if (data.status === 'pending') {
        // Chờ 1.5 giây rồi thử lại
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      // Lỗi khác
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error('TIMEOUT: Hết thời gian chờ Truecaller phản hồi');
}

/**
 * Kiểm tra khi trang load xem có pending Truecaller session không
 * (User có thể đã switch app và quay lại)
 */
export async function checkPendingTruecallerSession() {
  const nonce = sessionStorage.getItem('truecaller_nonce');
  const pending = sessionStorage.getItem('truecaller_pending');

  if (!nonce || !pending) return null;

  try {
    const res = await fetch(`/api/truecaller-callback?requestId=${nonce}`);
    const data = await res.json();

    if (data.status === 'success' && data.phone) {
      sessionStorage.removeItem('truecaller_nonce');
      sessionStorage.removeItem('truecaller_pending');
      return { phone: data.phone, name: data.name || '', avatar: data.avatar || '' };
    }
  } catch {
    // Silent fail
  }

  return null;
}
