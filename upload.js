const multer = require('multer');
const path = require('path');
const User = require('./models/user');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this path is correct
  },
  filename: async (req, file, cb) => {
    try {
      const userId = req.user.id; // Extracted from token
      const user = await User.findById(userId);
      if (user) {
        const filename = `${user.username}${user.score}${path.extname(file.originalname)}`;
        cb(null, filename);
      } else {
        cb(new Error('User not found'), null);
      }
    } catch (err) {
      cb(err, null);
    }
  }
});

const upload = multer({ storage });

module.exports = upload;
