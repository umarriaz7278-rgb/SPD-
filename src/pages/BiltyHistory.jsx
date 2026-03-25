import React, { useState, useEffect } from 'react';
import './BiltyHistory.css';
import { supabase } from '../lib/supabase';
import { 
  Search, Package, Truck, Archive, CheckCircle2, 
  ChevronDown, ChevronUp, AlertTriangle, MapPin,
  FileText, Loader2, Calendar, Filter
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const BiltyHistory = () => {
  const [bilties, setBilties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({ total: 0, warehouse: 0, transit: 0, delivered: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBilties();
  }, [searchTerm, statusFilter, dateFrom, dateTo, currentPage]);

  const fetchStats = async () => {
    try {
      const [totalRes, whRes, trRes, delRes] = await Promise.all([
        supabase.from('bilties').select('*', { count: 'exact', head: true }),
        supabase.from('bilties').select('*', { count: 'exact', head: true }).eq('status', 'Warehouse'),
        supabase.from('bilties').select('*', { count: 'exact', head: true }).or('status.eq.Transit,status.eq.Lahore Warehouse'),
        supabase.from('bilties').select('*', { count: 'exact', head: true }).eq('status', 'Delivered'),
      ]);
      setStats({
        total: totalRes.count || 0,
        warehouse: whRes.count || 0,
        transit: trRes.count || 0,
        delivered: delRes.count || 0
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchBilties = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('bilties')
        .select('*', { count: 'exact' })
        .order('bilty_no', { ascending: false });

      // Filters
      if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }
      if (dateFrom) {
        query = query.gte('bilty_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('bilty_date', dateTo);
      }
      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        // If it's a number, search bilty_no, otherwise search names
        if (!isNaN(term)) {
          query = query.eq('bilty_no', Number(term));
        } else {
          query = query.or(`sender_name.ilike.%${term}%,receiver_name.ilike.%${term}%`);
        }
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setBilties(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (bilty) => {
    if (expandedId === bilty.id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }

    setExpandedId(bilty.id);
    setLoadingDetail(true);
    setExpandedData(null);

    try {
      // Fetch bilty_items, chalan_bilties, claims in parallel
      const [itemsRes, chalanBiltiesRes, claimsRes] = await Promise.all([
        supabase.from('bilty_items').select('*').eq('bilty_id', bilty.id),
        supabase.from('chalan_bilties').select('*, chalans(*)').eq('bilty_id', bilty.id),
        supabase.from('claims').select('*').eq('bilty_id', bilty.id),
      ]);

      // Fetch delivery_logs separately with error handling (table may have different columns)
      let deliveries = [];
      try {
        const deliveryRes = await supabase
          .from('delivery_logs')
          .select('*')
          .eq('bilty_id', bilty.id)
          .order('created_at', { ascending: false });
        
        if (!deliveryRes.error && deliveryRes.data) {
          // Normalize column names — handle both schema versions
          deliveries = deliveryRes.data.map(del => ({
            ...del,
            receiver_name: del.receiver_name || del.received_by || '',
            receiver_phone: del.receiver_phone || '',
            receiver_cnic: del.receiver_cnic || '',
            delivered_quantity: del.delivered_quantity || del.quantity || 0,
            delivery_date: del.delivery_date || del.created_at || '',
          }));
        }
      } catch (delErr) {
        console.warn('delivery_logs fetch failed (table may not exist):', delErr);
      }

      setExpandedData({
        items: itemsRes.data || [],
        chalanBilties: chalanBiltiesRes.data || [],
        deliveries,
        claims: claimsRes.data || [],
        bilty, // store current bilty for fallback display
      });
    } catch (err) {
      console.error('Detail fetch error:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Warehouse': return 'status-warehouse';
      case 'Transit': return 'status-transit';
      case 'Lahore Warehouse': return 'status-lahore-warehouse';
      case 'Delivered': return 'status-delivered';
      default: return 'status-default';
    }
  };

  const getTimelineSteps = (bilty, data) => {
    if (!data) return [];
    const chalan = data.chalanBilties?.[0]?.chalans;
    const delivery = data.deliveries?.[0];
    const steps = [
      {
        label: 'Bilty Created',
        sublabel: bilty.from_city || 'Karachi',
        date: bilty.bilty_date,
        icon: '📦',
        completed: true,
      },
      {
        label: 'Warehouse',
        sublabel: 'Karachi Godam',
        date: bilty.created_at ? new Date(bilty.created_at).toLocaleDateString() : '',
        icon: '🏭',
        completed: ['Transit', 'Lahore Warehouse', 'Delivered', 'Received'].includes(bilty.status) || bilty.status === 'Warehouse',
      },
      {
        label: 'Chalan / Transit',
        sublabel: chalan ? `Truck ${chalan.truck_no}` : '—',
        date: chalan?.chalan_date || '',
        icon: '🚚',
        completed: ['Transit', 'Lahore Warehouse', 'Delivered', 'Received'].includes(bilty.status),
      },
      {
        label: 'Lahore Receiving',
        sublabel: bilty.to_city || 'Lahore',
        date: '',
        icon: '📍',
        completed: ['Lahore Warehouse', 'Delivered'].includes(bilty.status),
      },
      {
        label: 'Delivered',
        sublabel: delivery ? delivery.receiver_name : '—',
        date: delivery?.delivery_date || '',
        icon: '✅',
        completed: bilty.status === 'Delivered',
      },
    ];

    // Determine which one is "active" (current step)
    const lastCompletedIdx = steps.reduce((acc, s, i) => s.completed ? i : acc, -1);
    if (lastCompletedIdx >= 0 && lastCompletedIdx < steps.length -1 && !steps[lastCompletedIdx + 1].completed) {
      steps[lastCompletedIdx].active = true;
      steps[lastCompletedIdx].completed = false;
    }
    // If all completed, last one is active
    if (steps.every(s => s.completed)) {
      steps[steps.length - 1].active = true;
      steps[steps.length - 1].completed = false;
    }
    return steps;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="history-root">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1><FileText size={28} color="#1e40af" /> Bilty History</h1>
          <div className="history-header-sub">Complete A-to-Z record of every bilty — from Karachi to Lahore delivery</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Package size={20} color="#3b82f6" />
          </div>
          <div>
            <div className="history-stat-label">Total Bilties</div>
            <div className="history-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Archive size={20} color="#f59e0b" />
          </div>
          <div>
            <div className="history-stat-label">In Warehouse</div>
            <div className="history-stat-value">{stats.warehouse}</div>
          </div>
        </div>
        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <Truck size={20} color="#8b5cf6" />
          </div>
          <div>
            <div className="history-stat-label">In Transit / Lahore</div>
            <div className="history-stat-value">{stats.transit}</div>
          </div>
        </div>
        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div>
            <div className="history-stat-label">Delivered</div>
            <div className="history-stat-value">{stats.delivered}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="history-filters">
        <div className="history-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Bilty Number, Sender, or Receiver..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select 
          className="history-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="All">All Status</option>
          <option value="Warehouse">Warehouse</option>
          <option value="Transit">Transit</option>
          <option value="Lahore Warehouse">Lahore Warehouse</option>
          <option value="Delivered">Delivered</option>
        </select>
        <input 
          type="date" 
          className="history-date-input"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          title="From Date"
        />
        <input 
          type="date" 
          className="history-date-input"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          title="To Date"
        />
      </div>

      {/* Table */}
      <div className="history-table-card">
        {loading ? (
          <div className="history-loading">
            <Loader2 size={28} className="animate-spin" style={{ marginRight: '0.5rem' }} />
            Loading bilty records...
          </div>
        ) : bilties.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">📋</div>
            No bilty records found matching your search.
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Bilty #</th>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Route</th>
                  <th>Weight</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bilties.map(bilty => (
                  <React.Fragment key={bilty.id}>
                    <tr 
                      onClick={() => toggleExpand(bilty)}
                      className={expandedId === bilty.id ? 'expanded-row' : ''}
                    >
                      <td style={{ textAlign: 'center', color: '#475569' }}>
                        {expandedId === bilty.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="bilty-no-cell">#{bilty.bilty_no}</td>
                      <td>{bilty.bilty_date ? new Date(bilty.bilty_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{bilty.sender_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#475569' }}>{bilty.sender_phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{bilty.receiver_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#475569' }}>{bilty.receiver_phone}</div>
                      </td>
                       <td style={{ whiteSpace: 'nowrap' }}>
                        {bilty.from_city} → {bilty.to_city}
                      </td>
                      <td style={{ fontWeight: 700 }}>{bilty.total_weight} KG</td>
                      <td className="amt-high">Rs {Number(bilty.total_amount || 0).toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          background: bilty.payment_status === 'Advance Fare' ? '#eff6ff' : 
                                     bilty.payment_status === 'To Pay (Paid)' ? '#ecfdf5' : '#fffbeb',
                          color: bilty.payment_status === 'Advance Fare' ? '#2563eb' : 
                                 bilty.payment_status === 'To Pay (Paid)' ? '#059669' : '#d97706',
                          border: `1px solid ${
                            bilty.payment_status === 'Advance Fare' ? '#dbeafe' : 
                            bilty.payment_status === 'To Pay (Paid)' ? '#d1fae5' : '#fef3c7'
                          }`
                        }}>
                          {bilty.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(bilty.status)}`}>
                          {bilty.status}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedId === bilty.id && (
                      <tr className="history-detail-row">
                        <td colSpan="10">
                          <div className="history-detail-content">
                            {loadingDetail ? (
                              <div className="history-loading" style={{ padding: '2rem' }}>
                                <Loader2 size={22} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                                Loading complete history...
                              </div>
                            ) : expandedData && (
                              <>
                                {/* Timeline */}
                                <div className="history-timeline">
                                  <div className="timeline-title">📍 Bilty Lifecycle Timeline</div>
                                  <div className="timeline-steps">
                                    {getTimelineSteps(bilty, expandedData).map((step, i) => (
                                      <div key={i} className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                                        <div className="timeline-dot">{step.icon}</div>
                                        <div className="timeline-label">{step.label}</div>
                                        <div className="timeline-date">{step.sublabel}</div>
                                        {step.date && (
                                          <div className="timeline-date">{typeof step.date === 'string' && step.date.includes('-') ? new Date(step.date).toLocaleDateString() : step.date}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Detail Sections */}
                                <div className="detail-sections" style={{ marginTop: '1.25rem' }}>

                                  {/* Bilty Info */}
                                  <div className="detail-section">
                                    <div className="detail-section-title"><Package size={14} color="#3b82f6" /> Bilty Details</div>
                                    <div className="detail-row">
                                      <span className="detail-label">Bilty No</span>
                                      <span className="detail-value" style={{ color: '#3b82f6' }}>#{bilty.bilty_no}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Date</span>
                                      <span className="detail-value">{bilty.bilty_date ? new Date(bilty.bilty_date).toLocaleDateString() : '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Sender</span>
                                      <span className="detail-value">{bilty.sender_name} ({bilty.sender_phone || '—'})</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Receiver</span>
                                      <span className="detail-value">{bilty.receiver_name} ({bilty.receiver_phone || '—'})</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Route</span>
                                      <span className="detail-value">{bilty.from_city} → {bilty.to_city}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Payment</span>
                                      <span className="detail-value">{bilty.payment_status}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Total Weight</span>
                                      <span className="detail-value">{bilty.total_weight} KG</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Total Amount</span>
                                      <span className="detail-value amt-high">Rs {Number(bilty.total_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Total Qty</span>
                                      <span className="detail-value">{bilty.total_quantity}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Remaining Qty</span>
                                      <span className="detail-value">{bilty.remaining_quantity}</span>
                                    </div>
                                    {bilty.party_name && (
                                      <div className="detail-row">
                                        <span className="detail-label">Party</span>
                                        <span className="detail-value">{bilty.party_name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Goods Items */}
                                  <div className="detail-section">
                                    <div className="detail-section-title"><Archive size={14} color="#f59e0b" /> Goods Items</div>
                                    {expandedData.items.length === 0 ? (
                                      <div style={{ color: '#475569', fontSize: '0.8rem', padding: '0.5rem 0' }}>No goods items recorded.</div>
                                    ) : (
                                      <table className="goods-mini-table">
                                        <thead>
                                          <tr>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Weight</th>
                                            <th>Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedData.items.map((item, i) => (
                                            <tr key={i}>
                                              <td>{item.goods_bayan || '—'}</td>
                                              <td>{item.quantity}</td>
                                              <td>{item.weight} KG</td>
                                              <td>Rs {Number(item.amount || 0).toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>

                                  {/* Chalan / Transit Info */}
                                  <div className="detail-section">
                                    <div className="detail-section-title"><Truck size={14} color="#8b5cf6" /> Chalan & Transit</div>
                                    {expandedData.chalanBilties.length === 0 ? (
                                      <div style={{ color: '#475569', fontSize: '0.8rem', padding: '0.5rem 0' }}>Not loaded on any chalan yet.</div>
                                    ) : (
                                      expandedData.chalanBilties.map((cb, i) => {
                                        const ch = cb.chalans;
                                        return (
                                          <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < expandedData.chalanBilties.length -1 ? '1px solid #1e2d45' : 'none' }}>
                                            <div className="detail-row">
                                              <span className="detail-label">Chalan No</span>
                                              <span className="detail-value" style={{ color: '#8b5cf6' }}>#{ch?.chalan_no || '—'}</span>
                                            </div>
                                            <div className="detail-row">
                                              <span className="detail-label">Truck No</span>
                                              <span className="detail-value">{ch?.truck_no || '—'}</span>
                                            </div>
                                            <div className="detail-row">
                                              <span className="detail-label">Chalan Date</span>
                                              <span className="detail-value">{ch?.chalan_date ? new Date(ch.chalan_date).toLocaleDateString() : '—'}</span>
                                            </div>
                                            <div className="detail-row">
                                              <span className="detail-label">Route</span>
                                              <span className="detail-value">{ch?.from_city} → {ch?.to_city}</span>
                                            </div>
                                            <div className="detail-row">
                                              <span className="detail-label">Loaded Qty</span>
                                              <span className="detail-value">{cb.loaded_quantity}</span>
                                            </div>
                                            <div className="detail-row">
                                              <span className="detail-label">Chalan Status</span>
                                              <span className="detail-value">{ch?.status || '—'}</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Delivery Info */}
                                  <div className="detail-section">
                                    <div className="detail-section-title"><CheckCircle2 size={14} color="#10b981" /> Delivery Record</div>
                                    {expandedData.deliveries.length === 0 ? (
                                      bilty.status === 'Delivered' ? (
                                        <div>
                                          <div style={{ color: '#f59e0b', fontSize: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', marginBottom: '0.75rem' }}>
                                            ⚠️ Delivery log not found — showing bilty receiver info
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Receiver Name</span>
                                            <span className="detail-value" style={{ color: '#10b981' }}>{bilty.receiver_name || '—'}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Phone</span>
                                            <span className="detail-value">{bilty.receiver_phone || '—'}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">CNIC</span>
                                            <span className="detail-value" style={{ color: '#fbbf24', fontWeight: 700 }}>—</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Status</span>
                                            <span className="detail-value" style={{ color: '#10b981' }}>Delivered ✅</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ color: '#475569', fontSize: '0.8rem', padding: '0.5rem 0' }}>Not delivered yet.</div>
                                      )
                                    ) : (
                                      expandedData.deliveries.map((del, i) => (
                                        <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < expandedData.deliveries.length -1 ? '1px solid #1e2d45' : 'none' }}>
                                          <div className="detail-row">
                                            <span className="detail-label">Receiver Name</span>
                                            <span className="detail-value" style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>{del.receiver_name || '—'}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Phone</span>
                                            <span className="detail-value" style={{ fontWeight: 600 }}>{del.receiver_phone || '—'}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">CNIC</span>
                                            <span className="detail-value" style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>{del.receiver_cnic || '—'}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Delivered Qty</span>
                                            <span className="detail-value" style={{ fontWeight: 700 }}>{del.delivered_quantity}</span>
                                          </div>
                                          <div className="detail-row">
                                            <span className="detail-label">Delivery Date</span>
                                            <span className="detail-value">{del.delivery_date ? new Date(del.delivery_date).toLocaleDateString() : '—'}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                </div>

                                {/* Claims Section */}
                                {expandedData.claims.length > 0 && (
                                  <div className="detail-section" style={{ marginTop: '1rem' }}>
                                    <div className="detail-section-title"><AlertTriangle size={14} color="#ef4444" /> Claims</div>
                                    {expandedData.claims.map((cl, i) => (
                                      <div key={i} className="detail-row">
                                        <span className="detail-label">{cl.claim_type || 'Claim'}: {cl.description || ''}</span>
                                        <span className="detail-value" style={{ color: '#ef4444' }}>Rs {Number(cl.claim_amount || 0).toLocaleString()} — {cl.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="history-pagination">
              <div className="history-pagination-info">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} bilties
              </div>
              <div className="history-pagination-btns">
                <button 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ← Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button 
                      key={page}
                      className={page === currentPage ? 'active-page' : ''}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BiltyHistory;
