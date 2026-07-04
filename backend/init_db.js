const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script to automatically initialize the database and tables from schema.sql.
 * This runs Node.js to read schema.sql and execute all DDL queries on MySQL.
 */
async function initDB() {
  console.log('Initializing database setup...');
  
  // Connect to MySQL server without specifying a database first, since the database
  // might not exist yet (schema.sql contains CREATE DATABASE IF NOT EXISTS).
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Allows executing multiple queries split by semi-colons
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying database schema from schema.sql...');
    // Execute the complete schema.sql file content
    await connection.query(sql);
    
    console.log('✓ Database and all tables initialized successfully!');
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
  } finally {
    await connection.end();
  }
}

initDB();
