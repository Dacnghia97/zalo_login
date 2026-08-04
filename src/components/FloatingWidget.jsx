import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

export const FloatingWidget = () => {
  return (
    <div className="floating-widgets">
      <button className="floating-btn" title="AI Assistant 1">
        <Sparkles size={20} color="#a855f7" />
      </button>
      <button className="floating-btn" title="AI Chatbot 2">
        <Bot size={20} color="#00c88c" />
      </button>
      <button className="floating-btn" title="Hỗ trợ trực tuyến">
        <MessageSquare size={20} color="#3b82f6" />
      </button>
    </div>
  );
};
