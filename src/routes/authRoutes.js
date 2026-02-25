// import express from "express";
// import { registerUser, loginUser } from "../controllers/authController.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);

// export default router;

// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import { getUserProfile } from "../controllers/userController.js";

// const router = express.Router();

// // existing routes
// router.post("/login", loginUser);
// router.post("/register", registerUser);

// // ✅ ADD THIS
// router.get("/profile", protect, getUserProfile);

// export default router;


import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authLimiter, verifyLimiter } from "../middleware/rateLimiter.js";
import { validateLogin, validateRegister } from "../middleware/validationMiddleware.js";
import {
  loginUser,
  registerUser,
  verifyToken,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/authController.js";
import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

// 🔐 AUTH ROUTES (with rate limiting and validation)
router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);

// 👤 PROFILE & TOKEN VERIFICATION (Protected)
router.get("/verify", verifyLimiter, protect, verifyToken);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);

// Saved addresses
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);
router.patch("/addresses/:id/default", protect, setDefaultAddress);

export default router;
