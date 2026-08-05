import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Moon, Sun, ShoppingCart, User, LogOut, BookOpen, Settings, ChevronDown, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, openAuthModal, openProfileModal, logout, theme, toggleTheme } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitial = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <header className="navbar">
      {/* Brand Logo */}
      <a href="#" className="logo-container">
        <div className="logo-icon">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="logo-text">
          Bot<span className="logo-domain">.vn</span>
        </div>
      </a>

      {/* Desktop Navigation Links */}
      <nav>
        <ul className="nav-menu">
          <li><a href="#" className="nav-link active">Trang chủ</a></li>
          <li><a href="#online" className="nav-link">Học Online</a></li>
          <li><a href="#offline" className="nav-link">Học Offline</a></li>
          <li><a href="#challenge" className="nav-link">Khóa Thử Thách</a></li>
          <li><a href="#marketer" className="nav-link">Next Marketer</a></li>
          <li><a href="#knowledge" className="nav-link">Kiến Thức</a></li>
        </ul>
      </nav>

      {/* Right Controls */}
      <div className="nav-actions">
        {/* Theme toggle */}
        <button 
          className="icon-btn" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Shopping Cart */}
        <button className="icon-btn" title="Giỏ hàng">
          <ShoppingCart size={18} />
          <span className="badge">0</span>
        </button>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          className="icon-btn mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Auth State Buttons or Logged-in Profile */}
        {!user ? (
          <div className="desktop-auth-btns">
            <button 
              className="btn-outline" 
              onClick={() => openAuthModal('register')}
            >
              Đăng ký
            </button>
            <button 
              className="btn-primary" 
              onClick={() => openAuthModal('login')}
            >
              Đăng nhập
            </button>
          </div>
        ) : (
          <div className="user-profile-menu">
            <button 
              className="user-avatar-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="avatar-circle">
                  {getInitial(user.name)}
                </div>
              )}
              <span className="user-name">{user.name}</span>
              <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div 
                  className="dropdown-header" 
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => { setIsDropdownOpen(false); openProfileModal(); }}
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0068ff' }}
                    />
                  ) : (
                    <div className="avatar-circle" style={{ width: '36px', height: '36px' }}>
                      {getInitial(user.name)}
                    </div>
                  )}
                  <div>
                    <div className="dropdown-user-name">{user.name}</div>
                    <div className="dropdown-user-email">
                      {user.provider ? `Đăng nhập qua ${user.provider}` : user.email}
                    </div>
                  </div>
                </div>

                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openProfileModal();
                  }}
                >
                  <User size={16} /> Thông tin cá nhân
                </button>
                <button className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <BookOpen size={16} /> Khóa học của tôi
                </button>
                <button className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <Settings size={16} /> Cài đặt tài khoản
                </button>
                <button 
                  className="dropdown-item danger" 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <ul className="mobile-nav-list">
            <li><a href="#" className="mobile-nav-item active" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</a></li>
            <li><a href="#online" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Học Online</a></li>
            <li><a href="#offline" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Học Offline</a></li>
            <li><a href="#challenge" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Khóa Thử Thách</a></li>
            <li><a href="#marketer" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Next Marketer</a></li>
            <li><a href="#knowledge" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>Kiến Thức</a></li>
          </ul>

          {!user && (
            <div className="mobile-auth-actions">
              <button 
                className="btn-outline" 
                style={{ width: '100%', padding: '12px' }}
                onClick={() => { setIsMobileMenuOpen(false); openAuthModal('register'); }}
              >
                Đăng ký
              </button>
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '12px' }}
                onClick={() => { setIsMobileMenuOpen(false); openAuthModal('login'); }}
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
