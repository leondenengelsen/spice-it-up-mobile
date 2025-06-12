//app.js

const express = require('express');
const app = express();
const path = require('path');
const aiRoutes = require('./routes/aiRoutes');
const optionsRoutes = require('./routes/optionsRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
require('dotenv').config();

console.log("✅ Loaded DB config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: !!process.env.DB_PASSWORD,
});

app.use(express.json());

// Health check endpoint for startup detection
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    message: 'Spice It Up server is running!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', aiRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
// Serve frontend static files (move this AFTER API routes)
app.use(express.static(path.join(__dirname, 'frontend')));

module.exports = app;