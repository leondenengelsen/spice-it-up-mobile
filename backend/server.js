// server.js

require('dotenv').config(); // Load environment variables
const app = require('./app');
const PORT = process.env.PORT || 3000;
const db = require('./db'); // Import the db connection from db/index.js

// No need to create a separate connection, using the pool from db/index.js

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});