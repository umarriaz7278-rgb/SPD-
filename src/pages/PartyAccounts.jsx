import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Loader2, X, ArrowLeft, CreditCard, BookOpen, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── Shared style helpers ── */
const th = { padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--surface)', whiteSpace: 'nowrap' };
const tdS = { padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
const iStyle = { width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--background)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' };
const lStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const bPrimary = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' };
const bOutline = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' };

const PartyAccounts = () => {
  /* ── List state ── */
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    party_name: '',
    contact_person: '',
    mobile_number: '',
    cnic: '',
    address: '',
  });
  const [formError, setFormError] = useState('');

  /* ── Ledger state ── */
  const [selectedParty, setSelectedParty] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  /* ── Receive Payment modal ── */
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payment, setPayment] = useState({ date: new Date().toISOString().split('T')[0], description: '', payment_type: 'Cash', amount: '' });
  const [paymentSaving, setPaymentSaving] = useState(false);

  /* ── Opening Balance modal ── */
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingSaving, setOpeningSaving] = useState(false);

  /* ── Pending invoice from Invoices page ── */
  const [pendingInvoice, setPendingInvoice] = useState(null);

  useEffect(() => {
    fetchParties();
    const pending = localStorage.getItem('pending_invoice_link');
    if (pending) setPendingInvoice(JSON.parse(pending));
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('party_accounts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      console.error('Error fetching parties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.party_name.trim()) { setFormError('Party Name is required.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('party_accounts').insert({
        party_name: form.party_name.trim(), contact_person: form.contact_person.trim(),
        mobile_number: form.mobile_number.trim(), cnic: form.cnic.trim(), address: form.address.trim(),
      });
      if (error) throw error;
      setForm({ party_name: '', contact_person: '', mobile_number: '', cnic: '', address: '' });
      setShowForm(false);
      fetchParties();
    } catch (err) {
      setFormError('Error saving party: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Ledger functions ── */
  const openLedger = async (party) => {
    setSelectedParty(party);
    await fetchLedger(party.id);
    if (pendingInvoice) await linkInvoiceToParty(party, pendingInvoice);
  };

  const fetchLedger = async (partyId) => {
    setLedgerLoading(true);
    try {
      const { data, error } = await supabase.from('party_ledger_entries').select('*')
        .eq('party_id', partyId).order('date', { ascending: true }).order('created_at', { ascending: true });
      if (error) throw error;
      setLedgerEntries(data || []);
    } catch (err) { console.error(err); } finally { setLedgerLoading(false); }
  };

  const linkInvoiceToParty = async (party, inv) => {
    try {
      const { data: existing } = await supabase.from('party_ledger_entries').select('id')
        .eq('party_id', party.id).eq('invoice_id', inv.invoice_id);
      if (existing && existing.length > 0) {
        alert('This invoice is already linked to ' + party.party_name);
        localStorage.removeItem('pending_invoice_link'); setPendingInvoice(null); return;
      }
      const { error } = await supabase.from('party_ledger_entries').insert({
        party_id: party.id,
        date: inv.delivery_date || new Date().toISOString().split('T')[0],
        description: `Invoice - Bilty #${inv.bilty_no} | ${inv.receiver_name}`,
        entry_type: 'debit', amount: Number(inv.total_amount), invoice_id: inv.invoice_id, payment_type: null,
      });
      if (error) throw error;
      alert(`Invoice #${inv.bilty_no} linked to ${party.party_name}!`);
      localStorage.removeItem('pending_invoice_link'); setPendingInvoice(null);
      await fetchLedger(party.id);
    } catch (err) { alert('Error linking invoice: ' + err.message); }
  };

  const handleSaveOpening = async () => {
    if (!openingAmount || Number(openingAmount) < 0) { alert('Enter a valid amount.'); return; }
    setOpeningSaving(true);
    try {
      const { error } = await supabase.from('party_ledger_entries').insert({
        party_id: selectedParty.id, date: new Date().toISOString().split('T')[0],
        description: 'Opening Balance', entry_type: 'opening_balance', amount: Number(openingAmount), invoice_id: null, payment_type: null,
      });
      if (error) throw error;
      setShowOpeningModal(false); setOpeningAmount(''); await fetchLedger(selectedParty.id);
    } catch (err) { alert('Error: ' + err.message); } finally { setOpeningSaving(false); }
  };

  const handleReceivePayment = async () => {
    if (!payment.amount || Number(payment.amount) <= 0) { alert('Enter a valid amount.'); return; }
    setPaymentSaving(true);
    try {
      const { error } = await supabase.from('party_ledger_entries').insert({
        party_id: selectedParty.id, date: payment.date,
        description: payment.description || 'Payment Received', entry_type: 'credit',
        amount: Number(payment.amount), invoice_id: null, payment_type: payment.payment_type,
      });
      if (error) throw error;
      setShowPaymentModal(false);
      setPayment({ date: new Date().toISOString().split('T')[0], description: '', payment_type: 'Cash', amount: '' });
      await fetchLedger(selectedParty.id);
    } catch (err) { alert('Error: ' + err.message); } finally { setPaymentSaving(false); }
  };

  /* ── Calculations ── */
  const totalDebit = ledgerEntries.filter(e => e.entry_type === 'debit').reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit = ledgerEntries.filter(e => e.entry_type === 'credit').reduce((s, e) => s + Number(e.amount), 0);
  const openingBal = ledgerEntries.filter(e => e.entry_type === 'opening_balance').reduce((s, e) => s + Number(e.amount), 0);
  const balance = openingBal + totalDebit - totalCredit;

  /* ══════════════ LEDGER VIEW ══════════════ */
  if (selectedParty) {
    let runningBalance = 0;
    const rows = ledgerEntries.map(entry => {
      if (entry.entry_type === 'opening_balance' || entry.entry_type === 'debit') runningBalance += Number(entry.amount);
      else if (entry.entry_type === 'credit') runningBalance -= Number(entry.amount);
      return { ...entry, running: runningBalance };
    });

    return (
      <div style={{ padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' }}>
        {/* Ledger Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setSelectedParty(null)} style={bOutline}><ArrowLeft size={16} /> Back</button>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={22} color="var(--primary)" /> {selectedParty.party_name}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {selectedParty.mobile_number || ''}{selectedParty.contact_person ? ` • ${selectedParty.contact_person}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowOpeningModal(true)} style={{ ...bOutline, color: 'var(--primary)', borderColor: 'var(--primary)' }}>
              <PlusCircle size={15} /> Opening Balance
            </button>
            <button onClick={() => setShowPaymentModal(true)} style={{ ...bPrimary, background: '#7c3aed' }}>
              <CreditCard size={15} /> Receive Payment
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Opening Balance', value: openingBal, color: 'var(--text-muted)' },
            { label: 'Total Debit (Receivable)', value: totalDebit, color: '#dc2626' },
            { label: 'Total Received', value: totalCredit, color: 'var(--success)' },
            { label: 'Outstanding Balance', value: balance, color: balance > 0 ? '#dc2626' : 'var(--success)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-md)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{label}</p>
              <p style={{ fontSize: '1.15rem', fontWeight: 900, color }}>Rs {Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        {/* Ledger Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          {ledgerLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={26} className="animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No entries yet. Add opening balance or link an invoice.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Date</th>
                    <th style={th}>Description</th>
                    <th style={th}>Type</th>
                    <th style={{ ...th, textAlign: 'right' }}>Debit (Rs)</th>
                    <th style={{ ...th, textAlign: 'right' }}>Credit (Rs)</th>
                    <th style={{ ...th, textAlign: 'right' }}>Balance (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry, idx) => (
                    <tr key={entry.id}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      style={{ transition: 'background 0.15s' }}>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={tdS}>{entry.date ? new Date(entry.date).toLocaleDateString() : '—'}</td>
                      <td style={tdS}>
                        <span style={{ fontWeight: 600 }}>{entry.description}</span>
                        {entry.payment_type && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{entry.payment_type}</span>}
                      </td>
                      <td style={tdS}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: entry.entry_type === 'credit' ? '#dcfce7' : entry.entry_type === 'opening_balance' ? '#e0e7ff' : '#fee2e2', color: entry.entry_type === 'credit' ? '#166534' : entry.entry_type === 'opening_balance' ? '#3730a3' : '#991b1b' }}>
                          {entry.entry_type === 'opening_balance' ? 'Opening' : entry.entry_type === 'debit' ? 'Debit' : 'Credit'}
                        </span>
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                        {(entry.entry_type === 'debit' || entry.entry_type === 'opening_balance') ? `Rs ${Number(entry.amount).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>
                        {entry.entry_type === 'credit' ? `Rs ${Number(entry.amount).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', fontWeight: 800, color: entry.running > 0 ? '#dc2626' : 'var(--success)' }}>
                        Rs {Math.abs(entry.running).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--primary-light)' }}>
                    <td colSpan={4} style={{ ...tdS, fontWeight: 800, color: 'var(--primary)' }}>TOTAL OUTSTANDING</td>
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>Rs {(openingBal + totalDebit).toLocaleString()}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>Rs {totalCredit.toLocaleString()}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: balance > 0 ? '#dc2626' : 'var(--success)' }}>
                      Rs {Math.abs(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Opening Balance Modal */}
        {showOpeningModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '360px', margin: '1rem', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>Set Opening Balance</h3>
                <button onClick={() => setShowOpeningModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <label style={lStyle}>Amount (Rs)</label>
              <input type="number" min="0" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} style={iStyle} placeholder="0" />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => setShowOpeningModal(false)} style={{ ...bOutline, flex: 1 }}>Cancel</button>
                <button onClick={handleSaveOpening} disabled={openingSaving} style={{ ...bPrimary, flex: 1, justifyContent: 'center' }}>
                  {openingSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receive Payment Modal */}
        {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '1rem', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>
                  <CreditCard size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Receive Payment
                </h3>
                <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div><label style={lStyle}>Date</label><input type="date" value={payment.date} onChange={e => setPayment(p => ({ ...p, date: e.target.value }))} style={iStyle} /></div>
                <div><label style={lStyle}>Description</label><input type="text" value={payment.description} onChange={e => setPayment(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Cash received against invoice..." style={iStyle} /></div>
                <div>
                  <label style={lStyle}>Payment Type</label>
                  <select value={payment.payment_type} onChange={e => setPayment(p => ({ ...p, payment_type: e.target.value }))} style={iStyle}>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Cash Lahore</option>
                    <option>Cash Karachi</option>
                  </select>
                </div>
                <div><label style={lStyle}>Amount (Rs)</label><input type="number" min="0" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} style={iStyle} placeholder="0" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => setShowPaymentModal(false)} style={{ ...bOutline, flex: 1 }}>Cancel</button>
                <button onClick={handleReceivePayment} disabled={paymentSaving} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: paymentSaving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                  {paymentSaving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════ PARTY LIST VIEW ══════════════ */
  return (
    <div style={{ padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <Users size={26} color="var(--primary)" /> Party Accounts
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {pendingInvoice
              ? <span style={{ color: '#d97706', fontWeight: 700 }}>⚡ Select a party to link Invoice #<strong>{pendingInvoice.bilty_no}</strong> (Rs {Number(pendingInvoice.total_amount).toLocaleString()})</span>
              : 'Manage your customers and business parties.'}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(''); }} style={bPrimary}>
          <UserPlus size={16} /> Add Party
        </button>
      </div>

      {/* Add Party Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '500px', margin: '1rem', boxShadow: 'var(--shadow-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> Add New Party
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div><label style={lStyle}>Party Name *</label><input style={iStyle} name="party_name" value={form.party_name} onChange={handleChange} placeholder="e.g. Al-Hamid Traders" /></div>
              <div><label style={lStyle}>Contact Person Name</label><input style={iStyle} name="contact_person" value={form.contact_person} onChange={handleChange} placeholder="e.g. Muhammad Hamid" /></div>
              <div><label style={lStyle}>Mobile Number</label><input style={iStyle} name="mobile_number" value={form.mobile_number} onChange={handleChange} placeholder="e.g. 03001234567" /></div>
              <div><label style={lStyle}>CNIC / ID Number</label><input style={iStyle} name="cnic" value={form.cnic} onChange={handleChange} placeholder="e.g. 42101-1234567-1" /></div>
              <div><label style={lStyle}>Address</label><textarea style={{ ...iStyle, resize: 'vertical', minHeight: '70px' }} name="address" value={form.address} onChange={handleChange} placeholder="Full address..." /></div>
              {formError && <p style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, margin: 0 }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...bOutline, flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...bPrimary, flex: 1, justifyContent: 'center' }}>
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parties Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={28} className="animate-spin" /></div>
        ) : parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No parties added yet. Click "Add Party" to get started.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Party Name</th>
                  <th style={th}>Contact Person</th>
                  <th style={th}>Mobile Number</th>
                  <th style={th}>CNIC</th>
                  <th style={th}>Address</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party, idx) => (
                  <tr key={party.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.15s' }}>
                    <td style={{ ...tdS, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ ...tdS, fontWeight: 800, color: 'var(--primary)' }}>{party.party_name}</td>
                    <td style={tdS}>{party.contact_person || '—'}</td>
                    <td style={tdS}>{party.mobile_number || '—'}</td>
                    <td style={tdS}>{party.cnic || '—'}</td>
                    <td style={{ ...tdS, maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.address || '—'}</td>
                    <td style={tdS}>
                      <button
                        onClick={() => openLedger(party)}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: pendingInvoice ? '#fef3c7' : 'var(--primary-light)', color: pendingInvoice ? '#92400e' : 'var(--primary)' }}
                      >
                        <BookOpen size={13} /> {pendingInvoice ? 'Link Invoice' : 'View Ledger'}
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

export default PartyAccounts;

