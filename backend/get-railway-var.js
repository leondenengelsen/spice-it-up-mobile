const fs = require('fs');
const path = require('path');

// Read the credentials file
const credentialsPath = path.join(__dirname, 'secrets/gen-lang-client-0251517490-157aa58a7fda.json');

try {
  const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
  
  console.log('✅ Credentials file read successfully');
  
  console.log('\n📋 Set this environment variable on Railway:');
  console.log('='.repeat(80));
  console.log('Variable Name: gen-lang-client-0251517490-157aa58a7fda.json');
  console.log('Variable Value:');
  console.log(credentialsContent);
  console.log('='.repeat(80));
  
  console.log('\n🔧 Instructions:');
  console.log('1. Go to your Railway dashboard');
  console.log('2. Navigate to your project');
  console.log('3. Go to the "Variables" tab');
  console.log('4. Add a new variable:');
  console.log('   - Name: gen-lang-client-0251517490-157aa58a7fda.json');
  console.log('   - Value: (paste the entire JSON content above)');
  console.log('5. Save and redeploy your application');
  
} catch (error) {
  console.error('❌ Error reading credentials file:', error.message);
  process.exit(1);
} 