const multer = require('multer');
const path = require('path');
const User = require('./models/user');

// Ensure 'uploads/' directory exists and is writable
const uploadDirectory = 'uploads/';
const fs = require('fs');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory); // Directory to save uploaded files
  },
  filename: async (req, file, cb) => {
    try {
      if (!req.user || !req.user.id) {
        return cb(new Error('User ID not found in request'), null);
      }
      const userId = req.user.id; // Extracted from token
      const user = await User.findById(userId);
      if (user) {
        const filename = `${user.username}${user.score}${path.extname(file.originalname)}`;
        cb(null, filename);
      } else {
        cb(new Error('User not found'), null);
      }
    } catch (err) {
      console.error('Error generating filename:', err);
      cb(err, null);
    }
  }
});

const upload = multer({ storage });

module.exports = upload;
