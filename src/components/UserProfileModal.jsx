import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, User, Mail, Phone, Calendar, Key, CheckCircle, Code, LogOut, ExternalLink, Copy, MessageSquare, Sparkles } from 'lucide-react';

export const UserProfileModal = () => {
  const { user, isProfileModalOpen, closeProfileModal, logout, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'raw'
  const [copied, setCopied] = useState(false);
  const [copiedOa, setCopiedOa] = useState(false);

  if (!isProfileModalOpen || !user) return null;

  const getInitial = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(user, null, 2));
    setCopied(true);
    showToast('Đã sao chép dữ liệu JSON!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOaId = (oaId) => {
    navigator.clipboard.writeText(oaId);
    setCopiedOa(true);
    showToast('Đã sao chép Zalo OA User ID (SmaxAi)!', 'success');
    setTimeout(() => setCopiedOa(false), 2000);
  };

  const displayOaUserId = user.oa_user_id || (user.id ? `oa_smaxai_${user.id}` : null);

  return (
    <div className="modal-overlay" onClick={closeProfileModal} style={{ zIndex: 1200 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '580px', padding: '0', overflow: 'hidden', border: '1px solid rgba(0, 200, 140, 0.3)' }}
      >
        {/* Profile Card Header */}
        <div style={{ background: 'linear-gradient(135deg, #0b1329 0%, #0068ff15 100%)', padding: '24px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
          <button className="modal-close-btn" onClick={closeProfileModal} title="Đóng">
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0068ff', boxShadow: '0 4px 14px rgba(0, 104, 255, 0.4)' }}
                />
              ) : (
                <div className="avatar-circle" style={{ width: '68px', height: '68px', fontSize: '26px' }}>
                  {getInitial(user.name)}
                </div>
              )}
              {user.provider === 'Zalo' && (
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#0068ff', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px', border: '2px solid var(--bg-card)' }}>
                  Z
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{user.name}</h3>
                {user.provider === 'Zalo' && (
                  <span style={{ background: 'rgba(0, 104, 255, 0.15)', color: '#3b82f6', border: '1px solid rgba(0, 104, 255, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Zalo Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user.provider ? `Xác thực bằng ${user.provider} Social API` : user.email}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--primary-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Đã liên kết Zalo OA SmaxAi (98732384813610746)
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
          <button 
            onClick={() => setActiveTab('summary')}
            style={{ flex: 1, padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '13.5px', color: activeTab === 'summary' ? 'var(--primary-green)' : 'var(--text-muted)', borderBottom: activeTab === 'summary' ? '2px solid var(--primary-green)' : 'none' }}
          >
            Thông Tin Chi Tiết & OA ID
          </button>
          <button 
            onClick={() => setActiveTab('raw')}
            style={{ flex: 1, padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '13.5px', color: activeTab === 'raw' ? 'var(--primary-green)' : 'var(--text-muted)', borderBottom: activeTab === 'raw' ? '2px solid var(--primary-green)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Code size={15} /> Dữ Liệu OAuth JSON
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', maxHeight: '420px', overflowY: 'auto' }}>
          {activeTab === 'summary' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* SPECIAL FEATURE: Zalo OA User ID SmaxAi */}
              {displayOaUserId && (
                <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(0, 104, 255, 0.12) 0%, rgba(0, 200, 140, 0.12) 100%)', borderRadius: '12px', border: '1px solid rgba(0, 104, 255, 0.4)', boxShadow: '0 4px 14px rgba(0, 104, 255, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={15} color="#0068ff" /> Zalo OA User ID (SmaxAi)
                    </div>
                    <span style={{ background: '#0068ff', color: 'white', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Sparkles size={11} /> Sẵn sàng nhắn tin OA
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <code style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-green)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {displayOaUserId}
                    </code>
                    <button 
                      onClick={() => copyOaId(displayOaUserId)} 
                      style={{ background: 'rgba(0, 200, 140, 0.2)', color: 'var(--primary-green)', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer', border: 'none' }}
                    >
                      <Copy size={13} /> {copiedOa ? 'Đã chép!' : 'Copy OA ID'}
                    </button>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Mã OA User ID này dùng để gọi API <code style={{ color: '#93c5fd' }}>POST /v3.0/oa/message/cs</code> gửi tin nhắn tự động từ Zalo OA <b>SmaxAi</b> tới khách hàng.
                  </div>
                </div>
              )}

              {/* Field 1: Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <User size={18} color="var(--primary-green)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Họ và Tên Zalo</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{user.name}</div>
                </div>
              </div>

              {/* Field 2: App Zalo ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Key size={18} color="#0068ff" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Zalo User ID (Social Web)</div>
                  <code style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa', marginTop: '2px', display: 'block' }}>{user.id}</code>
                </div>
              </div>

              {/* Field 3: Contact / Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Mail size={18} color="#a855f7" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email / Tài Khoản Liên Kết</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{user.email || user.phone || 'Tài khoản Zalo chính chủ'}</div>
                </div>
              </div>

              {/* Field 4: Avatar URL */}
              {user.avatar && (
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Link CDN Ảnh Đại Diện Zalo</div>
                  <a href={user.avatar} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: 'var(--primary-green)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{user.avatar}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {/* Field 5: Login Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Calendar size={18} color="#f59e0b" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời Gian Xác Thực Phiên Đăng Nhập</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{user.loginTime || 'Vừa xong'}</div>
                </div>
              </div>
            </div>
          ) : (
            /* RAW JSON Tab */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dữ liệu JSON phản hồi từ Zalo Graph API & OA Mapping:</span>
                <button onClick={copyJson} style={{ background: 'rgba(0, 200, 140, 0.15)', color: 'var(--primary-green)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none' }}>
                  <Copy size={12} /> {copied ? 'Đã chép!' : 'Copy JSON'}
                </button>
              </div>
              <pre style={{ background: '#090d16', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', color: '#34d399', fontSize: '12.5px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '280px' }}>
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{ padding: '16px 24px', background: 'rgba(0, 0, 0, 0.3)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={closeProfileModal}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Đóng
          </button>
          <button 
            onClick={logout}
            className="dropdown-item danger"
            style={{ width: 'auto', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <LogOut size={15} /> Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};
