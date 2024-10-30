// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require('./routes/projectRoutes');
const templateRoutes = require('./routes/templateRoutes');
const apiRoutes = require('./routes/apiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const templateHandlers = require('./routes/templateHandlers');
const dispatchHandlers = require('./routes/dispatchHandlers');
const inboxRoutes = require('./routes/inboxRoutes');

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setting the templating engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

// Session configuration with connect-mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }),
);

// Make session available to all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  if (!sess.views) {
    sess.views = 1;
    console.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    console.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Route order is important - more specific routes first
// API Routes
app.use('/api', apiRoutes);

// Swagger UI setup
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication Routes (with /auth prefix)
app.use('/auth', authRoutes);

// Project-specific routes
app.use('/project', projectRoutes);

// Template Routes
app.use('/template', templateRoutes);

// Dispatch Routes
app.use('/dispatch', dispatchHandlers);

// Dashboard Route (should come after other routes to prevent conflicts)
app.use('/', dashboardRoutes);

// Root path response
app.get("/", (req, res) => {
  // If user is logged in, redirect to dashboard
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render("index");
});

// Custom 404 page
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'There was an error serving your request.'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
