import React, { useState, useEffect, useRef } from 'react';
import './BiltyCreate.css';
import { Plus, Trash2, Save, Printer, FileText, MapPin, Calendar, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMPANY } from '../lib/constants';

// ──────────────────────────────────────────────
// PRINT BILTY COMPONENT
// ──────────────────────────────────────────────
const PrintBilty = ({ bilty, items }) => {
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bilty-print-area" style={{ border: '2px solid #1e3a8a' }}>

      {/* Company Header Image - Only visible in print */}
      <div className="print-urdu-header">
        <img src="/bilty-header.jpg" alt="SPD Header" style={{ width: '100%', display: 'block' }} />
      </div>

      {/* English Company Header - hidden in print, shown on screen */}
      <div className="print-company-header screen-only-header" style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid #000', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, color: '#000', letterSpacing: '1px' }}>{COMPANY.name}</h1>
        <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0', color: '#333', textTransform: 'uppercase' }}>Goods Transport Service</p>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0', color: '#000' }}>
          📍 {COMPANY.address}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0.4rem 0', color: '#000' }}>
          📞 {COMPANY.phones}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>
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
      <div className="print-info-grid" style={{ borderBottom: '2px solid #1e3a8a' }}>
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

      {/* Order / LCL / Container Info */}
      {(bilty.order_number || bilty.lcl_number || bilty.container_number) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1.25rem', borderBottom: '2px solid #1e3a8a', fontSize: '0.85rem' }}>
          {bilty.order_number && (
            <div><span style={{ fontWeight: 700, color: '#1e3a8a' }}>Order No: </span><span style={{ fontWeight: 600 }}>{bilty.order_number}</span></div>
          )}
          {bilty.lcl_number && (
            <div><span style={{ fontWeight: 700, color: '#1e3a8a' }}>LCL No: </span><span style={{ fontWeight: 600 }}>{bilty.lcl_number}</span></div>
          )}
          {bilty.container_number && (
            <div><span style={{ fontWeight: 700, color: '#1e3a8a' }}>Container No: </span><span style={{ fontWeight: 600 }}>{bilty.container_number}</span></div>
          )}
        </div>
      )}

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
              <td><strong>{item.goodsBayan || item.goods_bayan || item.item_name || ''}</strong></td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'center' }}>{item.weight}</td>
              <td style={{ textAlign: 'center' }}>{item.cbm || item.additional_weight || '-'}</td>
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
      <div className="print-payment-section">
        <div className="print-payment-block">
          <div className="print-payment-title">💰 Karaya (Freight Charges)</div>
          <div className="print-payment-value">Rs. {bilty.total_amount?.toLocaleString()}</div>
          {bilty.other_expense_name && (
            <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.3rem' }}>
              {bilty.other_expense_name}: Rs. {Number(bilty.other_expense_amount || 0).toLocaleString()}
            </div>
          )}
        </div>
        <div className="print-payment-block">
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

// ──────────────────────────────────────────────
// MAIN BILTY CREATE PAGE
// ──────────────────────────────────────────────
const BiltyCreate = () => {
  const [loading, setLoading] = useState(false);
  const [nextBiltyNo, setNextBiltyNo] = useState('...');
  const [savedBilty, setSavedBilty] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [dbError, setDbError] = useState(null);
  const printRef = useRef();

  const [formData, setFormData] = useState({
    senderName: '',
    senderContact: '',
    receiverName: '',
    receiverContact: '',
    fromCity: 'Karachi',
    toCity: 'Lahore',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Advance Fare', // Options: 'Advance Fare', 'To Pay', 'Credit / Party Ledger'
    partyName: '',
    localFare: '',
    loadingCharges: '',
    orderNumber: '',
    lclNumber: '',
    containerNumber: '',
    otherExpenseName: '',
    otherExpenseAmount: '',
  });

  const [items, setItems] = useState([
    { id: 1, goodsBayan: '', quantity: '', weight: '', cbm: '', amount: '' }
  ]);

  // Fetch next bilty number on mount
  useEffect(() => {
    fetchNextBiltyNo();
  }, []);

  const fetchNextBiltyNo = async () => {
    try {
      const { data, error } = await supabase
        .from('bilties')
        .select('bilty_no')
        .order('bilty_no', { ascending: false })
        .limit(1);
      if (error) throw error;
      const lastNo = data && data.length > 0 ? data[0].bilty_no : 0;
      setNextBiltyNo(lastNo + 1);

      // Also check if bilty_items has 'amount' column
      const { error: columnCheckError } = await supabase
        .from('bilty_items')
        .select('amount')
        .limit(1);
      
      if (columnCheckError && columnCheckError.code === '42703') {
        setDbError('missing_amount_column');
      }
    } catch (err) {
      console.error('Fetch next bilty error:', err);
      if (err.code === '42703' && err.message?.includes('amount')) {
        setDbError('missing_amount_column');
      }
      setNextBiltyNo('Auto');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), goodsBayan: '', quantity: '', weight: '', cbm: '', amount: '' }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const totalWeight = items.reduce((s, i) => s + Number(i.weight || 0), 0);
  const totalQuantity = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  
  // Total charges = Sum of all item amounts + Local Fare + Loading Charges + Other Expense
  const totalItemAmounts = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalCharges = totalItemAmounts + Number(formData.localFare || 0) + Number(formData.loadingCharges || 0) + Number(formData.otherExpenseAmount || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build bilty object without bilty_no to let DB handle SERIAL auto-increment
      const biltyToInsert = {
        sender_name: formData.senderName,
        sender_phone: formData.senderContact,
        receiver_name: formData.receiverName,
        receiver_phone: formData.receiverContact,
        route_from: formData.fromCity,
        route_to: formData.toCity,
        from_city: formData.fromCity,
        to_city: formData.toCity,
        bilty_date: formData.date,
        payment_status: formData.paymentStatus,
        party_name: formData.paymentStatus === 'Credit / Party Ledger' ? formData.partyName : null,
        local_karaya: Number(formData.localFare || 0),
        loading_charges: Number(formData.loadingCharges || 0),
        order_number: formData.orderNumber || null,
        lcl_number: formData.lclNumber || null,
        container_number: formData.containerNumber || null,
        other_expense_name: formData.otherExpenseName || null,
        other_expense_amount: Number(formData.otherExpenseAmount || 0),
        total_quantity: Number(totalQuantity || 0),
        remaining_quantity: Number(totalQuantity || 0),
        total_weight: Number(totalWeight || 0),
        total_amount: Number(totalCharges || 0),
        status: 'Warehouse'
      };

      const { data: biltyData, error: biltyError } = await supabase
        .from('bilties')
        .insert(biltyToInsert)
        .select()
        .single();

      if (biltyError) throw biltyError;

      const itemsToInsert = items.map(item => ({
        bilty_id: biltyData.id,
        goods_bayan: item.goodsBayan,
        quantity: Number(item.quantity),
        weight: Number(item.weight),
        additional_weight: Number(item.cbm || 0),
        amount: Number(item.amount || 0)
      }));

      const { error: itemsError } = await supabase.from('bilty_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // ==========================================
      // LEDGER ENTRIES (Payment Routing)
      // ==========================================
      if (formData.paymentStatus === 'Advance Fare') {
        // 1. Advance Fare -> Karachi Cash Ledger
        console.log('Inserting into Karachi Cash Ledger (cash_ledger)...');
        await supabase.from('cash_ledger').insert({
          transaction_type: 'Income',
          amount: totalCharges,
          source_description: `Bilty #${biltyData.bilty_no} - Advance`,
          ref_id: biltyData.bilty_no.toString(),
          record_date: formData.date
        });
      } else if (formData.paymentStatus === 'To Pay') {
        // 2. To Pay -> Lahore Cash Ledger
        console.log('Inserting into Lahore Cash Ledger (lahore_cash_ledger)...');
        await supabase.from('lahore_cash_ledger').insert({
          transaction_type: 'Income',
          amount: totalCharges,
          description: `Bilty #${biltyData.bilty_no} - To Pay (Lahore)`,
          record_date: formData.date
        });
      } else if (formData.paymentStatus === 'Credit / Party Ledger') {
        // 3. Credit / Party Ledger -> Party Ledger
        console.log('Inserting into Party Ledger (party_ledger)...');
        await supabase.from('party_ledger').insert({
          party_name: formData.partyName,
          bilty_id: biltyData.id,
          amount: totalCharges,
          record_date: formData.date
        });
      }

      setSavedBilty(biltyData);
      setSavedItems(items);

      // Auto-Print triggered directly after a short delay to ensure rendering
      setTimeout(() => {
        handlePrint();
        
        // Reset form & refresh bilty number AFTER print is initiated
        setFormData({ 
          senderName: '', senderContact: '', receiverName: '', receiverContact: '', 
          fromCity: 'Karachi', toCity: 'Lahore', 
          date: new Date().toISOString().split('T')[0], 
          paymentStatus: 'Advance Fare', partyName: '', localFare: '', loadingCharges: '', 
          orderNumber: '', lclNumber: '', containerNumber: '', 
          otherExpenseName: '', otherExpenseAmount: '' 
        });
        setItems([{ id: Date.now(), goodsBayan: '', quantity: '', weight: '', cbm: '', amount: '' }]);
        fetchNextBiltyNo();
      }, 800);

    } catch (error) {
      console.error('Bilty save error:', error);
      const msg = error?.message || JSON.stringify(error) || 'Unknown error';
      
      if (msg.includes('amount') && msg.includes('bilty_items')) {
        alert(`❌ DATABASE ERROR: Missing 'amount' column.

To fix this, please follow these 2 steps:

1. Run this SQL in your Supabase SQL Editor:
ALTER TABLE bilty_items ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;

2. After running the SQL, go to:
Settings -> API -> PostgREST -> Click "Reload Schema"

Then refresh this page and try again.`);
      } else {
        alert('❌ Error saving bilty:\n\n' + msg + '\n\nHint: Make sure you have run the SQL schema in your Supabase dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">

      {dbError === 'missing_amount_column' && (
        <div className="card mb-6" style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412' }}>
          <div className="flex items-start gap-4">
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div>
              <h3 className="font-bold text-lg mb-1">Database Update Required</h3>
              <p className="mb-3">The "Item Amount" feature is enabled in the code but missing from your database. To fix the Bilty saving and printing, please run this SQL in your Supabase SQL Editor:</p>
              <pre style={{ background: '#fed7aa', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', fontWeight: 'bold', border: '1px solid #fdba74' }}>
                ALTER TABLE bilty_items ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
              </pre>
              <div className="mt-4 flex gap-3">
                <a 
                  href="https://app.supabase.com/project/_/sql" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-primary text-xs"
                  style={{ background: '#9a3412', border: 'none', padding: '0.5rem 1rem', color: 'white' }}
                >
                   Open Supabase SQL Editor
                </a>
                <p className="text-xs self-center">1. Copy code above. 2. Click button. 3. Paste and Run. 4. Refresh this page.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTO BILTY NUMBER DISPLAY ── */}
      <div className="bilty-number-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white"><FileText size={22}/> Create Bilty</h1>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '1.5rem' }}>
            <div className="bilty-number-label">Auto Bilty No.</div>
            <div className="bilty-number-value">#{nextBiltyNo}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="text-right">
             <div className="bilty-number-date">Date: {formData.date}</div>
             <div style={{ fontSize: '0.65rem', opacity: 0.75 }}>Unlimited & Auto-Generated</div>
          </div>
        </div>
      </div>

      {/* ── BILTY FORM ── */}
      <form onSubmit={handleSubmit} className="no-print">
        {/* Removed redundant h1 title */}

        {/* Route / Trip Details */}
        <div className="card p-compact mb-compact">
          <h2 className="text-xs font-bold border-b mb-2 pb-1 text-primary flex items-center gap-2">🗺️ Route & Trip Details</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="input-group">
              <label className="input-label text-2xs flex items-center gap-1"><MapPin size={10} className="text-primary"/> From Booking</label>
              <input required type="text" name="fromCity" value={formData.fromCity} onChange={handleInputChange} className="input text-sm p-2" style={{height: '32px'}} />
            </div>
            <div className="input-group">
              <label className="input-label text-2xs flex items-center gap-1"><MapPin size={10} className="text-primary"/> Destination</label>
              <input required type="text" name="toCity" value={formData.toCity} onChange={handleInputChange} className="input text-sm p-2" style={{height: '32px'}} />
            </div>
            <div className="input-group">
              <label className="input-label text-2xs flex items-center gap-1"><Calendar size={10} className="text-primary"/> Bilty Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="input text-sm p-2" style={{height: '32px'}} />
            </div>
            <div className="input-group">
               <label className="input-label text-2xs flex items-center gap-1"><Hash size={10} className="text-primary"/> Order Number</label>
               <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="input text-sm p-2" style={{height: '32px'}} placeholder="Optional" />
            </div>
          </div>
        </div>

        {/* Sender & Receiver */}
        <div className="grid grid-cols-2 gap-4 mb-compact">
          <div className="card p-compact">
            <h2 className="text-sm font-bold mb-3 border-b pb-1">📤 Sender</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="input-label text-xs">Name</label>
                <input required type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} className="input text-sm p-2" placeholder="Ali Traders" />
              </div>
              <div className="input-group">
                <label className="input-label text-xs">Contact</label>
                <input type="text" name="senderContact" value={formData.senderContact} onChange={handleInputChange} className="input text-sm p-2" placeholder="0321..." />
              </div>
            </div>
          </div>
          <div className="card p-compact">
            <h2 className="text-sm font-bold mb-3 border-b pb-1">📥 Receiver</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="input-label text-xs">Name</label>
                <input required type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} className="input text-sm p-2" placeholder="Usman Ent." />
              </div>
              <div className="input-group">
                <label className="input-label text-xs">Contact</label>
                <input type="text" name="receiverContact" value={formData.receiverContact} onChange={handleInputChange} className="input text-sm p-2" placeholder="0333..." />
              </div>
            </div>
          </div>
        </div>

        {/* Goods */}
        <div className="card p-compact mb-compact">
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <h2 className="text-sm font-bold">📦 Goods Details</h2>
            <div className="flex gap-4">
               <div className="input-group flex-row items-center gap-2">
                 <label className="input-label text-xs">LCL #</label>
                 <input type="text" name="lclNumber" value={formData.lclNumber} onChange={handleInputChange} className="input text-sm p-1" style={{width: '100px'}} />
               </div>
               <div className="input-group flex-row items-center gap-2">
                 <label className="input-label text-xs">Container #</label>
                 <input type="text" name="containerNumber" value={formData.containerNumber} onChange={handleInputChange} className="input text-sm p-1" style={{width: '120px'}} />
               </div>
               <button type="button" onClick={addItem} className="btn btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={14} /> Add Item
               </button>
            </div>
          </div>

          <div className="table-wrapper mb-2">
            <table>
              <thead>
                <tr>
                  <th style={{padding: '0.4rem'}}>#</th>
                  <th style={{padding: '0.4rem'}}>Description *</th>
                  <th width="10%" style={{padding: '0.4rem'}}>Qty*</th>
                  <th width="12%" style={{padding: '0.4rem'}}>Wt(KG)*</th>
                  <th width="10%" style={{padding: '0.4rem'}}>CBM</th>
                  <th width="15%" style={{padding: '0.4rem'}}>Amt*</th>
                  <th style={{ width: '40px', padding: '0.4rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-muted font-bold" style={{padding: '0.3rem'}}>{index + 1}</td>
                    <td style={{padding: '0.3rem'}}><input required type="text" className="input text-xs" spellCheck="false" placeholder="Bags" value={item.goodsBayan} onChange={(e) => handleItemChange(item.id, 'goodsBayan', e.target.value)} /></td>
                    <td style={{padding: '0.3rem'}}><input required type="number" min="0" className="input text-xs" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></td>
                    <td style={{padding: '0.3rem'}}><input required type="number" min="0" className="input text-xs" value={item.weight} onChange={(e) => handleItemChange(item.id, 'weight', e.target.value)} /></td>
                    <td style={{padding: '0.3rem'}}>
                        <input type="number" className="input text-xs" min="0" value={item.cbm} onChange={(e) => handleItemChange(item.id, 'cbm', e.target.value)} />
                      </td>
                    <td style={{padding: '0.3rem'}}><input required type="number" min="0" className="input text-xs" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)} /></td>
                    <td style={{padding: '0.3rem'}}>
                      <button type="button" onClick={() => removeItem(item.id)} className="btn btn-danger" style={{ padding: '0.2rem', borderRadius: '50%' }} disabled={items.length === 1}>
                        <Trash2 size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-1.5 flex justify-end gap-6" style={{ backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <div className="text-xs"><span className="text-muted font-medium">Total Qty:</span> <span className="font-bold text-primary">{totalQuantity}</span></div>
            <div className="text-xs"><span className="text-muted font-medium">Total Weight:</span> <span className="font-bold text-primary">{totalWeight} KG</span></div>
          </div>
        </div>

        {/* Karaya & Payment Section */}
        <div className="card p-compact">
          <h2 className="text-xs font-bold border-b mb-2 pb-1 text-primary flex items-center gap-2">💰 Payments & Additional Charges</h2>
          
          {/* Main Charges Row */}
          <div className="grid grid-cols-6 gap-3 mb-3 items-end">
            <div className="input-group">
              <label className="input-label text-2xs">Local Fare</label>
              <input type="number" className="input text-sm p-2" value={formData.localFare} onChange={(e) => setFormData({...formData, localFare: e.target.value})} placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label text-2xs">Loading</label>
              <input type="number" name="loadingCharges" value={formData.loadingCharges} onChange={handleInputChange} className="input text-sm p-2" placeholder="0" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label text-2xs">Ex. Name (Other Expense)</label>
              <input type="text" name="otherExpenseName" value={formData.otherExpenseName} onChange={handleInputChange} className="input text-sm p-2" placeholder="Packaging" />
            </div>
            <div className="input-group">
              <label className="input-label text-2xs">Ex. Amt</label>
              <input type="number" name="otherExpenseAmount" value={formData.otherExpenseAmount} onChange={handleInputChange} className="input text-sm p-2" placeholder="0" />
            </div>
            <div className="input-group">
               <label className="input-label font-bold text-primary text-2xs text-center">Total Amount</label>
               <div className="input font-bold text-primary bg-blue-50 border-blue-200 flex items-center justify-center text-sm" style={{ height: '32px' }}>
                Rs. {totalCharges.toLocaleString()}
               </div>
            </div>
          </div>
          
          {/* Payment Mode & Save Row */}
          <div className="flex gap-4 items-end bg-slate-50 p-2 rounded-md border border-slate-100">
            <div className="input-group" style={{ flex: 1.5 }}>
              <label className="input-label text-2xs">Payment Mode *</label>
              <select className="input text-sm p-1" style={{ height: '32px' }} value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}>
                <option value="Advance Fare">Advance Fare</option>
                <option value="To Pay">To Pay</option>
                <option value="Credit / Party Ledger">Credit / Party Ledger</option>
              </select>
            </div>
            {formData.paymentStatus === 'Credit / Party Ledger' && (
              <div className="input-group" style={{ flex: 2 }}>
                <label className="input-label text-2xs">Party Name</label>
                <input required type="text" name="partyName" value={formData.partyName} onChange={handleInputChange} className="input text-sm p-1" style={{ height: '32px' }} placeholder="Enter Party Name" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <button type="submit" className="btn btn-primary shadow-md" disabled={loading} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', height: '32px', background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)' }}>
                <Save size={14} /> {loading ? 'Saving...' : 'Save & Print'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Hidden print target (only shows in print media) */}
      {savedBilty && (
        <div className="print-only" style={{ display: 'none' }}>
          <div className="bilty-print-wrapper" ref={printRef}>
            <div className="bilty-print-copy">
              <PrintBilty bilty={savedBilty} items={savedItems} />
            </div>
            <div className="bilty-print-copy">
              <PrintBilty bilty={savedBilty} items={savedItems} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BiltyCreate;
