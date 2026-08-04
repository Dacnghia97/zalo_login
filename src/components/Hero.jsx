import React from 'react';

export const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-bg-glow"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          Hệ Sinh Thái Đào Tạo <span className="gradient-text">Marketing Đột Phá</span>
        </h1>
        <p className="hero-subtitle">
          Nền tảng đào tạo chuyên sâu về digital marketing, chuyển giao các giải pháp và công cụ tự động hóa ứng dụng AI để tối ưu hóa hiệu suất Marketing của bạn.
        </p>
        <div className="hero-actions">
          <button className="hero-btn-primary">
            Học Online Ngay
          </button>
          <button className="hero-btn-secondary">
            Tìm Khóa Offline
          </button>
        </div>
      </div>
    </section>
  );
};
