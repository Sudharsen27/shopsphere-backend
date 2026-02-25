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

// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return sendErrorResponse(res, 400, "Email already in use");
      }
    }

    // Update user
    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();

    await user.save();

    return sendSuccessResponse(res, 200, "Profile updated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error. Please try again later."
    );
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return sendErrorResponse(
        res,
        400,
        "Current password and new password are required"
      );
    }

    if (newPassword.length < 6) {
      return sendErrorResponse(
        res,
        400,
        "New password must be at least 6 characters"
      );
    }

    // Get user with password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return sendErrorResponse(res, 401, "Current password is incorrect");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return sendSuccessResponse(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return sendErrorResponse(
      res,
      500,
      "Internal server error. Please try again later."
    );
  }
};

// ========== SAVED ADDRESSES ==========

export const addAddress = async (req, res) => {
  try {
    const { address, city, postalCode, country, isDefault } = req.body;
    if (!address?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
      return sendErrorResponse(res, 400, "Address, city, postal code and country are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) return sendErrorResponse(res, 404, "User not found");
    const newAddr = {
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault: !!isDefault,
    };
    if (newAddr.isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }
    user.addresses.push(newAddr);
    await user.save();
    const added = user.addresses[user.addresses.length - 1];
    return sendSuccessResponse(res, 201, "Address added", {
      address: added,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);
    return sendErrorResponse(res, 500, "Failed to add address");
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { address, city, postalCode, country, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendErrorResponse(res, 404, "User not found");
    const addr = user.addresses.id(req.params.id);
    if (!addr) return sendErrorResponse(res, 404, "Address not found");
    if (address !== undefined) addr.address = address.trim();
    if (city !== undefined) addr.city = city.trim();
    if (postalCode !== undefined) addr.postalCode = postalCode.trim();
    if (country !== undefined) addr.country = country.trim();
    if (isDefault === true) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      addr.isDefault = true;
    }
    await user.save();
    return sendSuccessResponse(res, 200, "Address updated", { addresses: user.addresses });
  } catch (error) {
    console.error("Update address error:", error);
    return sendErrorResponse(res, 500, "Failed to update address");
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendErrorResponse(res, 404, "User not found");
    const addr = user.addresses.id(req.params.id);
    if (!addr) return sendErrorResponse(res, 404, "Address not found");
    addr.deleteOne();
    await user.save();
    return sendSuccessResponse(res, 200, "Address deleted", { addresses: user.addresses });
  } catch (error) {
    console.error("Delete address error:", error);
    return sendErrorResponse(res, 500, "Failed to delete address");
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendErrorResponse(res, 404, "User not found");
    const addr = user.addresses.id(req.params.id);
    if (!addr) return sendErrorResponse(res, 404, "Address not found");
    user.addresses.forEach((a) => { a.isDefault = false; });
    addr.isDefault = true;
    await user.save();
    return sendSuccessResponse(res, 200, "Default address updated", { addresses: user.addresses });
  } catch (error) {
    console.error("Set default address error:", error);
    return sendErrorResponse(res, 500, "Failed to set default address");
  }
};
