import React, { useState, useEffect } from 'react';
import api from '../api';

/**
 * Requests Component displays Sent and Received connect requests.
 * Allows accepting/declining requests and leaving a star rating for accepted connects.
 */
export default function Requests({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track ratings submitted locally in state during the current session
  // format: { [requestId]: rating_stars }
  const [submittedRatings, setSubmittedRatings] = useState(() => {
    const saved = localStorage.getItem(`rated_requests_${currentUser.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Track hover state for stars in rating forms
  // format: { [requestId]: hover_value }
  const [hoverStars, setHoverStars] = useState({});
  const [selectedStars, setSelectedStars] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/requests');
      setRequests(response.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load connection requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    setError('');
    try {
      await api.put(`/requests/${requestId}`, { status });
      // Reload requests to show updated status
      fetchRequests();
    } catch (err) {
      console.error('Error responding to request:', err);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Could not process connection response.'
      );
    }
  };

  const handleRatingSubmit = async (requestId, partnerId) => {
    const stars = selectedStars[requestId];
    if (!stars) {
      alert('Please select a star rating first.');
      return;
    }

    try {
      await api.post('/ratings', {
        request_id: requestId,
        rated_id: partnerId,
        stars: stars
      });

      // Mark request as rated in local state and persist to localStorage
      const updated = { ...submittedRatings, [requestId]: stars };
      setSubmittedRatings(updated);
      localStorage.setItem(`rated_requests_${currentUser.id}`, JSON.stringify(updated));

      alert('Thank you! Your rating has been submitted.');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Could not submit rating. You might have already rated this user.'
      );
    }
  };

  // Filter requests based on tab
  const receivedRequests = requests.filter(r => r.receiver_id === currentUser.id);
  const sentRequests = requests.filter(r => r.sender_id === currentUser.id);

  // Helper to render star rating inputs
  const renderStarInput = (requestId, partnerId) => {
    const isRated = submittedRatings[requestId] !== undefined;
    const currentRating = isRated ? submittedRatings[requestId] : (selectedStars[requestId] || 0);
    const hoverVal = hoverStars[requestId] || 0;

    return (
      <div className="rating-form-container">
        <span className="rating-header">
          {isRated ? 'Your Feedback Submitted:' : 'Rate your exchange partner:'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="rating-stars-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-input-btn ${star <= (hoverVal || currentRating) ? 'selected' : ''}`}
                onClick={() => !isRated && setSelectedStars({ ...selectedStars, [requestId]: star })}
                onMouseEnter={() => !isRated && setHoverStars({ ...hoverStars, [requestId]: star })}
                onMouseLeave={() => !isRated && setHoverStars({ ...hoverStars, [requestId]: 0 })}
                disabled={isRated}
              >
                ★
              </button>
            ))}
          </div>

          {!isRated && (
            <button 
              className="btn btn-success" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => handleRatingSubmit(requestId, partnerId)}
              disabled={!selectedStars[requestId]}
            >
              Submit Rating
            </button>
          )}

          {isRated && (
            <span style={{ fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: '600' }}>
              ✓ Hired / Rated {currentRating} Stars
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: '1.5rem' }}>Connection Requests</h2>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedRequests.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading requests...</div>
      ) : activeTab === 'received' ? (
        // RECEIVED REQUESTS LIST
        receivedRequests.length === 0 ? (
          <div className="empty-state">No connect requests received yet.</div>
        ) : (
          <div className="requests-section">
            {receivedRequests.map((req) => (
              <div key={req.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="request-card">
                  <div className="request-info">
                    <span className="request-user-title">{req.sender_name}</span>
                    {req.status === 'accepted' ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '500' }}>
                        ✉️ Contact: {req.sender_email}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🔒 Email hidden until accepted
                      </span>
                    )}
                    <div className="request-skills">
                      <div>
                        <span className="skill-label label-teach" style={{ marginRight: '0.4rem' }}>Teaches</span>
                        <span style={{ color: 'var(--text-primary)' }}>{req.sender_teach || 'Not listed'}</span>
                      </div>
                      <div>
                        <span className="skill-label label-learn" style={{ marginRight: '0.4rem' }}>Wants</span>
                        <span style={{ color: 'var(--text-primary)' }}>{req.sender_learn || 'Not listed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="request-actions">
                    {req.status === 'pending' ? (
                      <>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleResponse(req.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleResponse(req.id, 'declined')}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className={`request-status status-${req.status}`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating Input if accepted */}
                {req.status === 'accepted' && renderStarInput(req.id, req.sender_id)}
              </div>
            ))}
          </div>
        )
      ) : (
        // SENT REQUESTS LIST
        sentRequests.length === 0 ? (
          <div className="empty-state">You have not sent any connect requests yet.</div>
        ) : (
          <div className="requests-section">
            {sentRequests.map((req) => (
              <div key={req.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="request-card">
                  <div className="request-info">
                    <span className="request-user-title">{req.receiver_name}</span>
                    {req.status === 'accepted' ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '500' }}>
                        ✉️ Contact: {req.receiver_email}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🔒 Email hidden until accepted
                      </span>
                    )}
                    <div className="request-skills">
                      <div>
                        <span className="skill-label label-teach" style={{ marginRight: '0.4rem' }}>Teaches</span>
                        <span style={{ color: 'var(--text-primary)' }}>{req.receiver_teach || 'Not listed'}</span>
                      </div>
                      <div>
                        <span className="skill-label label-learn" style={{ marginRight: '0.4rem' }}>Wants</span>
                        <span style={{ color: 'var(--text-primary)' }}>{req.receiver_learn || 'Not listed'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="request-actions">
                    <span className={`request-status status-${req.status}`}>
                      {req.status === 'pending' ? 'Pending Approval' : req.status}
                    </span>
                  </div>
                </div>

                {/* Rating Input if accepted */}
                {req.status === 'accepted' && renderStarInput(req.id, req.receiver_id)}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
