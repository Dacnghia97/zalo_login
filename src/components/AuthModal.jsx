import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { startZaloRealLogin } from '../utils/zaloAuth';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authTab, setAuthTab, login, register, loginZaloDemo, showToast } = useAuth();

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast('Vui lòng điền đầy đủ Email/SĐT và Mật khẩu!', 'error');
      return;
    }
    login(loginIdentifier, loginPassword);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      showToast('Vui lòng điền đầy đủ các thông tin!', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('Mật khẩu nhập lại không khớp!', 'error');
      return;
    }
    if (!agreeTerms) {
      showToast('Vui lòng đồng ý với Điều khoản dịch vụ!', 'error');
      return;
    }

    register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword
    });
  };

  // Initiate Zalo Login (Smart Mobile App Deep Linking + Web OAuth Fallback)
  const handleRealZaloLogin = async () => {
    try {
      const { authUrl, zaloAppScheme, isMobile } = await startZaloRealLogin();
      
      if (isMobile) {
        showToast('Đang bật ứng dụng Zalo trên điện thoại...', 'info');
        // Try launching native Zalo app via scheme
        window.location.href = zaloAppScheme;
        // Fallback to web OAuth if native Zalo app scheme doesn't respond in 1.2s
        setTimeout(() => {
          window.location.href = authUrl;
        }, 1200);
      } else {
        showToast('Đang chuyển hướng sang cổng Đăng nhập Zalo...', 'info');
        window.location.href = authUrl;
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi mở trang Đăng nhập Zalo: ' + e.message, 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={closeAuthModal} title="Đóng">
          <X size={18} />
        </button>

        {/* Tab Headers */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => setAuthTab('login')}
          >
            Đăng Nhập
          </button>
          <button 
            className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => setAuthTab('register')}
          >
            Đăng Ký
          </button>
        </div>

        {/* Login Form */}
        {authTab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email hoặc Số điện thoại</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="name@example.com hoặc 0987..."
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="toggle-pwd-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); showToast('Tính năng khôi phục mật khẩu đã được gửi đến email!', 'info'); }}>
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" className="btn-auth-submit">
              Đăng Nhập Ngay <ArrowRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </button>

            <div className="divider">
              <span>hoặc đăng nhập bằng</span>
            </div>

            {/* Smart Zalo Login Button */}
            <button 
              type="button" 
              className="btn-social"
              style={{ 
                width: '100%', 
                background: '#0068ff', 
                color: 'white', 
                fontWeight: '700', 
                marginBottom: '8px',
                border: 'none',
                boxShadow: '0 4px 14px rgba(0, 104, 255, 0.35)',
                cursor: 'pointer'
              }}
              onClick={handleRealZaloLogin}
            >
              <span style={{ 
                background: 'white', 
                color: '#0068ff', 
                borderRadius: '4px', 
                padding: '0 6px', 
                fontWeight: '900',
                fontSize: '12px'
              }}>
                Zalo
              </span>
              Đăng Nhập Bằng Zalo (OAuth Thật)
            </button>

            {/* Instant Test Zalo Login Button (Quick Demo) */}
            <button 
              type="button" 
              className="btn-social"
              style={{ 
                width: '100%', 
                background: 'rgba(0, 200, 140, 0.15)', 
                color: 'var(--primary-green)', 
                fontWeight: '700', 
                marginBottom: '10px',
                border: '1px dashed rgba(0, 200, 140, 0.5)',
                cursor: 'pointer'
              }}
              onClick={() => loginZaloDemo('0987654321')}
            >
              ⚡ Test Nhanh Zalo (Mô phỏng lấy SĐT & OA Message)
            </button>

            <div className="social-btns">
              <button 
                type="button" 
                className="btn-social"
                onClick={() => showToast('Tính năng đăng nhập Google sẵn sàng khi có Client ID!', 'info')}
              >
                Google
              </button>
              <button 
                type="button" 
                className="btn-social"
                onClick={() => showToast('Tính năng đăng nhập Facebook sẵn sàng khi có App ID!', 'info')}
              >
                Facebook
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ban@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={18} />
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="0987 654 321"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showRegPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="Ít nhất 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="toggle-pwd-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nhập lại mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Xác nhận mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                />
                Tôi đồng ý với Điều khoản & Chính sách Bot.vn
              </label>
            </div>

            <button type="submit" className="btn-auth-submit">
              Tạo Tài Khoản Ngay <ArrowRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </button>

            <div className="divider">
              <span>hoặc đăng ký nhanh bằng</span>
            </div>

            <button 
              type="button" 
              className="btn-social"
              style={{ 
                width: '100%', 
                background: '#0068ff', 
                color: 'white', 
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={handleRealZaloLogin}
            >
              <span style={{ 
                background: 'white', 
                color: '#0068ff', 
                borderRadius: '4px', 
                padding: '0 6px', 
                fontWeight: '900',
                fontSize: '12px'
              }}>
                Zalo
              </span>
              Đăng Ký Bằng Zalo
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
