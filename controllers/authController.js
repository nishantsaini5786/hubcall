const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ========================= REGISTER =========================
exports.register = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        mobile,
        age,
        password,
        confirmPassword,
        termsAccepted
    } = req.body;

    try {
        // Validation checks
        if (!firstName || !lastName || !email || !mobile || !age || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Terms acceptance check
        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                message: "You must accept terms and conditions"
            });
        }

        // Age validation
        if (age < 13) {
            return res.status(400).json({
                success: false,
                message: "You must be at least 13 years old"
            });
        }

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please use a valid Gmail address"
            });
        }

        // Mobile validation
        const mobileRegex = /^\d{10}$/;
        const cleanMobile = mobile.replace(/\D/g, '');
        if (!mobileRegex.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit mobile number"
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        // Password requirements
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*]/.test(password);
        
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: "Password must contain uppercase, lowercase, number and special character"
            });
        }

        // Password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check if mobile already exists
        const existingMobile = await User.findOne({ mobile: cleanMobile });
        if (existingMobile) {
            return res.status(409).json({
                success: false,
                message: "Mobile number already registered"
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

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Register Error:", error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
};

// ========================= LOGIN =========================
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        
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

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
};

// ========================= CHECK EMAIL =========================
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
            message: user ? "Email already registered" : "Email available"
        });

    } catch (error) {
        console.error("Check Email Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ========================= GET USER PROFILE =========================
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

// ========================= FORGOT PASSWORD =========================
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

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // In production, send email here
        // For now, just return the token
        return res.status(200).json({
            success: true,
            message: "Password reset email sent",
            resetToken
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ========================= VALIDATE TOKEN MIDDLEWARE =========================
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
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
        
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};