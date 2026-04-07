import React from 'react';
import { Search, Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('spd_auth');
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <div className="header-company-info">
          <span className="header-company-name">Super Pak Data Goods Wale Transport Company</span>
          <span className="header-company-contact">Gate No 1 New Truck Stand Hawksbay Karachi | 03002024433</span>
        </div>
      </div>
      
      <div className="header-actions">
        <div className="relative header-search" style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search bilty, truck..." 
            className="input"
            style={{ paddingLeft: '2.5rem', width: '250px' }}
          />
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        
        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%', border: 'none' }}>
          <Bell size={18} className="text-muted" />
        </button>
        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', backgroundColor: 'var(--primary-light)' }}>
          <User size={18} style={{ color: 'var(--primary)' }} />
        </button>
        <button 
          onClick={handleLogout}
          className="btn btn-outline" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            color: '#ef4444',
            borderColor: '#fee2e2'
          }}
        >
          <LogOut size={16} /> <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
