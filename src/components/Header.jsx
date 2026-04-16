import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
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
          <Menu size={22} color="#ffffff" />
        </button>
        <div className="header-brand">
          <div className="header-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f97316" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="header-brand-text">SUPER PAK DATA GOODS</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-bell-wrap">
          <button className="header-bell-btn" aria-label="Notifications">
            <Bell size={20} color="#ffffff" />
          </button>
          <span className="header-bell-badge">2</span>
        </div>

        <div className="header-avatar-wrap">
          <div className="header-avatar-circle">
            <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#f0f0f0" />
              <circle cx="20" cy="16" r="7" fill="#aaa" />
              <ellipse cx="20" cy="34" rx="12" ry="8" fill="#aaa" />
            </svg>
          </div>
          <div className="header-welcome">
            <span className="header-welcome-text">Welcome,</span>
            <span className="header-welcome-name">Admin</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="header-logout-btn"
          title="Logout"
        >
          <LogOut size={16} color="#ffffff" />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
