// Test script for OTP functionality
import { sendOtpEmail } from './utils/sendEmail.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

async function testOtpEmail() {
    try {
        console.log('🧪 Testing OTP email functionality...');
        
        // Test OTP email
        const testOtp = '123456';
        const testEmail = process.env.GMAIL_USER; // Send to yourself for testing
        const testName = 'Test User';
        
        console.log('📧 Sending OTP email...');
        console.log('📧 To:', testEmail);
        console.log('📧 Name:', testName);
        console.log('📧 OTP:', testOtp);
        
        const startTime = Date.now();
        const result = await sendOtpEmail({ 
            email: testEmail, 
            name: testName, 
            otp: testOtp 
        });
        const endTime = Date.now();
        
        if (result.success) {
            console.log('✅ OTP email test successful!');
            console.log('📧 Message ID:', result.messageId);
            console.log('⏱️ Email sent in:', endTime - startTime, 'ms');
            console.log('📧 Check your inbox for the OTP email.');
        } else {
            console.log('❌ OTP email test failed');
        }
        
    } catch (error) {
        console.error('❌ Error during OTP email test:', error.message);
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in your .env file');
        console.error('2. Verify that 2-factor authentication is enabled on your Gmail account');
        console.error('3. Ensure you\'re using an App Password (not your regular Gmail password)');
        console.error('4. Check that the App Password is 16 characters long with no spaces');
    }
}

// Run the test
testOtpEmail();
