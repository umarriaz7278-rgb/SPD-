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

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <aside className={`sidebar${isOpen ? ' sidebar-mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <Truck size={22} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1d4ed8' }}>SPD Transport</div>
          <div style={{ fontSize: '0.65rem', color: '#c0152a', fontWeight: 700, letterSpacing: '0.05em' }}>GOODS TRANSPORT</div>
        </div>
      </div>
      <nav className="sidebar-nav" onClick={onClose}>
        <div className="nav-section">Overview</div>
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        
        <div className="nav-section">Operations</div>
        <NavLink to="/bilty/create" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={17} /> New Booking
        </NavLink>
        <NavLink to="/warehouse" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Archive size={17} /> Karachi warehouse
        </NavLink>
        <NavLink to="/chalan" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Truck size={17} /> Challan
        </NavLink>
        
        <div className="nav-section">Tracking</div>
        <NavLink to="/transit" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Map size={17} /> Challan in Transit
        </NavLink>
        <NavLink to="/lahore" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <PackageCheck size={17} /> Arrivals
        </NavLink>
        <NavLink to="/lahore-warehouse" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Archive size={17} /> Delivery
        </NavLink>
        <NavLink to="/claims" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={17} /> Claim Management
        </NavLink>
        
        <div className="nav-section">History</div>
        <NavLink to="/bilty-history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={17} /> All Booking
        </NavLink>
        <NavLink to="/invoices" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={17} /> Invoices
        </NavLink>

        <div className="nav-section">Fleet Management</div>
        <NavLink to="/vehicles" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Truck size={17} /> Vehicle Settings
        </NavLink>

        <div className="nav-section">Accounts</div>
        <NavLink to="/ledger/cash" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Cash Ledger Karachi
        </NavLink>
        <NavLink to="/ledger/lahore" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Lahore Cash Ledger
        </NavLink>
        <NavLink to="/ledger/main-owner" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Main Owner Cash Ledger
        </NavLink>
        <NavLink to="/ledger/hammad" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={17} /> Hammad Cash Ledger
        </NavLink>
        <NavLink to="/ledger/party" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} /> Party Ledger
        </NavLink>
        <NavLink to="/broker-record" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} /> Broker Record
        </NavLink>
      </nav>

      {/* Bottom version tag */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: '#1d4ed8', textAlign: 'center', opacity: 0.9, fontWeight: 700 }}>
        SPD Transport System v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
