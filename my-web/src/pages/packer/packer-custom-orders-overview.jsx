import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X, ChevronDown } from 'lucide-react';

const PER_PAGE = 6;

const toDateObject = (value) => {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateISO = (value) => {
  if (!value || value === '-') return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = toDateObject(value);
  if (!date) return '-';
  return date.toISOString().slice(0, 10);
};

const normalizeStatus = (status) => {
  if (status === 'Ready') return 'Out for Delivery';
  if (status === 'Picked Up') return 'Delivered';
  return status || 'Pending';
};

const isOverdue = (row) => {
  if (row.status === 'Delivered' || row.status === 'Cancelled') return false;
  const pickupDate = toDateObject(row.pickupDate);
  if (!pickupDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return pickupDate < today;
};

const statusPillClass = (status) => {
  const map = {
    Pending: 'pending',
    'Out for Delivery': 'out-for-delivery',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Overdue: 'overdue',
  };
  return map[status] || 'pending';
};

export default function CustomOrdersOverview({
  customOrderItems,
  onDeleteOrder,
  onUpdateStatus,
  onOpenCustomOrderModal,
}) {
  const [page, setPage] = useState(1);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [activeInstructions, setActiveInstructions] = useState('');
  const [openStatusIndex, setOpenStatusIndex] = useState(null);
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const statusDropRef = useRef(null);
  const statusMenuRef = useRef(null);

  const mappedRows = useMemo(
    () =>
      customOrderItems.map((row, sourceIndex) => {
        const pickupDate = row.pickupDate || row.deliveryDate || row.pickup || '-';
        const baseStatus = normalizeStatus(row.status);
        const computedStatus = isOverdue({ ...row, pickupDate, status: baseStatus }) ? 'Overdue' : baseStatus;
        return { ...row, sourceIndex, pickupDate, computedStatus };
      }),
    [customOrderItems]
  );

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return mappedRows;
    return mappedRows.filter((row) => (row.computedStatus || 'Pending') === statusFilter);
  }, [mappedRows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const formatAmount = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric <= 0) return '₱0';
    return `₱${numeric.toLocaleString('en-PH')}`;
  };

  const getCustomerName = (row) => row.customer || 'Walk-in Customer';
  const getContact = (row) => row.contact || '-';
  const getAddress = (row) => row.address || '-';
  const statusOptions = ['Pending', 'Out for Delivery', 'Delivered', 'Overdue', 'Cancelled'];
  const statusFilterOptions = [
    { key: 'all', label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Out for Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Overdue', label: 'Overdue' },
    { key: 'Cancelled', label: 'Cancelled' },
  ];

  const statusLabel = useMemo(
    () => statusFilterOptions.find((opt) => opt.key === statusFilter)?.label || 'All',
    [statusFilter, statusFilterOptions]
  );
  const activeStatusRow = useMemo(
    () => mappedRows.find((row) => row.sourceIndex === openStatusIndex) || null,
    [mappedRows, openStatusIndex]
  );

  const openInstructions = (text) => {
    setActiveInstructions(text || 'No special instructions.');
    setIsInstructionsOpen(true);
  };
  const closeInstructions = () => {
    setIsInstructionsOpen(false);
    setActiveInstructions('');
  };

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (statusMenuRef.current && statusMenuRef.current.contains(target)) return;
      if (!target.closest('.pkco-status-cell')) {
        setOpenStatusIndex(null);
        setStatusAnchor(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (statusDropRef.current && !statusDropRef.current.contains(event.target)) {
        setStatusDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (openStatusIndex === null) return;
    const closeMenu = () => {
      setOpenStatusIndex(null);
      setStatusAnchor(null);
    };
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [openStatusIndex]);

  return (
    <div className="pkco-page-container">
      <header className="pkco-header">
        <div>
          <h1 className="pkco-title">Custom Orders</h1>
          <p className="pkco-subtitle">Monitor all custom cake orders and production status</p>
        </div>
      </header>

      <section className="pkco-table-container">
        <div className="pkco-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="pkco-table-section-title">Custom Orders List</span>
            <span className="pkco-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
            </span>
            <div className="pkco-th-filter-wrapper" ref={statusDropRef}>
              <button
                type="button"
                className={`pkco-th-filter-btn ${statusDropOpen ? 'open' : ''}`}
                onClick={() => setStatusDropOpen((prev) => !prev)}
              >
                <span>Status: {statusLabel}</span>
                <ChevronDown size={12} />
              </button>
              {statusDropOpen && (
                <div className="pkco-th-dropdown">
                  {statusFilterOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`pkco-th-dropdown-item ${statusFilter === opt.key ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(opt.key);
                        setStatusDropOpen(false);
                        setPage(1);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button type="button" className="pkco-add-btn" onClick={() => onOpenCustomOrderModal?.()}>
            <Plus size={14} /> Add Order
          </button>
        </div>

        <div className="pkco-table-scroll-wrapper">
          <table className="pkco-orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Delivery Date</th>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>
                  <span className="pkco-header-break">Customer<br />Details</span>
                </th>
                <th>
                  <span className="pkco-header-break">Special<br />Instructions</span>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((row, index) => (
                  <tr key={`${row.cake}-${row.pickupDate}-${index}`}>
                    <td>
                      <span className="pkco-date-text">{formatDateISO(row.orderDate || row.date || row.pickupDate)}</span>
                    </td>
                    <td>
                      <span className="pkco-date-text">{formatDateISO(row.pickupDate)}</span>
                    </td>
                    <td>
                      <span className="pkco-cake-name-text">{row.cake}</span>
                    </td>
                    <td>
                      <span className="pkco-qty-text">{row.qty}</span>
                    </td>
                    <td>
                      <span className="pkco-amount-text">{formatAmount(row.price)}</span>
                    </td>
                    <td>
                      <div className="pkco-customer-details">
                        <span className="pkco-customer-name">{getCustomerName(row)}</span>
                        <span className="pkco-customer-contact">{getContact(row)}</span>
                        <span className="pkco-customer-address">{getAddress(row)}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pkco-view-btn"
                        onClick={() => openInstructions(row.specialInstructions)}
                      >
                        View
                      </button>
                    </td>
                    <td>
                      <div className="pkco-status-cell">
                        <button
                          type="button"
                          className={`pkco-status-btn ${statusPillClass(row.computedStatus)}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const rect = event.currentTarget.getBoundingClientRect();
                            if (openStatusIndex === row.sourceIndex) {
                              setOpenStatusIndex(null);
                              setStatusAnchor(null);
                              return;
                            }
                            setStatusAnchor({
                              top: rect.bottom + 6,
                              left: rect.left,
                              width: Math.max(rect.width, 200),
                            });
                            setOpenStatusIndex(row.sourceIndex);
                          }}
                        >
                          <span>{row.computedStatus}</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pkco-delete-btn"
                        onClick={() => onDeleteOrder?.(row.sourceIndex)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="pkco-no-data">
                    No custom orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pkco-pagination">
          <span className="pkco-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="pkco-pagination-btns">
            <button className="pkco-page-btn" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} type="button">
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pkco-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              className="pkco-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              type="button"
            >
              {'>'}
            </button>
          </div>
        </div>
      </section>

      {openStatusIndex !== null && statusAnchor && activeStatusRow &&
        createPortal(
          <div
            ref={statusMenuRef}
            className="pkco-status-dropdown pkco-status-dropdown-portal"
            style={{
              top: `${statusAnchor.top}px`,
              left: `${statusAnchor.left}px`,
              width: `${statusAnchor.width}px`,
            }}
          >
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`pkco-status-option ${activeStatusRow.computedStatus === option ? 'selected' : ''}`}
                onClick={() => {
                  onUpdateStatus?.(openStatusIndex, option);
                  setOpenStatusIndex(null);
                  setStatusAnchor(null);
                }}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body
        )}

      {isInstructionsOpen && (
        <div className="pkco-instructions-overlay" onClick={closeInstructions}>
          <div className="pkco-instructions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pkco-instructions-header">
              <h3>Special Instructions</h3>
              <button type="button" className="pkco-instructions-close" onClick={closeInstructions}>
                <X size={16} />
              </button>
            </div>
            <p className="pkco-instructions-text">{activeInstructions}</p>
          </div>
        </div>
      )}
    </div>
  );
}
