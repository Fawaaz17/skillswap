import React, { useState, useEffect } from 'react';
import api from '../api';

/**
 * Profile Component allows the student to update their teach/learn skills and bio.
 * It also displays their average rating received from other students.
 */
export default function Profile({ onProfileUpdate }) {
  const [teachSkill, setTeachSkill] = useState('');
  const [learnSkill, setLearnSkill] = useState('');
  const [bio, setBio] = useState('');
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch the logged-in user's profile on component load
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users/me');
      const { teach_skill, learn_skill, bio, avg_rating, rating_count } = response.data;
      
      setTeachSkill(teach_skill || '');
      setLearnSkill(learn_skill || '');
      setBio(bio || '');
      setAvgRating(parseFloat(avg_rating) || 0);
      setRatingCount(parseInt(rating_count) || 0);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');
    setSubmitting(true);

    try {
      const response = await api.put('/users/me', {
        teach_skill: teachSkill,
        learn_skill: learnSkill,
        bio
      });

      setSuccessMsg('Profile updated successfully!');
      
      // Update global user state in parent App component
      if (onProfileUpdate) {
        onProfileUpdate(response.data.user);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to update profile.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading profile...</div>;
  }

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

  return (
    <div className="profile-container">
      <h2 className="profile-title">Your Profile</h2>

      {/* Average rating card */}
      <div className="profile-rating-info">
        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Your Rating:</span>
        <div className="rating-display">
          {renderStars(avgRating)}
          <span className="rating-value" style={{ marginLeft: '0.25rem' }}>
            {avgRating > 0 ? avgRating.toFixed(1) : 'No reviews yet'}
          </span>
          {ratingCount > 0 && <span className="rating-count">({ratingCount} reviews)</span>}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="teach">Skill You Can Teach</label>
          <input
            id="teach"
            type="text"
            className="form-control"
            placeholder="e.g. Guitar, Python, Calculus"
            value={teachSkill}
            onChange={(e) => setTeachSkill(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="learn">Skill You Want to Learn</label>
          <input
            id="learn"
            type="text"
            className="form-control"
            placeholder="e.g. React, Spanish, Photography"
            value={learnSkill}
            onChange={(e) => setLearnSkill(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bio">Short Bio (Optional)</label>
          <textarea
            id="bio"
            className="form-control"
            rows="4"
            placeholder="Tell other students a bit about yourself, your experience, or when you are free to swap skills..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }} 
          disabled={submitting}
        >
          {submitting ? 'Saving Changes...' : 'Save Profile Details'}
        </button>
      </form>
    </div>
  );
}
