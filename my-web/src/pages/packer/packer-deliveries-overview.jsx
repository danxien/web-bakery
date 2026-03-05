import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CircleDollarSign, Download, Filter, Package, Truck } from 'lucide-react';
import { exportRowsToCsv } from '../../utils/exportCsv';

const PER_PAGE = 6;

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
  const deliveryDate = toDateObject(row.pickupDate);
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

const isWithinPeriod = (targetDate, period, selectedMonth) => {
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

  if (period === 'pick-month') {
    if (!selectedMonth) return true;
    const [year, month] = selectedMonth.split('-').map(Number);
    return targetDate.getFullYear() === year && targetDate.getMonth() === month - 1;
  }

  return true;
};

export default function DeliveriesOverview({ deliveryItems, onAdvanceStatus, onCancelStatus, deliveryWarning }) {
  const [quickFilter, setQuickFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledTodayNotDone = mappedRows.filter((row) => {
      const deliveryDate = toDateObject(row.deliveryDate);
      if (!deliveryDate) return false;
      const notDone = row.computedStatus !== 'Delivered' && row.computedStatus !== 'Cancelled';
      return notDone && deliveryDate.getTime() === today.getTime();
    }).length;

    const pendingDispatch = mappedRows.filter(
      (row) => row.computedStatus === 'Pending' || row.computedStatus === 'Out for Delivery'
    ).length;

    const overdueCount = mappedRows.filter((row) => row.computedStatus === 'Overdue').length;

    return {
      totalOrders,
      estimatedRevenue,
      deliveredCakes,
      scheduledTodayNotDone,
      pendingDispatch,
      overdueCount,
    };
  }, [mappedRows]);

  const filteredData = useMemo(() => {
    let rows = mappedRows;

    if (quickFilter === 'today') {
      rows = rows.filter((row) => {
        const d = toDateObject(row.deliveryDate);
        return d && isWithinPeriod(d, 'today');
      });
    } else if (quickFilter === 'pending') {
      rows = rows.filter((row) => row.computedStatus === 'Pending' || row.computedStatus === 'Out for Delivery');
    } else if (quickFilter === 'overdue') {
      rows = rows.filter((row) => row.computedStatus === 'Overdue');
    }

    if (dateFilter !== 'all') {
      rows = rows.filter((row) => {
        const d = toDateObject(row.deliveryDate);
        return d && isWithinPeriod(d, dateFilter, selectedMonth);
      });
    }

    return rows;
  }, [dateFilter, mappedRows, quickFilter, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
  }, [dateFilter, quickFilter, selectedMonth]);

  return (
    <div className="pkdo-page-container">
      <header className="pkdo-header">
        <h1 className="pkdo-title">Customer Deliveries</h1>
        <p className="pkdo-subtitle">Monitor all delivery orders, status updates, and overdue alerts</p>
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
            <span className="pkdo-metric-subtext">Excl. Cancelled orders</span>
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

      <div className="pkdo-alerts-container">
        <div className="pkdo-alert-wrapper">
          <button
            type="button"
            className={`pkdo-alert-row warning ${quickFilter === 'today' ? 'active' : ''}`}
            onClick={() => setQuickFilter((prev) => (prev === 'today' ? 'all' : 'today'))}
          >
            <AlertTriangle size={18} />
            <span>{summary.scheduledTodayNotDone} deliveries scheduled for today - not yet completed</span>
          </button>
        </div>
        <div className="pkdo-alert-wrapper">
          <button
            type="button"
            className={`pkdo-alert-row info ${quickFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setQuickFilter((prev) => (prev === 'pending' ? 'all' : 'pending'))}
          >
            <AlertTriangle size={18} />
            <span>{summary.pendingDispatch} pending deliveries - awaiting dispatch</span>
          </button>
        </div>
        <div className="pkdo-alert-wrapper">
          <button
            type="button"
            className={`pkdo-alert-row critical ${quickFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => setQuickFilter((prev) => (prev === 'overdue' ? 'all' : 'overdue'))}
          >
            <AlertTriangle size={18} />
            <span>{summary.overdueCount} overdue deliveries - delivery date passed, manager action needed</span>
          </button>
        </div>
      </div>

      <section className="pkdo-table-container">
        {deliveryWarning && <div className="pkdo-warning-banner">{deliveryWarning}</div>}

        <div className="pkdo-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="pkdo-table-section-title">Deliveries List</span>
            <span className="pkdo-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {(quickFilter !== 'all' || dateFilter !== 'all') && ' · filtered'}
            </span>
          </div>

          <div className="pkdo-toolbar-actions">
            <div className="pkdo-filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`pkdo-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                title="Filter by date"
                type="button"
              >
                <Filter size={14} />
                <span>
                  {dateFilter === 'all' && 'All Dates'}
                  {dateFilter === 'today' && 'Today'}
                  {dateFilter === 'week' && 'This Week'}
                  {dateFilter === 'month' && 'This Month'}
                  {dateFilter === 'pick-month' && 'Select Month'}
                </span>
              </button>

              {dropdownOpen && (
                <div className="pkdo-filter-dropdown">
                  {[
                    { value: 'all', label: 'All Dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'pick-month', label: 'Select Month' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`pkdo-dropdown-item ${dateFilter === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        setDateFilter(option.value);
                        setDropdownOpen(false);
                      }}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {dateFilter === 'pick-month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="pkdo-month-input"
              />
            )}

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
                <th>Date Made</th>
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

