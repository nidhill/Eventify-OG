import express from 'express';
import passport from 'passport';
import { home, login, showlogin, showsignup, signup, showOtpPage, verifyOtp } from '../controller/authController.js';
import { isLoggedIn, isNotLoggedIn } from '../middlewares/authmiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', isNotLoggedIn, signup);
router.post('/login', isNotLoggedIn, login);
router.get('/showsignup', isNotLoggedIn, showsignup);
router.get('/showlogin', isNotLoggedIn, showlogin);

// OTP Routes
router.get('/verify-otp', isNotLoggedIn, showOtpPage);
router.post('/verify-otp', isNotLoggedIn, verifyOtp);

// Protected routes
router.get('/home', isLoggedIn, home);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/userauth/home');
    }
    res.redirect('/userauth/showlogin');
  });
});

export default router;
