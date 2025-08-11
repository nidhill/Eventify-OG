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
      // 1. Check if Google user already exists
      let existingUser = await User.findOne({ googleId: profile.id });

      // 2. If not, create a new user
      if (!existingUser) {
        existingUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          password: '',
          gender: 'Other',
          avatar: 'https://avataaars.io/?avatarStyle=Circle&topType=Hat&clotheType=ShirtCrewNeck',
          isVerified: true
        });

        // --- Send welcome email ---
        try {
          await sendWelcomeEmail({
            email: existingUser.email,
            name: existingUser.name
          });
        } catch (emailError) {
          console.error("Failed to send welcome email to Google user, but user was created:", emailError);
        }
      }

      // 3. Pass user to session
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
