import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle, ExternalLink, X, ArrowUpRight, Copy } from 'lucide-react';
import { startZaloRealLogin, ZALO_CONFIG } from '../utils/zaloAuth';

export const ZaloAuthConsentModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedUri, setSelectedUri] = useState(window.location.origin + '/');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin + '/';

  const handleRedirectToRealZalo = async () => {
    try {
      const { authUrl } = await startZaloRealLogin(selectedUri);
      window.location.href = authUrl;
    } catch (e) {
      console.error(e);
      alert('Không thể mở trang Zalo OAuth: ' + e.message);
    }
  };

  const copyLocalUri = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '460px', padding: '0', overflow: 'hidden', border: '1px solid #0068ff' }}>
        {/* Zalo Header */}
        <div style={{ background: '#0068ff', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '17px' }}>
            <div style={{ background: 'white', color: '#0068ff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>
              Z
            </div>
            <span>Zalo OAuth 2.0 (App: Smax)</span>
          </div>
          <button onClick={onClose} style={{ color: 'white', background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Explanation Alert for Error -14003 */}
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '18px', fontSize: '12.5px', color: '#f59e0b', lineHeight: '1.5' }}>
            <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={16} /> Lý do gặp lỗi "-14003 Invalid redirect uri":
            </div>
            <div>
              Zalo yêu cầu URL <code>{currentOrigin}</code> phải được đăng ký trước tại mục <strong>Callback URL</strong> trên Zalo Developer Console.
            </div>
          </div>

          {/* Quick Copy Local URL */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>URL Local cần thêm vào Zalo Developers:</div>
              <code style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-green)' }}>{currentOrigin}</code>
            </div>
            <button 
              onClick={copyLocalUri}
              style={{ background: 'rgba(0, 200, 140, 0.15)', color: 'var(--primary-green)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Copy size={13} /> {copied ? 'Đã chép!' : 'Copy'}
            </button>
          </div>

          {/* Option 1: Zalo Real Redirect */}
          <button 
            onClick={handleRedirectToRealZalo}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              background: '#0068ff', 
              color: 'white', 
              fontWeight: '700', 
              fontSize: '14px', 
              border: 'none', 
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 104, 255, 0.4)',
              cursor: 'pointer'
            }}
          >
            <span>Thử Đăng Nhập Zalo Thật Ngay</span>
            <ArrowUpRight size={16} />
          </button>

          {/* Option 2: Instant Demo Consent */}
          <button 
            onClick={onConfirm}
            style={{ 
              width: '100%', 
              padding: '11px', 
              borderRadius: '8px', 
              background: 'rgba(0, 200, 140, 0.12)', 
              color: '#00c88c', 
              fontWeight: '700', 
              fontSize: '13.5px', 
              border: '1px solid rgba(0, 200, 140, 0.3)',
              cursor: 'pointer'
            }}
          >
            Xác Thực Trực Tiếp (Demo Consent Không Bị Lỗi URL)
          </button>
        </div>
      </div>
    </div>
  );
};
