//app.js

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const aiRoutes = require('./routes/aiRoutes');
const optionsRoutes = require('./routes/optionsRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const speechRoutes = require('./routes/speechRoutes');
const fs = require('fs');
require('dotenv').config();

console.log("✅ Loaded DB config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: !!process.env.DB_PASSWORD,
});

// Enable CORS with specific options
const allowedOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://192.168.0.211:3000',
  'https://spice-it-up-api.onrender.com',
  'https://spice-it-up.onrender.com',
  'https://spice-it-up-app.netlify.app' // Netlify frontend
];

// Add any additional origins from environment variable
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',');
  allowedOrigins.push(...additionalOrigins);
}

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('⚠️ CORS blocked request from:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
    
    console.log('✅ CORS allowed request from:', origin);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Ensure Express handles preflight OPTIONS requests for all routes
app.options('*', cors());

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
app.use('/api', speechRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);

// Serve frontend static files (AFTER all API routes)
app.use(express.static(path.join(__dirname, 'frontend')));

// Handle Google service account credentials for Railway
if (process.env.RAILWAY_ENVIRONMENT_NAME) { // Only do this on Railway
  // Speech-to-Text service account
  if (process.env['gen-lang-client-0251517490-157aa58a7fda.json']) {
    const speechCredentialsPath = path.join(__dirname, 'gen-lang-client-0251517490-157aa58a7fda.json');
    fs.writeFileSync(speechCredentialsPath, process.env['gen-lang-client-0251517490-157aa58a7fda.json']);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = speechCredentialsPath;
  }
  // Firebase Admin SDK service account
  if (process.env['gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json']) {
    const firebaseCredentialsPath = path.join(__dirname, 'gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json');
    fs.writeFileSync(firebaseCredentialsPath, process.env['gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json']);
    // If you want to use this for Firebase, set a custom env var or use directly in your Firebase init
    process.env.FIREBASE_ADMIN_CREDENTIALS = firebaseCredentialsPath;
  }
}

module.exports = app;