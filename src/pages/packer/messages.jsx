import React from 'react';
import { Send } from 'lucide-react';

export default function PackerMessages({ inboxMessages, onAction }) {
  return (
    <section className="packer-panel-card">
      <h3>Messages from Sellers</h3>
      <p>Reservation requests, kulang reports, and order notices.</p>
      <div className="message-list">
        {inboxMessages.map((msg) => (
          <article className={`message-card ${msg.unread ? 'unread' : ''} ${msg.urgent ? 'urgent' : ''}`} key={msg.id}>
            <div>
              <h4>{msg.from}</h4>
              <p>{msg.content}</p>
              {msg.actionTaken && <small className="message-action-tag">{msg.actionTaken}</small>}
            </div>
            <div className="message-meta">
              <small>{msg.sentAt}</small>
              <button type="button">
                <Send size={14} />
                Reply
              </button>
              <div className="message-actions">
                <button type="button" onClick={() => onAction(msg.id, 'convert-order')}>
                  Convert to Order
                </button>
                <button type="button" onClick={() => onAction(msg.id, 'create-reservation')}>
                  Create Reservation
                </button>
                <button type="button" className="urgent-btn" onClick={() => onAction(msg.id, 'flag-urgent')}>
                  Flag Urgent
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
