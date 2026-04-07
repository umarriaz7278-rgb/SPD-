import React, { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ChevronDown } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const contentRef = useRef(null);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    setShowArrow(!atBottom);
  };

  const scrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="layout-root">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="layout-main">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="layout-content no-scrollbar" ref={contentRef} onScroll={handleScroll}>
          <Outlet />
          {showArrow && (
            <button className="scroll-down-arrow" onClick={scrollDown} aria-label="Scroll down">
              <ChevronDown size={20} />
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
