const { db } = require('./database/init');

console.log('Testing database connection and users...');

// Check all users
db.all('SELECT id, email, name, role, google_id FROM users', [], (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  
  console.log('\nUsers in database:');
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}, Google ID: ${user.google_id || 'None'}`);
  });
  
  console.log(`\nTotal users: ${users.length}`);
  
  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\nDatabase connection closed.');
    }
  });
});