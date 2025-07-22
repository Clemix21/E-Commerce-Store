import express from 'express';
import { protectRoute } from '../middleware/auth.middleware';
import { checkoutSuccess, createCheckoutSession } from '../controllers/payment.controller';

import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.get("/success", protectRoute, checkoutSuccess);

export default router;