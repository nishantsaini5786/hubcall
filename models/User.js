const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
        maxlength: [30, "First name cannot exceed 30 characters"]
    },
    
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [30, "Last name cannot exceed 30 characters"]
    },
    
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
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
        required: [true, "Password is required"]
    },
    
    termsAccepted: {
        type: Boolean,
        required: [true, "You must accept terms and conditions"],
        default: false
    }

}, { 
    timestamps: true,
    toJSON: { 
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});

// Remove duplicate mobile index - ONLY keep email index
UserSchema.index({ email: 1 });

const User = mongoose.model("User", UserSchema);

module.exports = User;