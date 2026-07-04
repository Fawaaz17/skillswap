import React, { useState, useEffect } from 'react';
import api from './api';
import Auth from './components/Auth';
import Browse from './components/Browse';
import Profile from './components/Profile';
import Requests from './components/Requests';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse'); // 'browse' | 'profile' | 'requests'

  // Run on application start to check if the user is already logged in
  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Validate token by fetching the user's own profile info
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Session validation failed, clearing token:', err);
      // If token is invalid or expired, clear it from localStorage
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setView('browse'); // Redirect to browsing page after logging in
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setView('browse');
  };

  const handleProfileUpdate = (updatedUser) => {
    // Merge updated profile fields into current user state
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedUser
    }));
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="empty-state" style={{ border: 'none' }}>
          <h2>Loading SkillSwap...</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Connecting to server</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Auth (Login/Signup) card
  if (!currentUser) {
    return (
      <div className="app-container">
        <main className="main-content">
          <Auth onAuthSuccess={handleAuthSuccess} />
        </main>
      </div>
    );
  }

  // Render correct page view depending on current view state
  const renderView = () => {
    switch (view) {
      case 'profile':
        return <Profile onProfileUpdate={handleProfileUpdate} />;
      case 'requests':
        return <Requests currentUser={currentUser} />;
      case 'browse':
      default:
        return <Browse currentUser={currentUser} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setView('browse')}>
          ⚡ SkillSwap
        </div>
        
        <div className="nav-links">
          <button 
            className={`nav-item ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            🔍 Browse Listings
          </button>
          
          <button 
            className={`nav-item ${view === 'requests' ? 'active' : ''}`}
            onClick={() => setView('requests')}
          >
            ✉️ My Requests
          </button>
          
          <button 
            className={`nav-item ${view === 'profile' ? 'active' : ''}`}
            onClick={() => setView('profile')}
          >
            👤 Profile
          </button>
        </div>

        <div className="nav-user">
          <span className="welcome-text">
            Hi, <strong>{currentUser.name}</strong>
          </span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}
