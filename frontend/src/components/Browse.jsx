import React, { useState, useEffect } from 'react';
import api from '../api';

/**
 * Browse Listings Component shows cards for other students.
 * Includes search/filter by teach_skill and allows sending connection requests.
 */
export default function Browse({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchSkill, setSearchSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores user.id currently processing a request

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (skillFilter = '') => {
    setLoading(true);
    setError('');
    try {
      // Call endpoint with optional skill search query param
      const url = skillFilter ? `/users?skill=${encodeURIComponent(skillFilter)}` : '/users';
      const response = await api.get(url);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Could not retrieve listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(searchSkill);
  };

  const handleClearSearch = () => {
    setSearchSkill('');
    fetchUsers('');
  };

  const handleConnectRequest = async (receiverId) => {
    setActionLoading(receiverId);
    try {
      await api.post('/requests', { receiver_id: receiverId });
      
      // Refresh the user list so the connection status on the card is updated instantly
      fetchUsers(searchSkill);
    } catch (err) {
      console.error('Error sending connect request:', err);
      alert(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Could not send connect request.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to render rating stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className="star-icon"
          style={{ color: i <= fullStars ? '#eab308' : '#64748b' }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Helper to determine the text and state of the connection button
  const renderConnectButton = (user) => {
    const status = user.connection_status;
    const isSender = user.connection_sender_id === currentUser.id;

    if (status === 'accepted') {
      return (
        <button className="btn btn-secondary" disabled>
          🤝 Connected
        </button>
      );
    }

    if (status === 'pending') {
      if (isSender) {
        return (
          <button className="btn btn-secondary" disabled>
            🕒 Pending Sent
          </button>
        );
      } else {
        return (
          <button className="btn btn-primary" disabled>
            ✉️ Sent You Request
          </button>
        );
      }
    }

    if (status === 'declined') {
      return (
        <button className="btn btn-secondary" disabled>
          ❌ Declined
        </button>
      );
    }

    // Default: no connection exists, show action button
    return (
      <button 
        className="btn btn-primary" 
        onClick={() => handleConnectRequest(user.id)}
        disabled={actionLoading === user.id}
      >
        {actionLoading === user.id ? 'Connecting...' : 'Request to Connect'}
      </button>
    );
  };

  return (
    <div>
      <div className="browse-header">
        <h2 className="page-title">Explore Skill listings</h2>
        
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search by skill to teach (e.g. Python)"
            value={searchSkill}
            onChange={(e) => setSearchSkill(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {searchSkill && (
            <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading student listings...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          {searchSkill 
            ? `No students found who can teach "${searchSkill}".` 
            : 'No other listings available at the moment.'}
        </div>
      ) : (
        <div className="grid-layout">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="card-header">
                <div>
                  <h3 className="user-name">{user.name}</h3>
                  {user.connection_status === 'accepted' ? (
                    <span className="user-email">✉️ {user.email}</span>
                  ) : (
                    <span className="user-email" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                      🔒 Contact hidden
                    </span>
                  )}
                </div>
                
                {/* User Average Rating */}
                <div className="rating-display">
                  {renderStars(user.avg_rating)}
                  {user.avg_rating > 0 && (
                    <span className="rating-value">{parseFloat(user.avg_rating).toFixed(1)}</span>
                  )}
                </div>
              </div>

              {/* Skill Tags */}
              <div className="skills-container">
                <div className="skill-row">
                  <span className="skill-label label-teach">Teaches</span>
                  {user.teach_skill ? (
                    <span className="skill-value">{user.teach_skill}</span>
                  ) : (
                    <span className="skill-placeholder">Not listed</span>
                  )}
                </div>
                
                <div className="skill-row">
                  <span className="skill-label label-learn">Wants</span>
                  {user.learn_skill ? (
                    <span className="skill-value">{user.learn_skill}</span>
                  ) : (
                    <span className="skill-placeholder">Not listed</span>
                  )}
                </div>
              </div>

              {/* Bio snippet */}
              <p className="card-bio">
                {user.bio ? user.bio : "No bio provided yet by the student."}
              </p>

              {/* Card CTA */}
              <div className="card-footer" style={{ marginTop: 'auto' }}>
                {renderConnectButton(user)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
