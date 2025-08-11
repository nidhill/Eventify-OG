import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const connectTodbs = async() => {
    try {
        // The console.log should be after the await, not inside it
        await mongoose.connect(process.env.db_host);
        
        console.log('mongoDB connected✅');

    } catch (error) {
        console.error('Mongoose connection error:❌', error);
        process.exit(1); // Exit process with failure
    }
} 

export default connectTodbs;
