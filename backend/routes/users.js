const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// =========================================================================
// 1. GET CURRENT USER PROFILE: GET /api/users/me
// Returns the profile of the currently logged-in user.
// Protected by JWT middleware.
// =========================================================================
router.get('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Select user details and also calculate their average rating from ratings table
    const query = `
      SELECT u.id, u.name, u.email, u.teach_skill, u.learn_skill, u.bio, u.created_at,
             IFNULL(AVG(r.stars), 0) AS avg_rating,
             COUNT(r.stars) AS rating_count
      FROM users u
      LEFT JOIN ratings r ON u.id = r.rated_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// =========================================================================
// 2. UPDATE CURRENT USER PROFILE: PUT /api/users/me
// Updates the logged-in user's teach/learn skills and bio.
// Protected by JWT middleware.
// =========================================================================
router.put('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { teach_skill, learn_skill, bio } = req.body;

  // Basic Validation: Skills can be empty initially but should not be null
  const teachSkillClean = teach_skill ? teach_skill.trim() : '';
  const learnSkillClean = learn_skill ? learn_skill.trim() : '';
  const bioClean = bio ? bio.trim() : '';

  try {
    await db.query(
      'UPDATE users SET teach_skill = ?, learn_skill = ?, bio = ? WHERE id = ?',
      [teachSkillClean, learnSkillClean, bioClean, userId]
    );

    // Retrieve updated profile and return it
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.teach_skill, u.learn_skill, u.bio, u.created_at,
              IFNULL(AVG(r.stars), 0) AS avg_rating,
              COUNT(r.stars) AS rating_count
       FROM users u
       LEFT JOIN ratings r ON u.id = r.rated_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// =========================================================================
// 3. LIST ALL USERS FOR BROWSING: GET /api/users
// Lists all other users.
// Supports an optional query parameter "?skill=javascript" to search by teach skill.
// Protected by JWT middleware so we can calculate connections relative to current user.
// =========================================================================
router.get('/', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const { skill } = req.query;

  try {
    // Building query dynamically based on search filter
    // We also select average rating and the connection request status between the logged-in user and each other user.
    // This allows the frontend to show buttons like "Pending", "Accept Request", "Connected", or "Connect".
    let query = `
      SELECT u.id, u.name, u.email, u.teach_skill, u.learn_skill, u.bio, u.created_at,
             IFNULL(AVG(rt.stars), 0) AS avg_rating,
             COUNT(rt.stars) AS rating_count,
             
             -- Find existing connection requests between current user and this user
             (SELECT status FROM requests 
              WHERE (sender_id = ? AND receiver_id = u.id) 
                 OR (sender_id = u.id AND receiver_id = ?)) AS connection_status,
                 
             (SELECT id FROM requests 
              WHERE (sender_id = ? AND receiver_id = u.id) 
                 OR (sender_id = u.id AND receiver_id = ?)) AS connection_request_id,
                 
             (SELECT sender_id FROM requests 
              WHERE (sender_id = ? AND receiver_id = u.id) 
                 OR (sender_id = u.id AND receiver_id = ?)) AS connection_sender_id
                 
      FROM users u
      LEFT JOIN ratings rt ON u.id = rt.rated_id
      WHERE u.id != ?  -- Exclude the current user from listings
    `;

    const queryParams = [
      currentUserId, currentUserId, // For connection_status
      currentUserId, currentUserId, // For connection_request_id
      currentUserId, currentUserId, // For connection_sender_id
      currentUserId                 // For u.id != ?
    ];

    // If a skill search query is passed, add a filter for it
    if (skill) {
      query += ` AND u.teach_skill LIKE ? `;
      queryParams.push(`%${skill.trim()}%`);
    }

    // Grouping by user ID since we are computing average rating (aggregate function)
    query += ` GROUP BY u.id ORDER BY u.name ASC`;

    const [usersList] = await db.query(query, queryParams);
    res.json(usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error listing users.' });
  }
});

module.exports = router;
