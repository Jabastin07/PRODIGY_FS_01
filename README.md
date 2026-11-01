# PRODIGY_FS_01 - Secure User Authentication

Task 01 of the Prodigy InfoTech Full-Stack Web Development Internship.

A user authentication system with registration, login, protected routes, password hashing, session management and role-based access control.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- bcryptjs (password hashing)
- JSON Web Tokens stored in an httpOnly cookie (session management)
- helmet and express-rate-limit (extra security)
- Plain HTML, CSS and JavaScript frontend

## Features
- Register with name, email and password (validated on the server)
- Log in and log out
- Passwords hashed with bcrypt (12 salt rounds), never stored in plain text
- JWT session in an httpOnly, SameSite=strict cookie
- Protected routes: `/dashboard` (any logged-in user) and `/admin` (admin role only)
- Role-based access control: `user` and `admin`
- Login rate limiting against brute-force attacks
- Same error message for wrong email or wrong password

## Setup
1. Install Node.js (v18+) and MongoDB (local) or create a free MongoDB Atlas cluster.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your env file and edit it:
   ```bash
   cp .env.example .env      # Windows: copy .env.example .env
   ```
   Set `JWT_SECRET` to a long random string and `MONGO_URI` to your database. Set `ADMIN_EMAIL` to the email you will use to register the admin account.
4. Start the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000

## Try it
1. Register with the `ADMIN_EMAIL` address: you become an admin and see an "Admin panel" button.
2. Register a second account with another email: it is a normal user.
3. As the normal user, open http://localhost:3000/admin: you are sent back to the dashboard.
4. Log out, then open http://localhost:3000/dashboard: you are sent to the login page.

## API
| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | /api/auth/register | public | Create an account |
| POST | /api/auth/login | public | Log in |
| POST | /api/auth/logout | public | Clear the session cookie |
| GET | /api/auth/me | logged in | Current user |
| GET | /api/auth/users | admin | List all users |

## Project structure
```
server.js            app setup, page routes, database connection
models/User.js       user schema
middleware/auth.js   requireAuth (checks the token) and requireRole (checks the role)
routes/auth.js       register, login, logout, me, users
public/              HTML pages, CSS and browser JavaScript
```

## Deploying
Set `NODE_ENV=production` so the cookie is sent only over HTTPS, and use a MongoDB Atlas connection string for `MONGO_URI`.
