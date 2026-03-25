import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { supabase } from '../lib/supabase';
import { Truck, BarChart2, Package, Bell, Search, Map, Activity } from 'lucide-react';

// Pakistan SVG Map (simplified routes)
const PakistanMap = () => (
  <svg viewBox="0 0 340 260" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <radialGradient id="mapGrad" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </radialGradient>
    </defs>
    <rect width="340" height="260" fill="url(#mapGrad)" />
    {/* Simplified Pakistan border shape */}
    <path
      d="M120,30 L160,25 L200,35 L230,60 L250,90 L255,120 L240,150 L220,175 L195,200 L170,215 L145,210 L120,190 L100,165 L85,140 L80,110 L90,80 L105,55 Z"
      fill="rgba(37,99,235,0.05)"
      stroke="#2563eb"
      strokeWidth="1.5"
      strokeDasharray="4,2"
    />
    {/* City dots */}
    <circle cx="150" cy="185" r="5" fill="#16a34a" opacity="0.9">
      <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
    </circle>
    <text x="158" y="189" fontSize="8" fill="#16a34a" fontWeight="bold">Karachi</text>
    <circle cx="170" cy="90" r="4" fill="#3b82f6" opacity="0.9">
      <animate attributeName="r" values="4;6;4" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <text x="178" y="94" fontSize="8" fill="#3b82f6" fontWeight="bold">Lahore</text>
    <circle cx="155" cy="120" r="3" fill="#10b981" opacity="0.8" />
    <text x="162" y="124" fontSize="7" fill="#10b981">Multan</text>
    {/* Route line */}
    <path d="M150,180 Q155,145 155,120 Q157,108 170,95" stroke="#16a34a" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.8">
      <animate attributeName="stroke-dashoffset" values="100;0" dur="3s" repeatCount="indefinite" />
    </path>
    {/* Moving truck on route */}
    <circle r="4" fill="#16a34a">
      <animateMotion dur="3s" repeatCount="indefinite" path="M150,180 Q155,145 155,120 Q157,108 170,95" />
    </circle>
  </svg>
);

// Animated Line Chart (SVG)
const MiniLineChart = () => (
  <svg viewBox="0 0 260 90" width="100%" height="90">
    <defs>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0,80 L40,65 L80,55 L120,35 L160,42 L200,20 L260,10" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    <path d="M0,80 L40,65 L80,55 L120,35 L160,42 L200,20 L260,10 L260,90 L0,90Z" fill="url(#lineGrad)" />
    {[{x:0,y:80},{x:40,y:65},{x:80,y:55},{x:120,y:35},{x:160,y:42},{x:200,y:20},{x:260,y:10}].map((p,i)=>(
      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#16a34a" />
    ))}
  </svg>
);

// Donut Chart
const DonutChart = ({ active, maintenance, idle }) => {
  const total = active + maintenance + idle;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const activeLen = (active / total) * circ;
  const maintLen = (maintenance / total) * circ;
  const idleLen = (idle / total) * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="donut-svg">
      <circle cx="45" cy="45" r={r} stroke="var(--border)" strokeWidth="12" fill="none" />
      <circle cx="45" cy="45" r={r} stroke="var(--primary)" strokeWidth="12" fill="none"
        strokeDasharray={`${activeLen} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <circle cx="45" cy="45" r={r} stroke="var(--success)" strokeWidth="12" fill="none"
        strokeDasharray={`${maintLen} ${circ}`} strokeDashoffset={circ * 0.25 - activeLen} strokeLinecap="round" />
      <circle cx="45" cy="45" r={r} stroke="var(--danger)" strokeWidth="12" fill="none"
        strokeDasharray={`${idleLen} ${circ}`} strokeDashoffset={circ * 0.25 - activeLen - maintLen} strokeLinecap="round" />
      <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--text-main)">{active}%</text>
    </svg>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ warehouse: 0, transit: 0, delivered: 0, profit: 0, claims: 0 });
  const [recentChalans, setRecentChalans] = useState([]);
  
  // New Senders Graph State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [topSenders, setTopSenders] = useState([]);
  const [loadingSenders, setLoadingSenders] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchTopSenders(selectedMonth); }, [selectedMonth]);

  const fetchTopSenders = async (monthStr) => {
    try {
      setLoadingSenders(true);
      // monthStr is 'YYYY-MM'
      const startDate = `${monthStr}-01`;
      
      // Get the last day of the month by rolling to day 0 of the next month
      const [year, month] = monthStr.split('-');
      const endDateObj = new Date(year, month, 0); 
      const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth()+1).padStart(2,'0')}-${String(endDateObj.getDate()).padStart(2,'0')}`;

      const { data, error } = await supabase
        .from('bilties')
        .select('sender_name, total_weight')
        .gte('bilty_date', startDate)
        .lte('bilty_date', endDate);

      if (error) throw error;

      // Group by sender
      const senderTotals = {};
      (data || []).forEach(b => {
        const name = b.sender_name?.trim()?.toUpperCase() || 'UNKNOWN';
        const weight = Number(b.total_weight) || 0;
        senderTotals[name] = (senderTotals[name] || 0) + weight;
      });

      // Convert to array, sort, and take top 5
      const sorted = Object.entries(senderTotals)
        .map(([name, weight]) => ({ name, weight }))
        .filter(item => item.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);

      setTopSenders(sorted);
    } catch (err) {
      console.error('Error fetching senders:', err);
    } finally {
      setLoadingSenders(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      const [{ count: wh }, { count: tr }, { count: del }, monthRes, claimRes, chalanRes] = await Promise.all([
        supabase.from('bilties').select('*', { count: 'exact', head: true }).eq('status', 'Warehouse'),
        supabase.from('bilties').select('*', { count: 'exact', head: true }).eq('status', 'Transit'),
        supabase.from('bilties').select('*', { count: 'exact', head: true }).eq('status', 'Delivered'),
        supabase.from('chalans').select('profit').gte('chalan_date', firstDay),
        supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('chalans').select('*').order('created_at', { ascending: false }).limit(4),
      ]);

      const profit = (monthRes.data || []).reduce((s, c) => s + Number(c.profit || 0), 0);

      setStats({ warehouse: wh || 0, transit: tr || 0, delivered: del || 0, profit, claims: claimRes.count || 0 });
      setRecentChalans(chalanRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Total for bar chart calculation
  const totalBilties = stats.warehouse + stats.transit + stats.delivered || 1;

  return (
    <div className="dash-root">


      {/* Top Row */}
      <div className="dash-grid">

        {/* Current Shipments - Bar Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Current Shipments</span>
            <button className="dash-card-menu">···</button>
          </div>

          <div className="bar-chart">
            <div className="bar-group">
              <span className="bar-value">{stats.warehouse}</span>
              <div className="bar" style={{ height: `${Math.max(20,(stats.warehouse/totalBilties)*100)}px`, background: 'linear-gradient(to top, #1d4ed8, #3b82f6)' }} />
              <span className="bar-label">Active</span>
            </div>
            <div className="bar-group">
              <span className="bar-value">{stats.transit}</span>
              <div className="bar" style={{ height: `${Math.max(20,(stats.transit/totalBilties)*100)}px`, background: 'linear-gradient(to top, #15803d, #16a34a)' }} />
              <span className="bar-label">Transit</span>
            </div>
            <div className="bar-group">
              <span className="bar-value">{stats.delivered}</span>
              <div className="bar" style={{ height: `${Math.max(20,(stats.delivered/totalBilties)*100)}px`, background: 'linear-gradient(to top, #059669, #10b981)' }} />
              <span className="bar-label">Delivered</span>
            </div>
          </div>

          <div className="bar-legend">
            <div className="bar-legend-item"><div className="bar-legend-dot" style={{ background: '#3b82f6' }}/> Active</div>
            <div className="bar-legend-item"><div className="bar-legend-dot" style={{ background: '#16a34a' }}/> Transit</div>
            <div className="bar-legend-item"><div className="bar-legend-dot" style={{ background: '#10b981' }}/> Delivered</div>
          </div>
        </div>

        {/* Live Fleet Tracker Map */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Live Fleet & Route Tracker</span>
            <button className="dash-card-menu">···</button>
          </div>
          <div className="dash-map">
            <PakistanMap />
            <div className="map-badge">Pakistan</div>
            <div className="map-status-pill"><span className="map-dot"></span>Real-Time Status</div>
            <button className="map-track-btn">🔍 Track</button>
          </div>
        </div>

        {/* Vehicle / Bilty Status Donut */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Status Overview</span>
            <button className="dash-card-menu">···</button>
          </div>
          <div className="donut-wrap" style={{ marginTop: '0.5rem' }}>
            <DonutChart active={75} maintenance={15} idle={10} />
            <div className="donut-legend">
              <div className="donut-legend-item">
                <div className="donut-legend-dot" style={{ background: '#3b82f6' }}/>
                <span>Active — {stats.warehouse} Bilties</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-dot" style={{ background: '#16a34a' }}/>
                <span>Transit — {stats.transit}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-dot" style={{ background: '#ef4444' }}/>
                <span>Claims — {stats.claims}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Monthly Profit</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>Rs {stats.profit.toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="dash-grid-bottom" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>

        {/* Revenue Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Revenue Overview</span>
            <button className="dash-card-menu">···</button>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>Daily earnings trend</p>
          <MiniLineChart />
          <div className="revenue-months">
            {['Jan','Feb','Mar','Apr','May','Jun'].map(m => (
              <span key={m} className="revenue-month">{m}</span>
            ))}
          </div>
        </div>

        {/* Recent Chalans */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent Chalans & Dispatch</span>
            <a href="/chalan" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>See All →</a>
          </div>
          {loading ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : recentChalans.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No chalans yet.</div>
          ) : (
            <div>
              {recentChalans.map((c, i) => (
                <div key={c.id} className="activity-item">
                  <div className="activity-icon">
                    <Truck size={14} color="#3b82f6" />
                  </div>
                  <div className="activity-text">
                    <div className="activity-title">{c.truck_no} — Chalan #{c.chalan_no}</div>
                    <div className="activity-sub">{c.from_city} → {c.to_city} • Rs {c.profit?.toLocaleString()} profit</div>
                  </div>
                  <div className="activity-time">
                    <span style={{ 
                      background: c.status === 'Transit' ? 'rgba(245,158,11,0.15)' : c.status === 'Received' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                      color: c.status === 'Transit' ? '#16a34a' : c.status === 'Received' ? '#10b981' : '#3b82f6',
                      padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600
                    }}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Parties Monthly Graph */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Top Senders by Weight</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: 'var(--background)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          
          {loadingSenders ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading Send Data...</div>
          ) : topSenders.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No data for {selectedMonth}</div>
          ) : (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {topSenders.map((sender, index) => {
                // max weight determines 100% width
                const maxWeight = topSenders[0].weight || 1; 
                const percentage = Math.max(5, (sender.weight / maxWeight) * 100);
                // Assign different gradients for top 5
                const colors = [
                  'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                  'linear-gradient(90deg, #15803d, #16a34a)',
                  'linear-gradient(90deg, #b45309, #f59e0b)',
                  'linear-gradient(90deg, #4c1d95, #8b5cf6)',
                  'linear-gradient(90deg, #0f766e, #14b8a6)'
                ];
                const barColor = colors[index % colors.length];

                return (
                  <div key={sender.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sender.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{sender.weight.toLocaleString()} KG</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '40px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: barColor, 
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent Activity Feed</span>
            <button className="dash-card-menu">···</button>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Package size={14} color="#10b981" /></div>
            <div className="activity-text">
              <div className="activity-title">New Bilty Created</div>
              <div className="activity-sub">Added to Warehouse inventory</div>
            </div>
            <div className="activity-time">Now</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Truck size={14} color="#16a34a" /></div>
            <div className="activity-text">
              <div className="activity-title">Chalan Generated</div>
              <div className="activity-sub">Truck dispatched to Lahore</div>
            </div>
            <div className="activity-time">3m</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Map size={14} color="#3b82f6" /></div>
            <div className="activity-text">
              <div className="activity-title">Lahore Receiving</div>
              <div className="activity-sub">Goods verified at Lahore</div>
            </div>
            <div className="activity-time">7m</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Activity size={14} color="#ef4444" /></div>
            <div className="activity-text">
              <div className="activity-title">Claim Filed</div>
              <div className="activity-sub">Shortage reported in delivery</div>
            </div>
            <div className="activity-time">12m</div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <a href="/bilty/create" style={{ 
              display: 'block', textAlign: 'center', 
              background: 'var(--primary)', 
              color: 'white', borderRadius: '12px',
              padding: '0.85rem', fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              transition: 'transform 0.2s'
            }}>
              + New Bilty / Shipment
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
