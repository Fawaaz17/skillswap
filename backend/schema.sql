-- Recreate the database from scratch to clean up all stale tables and constraints
DROP DATABASE IF EXISTS skillswap;
CREATE DATABASE skillswap;
USE skillswap;

-- Disable foreign key checks to safely drop and recreate tables with circular references
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================================
-- 1. USERS TABLE
-- Stores details about each student, including authentication credentials,
-- bio, and the skills they want to teach or learn.
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
  -- Unique identifier for each user, auto-incremented by the database
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- The display name of the user
  name VARCHAR(255) NOT NULL,
  
  -- Email address, unique so two users cannot sign up with the same email
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- The hashed password (never store plain text passwords!)
  password_hash VARCHAR(255) NOT NULL,
  
  -- The skill the user can teach (e.g., "Guitar", "Python")
  teach_skill VARCHAR(255) NOT NULL DEFAULT '',
  
  -- The skill the user wants to learn (e.g., "French", "React")
  learn_skill VARCHAR(255) NOT NULL DEFAULT '',
  
  -- A short description about the user (optional, can be empty or null)
  bio TEXT NULL,
  
  -- The timestamp when the user registered, defaults to the current time
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. REQUESTS TABLE
-- Tracks connect requests sent from one user (sender) to another (receiver).
-- =========================================================================
CREATE TABLE IF NOT EXISTS requests (
  -- Unique identifier for each connect request
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Foreign key linking to the user who sent the request
  sender_id INT NOT NULL,
  
  -- Foreign key linking to the user who receives the request
  receiver_id INT NOT NULL,
  
  -- Status of the connection request:
  -- - 'pending': the recipient hasn't responded yet
  -- - 'accepted': the recipient agreed to connect
  -- - 'declined': the recipient refused the request
  status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  
  -- The timestamp when the request was sent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relationships (foreign keys)
  -- ON DELETE CASCADE ensures if a user is deleted, their requests are cleaned up
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prevent sending multiple duplicate requests from the same sender to the same receiver
  UNIQUE KEY unique_sender_receiver (sender_id, receiver_id)
);

-- =========================================================================
-- 3. RATINGS TABLE (Optional Rating Feature)
-- Allows users to give a 1-5 star rating to their partner after a successful connect.
-- =========================================================================
CREATE TABLE IF NOT EXISTS ratings (
  -- Unique identifier for each rating entry
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- The connect request this rating is linked to
  request_id INT NOT NULL,
  
  -- The user who is giving the rating
  rater_id INT NOT NULL,
  
  -- The user who is being rated
  rated_id INT NOT NULL,
  
  -- Number of stars (1 to 5)
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  
  -- The timestamp when the rating was submitted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relationships (foreign keys)
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ensures a user can rate their partner only once per connection request
  UNIQUE KEY unique_request_rater (request_id, rater_id)
);

-- Re-enable foreign key checks for normal database operations
SET FOREIGN_KEY_CHECKS = 1;
