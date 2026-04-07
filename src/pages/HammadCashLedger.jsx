import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const HammadCashLedger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hammad_cash_ledger')
        .select('*')
        .order('record_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching Hammad cash ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const incomeItems = transactions.filter(t => t.transaction_type === 'Income');
  const expenseItems = transactions.filter(t => t.transaction_type === 'Expense');
  const totalIncome = incomeItems.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = expenseItems.reduce((s, t) => s + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const handleSubmit = async (type) => {
    if (!formData.amount || !formData.description) {
      alert('Please fill in amount and description.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('hammad_cash_ledger')
        .insert({
          transaction_type: type,
          amount: Number(formData.amount),
          description: formData.description,
          record_date: formData.date
        })
        .select()
        .single();

      if (error) throw error;
      setTransactions([data, ...transactions]);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      setShowIncomeForm(false);
      setShowExpenseForm(false);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const { error } = await supabase.from('hammad_cash_ledger').delete().eq('id', id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const styles = {
    root: { padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    title: { fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' },
    subtitle: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' },
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' },
    statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: '0.4rem' },
    splitLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    card: { background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' },
    cardHeader: { padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'var(--surface)' },
    cardTitle: { fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' },
    th: { padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--surface)' },
    td: { padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)' },
    formWrap: { padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' },
    input: { width: '100%', padding: '0.7rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s' },
    inputLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' },
    addBtn: { padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'transform 0.2s' },
    saveBtn: { padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'opacity 0.2s' },
    cancelBtn: { padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
    deleteBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', transition: 'color 0.2s' },
    empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' },
  };

  const renderForm = (type) => (
    <div style={styles.formWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={styles.inputLabel}>Date</label>
          <input type="date" style={styles.input} value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})} />
        </div>
        <div>
          <label style={styles.inputLabel}>Amount (Rs)</label>
          <input type="number" min="1" style={styles.input} placeholder="0" value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})} />
        </div>
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={styles.inputLabel}>Description</label>
        <input type="text" style={styles.input}
          placeholder={type === 'Income' ? 'e.g. Delivery Payment, To Pay Received' : 'e.g. Labour, Rent, Chai'}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button style={styles.cancelBtn} onClick={() => { setShowIncomeForm(false); setShowExpenseForm(false); }}>Cancel</button>
        <button style={{ ...styles.saveBtn, background: type === 'Income' ? '#16a34a' : '#ef4444' }}
          onClick={() => handleSubmit(type)} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {saving ? 'Saving...' : `Add ${type}`}
        </button>
      </div>
    </div>
  );

  const renderTable = (items, type) => (
    items.length === 0 ? (
      <div style={styles.empty}>No {type.toLowerCase()} entries yet.</div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
              <th style={{ ...styles.th, width: '30px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(t => (
              <tr key={t.id} style={{ transition: 'background var(--transition-normal)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{new Date(t.record_date).toLocaleDateString()}</td>
                <td style={styles.td}>{t.description}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: type === 'Income' ? '#34d399' : '#f87171' }}>
                  Rs {Number(t.amount).toLocaleString()}
                </td>
                <td style={styles.td}>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" style={{ ...styles.td, fontWeight: 700, borderTop: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                Total {type}
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, borderTop: '2px solid var(--border)', fontSize: '0.95rem', color: type === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
                Rs {(type === 'Income' ? totalIncome : totalExpense).toLocaleString()}
              </td>
              <td style={{ ...styles.td, borderTop: '2px solid var(--border)' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  );

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><Wallet size={26} color="#f59e0b" /> Hammad Cash Ledger</h1>
          <div style={styles.subtitle}>Manage Hammad income & expenses — Net balance updated automatically</div>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={18} color="#10b981" />
            </div>
            <div>
              <div style={styles.statLabel}>Total Income</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>Rs {totalIncome.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDown size={18} color="#ef4444" />
            </div>
            <div>
              <div style={styles.statLabel}>Total Expense</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>Rs {totalExpense.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#3b82f6" />
            </div>
            <div>
              <div style={{ ...styles.statLabel, color: 'rgba(255,255,255,0.7)' }}>Net Balance</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
                Rs {netBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : (
        <div style={styles.splitLayout}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardTitle, color: '#34d399' }}>
                <ArrowUp size={18} /> Income
              </div>
              <button
                style={{ ...styles.addBtn, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                onClick={() => { setShowIncomeForm(!showIncomeForm); setShowExpenseForm(false); setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] }); }}
              >
                <Plus size={14} /> Add Income
              </button>
            </div>
            {showIncomeForm && renderForm('Income')}
            {renderTable(incomeItems, 'Income')}
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardTitle, color: '#f87171' }}>
                <ArrowDown size={18} /> Expense
              </div>
              <button
                style={{ ...styles.addBtn, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                onClick={() => { setShowExpenseForm(!showExpenseForm); setShowIncomeForm(false); setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] }); }}
              >
                <Plus size={14} /> Add Expense
              </button>
            </div>
            {showExpenseForm && renderForm('Expense')}
            {renderTable(expenseItems, 'Expense')}
          </div>
        </div>
      )}
    </div>
  );
};

export default HammadCashLedger;
