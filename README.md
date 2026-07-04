# SkillSwap ⚡ - Peer-to-Peer Skill Exchange Platform

SkillSwap is a simple, modern full-stack web application designed for students to exchange skills. A student can list one skill they can teach (e.g., "Guitar") and one skill they want to learn (e.g., "Python"). Students can search through others' listings, send requests to connect, and rate their partners after their requests are accepted.

---

## 📂 Project Structure

- **`backend/`**: Express.js REST API + MySQL database integration.
  - `config/db.js`: Database pool configuration using `mysql2/promise`.
  - `middleware/auth.js`: Middleware for JWT authentication verification.
  - `routes/auth.js`: Endpoints for student Sign Up and Login.
  - `routes/users.js`: Profile retrieval, updates, and browse listing queries.
  - `routes/requests.js`: Connection request operations (create, list, respond).
  - `routes/ratings.js`: Peer ratings submission.
  - `schema.sql`: Database schema definition.
  - `server.js`: Server bootloader and entry point.
- **`frontend/`**: React client powered by Vite.
  - `src/api.js`: Axios client with a JWT request interceptor.
  - `src/components/Auth.jsx`: Login & signup forms.
  - `src/components/Browse.jsx`: listings browser with search filtering and connection CTAs.
  - `src/components/Profile.jsx`: User profile edit form showing their average rating.
  - `src/components/Requests.jsx`: Sent and Received connection request manager with star feedback form.
  - `src/App.jsx`: Global state coordinator and routing controller.
  - `src/index.css`: Elegant UI styles with smooth hover transitions.

---

## 🗄️ Database Schema & Table Choices (MySQL)

We use **3 tables** to represent the application model. Here is the breakdown:

### 1. `users` Table
Stores authentication details, personal bio, and the skills listed.
*   `id`: Primary key, auto-incremented by the database.
*   `name`: Student's display name.
*   `email`: Email address (marked `UNIQUE` to prevent multiple accounts using the same email).
*   `password_hash`: Secure representation of the password (never stored in plain text).
*   `teach_skill`: The skill the student is willing to teach.
*   `learn_skill`: The skill the student wants to acquire.
*   `bio`: Short descriptive bio (optional).
*   `created_at`: Registration timestamp.

### 2. `requests` Table
Tracks peer-to-peer connection invitations.
*   `id`: Primary key.
*   `sender_id`: The ID of the student sending the invitation (`FOREIGN KEY` referencing `users(id)`).
*   `receiver_id`: The ID of the student receiving the invitation (`FOREIGN KEY` referencing `users(id)`).
*   `status`: Current invitation state (`ENUM` representing `'pending'`, `'accepted'`, or `'declined'`).
*   `created_at`: The invitation timestamp.
*   *Key constraints*: `ON DELETE CASCADE` is set on foreign keys to automatically purge requests if a student deletes their account. A `UNIQUE KEY (sender_id, receiver_id)` ensures a user cannot spam multiple requests to the same student.

### 3. `ratings` Table (Feedback Loop)
Allows peer evaluations after successful connects.
*   `id`: Primary key.
*   `request_id`: Connect request this rating is linked to (`FOREIGN KEY` referencing `requests(id)`).
*   `rater_id`: The user leaving the rating.
*   `rated_id`: The user receiving the rating.
*   `stars`: Rating value between 1 and 5 stars.
*   *Key constraints*: A `UNIQUE KEY (request_id, rater_id)` ensures that a student can only rate their partner once per connection.

---

## 🔑 Key Backend Security Explanations (For Interviews/Vivas)

If an interviewer asks you about the security implementation, use these summaries:

### Why do we hash passwords using `Bcrypt`?
*   **Plain text is dangerous**: If our database gets leaked or compromised, plain text passwords expose user accounts immediately.
*   **One-Way Function**: Hashing is a mathematical algorithm that turns a password into a scrambled string of text. It cannot be reversed back into the original password.
*   **Salting (Rounds)**: Bcrypt adds a random value (a salt) and runs the algorithm multiple times (rounds). This makes it computationally slow and resistant to brute-force or dictionary attacks.
*   **Verification**: During login, we take the entered password, run it through the same Bcrypt process, and compare the resulting hash to the one stored in the database.

### How does JWT (JSON Web Token) authentication work?
*   **Stateless Sessions**: Instead of keeping track of logged-in sessions in the server's memory, we send a cryptographically signed token (JWT) to the frontend upon successful signup or login.
*   **Token Storage & Headers**: The React frontend stores this token in `localStorage`. For any protected route (like updating a profile or fetching requests), the frontend Axios client automatically sends this token in the headers as:
    `Authorization: Bearer <token>`
*   **Middleware Checks**: The backend interceptor middleware parses this token, validates the signature using our secret key, extracts the logged-in student's ID (`req.user.id`), and allows the request to complete. If the token is missing or has been edited/expired, the server rejects it with a `401 Unauthorized` status.

---

## 🚀 Setup & Installation Instructions

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or Command Line).
2. Execute the commands in `backend/schema.sql`. This will create the `skillswap` database and set up the `users`, `requests`, and `ratings` tables automatically.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Open the `.env` file and verify the configuration:
   *   Ensure the `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` match your local MySQL settings.
4. Run the Express server in development mode:
   ```bash
   npm run dev
   ```
   *The server will start on [http://localhost:5000](http://localhost:5000).*

### 3. Frontend Setup
1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the client packages:
   ```bash
   npm install
   ```
3. Boot the Vite React application:
   ```bash
   npm run dev
   ```
   *Open the URL provided in the terminal (usually [http://localhost:5173](http://localhost:5173)) in your browser.*

---

## ⚡ How to Test the Flow (Demo Guide)

To demonstrate how the platform works to examiners:
1. **Create User A**: Sign up as User A, navigate to your **Profile**, and enter "Python" under *Teach Skill*, "Guitar" under *Want to Learn*, and write a short bio. Save the profile.
2. **Create User B**: Log out, click sign up, and create User B. Go to the profile page and set "Guitar" under *Teach Skill* and "Python" under *Want to Learn*. Save the profile.
3. **Search & Connect**: Go to **Browse Listings** as User B. Search for "Python". User A's card will appear. Click **Request to Connect**. The button changes to "Pending Sent".
4. **Accept & Rate**: Log out of User B and log back in as User A. Click **My Requests**. In the *Received* tab, you will see a request from User B. Click **Accept**.
5. **Leave Ratings**: Once accepted, the card will display a star rating widget. Try leaving a 5-star rating for User B. User B can do the same for User A. If you check the profiles, you will see the average rating updated!
