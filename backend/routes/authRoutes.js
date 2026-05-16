const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
    getAllUsers,
    searchUsers,
    changePassword,
    googleLogin,
    updateAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);         // Login
router.post('/google', googleLogin);     // Google OAuth Login
router.get('/profile', protect, getUserProfile);
router.put('/profile/avatar', protect, updateAvatar); // Update profile avatar
router.put('/change-password', protect, changePassword); // Change password (authenticated)
router.get('/users/search', protect, searchUsers);       // Privacy-safe user search
router.get('/users', protect, getAllUsers);

module.exports = router;
