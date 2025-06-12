const db = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function fixFavoritesForeignKey() {
  try {
    console.log('🔄 Starting favorites foreign key fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-favorites-foreign-key.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
          console.log('✅ Executed:', statement.trim().split('\n')[0] + '...');
        } catch (error) {
          console.error('❌ Error executing statement:', error);
          throw error;
        }
      }
    }
    
    console.log('✅ Favorites foreign key fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixFavoritesForeignKey(); 