// =============================================================
// messages.jsx — Manager Messaging
// FILE: pages/manager/messages.jsx
// -------------------------------------------------------------
// 🔹 BACKEND: Replace mock `initialConversations` with
//    GET /api/messages?role=manager
// 🔹 BACKEND: Replace handleSend with
//    POST /api/messages { to, content }
// 🔹 BACKEND: Poll or use WebSocket for real-time updates
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import '../../styles/manager/messages.css';

// ── Contact display names ─────────────────────────────────────
// 🔹 BACKEND: Replace these with real names fetched from your API.
//    e.g. GET /api/users?role=seller  →  sellerName = response.data.name
//         GET /api/users?role=packer  →  packerName = response.data.name
const SELLER_NAME = 'Juan dela Cruz';   // 🔹 BACKEND: replace with API seller name
const PACKER_NAME = 'Maria Santos';     // 🔹 BACKEND: replace with API packer name

// ── Mock conversation data ────────────────────────────────────
// 🔹 BACKEND: Replace with GET /api/messages?role=manager response
const initialConversations = {
  seller: {
    contact: SELLER_NAME,
    role:    'Sales Staff',
    unread:  2,
    messages: [
      { id: 1, from: 'seller',  content: 'Good morning! We are running low on Red Velvet today.', time: '8:02 AM' },
      { id: 2, from: 'manager', content: 'Thanks for the heads up. I will check inventory now.', time: '8:05 AM' },
      { id: 3, from: 'seller',  content: 'Also, a customer is asking about custom cake orders for next week.', time: '8:10 AM' },
      { id: 4, from: 'seller',  content: 'Should I direct them to the custom order form?', time: '8:11 AM' },
    ],
  },
  packer: {
    contact: PACKER_NAME,
    role:    'Packaging Staff',
    unread:  0,
    messages: [
      { id: 1, from: 'manager', content: 'Please make sure all Mango Chiffon orders are packed by 11 AM.', time: 'Yesterday' },
      { id: 2, from: 'packer',  content: 'Understood! We are on it.', time: 'Yesterday' },
      { id: 3, from: 'packer',  content: 'All done — 12 boxes packed and labelled.', time: '9:45 AM' },
    ],
  },
};

// ── Format current time ───────────────────────────────────────
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ── Component ─────────────────────────────────────────────────
const Messages = () => {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeKey,     setActiveKey]     = useState('seller');
  const [draft,         setDraft]         = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const active = conversations[activeKey];

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeKey, conversations]);

  // Switch contact + clear unread badge
  const handleSelectContact = (key) => {
    setActiveKey(key);
    setConversations(prev => ({
      ...prev,
      [key]: { ...prev[key], unread: 0 },
    }));
    inputRef.current?.focus();
  };

  // Send message
  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    // 🔹 BACKEND: POST /api/messages { to: activeKey, content: text }
    const newMsg = {
      id:      Date.now(),
      from:    'manager',
      content: text,
      time:    nowTime(),
    };

    setConversations(prev => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        messages: [...prev[activeKey].messages, newMsg],
      },
    }));
    setDraft('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="msg-page">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="msg-header">
        <h1 className="msg-title">Messages</h1>
        <p className="msg-subtitle">Communicate with Seller and Packer</p>
      </div>

      {/* ── Main panel ────────────────────────────────────── */}
      <div className="msg-panel">

        {/* ── Contacts sidebar ────────────────────────────── */}
        <div className="msg-contacts">
          <div className="msg-contacts__label">Conversations</div>

          {Object.entries(conversations).map(([key, conv]) => (
            <button
              key={key}
              className={`msg-contact-item ${activeKey === key ? 'active' : ''}`}
              onClick={() => handleSelectContact(key)}
            >
              {/* Avatar circles removed — names shown directly */}
              <div className="msg-contact-info">
                <span className="msg-contact-name">{conv.contact}</span>
                <span className="msg-contact-role">{conv.role}</span>
              </div>
              {conv.unread > 0 && (
                <span className="msg-unread-badge">{conv.unread}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Chat area ───────────────────────────────────── */}
        <div className="msg-chat">

          {/* Chat header — name only, no avatar circle */}
          <div className="msg-chat__header">
            <div>
              <p className="msg-chat__name">{active.contact}</p>
              <p className="msg-chat__role">{active.role}</p>
            </div>
          </div>

          {/* Message thread */}
          <div className="msg-thread">
            {active.messages.length === 0 ? (
              <div className="msg-empty">
                <MessageSquare size={36} strokeWidth={1.2} />
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              active.messages.map((msg) => {
                const isManager = msg.from === 'manager';
                return (
                  <div
                    key={msg.id}
                    className={`msg-bubble-wrap ${isManager ? 'msg-bubble-wrap--out' : 'msg-bubble-wrap--in'}`}
                  >
                    {/* Avatar circles removed from bubbles */}
                    <div className={`msg-bubble ${isManager ? 'msg-bubble--out' : 'msg-bubble--in'}`}>
                      <p>{msg.content}</p>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="msg-input-bar">
            <textarea
              ref={inputRef}
              className="msg-input"
              rows={1}
              placeholder={`Message ${active.contact}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* Send button — Lucide Send icon + label */}
            <button
              className={`msg-send-btn ${draft.trim() ? 'active' : ''}`}
              onClick={handleSend}
              title="Send (Enter)"
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>

        </div>{/* end .msg-chat */}
      </div>{/* end .msg-panel */}

    </div>
  );
};

export default Messages;