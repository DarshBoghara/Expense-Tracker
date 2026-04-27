const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    verifyOTP,
    resendOTP,
    getUserProfile,
    getAllUsers,
    searchUsers,
    changePassword,
    googleLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);         // Step 1: validate credentials → send OTP
router.post('/google', googleLogin);     // Google OAuth Login
router.post('/verify-otp', verifyOTP);  // Step 2: verify OTP → return JWT
router.post('/resend-otp', resendOTP);  // Resend OTP
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword); // Change password (authenticated)
router.get('/users/search', protect, searchUsers);       // Privacy-safe user search
router.get('/users', protect, getAllUsers);

module.exports = router;
