
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Create transporter with Railway-optimized configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465, // Use SSL port instead of TLS
    secure: true, // Use SSL instead of STARTTLS
    auth: {
        user: process.env.EMAIL_USER || 'hynidhil@gmail.com',
        pass: process.env.EMAIL_PASS || 'xtwc aosx kaip qhmg',
    },
    // Railway-optimized timeout settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 15000,   // 15 seconds
    socketTimeout: 30000,     // 30 seconds
    // Enhanced TLS/SSL options for Railway
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
        secureProtocol: 'TLSv1_2_method'
    },
    // Simplified pool configuration for Railway
    pool: false, // Disable pooling for Railway
    // Retry configuration
    retryDelay: 5000,
    maxRetries: 3
});

// Create fallback transporter for Railway
const createFallbackTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'hynidhil@gmail.com',
            pass: process.env.EMAIL_PASS || 'xtwc aosx kaip qhmg',
        },
        connectionTimeout: 20000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Verify transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Primary email transporter verification failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response
        });
        console.log('🔄 Will use fallback configuration for email sending');
    } else {
        console.log('✅ Email transporter is ready to send messages');
        console.log('📧 Email system initialized successfully');
    }
});

// Helper function to send email with fallback and retry logic
const sendEmailWithFallback = async (mailOptions, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
        // Try primary transporter first
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log(`🔄 Primary transporter failed (attempt ${retryCount + 1}), trying fallback...`);
        
        if (retryCount < maxRetries) {
            try {
                // Try fallback transporter
                const fallbackTransporter = createFallbackTransporter();
                const result = await fallbackTransporter.sendMail(mailOptions);
                console.log('✅ Email sent successfully using fallback transporter');
                return result;
            } catch (fallbackError) {
                console.log(`🔄 Fallback also failed (attempt ${retryCount + 1}), retrying...`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
                return sendEmailWithFallback(mailOptions, retryCount + 1);
            }
        } else {
            console.error('❌ All email attempts failed after', maxRetries + 1, 'tries');
            throw error;
        }
    }
};

// Welcome Email
export const sendWelcomeEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify <${process.env.EMAIL_USER || 'hynidhil@gmail.com'}>`,
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
            from: `Eventify <${process.env.EMAIL_USER || 'hynidhil@gmail.com'}>`,
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
        const result = await sendEmailWithFallback(mailOptions);
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
            from: `Eventify Admin <${process.env.EMAIL_USER || 'hynidhil@gmail.com'}>`,
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
            from: `Eventify Admin <${process.env.EMAIL_USER || 'hynidhil@gmail.com'}>`,
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
            from: `Eventify Tickets <${process.env.EMAIL_USER || 'hynidhil@gmail.com'}>`,
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
        const result = await sendEmailWithFallback(mailOptions);
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