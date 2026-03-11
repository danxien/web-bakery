import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, CircleDollarSign, ClipboardList, ShieldCheck } from 'lucide-react';
import { exportRowsToCsv } from '../../utils/exportCsv';

const PER_PAGE = 6;

const DATE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const STATUS_CARDS = [
  { key: 'Pending', label: 'Pending' },
  { key: 'Ready', label: 'Ready' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Cancelled', label: 'Cancelled' },
];

const toDateObject = (value) => {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toDateObject(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const parsePickup = (pickup) => {
  if (!pickup) return { pickupDate: '-', pickupTime: '-' };
  const parts = pickup.split(' ');
  if (parts.length <= 1) return { pickupDate: pickup, pickupTime: '-' };
  return {
    pickupDate: parts[0],
    pickupTime: parts.slice(1).join(' '),
  };
};

const isWithinPeriod = (targetDate, period, customStart, customEnd) => {
  if (!targetDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'today') {
    return targetDate.getTime() === today.getTime();
  }

  if (period === 'week') {
    const start = new Date(today);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return targetDate >= start && targetDate <= end;
  }

  if (period === 'month') {
    return targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear();
  }

  if (period === 'custom') {
    const start = toDateObject(customStart);
    const end = toDateObject(customEnd);
    if (!start || !end) return true;

    const customStartDate = new Date(start);
    customStartDate.setHours(0, 0, 0, 0);

    const customEndDate = new Date(end);
    customEndDate.setHours(23, 59, 59, 999);

    return targetDate >= customStartDate && targetDate <= customEndDate;
  }

  return true;
};

const isOverdue = (row) => {
  if (row.status !== 'Ready') return false;
  const pickupDate = toDateObject(row.pickupDate);
  if (!pickupDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return pickupDate < today;
};

const statusPillClass = (status) => {
  const map = {
    Pending: 'pending',
    Ready: 'ready',
    'Picked Up': 'picked-up',
    Cancelled: 'cancelled',
    Overdue: 'overdue',
  };
  return map[status] || 'pending';
};

const getActionLabel = (status) => {
  if (status === 'Pending') return 'Mark Ready';
  if (status === 'Ready' || status === 'Overdue') return 'Mark Picked Up';
  return 'Completed';
};

const isActionDisabled = (status) => status === 'Picked Up' || status === 'Cancelled';

const canCancel = (status) => status === 'Pending' || status === 'Ready' || status === 'Overdue';

export default function CustomOrdersOverview({ customOrderItems, onAdvanceStatus, onCancelStatus }) {
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const mappedRows = useMemo(
    () =>
      customOrderItems.map((row, sourceIndex) => {
        const { pickupDate, pickupTime } = parsePickup(row.pickup || row.pickupDate || '-');
        const computedStatus = isOverdue({ ...row, pickupDate }) ? 'Overdue' : row.status;
        return {
          ...row,
          sourceIndex,
          pickupDate,
          pickupTime,
          computedStatus,
          totalPrice: Number(row.price || 0) * Number(row.qty || 0),
        };
      }),
    [customOrderItems]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd) {
      return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    }
    return DATE_OPTIONS.find((option) => option.value === dateFilter)?.label || 'All Dates';
  }, [customEnd, customStart, dateFilter]);

  const dateScoped = useMemo(
    () =>
      mappedRows.filter((row) => {
        const d = toDateObject(row.pickupDate);
        return d && isWithinPeriod(d, dateFilter, customStart, customEnd);
      }),
    [customEnd, customStart, dateFilter, mappedRows]
  );

  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, Ready: 0, 'Picked Up': 0, Overdue: 0, Cancelled: 0 };
    dateScoped.forEach((row) => {
      if (row.computedStatus in counts) {
        counts[row.computedStatus] += 1;
      }
    });
    return counts;
  }, [dateScoped]);

  const filteredData = useMemo(() => {
    if (!statusFilter) return dateScoped;
    return statusFilter === 'Overdue'
      ? dateScoped.filter((row) => row.computedStatus === 'Overdue')
      : dateScoped.filter((row) => row.computedStatus === statusFilter);
  }, [dateScoped, statusFilter]);

  const totalOrders = dateScoped.length;
  const revenueTotal = dateScoped
    .filter((row) => row.computedStatus === 'Picked Up')
    .reduce((sum, row) => sum + row.totalPrice, 0);
  const pendingCount = dateScoped.filter((row) => row.computedStatus === 'Pending').length;

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDateSelect = (value) => {
    setDateFilter(value);
    setStatusFilter(null);
    setPage(1);
    if (value !== 'custom') {
      setDropdownOpen(false);
    }
  };

  const handleStatusCard = (value) => {
    setStatusFilter((prev) => (prev === value ? null : value));
    setPage(1);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    setDateFilter('custom');
    setDropdownOpen(false);
    setPage(1);
  };

  const exportCustomOrders = () => {
    exportRowsToCsv(
      `packer-custom-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: 'customer', label: 'Customer' },
        { key: 'cake', label: 'Cake' },
        { key: 'qty', label: 'Qty' },
        { key: 'price', label: 'Unit Price' },
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'pickupDate', label: 'Pickup Date' },
        { key: 'pickupTime', label: 'Pickup Time' },
        { key: 'computedStatus', label: 'Status' },
      ],
      filteredData
    );
  };

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [customEnd, customStart, dateFilter, statusFilter]);

  return (
    <div className="pkco-page-container">
      <header className="pkco-header">
        <div>
          <h1 className="pkco-title">Custom Orders</h1>
          <p className="pkco-subtitle">Monitor all custom cake orders and production status</p>
        </div>

        <div className="pkco-filter-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`pkco-date-filter-btn ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Filter by date"
            type="button"
          >
            <Calendar size={16} />
            <span>{dateLabel}</span>
            <ChevronDown size={13} />
          </button>

          {dropdownOpen && (
            <div className="pkco-date-dropdown">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`pkco-dropdown-item ${dateFilter === option.value ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}

              <div className="pkco-custom-range-section">
                <span className="pkco-custom-range-title">Custom Range</span>
                <label className="pkco-custom-label">From</label>
                <input
                  type="date"
                  className="pkco-date-input"
                  value={customStart}
                  onChange={(event) => {
                    setCustomStart(event.target.value);
                    setDateFilter('custom');
                  }}
                />
                <label className="pkco-custom-label">To</label>
                <input
                  type="date"
                  className="pkco-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={(event) => {
                    setCustomEnd(event.target.value);
                    setDateFilter('custom');
                  }}
                />
                <button type="button" className="pkco-apply-btn" onClick={applyCustomRange} disabled={!customStart || !customEnd}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pkco-metrics-row">
        <article className="pkco-metric-card">
          <div className="pkco-card-top">
            <span className="pkco-metric-label">Total Custom Orders</span>
            <ShieldCheck size={18} className="pkco-blue-icon" />
          </div>
          <div className="pkco-card-bottom">
            <span className="pkco-metric-value">{totalOrders}</span>
            <span className="pkco-metric-subtext">All orders on record</span>
          </div>
        </article>

        <article className="pkco-metric-card">
          <div className="pkco-card-top">
            <span className="pkco-metric-label">Custom Orders Revenue</span>
            <CircleDollarSign size={18} className="pkco-green-icon" />
          </div>
          <div className="pkco-card-bottom">
            <span className="pkco-metric-value">P{revenueTotal.toLocaleString()}</span>
            <span className="pkco-metric-subtext">Picked up orders only</span>
          </div>
        </article>

        <article className="pkco-metric-card">
          <div className="pkco-card-top">
            <span className="pkco-metric-label">Pending Orders</span>
            <ClipboardList size={18} className="pkco-yellow-icon" />
          </div>
          <div className="pkco-card-bottom">
            <span className="pkco-metric-value">{pendingCount}</span>
            <span className="pkco-metric-subtext">Awaiting preparation</span>
          </div>
        </article>
      </div>

      <div className="pkco-status-cards-row">
        {STATUS_CARDS.map((card) => (
          <button
            key={card.key}
            className={`pkco-status-card pkco-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
            type="button"
          >
            <span className="pkco-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="pkco-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>

      <section className="pkco-table-container">
        <div className="pkco-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="pkco-table-section-title">Custom Orders List</span>
            <span className="pkco-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>

          <div className="pkco-toolbar-actions">
            <button type="button" className="pkco-filter-icon-btn" onClick={exportCustomOrders}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="pkco-table-scroll-wrapper">
          <table className="pkco-orders-table">
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Delivery Address</th>
                <th>Date Made</th>
                <th>Time</th>
                <th>Pickup Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((row, index) => {
                  const rowDate = toDateObject(row.pickupDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = rowDate ? rowDate.getTime() === today.getTime() : false;
                  const overdue = row.computedStatus === 'Overdue';

                  return (
                    <tr key={`${row.customer}-${row.pickupDate}-${index}`}>
                      <td>
                        <span className="pkco-cake-name-text">
                          {row.cake}
                          <span className="pkco-order-type custom">Custom</span>
                        </span>
                      </td>
                      <td>{row.qty}</td>
                      <td>
                        <span className="pkco-price-text">P{row.totalPrice.toLocaleString()}</span>
                      </td>
                      <td>{row.customer || 'Walk-in Customer'}</td>
                      <td>
                        <span className="pkco-contact-text">{row.contact || '-'}</span>
                      </td>
                      <td>
                        <span className="pkco-address-text" title={row.address || '-'}>
                          {row.address || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="pkco-date-text">{row.orderDate || '-'}</span>
                      </td>
                      <td>
                        <span className="pkco-time-text">{row.pickupTime || '-'}</span>
                      </td>
                      <td>
                        <span className={`pkco-date-text ${overdue ? 'is-overdue' : isToday ? 'is-today' : ''}`}>
                          {formatDate(row.pickupDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`pkco-status-pill ${statusPillClass(row.computedStatus)}`}>
                          {row.computedStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`pkco-status-action-btn ${isActionDisabled(row.computedStatus) ? 'disabled' : ''}`}
                          onClick={() => onAdvanceStatus?.(row.sourceIndex)}
                          disabled={isActionDisabled(row.computedStatus)}
                        >
                          {getActionLabel(row.computedStatus)}
                        </button>
                        {canCancel(row.computedStatus) && (
                          <button
                            type="button"
                            className="pkco-cancel-btn"
                            onClick={() => onCancelStatus?.(row.sourceIndex)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="pkco-no-data">
                    No custom orders match the current filter.
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
    </div>
  );
}
