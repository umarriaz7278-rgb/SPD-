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
  const biltyDate = bilty.bilty_date
    ? new Date(bilty.bilty_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
    : today;

  const s = {
    wrap: { fontFamily: "'Arial', sans-serif", color: '#1a1a2e', background: '#fff', border: '2px solid #1e3a8a', borderRadius: '6px', overflow: 'hidden', width: '100%' },
    header: { background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { width: '36px', height: '36px', background: '#fff', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    logoText: { color: '#1e3a8a', fontWeight: 900, fontSize: '11px', letterSpacing: '0.5px' },
    companyName: { color: '#fff', fontWeight: 900, fontSize: '13px', lineHeight: 1.1, letterSpacing: '0.3px' },
    companySubtitle: { color: '#bfdbfe', fontWeight: 700, fontSize: '8px', marginTop: '1px' },
    companyAddr: { color: '#93c5fd', fontSize: '7.5px', marginTop: '2px' },
    contactBox: { textAlign: 'right', color: '#bfdbfe', fontSize: '7.5px', lineHeight: 1.6 },
    strip: { background: '#fbbf24', padding: '4px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a' },
    stripTitle: { fontWeight: 900, fontSize: '10px', color: '#1e3a8a' },
    stripBiltyNo: { fontWeight: 900, fontSize: '16px', color: '#1e3a8a' },
    stripDate: { fontWeight: 700, fontSize: '9px', color: '#1e3a8a' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #1e3a8a' },
    infoCol: { padding: '6px 10px' },
    infoColTitle: { fontWeight: 800, fontSize: '7.5px', color: '#fff', background: '#1e3a8a', display: 'inline-block', padding: '2px 7px', borderRadius: '3px', marginBottom: '4px', textTransform: 'uppercase' },
    infoRow: { display: 'flex', gap: '4px', marginBottom: '2.5px', fontSize: '9px' },
    infoKey: { fontWeight: 700, color: '#1e3a8a', minWidth: '88px', flexShrink: 0 },
    infoVal: { fontWeight: 600, color: '#111' },
    tbl: { width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' },
    th: { background: '#1e3a8a', color: '#fff', padding: '4px 7px', fontWeight: 700, textAlign: 'left' },
    thR: { background: '#1e3a8a', color: '#fff', padding: '4px 7px', fontWeight: 700, textAlign: 'right' },
    thC: { background: '#1e3a8a', color: '#fff', padding: '4px 7px', fontWeight: 700, textAlign: 'center' },
    td: { padding: '3px 7px', borderBottom: '1px solid #e2e8f0', color: '#111' },
    tdR: { padding: '3px 7px', borderBottom: '1px solid #e2e8f0', color: '#111', textAlign: 'right' },
    tdC: { padding: '3px 7px', borderBottom: '1px solid #e2e8f0', color: '#111', textAlign: 'center' },
    totalRow: { background: '#eff6ff' },
    totalTd: { padding: '4px 7px', fontWeight: 900, color: '#1e3a8a', borderTop: '2px solid #1e3a8a' },
    chargeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1e3a8a' },
    chargeCol: { padding: '6px 10px', borderRight: '2px solid #1e3a8a' },
    chargeColR: { padding: '6px 10px' },
    chargeTitle: { fontSize: '7.5px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '3px' },
    chargeRow: { display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', marginBottom: '2px' },
    totalBox: { display: 'flex', justifyContent: 'space-between', padding: '4px 7px', background: '#1e40af', borderRadius: '4px', marginTop: '3px' },
    totalLabel: { fontWeight: 800, color: '#fff', fontSize: '9px' },
    totalAmt: { fontWeight: 900, color: '#fbbf24', fontSize: '11px' },
    badge: { display: 'inline-block', background: '#fbbf24', padding: '3px 10px', borderRadius: '4px', fontWeight: 800, fontSize: '10px', color: '#1e3a8a' },
    sigGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '6px 10px', gap: '10px', borderTop: '2px solid #1e3a8a' },
    sigBox: { textAlign: 'center' },
    sigLine: { borderTop: '1px solid #94a3b8', paddingTop: '3px', marginTop: '20px', fontSize: '7px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  };

  return (
    <div style={s.wrap}>

      {/* ── Company Header ── */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={s.logo}><span style={s.logoText}>SPD</span></div>
          <div>
            <div style={s.companyName}>SUPER PAK DATA GOODS WALE</div>
            <div style={s.companySubtitle}>TRANSPORT COMPANY</div>
            <div style={s.companyAddr}>Gate No 1, New Truck Stand, Hawksbay, Karachi</div>
          </div>
        </div>
        <div style={s.contactBox}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '8px' }}>Karachi: 0300-2024433 | 0321-2024433</div>
          <div>0312-2024433 | 021-32351333</div>
          <div style={{ color: '#93c5fd' }}>superpakdatawale@gmail.com</div>
          <div style={{ color: '#93c5fd' }}>Lahore: Saggian Pull, Hazrat Ali Road</div>
        </div>
      </div>

      {/* ── Bilty Number Strip ── */}
      <div style={s.strip}>
        <span style={s.stripTitle}>BILTY / CONSIGNMENT NOTE</span>
        <span style={s.stripBiltyNo}>#{bilty.bilty_no}</span>
        <span style={s.stripDate}>Date: {biltyDate}</span>
      </div>

      {/* ── Sender & Receiver ── */}
      <div style={s.infoGrid}>
        <div style={{ ...s.infoCol, borderRight: '2px solid #1e3a8a' }}>
          <div style={s.infoColTitle}>📤 Sender Information</div>
          <div style={s.infoRow}><span style={s.infoKey}>Sender Name:</span><span style={s.infoVal}>{bilty.sender_phone || '—'}</span></div>
          <div style={s.infoRow}><span style={s.infoKey}>Loading Points:</span><span style={s.infoVal}>{bilty.sender_name || '—'}</span></div>
          <div style={s.infoRow}><span style={s.infoKey}>From:</span><span style={s.infoVal}>{bilty.from_city || bilty.route_from || '—'}</span></div>
          {bilty.lcl_number && <div style={s.infoRow}><span style={s.infoKey}>Mobile:</span><span style={s.infoVal}>{bilty.lcl_number}</span></div>}
        </div>
        <div style={s.infoCol}>
          <div style={s.infoColTitle}>📥 Receiver Information</div>
          <div style={s.infoRow}><span style={s.infoKey}>Receiver Name:</span><span style={s.infoVal}>{bilty.receiver_name || '—'}</span></div>
          <div style={s.infoRow}><span style={s.infoKey}>Destination:</span><span style={s.infoVal}>{bilty.to_city || bilty.route_to || '—'}</span></div>
          {bilty.container_number && <div style={s.infoRow}><span style={s.infoKey}>Container No:</span><span style={s.infoVal}>{bilty.container_number}</span></div>}
          <div style={s.infoRow}>
            <span style={s.infoKey}>Payment Type:</span>
            <span style={{ ...s.badge, fontSize: '8px', padding: '1px 6px' }}>{bilty.payment_status || '—'}</span>
          </div>
          {bilty.party_name && <div style={s.infoRow}><span style={s.infoKey}>Party:</span><span style={s.infoVal}>{bilty.party_name}</span></div>}
        </div>
      </div>

      {/* ── Goods Table ── */}
      <table style={s.tbl}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: '22px' }}>#</th>
            <th style={s.th}>Description of Goods</th>
            <th style={s.thC}>Qty</th>
            <th style={s.thC}>Weight KG</th>
            <th style={s.thC}>CBM</th>
            <th style={s.thR}>Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={s.td}>{i + 1}</td>
              <td style={{ ...s.td, fontWeight: 700 }}>{item.goodsBayan || item.goods_bayan || item.item_name || '—'}</td>
              <td style={s.tdC}>{item.quantity || '—'}</td>
              <td style={s.tdC}>{item.weight || '—'}</td>
              <td style={s.tdC}>{item.cbm || item.additional_weight || '—'}</td>
              <td style={s.tdR}>Rs {Number(item.amount || 0).toLocaleString()}</td>
            </tr>
          ))}
          <tr style={s.totalRow}>
            <td style={s.totalTd}></td>
            <td style={{ ...s.totalTd, fontWeight: 900 }}>GRAND TOTAL</td>
            <td style={{ ...s.totalTd, textAlign: 'center' }}>{bilty.total_quantity}</td>
            <td style={{ ...s.totalTd, textAlign: 'center' }}>{bilty.total_weight} KG</td>
            <td style={{ ...s.totalTd, textAlign: 'center' }}>—</td>
            <td style={{ ...s.totalTd, textAlign: 'right' }}>Rs {Number(bilty.total_amount || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Charges + Payment ── */}
      <div style={s.chargeGrid}>
        <div style={s.chargeCol}>
          <div style={s.chargeTitle}>Freight / Karaya Charges</div>
          <div style={s.chargeRow}><span>Freight (Karaya):</span><span style={{ fontWeight: 700 }}>Rs {Number(items.reduce((a, i) => a + Number(i.amount || 0), 0)).toLocaleString()}</span></div>
          <div style={s.chargeRow}><span>Local Freight:</span><span style={{ fontWeight: 700 }}>Rs {Number(bilty.local_karaya || 0).toLocaleString()}</span></div>
          {bilty.loading_charges > 0 && <div style={s.chargeRow}><span>Loading Charges:</span><span style={{ fontWeight: 700 }}>Rs {Number(bilty.loading_charges || 0).toLocaleString()}</span></div>}
          {bilty.other_expense_name && <div style={s.chargeRow}><span>{bilty.other_expense_name}:</span><span style={{ fontWeight: 700 }}>Rs {Number(bilty.other_expense_amount || 0).toLocaleString()}</span></div>}
          <div style={s.totalBox}><span style={s.totalLabel}>TOTAL FREIGHT</span><span style={s.totalAmt}>Rs {Number(bilty.total_amount || 0).toLocaleString()}</span></div>
        </div>
        <div style={s.chargeColR}>
          <div style={s.chargeTitle}>Payment Status / Tadaa</div>
          <div style={{ marginBottom: '3px' }}><span style={s.badge}>{bilty.payment_status || '—'}</span></div>
          {bilty.party_name && <div style={{ fontSize: '8px', color: '#475569', marginTop: '2px' }}>Party: <strong>{bilty.party_name}</strong></div>}
          {bilty.container_number && <div style={{ marginTop: '3px', ...s.chargeRow }}><span>Container No:</span><span style={{ fontWeight: 700 }}>{bilty.container_number}</span></div>}
        </div>
      </div>

      {/* ── Signature Footer ── */}
      <div style={s.sigGrid}>
        {["Sender's Signature", "Driver / Auth. Signature", "Receiver's Signature"].map((label, i) => (
          <div key={i} style={s.sigBox}>
            <div style={s.sigLine}>{label}</div>
          </div>
        ))}
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
    lcNumber: '',
    blNumber: '',
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
          orderNumber: '', lclNumber: '', containerNumber: '', lcNumber: '', blNumber: '',
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

        {/* Row 4: Total Freight, Container No, LC Number, BL Number, Order Number */}
        <div className="bma-form-section">
          <div className="bma-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem' }}>
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
            <div className="bma-field">
              <label className="bma-label">LC Number</label>
              <input
                type="text"
                name="lcNumber"
                value={formData.lcNumber}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">BL Number</label>
              <input
                type="text"
                name="blNumber"
                value={formData.blNumber}
                onChange={handleInputChange}
                className="bma-input"
              />
            </div>
            <div className="bma-field">
              <label className="bma-label">Order Number</label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
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
