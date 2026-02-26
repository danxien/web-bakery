// =============================================================
// messages.jsx — Manager Messaging
// FILE: pages/manager/messages.jsx
// -------------------------------------------------------------
// PURPOSE: Manager communication view with Seller and Packer.
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import '../../styles/manager/messages.css';

// TODO: Backend - Fetch contact names from API
// Example: GET /api/users?role=seller  → sellerName = response.data.name
//          GET /api/users?role=packer  → packerName = response.data.name
const SELLER_NAME = '';
const PACKER_NAME = '';

// Format current time for outgoing messages
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */
const Messages = ({ onUnreadChange = () => {} }) => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty conversations with fetched messages
  // Endpoint: GET /api/messages?role=manager
  // Expected shape:
  // {
  //   seller: {
  //     contact: string,
  //     role:    string,
  //     unread:  number,
  //     messages: [{ id, from: 'seller' | 'manager', content, time }]
  //   },
  //   packer: { ... same shape ... }
  // }
  // -----------------------------------------------------------
  const [conversations, setConversations] = useState({
    seller: {
      contact:  SELLER_NAME || 'Seller',
      role:     'Sales Staff',
      unread:   0,
      messages: [],
    },
    packer: {
      contact:  PACKER_NAME || 'Packer',
      role:     'Packaging Staff',
      unread:   0,
      messages: [],
    },
  });

  const [activeKey, setActiveKey] = useState('seller');
  const [draft,     setDraft]     = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const active = conversations[activeKey];

  // Report total unread count to parent whenever conversations change
  useEffect(() => {
    const total = Object.values(conversations).reduce(
      (sum, conv) => sum + conv.unread, 0
    );
    onUnreadChange(total);
  }, [conversations]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeKey, conversations]);


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend - Fetch messages and contact names on mount
    // Example:
    // const fetchMessages = async () => {
    //   const response = await fetch('/api/messages?role=manager');
    //   const data = await response.json();
    //   setConversations(data.conversations);
    // };
    // fetchMessages();
    //
    // TODO: Backend - Subscribe to real-time updates
    // Option A: Polling — setInterval(fetchMessages, 5000)
    // Option B: WebSocket — ws.onmessage = (e) => { ... updateConversations }
  }, []);


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
  const handleSelectContact = (key) => {
    setActiveKey(key);
    setConversations(prev => ({
      ...prev,
      [key]: { ...prev[key], unread: 0 },
    }));
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    // TODO: Backend - Send message via API
    // Endpoint: POST /api/messages { to: activeKey, content: text }
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


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
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

          <div className="msg-chat__header">
            <div>
              <p className="msg-chat__name">{active.contact}</p>
              <p className="msg-chat__role">{active.role}</p>
            </div>
          </div>

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
            <button
              className={`msg-send-btn ${draft.trim() ? 'active' : ''}`}
              onClick={handleSend}
              title="Send (Enter)"
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

export default Messages;