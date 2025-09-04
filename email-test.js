import { sendOtpEmail } from './utils/sendEmail.js';

// Test email system on startup
export const testEmailOnStartup = async () => {
    try {
        console.log('🚀 Testing email system on startup...');
        
        // Test OTP email
        await sendOtpEmail({
            email: 'hynidhil@gmail.com',
            name: 'Startup Test',
            otp: '123456'
        });
        
        console.log('✅ Email system test completed successfully on startup');
        return true;
    } catch (error) {
        console.error('❌ Email system test failed on startup:', error);
        return false;
    }
};
