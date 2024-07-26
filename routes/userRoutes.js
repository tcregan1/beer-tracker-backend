const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/user'); // Ensure this path is correct
const upload = require('../upload'); // Import the multer configuration

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard...'); // Log the request

    const users = await User.find().sort({ score: -1 }).limit(30);
    
    console.log('Leaderboard fetched:', users); // Log the fetched users
    res.json(users);
  } catch (err) {
    console.error('Error fetching leaderboard:', err); // Log detailed error
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

router.post('/increment-score', authenticateToken, async (req, res) => {
  try {
    const { increment } = req.body;

    if (!increment || typeof increment !== 'number' || increment <= 0) {
      return res.status(400).json({ message: 'Invalid increment value' });
    }

    const userId = req.user.id; // Ensure this matches the token payload field
    if (!userId) {
      return res.status(401).json({ message: 'User not found in token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.score = (user.score || 0) + increment;
    await user.save();

    res.json({ message: 'Score updated successfully', score: user.score });
  } catch (err) {
    console.error('Error incrementing score:', err);
    res.status(500).json({ message: 'Error incrementing score' });
  }
});

// Protected route example
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` is populated by the `authenticateToken` middleware
  res.json({ message: `Hello ${req.user.username}` });
});

router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not found in token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optionally, you can store the file path in the user document or elsewhere
    user.photo = req.file.path;
    await user.save();

    res.json({ message: 'Photo uploaded successfully', photoPath: req.file.path });
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ message: 'Error uploading photo' });
  }
});

// Protected route example
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` is populated by the `authenticateToken` middleware
  res.json({ message: `Hello ${req.user.username}` });
});


module.exports = router;
