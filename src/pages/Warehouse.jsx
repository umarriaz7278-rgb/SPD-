import React, { useState, useEffect } from 'react';
import { Search, Filter, Archive, Printer, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMPANY } from '../lib/constants';

// ──────────────────────────────────────────────
// PRINT BILTY COMPONENT
// ──────────────────────────────────────────────
const PrintBilty = ({ bilty, items }) => {
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bilty-print-area" style={{ border: '2px solid var(--primary)' }}>

      {/* Company Header */}
      <div className="print-company-header" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid var(--warning)', marginBottom: '10px', background: '#1e3a8a', color: 'white' }}>
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
      // Removed setShowPrintPreview(true) to simplify

      setTimeout(() => handlePrint(), 500);

    } catch (error) {
      console.error('Error fetching bilty items:', error);
      alert('Error fetching bilty items for print.');
    } finally {
      setFetchingItems(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('bilty-print-target');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
      <head>
        <title>Bilty Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; color: black; }
          .bilty-print-area { width: 100%; max-width: 800px; margin: 0 auto; }
          .print-company-header { background: #1e3a8a; color: white; text-align: center; padding: 1.5rem 2rem; border-bottom: 5px solid #f59e0b; border-radius: 8px 8px 0 0; }
          .print-company-name { font-size: 1.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
          .print-company-tagline { font-size: 0.85rem; opacity: 0.9; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 0.2rem; margin-bottom: 0.8rem; }
          .print-company-contact-bar { background: rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 6px; font-size: 0.8rem; line-height: 1.4; }
          .print-bilty-strip { background: #f59e0b; color: #1e3a8a; display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.5rem; font-weight: 900; font-size: 0.95rem; }
          .print-bilty-no-big { font-size: 1.4rem; letter-spacing: 0.05em; }
          .print-info-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; }
          .print-info-col { padding: 0.75rem 1.25rem; border-right: 2px solid #1e3a8a; }
          .print-info-col:last-child { border-right: none; }
          .print-info-col-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: white; background: #1e3a8a; padding: 0.2rem 0.5rem; display: inline-block; border-radius: 3px; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
          .print-info-row { display: flex; margin-bottom: 0.2rem; font-size: 0.82rem; gap: 0.25rem; }
          .print-info-key { font-weight: 700; min-width: 90px; flex-shrink: 0; color: #1e3a8a; }
          .print-info-val { color: #111; font-weight: 500; }
          .print-goods-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
          .print-goods-table th { background: #1e3a8a; color: white; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; }
          .print-goods-table td { padding: 0.45rem 0.75rem; border-bottom: 1px solid #e5e7eb; color: #111; }
          .print-goods-table tr:nth-child(even) td { background: #f8faff; }
          .print-totals-row td { font-weight: 700; background: #eff6ff !important; border-top: 2px solid #1e3a8a; color: #1e3a8a; }
          .print-payment-section { display: grid; grid-template-columns: 1fr 1fr; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; }
          .print-payment-block { padding: 0.75rem 1.25rem; border-right: 2px solid #1e3a8a; }
          .print-payment-block:last-child { border-right: none; }
          .print-payment-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #1e3a8a; margin-bottom: 0.35rem; }
          .print-payment-value { font-size: 1.3rem; font-weight: 900; color: #1e3a8a; }
          .print-payment-badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; background: #f59e0b; color: #1e3a8a; }
          .print-footer { padding: 0.75rem 1.25rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; border-bottom: 2px solid #1e3a8a; }
          .print-sign-box { text-align: center; }
          .print-sign-line { border-top: 1px solid #aaa; margin-top: 2rem; padding-top: 0.25rem; font-size: 0.7rem; text-transform: uppercase; color: #555; font-weight: 600; }
          .print-terms { background: #eff6ff; padding: 0.5rem 1.25rem; font-size: 0.65rem; color: #555; border-top: 1px solid #bfdbfe; }
          .print-terms-title { font-weight: 700; color: #1e3a8a; }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Cleanup after print
    setTimeout(() => document.body.removeChild(iframe), 1000);
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
        <div style={{ display: 'none' }} id="bilty-print-target">
           <PrintBilty bilty={savedBilty} items={savedItems} />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="text-primary"/> Karachi warehouse Inventory</h1>
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
            <div className="p-8 text-center text-muted">Loading Karachi warehouse inventory...</div>
          ) : filteredBilties.length === 0 ? (
            <div className="p-8 text-center text-muted">No bilties found in Karachi warehouse.</div>
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
