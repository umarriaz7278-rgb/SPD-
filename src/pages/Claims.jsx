import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('claims')
        .select(`
          *,
          chalans(chalan_no),
          bilties(bilty_no, sender_name, receiver_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setClaims(claims.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      alert('Error updating claim: ' + err.message);
    }
  };

  const deleteClaim = async (id) => {
    if (!window.confirm("Are you sure you want to delete this claim record?")) return;
    try {
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setClaims(claims.filter(c => c.id !== id));
    } catch (err) {
      alert('Error deleting claim: ' + err.message);
    }
  };

  const pendingClaims = claims.filter(c => c.status === 'Pending');
  const resolvedClaims = claims.filter(c => c.status === 'Resolved');

  const ClaimTable = ({ data, isResolved }) => (
    data.length === 0 ? (
      <div className="p-8 text-center text-muted border border-dashed border-border rounded">No {isResolved ? 'resolved' : 'pending'} claims.</div>
    ) : (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Truck / Chalan</th>
              <th>Bilty No</th>
              <th>Party Details</th>
              <th>Shortage Qty</th>
              <th>Claim Amount</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => (
              <tr key={c.id} style={{ backgroundColor: isResolved ? 'transparent' : 'var(--danger-light)', borderLeft: isResolved ? 'none' : '4px solid var(--danger)' }}>
                <td>{new Date(c.claim_date).toLocaleDateString()}</td>
                <td>
                  <div className="font-bold">{c.truck_no}</div>
                  <div className="text-xs text-muted">Chalan #{c.chalans?.chalan_no}</div>
                </td>
                <td className="font-bold text-primary">#{c.bilties?.bilty_no}</td>
                <td>
                  <div className="text-sm">{c.bilties?.sender_name}</div>
                  <div className="text-xs text-muted">to {c.bilties?.receiver_name}</div>
                </td>
                <td className="font-bold text-danger">{c.missing_quantity}</td>
                <td>Rs {c.claim_amount}</td>
                <td>
                  <div className="flex gap-2">
                    {!isResolved && (
                      <button 
                        className="btn" 
                        style={{ padding: '0.45rem', backgroundColor: 'var(--success)', color: 'white', borderRadius: '8px' }}
                        title="Mark as Resolved"
                        onClick={() => updateClaimStatus(c.id, 'Resolved')}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.45rem', borderRadius: '8px' }}
                      title="Delete Record"
                      onClick={() => deleteClaim(c.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-danger"/> Claim Management
          </h1>
          <p className="text-muted mt-1">Manage shortages from Lahore warehouse receiving.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-muted"><Loader2 className="animate-spin" size={32}/></div>
      ) : (
        <div className="flex-col gap-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-danger">Pending Claims ({pendingClaims.length})</h2>
            <ClaimTable data={pendingClaims} isResolved={false} />
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-success">Resolved Claims History ({resolvedClaims.length})</h2>
            <ClaimTable data={resolvedClaims} isResolved={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Claims;
