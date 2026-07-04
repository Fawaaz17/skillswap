const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// MIDDLEWARES
// =========================================================================
// Enable Cross-Origin Resource Sharing so our React frontend can query this API
app.use(cors());

// Parse incoming request bodies containing JSON data (available in `req.body`)
app.use(express.json());

// =========================================================================
// ROUTE REGISTRATION
// =========================================================================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const ratingRoutes = require('./routes/ratings');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ratings', ratingRoutes);

// Simple test route to verify server is online
app.get('/', (req, res) => {
  res.json({ message: 'SkillSwap API server is running!' });
});

// =========================================================================
// DATABASE CONNECTION CHECK & START SERVER
// =========================================================================
async function startServer() {
  try {
    // Attempt to test the database connection
    const connection = await db.getConnection();
    console.log('Successfully connected to the MySQL database pool.');
    connection.release(); // release the test connection back to the pool

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal Error: Could not connect to the database.');
    console.error('Make sure MySQL is running and your .env credentials are correct.');
    console.error(error.message);
    process.exit(1); // Exit process with failure code
  }
}

startServer();
