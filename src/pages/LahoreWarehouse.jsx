import React, { useState, useEffect } from 'react';
import { Search, Archive, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LahoreWarehouse = () => {
  const [bilties, setBilties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [missingColumn, setMissingColumn] = useState(false);

  // Delivery Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState(null);
  const [deliveryData, setDeliveryData] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverCnic: '',
    deliveryQty: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLahoreBilties();
  }, []);

  const fetchLahoreBilties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bilties')
        .select('*')
        .eq('status', 'Lahore Warehouse')
      if (error) {
        if (error.code === '42703') {
            setMissingColumn(true);
            const retryRes = await supabase
                .from('bilties')
                .select('*')
                .eq('status', 'Lahore Warehouse')
                .order('created_at', { ascending: false });
            setBilties(retryRes.data || []);
            return;
        }
        throw error;
      }

      if (data && data.length > 0 && !('lahore_quantity' in data[0])) {
          setMissingColumn(true);
      }
      setBilties(data || []);
    } catch (error) {
      console.error('Error fetching Lahore bilties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelivery = (bilty) => {
    setSelectedBilty(bilty);
    setDeliveryData({
      receiverName: bilty.receiver_name || '',
      receiverPhone: bilty.receiver_phone || '',
      receiverCnic: '',
      deliveryQty: bilty.lahore_quantity
    });
    setShowDeliveryModal(true);
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const deliveryQty = Number(deliveryData.deliveryQty);
      if (deliveryQty <= 0 || deliveryQty > selectedBilty.lahore_quantity) {
        alert("Invalid quantity. Must be between 1 and " + selectedBilty.lahore_quantity);
        setSaving(false);
        return;
      }

      // 1. Calculate new remaining quantity for Lahore
      const newLahoreQty = selectedBilty.lahore_quantity - deliveryQty;
      const newStatus = newLahoreQty === 0 && selectedBilty.remaining_quantity === 0 ? 'Delivered' : 'Lahore Warehouse';

      // 2. Update Bilty
      const { error: biltyUpdateError } = await supabase
        .from('bilties')
        .update({
          lahore_quantity: newLahoreQty,
          status: newStatus
        })
        .eq('id', selectedBilty.id);

      if (biltyUpdateError) throw biltyUpdateError;

      // 3. Save delivery log (required for Invoices page)
      const { error: logError } = await supabase.from('delivery_logs').insert({
        bilty_id: selectedBilty.id,
        receiver_name: deliveryData.receiverName,
        receiver_phone: deliveryData.receiverPhone,
        receiver_cnic: deliveryData.receiverCnic,
        delivered_quantity: deliveryQty,
        delivery_date: new Date().toISOString().split('T')[0]
      });
      if (logError) throw logError;

      alert("Goods Delivered Successfully!");
      setShowDeliveryModal(false);
      fetchLahoreBilties(); // Refresh table

    } catch (error) {
      console.error("Delivery Error:", error);
      alert("Error confirming delivery: " + (error?.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const filteredBilties = bilties.filter(b => 
    b.bilty_no?.toString().includes(searchTerm) || 
    b.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-primary">
            <Archive size={28} /> Lahore Warehouse
          </h1>
          <p className="text-muted mt-1">Manage and deliver goods to receivers in Lahore.</p>
        </div>
      </div>

      {missingColumn && (
        <div className="card mb-6" style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412' }}>
          <div className="flex items-start gap-4">
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div>
              <h3 className="font-bold text-lg mb-1">Database Update Required</h3>
              <p className="mb-3">The "Lahore Quantity" feature is enabled in the code but missing from your database. To see quantities here, please run this SQL in your Supabase SQL Editor:</p>
              <pre style={{ background: '#fed7aa', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', fontWeight: 'bold', border: '1px solid #fdba74' }}>
                ALTER TABLE bilties ADD COLUMN IF NOT EXISTS lahore_quantity NUMERIC DEFAULT 0;
              </pre>
              <div className="mt-4 flex gap-3">
                <a 
                  href="https://app.supabase.com/project/_/sql" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-primary text-xs"
                  style={{ background: '#9a3412', border: 'none', padding: '0.5rem 1rem' }}
                >
                   Open Supabase SQL Editor
                </a>
                <p className="text-xs self-center">1. Copy code above. 2. Click button. 3. Paste and Run.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative" style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Search by Bilty Number, Sender, or Receiver..." 
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="p-8 text-center text-muted flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : filteredBilties.length === 0 ? (
            <div className="p-8 text-center text-muted">No bilties currently in Lahore Warehouse.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bilty No.</th>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Qty Available</th>
                  <th>Fare Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBilties.map((bilty) => (
                  <tr key={bilty.id}>
                    <td className="font-semibold text-primary">#{bilty.bilty_no}</td>
                    <td>{new Date(bilty.bilty_date).toLocaleDateString()}</td>
                    <td>
                      <div>{bilty.sender_name}</div>
                      <div className="text-xs text-muted">{bilty.sender_phone}</div>
                    </td>
                    <td>
                      <div>{bilty.receiver_name}</div>
                      <div className="text-xs text-muted">{bilty.receiver_phone}</div>
                    </td>
                    <td className="font-bold text-primary text-xl">
                      {missingColumn ? (
                        <span className="text-xs text-danger-foreground bg-danger-light px-2 py-1 rounded" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                           Needs DB Setup
                        </span>
                      ) : (
                        bilty.lahore_quantity
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: bilty.payment_status === 'To Pay (Paid)' ? 'var(--success)' : 
                                         bilty.payment_status === 'Advance Fare' ? 'var(--primary)' : 'var(--warning)',
                        color: 'white'
                      }}>
                        {bilty.payment_status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenDelivery(bilty)}
                        className="btn" 
                        style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}
                      >
                        <UserCheck size={16} /> Deliver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DELIVERY MODAL */}
      {showDeliveryModal && selectedBilty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-scale-up" style={{ width: '100%', maxWidth: '500px', margin: '1rem', boxShadow: 'var(--shadow-lg)', borderRadius: '16px' }}>
            <h2 className="text-xl font-bold mb-4 border-b pb-3 flex items-center gap-2 text-main">
              <UserCheck className="text-success" /> Handover Goods
            </h2>
            <div className="mb-6 bg-primary-light p-4 rounded-xl border border-blue-100">
              <div className="flex justify-between font-bold text-primary mb-1 text-lg">
                <span>Bilty #{selectedBilty.bilty_no}</span>
                <span>Available: {selectedBilty.lahore_quantity}</span>
              </div>
              <div className="text-sm text-muted">Freight: <strong style={{color: 'var(--primary)'}}>Rs. {selectedBilty.total_amount}</strong> ({selectedBilty.payment_status})</div>
            </div>

            <form onSubmit={handleDeliverySubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Receiver Name</label>
                <input required type="text" className="input" value={deliveryData.receiverName} onChange={(e) => setDeliveryData({...deliveryData, receiverName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <input required type="text" className="input" value={deliveryData.receiverPhone} onChange={(e) => setDeliveryData({...deliveryData, receiverPhone: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">CNIC Number</label>
                <input required type="text" className="input" placeholder="XXXXX-XXXXXXX-X" value={deliveryData.receiverCnic} onChange={(e) => setDeliveryData({...deliveryData, receiverCnic: e.target.value})} />
              </div>
               <div className="input-group">
                <label className="input-label text-primary font-bold">Quantity to Deliver</label>
                <input required type="number" min="1" max={selectedBilty.lahore_quantity} className="input text-lg font-bold" value={deliveryData.deliveryQty} onChange={(e) => setDeliveryData({...deliveryData, deliveryQty: e.target.value})} />
                <div className="text-xs text-muted mt-1">If partial delivery, the rest will remain in Lahore Warehouse.</div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" className="btn btn-outline" onClick={() => setShowDeliveryModal(false)}>Cancel</button>
                <button type="submit" className="btn text-white" style={{ background: 'var(--success)' }} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />} 
                  {saving ? 'Processing...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LahoreWarehouse;
