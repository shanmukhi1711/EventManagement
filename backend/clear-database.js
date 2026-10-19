const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database', 'events.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
  }
});

const clearDatabase = () => {
  console.log('Clearing database...');
  
  // Clear all tables in correct order (respecting foreign key constraints)
  const queries = [
    'DELETE FROM event_feedback',
    'DELETE FROM notifications', 
    'DELETE FROM registrations',
    'DELETE FROM events',
    'DELETE FROM users'
  ];

  let completed = 0;
  
  queries.forEach((query, index) => {
    db.run(query, (err) => {
      if (err) {
        console.error(`Error clearing table ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Cleared table ${index + 1}`);
      }
      
      completed++;
      if (completed === queries.length) {
        console.log('✅ Database cleared successfully!');
        db.close();
      }
    });
  });
};

clearDatabase();