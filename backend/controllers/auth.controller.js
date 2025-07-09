import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // Store for 7 days
}

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevents XSS attacks (cross-site scripting attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict", // prevents CSRF attacks,
    maxAge: 15 * 60 * 1000, // 15 minutes
})
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevents XSS attacks (cross-site scripting attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict", // prevents CSRF attacks,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
try {
  const userExists = await User.findOne({ email });

  if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
    });

    // Authentication: Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id)
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "User created successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Internal server error: " + error.message 
    });
  }    
};

export const login = async (req, res) => {
  try {
    const { email, password} = req.body
    const user = await User.findOne({ email })

    if (user && (await user.comparePassword(password))) {
      // Authentication: Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

  } catch (error) {
    console.error("Error ind login controller:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refreshToken:${decoded.userId}`); // Remove refresh token from Redis
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout controller:", error.message)
    req.status(500).json({
      success: false,
      message: "Internal server error: ", 
      error: error.message,
    });
  }
};