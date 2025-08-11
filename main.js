import express from 'express'
import dotenv from 'dotenv'
import connectTodbs from './db.js'
import authRouter from './routes/authRoute.js'
import eventRouter from './routes/eventRoute.js'
import bookingRouter from './routes/bookingRoute.js';
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

// Google OAuth routes (root level) - only if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      successRedirect: '/userauth/home',
      failureRedirect: '/userauth/showlogin' 
    })
  );
}

// Root route
app.get('/', (req, res) => {
  res.redirect('/userauth/showlogin');
});

// About page route
app.get('/about', (req, res) => {
    res.render('about'); 
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
