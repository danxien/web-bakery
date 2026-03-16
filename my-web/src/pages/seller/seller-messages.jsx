import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import '../../styles/seller/seller-messages.css';

const SellerMessages = ({ onSend }) => {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const threadEndRef             = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const newMsg = {
      id:      Date.now(),
      content: text,
      sender:  'seller',
      time:    new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    if (typeof onSend === 'function') onSend(newMsg);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sm-page">

      {/* ── Header ── */}
      <div className="sm-header">
        <h1 className="sm-title">Messages</h1>
        <p className="sm-subtitle">Communicate with the Packer</p>
      </div>

      {/* ── Two-panel shell ── */}
      <div className="sm-panel">

        {/* ── Sidebar ── */}
        <div className="sm-contacts">
          <span className="sm-contacts__label">Conversations</span>
          <button className="sm-contact-item active">
            <div className="sm-contact-info">
              <span className="sm-contact-name">Packer</span>
              <span className="sm-contact-role">Packaging Staff</span>
            </div>
          </button>
        </div>

        {/* ── Chat area ── */}
        <div className="sm-chat">

          {/* Chat Header */}
          <div className="sm-chat__header">
            <div>
              <p className="sm-chat__name">Packer</p>
              <p className="sm-chat__role">Packaging Staff</p>
            </div>
          </div>

          {/* Thread */}
          <div className="sm-thread">
            {messages.length === 0 ? (
              <div className="sm-empty">
                <MessageSquare size={36} color="#ccc" />
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`sm-bubble-wrap ${msg.sender === 'seller' ? 'sm-bubble-wrap--out' : 'sm-bubble-wrap--in'}`}
                >
                  <div className={`sm-bubble ${msg.sender === 'seller' ? 'sm-bubble--out' : 'sm-bubble--in'}`}>
                    <p>{msg.content}</p>
                    <span className="sm-time">{msg.time || ''}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Input Bar */}
          <div className="sm-input-bar">
            <textarea
              className="sm-input"
              rows={1}
              placeholder="Message Packer..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`sm-send-btn ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerMessages;