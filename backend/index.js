require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', require('./routes/mentorRoutes')); // All routes under /api
app.use('/api/m', require('./routes/menteeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.get('/', (req, res) => res.send('Mentorship API Running'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));