const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/emailService');
const crypto = require('crypto');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/** Generate a random 6-digit OTP */
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// ─── Register ────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            if (userExists.authProvider === 'google') {
                return res.status(400).json({ message: 'This email is registered via Google. Please use the "Continue with Google" button.' });
            }
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            res.status(201).json({
                message: 'Account created successfully',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Step 1: Validate credentials, send OTP ──────────────────────────────────
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && user.authProvider === 'google') {
            return res.status(400).json({ message: 'This email is registered via Google. Please use the "Continue with Google" button.' });
        }

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate OTP and store hashed in DB (10 min expiry)
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save({ validateBeforeSave: false });

        // Send OTP to registered email
        await sendOTPEmail(user.email, otp);

        res.json({
            otpSent: true,
            email: user.email,
            message: `OTP sent to ${user.email}`,
        });
    } catch (error) {
        console.error('Login OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};

// ─── Step 2: Verify OTP and return JWT ───────────────────────────────────────
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'No OTP requested. Please login again.' });
        }

        if (new Date() > user.otpExpiry) {
            // Clear expired OTP
            user.otp = null;
            user.otpExpiry = null;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ message: 'OTP has expired. Please login again.' });
        }

        if (user.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP verified — clear it and return token
        user.otp = null;
        user.otpExpiry = null;
        await user.save({ validateBeforeSave: false });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('OTP verify error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save({ validateBeforeSave: false });

        await sendOTPEmail(user.email, otp);

        res.json({ otpSent: true, message: `OTP resent to ${user.email}` });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Failed to resend OTP.' });
    }
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password -otp -otpExpiry');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Privacy-safe User Search ─────────────────────────────────────────────────
// Only returns results when query is at least 2 characters.
// Excludes the requesting user themselves.
const searchUsers = async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.json([]);  // Return empty — no query, no data
    }

    try {
        // Escape special regex characters so full names with spaces work safely
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        const users = await User.find({
            $and: [
                { $or: [{ name: regex }, { email: regex }] },
                { _id: { $ne: req.user._id } }  // Exclude self
            ]
        }).select('_id name email').limit(10);  // Limit to 10 results max

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Change Password ─────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        // Mark as modified so pre-save hook doesn't re-hash
        user.markModified('password');
        await user.save({ validateBeforeSave: false });

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: error.message });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID');

// ─── Google Login ────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID', 
            // NOTE: Replace 'YOUR_CLIENT_ID' or set GOOGLE_CLIENT_ID in your .env file
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user with a random password since they logged in via Google
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                name,
                email,
                password: randomPassword,
                avatar: picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                authProvider: 'google'
            });
        }

        // Return JWT token (bypassing OTP for Google Login)
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Invalid Google token. Please configure your GOOGLE_CLIENT_ID.' });
    }
};

module.exports = { registerUser, authUser, verifyOTP, resendOTP, getUserProfile, getAllUsers, searchUsers, changePassword, googleLogin };
