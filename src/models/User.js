const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        required: true,
        default: 'buyer'
    },
    mode: {
        type: String,
        enum: ['light', 'dark', 'default'],
        default: 'default'
    },
    phone: {
        type: String,
    },
    avatarUrl: {
        type: String,
    },
    description: {
        type: String,
    },
    masteryBadges: {
        type: Number,
        default: 0
    },
    isEliteEligible: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true,
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
