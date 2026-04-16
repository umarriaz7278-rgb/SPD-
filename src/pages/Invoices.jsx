import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Eye, ArrowLeft, Printer, CreditCard, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Invoices = () => {
  const navigate = useNavigate();
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
        invoice_id: selectedInvoice.id,
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
        invoice_id: selectedInvoice.id,
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
            @page { size: A4; margin: 8mm 8mm; }
            body * { visibility: hidden; }
            #invoice-print-area, #invoice-print-area * { visibility: visible; }
            #invoice-print-area {
              position: absolute; left: 0; top: 0; width: 100%;
              padding: 0; font-size: 9px; color: #1a1a1a;
            }
            .no-print { display: none !important; }
            .print-only { display: flex !important; }
            .print-only-block { display: block !important; }
            input {
              border: none !important; background: transparent !important;
              box-shadow: none !important; padding: 0 !important;
              font-weight: 700 !important; color: #1a1a1a !important;
            }
            input::placeholder { color: transparent !important; }
            .invoice-section { box-shadow: none !important; border: 1px solid #d1d5db !important; break-inside: avoid; margin-bottom: 6px !important; padding: 8px 10px !important; }
            .invoice-section h3 { margin-bottom: 4px !important; font-size: 8px !important; padding-bottom: 2px !important; }
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
        <div id="invoice-print-area">

        {/* ═══ PRINT HEADER ═══ */}
        <div className="print-only" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e40af', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>SPD</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e40af', lineHeight: 1.2 }}>Super Pak Data Goods Wale Transport Company</div>
              <div style={{ fontSize: '8px', color: '#475569', marginTop: '1px' }}>Gate No 1 New Truck Stand Hawksbay Karachi</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8px', color: '#475569', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '8.5px' }}>Karachi Office</div>
            <div>0300-2024433, 0321-2024433, 0312-2024433</div>
            <div>superpakdatawale@gmail.com | www.superpakdata.com</div>
          </div>
        </div>

        {/* ═══ SCREEN HEADER ═══ */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>SPD</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.2 }}>Super Pak Data Goods Wale Transport Company</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>Gate No 1 New Truck Stand Hawksbay Karachi</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '10px' }}>Karachi Office</div>
            <div>0300-2024433, 0321-2024433, 0312-2024433</div>
            <div>superpakdatawale@gmail.com | www.superpakdata.com</div>
          </div>
        </div>

        {/* Invoice Title Bar */}
        <div style={{ background: '#1e40af', color: '#fff', textAlign: 'center', padding: '4px 0', borderRadius: '4px', marginBottom: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>
          INVOICE — BILTY #{inv.bilties?.bilty_no ?? inv.bilty_id}
        </div>

        {/* ═══ 2-COLUMN MAIN GRID ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>

          {/* LEFT: Invoice Information */}
          <div className="invoice-section" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', borderBottom: '2px solid #1e40af', paddingBottom: '2px', display: 'inline-block' }}>Invoice Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {[
                { label: 'Company Name', key: 'companyName', placeholder: 'Enter company name' },
                { label: 'Description', key: 'description', placeholder: 'Enter description' },
                { label: 'Clearing Agent', key: 'clearingAgentName', placeholder: 'Clearing agent name' },
                { label: 'Container No', key: 'containerNumber', placeholder: 'Container number' },
                { label: 'LC Number', key: 'lcNumber', placeholder: 'LC number' },
                { label: 'BL Number', key: 'blNumber', placeholder: 'BL number' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', minWidth: '80px' }}>{label}:</span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={invoiceFields[key]}
                    onChange={(e) => setInvoiceFields(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ flex: 1, padding: '2px 4px', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '9px', fontWeight: 600, background: 'var(--background)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Delivery Details */}
          <div className="invoice-section" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', borderBottom: '2px solid #1e40af', paddingBottom: '2px', display: 'inline-block' }}>Delivery Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                ['Bilty No', `#${inv.bilties?.bilty_no ?? inv.bilty_id}`],
                ['Delivery Date', inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString() : '—'],
                ['Sender', inv.bilties?.sender_name || '—'],
                ['Sender Phone', inv.bilties?.sender_phone || '—'],
                ['Receiver', inv.receiver_name || '—'],
                ['Receiver Mobile', inv.receiver_phone || '—'],
                ['Receiver CNIC', inv.receiver_cnic || '—'],
                ['Qty Delivered', inv.delivered_quantity],
                ['From', inv.bilties?.from_city || '—'],
                ['To', inv.bilties?.to_city || '—'],
                ['Payment', null],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px', borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>{label}</span>
                  {label === 'Payment' ? (
                    <span style={styles.badge(inv.bilties?.payment_status)}>{inv.bilties?.payment_status || '—'}</span>
                  ) : (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#1a1a1a' }}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 2-COLUMN: Charges + Calculations ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>

          {/* LEFT: Freight & Charges */}
          <div className="invoice-section" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '8px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', borderBottom: '2px solid #1e40af', paddingBottom: '2px', display: 'inline-block' }}>Freight & Additional Charges</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e40af' }}>
                  <th style={{ padding: '3px 6px', fontSize: '8px', fontWeight: 700, color: '#fff', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '3px 6px', fontSize: '8px', fontWeight: 700, color: '#fff', textAlign: 'right', width: '110px' }}>Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#eff6ff' }}>
                  <td style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 700, borderBottom: '1px solid #e2e8f0', color: '#1e40af' }}>Freight (Base)</td>
                  <td style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 800, borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#1e40af' }}>Rs {freight.toLocaleString()}</td>
                </tr>
                {chargeRows.map(({ label, key }, idx) => (
                  <tr key={key} style={{ background: idx % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                    <td style={{ padding: '2px 6px', fontSize: '9px', borderBottom: '1px solid #e2e8f0' }}>{label}</td>
                    <td style={{ padding: '2px 6px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={charges[key]}
                        onChange={(e) => setCharges(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{ width: '90px', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '9px', fontWeight: 600, textAlign: 'right', background: 'var(--background)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT: Calculations + Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="invoice-section" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', boxShadow: 'var(--shadow-md)' }}>
              <h3 style={{ fontSize: '8px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', borderBottom: '2px solid #1e40af', paddingBottom: '2px', display: 'inline-block' }}>Calculations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>Gross (Without Tax)</span>
                  <span style={{ fontSize: '10px', fontWeight: 800 }}>Rs {grossWithoutTax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>Tax (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    style={{ width: '70px', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '9px', fontWeight: 600, textAlign: 'right', background: 'var(--background)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>Tax Amount</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706' }}>Rs {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', marginTop: '4px', background: '#1e40af', borderRadius: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>Total Amount</span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Rs {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer / Signature */}
            <div style={{ borderTop: '2px solid #1e40af', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', marginBottom: '2px' }}>Lahore Office</div>
                  <div style={{ fontSize: '8px', color: '#475569', lineHeight: 1.4 }}>Super Pak Data Wale Goods Transport Co.<br />Saggian Pull, Hazrat Ali Road, Lahore</div>
                </div>
                <div style={{ width: '140px', textAlign: 'center' }}>
                  <div style={{ borderBottom: '2px solid #1a1a1a', height: '28px', marginBottom: '3px' }}></div>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#475569' }}>Authorized Signature</div>
                </div>
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
