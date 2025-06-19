const fs = require('fs');
const path = require('path');

// Read the credentials file
const credentialsPath = path.join(__dirname, 'secrets/gen-lang-client-0251517490-157aa58a7fda.json');

try {
  const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
  const credentials = JSON.parse(credentialsContent);
  
  console.log('✅ Credentials file read successfully');
  console.log('Project ID:', credentials.project_id);
  console.log('Client Email:', credentials.client_email);
  
  // Convert to single line JSON string (escaped for environment variable)
  const credentialsJson = JSON.stringify(credentials);
  
  console.log('\n📋 Copy this value to your Railway environment variable GOOGLE_CLOUD_CREDENTIALS_JSON:');
  console.log('='.repeat(80));
  console.log(credentialsJson);
  console.log('='.repeat(80));
  
  console.log('\n🔧 Instructions:');
  console.log('1. Go to your Railway dashboard');
  console.log('2. Navigate to your project');
  console.log('3. Go to the "Variables" tab');
  console.log('4. Add a new variable:');
  console.log('   - Name: GOOGLE_CLOUD_CREDENTIALS_JSON');
  console.log('   - Value: (paste the JSON string above)');
  console.log('5. Save and redeploy your application');
  
} catch (error) {
  console.error('❌ Error reading credentials file:', error.message);
  process.exit(1);
} 