import React, { useState, useEffect, useRef } from 'react';
import './BiltyCreate.css';
import { Plus, Trash2, Save, Printer, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMPANY } from '../lib/constants';

// ──────────────────────────────────────────────
// PRINT BILTY COMPONENT
// ──────────────────────────────────────────────
const PrintBilty = ({ bilty, items }) => {
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bilty-print-area" style={{ border: '2px solid #1e3a8a' }}>

      {/* Company Header */}
      <div className="print-company-header" style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid #000', marginBottom: '10px' }}>
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
  const printRef = useRef();

  const [formData, setFormData] = useState({
    senderName: '',
    senderContact: '',
    receiverName: '',
    receiverContact: '',
    fromCity: 'Karachi',
    toCity: 'Lahore',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Advance Fare',
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
    } catch {
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
    // Get bilty print area HTML from the ref
    const printContent = printRef.current;
    if (!printContent) return;

    // Create hidden iframe
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
        cbm: Number(item.cbm || 0),
        amount: Number(item.amount || 0)
      }));

      const { error: itemsError } = await supabase.from('bilty_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Ledger entries
      if (formData.paymentStatus === 'Advance Fare' || formData.paymentStatus === 'To Pay (Paid)') {
        await supabase.from('cash_ledger').insert({
          transaction_type: 'Income',
          amount: totalCharges,
          source_description: `Bilty #${biltyData.bilty_no} - ${formData.paymentStatus}`,
          ref_id: biltyData.bilty_no.toString(),
          record_date: formData.date
        });
      } else if (formData.paymentStatus === 'Credit / Party Ledger') {
        await supabase.from('party_ledger').insert({
          party_name: formData.partyName,
          bilty_id: biltyData.id,
          amount: totalCharges,
          record_date: formData.date
        });
      }

      setSavedBilty(biltyData);
      setSavedItems(items);
      
      // Removed setShowPrintPreview(true) to avoid "2 designs" confusion

      // Reset form & refresh bilty number
      setFormData({ senderName: '', senderContact: '', receiverName: '', receiverContact: '', fromCity: 'Karachi', toCity: 'Lahore', date: new Date().toISOString().split('T')[0], paymentStatus: 'Advance Fare', partyName: '', localFare: '', loadingCharges: '', orderNumber: '', lclNumber: '', containerNumber: '', otherExpenseName: '', otherExpenseAmount: '' });
      setItems([{ id: Date.now(), goodsBayan: '', quantity: '', weight: '', cbm: '', amount: '' }]);
      fetchNextBiltyNo();

      // Auto-Print triggered directly
      setTimeout(() => {
        handlePrint();
      }, 500);

    } catch (error) {
      console.error('Bilty save error:', error);
      const msg = error?.message || JSON.stringify(error) || 'Unknown error';
      alert('❌ Error saving bilty:\n\n' + msg + '\n\nHint: Make sure you have run the SQL schema in your Supabase dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">

      {/* ── AUTO BILTY NUMBER DISPLAY ── */}
      <div className="bilty-number-header no-print">
        <div>
          <div className="bilty-number-label">Next Auto Bilty Number</div>
          <div className="bilty-number-value">#{nextBiltyNo}</div>
          <div className="bilty-number-date">Date: {formData.date}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div className="bilty-status-badge">🏭 Warehouse Ready</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Bilty numbers are unlimited & auto-generated</div>
        </div>
      </div>

      {/* Removed Print Preview Modal to simplify process */}

      {/* ── BILTY FORM ── */}
      <form onSubmit={handleSubmit} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-primary"/> Create New Bilty</h1>
        </div>

        {/* Route */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Route Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="input-group">
              <label className="input-label">From City</label>
              <input required type="text" name="fromCity" value={formData.fromCity} onChange={handleInputChange} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">To City</label>
              <input required type="text" name="toCity" value={formData.toCity} onChange={handleInputChange} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="input" />
            </div>
          </div>
        </div>

        {/* Sender & Receiver */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">📤 Sender Information</h2>
            <div className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Sender Name</label>
                <input required type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} className="input" placeholder="e.g. Ali Traders" />
              </div>
              <div className="input-group">
                <label className="input-label">Contact Number</label>
                <input type="text" name="senderContact" value={formData.senderContact} onChange={handleInputChange} className="input" placeholder="03XXXXXXXXX" />
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">📥 Receiver Information</h2>
            <div className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Receiver Name</label>
                <input required type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} className="input" placeholder="e.g. Usman Enterprises" />
              </div>
              <div className="input-group">
                <label className="input-label">Contact Number</label>
                <input type="text" name="receiverContact" value={formData.receiverContact} onChange={handleInputChange} className="input" placeholder="03XXXXXXXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* Goods */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold">📦 Goods Details</h2>
            <button type="button" onClick={addItem} className="btn btn-outline" style={{ padding: '0.3rem 0.75rem' }}>
              <Plus size={15} /> Add Item
            </button>
          </div>

          {/* Order / LCL / Container Numbers */}
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="input-group">
              <label className="input-label">Order Number</label>
              <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="input" placeholder="e.g. ORD-12345" />
            </div>
            <div className="input-group">
              <label className="input-label">LCL Number</label>
              <input type="text" name="lclNumber" value={formData.lclNumber} onChange={handleInputChange} className="input" placeholder="e.g. LCL-56789" />
            </div>
            <div className="input-group">
              <label className="input-label">Container Number</label>
              <input type="text" name="containerNumber" value={formData.containerNumber} onChange={handleInputChange} className="input" placeholder="e.g. CONT-98765" />
            </div>
          </div>

          <div className="table-wrapper mb-4">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description (Bayan) *</th>
                  <th width="10%">Qty *</th>
                  <th width="12%">Weight(KG) *</th>
                  <th width="12%">CBM</th>
                  <th width="15%">Amount *</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-muted font-bold">{index + 1}</td>
                    <td><input required type="text" className="input" placeholder="e.g. Bags / Cartons" value={item.goodsBayan} onChange={(e) => handleItemChange(item.id, 'goodsBayan', e.target.value)} /></td>
                    <td><input required type="number" min="0" className="input" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></td>
                    <td><input required type="number" min="0" className="input" value={item.weight} onChange={(e) => handleItemChange(item.id, 'weight', e.target.value)} /></td>
                    <td>
                        <input type="number" className="input" min="0" value={item.cbm} onChange={(e) => handleItemChange(item.id, 'cbm', e.target.value)} />
                      </td>
                    <td><input required type="number" min="0" className="input" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)} /></td>
                    <td>
                      <button type="button" onClick={() => removeItem(item.id)} className="btn btn-danger" style={{ padding: '0.35rem', borderRadius: '50%' }} disabled={items.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex justify-end gap-8" style={{ backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <div><span className="text-muted font-medium">Total Qty:</span> <span className="font-bold text-xl" style={{ color: 'var(--primary)' }}>{totalQuantity}</span></div>
            <div><span className="text-muted font-medium">Total Weight:</span> <span className="font-bold text-xl" style={{ color: 'var(--primary)' }}>{totalWeight} KG</span></div>
          </div>
        </div>



        {/* Karaya */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">💰 Karaya & Payment</h2>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="input-group">
              <label className="input-label">Local Transport Fare</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted">Rs</span>
                <input type="number" min="0" className="input" style={{ paddingLeft: '2rem' }} value={formData.localFare} onChange={(e) => setFormData({...formData, localFare: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Loading Charges (Rs)</label>
              <input type="number" min="0" name="loadingCharges" value={formData.loadingCharges} onChange={handleInputChange} className="input" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="input-group">
              <label className="input-label">Other Expense Name</label>
              <input type="text" name="otherExpenseName" value={formData.otherExpenseName} onChange={handleInputChange} className="input" placeholder="e.g. Packaging, Insurance" />
            </div>
            <div className="input-group">
              <label className="input-label">Other Expense Amount (Rs)</label>
              <input type="number" min="0" name="otherExpenseAmount" value={formData.otherExpenseAmount} onChange={handleInputChange} className="input" placeholder="0" />
            </div>
            <div className="input-group">
              <label className="input-label">Total Karaya</label>
              <div className="input font-bold text-lg" style={{ backgroundColor: 'var(--background)', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                Rs. {totalCharges.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="input-group">
              <label className="input-label">Payment Mode *</label>
              <select className="input" value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}>
                <option value="Advance Fare">Advance Fare</option>
                <option value="To Pay (Paid)">To Pay (Paid)</option>
                <option value="Credit / Party Ledger">Credit / Party Ledger</option>
              </select>
            </div>
            {formData.paymentStatus === 'Credit / Party Ledger' && (
              <div className="input-group">
                <label className="input-label">Party Name</label>
                <input required type="text" name="partyName" value={formData.partyName} onChange={handleInputChange} className="input" placeholder="Enter Party Name" />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save & Preview Bilty'}
          </button>
        </div>
      </form>

      {/* Hidden print target (only shows in print media) */}
      {savedBilty && (
        <div style={{ display: 'none' }}>
          <div className="bilty-print-area" ref={printRef}>
            <PrintBilty bilty={savedBilty} items={savedItems} />
          </div>
        </div>
      )}

    </div>
  );
};

export default BiltyCreate;
