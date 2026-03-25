import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Save, Loader2, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PartyLedger = () => {
  const [parties, setParties] = useState({});
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('party_ledger')
        .select(`
          *,
          bilties(bilty_no)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group by party_name
      const grouped = (data || []).reduce((acc, curr) => {
        if (!acc[curr.party_name]) {
          acc[curr.party_name] = { name: curr.party_name, balance: 0, transactions: [] };
        }
        // Receivable balance = Total Amount (billed) - Total Payment (received)
        acc[curr.party_name].balance += (Number(curr.amount || 0) - Number(curr.payment_amount || 0));
        acc[curr.party_name].transactions.push(curr);
        return acc;
      }, {});

      setParties(grouped);
    } catch (err) {
      console.error('Error fetching party ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParty) return;

    setSavingPayment(true);
    try {
      const { data, error } = await supabase
        .from('party_ledger')
        .insert({
          party_name: selectedParty.name,
          payment_amount: Number(paymentForm.amount),
          payment_method: paymentForm.method,
          record_date: paymentForm.date
        })
        .select('*, bilties(bilty_no)')
        .single();
      
      if (error) throw error;

      // Update local state
      const updatedParties = { ...parties };
      updatedParties[selectedParty.name].balance -= Number(paymentForm.amount);
      updatedParties[selectedParty.name].transactions.unshift(data);
      
      setParties(updatedParties);
      setSelectedParty(updatedParties[selectedParty.name]);
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
      
    } catch (err) {
      alert("Error adding payment: " + err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const partyList = Object.values(parties).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="page-container animate-fade-in flex gap-6" style={{ alignItems: 'flex-start' }}>
      
      {/* Left List of Parties */}
      <div className="card" style={{ flex: '1 1 35%', minWidth: '350px' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Users size={20} className="text-primary"/> Accounts List
        </h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search party name..." 
            className="input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}/>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted"><Loader2 className="animate-spin mx-auto"/></div>
        ) : partyList.length === 0 ? (
          <div className="p-8 text-center text-muted border border-dashed rounded">No accounts found.</div>
        ) : (
          <div className="flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {partyList.map(p => (
              <div 
                key={p.name}
                onClick={() => { setSelectedParty(p); setShowPaymentForm(false); }}
                className="p-4 border border-border rounded-xl cursor-pointer transition-all hover:border-primary hover:shadow-sm mb-2"
                style={{ 
                  backgroundColor: selectedParty?.name === p.name ? 'var(--primary-light)' : 'var(--surface)',
                  borderColor: selectedParty?.name === p.name ? 'var(--primary)' : 'var(--border)'
                }}
              >
                <div className="font-bold flex justify-between items-center text-sm">
                  {p.name}
                  <ArrowUpRight size={14} className="text-muted" />
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-muted">Net Receivable:</span>
                  <span className="font-bold text-danger">Rs {p.balance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Party Details */}
      <div style={{ flex: '1 1 65%' }}>
        {!selectedParty ? (
          <div className="card text-center p-12 text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50 text-primary" />
            <h3 className="text-xl font-bold mb-2 text-main">No Party Selected</h3>
            <p>Select a party from the left list to view their ledger and record payments.</p>
          </div>
        ) : (
          <div className="card animate-fade-in">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedParty.name}</h2>
                <p className="text-sm text-muted">Account Ledger</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted uppercase tracking-wider font-semibold">Total Receivable</div>
                <div className="text-3xl font-bold text-danger">Rs {selectedParty.balance.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transaction History</h3>
              <button className="btn btn-primary" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                {showPaymentForm ? 'Hide Form' : <><Plus size={16}/> Record Payment</>}
              </button>
            </div>

            {showPaymentForm && (
              <form onSubmit={handlePaymentSubmit} className="mb-6 bg-primary-light p-5 rounded-xl border border-[var(--primary)] flex gap-4 items-end animate-fade-in shadow-sm">
                <div className="input-group flex-1">
                  <label className="input-label text-sm font-semibold">Date</label>
                  <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="input bg-surface" />
                </div>
                <div className="input-group flex-1">
                  <label className="input-label text-sm font-semibold">Amount Received (Rs)</label>
                  <input required type="number" min="1" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="input bg-surface" placeholder="0" />
                </div>
                <div className="input-group flex-1">
                  <label className="input-label text-sm font-semibold">Payment Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="input bg-surface">
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingPayment}>
                  {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Save Payment
                </button>
              </form>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedParty.transactions.map((t, idx) => {
                    const isPayment = Number(t.payment_amount) > 0;
                    return (
                      <tr key={t.id || idx}>
                        <td>{new Date(t.record_date).toLocaleDateString()}</td>
                        <td className="text-muted">
                          {isPayment ? `Payment Received via ${t.payment_method}` : `Bilty #${t.bilties?.bilty_no}`}
                        </td>
                        <td>
                          {isPayment ? (
                            <span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-dark)', fontWeight: 700 }}>Payment</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger-dark)', fontWeight: 700 }}>Billed</span>
                          )}
                        </td>
                        <td className="font-bold border-l" style={{ textAlign: 'right', color: isPayment ? 'var(--success)' : 'var(--danger)' }}>
                          {isPayment ? '-' : '+'} Rs {isPayment ? t.payment_amount.toLocaleString() : t.amount.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="btn btn-outline" onClick={() => window.print()}>Print Ledger</button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default PartyLedger;
