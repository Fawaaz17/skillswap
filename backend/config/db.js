const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool.
// A pool is a cache of database connections that can be reused, which is much faster
// and more memory-efficient than opening and closing a connection for every single database query.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillswap',
  waitForConnections: true,
  connectionLimit: 10, // Max number of concurrent connections to keep open
  queueLimit: 0
});

// Export the pool so other modules (like our routes) can query the database.
module.exports = pool;
