const { db } = require('./database/init');
const { v4: uuidv4 } = require('uuid');

console.log('Setting up demo data with 1 registration and 1 certificate...');

const setupDemoData = () => {
  return new Promise((resolve, reject) => {
    // First, clear existing registrations
    db.run('DELETE FROM registrations', [], (err) => {
      if (err) {
        console.error('Error clearing registrations:', err);
        reject(err);
        return;
      }

      // Get all users
      db.all('SELECT id, email, name FROM users', [], (err, users) => {
        if (err) {
          console.error('Error fetching users:', err);
          reject(err);
          return;
        }

        let completed = 0;
        const total = users.length;

        users.forEach(user => {
          // Add 1 completed event with certificate
          const completedRegistration = {
            id: uuidv4(),
            user_id: user.id,
            event_id: '16', // Web Development Bootcamp (past event)
            status: 'attended',
            certificate_downloaded: true,
            registration_data: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: '+91 98765 43210',
              rollNumber: user.email === 'admin@vnrvjiet.in' ? 'ADMIN001' : '21071A0501',
              branch: 'CSE',
              year: user.email === 'admin@vnrvjiet.in' ? 'Faculty' : '3rd Year',
              additionalInfo: 'Successfully completed with certificate'
            })
          };

          // Add 1 upcoming registered event
          const upcomingRegistration = {
            id: uuidv4(),
            user_id: user.id,
            event_id: '1', // CodeSprint 2025 (upcoming event)
            status: 'registered',
            certificate_downloaded: false,
            registration_data: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: '+91 98765 43210',
              rollNumber: user.email === 'admin@vnrvjiet.in' ? 'ADMIN001' : '21071A0501',
              branch: 'CSE',
              year: user.email === 'admin@vnrvjiet.in' ? 'Faculty' : '3rd Year',
              additionalInfo: 'Excited to participate!'
            })
          };

          // Insert both registrations
          db.run(`
            INSERT INTO registrations (id, user_id, event_id, status, certificate_downloaded, registration_data)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            completedRegistration.id, completedRegistration.user_id, completedRegistration.event_id,
            completedRegistration.status, completedRegistration.certificate_downloaded, completedRegistration.registration_data
          ], (err1) => {
            if (err1) {
              console.error(`Error inserting completed registration for ${user.email}:`, err1);
            } else {
              console.log(`✅ Added completed event for ${user.email}`);
            }

            db.run(`
              INSERT INTO registrations (id, user_id, event_id, status, certificate_downloaded, registration_data)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              upcomingRegistration.id, upcomingRegistration.user_id, upcomingRegistration.event_id,
              upcomingRegistration.status, upcomingRegistration.certificate_downloaded, upcomingRegistration.registration_data
            ], (err2) => {
              if (err2) {
                console.error(`Error inserting upcoming registration for ${user.email}:`, err2);
              } else {
                console.log(`✅ Added upcoming event for ${user.email}`);
              }

              completed++;
              if (completed === total) {
                console.log('✅ Demo data setup complete!');
                resolve();
              }
            });
          });
        });
      });
    });
  });
};

// Run the setup
setupDemoData()
  .then(() => {
    console.log('🎉 Demo data configured successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting up demo data:', error);
    process.exit(1);
  });