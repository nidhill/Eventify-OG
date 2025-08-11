
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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
              <a href="http://localhost:5000/userauth/home" 
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
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully to:', options.email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

// OTP Email
export const sendOtpEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Eventify <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: 'Your OTP for Eventify Verification',
            html: `<h2>Hello ${options.name},</h2><p>Your One-Time Password (OTP) for account verification is: <strong>${options.otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`,
        };
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully to:', options.email);
    } catch (error) {
        console.error('Error sending OTP email:', error);
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
              <a href="http://localhost:5000/userauth/home" 
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
        await transporter.sendMail(mailOptions);
        console.log('Ticket email sent successfully to:', options.email);
    } catch (error) {
        console.error('Error sending ticket email:', error);
    }
};