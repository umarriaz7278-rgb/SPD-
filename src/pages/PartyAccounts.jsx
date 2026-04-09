import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PartyAccounts = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    party_name: '',
    contact_person: '',
    mobile_number: '',
    cnic: '',
    address: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('party_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      console.error('Error fetching parties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.party_name.trim()) {
      setFormError('Party Name is required.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('party_accounts').insert({
        party_name: form.party_name.trim(),
        contact_person: form.contact_person.trim(),
        mobile_number: form.mobile_number.trim(),
        cnic: form.cnic.trim(),
        address: form.address.trim(),
      });
      if (error) throw error;
      setForm({ party_name: '', contact_person: '', mobile_number: '', cnic: '', address: '' });
      setShowForm(false);
      fetchParties();
    } catch (err) {
      setFormError('Error saving party: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '0.875rem',
    background: 'var(--background)',
    color: 'var(--text-main)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    marginBottom: '0.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const th = {
    padding: '0.85rem 1rem',
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'left',
    borderBottom: '2px solid var(--border)',
    background: 'var(--surface)',
    whiteSpace: 'nowrap',
  };

  const td = {
    padding: '0.85rem 1rem',
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <Users size={26} color="var(--primary)" /> Party Accounts
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your customers and business parties.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <UserPlus size={16} /> Add Party
        </button>
      </div>

      {/* Add Party Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '500px', margin: '1rem', boxShadow: 'var(--shadow-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> Add New Party
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={labelStyle}>Party Name *</label>
                <input style={inputStyle} name="party_name" value={form.party_name} onChange={handleChange} placeholder="e.g. Al-Hamid Traders" />
              </div>
              <div>
                <label style={labelStyle}>Contact Person Name</label>
                <input style={inputStyle} name="contact_person" value={form.contact_person} onChange={handleChange} placeholder="e.g. Muhammad Hamid" />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input style={inputStyle} name="mobile_number" value={form.mobile_number} onChange={handleChange} placeholder="e.g. 03001234567" />
              </div>
              <div>
                <label style={labelStyle}>CNIC / ID Number</label>
                <input style={inputStyle} name="cnic" value={form.cnic} onChange={handleChange} placeholder="e.g. 42101-1234567-1" />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Full address..."
                />
              </div>

              {formError && (
                <p style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, margin: 0 }}>{formError}</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parties Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No parties added yet. Click "Add Party" to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Party Name</th>
                  <th style={th}>Contact Person</th>
                  <th style={th}>Mobile Number</th>
                  <th style={th}>CNIC</th>
                  <th style={th}>Address</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party, idx) => (
                  <tr
                    key={party.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.15s' }}
                  >
                    <td style={{ ...td, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ ...td, fontWeight: 800, color: 'var(--primary)' }}>{party.party_name}</td>
                    <td style={td}>{party.contact_person || '—'}</td>
                    <td style={td}>{party.mobile_number || '—'}</td>
                    <td style={td}>{party.cnic || '—'}</td>
                    <td style={{ ...td, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.address || '—'}</td>
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

export default PartyAccounts;
