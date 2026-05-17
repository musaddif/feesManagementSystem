import React from 'react';
import collegeLogo from '../assets/collegeLogo.png';

const Header = () => {
  return (
    <header style={{
           padding: '8px 16px',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent:"space-between"
      }}>
          <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          alignSelf: 'center'
        }}>
          Govt Post Graduate College, Kohat
        </h1>
        <img 
          src={collegeLogo} 
          alt="Logo"
          style={{
            height: '80px',
            width: 'auto'
          }}
        />
      
      </div>
    </header>
  );
};

export default Header;