import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { handleZaloCallbackCode, ZALO_CONFIG } from '../utils/zaloAuth';

const AuthContext = createContext();

const INITIAL_USERS = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'demo@bot.vn',
    phone: '0987654321',
    password: '123456'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);

  // Load user state, theme & check Zalo OAuth callback code
  useEffect(() => {
    const savedUser = localStorage.getItem('botvn_current_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const savedUsers = localStorage.getItem('botvn_registered_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error(e);
      }
    }

    const savedTheme = localStorage.getItem('botvn_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Check Zalo OAuth callback URL query code
    const urlParams = new URLSearchParams(window.location.search);
    const zaloCode = urlParams.get('code');
    if (zaloCode) {
      showToast('Đang trao đổi Token với máy chủ Zalo...', 'info');
      handleZaloCallbackCode(zaloCode).then(result => {
        if (result.success && result.user) {
          const zaloSession = {
            id: result.user.id,
            oa_user_id: result.user.oa_user_id || `oa_smaxai_${result.user.id}`,
            name: result.user.name,
            phone: result.user.phone || null,
            email: 'zalo_' + result.user.id + '@zalo.me',
            avatar: result.user.avatar,
            provider: 'Zalo',
            rawProfile: result.rawProfile || {},
            loginTime: new Date().toLocaleString('vi-VN')
          };
          setUser(zaloSession);
          localStorage.setItem('botvn_current_user', JSON.stringify(zaloSession));
          setIsProfileModalOpen(true);
          showToast(`Đăng nhập Zalo thành công! Chào mừng ${zaloSession.name}`, 'success');
          triggerConfetti();

          // AUTOMATIC WELCOME MESSAGE DISPATCH VIA ZALO OA SMAXAI
          fetch('/api/send-zalo-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              app_user_id: zaloSession.id,
              oa_user_id: zaloSession.oa_user_id,
              user_name: zaloSession.name,
              custom_message: `🎉 Chào mừng ${zaloSession.name} đã đăng nhập thành công vào hệ thống đào tạo Bot.vn! Trang Zalo OA SmaxAi hân hạnh đồng hành cùng bạn.`
            })
          })
          .then(res => res.json())
          .then(welcomeRes => {
            console.log('Automated Zalo OA Welcome Message result:', welcomeRes);
            if (welcomeRes.success) {
              setTimeout(() => {
                showToast(`💬 Đã kích hoạt tin nhắn chào mừng tự động từ Zalo OA SmaxAi tới ${zaloSession.name}!`, 'success');
              }, 1200);
            }
          })
          .catch(err => {
            console.warn('Automated welcome message trigger error:', err);
          });

        } else {
          showToast(`Zalo OAuth Note: ${result.error || 'Cần đăng ký Callback URL trên Zalo Developers'}`, 'info');
        }
        // Clean URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else {
      // Auto prompt Zalo Phone Permission Bottom Sheet on initial website load
      const promptTimer = setTimeout(() => {
        const currentUserStr = localStorage.getItem('botvn_current_user');
        if (!currentUserStr) {
          setIsPhoneSheetOpen(true);
        } else {
          try {
            const parsed = JSON.parse(currentUserStr);
            if (!parsed?.phone) {
              setIsPhoneSheetOpen(true);
            }
          } catch (e) {
            setIsPhoneSheetOpen(true);
          }
        }
      }, 1000);
      return () => clearTimeout(promptTimer);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('botvn_theme', newTheme);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti error', e);
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const login = (identifier, password) => {
    const foundUser = users.find(
      u => (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) && u.password === password
    );

    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        loginTime: new Date().toLocaleString('vi-VN')
      };
      setUser(userSession);
      localStorage.setItem('botvn_current_user', JSON.stringify(userSession));
      closeAuthModal();
      showToast(`Chào mừng bạn trở lại, ${foundUser.name}!`, 'success');
      triggerConfetti();
      return { success: true };
    } else {
      showToast('Email/Số điện thoại hoặc mật khẩu không chính xác!', 'error');
      return { success: false, error: 'Thông tin đăng nhập không chính xác' };
    }
  };

  const register = (userData) => {
    const { name, email, phone, password } = userData;

    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      showToast('Email này đã được đăng ký tài khoản!', 'error');
      return { success: false, error: 'Email đã tồn tại' };
    }

    const newUser = {
      id: String(Date.now()),
      name,
      email,
      phone,
      password,
      loginTime: new Date().toLocaleString('vi-VN')
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('botvn_registered_users', JSON.stringify(updatedUsers));

    const userSession = { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, loginTime: newUser.loginTime };
    setUser(userSession);
    localStorage.setItem('botvn_current_user', JSON.stringify(userSession));

    closeAuthModal();
    showToast(`Đăng ký tài khoản thành công! Chào mừng ${name} đến với Bot.vn`, 'success');
    triggerConfetti();
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('botvn_current_user');
    setIsProfileModalOpen(false);
    showToast('Đã đăng xuất tài khoản thành công', 'info');
  };

  const loginZaloDemo = (demoPhone = '0987654321') => {
    const zaloDemoSession = {
      id: '89472398423984',
      oa_user_id: '98732384813610746',
      name: 'Nguyễn Văn Zalo (Test)',
      phone: demoPhone,
      email: 'zalo_89472398423984@zalo.me',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      provider: 'Zalo',
      rawProfile: {
        id: '89472398423984',
        name: 'Nguyễn Văn Zalo (Test)',
        phone_number: demoPhone,
        note: 'Dữ liệu Test Mẫu Zalo OAuth PKCE + Zalo Phone Verified'
      },
      loginTime: new Date().toLocaleString('vi-VN')
    };
    setUser(zaloDemoSession);
    localStorage.setItem('botvn_current_user', JSON.stringify(zaloDemoSession));
    closeAuthModal();
    showToast(`Đăng nhập Zalo (Test) thành công! Đã lấy SĐT: ${demoPhone}`, 'success');
    triggerConfetti();
    setIsProfileModalOpen(true);
  };

  const [isPhoneSheetOpen, setIsPhoneSheetOpen] = useState(false);

  const openPhoneSheet = () => setIsPhoneSheetOpen(true);
  const closePhoneSheet = () => setIsPhoneSheetOpen(false);

  const approveZaloPhone = (approvedPhone = '0987654321') => {
    let activeUser = user;
    if (!activeUser) {
      activeUser = {
        id: '5669266073298871588',
        oa_user_id: '98732384813610746',
        name: 'Đắc Nghĩa (Zalo)',
        phone: approvedPhone,
        email: 'zalo_dacnghia@zalo.me',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        provider: 'Zalo',
        loginTime: new Date().toLocaleString('vi-VN')
      };
    } else {
      activeUser = { ...activeUser, phone: approvedPhone };
    }

    setUser(activeUser);
    localStorage.setItem('botvn_current_user', JSON.stringify(activeUser));
    closePhoneSheet();
    showToast(`Đã xác thực thành công SĐT Zalo: ${approvedPhone}`, 'success');
    triggerConfetti();
    setIsProfileModalOpen(true);

    // AUTOMATIC WELCOME MESSAGE DISPATCH VIA ZALO OA SMAXAI
    fetch('/api/send-zalo-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_user_id: activeUser.id,
        oa_user_id: activeUser.oa_user_id,
        user_name: activeUser.name,
        custom_message: `🎉 Chào mừng ${activeUser.name} (${approvedPhone}) đã cấp quyền SĐT thành công vào hệ thống! Zalo OA SmaxAi hân hạnh đồng hành cùng bạn.`
      })
    }).catch(e => console.warn('OA welcome dispatch error:', e));
  };

  const updateUserPhone = (newPhone) => {
    if (!user) return;
    const updatedUser = { ...user, phone: newPhone };
    setUser(updatedUser);
    localStorage.setItem('botvn_current_user', JSON.stringify(updatedUser));
    showToast(`Đã cập nhật Số điện thoại thành công: ${newPhone}`, 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        theme,
        toggleTheme,
        isAuthModalOpen,
        authTab,
        setAuthTab,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        isPhoneSheetOpen,
        openPhoneSheet,
        closePhoneSheet,
        approveZaloPhone,
        login,
        register,
        loginZaloDemo,
        updateUserPhone,
        logout,
        toasts,
        showToast,
        zaloAppId: ZALO_CONFIG.appId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
