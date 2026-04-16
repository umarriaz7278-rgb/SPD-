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
  const [isManualBilty, setIsManualBilty] = useState(false);
  const [manualBiltyNo, setManualBiltyNo] = useState('');
  const [biltyNoError, setBiltyNoError] = useState('');

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
      // Validate manual bilty number if in manual mode
      if (isManualBilty) {
        const manualNo = Number(manualBiltyNo);
        if (!manualBiltyNo || isNaN(manualNo) || manualNo <= 0) {
          alert('❌ Please enter a valid manual bilty number.');
          setLoading(false);
          return;
        }
        // Check for duplicate
        const { data: existing, error: checkError } = await supabase
          .from('bilties')
          .select('bilty_no')
          .eq('bilty_no', manualNo)
          .limit(1);
        if (checkError) throw checkError;
        if (existing && existing.length > 0) {
          setBiltyNoError(`Bilty #${manualNo} already exists. Please use a different number.`);
          setLoading(false);
          return;
        }
        setBiltyNoError('');
      }

      // Build bilty object
      const biltyToInsert = {
        ...(isManualBilty ? { bilty_no: Number(manualBiltyNo) } : {}),
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
        item_name: item.goodsBayan,
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
        setIsManualBilty(false);
        setManualBiltyNo('');
        setBiltyNoError('');
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
    <div className="bma-bilty-root animate-fade-in">

      {dbError === 'missing_amount_column' && (
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <strong>⚠️ Database Update Required:</strong> Run <code>ALTER TABLE bilty_items ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;</code> in Supabase SQL Editor, then refresh.
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="bma-bilty-header no-print">
        <div className="bma-bilty-title">
          <span className="bma-bilty-icon">✈</span>
          <span>Bilty Entry</span>
        </div>
        <div className="bma-bilty-header-actions">
          <a href="/bilty-history" className="bma-btn-allbilties">All Bilties</a>
          <button
            type="button"
            onClick={() => { setIsManualBilty(false); setManualBiltyNo(''); setBiltyNoError(''); }}
            className="bma-btn-addnew"
          >
            Add New
          </button>
        </div>
      </div>

      {/* ── BILTY FORM ── */}
      <form onSubmit={handleSubmit} className="no-print bma-bilty-form">

        {/* Row 1: Bilty No, Type, Date, Mobile */}
        <div className="bma-form-section">
          <div className="bma-form-grid bma-grid-4">
            {/* Bilty No */}
            <div className="bma-field">
              <label className="bma-label">Bilty No <span className="bma-req">*</span></label>
              {isManualBilty ? (
                <>
                  <input
                    type="number"
                    value={manualBiltyNo}
                    onChange={(e) => { setManualBiltyNo(e.target.value); setBiltyNoError(''); }}
                    placeholder="Enter #"
                    className="bma-input"
                    style={{ borderColor: biltyNoError ? '#ef4444' : undefined }}
                  />
                  {biltyNoError && <div className="bma-field-error">{biltyNoError}</div>}
                </>
              ) : (
                <div className="bma-input bma-input-readonly">#{nextBiltyNo}</div>
              )}
              <label className="bma-manual-toggle">
                <input
                  type="checkbox"
                  checked={isManualBilty}
                  onChange={(e) => { setIsManualBilty(e.target.checked); setBiltyNoError(''); setManualBiltyNo(''); }}
                  style={{ accentColor: '#f97316', marginRight: '4px' }}
                />
                Manual
              </label>
            </div>

            {/* Type / Payment Mode */}
            <div className="bma-field">
              <label className="bma-label">Type <span className="bma-req">*</span></label>
              <select
                className="bma-input bma-select"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Advance Fare">Advance Fare</option>
                <option value="To Pay">To Pay</option>
                <option value="Credit / Party Ledger">Credit / Party Ledger</option>
              </select>
            </div>

            {/* Date */}
            <div className="bma-field">
              <label className="bma-label">Date <span className="bma-req">*</span></label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>

            {/* Mobile → LCL Number */}
            <div className="bma-field">
              <label className="bma-label">Mobile</label>
              <input
                type="text"
                name="lclNumber"
                value={formData.lclNumber}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Sender Name, Receiver Name */}
        <div className="bma-form-section">
          <div className="bma-form-grid bma-grid-4">
            <div className="bma-field">
              <label className="bma-label">Sender Name</label>
              <input
                type="text"
                name="senderContact"
                value={formData.senderContact}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Receiver Name</label>
              <input
                required
                type="text"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Loading Points, Destination, Qty, CBM, Description */}
        <div className="bma-form-section">
          <div className="bma-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr 0.6fr 2fr', gap: '1rem' }}>
            <div className="bma-field">
              <label className="bma-label">Loading Points <span className="bma-req">*</span></label>
              <input
                required
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                className="bma-input"
                placeholder=""
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Destination</label>
              <input
                required
                type="text"
                name="toCity"
                value={formData.toCity}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Qty</label>
              <input
                required
                type="number"
                min="0"
                className="bma-input"
                value={items[0]?.quantity || ''}
                onChange={(e) => handleItemChange(items[0].id, 'quantity', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">CBM</label>
              <input
                type="number"
                min="0"
                className="bma-input"
                value={items[0]?.cbm || ''}
                onChange={(e) => handleItemChange(items[0].id, 'cbm', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Description</label>
              <input
                required
                type="text"
                className="bma-input"
                value={items[0]?.goodsBayan || ''}
                onChange={(e) => handleItemChange(items[0].id, 'goodsBayan', e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Row 3: Freight, Vehicle Freight, Weight Charges */}
        <div className="bma-form-section">
          <div className="bma-form-grid bma-grid-4">
            <div className="bma-field">
              <label className="bma-label">Freight <span className="bma-req">*</span></label>
              <input
                required
                type="number"
                min="0"
                className="bma-input"
                value={items[0]?.amount || ''}
                onChange={(e) => handleItemChange(items[0].id, 'amount', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Local Freight <span className="bma-req">*</span></label>
              <input
                required
                type="number"
                min="0"
                name="localFare"
                value={formData.localFare}
                onChange={handleInputChange}
                className="bma-input"
                placeholder="0"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Weight KG</label>
              <input
                type="number"
                min="0"
                className="bma-input"
                value={items[0]?.weight || ''}
                onChange={(e) => handleItemChange(items[0].id, 'weight', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Total Freight, Container No */}
        <div className="bma-form-section">
          <div className="bma-form-grid bma-grid-4">
            <div className="bma-field">
              <label className="bma-label">Total Freight</label>
              <div className="bma-input bma-input-readonly">{totalCharges > 0 ? totalCharges.toLocaleString() : '0'}</div>
            </div>
            <div className="bma-field">
              <label className="bma-label">Container No</label>
              <input
                type="text"
                name="containerNumber"
                value={formData.containerNumber}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
          </div>
        </div>



        {/* Additional items rows (if more than 1 item) */}
        {items.length > 1 && (
          <div className="bma-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Additional Items</span>
            </div>
            <div className="bma-table-wrap">
              <table className="bma-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Weight (KG)</th>
                    <th>CBM</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(1).map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 2}</td>
                      <td><input required type="text" className="bma-input" value={item.goodsBayan} onChange={(e) => handleItemChange(item.id, 'goodsBayan', e.target.value)} /></td>
                      <td><input required type="number" min="0" className="bma-input" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></td>
                      <td><input required type="number" min="0" className="bma-input" value={item.weight} onChange={(e) => handleItemChange(item.id, 'weight', e.target.value)} /></td>
                      <td><input type="number" min="0" className="bma-input" value={item.cbm} onChange={(e) => handleItemChange(item.id, 'cbm', e.target.value)} /></td>
                      <td><input required type="number" min="0" className="bma-input" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)} /></td>
                      <td>
                        <button type="button" onClick={() => removeItem(item.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={12} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="bma-form-actions">
          <button type="submit" className="bma-btn-save" disabled={loading}>
            <Save size={15} /> {loading ? 'Saving...' : '✔ SAVE'}
          </button>
          <button type="button" onClick={addItem} className="bma-btn-addmore">
            <Plus size={15} /> ADD MORE
          </button>
          <button type="button" onClick={handlePrint} className="bma-btn-print">
            <Printer size={15} /> PRINT
          </button>
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
