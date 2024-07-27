const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/user');
const multer = require('multer');
const fs = require('fs');
const authenticateToken = require('./authMiddleware'); // Ensure you have the correct path to your middleware
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // For development only. Restrict this in production.
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: '*', // For development only. Restrict this in production.
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure 'uploads/' directory exists and is writable
const uploadDirectory = 'uploads/';
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure multer storage for file uploads
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
      const user = await User.findById(userId); // Fetch user to get the username and score
      if (user) {
        // Create filename based on username and score
        const filename = `${user.username}${user.score}${path.extname(file.originalname)}`;
        cb(null, filename); // Set the filename
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

// Define the route for uploading photos
app.post('/api/upload-photo', authenticateToken, upload.single('photo'), (req, res) => {
  if (req.file) {
    res.status(200).json({ message: 'File uploaded successfully' });
  } else {
    res.status(400).json({ message: 'No file uploaded' });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Use user routes
app.use('/api', userRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('incrementScore', async () => {
    try {
      const users = await User.find().sort({ score: -1 }).limit(30);
      io.emit('leaderboardUpdate', users); // Emit updated leaderboard
      console.log("Leaderboard updated");
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
