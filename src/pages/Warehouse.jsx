import React, { useState, useEffect } from 'react';
import { Search, Filter, Archive, Printer, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMPANY } from '../lib/constants';
import './BiltyCreate.css';

// ──────────────────────────────────────────────
// PRINT BILTY COMPONENT
// ──────────────────────────────────────────────
const PrintBilty = ({ bilty, items }) => {
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bilty-print-area" style={{ border: '2px solid var(--primary)' }}>

      {/* Company Header Image - Only visible in print */}
      <div className="print-urdu-header">
        <img src="/bilty-header.jpg" alt="SPD Header" style={{ width: '100%', display: 'block' }} />
      </div>

      {/* English Company Header - hidden in print, shown on screen */}
      <div className="print-company-header screen-only-header" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid var(--warning)', marginBottom: '10px', background: '#1e3a8a', color: 'white' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>{COMPANY.name}</h1>
        <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0', opacity: 0.9, textTransform: 'uppercase' }}>Goods Transport Service</p>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0' }}>
          📍 {COMPANY.address}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0.4rem 0' }}>
          📞 {COMPANY.phones}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>
          📧 {COMPANY.email} | 🌐 {COMPANY.website}
        </div>
      </div>

      {/* Bilty Number Strip */}
      <div className="print-bilty-strip">
        <span>BILTY / CONSIGNMENT NOTE</span>
        <span>
          Bilty No: <span className="print-bilty-no-big">#{bilty.bilty_no}</span>
        </span>
        <span>Date: {bilty.bilty_date || today}</span>
      </div>

      {/* Sender & Receiver Info */}
      <div className="print-info-grid" style={{ borderBottom: '2px solid var(--primary)' }}>
        <div className="print-info-col">
          <div className="print-info-col-title">📤 SENDER INFORMATION</div>
          <div className="print-info-row">
            <span className="print-info-key">Name:</span>
            <span className="print-info-val">{bilty.sender_name}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-key">Phone:</span>
            <span className="print-info-val">{bilty.sender_phone || '—'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-key">From City:</span>
            <span className="print-info-val">{bilty.route_from || bilty.from_city}</span>
          </div>
        </div>
        <div className="print-info-col">
          <div className="print-info-col-title">📥 RECEIVER INFORMATION</div>
          <div className="print-info-row">
            <span className="print-info-key">Name:</span>
            <span className="print-info-val">{bilty.receiver_name}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-key">Phone:</span>
            <span className="print-info-val">{bilty.receiver_phone || '—'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-key">To City:</span>
            <span className="print-info-val">{bilty.route_to || bilty.to_city}</span>
          </div>
        </div>
      </div>

      {/* Goods Table */}
      <table className="print-goods-table">
        <thead>
          <tr>
            <th style={{ width: '30px' }}>#</th>
            <th>Description of Goods</th>
            <th style={{ textAlign: 'center' }}>Quantity</th>
            <th style={{ textAlign: 'center' }}>Weight (KG)</th>
            <th style={{ textAlign: 'center' }}>CBM</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><strong>{item.goods_bayan || item.name || item.item_name || ''}</strong></td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'center' }}>{item.weight}</td>
              <td style={{ textAlign: 'center' }}>{item.cbm || '-'}</td>
              <td style={{ textAlign: 'right' }}>Rs {Number(item.amount).toLocaleString()}</td>
            </tr>
          ))}
          {/* Totals Row */}
          <tr className="print-totals-row">
            <td></td>
            <td><strong>GRAND TOTAL</strong></td>
            <td style={{ textAlign: 'center' }}><strong>{bilty.total_quantity}</strong></td>
            <td style={{ textAlign: 'center' }}><strong>{bilty.total_weight} KG</strong></td>
            <td style={{ textAlign: 'center' }}>—</td>
            <td style={{ textAlign: 'right' }}><strong>Rs {Number(bilty.total_amount).toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Payment Section */}
      <div className="print-payment-section" style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.25rem', borderTop: '2px solid var(--primary)', borderBottom: '2px solid var(--primary)' }}>
        <div className="print-payment-summary" style={{ flex: '1', minWidth: '220px', padding: '0.8rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="print-payment-title">💰 Fare (Freight Charges)</div>
          <div className="print-payment-row"><span>Goods Fare:</span> <strong>Rs {Number(bilty.total_amount - bilty.local_karaya - bilty.loading_charges).toLocaleString()}</strong></div>
          {bilty.local_karaya > 0 && (
            <div className="print-payment-row"><span>Local Karaya:</span> <strong>Rs {Number(bilty.local_karaya).toLocaleString()}</strong></div>
          )}
          {bilty.loading_charges > 0 && (
            <div className="print-payment-row"><span>Loading Charges:</span> <strong>Rs {Number(bilty.loading_charges).toLocaleString()}</strong></div>
          )}
          <div className="print-payment-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span>Total Fare:</span> <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Rs {Number(bilty.total_amount).toLocaleString()}</strong>
          </div>
        </div>
        <div className="print-payment-block" style={{ flex: '1', minWidth: '220px', padding: '0.8rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="print-payment-title">💳 Payment Status / Tadaa</div>
          <div style={{ marginTop: '0.35rem' }}>
            <span className="print-payment-badge">{bilty.payment_status}</span>
            {bilty.party_name && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#555' }}>Party: {bilty.party_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Signature Footer */}
      <div className="print-footer">
        <div className="print-sign-box">
          <div className="print-sign-line">Sender's Signature</div>
        </div>
        <div className="print-sign-box">
          <div className="print-sign-line">Driver / Authorised Signature</div>
        </div>
        <div className="print-sign-box">
          <div className="print-sign-line">Receiver's Signature</div>
        </div>
      </div>

      {/* Terms */}
      <div className="print-terms">
        <span className="print-terms-title">Terms & Conditions: </span>
        Goods transported at owner's risk. Company not liable for delay due to natural calamities / road closures. All disputes subject to Karachi jurisdiction.
        This bilty is a legal consignment note. Please keep it safe for delivery verification.
      </div>
    </div>
  );
};


const Warehouse = () => {
  const [bilties, setBilties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Print State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [savedBilty, setSavedBilty] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [fetchingItems, setFetchingItems] = useState(false);

  const handlePrintRequest = async (bilty) => {
    setFetchingItems(true);
    try {
      const { data, error } = await supabase
        .from('bilty_items')
        .select('*')
        .eq('bilty_id', bilty.id);
      
      if (error) throw error;
      
      setSavedBilty(bilty);
      setSavedItems(data || []);
      
      setTimeout(() => window.print(), 500);

    } catch (error) {
      console.error('Error fetching bilty items:', error);
      alert('Error fetching bilty items for print.');
    } finally {
      setFetchingItems(false);
    }
  };

  useEffect(() => {
    fetchBilties();
  }, []);

  const fetchBilties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bilties')
        .select('*')
        .eq('status', 'Warehouse')
        .gt('remaining_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBilties(data || []);
    } catch (error) {
      console.error('Error fetching bilties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBilties = bilties.filter(b => 
    b.bilty_no?.toString().includes(searchTerm) || 
    b.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">

      {/* Removed Print Preview Modal */}

      {/* Hidden print target */}
      {savedBilty && (
        <div className="print-only" style={{ display: 'none' }} id="bilty-print-target">
          <div className="bilty-print-wrapper">
            <div className="bilty-print-copy">
              <PrintBilty bilty={savedBilty} items={savedItems} />
            </div>
            <div className="bilty-print-copy">
              <PrintBilty bilty={savedBilty} items={savedItems} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="text-primary"/> Warehouse Inventory</h1>
          <p className="text-muted mt-1">Manage and view all ready bilties waiting to be loaded into chalans.</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative" style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Search by Bilty Number, Sender, or Receiver..." 
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button className="btn btn-outline">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="p-8 text-center text-muted">Loading warehouse inventory...</div>
          ) : filteredBilties.length === 0 ? (
            <div className="p-8 text-center text-muted">No bilties found in warehouse.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bilty No.</th>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Route</th>
                  <th>Rem. Qty</th>
                  <th>Total Qty</th>
                  <th>Weight (KG)</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBilties.map((bilty) => (
                  <tr key={bilty.id}>
                    <td className="font-semibold text-primary">#{bilty.bilty_no}</td>
                    <td>{new Date(bilty.bilty_date).toLocaleDateString()}</td>
                    <td>
                      <div>{bilty.sender_name}</div>
                      <div className="text-xs text-muted">{bilty.sender_phone}</div>
                    </td>
                    <td>
                      <div>{bilty.receiver_name}</div>
                      <div className="text-xs text-muted">{bilty.receiver_phone}</div>
                    </td>
                    <td>
                      <div className="font-medium">{bilty.route_from || bilty.from_city} → {bilty.route_to || bilty.to_city}</div>
                    </td>
                    <td className="font-bold text-primary">{bilty.remaining_quantity}</td>
                    <td className="text-muted">{bilty.total_quantity}</td>
                    <td>{bilty.total_weight}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: bilty.payment_status === 'To Pay (Paid)' ? 'var(--success)' : 
                                         bilty.payment_status === 'Advance Fare' ? 'var(--primary)' : 'var(--warning)',
                        color: 'white'
                      }}>
                        {bilty.payment_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)'
                      }}>
                        {bilty.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handlePrintRequest(bilty)}
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem' }}
                        title="Print Bilty"
                        disabled={fetchingItems}
                      >
                        {fetchingItems && savedBilty?.id === bilty.id ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Warehouse;
