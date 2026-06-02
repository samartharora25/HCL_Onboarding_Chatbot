import React from 'react';

const Navbar = ({ onOpenAbout, user, onLogout }) => {
  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <img 
          src="/logo.png" 
          alt="HCL Tech Logo" 
          className="hcl-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/HCL_Technologies_logo.svg';
          }}
        />
        <h1 className="navbar-title">Welcome to HCL Tech Onboarding Chatbot</h1>
      </div>
      
      <nav className="navbar-right">
        <button 
          onClick={onOpenAbout} 
          className="nav-btn about-btn"
          title="View Onboarding Steps Summary"
        >
          ℹ️ About
        </button>
        
        {user && (
          <div className="navbar-user-section">
            <div className="user-info-badge">
              <span className="user-icon">👤</span>
              <div className="user-details-text">
                <span className="user-name">{user.name || user.email}</span>
                <span className="user-id">Emp ID: {user.employeeId || 'N/A'}</span>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="nav-btn logout-btn"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
