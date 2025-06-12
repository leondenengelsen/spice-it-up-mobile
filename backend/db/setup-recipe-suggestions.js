const db = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function setupRecipeSuggestionsTable() {
  try {
    console.log('🔄 Setting up recipe_suggestions table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_recipe_suggestions.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('✅ Executed:', statement.trim().split('\n')[0] + '...');
      }
    }
    
    console.log('✅ Recipe suggestions table setup complete!');
    
    // Verify the table structure
    const [structure] = await db.query('DESCRIBE recipe_suggestions');
    console.log('\n📋 Table structure:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up recipe_suggestions table:', error);
  } finally {
    process.exit(0);
  }
}

setupRecipeSuggestionsTable(); 