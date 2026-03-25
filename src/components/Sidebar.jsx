import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Archive, 
  Truck, 
  Map, 
  PackageCheck,
  AlertTriangle,
  Wallet,
  Users,
  History
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Truck size={22} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>SPD Transport</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600, letterSpacing: '0.05em' }}>GOODS TRANSPORT</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Overview</div>
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        
        <div className="nav-section">Operations</div>
        <NavLink to="/bilty/create" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={17} /> Create Bilty
        </NavLink>
        <NavLink to="/warehouse" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Archive size={17} /> Karachi warehouse
        </NavLink>
        <NavLink to="/chalan" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Truck size={17} /> Chalan Management
        </NavLink>
        
        <div className="nav-section">Tracking</div>
        <NavLink to="/transit" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Map size={17} /> Transit Tracking
        </NavLink>
        <NavLink to="/lahore" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <PackageCheck size={17} /> Lahore Receiving
        </NavLink>
        <NavLink to="/lahore-warehouse" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Archive size={17} /> Lahore Warehouse
        </NavLink>
        <NavLink to="/claims" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={17} /> Claim Management
        </NavLink>
        
        <div className="nav-section">History</div>
        <NavLink to="/bilty-history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={17} /> Bilty History
        </NavLink>

        <div className="nav-section">Accounts</div>
        <NavLink to="/ledger/cash" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Cash Ledger Karachi
        </NavLink>
        <NavLink to="/ledger/lahore" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Lahore Cash Ledger
        </NavLink>
        <NavLink to="/ledger/party" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} /> Party Ledger
        </NavLink>
        <NavLink to="/broker-record" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} /> Broker Record
        </NavLink>
      </nav>

      {/* Bottom version tag */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.8 }}>
        SPD Transport System v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
