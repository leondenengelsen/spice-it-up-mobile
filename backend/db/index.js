// index.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Get environment and determine if running in Docker
const isDevelopment = process.env.NODE_ENV === 'development';
const isDocker = process.env.DB_HOST === 'mysql' || process.env.DOCKER_ENV === 'true';

// Database configuration with Docker Compose support
const dbConfig = {
  host: process.env.DB_HOST || (isDocker ? 'mysql' : 'localhost'),
  port: process.env.DB_PORT || (isDocker ? 3306 : 3307),
  user: process.env.DB_USER || 'spice_user',
  password: process.env.DB_PASSWORD || 'spicepass',
  database: process.env.DB_NAME || 'spice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds for Docker startup
  acquireTimeout: 30000, // 30 seconds for Docker startup
  timeout: 30000,
  idleTimeout: 60000, // Close idle connections after 60 seconds
  debug: isDevelopment
};

// Log database connection details (without showing password)
console.log('✅ Loaded DB config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  isDocker: isDocker,
  mode: isDevelopment ? 'development' : 'production'
});

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Wrap the pool with error handling and logging
const db = {
  query: async (...args) => {
    try {
      const result = await pool.query(...args);
      if (isDevelopment) {
        console.log('🔍 Query executed:', args[0]);
        console.log('📝 Parameters:', args[1] || []);
      }
      return result;
    } catch (error) {
      console.error('❌ Database error:', {
        query: args[0],
        params: args[1] || [],
        error: error.message
      });
      throw error;
    }
  },
  getConnection: async () => {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Got database connection');
      return connection;
    } catch (error) {
      console.error('❌ Error getting database connection:', error);
      throw error;
    }
  }
};

// Test the connection when the server starts with retry logic
const testConnection = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Connected to MySQL successfully!');
      connection.release();
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        if (!isDevelopment) {
          console.error('❌ Cannot proceed without database in production mode');
          process.exit(1);
        }
        return false;
      }
      
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Start connection test
testConnection().then(success => {
  if (success) {
    console.log('🚀 Database connection established, ready to serve requests');
  } else {
    console.log('⚠️ Running without database connection (development mode)');
  }
});

module.exports = db;