import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import Otp from '../models/otpModel.js';
import { sendWelcomeEmail, sendOtpEmail } from '../../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Signup function
export const signup = async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;
    
    if (!username || !email || !password || !usertype) {
      return res.render('signup', { error: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.render('signup', { error: 'User already exists with this email' });
    }
    if (existingUser && !existingUser.isVerified) {
        return res.redirect(`/userauth/verify-otp?email=${email}`);
    }

    let avatarUrl = '';
    if (usertype === 'Male') avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&facialHairType=Beard&clotheType=ShirtCrewNeck';
    else if (usertype === 'Female') avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&clotheType=BlazerShirt';
    else avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=Hat&clotheType=ShirtCrewNeck';

    const newUser = await User.create({ 
      username, 
      email, 
      password, 
      usertype,
      avatar: avatarUrl,
      isVerified: false // Ensure user is not verified initially
    });
    
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Delete any existing OTP for this email
    await Otp.deleteOne({ email: newUser.email });
    
    // Create new OTP
    await Otp.create({ email: newUser.email, otp: otp });
    
    // Send OTP email
    try {
      await sendOtpEmail({ email: newUser.email, name: newUser.username, otp: otp });
      console.log('OTP email sent successfully to:', newUser.email);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue even if email fails
    }
    
    // Redirect to OTP verification page
    res.redirect(`/userauth/verify-otp?email=${newUser.email}`); 

  } catch (error) {
    console.error('Signup error:', error);
    res.render('signup', { error: 'Signup failed. Please try again.' });
  }
};

// OTP പേജ് കാണിക്കാൻ
export const showOtpPage = (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.redirect('/userauth/showsignup');
    }
    res.render('otp', { email: email, error: null });
};

// OTP വെരിഫൈ ചെയ്യാൻ
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.render('otp', { email: email || '', error: 'Email and OTP are required.' });
        }
        
        const otpData = await Otp.findOne({ email });
        
        if (!otpData) {
            return res.render('otp', { email, error: 'OTP has expired or is invalid. Please sign up again.' });
        }

        // Compare the plain text OTP with the hashed OTP using the model method
        const isMatch = await otpData.compareOtp(otp);
        
        if (!isMatch) {
            return res.render('otp', { email, error: 'Invalid OTP entered.' });
        }

        // Update user as verified
        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        if (!user) {
            return res.render('otp', { email, error: 'User not found. Please sign up again.' });
        }
        
        // Delete the used OTP
        await Otp.deleteOne({ email });
        
        // Send welcome email
        try {
            await sendWelcomeEmail({ email: user.email, name: user.username });
            console.log('Welcome email sent successfully to:', user.email);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue even if email fails
        }

        // Redirect to login page
        res.redirect('/userauth/showlogin');

    } catch (error) {
        console.error('OTP verification error:', error);
        res.render('otp', { email: req.body.email || '', error: 'Verification failed. Please try again.' });
    }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    
    if (!user.isVerified) {
        return res.render('login', { error: 'Please verify your email before logging in. Check your email for the OTP.' });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    req.login(user, (err) => {
      if (err) return res.render('login', { error: 'Login failed.' });
      res.redirect('/userauth/home');
    });
  } catch (error) {
    res.render('login', { error: 'Login failed.' });
  }
};

// (showsignup, showlogin, home എന്നീ ഫംഗ്ഷനുകൾ മാറ്റമില്ലാതെ തുടരും)
export const showsignup = async (req,res)=>{
  res.render('signup', { error: null });
}

export const showlogin = async (req,res)=>{
  res.render('login', { error: null });
}

export const home = async (req,res)=>{
  try {
    const allEvents = await Event.find({});
    res.render('home', { 
        user: req.user, 
        events: allEvents 
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.redirect('/userauth/showlogin');
  }
}