import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  usertype: {
    type: String,
    enum: ['attendee', 'creator'], 
    default: 'attendee'        
  },
  googleId: String,
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Puthiya fields
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  hasChosenUserType: {
    type: Boolean,
    default: false
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function(pwd) {
  if (!this.password) {
    return false;
  }
  try {
    return await bcrypt.compare(pwd, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

export default mongoose.model('User', userSchema);