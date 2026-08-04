import React from 'react';
import { Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-container">
            <div className="logo-icon">
              <Zap size={20} fill="currentColor" />
            </div>
            <div className="logo-text">
              Bot<span className="logo-domain">.vn</span>
            </div>
          </div>
          <p className="footer-desc">
            Hệ sinh thái đào tạo marketing, giải pháp chatbot và tối ưu hóa chuyển đổi tự động hàng đầu Việt Nam.
          </p>
        </div>

        <div>
          <h4 className="footer-info-title">Hệ sinh thái</h4>
          <p className="footer-info-text">
            Cung cấp kiến thức nền tảng và chuyên sâu về MarTech.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Bot.vn. Tất cả bản quyền được bảo lưu.
      </div>
    </footer>
  );
};
