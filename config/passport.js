import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ override: true });

// Only set up Google OAuth if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Setting up Google OAuth strategy...');
  
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Use env var first, otherwise default to localhost for development
             callbackURL: process.env.CALLBACK_URL || "http://localhost:5000/auth/google/callback"
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

        // 1. Check if Google user already exists (by googleId or email)
        let existingUser = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });

        if (existingUser) {
          console.log('Existing user found:', existingUser.username, 'isAdmin:', existingUser.isAdmin);
          
          // If user exists but doesn't have googleId, update it
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            await existingUser.save();
            console.log('Updated existing user with Google ID:', existingUser.username);
          }
          
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
          // Generate a valid username from displayName (remove spaces, special chars)
          const validUsername = profile.displayName
            .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
            .toLowerCase(); // Convert to lowercase
          
          // Ensure username is at least 3 characters
          const finalUsername = validUsername.length >= 3 ? validUsername : validUsername + '123';
          
          existingUser = await User.create({
            googleId: profile.id,
            name: profile.displayName, // Add the required name field
            username: finalUsername,
            email: profile.emails[0].value,
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
          sendWelcomeEmail({
            email: existingUser.email,
            name: existingUser.username
          });
          console.log('✅ Welcome email sent successfully to:', existingUser.email);
        } catch (emailError) {
          console.error("❌ Failed to send welcome email to Google user, but user was created:", emailError);
          console.error('Email error details:', {
            message: emailError.message,
            code: emailError.code,
            response: emailError.response
          });
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
  
  console.log('Google OAuth strategy configured successfully');
} else {
  console.log('Google OAuth credentials not found. Skipping Google OAuth setup.');
  console.log('To enable Google OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
}

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
