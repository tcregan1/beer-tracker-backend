const multer = require('multer');
const path = require('path');
const User = require('./models/user'); // Ensure the path to your User model is correct

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save uploaded files
  },
  filename: async (req, file, cb) => {
    try {
      const userId = req.user.id; // Extracted from token
      const user = await User.findById(userId); // Fetch user to get the username and score
      if (user) {
        // Create filename based on username and score
        const filename = `${user.username}${user.score}${path.extname(file.originalname)}`;
        cb(null, filename); // Set the filename
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
