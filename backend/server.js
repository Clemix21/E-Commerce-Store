import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Importing Routes
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.routes.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';

// Importing Database Connection
import { connectDB } from './lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse body of requests
app.use(cookieParser()); // Middleware to parse cookies

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.get("/", couponRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log('Server is running on port http://localhost:' + PORT);
  
  connectDB();
});

// 6IDLl2FDW2V4YKOp