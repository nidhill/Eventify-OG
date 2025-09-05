import mongoose from 'mongoose';
import { sendEmailWithFallback } from './sendEmail.js';

// Email Queue Schema
const emailQueueSchema = new mongoose.Schema({
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'sent', 'failed'] },
    createdAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    error: { type: String }
});

const EmailQueue = mongoose.models.EmailQueue || mongoose.model('EmailQueue', emailQueueSchema);

// Process pending emails
export const processEmailQueue = async () => {
    try {
        console.log('🔄 Processing email queue...');
        
        // Find all pending emails
        const pendingEmails = await EmailQueue.find({ status: 'pending' }).sort({ createdAt: 1 });
        
        if (pendingEmails.length === 0) {
            console.log('✅ No pending emails in queue');
            return { success: true, processed: 0 };
        }
        
        console.log(`📧 Processing ${pendingEmails.length} pending emails`);
        
        let processed = 0;
        let failed = 0;
        
        for (const email of pendingEmails) {
            try {
                console.log(`📤 Sending email to: ${email.to}`);
                
                const mailOptions = {
                    from: email.from,
                    to: email.to,
                    subject: email.subject,
                    html: email.html
                };
                
                const result = await sendEmailWithFallback(mailOptions);
                
                if (result.success) {
                    // Mark as sent
                    await EmailQueue.findByIdAndUpdate(email._id, {
                        status: 'sent',
                        sentAt: new Date()
                    });
                    console.log(`✅ Email sent successfully to: ${email.to}`);
                    processed++;
                } else {
                    // Mark as failed
                    await EmailQueue.findByIdAndUpdate(email._id, {
                        status: 'failed',
                        error: result.error || 'Unknown error'
                    });
                    console.log(`❌ Email failed to send to: ${email.to} - ${result.error}`);
                    failed++;
                }
                
                // Add delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Error processing email to ${email.to}:`, error.message);
                
                // Mark as failed
                await EmailQueue.findByIdAndUpdate(email._id, {
                    status: 'failed',
                    error: error.message
                });
                failed++;
            }
        }
        
        console.log(`📊 Email queue processing completed: ${processed} sent, ${failed} failed`);
        return { success: true, processed, failed };
        
    } catch (error) {
        console.error('❌ Error processing email queue:', error);
        return { success: false, error: error.message };
    }
};

// Get email queue status
export const getEmailQueueStatus = async () => {
    try {
        const pendingCount = await EmailQueue.countDocuments({ status: 'pending' });
        const sentCount = await EmailQueue.countDocuments({ status: 'sent' });
        const failedCount = await EmailQueue.countDocuments({ status: 'failed' });
        
        return {
            success: true,
            pending: pendingCount,
            sent: sentCount,
            failed: failedCount,
            total: pendingCount + sentCount + failedCount
        };
    } catch (error) {
        console.error('❌ Error getting email queue status:', error);
        return { success: false, error: error.message };
    }
};

// Clear failed emails (optional cleanup)
export const clearFailedEmails = async () => {
    try {
        const result = await EmailQueue.deleteMany({ status: 'failed' });
        console.log(`🗑️ Cleared ${result.deletedCount} failed emails`);
        return { success: true, deleted: result.deletedCount };
    } catch (error) {
        console.error('❌ Error clearing failed emails:', error);
        return { success: false, error: error.message };
    }
};
