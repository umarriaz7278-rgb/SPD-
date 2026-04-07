import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_logs')
        .select(`
          id,
          bilty_id,
          receiver_name,
          receiver_phone,
          receiver_cnic,
          delivered_quantity,
          delivery_date,
          bilties (
            bilty_no,
            sender_name,
            sender_phone,
            total_amount,
            payment_status,
            from_city,
            to_city
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    root: { padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' },
    title: { fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' },
    subtitle: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' },
    card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' },
    th: { padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--surface)', whiteSpace: 'nowrap' },
    td: { padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
    viewBtn: { padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary-light)', color: 'var(--primary)', transition: 'background 0.2s' },
    badge: (status) => ({
      padding: '0.25rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      backgroundColor: status === 'Advance Fare' ? 'var(--primary)' : status === 'To Pay (Paid)' ? 'var(--success)' : 'var(--warning)',
      color: 'white',
    }),
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '480px', margin: '1rem', boxShadow: 'var(--shadow-lg)', padding: '1.75rem' },
    modalTitle: { fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.55rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' },
    rowLabel: { color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem' },
    rowValue: { fontWeight: 700, color: 'var(--text-main)', textAlign: 'right' },
    closeBtn: { marginTop: '1.25rem', width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },
    empty: { textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  };

  return (
    <div style={styles.root}>
      <h1 style={styles.title}><FileText size={26} color="var(--primary)" /> Invoices</h1>
      <p style={styles.subtitle}>All confirmed deliveries — auto-populated from Delivery confirmations.</p>

      <div style={styles.card}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div style={styles.empty}>No invoices yet. Confirm a delivery to see it here.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Bilty No.</th>
                  <th style={styles.th}>Delivery Date</th>
                  <th style={styles.th}>Receiver</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Qty Delivered</th>
                  <th style={styles.th}>Freight</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.15s' }}>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: 'var(--primary)' }}>
                      #{inv.bilties?.bilty_no ?? inv.bilty_id}
                    </td>
                    <td style={styles.td}>
                      {inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={styles.td}>{inv.receiver_name}</td>
                    <td style={styles.td}>{inv.receiver_phone}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{inv.delivered_quantity}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: 'var(--success)' }}>
                      Rs {Number(inv.bilties?.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      {inv.bilties?.payment_status && (
                        <span style={styles.badge(inv.bilties.payment_status)}>
                          {inv.bilties.payment_status}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button style={styles.viewBtn} onClick={() => setSelectedInvoice(inv)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div style={styles.overlay} onClick={() => setSelectedInvoice(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              <FileText size={18} /> Invoice — Bilty #{selectedInvoice.bilties?.bilty_no ?? selectedInvoice.bilty_id}
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Bilty Number</span>
              <span style={styles.rowValue}>#{selectedInvoice.bilties?.bilty_no ?? selectedInvoice.bilty_id}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Delivery Date</span>
              <span style={styles.rowValue}>
                {selectedInvoice.delivery_date ? new Date(selectedInvoice.delivery_date).toLocaleDateString() : '—'}
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Sender</span>
              <span style={styles.rowValue}>
                {selectedInvoice.bilties?.sender_name}<br />
                <span style={{ fontWeight: 500, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedInvoice.bilties?.sender_phone}</span>
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Receiver Name</span>
              <span style={styles.rowValue}>{selectedInvoice.receiver_name}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Receiver Mobile</span>
              <span style={styles.rowValue}>{selectedInvoice.receiver_phone}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Receiver CNIC</span>
              <span style={styles.rowValue}>{selectedInvoice.receiver_cnic || '—'}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Quantity Delivered</span>
              <span style={styles.rowValue}>{selectedInvoice.delivered_quantity}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>From</span>
              <span style={styles.rowValue}>{selectedInvoice.bilties?.from_city || '—'}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>To</span>
              <span style={styles.rowValue}>{selectedInvoice.bilties?.to_city || '—'}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Freight</span>
              <span style={{ ...styles.rowValue, color: 'var(--success)' }}>
                Rs {Number(selectedInvoice.bilties?.total_amount || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ ...styles.row, borderBottom: 'none' }}>
              <span style={styles.rowLabel}>Payment Status</span>
              <span>
                {selectedInvoice.bilties?.payment_status && (
                  <span style={styles.badge(selectedInvoice.bilties.payment_status)}>
                    {selectedInvoice.bilties.payment_status}
                  </span>
                )}
              </span>
            </div>
            <button style={styles.closeBtn} onClick={() => setSelectedInvoice(null)}>
              <X size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
