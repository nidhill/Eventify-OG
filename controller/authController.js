import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import Otp from '../models/otpModel.js';
import { sendWelcomeEmail, sendOtpEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Signup function
export const signup = async (req, res) => {
  try {
    const { name, username, email, password, usertype } = req.body;
    
    if (!name || !username || !email || !password || !usertype) {
      return res.render('signup', { error: 'All fields are required' });
    }
    
    // Check for existing email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail && existingUserByEmail.isVerified) {
      return res.render('signup', { error: 'User already exists with this email' });
    }
    if (existingUserByEmail && !existingUserByEmail.isVerified) {
        return res.redirect(`/userauth/verify-otp?email=${email}`);
    }

    // Check for existing username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.render('signup', { error: 'Username already taken. Please choose a different username.' });
    }

    // Check for existing name (optional - you can remove this if you want to allow same names)
    const existingUserByName = await User.findOne({ name });
    if (existingUserByName) {
      return res.render('signup', { error: 'A user with this name already exists. Please use a different name.' });
    }

    // Generate avatar based on usertype
    let avatarUrl = '';
    if (usertype === 'attendee') {
      avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&clotheType=ShirtCrewNeck';
    } else if (usertype === 'creator') {
      avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=Hat&clotheType=BlazerShirt';
    } else {
      avatarUrl = 'https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&clotheType=ShirtCrewNeck';
    }

    const newUser = await User.create({ 
      name,
      username, 
      email, 
      password, 
      usertype,
      avatar: avatarUrl,
      isVerified: false // Ensure user is not verified initially
    });
    
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log('🔢 Generated OTP for signup:', otp);
    
    // Delete any existing OTP for this email
    await Otp.deleteOne({ email: newUser.email });
    console.log('🗑️ Deleted existing OTP for:', newUser.email);
    
    // Create new OTP
    await Otp.create({ email: newUser.email, otp: otp });
    console.log('💾 Stored OTP in database for:', newUser.email);
    
    // Send OTP email
    try {
      console.log('📧 Attempting to send OTP email...');
      console.log('📧 To:', newUser.email);
      console.log('📧 Name:', newUser.name);
      console.log('📧 OTP:', otp);
      
      const startTime = Date.now();
      await sendOtpEmail({ email: newUser.email, name: newUser.name, otp: otp });
      const endTime = Date.now();
      
      console.log('✅ OTP email sent successfully to:', newUser.email);
      console.log('⏱️ Email sent in:', endTime - startTime, 'ms');
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      console.error('❌ Email error details:', {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response
      });
      // Continue even if email fails
    }
    
    // Redirect to OTP verification page
    res.redirect(`/userauth/verify-otp?email=${newUser.email}`); 

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern.username) {
        return res.render('signup', { error: 'Username already taken. Please choose a different username.' });
      }
      if (error.keyPattern.email) {
        return res.render('signup', { error: 'Email already registered. Please use a different email or login.' });
      }
    }
    
    res.render('signup', { error: 'Signup failed. Please try again.' });
  }
};

// Check username availability
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.json({ available: false, message: 'Username is required' });
    }
    
    const existingUser = await User.findOne({ username });
    const available = !existingUser;
    
    res.json({ available, message: available ? 'Username available' : 'Username already taken' });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ available: false, message: 'Error checking username' });
  }
};

// OTP പേജ് കാണിക്കാൻ
export const showOtpPage = (req, res) => {
    const email = req.query.email;
    const error = req.query.error;
    const message = req.query.message;
    
    if (!email) {
        return res.redirect('/userauth/showsignup');
    }
    res.render('otp', { email: email, error: error, message: message });
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
            await sendWelcomeEmail({ email: user.email, name: user.name });
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

// Resend OTP functionality
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.redirect('/userauth/showsignup');
        }
        
        // Check if user exists and is not verified
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('otp', { email, error: 'User not found. Please sign up again.' });
        }
        
        if (user.isVerified) {
            return res.redirect('/userauth/showlogin');
        }
        
        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        console.log('🔢 Generated new OTP for resend:', otp);
        
        // Delete any existing OTP for this email
        await Otp.deleteOne({ email });
        console.log('🗑️ Deleted existing OTP for:', email);
        
        // Create new OTP
        await Otp.create({ email: email, otp: otp });
        console.log('💾 Stored new OTP in database for:', email);
        
        // Send OTP email
        try {
            console.log('📧 Attempting to resend OTP email...');
            console.log('📧 To:', email);
            console.log('📧 Name:', user.name);
            console.log('📧 OTP:', otp);
            
            const startTime = Date.now();
            await sendOtpEmail({ email: email, name: user.name, otp: otp });
            const endTime = Date.now();
            
            console.log('✅ OTP email resent successfully to:', email);
            console.log('⏱️ Email sent in:', endTime - startTime, 'ms');
            
            // Redirect back to OTP page with success message
            res.redirect(`/userauth/verify-otp?email=${email}&message=OTP resent successfully`);
        } catch (emailError) {
            console.error('❌ Failed to resend OTP email:', emailError);
            console.error('❌ Email error details:', {
                message: emailError.message,
                code: emailError.code,
                response: emailError.response
            });
            
            // Redirect back to OTP page with error message
            res.redirect(`/userauth/verify-otp?email=${email}&error=Failed to resend OTP. Please try again.`);
        }
        
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.redirect(`/userauth/verify-otp?email=${req.query.email || ''}&error=Failed to resend OTP. Please try again.`);
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
    
    // Check if the user is banned
    if (user.isBanned) {
        return res.render('login', { error: 'Your account has been suspended. Please contact support.' });
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
    // Import featured events utility
    const { getFeaturedEvents, getRotationStatus } = await import('../utils/featuredEvents.js');
    
    // Get rotating featured events (6 events that change every 10 minutes)
    const featuredEvents = await getFeaturedEvents(6);
    
    // Get rotation status for debugging
    const rotationStatus = getRotationStatus();
    console.log('🎯 Featured Events Status:', {
      featuredCount: featuredEvents.length,
      nextRotationIn: rotationStatus.nextRotationIn + ' minutes',
      lastRotation: rotationStatus.lastRotationTime
    });
    
    // Get all upcoming events for the main events section
    const currentDate = new Date();
    const allUpcomingEvents = await Event.find({
      date: { $gte: currentDate }
    }, {
      title: 1,
      description: 1,
      date: 1,
      location: 1,
      image: 1,
      price: 1,
      category: 1,
      createdBy: 1
    })
    .populate('createdBy', 'username name')
    .sort({ date: 1 })
    .limit(20); // Limit to 20 events for faster loading
    
    // Get some previous events for the previous events section
    const previousEvents = await Event.find({
      date: { $lt: currentDate }
    }, {
      title: 1,
      description: 1,
      date: 1,
      location: 1,
      image: 1,
      price: 1,
      category: 1,
      createdBy: 1
    })
    .populate('createdBy', 'username name')
    .sort({ date: -1 })
    .limit(10); // Limit to 10 previous events
    
    // Check if user is a new Google OAuth user who needs to choose user type
    const needsUserTypeSelection = req.user && 
                                 req.user.googleId && 
                                 !req.user.hasChosenUserType;
    
    console.log('User type selection check:', {
      userId: req.user?._id,
      username: req.user?.username,
      googleId: req.user?.googleId,
      usertype: req.user?.usertype,
      needsUserTypeSelection: needsUserTypeSelection
    });
    
    res.render('home', { 
        user: req.user, 
        featuredEvents: featuredEvents, // Rotating featured events
        events: allUpcomingEvents, // All upcoming events
        previousEvents: previousEvents, // Previous events
        needsUserTypeSelection: needsUserTypeSelection,
        rotationStatus: rotationStatus // For debugging
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.redirect('/userauth/showlogin');
  }
}

// New function to handle user type selection
export const updateUserType = async (req, res) => {
  try {
    const { usertype } = req.body;
    
    if (!usertype || !['attendee', 'creator'].includes(usertype)) {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }
    
    // Update user's usertype and mark that they've chosen
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { 
        usertype: usertype,
        hasChosenUserType: true // Mark that user has made their choice
      }, 
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update the session user
    req.user.usertype = usertype;
    req.user.hasChosenUserType = true;
    
    console.log('User type updated successfully:', updatedUser.username, 'usertype:', usertype);
    
    res.json({ success: true, message: 'User type updated successfully' });
  } catch (error) {
    console.error('Error updating user type:', error);
    res.status(500).json({ success: false, message: 'Failed to update user type' });
  }
}
