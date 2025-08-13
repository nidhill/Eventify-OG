import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';

dotenv.config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value
      });
      
      if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        console.error('No email found in Google profile');
        return done(new Error('Email is required for Google OAuth'), null);
      }
      
      // 1. Check if Google user already exists
      let existingUser = await User.findOne({ googleId: profile.id });
      
      if (existingUser) {
        console.log('Existing Google user found:', existingUser.username, 'isAdmin:', existingUser.isAdmin);
        // Ensure admin privileges for your email
        if (profile.emails[0].value === 'hynidhil@gmail.com' && !existingUser.isAdmin) {
          existingUser.isAdmin = true;
          await existingUser.save();
          console.log('Updated user to admin:', existingUser.username);
        }
      }

      // 2. If not, create a new user
      if (!existingUser) {
        console.log('Creating new Google user...');
        const isAdmin = profile.emails[0].value === 'hynidhil@gmail.com'; // Give admin to your email
        
        try {
          existingUser = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            password: '',
            usertype: 'attendee', // Default value, user can change later
            avatar: 'https://avataaars.io/?avatarStyle=Circle&topType=Hat&clotheType=ShirtCrewNeck',
            isVerified: true,
            isAdmin: isAdmin,
            hasChosenUserType: false // User hasn't chosen their type yet
          });
          console.log('New Google user created successfully:', existingUser.username, 'isAdmin:', isAdmin);
        } catch (createError) {
          console.error('Error creating user:', createError);
          return done(createError, null);
        }
      }

      // --- Send welcome email ---
      try {
        await sendWelcomeEmail({
          email: existingUser.email,
          name: existingUser.username
        });
        console.log('Welcome email sent successfully to:', existingUser.email);
      } catch (emailError) {
        console.error("Failed to send welcome email to Google user, but user was created:", emailError);
        // Continue even if email fails
      }

      // 3. Pass user to session
      if (!existingUser || !existingUser._id) {
        console.error('Invalid user object created');
        return done(new Error('Failed to create valid user'), null);
      }
      
      console.log('Google OAuth strategy completed successfully for:', existingUser.username);
      return done(null, existingUser);
    } catch (err) {
      console.error('Passport strategy error:', err);
      return done(err, null);
    }
  }
));

// Session handling
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
