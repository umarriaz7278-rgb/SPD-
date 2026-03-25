import React, { useState, useEffect } from 'react';
import { Truck, Check, Trash2, FileText, Loader2, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COMPANY } from '../lib/constants';
import PrintChalan from '../components/PrintChalan';

// ──────────────────────────────────────────────
// CHALAN MANAGEMENT PAGE
// ──────────────────────────────────────────────


const ChalanManagement = () => {
  const [warehouseBilties, setWarehouseBilties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Chalan Form State
  const [chalanForm, setChalanForm] = useState({
    truckNo: '',
    routePermit: '',
    departureTime: '',
    fromCity: 'Karachi',
    toCity: 'Lahore',
    driverPhone: '',
    date: new Date().toISOString().split('T')[0],
    commissionPct: 0,
    labourCost: 0,
    vehicleExpense: 0,
    brokerName: ''
  });

  // Selected Bilties: Map of bilty_id -> { bilty_object, loadedQuantity }
  const [selectedBilties, setSelectedBilties] = useState({});

  // Print state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [savedChalan, setSavedChalan] = useState(null);
  const [savedBilties, setSavedBilties] = useState([]);


  useEffect(() => {
    fetchWarehouseBilties();
  }, []);

  const fetchWarehouseBilties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bilties')
        .select('*')
        .eq('status', 'Warehouse')
        .gt('remaining_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarehouseBilties(data || []);
    } catch (error) {
      console.error('Error fetching warehouse bilties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setChalanForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleBiltySelection = (bilty) => {
    const nextSelected = { ...selectedBilties };
    if (nextSelected[bilty.id]) {
      delete nextSelected[bilty.id];
    } else {
      nextSelected[bilty.id] = { ...bilty, loadedQuantity: bilty.remaining_quantity };
    }
    setSelectedBilties(nextSelected);
  };

  const handleLoadedQuantityChange = (id, newQty) => {
    const b = selectedBilties[id];
    if (!b) return;
    const qty = Math.min(Math.max(1, Number(newQty)), b.remaining_quantity);
    setSelectedBilties({
      ...selectedBilties,
      [id]: { ...b, loadedQuantity: qty }
    });
  };

  // Calculations
  const selectedList = Object.values(selectedBilties);
  const totalChalanAmount = selectedList.reduce((sum, item) => {
    const ratio = item.loadedQuantity / item.total_quantity;
    return sum + (item.total_amount * ratio);
  }, 0);

  const deliveryDeduction = totalChalanAmount * (Number(chalanForm.commissionPct) / 100);
  const totalProfit = totalChalanAmount - deliveryDeduction - Number(chalanForm.labourCost) - Number(chalanForm.vehicleExpense);

  const handlePrint = () => {
    const printContent = document.getElementById('chalan-print-target');
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
        <title>Chalan Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: auto; margin: 5mm; }
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

  const handleCreateChalan = async (e) => {
    e.preventDefault();
    if (selectedList.length === 0) {
      alert("Please select at least one bilty to add to the Chalan.");
      return;
    }
    
    setSaving(true);
    try {
      // 1. Create Chalan
      const { data: chalanData, error: chalanError } = await supabase
        .from('chalans')
        .insert({
          truck_no: chalanForm.truckNo,
          route_permit_no: chalanForm.routePermit || null,
          departure_time: chalanForm.departureTime && chalanForm.departureTime !== '' ? chalanForm.departureTime : null,
          from_city: chalanForm.fromCity,
          to_city: chalanForm.toCity,
          driver_phone: chalanForm.driverPhone || null,
          chalan_date: chalanForm.date,
          total_amount: Math.round(totalChalanAmount),
          commission_percentage: Number(chalanForm.commissionPct) || 0,
          labour_cost: Number(chalanForm.labourCost) || 0,
          vehicle_expense: Number(chalanForm.vehicleExpense) || 0,
          profit: Math.round(totalProfit),
          broker_name: chalanForm.brokerName || null,
          status: 'Pending'
        })
        .select()
        .single();

      if (chalanError) throw chalanError;

      // 2. Insert Chalan Bilties
      const cbInserts = selectedList.map(item => ({
        chalan_id: chalanData.id,
        bilty_id: item.id,
        loaded_quantity: item.loadedQuantity
      }));

      const { error: cbError } = await supabase.from('chalan_bilties').insert(cbInserts);
      if (cbError) throw cbError;

      // 3. Update Bilties Remaining Quantity & Status
      for (const item of selectedList) {
        const newRemQty = item.remaining_quantity - item.loadedQuantity;
        // Bilty goes to Transit ONLY when all remaining goods are dispatched
        const nextStatus = newRemQty <= 0 ? 'Transit' : 'Warehouse';
        
        const { error: updError } = await supabase
          .from('bilties')
          .update({ 
            remaining_quantity: Math.max(0, newRemQty),
            status: nextStatus
          })
          .eq('id', item.id);
        
        if (updError) throw updError;
      }
      
      // 4. Update Broker Ledger if Broker Name exists
      if (chalanForm.brokerName && chalanForm.brokerName.trim() !== '') {
        const brokerName = chalanForm.brokerName.trim();
        
        // Find or Create Broker
        let { data: broker, error: brokerFetchError } = await supabase
          .from('brokers')
          .select('id')
          .eq('name', brokerName)
          .single();
          
        if (brokerFetchError && brokerFetchError.code !== 'PGRST116') throw brokerFetchError;
        
        if (!broker) {
          const { data: newBroker, error: brokerInsertError } = await supabase
            .from('brokers')
            .insert({ name: brokerName })
            .select()
            .single();
          if (brokerInsertError) throw brokerInsertError;
          broker = newBroker;
        }
        
        // Add to Ledger
        const { error: ledgerError } = await supabase
          .from('broker_ledger')
          .insert({
            broker_id: broker.id,
            chalan_id: chalanData.id,
            record_date: chalanForm.date,
            description: `Chalan #${chalanData.chalan_no} generated`,
            vehicle_no: chalanForm.truckNo,
            route_permit_no: chalanForm.routePermit,
            vehicle_fare: Math.round(totalChalanAmount),
            chalan_no: chalanData.chalan_no,
            commission_amount: Math.round(deliveryDeduction)
          });
        if (ledgerError) throw ledgerError;
      }

      alert("Chalan " + chalanData.chalan_no + " Created Successfully!");
      
      setSavedChalan(chalanData);
      setSavedBilties([...selectedList]);
      // Removed setShowPrintPreview(true)

      setTimeout(() => {
        handlePrint();
      }, 500);

      // Reset State
      setSelectedBilties({});
      setChalanForm({ 
        ...chalanForm, 
        truckNo: '', 
        routePermit: '', 
        departureTime: '', 
        driverPhone: '', 
        commissionPct: 0, 
        labourCost: 0, 
        vehicleExpense: 0,
        brokerName: ''
      });
      fetchWarehouseBilties(); // Refresh Warehouse

    } catch (err) {
      console.error('Chalan creation error:', err);
      const msg = err?.message || JSON.stringify(err) || 'Unknown error';
      alert('❌ Error creating chalan:\n\n' + msg + '\n\nHint: Make sure you have run the full SQL schema in your Supabase dashboard first.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in flex gap-6" style={{ alignItems: 'flex-start' }}>

      {/* Removed Print Preview Modal */}

      {/* Hidden print target */}
      {savedChalan && (
        <div style={{ display: 'none' }} id="chalan-print-target">
          <PrintChalan chalan={savedChalan} bilties={savedBilties} />
        </div>
      )}
      
      {/* Left: Warehouse Bilties */}
      <div className="card" style={{ flex: '1 1 60%' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
          <Archive size={20} className="text-primary"/> Select Bilties from Warehouse
        </h2>
        
        {loading ? (
          <div className="p-8 flex justify-center items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : warehouseBilties.length === 0 ? (
          <div className="p-8 text-center text-muted">No bilties available in warehouse.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Bilty No</th>
                  <th>Route</th>
                  <th>Sender</th>
                  <th>Rem. Qty</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {warehouseBilties.map(b => (
                  <tr key={b.id} 
                      onClick={() => toggleBiltySelection(b)}
                      style={{ cursor: 'pointer', backgroundColor: selectedBilties[b.id] ? 'var(--primary-light)' : 'transparent' }}>
                    <td>
                      <div style={{ 
                        width: '20px', height: '20px', 
                        borderRadius: '4px', 
                        border: '2px solid var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: selectedBilties[b.id] ? 'var(--primary)' : 'transparent'
                      }}>
                        {selectedBilties[b.id] && <Check size={14} color="white" />}
                      </div>
                    </td>
                    <td className="font-bold">#{b.bilty_no}</td>
                    <td>{b.route_from || b.from_city} → {b.route_to || b.to_city}</td>
                    <td>{b.sender_name}</td>
                    <td className="font-bold text-primary">{b.remaining_quantity}</td>
                    <td>{b.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right: Chalan Generation Form */}
      <div className="card" style={{ flex: '1 1 40%' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-3 text-main">
          <Truck size={20} className="text-secondary"/> Create Chalan Document
        </h2>
        
        <form onSubmit={handleCreateChalan} className="flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Truck Number</label>
              <input required type="text" name="truckNo" value={chalanForm.truckNo} onChange={handleFormChange} className="input" placeholder="e.g. KHI-1234"/>
            </div>
            <div className="input-group">
              <label className="input-label">Driver Phone</label>
              <input required type="text" name="driverPhone" value={chalanForm.driverPhone} onChange={handleFormChange} className="input" placeholder="03XXXXXXXXX"/>
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input required type="date" name="date" value={chalanForm.date} onChange={handleFormChange} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Time</label>
              <input type="time" name="departureTime" value={chalanForm.departureTime} onChange={handleFormChange} className="input" />
            </div>
            <div className="input-group col-span-2">
              <label className="input-label" style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Broker Name (Optional)</label>
              <input type="text" name="brokerName" value={chalanForm.brokerName} onChange={handleFormChange} className="input" placeholder="Enter broker name to record in ledger" style={{ borderColor: 'var(--secondary)' }}/>
            </div>
          </div>
          
          <div className="input-group mt-2">
            <label className="input-label">Route Permit Number</label>
            <input type="text" name="routePermit" value={chalanForm.routePermit} onChange={handleFormChange} className="input" />
          </div>

          {/* Partial Loading Setup */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Selected Bilties ({selectedList.length})</h3>
            {selectedList.length === 0 ? (
              <div className="p-4 bg-background rounded text-sm text-center text-muted border border-border">Select bilties from the list to add to Chalan.</div>
            ) : (
              <div className="flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {selectedList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded bg-surface">
                    <div className="flex-col gap-1">
                      <span className="font-bold text-sm">#{item.bilty_no}</span>
                      <span className="text-xs text-muted">Rem: {item.remaining_quantity} | Fare: Rs {item.total_amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold">Load Qty:</label>
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: '80px', padding: '0.25rem' }} 
                        min="1" 
                        max={item.remaining_quantity} 
                        value={item.loadedQuantity} 
                        onChange={(e) => handleLoadedQuantityChange(item.id, e.target.value)}
                      />
                      <button type="button" onClick={() => toggleBiltySelection(item)} className="text-danger ml-2" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profit Calculation */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Profit Calculation</h3>
            
            <div className="flex justify-between items-center mb-4 p-4 bg-primary-light rounded-xl border border-blue-100">
              <span className="font-bold text-primary">Total Chalan Amount:</span>
              <span className="font-bold text-2xl text-primary">Rs {totalChalanAmount.toFixed(0)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="input-group">
                <label className="input-label">Delivery Comm. (%)</label>
                <input type="number" step="0.1" min="0" max="100" name="commissionPct" value={chalanForm.commissionPct} onChange={handleFormChange} className="input" />
              </div>
              <div className="input-group">
                <label className="input-label">Comm. Deduction</label>
                <div className="input bg-background border-transparent">Rs {deliveryDeduction.toFixed(0)}</div>
              </div>
              <div className="input-group">
                <label className="input-label">Labour Cost (Rs)</label>
                <input type="number" min="0" name="labourCost" value={chalanForm.labourCost} onChange={handleFormChange} className="input" />
              </div>
              <div className="input-group">
                <label className="input-label">Vehicle Exp. (Rs)</label>
                <input type="number" min="0" name="vehicleExpense" value={chalanForm.vehicleExpense} onChange={handleFormChange} className="input" />
              </div>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl shadow-md" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
              <span className="font-bold text-sm uppercase tracking-wider">Estimated Profit:</span>
              <span className="font-extrabold text-2xl">Rs {totalProfit.toFixed(0)}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={saving || selectedList.length === 0}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {saving ? 'Creating Chalan...' : 'Generate Chalan'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ChalanManagement;
