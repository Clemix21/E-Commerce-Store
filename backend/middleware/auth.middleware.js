import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No access token provided",
            });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }

            req.user = user; // Attach user to request object
            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            if(error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Access token expired",
                });
            }
            throw error; // Re-throw other errors for handling in the catch block
        }

    } catch (error) {
        console.error("Error in protectRoute middleware:", error.message);
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid access token " + error.message,
        });
    }
}

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next(); // User is admin, proceed to the next middleware or route handler
    }
    
    return res.status(403).json({
        success: false,
        message: "Access denied - Admin only",
    });
};