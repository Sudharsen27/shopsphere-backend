import { body, validationResult } from "express-validator";

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Email validation
export const validateEmail = () => {
  return body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase();
};

// Password validation
export const validatePassword = (minLength = 6) => {
  return body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: minLength })
    .withMessage(`Password must be at least ${minLength} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .optional({ nullable: true });
};

// Name validation
export const validateName = () => {
  return body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces");
};

// Login validation rules
export const validateLogin = [
  validateEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

// Register validation rules
export const validateRegister = [
  validateName(),
  validateEmail(),
  validatePassword(6),
  handleValidationErrors,
];
