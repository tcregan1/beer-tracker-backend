const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); // Ensure this path is correct
const User = require('./models/user'); // Import the User model
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://192.168.1.100:3001'], // Allow both localhost and your IP
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: '*', // For development only. Restrict this in production
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Use user routes
app.use('/api', userRoutes);

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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
