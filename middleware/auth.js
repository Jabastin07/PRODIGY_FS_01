const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads the JWT from the httpOnly cookie, verifies it, and loads the user.
// redirect:true  -> for page routes (sends the browser to /login)
// redirect:false -> for API routes (sends a 401 JSON response)
function requireAuth({ redirect = false } = {}) {
  return async (req, res, next) => {
    const deny = () =>
      redirect ? res.redirect('/login') : res.status(401).json({ message: 'Please log in first.' });
    try {
      const token = req.cookies.token;
      if (!token) return deny();
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return deny();
      req.user = user;
      next();
    } catch (err) {
      return deny();
    }
  };
}

// Role-based access control. Use AFTER requireAuth.
function requireRole(role, { redirect = false } = {}) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    return redirect
      ? res.redirect('/dashboard')
      : res.status(403).json({ message: 'You do not have permission to do that.' });
  };
}

module.exports = { requireAuth, requireRole };
