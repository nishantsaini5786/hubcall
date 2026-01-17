const express = require("express");
const router = express.Router();
const { 
    register, 
    login, 
    checkEmail, 
    getProfile, 
    forgotPassword,
    verifyToken,
    resetPassword,
    updateProfile,
    changePassword,
    logout
} = require("../controllers/authController");

// Validation middleware
const { body, param, validationResult } = require('express-validator');
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// ==================== PUBLIC ROUTES ====================

// Test route
router.get("/", (req, res) => {
    res.json({ 
        success: true, 
        message: "🔐 HUB CALL Authentication API", 
        version: "1.0.0",
        endpoints: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            checkEmail: "GET /api/auth/check-email/:email",
            forgotPassword: "POST /api/auth/forgot-password",
            resetPassword: "POST /api/auth/reset-password"
        }
    });
});

// Register route with validation
router.post("/register", 
    [
        body('firstName')
            .notEmpty().withMessage('First name is required')
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('First name must be 2-30 characters')
            .matches(/^[A-Za-z]+$/).withMessage('First name can only contain letters'),
        
        body('lastName')
            .notEmpty().withMessage('Last name is required')
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('Last name must be 2-30 characters')
            .matches(/^[A-Za-z]+$/).withMessage('Last name can only contain letters'),
        
        body('email')
            .notEmpty().withMessage('Email is required')
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Invalid email format')
            .matches(/@gmail\.com$/).withMessage('Only Gmail addresses are allowed'),
        
        body('mobile')
            .notEmpty().withMessage('Mobile number is required')
            .trim()
            .matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
        
        body('age')
            .notEmpty().withMessage('Age is required')
            .isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),
        
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
            .matches(/\d/).withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
        
        body('confirmPassword')
            .notEmpty().withMessage('Confirm password is required')
            .custom((value, { req }) => value === req.body.password)
            .withMessage('Passwords do not match'),
        
        body('termsAccepted')
            .equals('true').withMessage('You must accept terms and conditions')
    ],
    validateRequest,
    register
);

// Login route with validation
router.post("/login",
    [
        body('email')
            .notEmpty().withMessage('Email is required')
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Invalid email format'),
        
        body('password')
            .notEmpty().withMessage('Password is required')
    ],
    validateRequest,
    login
);

// Check email availability
router.get("/check-email/:email",
    [
        param('email')
            .notEmpty().withMessage('Email is required')
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Invalid email format')
    ],
    validateRequest,
    checkEmail
);

// Forgot password
router.post("/forgot-password",
    [
        body('email')
            .notEmpty().withMessage('Email is required')
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Invalid email format')
    ],
    validateRequest,
    forgotPassword
);

// Reset password
router.post("/reset-password",
    [
        body('token')
            .notEmpty().withMessage('Reset token is required'),
        
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
            .matches(/\d/).withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
        
        body('confirmPassword')
            .notEmpty().withMessage('Confirm password is required')
            .custom((value, { req }) => value === req.body.newPassword)
            .withMessage('Passwords do not match')
    ],
    validateRequest,
    resetPassword
);

// ==================== PROTECTED ROUTES ====================

// Get user profile (requires authentication)
router.get("/profile", verifyToken, getProfile);

// Update profile
router.put("/profile", verifyToken,
    [
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('First name must be 2-30 characters')
            .matches(/^[A-Za-z]+$/).withMessage('First name can only contain letters'),
        
        body('lastName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('Last name must be 2-30 characters')
            .matches(/^[A-Za-z]+$/).withMessage('Last name can only contain letters'),
        
        body('age')
            .optional()
            .isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),
        
        body('profilePicture')
            .optional()
            .isURL().withMessage('Invalid profile picture URL')
    ],
    validateRequest,
    updateProfile
);

// Change password
router.put("/change-password", verifyToken,
    [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
            .matches(/\d/).withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character')
            .custom((value, { req }) => value !== req.body.currentPassword)
            .withMessage('New password must be different from current password'),
        
        body('confirmPassword')
            .notEmpty().withMessage('Confirm password is required')
            .custom((value, { req }) => value === req.body.newPassword)
            .withMessage('Passwords do not match')
    ],
    validateRequest,
    changePassword
);

// Logout
router.post("/logout", verifyToken, logout);

// ==================== HEALTH CHECK ====================
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Auth service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;