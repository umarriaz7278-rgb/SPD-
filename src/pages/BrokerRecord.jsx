import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Save, Loader2, ArrowUpRight, Receipt, Wallet, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PrintBrokerStatement from '../components/PrintBrokerStatement';

const BrokerRecord = () => {
  const [brokers, setBrokers] = useState({});
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [updatingId, setUpdatingId] = useState(null); // Track which row is being updated inline

  useEffect(() => {
    fetchBrokersData();
  }, []);

  const fetchBrokersData = async () => {
    try {
      setLoading(true);
      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('*');
      
      if (brokersError) throw brokersError;

      const { data: ledgerData, error: ledgerError } = await supabase
        .from('broker_ledger')
        .select('*')
        .order('record_date', { ascending: false });

      if (ledgerError) throw ledgerError;

      // Group ledger by broker_id
      const ledgerMap = (ledgerData || []).reduce((acc, curr) => {
        if (!acc[curr.broker_id]) acc[curr.broker_id] = [];
        acc[curr.broker_id].push(curr);
        return acc;
      }, {});

      // Build broker summary
      const summary = (brokersData || []).reduce((acc, b) => {
        const transactions = ledgerMap[b.id] || [];
        const totalCommission = transactions.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0);
        const totalPayments = transactions.reduce((sum, t) => sum + Number(t.payment_amount || 0), 0);
        const balance = totalCommission - totalPayments;

        acc[b.id] = {
          ...b,
          balance,
          transactions
        };
        return acc;
      }, {});

      setBrokers(summary);
      
      // If a broker was already selected, update their data
      if (selectedBroker && summary[selectedBroker.id]) {
        setSelectedBroker(summary[selectedBroker.id]);
      }
    } catch (err) {
      console.error('Error fetching broker record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBroker) return;

    setSavingPayment(true);
    try {
      const { error } = await supabase
        .from('broker_ledger')
        .insert({
          broker_id: selectedBroker.id,
          payment_amount: Number(paymentForm.amount),
          description: paymentForm.description || 'Payment given to broker',
          record_date: paymentForm.date
        });
      
      if (error) throw error;

      await fetchBrokersData();
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      alert("Payment recorded successfully!");
      
    } catch (err) {
      alert("Error adding payment: " + err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCommissionUpdate = async (ledgerId, newAmount) => {
    if (!ledgerId) return;
    const amount = Number(newAmount);
    if (isNaN(amount)) return;

    setUpdatingId(ledgerId);
    try {
      const { error } = await supabase
        .from('broker_ledger')
        .update({ commission_amount: amount })
        .eq('id', ledgerId);
      
      if (error) throw error;
      await fetchBrokersData();
    } catch (err) {
      console.error('Error updating commission:', err);
      alert('Error updating commission: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrintStatement = () => {
    const printContent = document.querySelector('.broker-print-area');
    if (!printContent) return;

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
        <title>Broker Statement - ${selectedBroker.name}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; }
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

    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const brokerList = Object.values(brokers).filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="page-container animate-fade-in flex gap-6" style={{ alignItems: 'flex-start' }}>
      
      {/* Left List of Brokers */}
      <div className="card" style={{ flex: '1 1 30%', minWidth: '320px' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Users size={20} className="text-secondary"/> Broker Profiles
        </h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search broker..." 
            className="input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}/>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted"><Loader2 className="animate-spin mx-auto"/></div>
        ) : brokerList.length === 0 ? (
          <div className="p-8 text-center text-muted border border-dashed rounded">No brokers found.</div>
        ) : (
          <div className="flex-col gap-2 max-h-[75vh] overflow-y-auto pr-1">
            {brokerList.map(b => (
              <div 
                key={b.id}
                onClick={() => { setSelectedBroker(b); setShowPaymentForm(false); }}
                className="p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md mb-2"
                style={{ 
                  backgroundColor: selectedBroker?.id === b.id ? 'var(--secondary-light)' : 'var(--surface)',
                  borderColor: selectedBroker?.id === b.id ? 'var(--secondary)' : 'var(--border)'
                }}
              >
                <div className="font-bold flex justify-between items-center">
                  {b.name}
                  <ArrowUpRight size={14} className="text-muted" />
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-muted">Current Balance:</span>
                  <span className={`font-bold ${b.balance > 0 ? 'text-success' : b.balance < 0 ? 'text-danger' : 'text-main'}`}>
                    Rs {b.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Broker Ledger */}
      <div style={{ flex: '1 1 70%' }}>
        {!selectedBroker ? (
          <div className="card text-center p-12 text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-30 text-secondary" />
            <h3 className="text-xl font-bold mb-2">Select Broker Profile</h3>
            <p>Select a broker from the left to view their detailed transaction ledger and manage payments.</p>
          </div>
        ) : (
          <div className="flex-col gap-6">
            
            {/* Header Card */}
            <div className="card animate-fade-in" style={{ borderLeft: '4px solid var(--secondary)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {selectedBroker.name}
                  </h2>
                  <p className="text-sm text-muted">Broker Transaction Record</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-right border-r pr-6">
                    <div className="text-xs text-muted uppercase tracking-wider font-semibold">Total Commissions</div>
                    <div className="text-xl font-bold text-success">
                      Rs {selectedBroker.transactions.reduce((s,t) => s + Number(t.commission_amount||0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right border-r pr-6">
                    <div className="text-xs text-muted uppercase tracking-wider font-semibold">Total Payments</div>
                    <div className="text-xl font-bold text-danger">
                      Rs {selectedBroker.transactions.reduce((s,t) => s + Number(t.payment_amount||0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted uppercase tracking-widest font-black mb-1">Current Balance</div>
                    <div className={`text-3xl font-black ${selectedBroker.balance > 0 ? 'text-success' : selectedBroker.balance < 0 ? 'text-danger' : ''}`}>
                      Rs {selectedBroker.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions & Payment Form */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                   <Receipt size={18} className="text-secondary" /> Payment & Ledger
                </h3>
                <button className="btn" style={{ backgroundColor: 'var(--secondary)', color: 'white' }} onClick={() => setShowPaymentForm(!showPaymentForm)}>
                  {showPaymentForm ? 'Cancel' : <><Plus size={16}/> Record Payment</>}
                </button>
              </div>

              {showPaymentForm && (
                <form onSubmit={handlePaymentSubmit} className="mb-6 bg-secondary-light p-6 rounded-xl border-2 border-[var(--secondary)] animate-slide-down shadow-sm">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="input-group">
                      <label className="input-label text-xs font-bold uppercase">Date</label>
                      <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="input bg-surface" />
                    </div>
                    <div className="input-group">
                      <label className="input-label text-xs font-bold uppercase">Payment Amount (Rs)</label>
                      <input required type="number" min="1" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="input bg-surface" placeholder="0" />
                    </div>
                    <div className="input-group">
                       <label className="input-label text-xs font-bold uppercase">Description</label>
                       <input type="text" value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} className="input bg-surface" placeholder="e.g. Weekly Payment" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="submit" className="btn" style={{ backgroundColor: 'var(--secondary)', color: 'white' }} disabled={savingPayment}>
                      {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Save Payment Record
                    </button>
                  </div>
                </form>
              )}

              <div className="table-wrapper">
                <table className="text-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Chalan #</th>
                      <th>Vehicle Info</th>
                      <th>Fare</th>
                      <th>Commission</th>
                      <th>Payment</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let runningBalance = 0;
                      // We need to sort by date ascending to calculate running balance, but display descending
                      const sortedTransactions = [...selectedBroker.transactions].sort((a,b) => new Date(a.record_date) - new Date(b.record_date));
                      
                      const tableRows = sortedTransactions.map((t, idx) => {
                        const comm = Number(t.commission_amount || 0);
                        const pay = Number(t.payment_amount || 0);
                        runningBalance += (comm - pay);
                        
                        return (
                          <tr key={t.id || idx}>
                            <td className="whitespace-nowrap font-medium">{new Date(t.record_date).toLocaleDateString()}</td>
                            <td className="font-bold">
                              {t.chalan_no ? (
                                <span className="flex items-center gap-1">
                                  <Truck size={12} className="text-secondary" /> {t.chalan_no}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              {t.vehicle_no ? (
                                <div className="flex-col gap-0.5">
                                  <div className="font-bold">{t.vehicle_no}</div>
                                  <div className="text-[10px] text-muted">{t.route_permit_no || 'No Permit'}</div>
                                </div>
                              ) : (
                                <span className="text-muted italic">{t.description}</span>
                              )}
                            </td>
                            <td className="text-right">
                               {t.vehicle_fare ? `Rs ${t.vehicle_fare.toLocaleString()}` : '—'}
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {updatingId === t.id && <Loader2 size={10} className="animate-spin text-muted" />}
                                <input 
                                  type="number"
                                  defaultValue={comm}
                                  onBlur={(e) => {
                                    if (Number(e.target.value) !== comm) {
                                      handleCommissionUpdate(t.id, e.target.value);
                                    }
                                  }}
                                  className="text-right font-bold text-success"
                                  style={{ 
                                    width: '100px', 
                                    background: 'transparent', 
                                    border: '1px solid transparent', 
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    outline: 'none'
                                  }}
                                  onFocus={(e) => e.target.style.border = '1px solid var(--secondary)'}
                                  onMouseEnter={(e) => e.target.style.border = '1px dashed #ccc'}
                                  onMouseLeave={(e) => {
                                    if (document.activeElement !== e.target) {
                                      e.target.style.border = '1px solid transparent';
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td className="text-right font-bold text-danger">
                              {pay > 0 ? `- Rs ${pay.toLocaleString()}` : ''}
                            </td>
                            <td className="text-right font-black bg-slate-50">
                               Rs {runningBalance.toLocaleString()}
                            </td>
                          </tr>
                        );
                      });
                      
                      return tableRows.reverse(); // Newest first
                    })()}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-xs text-muted">
                <p>* Balance = Total Commissions - Total Payments</p>
                <button className="btn btn-outline btn-sm" onClick={handlePrintStatement}>Print Statement</button>
              </div>

            </div>

            {/* Hidden Print Area */}
            <div style={{ display: 'none' }}>
               <PrintBrokerStatement broker={selectedBroker} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BrokerRecord;
