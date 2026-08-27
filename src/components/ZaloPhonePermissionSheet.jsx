import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Phone, X, Check, Lock, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { isZaloWebView, getPhoneViaZaloSDK } from '../utils/zaloWebView';
import { isTruecallerAvailable, loginWithTruecaller, checkPendingTruecallerSession } from '../utils/truecaller';

export const ZaloPhonePermissionSheet = () => {
  const { isPhoneSheetOpen, closePhoneSheet, approveZaloPhone, user, showToast } = useAuth();
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inZaloWebView] = useState(() => isZaloWebView());
  const [hasTruecaller] = useState(() => isTruecallerAvailable());
  const [truecallerPolling, setTruecallerPolling] = useState(false);

  // Kiểm tra pending Truecaller session khi trang load lại
  useEffect(() => {
    checkPendingTruecallerSession().then((result) => {
      if (result?.phone) {
        approveZaloPhone(result.phone);
      }
    });
  }, []);

  if (!isPhoneSheetOpen) return null;

  const handleApprove = async () => {
    // Nếu đã có SĐT từ Zalo - xác nhận luôn
    if (user?.phone) {
      approveZaloPhone(user.phone);
      return;
    }

    setIsSubmitting(true);

    // === ZALO WEBVIEW: dùng zmp-sdk như Mini App ===
    if (inZaloWebView) {
      showToast('⚡ Đang kết nối Zalo để lấy số điện thoại...', 'info');
      try {
        const result = await getPhoneViaZaloSDK();
        if (result.phone) {
          approveZaloPhone(result.phone);
          setIsSubmitting(false);
          return;
        } else {
          showToast('Zalo chưa trả về SĐT. Vui lòng thử lại.', 'error');
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('[ZaloWebView] getPhone error:', err);
        showToast('Có lỗi khi lấy SĐT từ Zalo. Vui lòng nhập tay.', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    // === TRÌNH DUYỆT THƯỜNG: nhập tay ===
    const finalPhone = phoneInput.trim();
    if (!finalPhone) {
      showToast('Vui lòng nhập Số Điện Thoại Zalo của bạn!', 'error');
      setIsSubmitting(false);
      return;
    }

    const phoneRegex = /^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!phoneRegex.test(finalPhone.replace(/\s/g, ''))) {
      showToast('Số điện thoại không hợp lệ! Vui lòng kiểm tra lại.', 'error');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      approveZaloPhone(finalPhone.replace(/\s/g, ''));
      setIsSubmitting(false);
    }, 350);
  }; // end handleApprove

  // === TRUECALLER LOGIN ===
  const handleTruecallerLogin = async () => {
    setTruecallerPolling(true);
    showToast('⚡ Đang mở Truecaller...', 'info');
    try {
      const result = await loginWithTruecaller();
      if (result?.phone) {
        approveZaloPhone(result.phone);
      }
    } catch (err) {
      if (err.message.includes('TRUECALLER_NOT_FOUND')) {
        showToast('Không tìm thấy app Truecaller. Vui lòng cài đặt hoặc nhập SĐT tay.', 'error');
      } else if (err.message.includes('TIMEOUT')) {
        showToast('Quá thời gian chờ. Vui lòng thử lại.', 'error');
      } else {
        showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
      }
    } finally {
      setTruecallerPolling(false);
    }
  };


  return (
    <div 
      className="modal-overlay" 
      onClick={closePhoneSheet} 
      style={{ 
        zIndex: 2000, 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        padding: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          maxWidth: '480px', 
          background: 'linear-gradient(180deg, #111827 0%, #0b1329 100%)', 
          borderRadius: '24px 24px 0 0', 
          border: '1px solid rgba(0, 104, 255, 0.3)',
          borderBottom: 'none',
          padding: '20px 24px 32px 24px', 
          boxShadow: '0 -10px 40px rgba(0, 104, 255, 0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Top Drag Indicator Pill */}
        <div style={{ width: '40px', height: '5px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '3px', margin: '0 auto 16px auto' }} />

        {/* Close Button */}
        <button 
          onClick={closePhoneSheet}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          title="Đóng"
        >
          <X size={18} />
        </button>

        {/* Header App Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#0068ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '20px', boxShadow: '0 4px 14px rgba(0, 104, 255, 0.4)' }}>
            Z
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '16px', color: 'white' }}>Bot.vn Training</span>
              <span style={{ background: 'rgba(0, 200, 140, 0.15)', color: 'var(--primary-green)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ShieldCheck size={12} /> Zalo App Verified
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Yêu cầu cấp quyền truy cập từ tài khoản Zalo của bạn
            </p>
          </div>
        </div>

        {/* Sheet Title */}
        <div style={{ padding: '14px 16px', background: 'rgba(0, 104, 255, 0.08)', borderRadius: '14px', border: '1px solid rgba(0, 104, 255, 0.2)', marginBottom: '18px' }}>
          <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Sparkles size={16} /> Xin quyền truy cập Số Điện Thoại Zalo
          </div>
          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: 0 }}>
            Cho phép <b>Bot.vn</b> truy xuất số điện thoại Zalo của bạn để tự động xác thực thành viên và nhận thông báo lịch học qua Zalo Official Account.
          </p>
        </div>

        {/* Phone Input */}
        <div style={{ marginBottom: '20px' }}>
          {user?.phone ? (
            // Đã có SĐT từ Zalo - xác nhận
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
              background: 'rgba(0, 200, 140, 0.1)', borderRadius: '14px',
              border: '1.5px solid rgba(0, 200, 140, 0.5)'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 200, 140, 0.2)', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '3px' }}>SĐT Zalo Của Bạn</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary-green)', letterSpacing: '0.5px' }}>{user.phone}</div>
              </div>
              <div style={{ marginLeft: 'auto', background: 'var(--primary-green)', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
            </div>

          ) : inZaloWebView ? (
            // === TRONG ZALO WEBVIEW: tự động lấy SĐT qua SDK ===
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
              background: 'rgba(0, 104, 255, 0.1)', borderRadius: '14px',
              border: '1.5px solid rgba(0, 104, 255, 0.4)'
            }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0, 104, 255, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={22} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                  Cho phép lấy SĐT từ Zalo
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Nhấn <b style={{ color: '#60a5fa' }}>"Cho Phép Cấp Quyền SĐT"</b> bên dưới.<br/>
                  Zalo sẽ hiện popup xác nhận và tự động trả về số điện thoại.
                </div>
              </div>
            </div>

          ) : (
            // === TRÌNH DUYỆT THƯỜNG: Truecaller (mobile) + nhập tay ===
            <div>
              {/* Truecaller button - chỉ hiện trên mobile */}
              {hasTruecaller && (
                <div style={{ marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={handleTruecallerLogin}
                    disabled={truecallerPolling}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: truecallerPolling
                        ? 'rgba(0,100,0,0.2)'
                        : 'linear-gradient(135deg, #00875a 0%, #006644 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: truecallerPolling ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 20px rgba(0,135,90,0.4)',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="20" fill="#00B050"/>
                      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">T</text>
                    </svg>
                    {truecallerPolling ? 'Đang chờ Truecaller...' : '1-Click lấy SĐT với Truecaller'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Nhấn để mở app Truecaller → xác nhận → nhận SĐT tự động
                  </div>
                </div>
              )}

              {/* Divider */}
              {hasTruecaller && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>hoặc nhập tay</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Phone size={14} color="#f59e0b" />
                <span style={{ fontSize: '12.5px', color: '#f59e0b', fontWeight: '700' }}>
                  Nhập Số Điện Thoại Zalo Của Bạn
                </span>
              </div>
              <input
                type="tel"
                className="form-input"
                style={{
                  width: '100%', padding: '13px 16px', fontSize: '16px', fontWeight: '700',
                  background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(0, 104, 255, 0.5)',
                  borderRadius: '12px', color: 'white', letterSpacing: '0.5px', boxSizing: 'border-box'
                }}
                placeholder="Ví dụ: 0912 345 678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApprove()}
                autoFocus={!hasTruecaller}
              />
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                📌 Vui lòng nhập SĐT chính xác đang dùng tài khoản Zalo của bạn.
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '20px', justifyContent: 'center' }}>
          <Lock size={13} color="var(--primary-green)" /> Thông tin được bảo mật chuẩn mã hóa Zalo Security API
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={closePhoneSheet}
            style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            Từ Chối
          </button>
          
          <button 
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            style={{ 
              flex: 2, 
              padding: '14px', 
              background: 'linear-gradient(135deg, #0068ff 0%, #0052cc 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '800', 
              fontSize: '15px', 
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0, 104, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? 'Đang xác thực SĐT...' : (
              <>
                Cho Phép Cấp Quyền SĐT <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
