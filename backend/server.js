import express from 'express';
import dotenv from 'dotenv';

// Importing Routes
import authRoutes from './routes/auth.route.js';
// Importing Database Connection
import { connectDB } from './lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse body of requests

app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
  console.log('Server is running on port http://localhost:' + PORT);
  
  connectDB();
});

// 6IDLl2FDW2V4YKOp