import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Debug environment variables
console.log('🔍 Email Configuration Debug:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');

// Main email sending function
export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        console.log('📤 Sending email via Resend API...');
        console.log('📧 To:', to);
        console.log('📧 Subject:', subject);
        
        const startTime = Date.now();
        
        const { data, error } = await resend.emails.send({
            from: 'Eventify <onboarding@resend.dev>', // Use Resend's default verified domain
            to: [to],
            subject: subject,
            text: text,
            html: html,
        });
        
        const endTime = Date.now();
        
        if (error) {
            console.error('❌ Resend API error:', error);
            throw new Error(`Resend API error: ${error.message}`);
        }
        
        console.log('✅ Email sent successfully via Resend API');
        console.log('⏱️ Email sent in:', endTime - startTime, 'ms');
        console.log('📧 Message ID:', data?.id);
        
        return {
            success: true,
            messageId: data?.id,
            accepted: [to],
            rejected: [],
            response: 'Email sent via Resend API'
        };
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response
        });
        throw error;
    }
};

// OTP Email function
export const sendOtpEmail = async (options) => {
    try {
        const { email, name, otp } = options;
        
        const subject = 'Your OTP for Eventify Verification';
        const text = `Hello ${name},\n\nYour OTP for Eventify verification is: ${otp}\n\nThis OTP is valid for 10 minutes only.\n\nBest regards,\nThe Eventify Team`;
        
        const html = `
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
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${name},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for signing up with Eventify! To complete your account verification, please use the One-Time Password (OTP) below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f8f9fa; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; display: inline-block;">
                <h2 style="color: #6366f1; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h2>
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
        `;
        
        const result = await sendEmail({ to: email, subject, text, html });
        console.log('✅ OTP email sent successfully to:', email);
        console.log('Message ID:', result.messageId);
        return result;
        
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw error;
    }
};

// Welcome Email function
export const sendWelcomeEmail = async (options) => {
    try {
        const { email, name } = options;
        
        const subject = 'Welcome to Eventify!';
        const text = `Hello ${name},\n\nWelcome to Eventify! We're delighted to have you join our community.\n\nYou can start discovering events and securing your tickets today.\n\nBest regards,\nThe Eventify Team`;
        
        const html = `
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
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${name},</p>

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
        `;
        
        const result = await sendEmail({ to: email, subject, text, html });
        console.log('✅ Welcome email sent successfully to:', email);
        console.log('Message ID:', result.messageId);
        return result;
        
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        throw error;
    }
};

// Ticket Email function
export const sendTicketEmail = async (options) => {
    try {
        const { email, event, booking } = options;
        
        const subject = `Your Ticket for ${event.title}`;
        const text = `Hello,\n\nYour ticket for ${event.title} has been confirmed.\n\nEvent Details:\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\nQuantity: ${booking.quantity} ticket(s)\nTotal Amount: ₹${booking.totalAmount.toFixed(2)}\nBooking ID: ${booking._id}\n\nThank you for booking with Eventify!\n\nBest regards,\nThe Eventify Team`;
        
        const html = `
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
            <h2 style="color: #333; margin-bottom: 20px;">${event.title}</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0056b3; margin-top: 0;">Event Details</h3>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Quantity:</strong> ${booking.quantity} ticket(s)</p>
              <p><strong>Total Amount:</strong> ₹${booking.totalAmount.toFixed(2)}</p>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
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
        `;
        
        const result = await sendEmail({ to: email, subject, text, html });
        console.log('✅ Ticket email sent successfully to:', email);
        console.log('Message ID:', result.messageId);
        return result;
        
    } catch (error) {
        console.error('❌ Error sending ticket email:', error);
        throw error;
    }
};

// Ban Notification Email function
export const sendBanEmail = async (options) => {
    try {
        const { email, username, reason } = options;
        
        const subject = 'Account Suspension Notice - Eventify';
        const text = `Hello ${username},\n\nWe regret to inform you that your Eventify account has been suspended due to violations of our community guidelines.\n\nReason: ${reason || 'Violation of community guidelines and terms of service.'}\n\nIf you believe this suspension was made in error, please contact our support team.\n\nBest regards,\nThe Eventify Admin Team`;
        
        const html = `
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
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${username},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We regret to inform you that your Eventify account has been suspended due to violations of our community guidelines.
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>Reason for suspension:</strong><br>
              ${reason || 'Violation of community guidelines and terms of service.'}
            </p>

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
        `;
        
        await sendEmail({ to: email, subject, text, html });
        console.log('Ban notification email sent successfully to:', email);
        
    } catch (error) {
        console.error('Error sending ban notification email:', error);
    }
};

// Unban Notification Email function
export const sendUnbanEmail = async (options) => {
    try {
        const { email, username, previousReason } = options;
        
        const subject = 'Account Restored - Eventify';
        const text = `Hello ${username},\n\nGreat news! Your Eventify account has been restored and you now have full access to all features.\n\nYou can now create events, edit existing events, access all creator features, and book tickets for events.\n\nBest regards,\nThe Eventify Admin Team`;
        
        const html = `
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
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${username},</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your Eventify account has been restored and you now have full access to all features.
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
        `;
        
        await sendEmail({ to: email, subject, text, html });
        console.log('Unban notification email sent successfully to:', email);
        
    } catch (error) {
        console.error('Error sending unban notification email:', error);
    }
};

console.log('📧 Resend email system initialized successfully');