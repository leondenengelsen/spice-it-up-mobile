// server.js

const fs = require('fs');
const path = require('path');

// Write Firebase Admin SDK service account JSON to a file (for Railway)
if (process.env['gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json']) {
  const firebaseCredentialsPath = path.join(__dirname, 'gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json');
  fs.writeFileSync(firebaseCredentialsPath, process.env['gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json']);
  process.env.FIREBASE_ADMIN_CREDENTIALS = firebaseCredentialsPath;
}

require('dotenv').config(); // Load environment variables
const app = require('./app');
const PORT = process.env.PORT || 3000;
const db = require('./db'); // Import the db connection from db/index.js

// No need to create a separate connection, using the pool from db/index.js

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your browser at http://localhost:${PORT}`);
    console.log(`Access from your phone at http://192.168.0.211:${PORT}`);
});