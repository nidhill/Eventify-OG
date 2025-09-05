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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ override: true }) 
const app = express()

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
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  },
  // Add session store for better performance (optional)
  name: 'eventify.sid'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        email_user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        email_pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Email test endpoint
app.post('/test-email', async (req, res) => {
    try {
        const { sendOtpEmail } = await import('./utils/sendEmail.js');
        
        const result = await sendOtpEmail({
            email: process.env.EMAIL_USER || 'test@example.com',
            name: 'Test User',
            otp: '123456'
        });
        
        res.json({
            success: true,
            message: 'Gmail SMTP email test completed',
            result: result
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Gmail SMTP email test failed',
            error: error.message
        });
    }
});

// OTP email test endpoint
app.post('/test-otp', async (req, res) => {
    try {
        const { sendOtpEmail } = await import('./utils/sendEmail.js');
        
        console.log('🧪 Testing OTP email...');
        console.log('📧 Sending to:', process.env.EMAIL_USER);
        console.log('📧 OTP: 123456');
        
        const startTime = Date.now();
        const result = await sendOtpEmail({
            email: process.env.EMAIL_USER || 'test@example.com',
            name: 'Test User',
            otp: '123456'
        });
        const endTime = Date.now();
        
        console.log('✅ OTP email sent in:', endTime - startTime, 'ms');
        console.log('📧 Result:', result);
        
        res.json({
            success: true,
            message: 'OTP email test completed',
            result: result,
            timing: `${endTime - startTime}ms`
        });
    } catch (error) {
        console.error('❌ OTP email test failed:', error);
        res.json({
            success: false,
            message: 'OTP email test failed',
            error: error.message
        });
    }
});

// Test signup simulation
app.post('/test-signup', async (req, res) => {
    try {
        const { sendOtpEmail } = await import('./utils/sendEmail.js');
        
        console.log('🧪 Testing signup simulation...');
        
        // Simulate signup process
        const testEmail = 'test@example.com';
        const testName = 'Test User';
        const testOtp = '123456';
        
        console.log('📧 Simulating signup for:', testEmail);
        console.log('📧 Name:', testName);
        console.log('📧 OTP:', testOtp);
        
        const startTime = Date.now();
        await sendOtpEmail({ 
            email: testEmail, 
            name: testName, 
            otp: testOtp 
        });
        const endTime = Date.now();
        
        console.log('✅ Signup simulation OTP sent in:', endTime - startTime, 'ms');
        
        res.json({
            success: true,
            message: 'Signup simulation completed',
            email: testEmail,
            timing: `${endTime - startTime}ms`
        });
    } catch (error) {
        console.error('❌ Signup simulation failed:', error);
        res.json({
            success: false,
            message: 'Signup simulation failed',
            error: error.message
        });
    }
});

// Test OTP to your actual email
app.post('/test-otp-real', async (req, res) => {
    try {
        const { sendOtpEmail } = await import('./utils/sendEmail.js');
        
        console.log('🧪 Testing OTP to real email...');
        
        const realEmail = process.env.EMAIL_USER; // Your actual email
        const testName = 'Real Test User';
        const testOtp = '999999';
        
        console.log('📧 Sending OTP to real email:', realEmail);
        console.log('📧 Name:', testName);
        console.log('📧 OTP:', testOtp);
        
        const startTime = Date.now();
        const result = await sendOtpEmail({ 
            email: realEmail, 
            name: testName, 
            otp: testOtp 
        });
        const endTime = Date.now();
        
        console.log('✅ Real OTP email sent in:', endTime - startTime, 'ms');
        console.log('📧 Result:', result);
        
        res.json({
            success: true,
            message: 'Real OTP email sent successfully',
            email: realEmail,
            otp: testOtp,
            timing: `${endTime - startTime}ms`,
            result: result
        });
    } catch (error) {
        console.error('❌ Real OTP email failed:', error);
        res.json({
            success: false,
            message: 'Real OTP email failed',
            error: error.message
        });
    }
});

// Test OTP generation and sending (like in signup)
app.post('/test-signup-otp', async (req, res) => {
    try {
        const { sendOtpEmail } = await import('./utils/sendEmail.js');
        const Otp = (await import('./models/otpModel.js')).default;
        const crypto = await import('crypto');
        
        console.log('🧪 Testing OTP generation and sending (like in signup)...');
        
        const testEmail = process.env.EMAIL_USER; // Your actual email
        const testName = 'Signup Test User';
        
        // Generate OTP (like in signup)
        const otp = crypto.randomInt(100000, 999999).toString();
        console.log('🔢 Generated OTP for signup test:', otp);
        
        // Delete any existing OTP for this email
        await Otp.deleteOne({ email: testEmail });
        console.log('🗑️ Deleted existing OTP for:', testEmail);
        
        // Create new OTP
        await Otp.create({ email: testEmail, otp: otp });
        console.log('💾 Stored OTP in database for:', testEmail);
        
        // Send OTP email (like in signup)
        console.log('📧 Attempting to send OTP email...');
        console.log('📧 To:', testEmail);
        console.log('📧 Name:', testName);
        console.log('📧 OTP:', otp);
        
        const startTime = Date.now();
        await sendOtpEmail({ email: testEmail, name: testName, otp: otp });
        const endTime = Date.now();
        
        console.log('✅ OTP email sent successfully to:', testEmail);
        console.log('⏱️ Email sent in:', endTime - startTime, 'ms');
        
        res.json({
            success: true,
            message: 'Signup OTP test completed',
            email: testEmail,
            otp: otp,
            timing: `${endTime - startTime}ms`
        });
        
    } catch (error) {
        console.error('❌ Signup OTP test failed:', error);
        res.json({
            success: false,
            message: 'Signup OTP test failed',
            error: error.message
        });
    }
});

// Email status endpoint for admin
app.get('/admin/email-status', async (req, res) => {
    res.json({
        success: true,
        message: 'Gmail SMTP email system is running - all emails sent via Gmail SMTP',
        status: 'active',
        mode: 'gmail_smtp',
        provider: 'Gmail SMTP'
    });
});

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
      failureRedirect: '/userauth/showlogin?error=oauth_failed',
      failureFlash: true
    })
  );
  
  // Test route to check OAuth status
  app.get('/auth/google/status', (req, res) => {
    res.json({
      status: 'Google OAuth is configured',
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing',
      callbackUrl: process.env.CALLBACK_URL || "http://localhost:5000/auth/google/callback"
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
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('📧 Gmail SMTP email system initialized with debug logging');
    
    // Email system ready - all emails sent via Gmail SMTP
    console.log('📧 Email system ready - all emails will be sent via Gmail SMTP');
});
