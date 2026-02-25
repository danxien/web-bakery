import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

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
    <div className="pkmsg-page">
      <div className="pkmsg-header">
        <h1 className="pkmsg-title">Messages</h1>
        <p className="pkmsg-subtitle">Communicate with Manager and Seller</p>
      </div>

      <div className="pkmsg-panel">
        <div className="pkmsg-contacts">
          <div className="pkmsg-contacts-label">Conversations</div>

          {Object.keys(THREAD_META).map((thread) => (
            <button
              key={thread}
              type="button"
              className={`pkmsg-contact-item ${activeThread === thread ? 'active' : ''}`}
              onClick={() => selectThread(thread)}
            >
              <div className="pkmsg-contact-info">
                <span className="pkmsg-contact-name">{THREAD_META[thread].label}</span>
                <span className="pkmsg-contact-role">{THREAD_META[thread].role}</span>
              </div>
              {unreadCounts[thread] > 0 && <span className="pkmsg-unread">{unreadCounts[thread]}</span>}
            </button>
          ))}
        </div>

        <div className="pkmsg-chat">
          <div className="pkmsg-chat-header">
            <p className="pkmsg-chat-name">{THREAD_META[activeThread].label}</p>
            <p className="pkmsg-chat-role">{THREAD_META[activeThread].role}</p>
          </div>

          <div className="pkmsg-thread">
            {activeMessages.length === 0 ? (
              <div className="pkmsg-empty">
                <MessageSquare size={36} strokeWidth={1.2} />
                <p>No messages yet.</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const outgoing = msg.fromRole === 'packer';
                return (
                  <div key={msg.id} className={`pkmsg-row ${outgoing ? 'out' : 'in'}`}>
                    <div className={`pkmsg-bubble ${outgoing ? 'out' : 'in'} ${msg.urgent ? 'urgent' : ''}`}>
                      <p>{msg.content}</p>
                      <span className="pkmsg-time">{msg.sentAt}</span>
                      {msg.actionTaken && <small className="pkmsg-tag">{msg.actionTaken}</small>}
                      {renderSellerActions(msg)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="pkmsg-input-bar">
            <textarea
              ref={inputRef}
              className="pkmsg-input"
              rows={1}
              placeholder={`Message ${THREAD_META[activeThread].label}...`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={`pkmsg-send-btn ${draft.trim() ? 'active' : ''}`}
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
