import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, CircleDollarSign, Download, Package, Truck } from 'lucide-react';
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
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Cancelled', label: 'Cancelled' },
];

const toDisplayStatus = (status) => (status === 'In Transit' ? 'Out for Delivery' : status);

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

const isOverdueRow = (row) => {
  const status = toDisplayStatus(row.status);
  if (status === 'Delivered' || status === 'Cancelled') return false;
  const deliveryDate = toDateObject(row.pickupDate || row.deliveryDate);
  if (!deliveryDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deliveryDate < today;
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

const getActionLabel = (status) => {
  if (status === 'Pending') return 'Mark Out for Delivery';
  if (status === 'Out for Delivery') return 'Mark Delivered';
  if (status === 'Overdue') return 'Mark Delivered';
  return 'Completed';
};

const isActionDisabled = (status) => status === 'Delivered' || status === 'Cancelled';

const canCancel = (status) => status === 'Pending' || status === 'Out for Delivery' || status === 'Overdue';

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

export default function DeliveriesOverview({ deliveryItems, onAdvanceStatus, onCancelStatus, deliveryWarning }) {
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const mappedRows = useMemo(
    () =>
      deliveryItems.map((row, sourceIndex) => {
        const computedStatus = toDisplayStatus(row.status);
        const isOverdue = isOverdueRow(row);
        return {
          ...row,
          sourceIndex,
          computedStatus: isOverdue ? 'Overdue' : computedStatus,
          totalPrice: Number(row.price || 0) * Number(row.qty || 0),
          deliveryDate: row.pickupDate || row.orderDate || '-',
        };
      }),
    [deliveryItems]
  );

  const summary = useMemo(() => {
    const totalOrders = mappedRows.length;
    const estimatedRevenue = mappedRows
      .filter((row) => row.computedStatus !== 'Cancelled')
      .reduce((sum, row) => sum + row.totalPrice, 0);
    const deliveredCakes = mappedRows
      .filter((row) => row.computedStatus === 'Delivered')
      .reduce((sum, row) => sum + Number(row.qty || 0), 0);

    return {
      totalOrders,
      estimatedRevenue,
      deliveredCakes,
    };
  }, [mappedRows]);

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd) {
      return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    }
    return DATE_OPTIONS.find((option) => option.value === dateFilter)?.label || 'All Dates';
  }, [customEnd, customStart, dateFilter]);

  const dateScoped = useMemo(
    () =>
      mappedRows.filter((row) => {
        const d = toDateObject(row.deliveryDate);
        return d && isWithinPeriod(d, dateFilter, customStart, customEnd);
      }),
    [customEnd, customStart, dateFilter, mappedRows]
  );

  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, 'Out for Delivery': 0, Delivered: 0, Overdue: 0, Cancelled: 0 };
    dateScoped.forEach((row) => {
      if (row.computedStatus in counts) {
        counts[row.computedStatus] += 1;
      }
    });
    return counts;
  }, [dateScoped]);

  const filteredData = useMemo(() => {
    if (!statusFilter) return dateScoped;
    return dateScoped.filter((row) => row.computedStatus === statusFilter);
  }, [dateScoped, statusFilter]);

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

  const exportDeliveryReport = () => {
    exportRowsToCsv(
      `packer-deliveries-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: 'orderType', label: 'Order Type' },
        { key: 'cake', label: 'Cake' },
        { key: 'qty', label: 'Qty' },
        { key: 'price', label: 'Unit Price' },
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'customer', label: 'Customer' },
        { key: 'contact', label: 'Contact' },
        { key: 'address', label: 'Address' },
        { key: 'orderDate', label: 'Order Date' },
        { key: 'pickupDate', label: 'Delivery Date' },
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
    <div className="pkdo-page-container">
      <header className="pkdo-header">
        <div>
          <h1 className="pkdo-title">Customer Deliveries</h1>
          <p className="pkdo-subtitle">Monitor all delivery orders, status updates, and overdue alerts</p>
        </div>

        <div className="pkdo-filter-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`pkdo-date-filter-btn ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Filter by date"
            type="button"
          >
            <Calendar size={16} />
            <span>{dateLabel}</span>
            <ChevronDown size={13} />
          </button>

          {dropdownOpen && (
            <div className="pkdo-date-dropdown">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`pkdo-dropdown-item ${dateFilter === option.value ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}

              <div className="pkdo-custom-range-section">
                <span className="pkdo-custom-range-title">Custom Range</span>
                <label className="pkdo-custom-label">From</label>
                <input
                  type="date"
                  className="pkdo-date-input"
                  value={customStart}
                  onChange={(event) => {
                    setCustomStart(event.target.value);
                    setDateFilter('custom');
                  }}
                />
                <label className="pkdo-custom-label">To</label>
                <input
                  type="date"
                  className="pkdo-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={(event) => {
                    setCustomEnd(event.target.value);
                    setDateFilter('custom');
                  }}
                />
                <button type="button" className="pkdo-apply-btn" onClick={applyCustomRange} disabled={!customStart || !customEnd}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pkdo-metrics-row">
        <article className="pkdo-metric-card">
          <div className="pkdo-card-top">
            <span className="pkdo-metric-label">Total Delivery Orders</span>
            <Truck size={18} className="pkdo-blue-icon" />
          </div>
          <div className="pkdo-card-bottom">
            <span className="pkdo-metric-value">{summary.totalOrders}</span>
            <span className="pkdo-metric-subtext">All delivery transactions</span>
          </div>
        </article>

        <article className="pkdo-metric-card">
          <div className="pkdo-card-top">
            <span className="pkdo-metric-label">Estimated Revenue</span>
            <CircleDollarSign size={18} className="pkdo-green-icon" />
          </div>
          <div className="pkdo-card-bottom">
            <span className="pkdo-metric-value">P{summary.estimatedRevenue.toLocaleString()}</span>
            <span className="pkdo-metric-subtext">Except Cancelled Orders</span>
          </div>
        </article>

        <article className="pkdo-metric-card">
          <div className="pkdo-card-top">
            <span className="pkdo-metric-label">Total Cakes Delivered</span>
            <Package size={18} className="pkdo-yellow-icon" />
          </div>
          <div className="pkdo-card-bottom">
            <span className="pkdo-metric-value">{summary.deliveredCakes}</span>
            <span className="pkdo-metric-subtext">Cakes successfully delivered</span>
          </div>
        </article>
      </div>

      <div className="pkdo-status-cards-row">
        {STATUS_CARDS.map((card) => (
          <button
            key={card.key}
            className={`pkdo-status-card pkdo-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
            type="button"
          >
            <span className="pkdo-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="pkdo-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>

      <section className="pkdo-table-container">
        {deliveryWarning && <div className="pkdo-warning-banner">{deliveryWarning}</div>}

        <div className="pkdo-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="pkdo-table-section-title">Deliveries List</span>
            <span className="pkdo-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>

          <div className="pkdo-toolbar-actions">
            <button type="button" className="pkdo-filter-icon-btn" onClick={exportDeliveryReport}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="pkdo-table-scroll-wrapper">
          <table className="pkdo-deliveries-table">
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Delivery Address</th>
                <th>Order Date</th>
                <th>Time</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((row, index) => {
                  const rowDate = toDateObject(row.deliveryDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = rowDate ? rowDate.getTime() === today.getTime() : false;
                  const isOverdue = row.computedStatus === 'Overdue';

                  return (
                    <tr key={`${row.branch}-${row.cake}-${row.time}-${index}`}>
                      <td>
                        <span className="pkdo-cake-name-text">
                          {row.cake}
                          {row.orderType === 'custom' && <span className="pkdo-order-type custom">Custom</span>}
                        </span>
                      </td>
                      <td>{row.qty}</td>
                      <td>
                        <span className="pkdo-price-text">P{row.totalPrice.toLocaleString()}</span>
                      </td>
                      <td>{row.customer || 'Walk-in Customer'}</td>
                      <td>
                        <span className="pkdo-contact-text">{row.contact || '-'}</span>
                      </td>
                      <td>
                        <span className="pkdo-address-text" title={row.address || '-'}>
                          {row.address || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="pkdo-date-text">{formatDate(row.orderDate)}</span>
                      </td>
                      <td>
                        <span className="pkdo-time-text">{row.time || '-'}</span>
                      </td>
                      <td>
                        <span className={`pkdo-date-text ${isOverdue ? 'is-overdue' : isToday ? 'is-today' : ''}`}>
                          {formatDate(row.deliveryDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`pkdo-status-pill ${statusPillClass(row.computedStatus)}`}>
                          {row.computedStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`pkdo-status-action-btn ${isActionDisabled(row.computedStatus) ? 'disabled' : ''}`}
                          onClick={() => onAdvanceStatus?.(row.sourceIndex)}
                          disabled={isActionDisabled(row.computedStatus)}
                        >
                          {getActionLabel(row.computedStatus)}
                        </button>
                        {canCancel(row.computedStatus) && (
                          <button
                            type="button"
                            className="pkdo-cancel-btn"
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
                  <td colSpan={11} className="pkdo-no-data">
                    No delivery orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pkdo-pagination">
          <span className="pkdo-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="pkdo-pagination-btns">
            <button className="pkdo-page-btn" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} type="button">
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pkdo-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              className="pkdo-page-btn"
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

