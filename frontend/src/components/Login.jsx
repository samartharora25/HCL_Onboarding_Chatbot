import React, { useState } from 'react';

const Login = ({ onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!name.trim() || !employeeId.trim()) {
      setErrorMsg('Name and Employee ID are required.');
      setLoading(false);
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, employeeId })
      });

      if (!response.ok) {
        throw new Error('Failed to log login event on the server.');
      }

      onAuthSuccess({ name, employeeId });
    } catch (error) {
      console.error('Login log error:', error);
      // Fallback: Proceed even if backend is offline for robustness
      onAuthSuccess({ name, employeeId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="HCL Logo" className="login-logo" />
          <h2>New Joiner Portal</h2>
          <p className="subtitle">HCL Tech Onboarding Verification</p>
        </div>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleAuth} className="login-form">
          <div className="form-group">
            <label className="label-style">Full Name</label>
            <input
              type="text"
              required
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-style"
            />
          </div>

          <div className="form-group">
            <label className="label-style">Employee ID</label>
            <input
              type="text"
              required
              placeholder="Enter your 7-digit Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="input-style"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit btn-active"
          >
            {loading ? 'Processing...' : 'Sign In to Assistant'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
