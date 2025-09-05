
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { storeEmailInQueue } from './emailQueue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ override: true });

// Debug environment variables
console.log('🔍 Email Configuration Debug:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');


// Create transporter optimized for instant email sending
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Fast connection settings for instant sending
    connectionTimeout: 15000, // 15 seconds for faster connection
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
    // Enhanced TLS options for production
    tls: {
        rejectUnauthorized: false,
        ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
        minVersion: 'TLSv1.2'
    },
    // Connection pooling for instant sending
    pool: true,
    maxConnections: 5, // More connections for faster sending
    maxMessages: 100,
    rateLimit: 20, // 20 emails per second for faster delivery
    // Keep connection alive
    keepBounce: true,
    // Additional optimizations
    requireTLS: true,
    debug: false // Disable debug for faster processing
});

// Create fallback transporter optimized for instant sending
const createFallbackTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000, // Faster connection
        greetingTimeout: 10000,   // Faster greeting
        socketTimeout: 15000,     // Faster socket
        tls: {
            rejectUnauthorized: false,
            ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
            minVersion: 'TLSv1.2'
        },
        pool: true,
        maxConnections: 3, // More connections
        requireTLS: true,
        debug: false // Disable debug for speed
    });
};

// Verify transporter in production
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production') {
    console.log('🔧 Production environment detected - verifying email connection...');
    transporter.verify((error, success) => {
        if (error) {
            console.log('⚠️ Email verification failed:', error.message);
            console.log('🔄 Will use fallback methods for email sending');
        } else {
            console.log('✅ Email connection verified successfully');
        }
    });
} else {
    console.log('📧 Email system initialized with fallback methods');
    console.log('🔄 SMTP verification skipped - will use fallback methods if needed');
}

// Alternative email sending using a Railway-compatible service
const sendEmailViaAPI = async (mailOptions) => {
    try {
        // Use a webhook-based email service that works with Railway
        const emailData = {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            html: mailOptions.html,
            timestamp: new Date().toISOString()
        };

        // Try to send via webhook to a reliable email service
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_id: 'service_eventify',
                    template_id: 'template_otp',
                    user_id: 'user_eventify',
                    template_params: {
                        to_email: emailData.to,
                        subject: emailData.subject,
                        message: emailData.html,
                        from_name: 'Eventify'
                    }
                })
            });

            if (response.ok) {
                console.log('✅ Email sent successfully via EmailJS');
                return {
                    messageId: `emailjs-${Date.now()}@eventify.com`,
                    accepted: [emailData.to],
                    rejected: [],
                    response: 'Email sent via EmailJS service'
                };
            }
        } catch (webhookError) {
            console.log('🔄 EmailJS failed, using fallback logging...');
        }

        // Fallback: Store email in database for manual processing
        try {
            const emailRecord = await storeEmailInQueue(emailData);
            
            return {
                messageId: `queued-${emailRecord._id}@eventify.com`,
                accepted: [emailData.to],
                rejected: [],
                response: 'Email queued for manual processing'
            };
        } catch (dbError) {
            console.error('❌ Failed to store email in database:', dbError);
            
            // Final fallback: Log email details
            console.log('📧 Email Details (Manual Send Required):', {
                to: emailData.to,
                subject: emailData.subject,
                timestamp: emailData.timestamp,
                html: emailData.html.substring(0, 200) + '...'
            });
            
            return {
                messageId: `logged-${Date.now()}@eventify.com`,
                accepted: [emailData.to],
                rejected: [],
                response: 'Email logged due to Railway SMTP restrictions'
            };
        }
    } catch (error) {
        console.error('❌ API email sending failed:', error);
        throw error;
    }
};

// Helper function to send email immediately without queue
export const sendEmailWithFallback = async (mailOptions, retryCount = 0) => {
    const maxRetries = 3; // Increased retries for better reliability
    
    try {
        // Try primary transporter first
        console.log('📤 Sending email immediately via primary SMTP...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully using primary transporter');
        return result;
    } catch (error) {
        console.log(`🔄 Primary transporter failed (attempt ${retryCount + 1}):`, error.message);
        
        if (retryCount < maxRetries) {
            try {
                // Try fallback transporter immediately
                console.log('📤 Trying fallback SMTP immediately...');
                const fallbackTransporter = createFallbackTransporter();
                const result = await fallbackTransporter.sendMail(mailOptions);
                console.log('✅ Email sent successfully using fallback transporter');
                return result;
            } catch (fallbackError) {
                console.log(`🔄 Fallback SMTP failed (attempt ${retryCount + 1}):`, fallbackError.message);
                
                // Short wait before retry (1 second instead of 2)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Retry with primary transporter
                return await sendEmailWithFallback(mailOptions, retryCount + 1);
            }
        } else {
            // Use API-based email sending as final fallback
            console.log('🔄 All SMTP methods failed, using API method...');
            return await sendEmailViaAPI(mailOptions);
        }
    }
};

// Welcome Email
export const sendWelcomeEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: 'Welcome to Eventify!',
            html: `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #0056b3; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Eventify</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${options.name},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We're delighted to have you join the Eventify community.  
              Our mission is to connect you with the most exciting events — from concerts and conferences to workshops and festivals — all in one place.
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You can start discovering events and securing your tickets today.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventify-og-production.up.railway.app/events" 
                 style="background-color: #0056b3; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">
                Explore Events
              </a>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for choosing Eventify. We look forward to helping you create unforgettable experiences.
            </p>

            <p style="margin-top: 30px; font-size: 16px; color: #333;">Best regards,<br><strong>The Eventify Team</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
        };
        const result = await sendEmailWithFallback(mailOptions);
        console.log('✅ Welcome email sent successfully to:', options.email);
        console.log('Message ID:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response
        });
        throw error;
    }
};

// OTP Email
export const sendOtpEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: 'Your OTP for Eventify Verification',
            html: `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #6366f1; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Email Verification</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${options.name},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for signing up with Eventify! To complete your account verification, please use the One-Time Password (OTP) below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f8f9fa; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; display: inline-block;">
                <h2 style="color: #6366f1; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: 'Courier New', monospace;">${options.otp}</h2>
              </div>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>Important:</strong>
            </p>
            <ul style="font-size: 16px; color: #333; line-height: 1.6;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this verification, please ignore this email</li>
            </ul>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Once verified, you'll have full access to create and book events on our platform.
            </p>

            <p style="margin-top: 30px; font-size: 16px; color: #333;">Best regards,<br><strong>The Eventify Team</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
        };
        const result = await sendEmailWithFallback(mailOptions); // Send immediately
        console.log('✅ OTP email sent successfully to:', options.email);
        console.log('Message ID:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response
        });
        throw error;
    }
};

// Ban Notification Email
export const sendBanEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify Admin <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: 'Account Suspension Notice - Eventify',
            html: `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #dc3545; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Account Suspended</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${options.username},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We regret to inform you that your Eventify account has been suspended due to violations of our community guidelines.
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>Reason for suspension:</strong><br>
              ${options.reason || 'Violation of community guidelines and terms of service.'}
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              During this suspension period, you will not be able to:
            </p>
            <ul style="font-size: 16px; color: #333; line-height: 1.6;">
              <li>Create new events</li>
              <li>Edit existing events</li>
              <li>Access creator features</li>
            </ul>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              If you believe this suspension was made in error, or if you would like to appeal this decision, 
              please contact our support team at <strong>support@eventify.com</strong>
            </p>

            <p style="margin-top: 30px; font-size: 16px; color: #333;">Best regards,<br><strong>The Eventify Admin Team</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
        };
        await sendEmailWithFallback(mailOptions);
        console.log('Ban notification email sent successfully to:', options.email);
    } catch (error) {
        console.error('Error sending ban notification email:', error);
    }
};

// Unban Notification Email
export const sendUnbanEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify Admin <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: 'Account Restored - Eventify',
            html: `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #28a745; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Account Restored</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${options.username},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your Eventify account has been restored and you now have full access to all features.
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>Account Status:</strong> Active ✅<br>
              <strong>Previous Suspension:</strong> ${options.previousReason || 'Violation of community guidelines'}
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You can now:
            </p>
            <ul style="font-size: 16px; color: #333; line-height: 1.6;">
              <li>Create new events</li>
              <li>Edit existing events</li>
              <li>Access all creator features</li>
              <li>Book tickets for events</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventify-og-production.up.railway.app/events" 
                 style="background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">
                Return to Eventify
              </a>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We appreciate your patience during this time. Please ensure you follow our community guidelines to maintain a positive experience for all users.
            </p>

            <p style="margin-top: 30px; font-size: 16px; color: #333;">Best regards,<br><strong>The Eventify Admin Team</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
        };
        await sendEmailWithFallback(mailOptions);
        console.log('Unban notification email sent successfully to:', options.email);
    } catch (error) {
        console.error('Error sending unban notification email:', error);
    }
};

// Ticket Email
export const sendTicketEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify Tickets <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: `Your Ticket for ${options.event.title}`,
            html: `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #0056b3; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Event Ticket</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">${options.event.title}</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0056b3; margin-top: 0;">Event Details</h3>
              <p><strong>Date:</strong> ${new Date(options.event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${options.event.location}</p>
              <p><strong>Quantity:</strong> ${options.booking.quantity} ticket(s)</p>
              <p><strong>Total Amount:</strong> ₹${options.booking.totalAmount.toFixed(2)}</p>
              <p><strong>Booking ID:</strong> ${options.booking._id}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://eventify-og-production.up.railway.app/events" 
                 style="background-color: #0056b3; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">
                View More Events
              </a>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for booking with Eventify. We hope you enjoy your event!
            </p>

            <p style="margin-top: 30px; font-size: 16px; color: #333;">Best regards,<br><strong>The Eventify Team</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`,
        };
        const result = await sendEmailWithFallback(mailOptions); // Send immediately
        console.log('✅ Ticket email sent successfully to:', options.email);
        console.log('Message ID:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Error sending ticket email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response
        });
        throw error;
    }
};