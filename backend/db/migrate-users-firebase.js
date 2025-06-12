const db = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function migrateUsersToFirebase() {
  try {
    console.log('🔄 Starting users table migration to Firebase structure...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrate-users-firebase.sql');
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
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new table structure
    const [structure] = await db.query('DESCRIBE users');
    console.log('\n📋 New users table structure:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // Verify the temporary user
    const [tempUser] = await db.query('SELECT * FROM users WHERE firebase_uid = ?', ['temp_migration_uid']);
    console.log('\n✅ Temporary user created:', tempUser[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 Rolling back changes...');
    try {
      // Rollback if something went wrong
      await db.query('DROP TABLE IF EXISTS users');
      await db.query('RENAME TABLE users_backup TO users');
      console.log('✅ Rollback completed successfully');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
  } finally {
    process.exit(0);
  }
}

// Only run if executed directly
if (require.main === module) {
  migrateUsersToFirebase();
} 