import React, { useState } from 'react';
import api from '../api';

/**
 * Auth Component handles both student login and signup.
 * Toggles between modes using state.
 */
export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear inputs and error message when switching tabs
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic Input Validation
    if (!email.trim() || !password.trim()) {
      setError('Email and Password are required.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Name is required to sign up.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isLogin) {
        // Send login credentials to backend
        response = await api.post('/auth/login', { email, password });
      } else {
        // Send signup details to backend
        response = await api.post('/auth/signup', { name, email, password });
      }

      const { token, user } = response.data;

      // Save the JWT token in localStorage for authentication persistence
      localStorage.setItem('token', token);
      
      // Notify parent App component that authentication was successful
      onAuthSuccess(user);
    } catch (err) {
      console.error('Auth error response:', err);
      // Retrieve error message from server if available
      const errMsg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Authentication failed. Please check your credentials and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Join SkillSwap'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Connect with peers to teach and learn new skills' 
              : 'Create your account to start exchanging skills'}
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              New to SkillSwap? <span onClick={handleToggleMode}>Create an account</span>
            </p>
          ) : (
            <p>
              Already have an account? <span onClick={handleToggleMode}>Sign In</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
