import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Loader2, DollarSign, Route, FileText, Plus, Receipt, AlertCircle, Trash2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips'); // 'trips', 'expenses'
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Data State
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    cashExpenses: 0,
    creditExpenses: 0,
    cashSupplierPayments: 0
  });

  // Forms
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [tripForm, setTripForm] = useState({ from_city: '', to_city: '', departure_date: '', arrival_date: '', freight_income: '' });
  const [savingTrip, setSavingTrip] = useState(false);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expForm, setExpForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', payment_type: 'Cash', supplier_id: '', trip_id: '' });
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    fetchVehicleData();
  }, [id]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const [vehRes, tripRes, expRes, supRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', id).single(),
        supabase.from('vehicle_trips').select('*').eq('vehicle_id', id).order('departure_date', { ascending: false }),
        supabase.from('vehicle_expenses').select('*, vehicle_suppliers(name)').eq('vehicle_id', id).order('date', { ascending: false }),
        supabase.from('vehicle_suppliers').select('id, name').order('name', { ascending: true })
      ]);

      if (vehRes.error) throw vehRes.error;
      
      setVehicle(vehRes.data);
      setTrips(tripRes.data || []);
      setExpenses(expRes.data || []);
      setSuppliers(supRes.data || []);

      calculateStats(tripRes.data || [], expRes.data || []);
    } catch (err) {
      console.error(err);
      alert('Error fetching vehicle details.');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tData, eData) => {
    let income = 0;
    tData.forEach(t => income += Number(t.freight_income));

    let tExp = 0;
    let cashExp = 0;
    let creditExp = 0;
    let cashSup = 0;

    eData.forEach(e => {
      const amt = Number(e.amount);
      tExp += amt;
      if (e.payment_type === 'Cash') cashExp += amt;
      if (e.payment_type === 'Credit') creditExp += amt;
      if (e.payment_type === 'Cash Supplier') cashSup += amt;
    });

    setStats({
      totalIncome: income,
      totalExpense: tExp,
      profit: income - tExp,
      cashExpenses: cashExp,
      creditExpenses: creditExp,
      cashSupplierPayments: cashSup
    });
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    setSavingTrip(true);
    try {
      const { data, error } = await supabase.from('vehicle_trips').insert({
        vehicle_id: id,
        from_city: tripForm.from_city,
        to_city: tripForm.to_city,
        departure_date: tripForm.departure_date || null,
        arrival_date: tripForm.arrival_date || null,
        freight_income: Number(tripForm.freight_income) || 0
      }).select().single();

      if (error) throw error;

      const newTrips = [data, ...trips];
      setTrips(newTrips);
      calculateStats(newTrips, expenses);
      setShowAddTrip(false);
      setTripForm({ from_city: '', to_city: '', departure_date: '', arrival_date: '', freight_income: '' });
    } catch (err) {
      alert('Error adding trip: ' + err.message);
    } finally {
      setSavingTrip(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip and its associated expenses?")) return;
    try {
      const { error } = await supabase.from('vehicle_trips').delete().eq('id', tripId);
      if (error) throw error;
      fetchVehicleData(); // Refetch to get updated trips and cascaded expenses
      setSelectedTrip(null);
    } catch (err) {
      alert("Error deleting trip: " + err.message);
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const { error } = await supabase.from('vehicle_expenses').delete().eq('id', expId);
      if (error) throw error;
      
      const newExpenses = expenses.filter(e => e.id !== expId);
      setExpenses(newExpenses);
      calculateStats(trips, newExpenses);
    } catch (err) {
      alert("Error deleting expense: " + err.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if ((expForm.payment_type === 'Credit' || expForm.payment_type === 'Cash Supplier') && !expForm.supplier_id) {
       alert("Please select a supplier for this payment type.");
       return;
    }
    
    setSavingExpense(true);
    try {
      const amt = Number(expForm.amount) || 0;
      
      // 1. Insert Expense
      const { data: newExp, error: expError } = await supabase.from('vehicle_expenses').insert({
        vehicle_id: id,
        date: expForm.date,
        description: expForm.description,
        amount: amt,
        payment_type: expForm.payment_type,
        supplier_id: expForm.supplier_id || null,
        trip_id: expForm.trip_id || null
      }).select('*, vehicle_suppliers(name)').single();

      if (expError) throw expError;

      // 2. Handle strict Accounting logic
      if (expForm.payment_type === 'Credit') {
        const { error: ledgErr } = await supabase.from('vehicle_supplier_ledger').insert({
           supplier_id: expForm.supplier_id,
           date: expForm.date,
           description: `Credit Expense (${vehicle.vehicle_no}): ${expForm.description}`,
           debit: amt,  // Owe more
           credit: 0
        });
        if (ledgErr) throw ledgErr;
      } 
      else if (expForm.payment_type === 'Cash Supplier') {
        const { error: ledgErr } = await supabase.from('vehicle_supplier_ledger').insert({
           supplier_id: expForm.supplier_id,
           date: expForm.date,
           description: `Cash Payment (${vehicle.vehicle_no}): ${expForm.description}`,
           debit: 0,
           credit: amt // Paid off debt
        });
        if (ledgErr) throw ledgErr;
      }
      // 'Cash' type bypasses the supplier ledger completely.

      const newExpenses = [newExp, ...expenses];
      setExpenses(newExpenses);
      calculateStats(trips, newExpenses);
      setShowAddExpense(false);
      setExpForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', payment_type: 'Cash', supplier_id: '', trip_id: '' });

    } catch (err) {
      alert('Error recording expense: ' + err.message);
    } finally {
      setSavingExpense(false);
    }
  };

  if (loading) return <div className="page-container flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  if (!vehicle) return <div className="page-container">Vehicle not found.</div>;

  return (
    <div className="page-container animate-fade-in flex flex-col gap-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <button className="flex items-center gap-2 text-muted hover:text-primary transition-all w-max" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={16}/> Back to Fleet
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-lg"><Truck size={24}/></div>
            {vehicle.vehicle_no}
          </h1>
          <div className="text-sm text-muted">Added {new Date(vehicle.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card bg-success-light border-success-light">
          <div className="text-sm font-bold text-success-dark uppercase mb-1">Total Trip Income</div>
          <div className="text-2xl font-bold text-success-dark flex items-center"><DollarSign size={20}/> {stats.totalIncome.toLocaleString()}</div>
        </div>
        <div className="card bg-danger-light border-danger-light">
           <div className="text-sm font-bold text-danger-dark uppercase mb-1">Total Expenses</div>
           <div className="text-2xl font-bold text-danger-dark flex items-center"><DollarSign size={20}/> {stats.totalExpense.toLocaleString()}</div>
           <div className="flex gap-3 mt-2 text-xs font-semibold text-danger-dark opacity-80">
              <div>Cash: {stats.cashExpenses.toLocaleString()}</div>
              <div>Credit: {stats.creditExpenses.toLocaleString()}</div>
           </div>
        </div>
        <div className={`card text-white ${stats.profit >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ border: 'none' }}>
           <div className="text-sm font-bold uppercase mb-1 opacity-90">Net Profit</div>
           <div className="text-3xl font-black flex items-center">Rs {stats.profit.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button 
          className={`pb-2 px-4 font-bold border-b-2 transition-all ${activeTab === 'trips' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}
          onClick={() => setActiveTab('trips')}
        >
          <div className="flex items-center gap-2"><Route size={18}/> Trip Income ({trips.length})</div>
        </button>
        <button 
          className={`pb-2 px-4 font-bold border-b-2 transition-all ${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}
          onClick={() => setActiveTab('expenses')}
        >
           <div className="flex items-center gap-2"><Receipt size={18}/> Expenses ({expenses.length})</div>
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'trips' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold">Round Trips History</h2>
               <button className="btn btn-outline" onClick={() => setShowAddTrip(!showAddTrip)}><Plus size={16}/> Record Trip</button>
            </div>

            {showAddTrip && (
              <div className="card bg-surface">
                <form onSubmit={handleAddTrip} className="grid grid-cols-6 gap-4 items-end">
                  <div className="input-group">
                    <label className="input-label">From City *</label>
                    <input type="text" className="input" required value={tripForm.from_city} onChange={e=>setTripForm({...tripForm, from_city: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">To City *</label>
                    <input type="text" className="input" required value={tripForm.to_city} onChange={e=>setTripForm({...tripForm, to_city: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Departure Date</label>
                    <input type="date" className="input" value={tripForm.departure_date} onChange={e=>setTripForm({...tripForm, departure_date: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Arrival Date</label>
                    <input type="date" className="input" value={tripForm.arrival_date} onChange={e=>setTripForm({...tripForm, arrival_date: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Freight Income *</label>
                    <input type="number" className="input font-bold" min="0" required value={tripForm.freight_income} onChange={e=>setTripForm({...tripForm, freight_income: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <button type="submit" className="btn btn-success" disabled={savingTrip}>
                      {savingTrip ? <Loader2 size={16} className="animate-spin"/> : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card p-0 border overflow-hidden">
               <div className="table-wrapper" style={{ border: 'none' }}>
                 <table>
                   <thead>
                     <tr>
                       <th>Route</th>
                       <th>Dates</th>
                       <th className="text-right">Income</th>
                       <th className="w-24 text-center">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {trips.map(t => (
                       <tr key={t.id}>
                         <td className="font-bold">{t.from_city} <span className="text-muted mx-2">→</span> {t.to_city}</td>
                         <td className="text-sm">
                           <div>{t.departure_date ? new Date(t.departure_date).toLocaleDateString() : '-'} <span className="text-muted text-xs">(Dep)</span></div>
                           <div>{t.arrival_date ? new Date(t.arrival_date).toLocaleDateString() : '-'} <span className="text-muted text-xs">(Arr)</span></div>
                         </td>
                         <td className="text-right text-success font-bold">Rs {Number(t.freight_income).toLocaleString()}</td>
                         <td>
                           <div className="flex justify-center items-center gap-2">
                             <button className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" onClick={() => setSelectedTrip(t)} title="View Trip Details">
                               <Eye size={16}/>
                             </button>
                             <button className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors" onClick={() => handleDeleteTrip(t.id)} title="Remove Trip">
                               <Trash2 size={16}/>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {trips.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-8">No trips recorded yet.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold">Vehicle Expenses</h2>
               <button className="btn btn-outline" onClick={() => setShowAddExpense(!showAddExpense)}><Plus size={16}/> Record Expense</button>
            </div>

            {showAddExpense && (
              <div className="card bg-danger-light border-danger-light">
                 <div className="text-xs font-bold text-danger-dark uppercase mb-3 flex items-center gap-1"><AlertCircle size={14}/> Strict Accounting Rules Apply</div>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="input-group">
                    <label className="input-label">Date *</label>
                    <input type="date" className="input" required value={expForm.date} onChange={e=>setExpForm({...expForm, date: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Description *</label>
                    <input type="text" className="input" placeholder="e.g. Diesel, Toll" required value={expForm.description} onChange={e=>setExpForm({...expForm, description: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Amount *</label>
                    <input type="number" className="input font-bold" min="1" required value={expForm.amount} onChange={e=>setExpForm({...expForm, amount: e.target.value})}/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Payment Type *</label>
                    <select className="input font-bold text-primary" required value={expForm.payment_type} onChange={e=>setExpForm({...expForm, payment_type: e.target.value})}>
                      <option value="Cash">Cash (Driver paid)</option>
                      <option value="Credit">Credit (Owe Supplier)</option>
                      <option value="Cash Supplier">Cash Supplier (Paid off)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Supplier {(expForm.payment_type === 'Credit' || expForm.payment_type === 'Cash Supplier') && '*'}</label>
                    <select className="input" value={expForm.supplier_id} onChange={e=>setExpForm({...expForm, supplier_id: e.target.value})} disabled={expForm.payment_type === 'Cash'}>
                      <option value="">-- None --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group lg:col-span-2">
                    <label className="input-label">Link to Trip (Optional)</label>
                    <select className="input" value={expForm.trip_id} onChange={e=>setExpForm({...expForm, trip_id: e.target.value})}>
                      <option value="">-- No Specific Trip --</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.from_city} to {t.to_city} ({t.departure_date ? new Date(t.departure_date).toLocaleDateString() : 'N/A'})</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <button type="submit" className="btn btn-danger w-full" disabled={savingExpense} style={{ height: '42px', padding: 0 }}>
                      {savingExpense ? <Loader2 size={16} className="animate-spin"/> : 'Add Expense'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card p-0 border overflow-hidden">
               <div className="table-wrapper" style={{ border: 'none' }}>
                 <table>
                   <thead>
                     <tr>
                       <th>Date</th>
                       <th>Description</th>
                       <th>Payment Type</th>
                       <th>Supplier</th>
                       <th className="text-right">Amount</th>
                       <th className="w-10 text-center"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {expenses.map(e => (
                       <tr key={e.id}>
                         <td>{new Date(e.date).toLocaleDateString()}</td>
                         <td className="font-medium">
                           {e.description}
                           {e.trip_id && (
                             <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                               <Route size={12}/> {trips.find(t => t.id === e.trip_id)?.from_city || 'Linked'} Trip
                             </div>
                           )}
                         </td>
                         <td>
                           <span className={`badge ${
                             e.payment_type === 'Cash' ? 'bg-success text-white' : 
                             e.payment_type === 'Credit' ? 'bg-danger text-white' : 'bg-warning text-white'
                           }`}>{e.payment_type}</span>
                         </td>
                         <td className="text-sm text-muted">{e.vehicle_suppliers?.name || '-'}</td>
                         <td className="text-right font-bold text-danger">Rs {Number(e.amount).toLocaleString()}</td>
                         <td className="text-right">
                           <button className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors" onClick={() => handleDeleteExpense(e.id)} title="Remove Expense">
                             <Trash2 size={16}/>
                           </button>
                         </td>
                       </tr>
                     ))}
                     {expenses.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-8">No expenses recorded yet.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-4xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2"><Route size={20}/> Trip Financial Overview</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setSelectedTrip(null)}><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card bg-gray-50 p-4 border border-gray-100">
                  <div className="text-xs text-muted font-semibold uppercase mb-1">Vehicle</div>
                  <div className="font-bold text-lg truncate flex items-center gap-2">
                    <Truck size={16} className="text-primary"/> {vehicle?.vehicle_no}
                  </div>
                </div>
                <div className="card bg-gray-50 p-4 border border-gray-100">
                  <div className="text-xs text-muted font-semibold uppercase mb-1">Route & Timeline</div>
                  <div className="font-bold">{selectedTrip.from_city} → {selectedTrip.to_city}</div>
                  <div className="text-xs text-muted flex justify-between mt-1">
                    <span>{selectedTrip.departure_date ? new Date(selectedTrip.departure_date).toLocaleDateString() : 'N/A'}</span>
                    <span>-</span>
                    <span>{selectedTrip.arrival_date ? new Date(selectedTrip.arrival_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="card bg-success-light border-success-light p-4">
                  <div className="text-xs text-success-dark font-bold uppercase mb-1">Trip Income</div>
                  <div className="font-black text-2xl text-success-dark">Rs {Number(selectedTrip.freight_income).toLocaleString()}</div>
                </div>
                {(() => {
                  const tripExpenses = expenses.filter(e => e.trip_id === selectedTrip.id);
                  const totalExp = tripExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                  const profit = Number(selectedTrip.freight_income) - totalExp;
                  return (
                    <div className={`card p-4 text-white shadow-md ${profit >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ border: 'none'}}>
                      <div className="text-xs opacity-90 font-bold uppercase mb-1">Net Profit</div>
                      <div className="font-black text-3xl">Rs {profit.toLocaleString()}</div>
                      <div className="text-xs opacity-80 mt-1 font-medium">Minus {totalExp.toLocaleString()} Expenses</div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold uppercase text-muted flex items-center gap-2">
                  <Receipt size={16}/> Associated Expenses
                </h3>
              </div>
              
              <div className="card p-0 border overflow-hidden">
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr className="bg-gray-50">
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th className="text-right">Amount</th>
                        <th className="w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.filter(e => e.trip_id === selectedTrip.id).map(e => (
                        <tr key={e.id}>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td className="font-medium">{e.description}</td>
                          <td>
                            <span className={`badge ${
                               e.payment_type === 'Cash' ? 'bg-success text-white' : 
                               e.payment_type === 'Credit' ? 'bg-danger text-white' : 'bg-warning text-white'
                             }`}>{e.payment_type}</span>
                          </td>
                          <td className="text-right font-bold text-danger">Rs {Number(e.amount).toLocaleString()}</td>
                          <td className="text-right">
                            <button 
                              className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
                              onClick={() => handleDeleteExpense(e.id)}
                              title="Delete Expense"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.filter(e => e.trip_id === selectedTrip.id).length === 0 && (
                        <tr><td colSpan={5} className="text-center text-muted py-10 bg-gray-50/50">
                          <AlertCircle size={32} className="mx-auto text-gray-300 mb-2"/>
                          No expenses linked to this trip.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleDetail;
