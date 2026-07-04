const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// =========================================================================
// 1. SEND CONNECT REQUEST: POST /api/requests
// Initiates a request from the logged-in user (sender) to another user (receiver).
// Protected by JWT middleware.
// =========================================================================
router.post('/', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id } = req.body;

  // Basic Validation
  if (!receiver_id) {
    return res.status(400).json({ error: 'Receiver ID is required.' });
  }

  // Prevent sending request to oneself
  if (parseInt(receiver_id) === senderId) {
    return res.status(400).json({ error: 'You cannot send a connection request to yourself.' });
  }

  try {
    // Check if the receiver exists in the database
    const [receivers] = await db.query('SELECT id FROM users WHERE id = ?', [receiver_id]);
    if (receivers.length === 0) {
      return res.status(404).json({ error: 'The user you are trying to connect with does not exist.' });
    }

    // Check if a request already exists between these two users (in either direction)
    const [existing] = await db.query(
      `SELECT id, sender_id, receiver_id, status FROM requests 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)`,
      [senderId, receiver_id, receiver_id, senderId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'A connect request already exists between you two.', 
        request: existing[0] 
      });
    }

    // Insert new request
    const [result] = await db.query(
      'INSERT INTO requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
      [senderId, receiver_id, 'pending']
    );

    res.status(201).json({
      message: 'Connection request sent successfully.',
      requestId: result.insertId,
      request: {
        id: result.insertId,
        sender_id: senderId,
        receiver_id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error sending connect request:', error);
    res.status(500).json({ error: 'Server error sending request.' });
  }
});

// =========================================================================
// 2. LIST SENT/RECEIVED REQUESTS: GET /api/requests
// Retrieves all requests sent OR received by the logged-in user.
// Protected by JWT middleware.
// =========================================================================
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Query requests and join user details for both sender and receiver.
    // This allows the frontend to show details of the matching partner.
    const query = `
      SELECT r.id, r.sender_id, r.receiver_id, r.status, r.created_at,
             s.name AS sender_name, s.email AS sender_email, s.teach_skill AS sender_teach, s.learn_skill AS sender_learn,
             rec.name AS receiver_name, rec.email AS receiver_email, rec.teach_skill AS receiver_teach, rec.learn_skill AS receiver_learn
      FROM requests r
      JOIN users s ON r.sender_id = s.id
      JOIN users rec ON r.receiver_id = rec.id
      WHERE r.sender_id = ? OR r.receiver_id = ?
      ORDER BY r.created_at DESC
    `;

    const [rows] = await db.query(query, [userId, userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving requests:', error);
    res.status(500).json({ error: 'Server error retrieving requests.' });
  }
});

// =========================================================================
// 3. RESPOND TO CONNECT REQUEST: PUT /api/requests/:id
// Accepts or declines a connection request.
// Only the receiver of the request is authorized to accept/decline.
// Protected by JWT middleware.
// =========================================================================
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id; // current logged-in user
  const requestId = req.params.id;
  const { status } = req.body; // should be 'accepted' or 'declined'

  // Input Validation
  if (!status || !['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'accepted' or 'declined'." });
  }

  try {
    // Find the request by ID
    const [requests] = await db.query('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Connection request not found.' });
    }

    const request = requests[0];

    // Ensure the current user is the recipient (receiver_id) of the request
    // The sender cannot accept/decline their own request!
    if (request.receiver_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized. Only the recipient can accept or decline this request.' });
    }

    // Update the request status
    await db.query('UPDATE requests SET status = ? WHERE id = ?', [status, requestId]);

    res.json({
      message: `Request successfully ${status}.`,
      request: {
        ...request,
        status
      }
    });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Server error responding to request.' });
  }
});

module.exports = router;
