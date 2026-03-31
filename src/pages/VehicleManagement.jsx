import React, { useState, useEffect } from 'react';
import { Truck, Plus, Loader2, ArrowRight, FileText, Users, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles', 'suppliers'
  
  // New Vehicle State
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  // New Supplier State
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', mobile: '', address: '', opening_balance: 0 });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Ledger View State
  const [viewingLedger, setViewingLedger] = useState(null); // supplier object
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehRes, supRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicle_suppliers').select('*').order('name', { ascending: true })
      ]);
      if (vehRes.error) throw vehRes.error;
      if (supRes.error) throw supRes.error;
      
      setVehicles(vehRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      alert('Error fetching data. Please ensure the vehicle_schema.sql script was run in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.trim()) return;
    setSavingVehicle(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ vehicle_no: newVehicle.toUpperCase() })
        .select()
        .single();
      
      if (error) throw error;
      setVehicles([data, ...vehicles]);
      setNewVehicle('');
      setShowAddVehicle(false);
    } catch (error) {
      alert("Error adding vehicle: " + error.message);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    setSavingSupplier(true);
    try {
      // 1. Insert Supplier
      const { data: newSup, error } = await supabase
        .from('vehicle_suppliers')
        .insert({
          name: supplierForm.name,
          mobile: supplierForm.mobile || null,
          address: supplierForm.address || null,
          opening_balance: Number(supplierForm.opening_balance) || 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. Insert Opening Balance into Ledger if > 0
      if (Number(supplierForm.opening_balance) > 0) {
         await supabase.from('vehicle_supplier_ledger').insert({
            supplier_id: newSup.id,
            date: new Date().toISOString().split('T')[0],
            description: 'Opening Balance',
            debit: Number(supplierForm.opening_balance),
            credit: 0,
            balance: Number(supplierForm.opening_balance)
         });
      }

      setSuppliers([...suppliers, newSup].sort((a,b) => a.name.localeCompare(b.name)));
      setSupplierForm({ name: '', mobile: '', address: '', opening_balance: 0 });
      setShowAddSupplier(false);
    } catch (error) {
      alert("Error adding supplier: " + error.message);
    } finally {
      setSavingSupplier(false);
    }
  };

  const fetchLedger = async (supplier) => {
    setViewingLedger(supplier);
    setLoadingLedger(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_supplier_ledger')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true }); // To maintain correct balance order

      if (error) throw error;

      // Recalculate running balance just in case it got corrupted
      let currentBal = 0;
      const calculatedData = (data || []).map(entry => {
        currentBal = currentBal + Number(entry.debit) - Number(entry.credit);
        return { ...entry, calculatedBalance: currentBal };
      });

      setLedgerEntries(calculatedData);
    } catch (error) {
      alert('Error fetching ledger: ' + error.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  return (
    <div className="page-container animate-fade-in flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="text-primary"/> Fleet Management
          </h1>
          <p className="text-muted mt-1">Manage company-owned vehicles and supplier accounts.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button 
          className={`pb-2 px-4 font-bold border-b-2 transition-all ${activeTab === 'vehicles' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}
          onClick={() => setActiveTab('vehicles')}
        >
          <div className="flex items-center gap-2"><Truck size={18}/> Vehicles</div>
        </button>
        <button 
          className={`pb-2 px-4 font-bold border-b-2 transition-all ${activeTab === 'suppliers' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}
          onClick={() => { setActiveTab('suppliers'); setViewingLedger(null); }}
        >
           <div className="flex items-center gap-2"><Users size={18}/> Vehicle Suppliers</div>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-muted"><Loader2 className="animate-spin" size={32}/></div>
      ) : activeTab === 'vehicles' ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold">Registered Vehicles ({vehicles.length})</h2>
            <button className="btn btn-primary" onClick={() => setShowAddVehicle(!showAddVehicle)}>
              <Plus size={18} /> Add Vehicle
            </button>
          </div>

          {showAddVehicle && (
            <div className="card bg-primary-light border-primary-light">
              <form onSubmit={handleAddVehicle} className="flex items-end gap-4">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Vehicle Number</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. TLF-055" 
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingVehicle}>
                  {savingVehicle ? <Loader2 size={18} className="animate-spin"/> : 'Save Vehicle'}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            {vehicles.map(v => (
              <div 
                key={v.id} 
                className="card cursor-pointer hover:border-primary transition-all flex justify-between items-center"
                onClick={() => navigate(`/vehicles/${v.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-light rounded-lg text-primary">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{v.vehicle_no}</h3>
                    <p className="text-xs text-muted">Added {new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <ArrowRight className="text-muted" size={20} />
              </div>
            ))}
            {vehicles.length === 0 && !showAddVehicle && (
              <div className="col-span-3 py-12 text-center text-muted card border-dashed">
                No vehicles added yet. Click "Add Vehicle" to register your fleet.
              </div>
            )}
          </div>
        </div>
      ) : viewingLedger ? (
        <div className="flex flex-col gap-6 animate-fade-in">
           <div className="flex justify-between items-center card">
             <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="text-primary"/> Ledger: {viewingLedger.name}</h2>
                <div className="text-sm text-muted mt-1">{viewingLedger.mobile} {viewingLedger.address ? `• ${viewingLedger.address}` : ''}</div>
             </div>
             <button className="btn btn-outline" onClick={() => setViewingLedger(null)}>Back to List</button>
           </div>
           
           <div className="card">
             {loadingLedger ? (
               <div className="py-12 flex justify-center text-muted"><Loader2 className="animate-spin" size={32}/></div>
             ) : (
               <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th className="text-right">Debit (+)</th>
                        <th className="text-right">Credit (-)</th>
                        <th className="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerEntries.map((entry, idx) => (
                        <tr key={entry.id}>
                          <td>{new Date(entry.date).toLocaleDateString()}</td>
                          <td>{entry.description}</td>
                          <td className="text-right text-danger font-medium">{Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString() : '-'}</td>
                          <td className="text-right text-success font-medium">{Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString() : '-'}</td>
                          <td className="text-right font-bold">{entry.calculatedBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                      {ledgerEntries.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-6 text-muted">No ledger entries found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
             )}
           </div>
        </div>
      ) : (
         <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold">Vehicle Suppliers ({suppliers.length})</h2>
            <button className="btn btn-primary" onClick={() => setShowAddSupplier(!showAddSupplier)}>
              <Plus size={18} /> Add Supplier
            </button>
          </div>

          {showAddSupplier && (
            <div className="card bg-surface">
              <form onSubmit={handleAddSupplier} className="grid grid-cols-4 gap-4 items-end">
                <div className="input-group">
                  <label className="input-label">Supplier Name <span className="text-danger">*</span></label>
                  <input 
                    type="text" className="input" required
                    value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Mobile</label>
                  <input 
                    type="text" className="input" 
                    value={supplierForm.mobile} onChange={e => setSupplierForm({...supplierForm, mobile: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Opening Balance (Owe them)</label>
                  <input 
                    type="number" className="input" min="0" step="1"
                    value={supplierForm.opening_balance} onChange={e => setSupplierForm({...supplierForm, opening_balance: e.target.value})}
                  />
                </div>
                <div className="input-group">
                   <button type="submit" className="btn btn-primary w-full" disabled={savingSupplier}>
                    {savingSupplier ? <Loader2 size={18} className="animate-spin"/> : 'Save Supplier'}
                   </button>
                </div>
              </form>
            </div>
          )}

          <div className="card p-0 overflow-hidden border">
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact Info</th>
                    <th>Added On</th>
                    <th style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(sup => (
                    <tr key={sup.id}>
                      <td className="font-bold">{sup.name}</td>
                      <td>
                        <div className="text-sm">{sup.mobile || '-'}</div>
                        <div className="text-xs text-muted">{sup.address}</div>
                      </td>
                      <td>{new Date(sup.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => fetchLedger(sup)}>
                          <Eye size={14}/> Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-8 text-muted">No suppliers added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
