import mongoose from "mongoose";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, 'Backend', '.env') });

const connectTodbs = async() => {
    try {
        // Use environment variable or fallback to local MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.db_host || "mongodb://localhost:27017/eventify";
        
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(mongoUri);
        
        console.log('mongoDB connected✅');

    } catch (error) {
        console.error('Mongoose connection error:❌', error);
        console.log('Please ensure MongoDB is running and check your connection string');
        console.log('You can set MONGODB_URI or db_host in your .env file');
        process.exit(1); // Exit process with failure
    }
} 

export default connectTodbs;
