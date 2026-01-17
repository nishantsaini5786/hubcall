const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
        maxlength: [30, "First name cannot exceed 30 characters"],
        match: [/^[A-Za-z]+$/, "First name can only contain letters"]
    },
    
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [30, "Last name cannot exceed 30 characters"],
        match: [/^[A-Za-z]+$/, "Last name can only contain letters"]
    },
    
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(v);
            },
            message: props => `${props.value} is not a valid Gmail address!`
        }
    },
    
    mobile: {
        type: String,
        required: [true, "Mobile number is required"],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
    },
    
    age: {
        type: Number,
        required: [true, "Age is required"],
        min: [13, "You must be at least 13 years old"],
        max: [120, "Please enter a valid age"]
    },
    
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false // Password won't be returned in queries by default
    },
    
    termsAccepted: {
        type: Boolean,
        required: [true, "You must accept terms and conditions"],
        default: false
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    lastLogin: {
        type: Date,
        default: null
    },
    
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
    },
    
    profilePicture: {
        type: String,
        default: null
    }

}, { 
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove password field when converting to JSON
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age group
UserSchema.virtual('ageGroup').get(function() {
    if (this.age < 18) return 'Teen';
    if (this.age < 30) return 'Young Adult';
    if (this.age < 50) return 'Adult';
    return 'Senior';
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ mobile: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware for additional validation
UserSchema.pre('save', function(next) {
    // Capitalize first letter of names
    if (this.firstName) {
        this.firstName = this.firstName.charAt(0).toUpperCase() + 
                        this.firstName.slice(1).toLowerCase();
    }
    
    if (this.lastName) {
        this.lastName = this.lastName.charAt(0).toUpperCase() + 
                       this.lastName.slice(1).toLowerCase();
    }
    
    next();
});

// Method to check password (will be used in login)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get user without sensitive data
UserSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find by mobile
UserSchema.statics.findByMobile = function(mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    return this.findOne({ mobile: cleanMobile });
};

const User = mongoose.model("User", UserSchema);

module.exports = User;