const express = require('express');
const http = require('http');
const path = require('path'); // Import path module
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/user');
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
