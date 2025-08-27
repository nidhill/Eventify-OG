import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from Backend/.env
dotenv.config({ path: path.join(__dirname, 'Backend', '.env') });

console.log('=== ENVIRONMENT VARIABLES TEST (After Fix) ===');
console.log('PORT:', process.env.PORT);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('CALLBACK_URL:', process.env.CALLBACK_URL);
console.log('db_host:', process.env.db_host ? 'Present' : 'Missing');
console.log('secretkey:', process.env.secretkey ? 'Present' : 'Missing');
console.log('=============================================');
