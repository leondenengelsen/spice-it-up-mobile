const db = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function migrateOptionsTable() {
  try {
    console.log('🔄 Starting options table migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrate-options.sql');
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
    
    console.log('✅ Options table migration completed successfully!');
    
    // Verify the new table structure
    const [structure] = await db.query('DESCRIBE options');
    console.log('\n📋 New options table structure:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateOptionsTable(); 