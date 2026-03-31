import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, Loader2 } from 'lucide-react';
import './Login.css';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate a brief delay for modern feel
    setTimeout(() => {
      if (username.toUpperCase() === 'ADMIN' && password === 'ADMIN2026') {
        localStorage.setItem('spd_auth', 'true');
        setAuth(true);
        navigate('/');
      } else {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="login-root">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <ShieldCheck size={48} color="var(--primary)" />
            </div>
            <h1>SPD Transport</h1>
            <p>Admin Control Panel Login</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="login-error">{error}</div>}
            
            <div className="login-input-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2026 Super Pak Data Transport Company</p>
            <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.6 }}>Secure Admin Access Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
