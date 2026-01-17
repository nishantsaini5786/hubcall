const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==================== REGISTER USER ====================
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, mobile, age, password, confirmPassword, termsAccepted } = req.body;

        // Basic validation
        if (!firstName || !lastName || !email || !mobile || !age || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!termsAccepted || termsAccepted !== "true") {
            return res.status(400).json({
                success: false,
                message: "You must accept terms and conditions"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (age < 13 || age > 120) {
            return res.status(400).json({
                success: false,
                message: "Age must be between 13 and 120"
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check mobile number
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Mobile number must be 10 digits"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            mobile: cleanMobile,
            age: parseInt(age),
            password: hashedPassword,
            termsAccepted: true
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Prepare user response
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            age: user.age,
            createdAt: user.createdAt
        };

        return res.status(201).json({
            success: true,
            message: "🎉 User registered successfully",
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Register Error:", error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
};

// ==================== LOGIN USER ====================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Prepare response
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            age: user.age,
            createdAt: user.createdAt
        };

        return res.status(200).json({
            success: true,
            message: "🔓 Login successful",
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
};

// ==================== CHECK EMAIL ====================
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        return res.status(200).json({
            success: true,
            exists: !!user,
            message: user ? "Email already registered" : "Email is available"
        });

    } catch (error) {
        console.error("Check Email Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ==================== FORGOT PASSWORD ====================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not found"
            });
        }

        // Generate reset token (1 hour expiry)
        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            message: "Password reset email sent",
            resetToken: resetToken
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ==================== VERIFY TOKEN ====================
exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();

    } catch (error) {
        console.error("Token Verification Error:", error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }
        
        return res.status(401).json({
            success: false,
            message: "Authentication failed."
        });
    }
};