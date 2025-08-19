import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testSignup = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventify');
    console.log('Connected to database');

    // Test data
    const testUsers = [
      {
        name: 'Test User 1',
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
        usertype: 'attendee'
      },
      {
        name: 'Test User 2',
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        usertype: 'creator'
      }
    ];

    console.log('Testing signup functionality...');

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });

        if (existingUser) {
          console.log(`User ${userData.username} already exists, skipping...`);
          continue;
        }

        // Create new user
        const newUser = await User.create(userData);
        console.log(`✅ Successfully created user: ${newUser.name} (${newUser.username})`);
        
        // Verify the user was created correctly
        const createdUser = await User.findById(newUser._id);
        console.log(`   - Name: ${createdUser.name}`);
        console.log(`   - Username: ${createdUser.username}`);
        console.log(`   - Email: ${createdUser.email}`);
        console.log(`   - User Type: ${createdUser.usertype}`);
        console.log(`   - Verified: ${createdUser.isVerified}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error.message);
      }
    }

    // Test duplicate checks
    console.log('Testing duplicate checks...');
    
    try {
      const duplicateUser = await User.create({
        name: 'Duplicate User',
        username: 'testuser1', // This should fail
        email: 'duplicate@example.com',
        password: 'password123',
        usertype: 'attendee'
      });
      console.log('❌ Duplicate username check failed');
    } catch (error) {
      if (error.code === 11000 && error.keyPattern.username) {
        console.log('✅ Duplicate username check working correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    try {
      const duplicateEmail = await User.create({
        name: 'Duplicate Email',
        username: 'duplicateemail',
        email: 'test1@example.com', // This should fail
        password: 'password123',
        usertype: 'attendee'
      });
      console.log('❌ Duplicate email check failed');
    } catch (error) {
      if (error.code === 11000 && error.keyPattern.email) {
        console.log('✅ Duplicate email check working correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testSignup();
