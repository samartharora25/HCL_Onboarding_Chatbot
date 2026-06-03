import React, { useState } from 'react';
import Captcha from './Captcha';
import { supabase } from '../utils/supabaseClient';

const Login = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isSupabaseConfigured = !!supabase;

  const handleCaptchaVerify = (isValid, value) => {
    setCaptchaVerified(isValid);
    setCaptchaValue(value);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!captchaVerified) {
      setErrorMsg('Please complete the Captcha verification correctly.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Sign Up validation
      if (!name.trim() || !employeeId.trim()) {
        setErrorMsg('Name and Employee ID are required for Sign Up.');
        setLoading(false);
        return;
      }
      
      if (isSupabaseConfigured) {
        // Use Supabase signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              employee_id: employeeId
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
          setCaptchaRefreshTrigger(prev => prev + 1);
          setLoading(false);
        } else {
          setSuccessMsg('Account created successfully! Please sign in.');
          setIsSignUp(false);
          setLoading(false);
        }
      } else {
        // Simulated local auth signUp
        const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        if (mockUsers.some(u => u.email === email)) {
          setErrorMsg('An account with this email already exists.');
          setCaptchaRefreshTrigger(prev => prev + 1);
          setLoading(false);
          return;
        }

        mockUsers.push({ email, password, name, employeeId });
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));
        setSuccessMsg('Simulated account created successfully! Please sign in.');
        setIsSignUp(false);
        setLoading(false);
      }
    } else {
      // Sign In
      if (isSupabaseConfigured) {
        // Use Supabase signIn
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setErrorMsg(error.message);
          setCaptchaRefreshTrigger(prev => prev + 1);
          setLoading(false);
        } else {
          const userMeta = data.user.user_metadata;
          const authUser = {
            email: data.user.email,
            name: userMeta?.full_name || data.user.email,
            employeeId: userMeta?.employee_id || 'N/A'
          };
          onAuthSuccess(authUser);
          setLoading(false);
        }
      } else {
        // Simulated local auth signIn
        const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const foundUser = mockUsers.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          onAuthSuccess(foundUser);
          setLoading(false);
        } else {
          // Allow dynamic login for testing if no users exist
          if (mockUsers.length === 0) {
            const newUser = { email, name: email.split('@')[0], employeeId: 'EMP' + Math.floor(1000 + Math.random()*9000) };
            onAuthSuccess(newUser);
            setLoading(false);
          } else {
            setErrorMsg('Invalid email or password.');
            setCaptchaRefreshTrigger(prev => prev + 1);
            setLoading(false);
          }
        }
      }
    }
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="HCL Logo" className="login-logo" />
          <h2>{isSignUp ? 'New Joiner Registration' : 'New Joiner Portal'}</h2>
          <p className="subtitle">HCL Tech Onboarding Verification</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mock-badge">
            ⚡ Simulated Local Mode (Keys pending)
          </div>
        )}

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleAuth} className="login-form">
          {isSignUp && (
            <>
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
            </>
          )}

          <div className="form-group">
            <label className="label-style">Email Address</label>
            <input
              type="email"
              required
              placeholder="username@hcltech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-style"
            />
          </div>

          <div className="form-group">
            <label className="label-style">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-style"
            />
          </div>

          <Captcha 
            onVerify={handleCaptchaVerify} 
            refreshTrigger={captchaRefreshTrigger} 
          />

          <button
            type="submit"
            disabled={loading || !captchaVerified}
            className={`btn-submit ${(!captchaVerified || loading) ? 'btn-disabled' : 'btn-active'}`}
          >
            {loading ? 'Processing...' : isSignUp ? 'Register & Initialize' : 'Sign In to Assistant'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
