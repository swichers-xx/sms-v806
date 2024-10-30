const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /register:
 *   get:
 *     summary: Registration page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: The registration page
 */
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects to the login page upon successful registration
 *       400:
 *         description: Validation error or duplicate username
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.render('register', { 
        error: 'Username and password are required',
        username: username
      });
    }

    if (password.length < 6) {
      return res.render('register', {
        error: 'Password must be at least 6 characters long',
        username: username
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', {
        error: 'Username already exists. Please choose a different username.',
        username: username
      });
    }

    // Create new user
    await User.create({ username, password });
    
    // Redirect to login with success message
    res.redirect('/auth/login?registered=true');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      error: 'An error occurred during registration. Please try again.',
      username: req.body.username
    });
  }
});

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Login page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: The login page
 */
router.get('/login', (req, res) => {
  const registered = req.query.registered === 'true';
  res.render('login', { 
    error: null,
    success: registered ? 'Registration successful! Please log in.' : null
  });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects to the dashboard upon successful login
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.render('login', {
        error: 'Username and password are required',
        username: username
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', {
        error: 'Invalid username or password',
        username: username
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.userId = user._id;
      // Redirect to returnTo URL if it exists, otherwise go to dashboard
      const returnTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo; // Clear the returnTo after using it
      return res.redirect(returnTo);
    } else {
      return res.render('login', {
        error: 'Invalid username or password',
        username: username
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.render('login', {
      error: 'An error occurred during login. Please try again.',
      username: req.body.username
    });
  }
});

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to the login page upon successful logout
 *       500:
 *         description: Error logging out
 */
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
