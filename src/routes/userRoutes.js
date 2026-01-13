// import express from "express";
// import protect from "../middleware/authMiddleware.js";
// import { getUserProfile } from "../controllers/userController.js";

// const router = express.Router();

// // Protected route
// router.get("/profile", protect, getUserProfile);

// export default router;

// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";

// import { getUserProfile } from "../controllers/userController.js";

// const router = express.Router();

// router.get("/profile", protect, getUserProfile);

// export default router;


import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginUser,
  registerUser,
  getUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

// 🔐 AUTH
router.post("/login", loginUser);
router.post("/register", registerUser);

// 👤 PROFILE (Protected)
router.get("/profile", protect, getUserProfile);

export default router;
