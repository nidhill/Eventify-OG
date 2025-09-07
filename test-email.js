// Test script for Gmail SMTP configuration
import { sendEmail } from './utils/sendEmail.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

async function testEmail() {
    try {
        console.log('🧪 Testing Gmail SMTP configuration...');
        
        // Test email configuration
        const testEmail = {
            to: process.env.GMAIL_USER, // Send to yourself for testing
            subject: 'Eventify Gmail SMTP Test',
            text: 'This is a test email to verify Gmail SMTP configuration is working correctly.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0056b3;">🎉 Gmail SMTP Test Successful!</h2>
                    <p>This email confirms that your Gmail SMTP configuration is working correctly.</p>
                    <p><strong>Configuration Details:</strong></p>
                    <ul>
                        <li>Service: Gmail SMTP</li>
                        <li>From: ${process.env.GMAIL_USER}</li>
                        <li>To: ${process.env.GMAIL_USER}</li>
                        <li>Timestamp: ${new Date().toISOString()}</li>
                    </ul>
                    <p>Your Eventify application is now ready to send emails!</p>
                </div>
            `
        };
        
        const result = await sendEmail(testEmail);
        
        if (result.success) {
            console.log('✅ Gmail SMTP test successful!');
            console.log('📧 Message ID:', result.messageId);
            console.log('📧 Check your inbox for the test email.');
        } else {
            console.log('❌ Gmail SMTP test failed');
        }
        
    } catch (error) {
        console.error('❌ Error during Gmail SMTP test:', error.message);
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in your .env file');
        console.error('2. Verify that 2-factor authentication is enabled on your Gmail account');
        console.error('3. Ensure you\'re using an App Password (not your regular Gmail password)');
        console.error('4. Check that the App Password is 16 characters long with no spaces');
    }
}

// Run the test
testEmail();
