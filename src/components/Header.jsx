import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-company-info">
        <span className="header-company-name">Super Pak Data Goods Wale Transport Company</span>
        <span className="header-company-contact">Gate No 1 New Truck Stand Hawksbay Karachi | 03002024433</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative" style={{ position: 'relative' }}>
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
      </div>
    </header>
  );
};

export default Header;
