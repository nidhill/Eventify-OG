import express from 'express'
import dotenv from 'dotenv'
import connectTodbs from './db.js'
import authRouter from './routes/authRoute.js'
import eventRouter from './routes/eventRoute.js'
import bookingRouter from './routes/bookingRoute.js';
import adminRouter from './routes/adminRoute.js'; 
import session from 'express-session'
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import './config/passport.js';
import methodOverride from 'method-override';

dotenv.config() 
const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Database connection
connectTodbs()

// Session configuration
app.use(session({
  secret: process.env.secretkey || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
app.use('/userauth', authRouter);
app.use('/events', eventRouter);
app.use('/booking', bookingRouter);
app.use('/admin', adminRouter); 



// Google OAuth routes (root level) - only if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Google OAuth credentials found, setting up routes...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
  
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      successRedirect: '/userauth/home',
      failureRedirect: '/userauth/auth/google/failure',
      failureFlash: true
    })
  );
  
  // Test route to check OAuth status
  app.get('/auth/google/status', (req, res) => {
    res.json({
      status: 'Google OAuth is configured',
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing',
      callbackUrl: "http://localhost:5000/auth/google/callback"
    });
  });
} else {
  console.log('Google OAuth credentials missing!');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
}

// Root route
app.get('/', (req, res) => {
  res.redirect('/userauth/showlogin');
});

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5000
    }
  });
});

// About page route
app.get('/about', (req, res) => {
    // Ensure user is always defined, even if null
    const user = req.user || null;
    res.render('about', { user: user }); 
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    url: req.url,
    method: req.method
  });
  
  // Check if it's a Google OAuth error
  if (err.name === 'TokenError' || err.code === 'invalid_grant') {
    console.log('Google OAuth error detected, redirecting to login...');
    return res.redirect('/userauth/showlogin?error=oauth_failed');
  }
  
  // Check if it's a validation error
  if (err.name === 'ValidationError') {
    console.log('Validation error detected');
    return res.status(400).send(`Validation Error: ${err.message}`);
  }
  
  // Check if it's a MongoDB error
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    console.log('MongoDB error detected');
    return res.status(500).send('Database error occurred. Please try again.');
  }
  
  res.status(500).send('Something went wrong! Please try again.');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
