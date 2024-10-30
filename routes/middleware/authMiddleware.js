const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    // Store the intended destination URL in the session
    req.session.returnTo = req.originalUrl;
    // Redirect to login page
    return res.redirect('/auth/login');
  }
};

module.exports = {
  isAuthenticated
};
