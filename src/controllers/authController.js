import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Helper function to send success response
const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };
  if (data) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

// Helper function to send error response
const sendErrorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendErrorResponse(
        res,
        409,
        "User with this email already exists"
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data (password excluded by schema transform)
    return sendSuccessResponse(
      res,
      201,
      "User registered successfully",
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }
    );
  } catch (error) {
    console.error("Register error:", error);

    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      return sendErrorResponse(
        res,
        409,
        "User with this email already exists"
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return sendErrorResponse(res, 400, "Validation failed", errors);
    }

    return sendErrorResponse(
      res,
      500,
      "Internal server error. Please try again later."
    );
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field (since it's excluded by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendErrorResponse(
        res,
        401,
        "Invalid email or password"
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      return sendErrorResponse(
        res,
        403,
        "Your account has been deactivated. Please contact support."
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendErrorResponse(
        res,
        401,
        "Invalid email or password"
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    // Return user data
    return sendSuccessResponse(
      res,
      200,
      "Login successful",
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error. Please try again later."
    );
  }
};

// VERIFY TOKEN (for token refresh/validation)
export const verifyToken = async (req, res) => {
  try {
    // User is attached by authMiddleware
    return sendSuccessResponse(
      res,
      200,
      "Token is valid",
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error. Please try again later."
    );
  }
};
