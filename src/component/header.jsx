import React from 'react';
import collegeLogo from '../assets/collegeLogo.png';
import { useSidebar } from '../context/SidebarContext';
import { FaBars } from 'react-icons/fa';

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header style={{
      padding: '8px 16px',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            color: '#333',
          }}
          className="md:hidden"
        >
          <FaBars size={22} />
        </button>

        <h1 style={{
          margin: 0,
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 'bold',
          color: '#333',
          alignSelf: 'center',
          flex: 1,
          textAlign: 'center',
        }}>
          Govt Post Graduate College, Kohat
        </h1>

        <img
          src={collegeLogo}
          alt="Logo"
          style={{
            height: 'clamp(40px, 8vw, 80px)',
            width: 'auto',
          }}
        />
      </div>
    </header>
  );
};

export default Header;