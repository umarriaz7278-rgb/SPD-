import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart2, PenLine, Users, Settings, ChevronLeft,
  FileText, Receipt, Truck, DollarSign, BookUser, Wrench, UserCog, UserCircle,
  LayoutDashboard
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Bilty',
    icon: <FileText size={16} />,
    items: [
      { label: 'New Booking', to: '/bilty/create' },
      { label: 'All Bookings', to: '/bilty-history' },
    ],
  },
  {
    label: 'Bills',
    icon: <Receipt size={16} />,
    items: [
      { label: 'Invoices', to: '/invoices' },
    ],
  },
  {
    label: 'Trip Setup',
    icon: <Truck size={16} />,
    items: [
      { label: 'Challan', to: '/chalan' },
      { label: 'Challan in Transit', to: '/transit' },
      { label: 'Arrivals', to: '/lahore' },
      { label: 'Delivery', to: '/lahore-warehouse' },
    ],
  },
  {
    label: 'Financials',
    icon: <DollarSign size={16} />,
    items: [
      { label: 'Cash Ledger Karachi', to: '/ledger/cash' },
      { label: 'Lahore Cash Ledger', to: '/ledger/lahore' },
      { label: 'Main Owner Ledger', to: '/ledger/main-owner' },
      { label: 'Hammad Cash Ledger', to: '/ledger/hammad' },
    ],
  },
  {
    label: 'Master Accounts',
    icon: <BookUser size={16} />,
    items: [
      { label: 'Party Accounts', to: '/party-accounts' },
      { label: 'Broker Record', to: '/broker-record' },
    ],
  },
  {
    label: 'General Setups',
    icon: <Wrench size={16} />,
    items: [
      { label: 'Warehouse', to: '/warehouse' },
      { label: 'Claim Management', to: '/claims' },
    ],
  },
  {
    label: 'User Management',
    icon: <UserCog size={16} />,
    items: [
      { label: 'Vehicle Settings', to: '/vehicles' },
    ],
  },
  {
    label: 'Profile Setting',
    icon: <UserCircle size={16} />,
    items: [],
  },
];

const quickActions = [
  { icon: <BarChart2 size={18} />, color: '#16a34a', bg: '#dcfce7', to: '/', label: 'Dashboard' },
  { icon: <PenLine size={18} />, color: '#2563eb', bg: '#dbeafe', to: '/bilty/create', label: 'New Booking' },
  { icon: <Users size={18} />, color: '#ea580c', bg: '#ffedd5', to: '/party-accounts', label: 'Parties' },
  { icon: <Settings size={18} />, color: '#6b7280', bg: '#f3f4f6', to: '/vehicles', label: 'Settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [openGroups, setOpenGroups] = useState({});
  const navigate = useNavigate();

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleQuickAction = (to) => {
    navigate(to);
    onClose && onClose();
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f97316" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.2 }}>SPD TMS</div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.06em', marginTop: '2px' }}>TRANSPORT SYSTEM</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="sidebar-quick-actions">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            className="sidebar-quick-btn"
            style={{ background: qa.bg, color: qa.color }}
            onClick={() => handleQuickAction(qa.to)}
            title={qa.label}
          >
            {qa.icon}
          </button>
        ))}
      </div>

      {/* Dashboard direct link */}
      <nav className="sidebar-nav" onClick={() => {}}>
        <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end onClick={onClose}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        {/* Accordion menu groups */}
        {menuGroups.map((group) => (
          <div key={group.label} className="nav-group">
            <button
              className="nav-group-header"
              onClick={() => toggleGroup(group.label)}
            >
              <span className="nav-group-icon">{group.icon}</span>
              <span className="nav-group-label">{group.label}</span>
              <ChevronLeft
                size={14}
                className="nav-group-arrow"
                style={{
                  transform: openGroups[group.label] ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginLeft: 'auto',
                  opacity: 0.7,
                }}
              />
            </button>

            {openGroups[group.label] && group.items.length > 0 && (
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-sub-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em' }}>
        SPD Transport System v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
