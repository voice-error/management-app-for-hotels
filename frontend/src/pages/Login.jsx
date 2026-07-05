import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // VERY IMPORTANT: Accept the HttpOnly cookie
      });

      const data = await response.json();

      if (response.ok) {
        // Fetch full user context since login just returns a success message
        const userRes = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          login(userData);
          
          if (userData.role === 'SUPER_ADMIN') {
            navigate('/');
          } else if (userData.role === 'BUSINESS_ADMIN') {
            navigate('/business');
          } else {
            navigate('/'); // Fallback
          }
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>R&R Management</h2>
          <span className="label-mono">System Authentication</span>
        </div>
        
        {error && <div className="login-error badge badge-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label-mono">Operator ID (Email)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@saas.com"
              required 
            />
          </div>
          <div className="form-group">
            <label className="label-mono">Access Key (Password)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
