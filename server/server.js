require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins in dev, can lock down in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root verification route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'ClassPortal API Backend Service is fully operational.',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Database Connection and Server Startup
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

console.log('Connecting to MongoDB database...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
