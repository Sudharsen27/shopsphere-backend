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

import {
  loginUser,
  registerUser,
} from "../controllers/authController.js";
import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

// 🔐 AUTH
router.post("/login", loginUser);
router.post("/register", registerUser);

// 👤 PROFILE (Protected)
router.get("/profile", protect, getUserProfile);

export default router;
