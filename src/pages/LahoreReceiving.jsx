import React, { useState, useEffect } from 'react';
import { PackageCheck, CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LahoreReceiving = () => {
  const [arrivedChalans, setArrivedChalans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification flow state
  const [verifyingChalan, setVerifyingChalan] = useState(null);
  const [verificationItems, setVerificationItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missingColumn, setMissingColumn] = useState(false);

  useEffect(() => {
    fetchArrivedChalans();
  }, []);

  const fetchArrivedChalans = async () => {
    try {
      setLoading(true);
      // Fetch chalans that have arrived ('Received') but might still have pending bilties to verify
      // For simplicity, we just fetch all 'Received' chalans. A robust app might hide them if all bilties are verified.
      const { data, error } = await supabase
        .from('chalans')
        .select('*')
        .eq('status', 'Received')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArrivedChalans(data || []);
    } catch (err) {
      console.error('Error fetching arrived chalans:', err);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async (chalan) => {
    setVerifyingChalan(chalan);
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('chalan_bilties')
        .select(`
          id,
          loaded_quantity,
          received_quantity,
          status,
          bilty_id,
          bilties (
            bilty_no,
            sender_name,
            receiver_name,
            total_quantity,
            remaining_quantity,
            lahore_quantity
          )
        `)
        .eq('chalan_id', chalan.id)
        .neq('status', 'Lahore Warehouse'); // Items not yet fully processed into Warehouse

      if (error) throw error;
      
      if (data && data.length > 0 && data[0].bilties && !('lahore_quantity' in data[0].bilties)) {
          setMissingColumn(true);
      }

      // Initialize validation inputs
      const itemsWithInput = (data || []).map(item => ({
        ...item,
        inputReceived: item.loaded_quantity // Default to fully received
      }));
      setVerificationItems(itemsWithInput);
      
    } catch (err) {
      console.error('Error fetching items for verification:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleInputChange = (id, val) => {
    setVerificationItems(prev => prev.map(item => 
      item.id === id ? { ...item, inputReceived: Math.max(0, Number(val)) } : item
    ));
  };

  const handleVerifySubmit = async () => {
    setSaving(true);
    try {
      for (const item of verificationItems) {
        const received = item.inputReceived;
        const missing = item.loaded_quantity - received;

        // 1. Update chalan_bilties status to 'Lahore Warehouse'
        const { error: cbError } = await supabase
          .from('chalan_bilties')
          .update({
            received_quantity: received,
            status: 'Lahore Warehouse'
          })
          .eq('id', item.id);
        
        if (cbError) throw cbError;

        // 1b. Update main bilties table to restore remaining_quantity
        // We get the current bilty to add the received quantity to its remaining_quantity
        let currentBilty = null;
        let fetchErr = null;
        try {
            const { data, error } = await supabase
                .from('bilties')
                .select('*')
                .eq('id', item.bilty_id)
                .single();
            currentBilty = data;
            fetchErr = error;
        } catch (e) {
            fetchErr = e;
        }
            
        if (!fetchErr && currentBilty) {
            // Update bilty status and safely try to update lahore_quantity
            const updatePayload = { status: 'Lahore Warehouse' };
            // If lahore_quantity exists in our fetched object, we can try to update it
            if ('lahore_quantity' in currentBilty) {
                updatePayload.lahore_quantity = Number(currentBilty.lahore_quantity || 0) + received;
            } else {
                setMissingColumn(true);
            }
            
            const { error: biltyUpdateError } = await supabase
              .from('bilties')
              .update(updatePayload)
              .eq('id', item.bilty_id);

            // If it failed because of missing column, we still want to finish the rest
            if (biltyUpdateError && biltyUpdateError.code === '42703') {
                console.warn('lahore_quantity column missing, only status updated.');
                setMissingColumn(true);
            } else if (biltyUpdateError) throw biltyUpdateError;
        }


        // 2. Insert into Claims if there's a shortage
        if (missing > 0) {
          const { error: claimError } = await supabase
            .from('claims')
            .insert({
              truck_no: verifyingChalan.truck_no,
              chalan_id: verifyingChalan.id,
              bilty_id: item.bilty_id,
              missing_quantity: missing,
              claim_amount: 0,
              claim_date: new Date().toISOString().split('T')[0],
              status: 'Pending'
            });
          if (claimError) throw claimError;
        }
      }

      alert("Verification complete! Goods moved to Lahore Warehouse Inventory.");
      setVerifyingChalan(null);
      // Optional: if we only want to show unverified chalans, we could filter it out here.
      
    } catch (err) {
      console.error('Error during verification:', err);
      alert('Verification failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in flex flex-col gap-6">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageCheck className="text-primary"/> Lahore Receiving & Verification
          </h1>
          <p className="text-muted mt-1">Verify arrived truck inventory against bilties and manage shortages.</p>
        </div>
      </div>

      {missingColumn && (
        <div className="card mb-4" style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412' }}>
          <div className="flex items-start gap-4">
            <div style={{ fontSize: '1.5rem' }}>⚠️</div>
            <div>
              <h3 className="font-bold mb-1 text-sm">Action Needed: Quantities will not be saved!</h3>
              <p className="text-xs mb-2">The database column for Lahore inventory is missing. Run this SQL in Supabase to enable tracking:</p>
              <pre style={{ background: '#fed7aa', padding: '0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                ALTER TABLE bilties ADD COLUMN IF NOT EXISTS lahore_quantity NUMERIC DEFAULT 0;
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        
        {/* Left List */}
        <div className="card" style={{ flex: '1 1 40%' }}>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Arrived Trucks</h2>
          
          {loading ? (
            <div className="py-8 text-center text-muted flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : arrivedChalans.length === 0 ? (
            <div className="p-8 text-center text-muted">No arrived trucks to process.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {arrivedChalans.map(c => (
                  <div 
                    key={c.id} 
                    className="p-4 border border-border rounded-xl cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                    style={{ backgroundColor: verifyingChalan?.id === c.id ? 'var(--primary-light)' : 'var(--surface)' }}
                    onClick={() => startVerification(c)}
                  >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">Truck {c.truck_no}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-success text-white">Arrived</span>
                  </div>
                  <div className="text-sm text-muted">Chalan #{c.chalan_no} • {new Date(c.chalan_date).toLocaleDateString()}</div>
                  <div className="text-sm font-medium mt-1">{c.from_city} <ArrowRight size={14} className="inline text-muted"/> {c.to_city}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Verification Panel */}
        <div className="card" style={{ flex: '1 1 60%' }}>
          <h2 className="text-lg font-bold mb-4 border-b pb-2">
            {verifyingChalan ? `Verify Goods: ${verifyingChalan.truck_no}` : 'Select a truck to verify'}
          </h2>

          {!verifyingChalan ? (
            <div className="py-12 text-center text-muted">
              <PackageCheck size={48} className="mx-auto mb-4 opacity-50" />
              <p>Click on an arrived truck from the left panel to begin verification.</p>
            </div>
          ) : loadingItems ? (
            <div className="py-12 flex justify-center text-muted"><Loader2 className="animate-spin" /></div>
          ) : verificationItems.length === 0 ? (
            <div className="py-12 text-center text-success flex flex-col items-center">
              <CheckCircle2 size={48} className="mb-4" />
              <p className="font-bold">All items in this Chalan have already been verified.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-warning-light text-warning-dark rounded-xl text-sm font-medium border border-warning-light bg-opacity-20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: '#92400e' }}>
                Please physically verify the quantity of goods received and adjust the numbers if there is a shortage. Appropriate claims will be generated automatically.
              </div>

              <div className="table-wrapper mb-6">
                <table>
                  <thead>
                    <tr>
                      <th>Bilty No</th>
                      <th>Sender → Receiver</th>
                      <th>Dispatched Qty</th>
                      <th>Received Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationItems.map((item) => {
                      const isShort = item.loaded_quantity > item.inputReceived;
                      return (
                        <tr key={item.id} style={{ backgroundColor: isShort ? 'var(--danger-light)' : 'transparent', borderLeft: isShort ? '4px solid var(--danger)' : 'none' }}>
                          <td className="font-bold">#{item.bilties?.bilty_no}</td>
                          <td>
                            <div className="text-sm">{item.bilties?.sender_name}</div>
                            <div className="text-xs text-muted">to {item.bilties?.receiver_name}</div>
                          </td>
                          <td className="font-bold">{item.loaded_quantity}</td>
                          <td>
                            <input 
                              type="number" 
                              className="input font-bold text-center"
                              style={{ width: '80px', borderColor: isShort ? 'var(--danger)' : 'var(--border)' }}
                              min="0"
                              max={item.loaded_quantity}
                              value={item.inputReceived}
                              onChange={(e) => handleInputChange(item.id, e.target.value)}
                            />
                          </td>
                          <td>
                            {isShort ? (
                              <span className="flex items-center gap-1 text-danger-foreground text-xs font-bold">
                                <ShieldAlert size={14} /> Shortage
                              </span>
                            ) : (
                              <span className="text-success text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 size={14} /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-4 border-t pt-4">
                <button className="btn btn-outline" onClick={() => setVerifyingChalan(null)}>Cancel</button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleVerifySubmit}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <PackageCheck size={18} />}
                  {saving ? 'Verifying...' : 'Verify & Setup Lahore Inventory'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LahoreReceiving;
