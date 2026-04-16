import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Eye, ArrowLeft, Printer, CreditCard, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Invoices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState('');
  const [cashPayment, setCashPayment] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '' });
  const [cashSaving, setCashSaving] = useState(false);

  // Additional charges state
  const [charges, setCharges] = useState({
    containerCharges: '',
    karachiLocalCharges: '',
    lahoreLocalCharges: '',
    laborCharges: '',
    godownCharges: '',
    otherCharges: '',
  });
  const [taxPercent, setTaxPercent] = useState('');

  // Invoice extra fields
  const [invoiceFields, setInvoiceFields] = useState({
    companyName: '',
    description: '',
    clearingAgentName: '',
    containerNumber: '',
    lcNumber: '',
    blNumber: '',
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Auto-open invoice when navigated from All Bookings with bilty_id
  useEffect(() => {
    const biltyId = searchParams.get('bilty_id');
    if (!biltyId) return;
    const openByBiltyId = async () => {
      try {
        // First check if a delivery log exists for this bilty
        const { data: logs } = await supabase
          .from('delivery_logs')
          .select('id, bilty_id, receiver_name, receiver_phone, receiver_cnic, delivered_quantity, delivery_date, bilties(bilty_no, sender_name, sender_phone, total_amount, payment_status, from_city, to_city)')
          .eq('bilty_id', biltyId)
          .limit(1);
        if (logs && logs.length > 0) {
          handleOpenInvoice(logs[0]);
          return;
        }
        // No delivery log — build synthetic invoice from bilty
        const { data: bilty } = await supabase.from('bilties').select('*').eq('id', biltyId).single();
        if (bilty) {
          handleOpenInvoice({
            id: 'bilty_' + bilty.id,
            bilty_id: bilty.id,
            receiver_name: bilty.receiver_name || '',
            receiver_phone: bilty.receiver_phone || '',
            receiver_cnic: '',
            delivered_quantity: bilty.total_quantity || 0,
            delivery_date: bilty.bilty_date,
            bilties: {
              bilty_no: bilty.bilty_no,
              sender_name: bilty.sender_name,
              sender_phone: bilty.sender_phone,
              total_amount: bilty.total_amount,
              payment_status: bilty.payment_status,
              from_city: bilty.from_city,
              to_city: bilty.to_city,
            }
          });
        }
      } catch (err) {
        console.error('Error opening invoice by bilty id:', err);
      }
    };
    openByBiltyId();
  }, [searchParams]);

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

  const handleOpenInvoice = (inv) => {
    setSelectedInvoice(inv);
    // Load previously saved charges from localStorage
    const saved = localStorage.getItem('invoice_charges_' + inv.id);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCharges(parsed.charges || { containerCharges: '', karachiLocalCharges: '', lahoreLocalCharges: '', laborCharges: '', godownCharges: '', otherCharges: '' });
      setTaxPercent(parsed.taxPercent || '');
      setInvoiceFields(parsed.invoiceFields || { companyName: '', description: '', clearingAgentName: '', containerNumber: '', lcNumber: '', blNumber: '' });
    } else {
      setCharges({ containerCharges: '', karachiLocalCharges: '', lahoreLocalCharges: '', laborCharges: '', godownCharges: '', otherCharges: '' });
      setTaxPercent('');
      setInvoiceFields({ companyName: '', description: '', clearingAgentName: '', containerNumber: '', lcNumber: '', blNumber: '' });
    }
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
  };

  const handleSaveInvoice = () => {
    localStorage.setItem('invoice_charges_' + selectedInvoice.id, JSON.stringify({ charges, taxPercent, invoiceFields }));
    alert('Invoice saved successfully!');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDeleteInvoice = async (inv) => {
    if (!window.confirm(`Are you sure you want to delete the invoice for Bilty #${inv.bilties?.bilty_no ?? inv.bilty_id}?`)) return;
    try {
      const { error } = await supabase.from('delivery_logs').delete().eq('id', inv.id);
      if (error) throw error;
      setInvoices(prev => prev.filter(i => i.id !== inv.id));
      localStorage.removeItem('invoice_charges_' + inv.id);
    } catch (err) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  const handlePaymentOption = (option) => {
    setShowPaymentMenu(false);
    if (option === 'party') {
      // Save invoice+totalAmount to localStorage for Party Accounts to pick up
      const saved = localStorage.getItem('invoice_charges_' + selectedInvoice.id);
      const parsed = saved ? JSON.parse(saved) : { charges: {}, taxPercent: '' };
      const freight = Number(selectedInvoice.bilties?.total_amount || 0);
      const totalAdditionalAmt = Object.values(parsed.charges || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      const grossAmt = freight + totalAdditionalAmt;
      const taxAmt = grossAmt * (Number(parsed.taxPercent) || 0) / 100;
      const total = grossAmt + taxAmt;
      localStorage.setItem('pending_invoice_link', JSON.stringify({
        invoice_id: String(selectedInvoice.id).startsWith('bilty_') ? null : selectedInvoice.id,
        bilty_no: selectedInvoice.bilties?.bilty_no ?? selectedInvoice.bilty_id,
        receiver_name: selectedInvoice.receiver_name,
        delivery_date: selectedInvoice.delivery_date,
        total_amount: total,
      }));
      navigate('/party-accounts');
    } else {
      setCashType(option === 'lahore' ? 'Cash Received Lahore' : 'Cash Received Karachi');
      setCashPayment({ date: new Date().toISOString().split('T')[0], description: '', amount: String(totalAmount.toFixed(2)) });
      setShowCashModal(true);
    }
  };

  const handleCashSave = async () => {
    if (!cashPayment.amount || Number(cashPayment.amount) <= 0) { alert('Enter a valid amount.'); return; }
    setCashSaving(true);
    try {
      const { error } = await supabase.from('party_ledger_entries').insert({
        party_id: null,
        date: cashPayment.date,
        description: cashPayment.description || `${cashType} - Bilty #${selectedInvoice.bilties?.bilty_no ?? selectedInvoice.bilty_id}`,
        entry_type: 'credit',
        amount: Number(cashPayment.amount),
        invoice_id: String(selectedInvoice.id).startsWith('bilty_') ? null : selectedInvoice.id,
        payment_type: cashType,
      });
      if (error) throw error;
      alert(`${cashType} recorded successfully!`);
      setShowCashModal(false);
    } catch (err) {
      alert('Error saving payment: ' + err.message);
    } finally {
      setCashSaving(false);
    }
  };

  // Auto calculations
  const freight = Number(selectedInvoice?.bilties?.total_amount || 0);
  const totalAdditional = Object.values(charges).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grossWithoutTax = freight + totalAdditional;
  const taxAmount = grossWithoutTax * (Number(taxPercent) || 0) / 100;
  const totalAmount = grossWithoutTax + taxAmount;

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
    empty: { textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  };

  // ── Full-page Invoice View ──
  if (selectedInvoice) {
    const inv = selectedInvoice;
    const chargeRows = [
      { label: 'Container Charges', key: 'containerCharges' },
      { label: 'Karachi Local Charges', key: 'karachiLocalCharges' },
      { label: 'Lahore Local Charges', key: 'lahoreLocalCharges' },
      { label: 'Labor Charges', key: 'laborCharges' },
      { label: 'Godown Charges', key: 'godownCharges' },
      { label: 'Other Charges', key: 'otherCharges' },
    ];

    return (
      <div style={{ padding: '0.75rem 1rem', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', height: '100%' }}>
        {/* Print-only styles */}
        <style>{`
          @media print {
            @page { size: A4; margin: 10mm 12mm; }
            body * { visibility: hidden !important; }
            #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
            #invoice-print-area {
              position: fixed !important;
              left: 0 !important; top: 0 !important;
              width: 100% !important;
              background: #fff !important;
              font-family: 'Arial', sans-serif !important;
              color: #1a1a2e !important;
            }
            .no-print { display: none !important; }
            .print-only { display: flex !important; }
            .print-hide { display: none !important; }
            input {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 2px !important;
              font-weight: 700 !important;
              color: #1a1a2e !important;
              -webkit-print-color-adjust: exact !important;
            }
            input::placeholder { color: #aaa !important; }
            .inv-section { break-inside: avoid !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}</style>

        {/* Header — hidden on print */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <button
            onClick={handleCloseInvoice}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} /> Invoice — Bilty #{inv.bilties?.bilty_no ?? inv.bilty_id}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSaveInvoice} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--success)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
              💾 Save
            </button>
            <button onClick={handlePrintInvoice} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
              <Printer size={13} /> Print
            </button>
            {/* Payment Received */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowPaymentMenu(prev => !prev)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-md)', border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                <CreditCard size={13} /> Payment ▾
              </button>
              {showPaymentMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', minWidth: '210px', zIndex: 50 }}>
                  <button onClick={() => handlePaymentOption('lahore')} style={{ display: 'block', width: '100%', padding: '0.6rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)', borderBottom: '1px solid var(--border)' }}>💵 Cash Received Lahore</button>
                  <button onClick={() => handlePaymentOption('karachi')} style={{ display: 'block', width: '100%', padding: '0.6rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)', borderBottom: '1px solid var(--border)' }}>💵 Cash Received Karachi</button>
                  <button onClick={() => handlePaymentOption('party')} style={{ display: 'block', width: '100%', padding: '0.6rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}>👤 Go to Party Accounts</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Printable area */}
        <div id="invoice-print-area" style={{ fontFamily: "'Arial', sans-serif", color: '#1a1a2e', background: '#fff', maxWidth: '780px', margin: '0 auto' }}>

          {/* ═══ COMPANY HEADER ═══ */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)', borderRadius: '10px 10px 0 0', padding: '18px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
            {/* Left: Logo + Company Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '56px', height: '56px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', flexShrink: 0 }}>
                <span style={{ color: '#1e3a8a', fontWeight: 900, fontSize: '16px', letterSpacing: '1px' }}>SPD</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '0.5px' }}>SUPER PAK DATA GOODS WALE</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#bfdbfe', marginTop: '2px', letterSpacing: '0.5px' }}>TRANSPORT COMPANY</div>
                <div style={{ fontSize: '9px', color: '#93c5fd', marginTop: '3px' }}>Gate No 1, New Truck Stand, Hawksbay, Karachi</div>
              </div>
            </div>
            {/* Right: Contact */}
            <div style={{ textAlign: 'right', color: '#bfdbfe', fontSize: '9px', lineHeight: 1.7 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '10px', marginBottom: '2px' }}>📞 Karachi Office</div>
              <div>0300-2024433 | 0321-2024433</div>
              <div>0312-2024433 | 021-32351333</div>
              <div style={{ marginTop: '3px', color: '#93c5fd' }}>✉ superpakdatawale@gmail.com</div>
              <div style={{ color: '#93c5fd' }}>🌐 www.superpakdata.com</div>
            </div>
          </div>

          {/* Lahore Office strip */}
          <div style={{ background: '#1e40af', padding: '5px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#bfdbfe' }}>
            <span>📍 <strong style={{ color: '#fff' }}>Lahore Office:</strong> Saggian Pull, Hazrat Ali Road, Lahore</span>
            <span>📞 0300-4440404 | 0321-4440404</span>
          </div>

          {/* INVOICE Title ribbon */}
          <div style={{ background: '#0f172a', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px', letterSpacing: '3px' }}>INVOICE</span>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '13px' }}>Bilty # {inv.bilties?.bilty_no ?? inv.bilty_id}</span>
            <span style={{ color: '#93c5fd', fontSize: '10px' }}>Date: {inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* ═══ INVOICE FIELDS + DELIVERY INFO (2 columns) ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderLeft: '3px solid #1e40af', borderRight: '3px solid #1e40af' }}>

            {/* LEFT: Invoice Information */}
            <div className="inv-section" style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #1e40af' }}>📋 Invoice Information</div>
              {[
                { label: 'Company Name', key: 'companyName', placeholder: 'Enter company name' },
                { label: 'Description', key: 'description', placeholder: 'Enter description' },
                { label: 'Clearing Agent', key: 'clearingAgentName', placeholder: 'Clearing agent name' },
                { label: 'Container No', key: 'containerNumber', placeholder: 'Container number' },
                { label: 'LC Number', key: 'lcNumber', placeholder: 'LC number' },
                { label: 'BL Number', key: 'blNumber', placeholder: 'BL number' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '3px 0', borderBottom: '1px dashed #e2e8f0' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', minWidth: '90px' }}>{label}:</span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={invoiceFields[key]}
                    onChange={(e) => setInvoiceFields(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ flex: 1, padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '9px', fontWeight: 700, background: '#f8fafc', color: '#1a1a2e', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            {/* RIGHT: Delivery Details */}
            <div className="inv-section" style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #1e40af' }}>🚚 Delivery Details</div>
              {[
                ['Bilty No', `#${inv.bilties?.bilty_no ?? inv.bilty_id}`],
                ['Delivery Date', inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString('en-PK') : '—'],
                ['From → To', `${inv.bilties?.from_city || '—'} → ${inv.bilties?.to_city || '—'}`],
                ['Sender', inv.bilties?.sender_name || '—'],
                ['Sender Phone', inv.bilties?.sender_phone || '—'],
                ['Receiver', inv.receiver_name || '—'],
                ['Receiver Mobile', inv.receiver_phone || '—'],
                ['Receiver CNIC', inv.receiver_cnic || '—'],
                ['Qty Delivered', inv.delivered_quantity],
                ['Payment Mode', null],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px', borderBottom: '1px dashed #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>{label}</span>
                  {label === 'Payment Mode' ? (
                    <span style={{ fontSize: '8px', background: '#1e40af', color: '#fff', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>{inv.bilties?.payment_status || '—'}</span>
                  ) : (
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#1a1a2e' }}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ═══ CHARGES TABLE + CALCULATIONS (2 columns) ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0', borderLeft: '3px solid #1e40af', borderRight: '3px solid #1e40af' }}>

            {/* LEFT: Freight & Charges */}
            <div className="inv-section" style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #1e40af' }}>💰 Freight & Charges</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    <th style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, color: '#fff', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, color: '#fff', textAlign: 'right', width: '120px' }}>Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#eff6ff' }}>
                    <td style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 800, borderBottom: '1px solid #e2e8f0', color: '#1e40af' }}>Freight / Karaya (Base)</td>
                    <td style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#1e40af' }}>Rs {freight.toLocaleString()}</td>
                  </tr>
                  {chargeRows.map(({ label, key }, idx) => (
                    <tr key={key} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '3px 8px', fontSize: '9px', borderBottom: '1px solid #e2e8f0', color: '#374151' }}>{label}</td>
                      <td style={{ padding: '3px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={charges[key]}
                          onChange={(e) => setCharges(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ width: '90px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '9px', fontWeight: 700, textAlign: 'right', background: '#f8fafc', color: '#1a1a2e', outline: 'none' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RIGHT: Calculations */}
            <div className="inv-section" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #1e40af' }}>🧮 Calculations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>Gross (Without Tax)</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#1a1a2e' }}>Rs {grossWithoutTax.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>Tax (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      style={{ width: '65px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '9px', fontWeight: 700, textAlign: 'right', background: '#fff', color: '#1a1a2e', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#fffbeb', borderRadius: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>Tax Amount</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#d97706' }}>Rs {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', borderRadius: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>TOTAL AMOUNT</span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24' }}>Rs {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Signature block */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px', textAlign: 'center' }}>
                  <div style={{ height: '30px' }}></div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>Authorized Signature & Stamp</div>
                </div>
              </div>
            </div>
          </div>



        </div> {/* end invoice-print-area */}
        {/* Cash Payment Modal */}
        {showCashModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '1rem', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}><CreditCard size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />{cashType}</h3>
                <button onClick={() => setShowCashModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Date</label>
                  <input type="date" value={cashPayment.date} onChange={e => setCashPayment(p => ({ ...p, date: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--background)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Description</label>
                  <input type="text" value={cashPayment.description} onChange={e => setCashPayment(p => ({ ...p, description: e.target.value }))} placeholder="Optional note..." style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--background)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Amount (Rs)</label>
                  <input type="number" value={cashPayment.amount} onChange={e => setCashPayment(p => ({ ...p, amount: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--background)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => setShowCashModal(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button onClick={handleCashSave} disabled={cashSaving} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: cashSaving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                  {cashSaving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Invoices List ──
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
                    <td style={{ ...styles.td, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button style={styles.viewBtn} onClick={() => handleOpenInvoice(inv)}>
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv)}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fee2e2', color: '#dc2626', transition: 'background 0.2s' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
