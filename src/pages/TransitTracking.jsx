import React, { useState, useEffect } from 'react';
import { Map, Truck, Navigation, Settings, Eye, Printer, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PrintChalan from '../components/PrintChalan';

const TransitTracking = () => {
  const [chalans, setChalans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedChalan, setSelectedChalan] = useState(null);
  const [chalanItems, setChalanItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Print state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printChalanData, setPrintChalanData] = useState(null);
  const [printBiltiesData, setPrintBiltiesData] = useState([]);
  const [fetchingForPrint, setFetchingForPrint] = useState(false);

  useEffect(() => {
    fetchChalans();
  }, []);

  const fetchChalans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chalans')
        .select('*')
        .in('status', ['Pending', 'Transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChalans(data || []);
    } catch (err) {
      console.error('Error fetching transit chalans:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateChalanStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('chalans')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update associated items status as well
      await supabase
        .from('chalan_bilties')
        .update({ status: newStatus })
        .eq('chalan_id', id);
      
      // Update local state without refetching for speed
      if (newStatus === 'Received') {
        setChalans(chalans.filter(c => c.id !== id));
      } else {
        setChalans(chalans.map(c => c.id === id ? { ...c, status: newStatus } : c));
      }

    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error: ' + err.message);
    }
  };
  const handleDeleteChalan = async (chalan) => {
    if (!window.confirm(`Are you sure you want to DELETE Chalan #${chalan.chalan_no}? This will restore all items back to Karachi Warehouse.`)) {
      return;
    }

    try {
      setLoading(true);
      // 1. Get all bilties in this chalan
      const { data: cbItems, error: cbError } = await supabase
        .from('chalan_bilties')
        .select('bilty_id, loaded_quantity')
        .eq('chalan_id', chalan.id);

      if (cbError) throw cbError;

      // 2. Restore bilty quantities and status
      for (const item of (cbItems || [])) {
        // We need the current remaining_quantity to add back the loaded one
        const { data: bilty, error: fetchErr } = await supabase
          .from('bilties')
          .select('remaining_quantity')
          .eq('id', item.bilty_id)
          .single();

        if (!fetchErr && bilty) {
          await supabase
            .from('bilties')
            .update({
              remaining_quantity: (bilty.remaining_quantity || 0) + item.loaded_quantity,
              status: 'Warehouse' // Move back to warehouse
            })
            .eq('id', item.bilty_id);
        }
      }

      // 3. Delete related records
      // Delete from broker_ledger first
      await supabase.from('broker_ledger').delete().eq('chalan_id', chalan.id);
      
      // Delete from chalan_bilties explicitly to avoid foreign key issues
      await supabase.from('chalan_bilties').delete().eq('chalan_id', chalan.id);
      
      const { error: delError } = await supabase
        .from('chalans')
        .delete()
        .eq('id', chalan.id);

      if (delError) throw delError;

      alert(`Chalan #${chalan.chalan_no} deleted and items restored to warehouse.`);
      fetchChalans();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting chalan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChalanItems = async (chalanId) => {
    try {
      setLoadingItems(true);
      // Fetch chalan_bilties and join with bilties
      const { data, error } = await supabase
        .from('chalan_bilties')
        .select(`
          loaded_quantity,
          bilties (
            bilty_no,
            sender_name,
            receiver_name,
            route_from,
            route_to,
            payment_status
          )
        `)
        .eq('chalan_id', chalanId);

      if (error) throw error;
      setChalanItems(data || []);
    } catch (err) {
      console.error('Error fetching chalan items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewChalan = (chalan) => {
    setSelectedChalan(chalan);
    setChalanItems([]);
    loadChalanItems(chalan.id);
  };

  const handlePrintChalan = async (chalan) => {
    setFetchingForPrint(true);
    try {
      // 1. Fetch chalan_bilties and join with bilties for this specific chalan
      const { data, error } = await supabase
        .from('chalan_bilties')
        .select(`
          loaded_quantity,
          bilties (
            bilty_no,
            sender_name,
            receiver_name,
            route_from,
            route_to,
            payment_status,
            total_quantity,
            total_amount
          )
        `)
        .eq('chalan_id', chalan.id);

      if (error) throw error;
      
      // Flatten the data for PrintChalan component
      const flattenedBilties = data.map(item => ({
        ...item.bilties,
        loaded_quantity: item.loaded_quantity
      }));

      setPrintChalanData(chalan);
      setPrintBiltiesData(flattenedBilties);
      // Removed setShowPrintPreview(true)

      // Auto trigger print
      setTimeout(() => triggerPrint(), 500);

    } catch (err) {
      console.error('Error fetching data for print:', err);
      alert('Error: ' + err.message);
    } finally {
      setFetchingForPrint(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const pendingChalans = chalans.filter(c => c.status === 'Pending');
  const transitChalans = chalans.filter(c => c.status === 'Transit');

  const ChalanCard = ({ chalan, isTransit }) => (
    <div className="card mb-4 border border-border hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-main">
            <Truck size={18} className={isTransit ? "text-primary" : "text-warning"} /> {chalan.truck_no}
          </h3>
          <p className="text-sm text-muted">Chalan: #{chalan.chalan_no} | Date: {new Date(chalan.chalan_date).toLocaleDateString()}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-bold text-primary">{chalan.from_city} → {chalan.to_city}</div>
          <div className="text-xs text-muted font-medium bg-surface px-2 py-1 rounded-md mt-1 italic">Driver: {chalan.driver_phone}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => handleViewChalan(chalan)}>
            <Eye size={16} /> View Bilties
          </button>
          
          <button 
            className="btn btn" 
            style={{ backgroundColor: 'var(--secondary)', color: 'white' }}
            onClick={() => handlePrintChalan(chalan)}
            disabled={fetchingForPrint}
          >
            {fetchingForPrint && printChalanData?.id === chalan.id ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
            Print
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--danger)', color: 'white' }}
            onClick={() => handleDeleteChalan(chalan)}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
        
        {chalan.status === 'Pending' ? (
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700 }}
            onClick={() => updateChalanStatus(chalan.id, 'Transit')}
          >
            <Navigation size={16} /> GO (Start Transit)
          </button>
        ) : (
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--success)', color: 'white', fontWeight: 700 }}
            onClick={() => updateChalanStatus(chalan.id, 'Received')}
          >
            <Map size={16} /> REACH (Lahore)
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in flex gap-6" style={{ alignItems: 'flex-start' }}>
      
      {/* Removed Print Preview Modal */}

      {/* Hidden Print Target */}
      {printChalanData && (
        <div className="print-only" style={{ display: 'none' }} id="chalan-print-target">
          <PrintChalan chalan={printChalanData} bilties={printBiltiesData} />
        </div>
      )}

      {/* Main List Area */}
      <div style={{ flex: '1 1 60%' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Map className="text-primary"/> Transit Tracking
            </h1>
            <p className="text-muted mt-1">Monitor trucks ready for dispatch and currently on route.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted">Loading transit data...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            
            {/* Pending Dispatch */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings size={18} className="text-warning"/> Ready to Depart ({pendingChalans.length})
              </h2>
              {pendingChalans.length === 0 ? (
                <div className="text-muted text-sm p-8 bg-surface rounded-xl border border-border border-dashed text-center">No trucks waiting.</div>
              ) : (
                pendingChalans.map(c => <ChalanCard key={c.id} chalan={c} isTransit={false} />)
              )}
            </div>

            {/* In Transit */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Navigation size={18} className="text-primary"/> In Transit En Route ({transitChalans.length})
              </h2>
              {transitChalans.length === 0 ? (
                <div className="text-muted text-sm p-8 bg-surface rounded-xl border border-border border-dashed text-center">No trucks currently in transit.</div>
              ) : (
                transitChalans.map(c => <ChalanCard key={c.id} chalan={c} isTransit={true} />)
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* Side Panel for Viewing Chalan Items */}
      {selectedChalan && (
        <div className="card animate-fade-in" style={{ flex: '1 1 30%', position: 'sticky', top: '2rem' }}>
          <h2 className="text-lg font-bold border-b pb-3 mb-4">
            Loaded Bilties: {selectedChalan.truck_no}
          </h2>
          
          <div className="text-sm text-muted mb-4">
            Viewing items loaded onto Chalan #{selectedChalan.chalan_no}.
          </div>

          {loadingItems ? (
            <div className="text-center p-8 text-muted">Loading items...</div>
          ) : chalanItems.length === 0 ? (
            <div className="text-center p-8 text-muted">No items found.</div>
          ) : (
            <div className="flex-col gap-3 max-h-96 overflow-y-auto pr-2">
              {chalanItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-background border border-border rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">Bilty #{item.bilties?.bilty_no}</div>
                    <div className="text-xs text-muted">{item.bilties?.sender_name} → {item.bilties?.receiver_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{item.loaded_quantity} Qty</div>
                    <div className="text-xs text-muted">{item.bilties?.payment_status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <button className="btn btn-outline w-full" onClick={() => setSelectedChalan(null)}>
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitTracking;
