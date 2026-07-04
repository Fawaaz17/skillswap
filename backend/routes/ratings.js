const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// =========================================================================
// SUBMIT RATING: POST /api/ratings
// Allows a user to rate their connection partner (1-5 stars).
// Only allowed if the connection request status is 'accepted'.
// Protected by JWT middleware.
// =========================================================================
router.post('/', authenticateToken, async (req, res) => {
  const raterId = req.user.id; // The logged-in user rating someone else
  const { request_id, rated_id, stars } = req.body;

  // Basic Validation
  if (!request_id || !rated_id || !stars) {
    return res.status(400).json({ error: 'Request ID, Rated ID, and Stars rating are required.' });
  }

  const starCount = parseInt(stars);
  if (isNaN(starCount) || starCount < 1 || starCount > 5) {
    return res.status(400).json({ error: 'Stars rating must be a whole number between 1 and 5.' });
  }

  try {
    // 1. Fetch the request to verify it exists and is accepted
    const [requests] = await db.query('SELECT * FROM requests WHERE id = ?', [request_id]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Connection request not found.' });
    }

    const request = requests[0];

    if (request.status !== 'accepted') {
      return res.status(400).json({ error: 'You can only leave a rating after the connection request has been accepted.' });
    }

    // 2. Verify that the rater is actually part of this connect request
    const isSender = request.sender_id === raterId;
    const isReceiver = request.receiver_id === raterId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: 'Unauthorized. You are not a participant of this connection request.' });
    }

    // 3. Verify that the rated_id is the other participant in the connection
    const expectedRatedId = isSender ? request.receiver_id : request.sender_id;
    if (parseInt(rated_id) !== expectedRatedId) {
      return res.status(400).json({ error: 'Invalid rated user ID. You must rate the partner of this connection.' });
    }

    // 4. Check if this rater has already rated this connection
    const [existingRatings] = await db.query(
      'SELECT id FROM ratings WHERE request_id = ? AND rater_id = ?',
      [request_id, raterId]
    );

    if (existingRatings.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a rating for this connection.' });
    }

    // 5. Insert rating
    await db.query(
      'INSERT INTO ratings (request_id, rater_id, rated_id, stars) VALUES (?, ?, ?, ?)',
      [request_id, raterId, rated_id, starCount]
    );

    res.status(201).json({
      message: 'Rating submitted successfully.',
      rating: {
        request_id,
        rater_id: raterId,
        rated_id,
        stars: starCount
      }
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Server error submitting rating.' });
  }
});

module.exports = router;
