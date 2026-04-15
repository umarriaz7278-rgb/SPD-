import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { supabase } from '../lib/supabase';
import { FileText, Users, Truck, UserCheck, ChevronUp, ChevronDown } from 'lucide-react';

// â”€â”€â”€ Donut Chart for Last 20 Bilty Freight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BiltyDonutChart = ({ bilties }) => {
  if (!bilties || bilties.length === 0) {
    return (
      <div className="bma-donut-empty">No data</div>
    );
  }
  const total = bilties.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const colors = [
    '#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#10b981', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#eab308', '#3b82f6', '#84cc16',
    '#fb923c', '#e879f9', '#4ade80', '#38bdf8', '#fbbf24',
  ];
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = bilties.map((b, i) => {
    const val = Number(b.total_amount || 0);
    const len = total > 0 ? (val / total) * circ : 0;
    const seg = { offset, len, color: colors[i % colors.length] };
    offset += len;
    return seg;
  });

  const totalLac = (total / 100000).toFixed(2);

  return (
    <div className="bma-donut-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={circ * 0.25 - seg.offset}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="500">total</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18" fill="#111827" fontWeight="800">{totalLac}</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="13" fill="#374151" fontWeight="700">Lac</text>
      </svg>
    </div>
  );
};

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatCard = ({ icon, value, label }) => (
  <div className="bma-stat-card">
    <div className="bma-stat-left">
      <div className="bma-stat-value">{value}</div>
      <div className="bma-stat-label">{label}</div>
    </div>
    <div className="bma-stat-icon">{icon}</div>
  </div>
);

// â”€â”€â”€ Main Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];

  const [stats, setStats] = useState({
    totalBilties: 0,
    totalParties: 0,
    totalVehicles: 0,
    totalBrokers: 0,
    last10Commission: 0,
    last10Freight: 0,
  });
  const [last20Bilties, setLast20Bilties] = useState([]);
  const [last10Bilties, setLast10Bilties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableOpen, setTableOpen] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [
        biltiesCountRes,
        partiesCountRes,
        vehiclesCountRes,
        brokersCountRes,
        last10Res,
        last20Res,
      ] = await Promise.all([
        supabase.from('bilties').select('*', { count: 'exact', head: true }),
        supabase.from('party_accounts').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('brokers').select('*', { count: 'exact', head: true }),
        supabase
          .from('bilties')
          .select('bilty_no, bilty_date, total_amount, chalan_bilties(chalans(truck_no, vehicle_expense, labour_cost, commission_percentage, total_amount))')
          .order('bilty_no', { ascending: false })
          .limit(10),
        supabase
          .from('bilties')
          .select('bilty_no, total_amount')
          .order('bilty_no', { ascending: false })
          .limit(20),
      ]);

      const last10 = last10Res.data || [];
      const last10Freight = last10.reduce((s, b) => s + Number(b.total_amount || 0), 0);

      // Compute commission per bilty from its chalan (commission_percentage * chalan total_amount / bilties in chalan â‰ˆ bilty share)
      let last10Commission = 0;
      last10.forEach(b => {
        const cb = b.chalan_bilties?.[0];
        const chalan = cb?.chalans;
        if (chalan) {
          const pct = Number(chalan.commission_percentage || 0);
          const chalanTotal = Number(chalan.total_amount || 0);
          last10Commission += (pct / 100) * (Number(b.total_amount || 0));
        }
      });

      setStats({
        totalBilties: biltiesCountRes.count || 0,
        totalParties: partiesCountRes.count || 0,
        totalVehicles: vehiclesCountRes.count || 0,
        totalBrokers: brokersCountRes.count || 0,
        last10Commission: Math.round(last10Commission),
        last10Freight,
      });

      setLast20Bilties(last20Res.data || []);
      setLast10Bilties(last10);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNum = (n) =>
    Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bma-dash">
      {/* â”€â”€ Page Header â”€â”€ */}
      <div className="bma-page-header">
        <h1 className="bma-page-title">Dashboard</h1>
        <span className="bma-page-date">{today}</span>
      </div>

      {/* â”€â”€ Stats + Donut â”€â”€ */}
      <div className="bma-content-grid">
        {/* Left: 2Ã—3 stat cards */}
        <div className="bma-stats-grid">
          <StatCard
            icon={<FileText size={32} color="#6b7280" />}
            value={loading ? '...' : stats.totalBilties}
            label="Total Bilties"
          />
          <StatCard
            icon={<Users size={32} color="#6b7280" />}
            value={loading ? '...' : stats.totalParties}
            label="Total Parties"
          />
          <StatCard
            icon={<Truck size={32} color="#f97316" />}
            value={loading ? '...' : stats.totalVehicles}
            label="Total Vehicles"
          />
          <StatCard
            icon={<UserCheck size={32} color="#6b7280" />}
            value={loading ? '...' : stats.totalBrokers}
            label="Total Brokers"
          />
          <StatCard
            icon={null}
            value={loading ? '...' : formatNum(stats.last10Commission)}
            label="Last 10 Bilty Commission"
          />
          <StatCard
            icon={null}
            value={loading ? '...' : formatNum(stats.last10Freight)}
            label="Last 10 Bilty Freight"
          />
        </div>

        {/* Right: Donut Chart */}
        <div className="bma-donut-card">
          <div className="bma-donut-title">Last 20 Bilty Freight</div>
          <BiltyDonutChart bilties={last20Bilties} />
        </div>
      </div>

      {/* â”€â”€ Last 10 Bilties Table â”€â”€ */}
      <div className="bma-table-section">
        <button
          className="bma-table-section-header"
          onClick={() => setTableOpen(o => !o)}
        >
          <span className="bma-table-section-title">
            <span className="bma-star">â˜…</span> Last 10 Bilties
          </span>
          {tableOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {tableOpen && (
          <div className="bma-table-wrap">
            <table className="bma-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Bilty Freight</th>
                  <th>Vehicle Freight</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="bma-table-empty">Loading...</td>
                  </tr>
                ) : last10Bilties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bma-table-empty">No bilties found.</td>
                  </tr>
                ) : (
                  last10Bilties.map((b) => {
                    const cb = b.chalan_bilties?.[0];
                    const chalan = cb?.chalans;
                    const vehicleFreight = chalan
                      ? Number(chalan.vehicle_expense || 0) + Number(chalan.labour_cost || 0)
                      : 0;
                    const commission = chalan
                      ? Math.round((Number(chalan.commission_percentage || 0) / 100) * Number(b.total_amount || 0))
                      : 0;
                    return (
                      <tr key={b.bilty_no}>
                        <td>{b.bilty_no}</td>
                        <td>
                          {b.bilty_date
                            ? new Date(b.bilty_date).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : 'â€”'}
                        </td>
                        <td>{chalan?.truck_no || 'â€”'}</td>
                        <td>{Number(b.total_amount || 0).toLocaleString()}</td>
                        <td>{vehicleFreight.toLocaleString()}</td>
                        <td>{commission.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
