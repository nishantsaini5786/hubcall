const express = require("express");
const router = express.Router();
const { 
    register, 
    login, 
    checkEmail, 
    getProfile, 
    forgotPassword,
    verifyToken
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
        version: "1.0.0"
    });
});

// Register route with validation
router.post("/register", 
    [
        body('firstName')
            .notEmpty().withMessage('First name is required')
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('First name must be 2-30 characters'),
        
        body('lastName')
            .notEmpty().withMessage('Last name is required')
            .trim()
            .isLength({ min: 2, max: 30 }).withMessage('Last name must be 2-30 characters'),
        
        body('email')
            .notEmpty().withMessage('Email is required')
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Invalid email format'),
        
        body('mobile')
            .notEmpty().withMessage('Mobile number is required')
            .trim()
            .matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
        
        body('age')
            .notEmpty().withMessage('Age is required')
            .isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),
        
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        
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

// ==================== PROTECTED ROUTES ====================

// Get user profile (requires authentication)
router.get("/profile", verifyToken, getProfile);

// ==================== HEALTH CHECK ====================
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Auth service is healthy",
        timestamp: new Date().toISOString()
    });
});

module.exports = router;