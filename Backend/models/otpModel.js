import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // 10 മിനിറ്റിനു ശേഷം ഈ ഡാറ്റ തനിയെ ഡിലീറ്റ് ആകും
    },
});

// OTP ഹാഷ് ചെയ്യാൻ
otpSchema.pre('save', async function(next) {
    if (this.isModified('otp')) {
        try {
            this.otp = await bcrypt.hash(this.otp, 10);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// OTP comparison method
otpSchema.methods.compareOtp = async function(candidateOtp) {
    try {
        return await bcrypt.compare(candidateOtp, this.otp);
    } catch (error) {
        throw new Error('OTP comparison failed');
    }
};

export default mongoose.model('Otp', otpSchema);
