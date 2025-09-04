import mongoose from 'mongoose';

// Email Queue Schema for storing emails when SMTP fails
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

// Function to get pending emails from queue
export const getPendingEmails = async () => {
    try {
        const pendingEmails = await EmailQueue.find({ status: 'pending' }).sort({ createdAt: -1 });
        return pendingEmails;
    } catch (error) {
        console.error('❌ Error fetching pending emails:', error);
        return [];
    }
};

// Function to mark email as sent
export const markEmailAsSent = async (emailId) => {
    try {
        await EmailQueue.findByIdAndUpdate(emailId, {
            status: 'sent',
            sentAt: new Date()
        });
        console.log('✅ Email marked as sent:', emailId);
        return true;
    } catch (error) {
        console.error('❌ Error marking email as sent:', error);
        return false;
    }
};

// Function to store email in queue
export const storeEmailInQueue = async (emailData) => {
    try {
        const emailRecord = new EmailQueue({
            to: emailData.to,
            from: emailData.from,
            subject: emailData.subject,
            html: emailData.html,
            status: 'pending'
        });
        
        await emailRecord.save();
        console.log('📧 Email stored in database for manual processing:', emailRecord._id);
        return emailRecord;
    } catch (error) {
        console.error('❌ Failed to store email in database:', error);
        throw error;
    }
};

export { EmailQueue };
