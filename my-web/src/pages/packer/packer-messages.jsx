import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import '../../styles/manager/messages.css';

const THREAD_META = {
  seller: { label: 'Seller - Main Branch', role: 'Sales Staff' },
  manager: { label: 'Manager - Main Branch', role: 'Admin Staff' },
};

export default function PackerMessages({ inboxMessages, onAction, onSendMessage, onMarkThreadRead }) {
  const [activeThread, setActiveThread] = useState('seller');
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const conversations = useMemo(() => {
    const grouped = { seller: [], manager: [] };
    inboxMessages.forEach((msg) => {
      const key = msg.thread === 'manager' ? 'manager' : 'seller';
      grouped[key].push(msg);
    });
    return grouped;
  }, [inboxMessages]);

  const unreadCounts = useMemo(
    () => ({
      seller: conversations.seller.filter((msg) => msg.unread && msg.fromRole !== 'packer').length,
      manager: conversations.manager.filter((msg) => msg.unread && msg.fromRole !== 'packer').length,
    }),
    [conversations]
  );

  const activeMessages = conversations[activeThread] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, inboxMessages]);

  const selectThread = (thread) => {
    setActiveThread(thread);
    onMarkThreadRead?.(thread);
    inputRef.current?.focus();
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage?.(activeThread, text);
    setDraft('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderSellerActions = (msg) => {
    if (activeThread !== 'seller' || msg.fromRole === 'packer') return null;

    const content = msg.content.toLowerCase();
    const isCustom = content.includes('custom');
    const isOrder = content.includes('order');

    if (!isCustom && !isOrder) return null;

    return (
      <div className="pkmsg-actions">
        {isOrder && (
          <button type="button" onClick={() => onAction?.(msg.id, 'add-order-delivery')}>
            Add Order to Deliveries
          </button>
        )}
        {isCustom && (
          <button type="button" onClick={() => onAction?.(msg.id, 'add-custom-delivery')}>
            Add Custom to Deliveries
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="msg-page">
      <div className="msg-header">
        <h1 className="msg-title">Messages</h1>
        <p className="msg-subtitle">Communicate with Seller and Manager</p>
      </div>

      <div className="msg-panel">
        <div className="msg-contacts">
          <div className="msg-contacts__label">Conversations</div>

          {Object.keys(THREAD_META).map((thread) => (
            <button
              key={thread}
              type="button"
              className={`msg-contact-item ${activeThread === thread ? 'active' : ''}`}
              onClick={() => selectThread(thread)}
            >
              <div className="msg-contact-info">
                <span className="msg-contact-name">{THREAD_META[thread].label}</span>
                <span className="msg-contact-role">{THREAD_META[thread].role}</span>
              </div>
              {unreadCounts[thread] > 0 && <span className="msg-unread-badge">{unreadCounts[thread]}</span>}
            </button>
          ))}
        </div>

        <div className="msg-chat">
          <div className="msg-chat__header">
            <div>
              <p className="msg-chat__name">{THREAD_META[activeThread].label}</p>
              <p className="msg-chat__role">{THREAD_META[activeThread].role}</p>
            </div>
          </div>

          <div className="msg-thread">
            {activeMessages.length === 0 ? (
              <div className="msg-empty">
                <MessageSquare size={36} strokeWidth={1.2} />
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const outgoing = msg.fromRole === 'packer';
                return (
                  <div
                    key={msg.id}
                    className={`msg-bubble-wrap ${outgoing ? 'msg-bubble-wrap--out' : 'msg-bubble-wrap--in'}`}
                  >
                    <div className={`msg-bubble ${outgoing ? 'msg-bubble--out' : 'msg-bubble--in'} ${msg.urgent ? 'msg-bubble--urgent' : ''}`}>
                      <p>{msg.content}</p>
                      <span className="msg-time">{msg.sentAt}</span>
                      {msg.actionTaken && <small className="msg-tag">{msg.actionTaken}</small>}
                      {renderSellerActions(msg)}
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
              placeholder={`Message ${THREAD_META[activeThread].label}...`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={`msg-send-btn ${draft.trim() ? 'active' : ''}`}
              onClick={sendMessage}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
