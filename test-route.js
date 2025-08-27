import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, 'Backend', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Test route to check OAuth configuration
app.get('/auth/google/status', (req, res) => {
  res.json({
    status: 'Google OAuth configuration test',
    clientId: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing',
    callbackUrl: process.env.CALLBACK_URL || 'Not set',
    port: PORT
  });
});

// Test the main route
app.get('/auth/google', (req, res) => {
  res.json({
    message: 'Google OAuth route is working!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test these URLs:');
  console.log(`http://localhost:${PORT}/auth/google/status`);
  console.log(`http://localhost:${PORT}/auth/google`);
});
