import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CashLedger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Transaction Form
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('Income');
  const [formData, setFormData] = useState({
    amount: '',
    source_description: '',
    ref_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching cash ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = () => {
    return transactions.reduce((acc, curr) => {
      return curr.transaction_type === 'Income' 
        ? acc + Number(curr.amount) 
        : acc - Number(curr.amount);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cash_ledger')
        .insert({
          transaction_type: formType,
          amount: Number(formData.amount),
          source_description: formData.source_description,
          ref_id: formData.ref_id,
          record_date: formData.date
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setTransactions([data, ...transactions]);
      setShowForm(false);
      setFormData({ amount: '', source_description: '', ref_id: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('Error creating transaction: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in flex flex-col gap-6">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="text-primary"/> Cash Ledger Karachi
          </h1>
          <p className="text-muted mt-1">Manage office cash flow, daily income (Advance Fare), and general expenses.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="btn btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)', borderRadius: '10px' }} onClick={() => { setFormType('Income'); setShowForm(true); }}>
            <Plus size={16} /> Add Income
          </button>
          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', borderRadius: '10px' }} onClick={() => { setFormType('Expense'); setShowForm(true); }}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}>
          <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Current Cash Balance</div>
          <div className="text-3xl font-black">Rs {calculateBalance().toLocaleString()}</div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.2 }}>
            <Wallet size={80} />
          </div>
        </div>
        <div className="card">
          <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowUp size={16} className="text-success" /> Total Income
          </div>
          <div className="text-2xl font-bold text-success">
            Rs {transactions.filter(t => t.transaction_type === 'Income').reduce((a, b) => a + Number(b.amount), 0).toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowDown size={16} className="text-danger" /> Total Expense
          </div>
          <div className="text-2xl font-bold text-danger">
            Rs {transactions.filter(t => t.transaction_type === 'Expense').reduce((a, b) => a + Number(b.amount), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-2" style={{ borderColor: formType === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: formType === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
            Record New {formType}
          </h2>
          <form onSubmit={handleCreateTransaction} className="flex gap-4 items-end">
            <div className="input-group flex-1">
              <label className="input-label">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="input" />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Amount (Rs)</label>
              <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleInputChange} className="input" placeholder="0" />
            </div>
            <div className="input-group" style={{ flex: '2' }}>
              <label className="input-label">Description / Source</label>
              <input required type="text" name="source_description" value={formData.source_description} onChange={handleInputChange} className="input" placeholder={`e.g. ${formType === 'Income' ? 'Advance from Ali' : 'Truck Maintenance'}`} />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Ref ID (Optional)</label>
              <input type="text" name="ref_id" value={formData.ref_id} onChange={handleInputChange} className="input" placeholder="e.g. Bilty #12" />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn" style={{ backgroundColor: formType === 'Income' ? 'var(--success)' : 'var(--danger)', color: 'white' }} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16} />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Transaction History</h2>
        
        {loading ? (
          <div className="py-12 flex justify-center text-muted"><Loader2 className="animate-spin" size={32}/></div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-muted border border-dashed rounded bg-surface">No transactions recorded yet.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.record_date).toLocaleDateString()}</td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: t.transaction_type === 'Income' ? 'var(--success-light)' : 'var(--danger-light)', 
                        color: t.transaction_type === 'Income' ? 'var(--success-dark)' : 'var(--danger-dark)',
                        fontWeight: 700
                      }}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td>{t.source_description}</td>
                    <td className="text-muted">{t.ref_id || '-'}</td>
                    <td className="font-bold border-l" style={{ textAlign: 'right', color: t.transaction_type === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.transaction_type === 'Income' ? '+' : '-'} Rs {t.amount}
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

export default CashLedger;
