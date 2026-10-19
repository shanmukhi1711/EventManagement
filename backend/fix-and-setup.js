const { db } = require('./database/init');
const { v4: uuidv4 } = require('uuid');

console.log('Starting comprehensive fix and setup...');

// Function to update all registrations to attended status
const updateAttendanceRates = () => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE registrations 
      SET status = 'attended', certificate_downloaded = 1 
      WHERE status = 'registered'
    `, [], function(err) {
      if (err) {
        console.error('Error updating attendance rates:', err);
        reject(err);
      } else {
        console.log(`✅ Updated ${this.changes} registrations to attended status`);
        resolve(this.changes);
      }
    });
  });
};

// Function to create a new sample event for demo
const createSampleEvent = () => {
  return new Promise((resolve, reject) => {
    const sampleEvent = {
      id: 'demo-event-2025',
      title: 'Demo Event 2025 - Full Stack Workshop',
      category: 'Tech',
      date: 'December 15, 2025',
      venue: 'Innovation Lab - Block A',
      image: '/event-tech.svg',
      description: 'A comprehensive full-stack development workshop covering React, Node.js, and database integration. Perfect for students looking to build real-world applications.',
      organizer: 'Computer Science Department',
      club: 'Full Stack Developers Club',
      rules: JSON.stringify([
        'Bring your own laptop with Node.js installed',
        'Basic JavaScript knowledge required',
        'Teams of 2-3 members allowed',
        'Certificate provided upon completion',
        'Hands-on coding sessions included'
      ]),
      contact_email: 'fullstack@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43299'
    };

    db.run(`
      INSERT OR REPLACE INTO events (id, title, category, date, venue, image, description, organizer, club, rules, contact_email, contact_phone, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sampleEvent.id, sampleEvent.title, sampleEvent.category, sampleEvent.date, 
      sampleEvent.venue, sampleEvent.image, sampleEvent.description, sampleEvent.organizer, 
      sampleEvent.club, sampleEvent.rules, sampleEvent.contact_email, sampleEvent.contact_phone, null
    ], function(err) {
      if (err) {
        console.error('Error creating sample event:', err);
        reject(err);
      } else {
        console.log('✅ Created demo event: Demo Event 2025 - Full Stack Workshop');
        resolve(sampleEvent.id);
      }
    });
  });
};

// Function to register all users for the demo event
const registerUsersForDemoEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, email, name FROM users', [], (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        reject(err);
        return;
      }

      let completed = 0;
      const total = users.length;

      if (total === 0) {
        console.log('No users found to register');
        resolve(0);
        return;
      }

      users.forEach(user => {
        const registrationData = JSON.stringify({
          name: user.name,
          email: user.email,
          phone: '+91 98765 43210',
          rollNumber: user.email === 'admin@vnrvjiet.in' ? 'ADMIN001' : '21071A0501',
          branch: 'CSE',
          year: user.email === 'admin@vnrvjiet.in' ? 'Faculty' : '3rd Year',
          additionalInfo: 'Registered for demo event with full attendance'
        });

        db.run(`
          INSERT OR REPLACE INTO registrations (id, user_id, event_id, status, certificate_downloaded, registration_data)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), user.id, eventId, 'attended', true, registrationData], (regErr) => {
          completed++;
          if (regErr) {
            console.error(`Error registering user ${user.email}:`, regErr);
          } else {
            console.log(`✅ Registered ${user.email} for demo event`);
          }

          if (completed === total) {
            if (regErr) {
              reject(regErr);
            } else {
              console.log(`✅ All ${total} users registered for demo event`);
              resolve(total);
            }
          }
        });
      });
    });
  });
};

// Function to create comprehensive notifications for all users
const createNotificationsForAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, email, name FROM users', [], (err, users) => {
      if (err) {
        console.error('Error fetching users for notifications:', err);
        reject(err);
        return;
      }

      let completed = 0;
      const total = users.length;

      if (total === 0) {
        console.log('No users found for notifications');
        resolve(0);
        return;
      }

      users.forEach(user => {
        const notifications = [
          {
            id: uuidv4(),
            title: '🎉 Demo Setup Complete!',
            message: 'Your account has been set up with sample events, registrations, and certificates. All features are now ready for testing!',
            type: 'success'
          },
          {
            id: uuidv4(),
            title: '📜 Certificates Available',
            message: 'You have certificates available for download from completed events. Check your profile to download them!',
            type: 'success'
          },
          {
            id: uuidv4(),
            title: '🚀 Demo Event Added',
            message: 'A new demo event "Full Stack Workshop" has been added and you\'re registered with 100% attendance!',
            type: 'info'
          },
          {
            id: uuidv4(),
            title: '✨ All Features Active',
            message: 'Event registration, certificate download, and attendance tracking are all working perfectly. Explore the platform!',
            type: 'success'
          }
        ];

        let notificationCount = 0;
        notifications.forEach(notification => {
          db.run(`
            INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, read)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [notification.id, user.id, notification.title, notification.message, notification.type, false], (notErr) => {
            notificationCount++;
            if (notificationCount === notifications.length) {
              completed++;
              if (completed === total) {
                console.log(`✅ Created notifications for all ${total} users`);
                resolve(total);
              }
            }
          });
        });
      });
    });
  });
};

// Function to fix event dates to be more realistic
const fixEventDates = () => {
  return new Promise((resolve, reject) => {
    const updates = [
      { id: '1', date: 'December 15, 2025' },
      { id: '2', date: 'December 20, 2025' },
      { id: '3', date: 'December 25, 2025' },
      { id: '4', date: 'December 28, 2025' },
      { id: '16', date: 'November 15, 2024' }, // Past event for certificates
      { id: '17', date: 'December 5, 2024' }   // Past event for certificates
    ];

    let completed = 0;
    updates.forEach(update => {
      db.run('UPDATE events SET date = ? WHERE id = ?', [update.date, update.id], (err) => {
        completed++;
        if (err) {
          console.error(`Error updating event ${update.id}:`, err);
        }
        if (completed === updates.length) {
          console.log('✅ Fixed event dates');
          resolve();
        }
      });
    });
  });
};

// Main execution function
const runFixes = async () => {
  try {
    console.log('🔧 Starting comprehensive fixes...\n');

    // 1. Fix event dates
    await fixEventDates();

    // 2. Update all registrations to attended status
    await updateAttendanceRates();

    // 3. Create demo event
    const demoEventId = await createSampleEvent();

    // 4. Register all users for demo event
    await registerUsersForDemoEvent(demoEventId);

    // 5. Create notifications for all users
    await createNotificationsForAllUsers();

    console.log('\n🎉 All fixes completed successfully!');
    console.log('✅ Event dates updated');
    console.log('✅ All registrations marked as attended');
    console.log('✅ Demo event created and users registered');
    console.log('✅ Certificates enabled for all users');
    console.log('✅ Comprehensive notifications added');
    console.log('\n🚀 The website is now ready for demo with full functionality!');

  } catch (error) {
    console.error('❌ Error during fixes:', error);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
      }
      process.exit(0);
    });
  }
};

// Run the fixes
runFixes();