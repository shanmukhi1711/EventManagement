const { db } = require('../database/init');

// Schedule notifications for upcoming events
const scheduleEventNotifications = () => {
  // Check for events happening tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Get all users registered for events tomorrow
  db.all(`
    SELECT u.id as user_id, u.email, e.title, e.date, e.venue
    FROM users u
    JOIN registrations r ON u.id = r.user_id
    JOIN events e ON r.event_id = e.id
    WHERE DATE(e.date) = DATE(?)
  `, [tomorrowStr], (err, results) => {
    if (err) {
      console.error('Error fetching upcoming events:', err);
      return;
    }

    results.forEach(result => {
      // Check if notification already exists
      db.get(
        'SELECT id FROM notifications WHERE user_id = ? AND title = ? AND DATE(created_at) = DATE(?)',
        [result.user_id, 'Event Reminder', new Date().toISOString().split('T')[0]],
        (err, existing) => {
          if (!existing) {
            // Create notification
            const { v4: uuidv4 } = require('uuid');
            db.run(
              'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
              [
                uuidv4(),
                result.user_id,
                'Event Reminder',
                `Don't forget! Your event "${result.title}" is tomorrow at ${result.venue}`,
                'warning'
              ],
              (err) => {
                if (err) {
                  console.error('Error creating notification:', err);
                } else {
                  console.log(`Notification created for user ${result.email} about event ${result.title}`);
                }
              }
            );
          }
        }
      );
    });
  });
};

// Mark users as attended for past events (simplified - in real app, this would be done by admins)
const markPastEventsAsAttended = () => {
  const today = new Date().toISOString().split('T')[0];

  db.run(`
    UPDATE registrations
    SET status = 'attended'
    WHERE status = 'registered'
    AND event_id IN (
      SELECT id FROM events WHERE DATE(date) < DATE(?)
    )
  `, [today], function(err) {
    if (err) {
      console.error('Error marking past events as attended:', err);
    } else if (this.changes > 0) {
      console.log(`Marked ${this.changes} registrations as attended`);
    }
  });
};

// Run notification scheduler every hour
const startNotificationScheduler = () => {
  console.log('Starting notification scheduler...');

  // Run immediately
  scheduleEventNotifications();
  markPastEventsAsAttended();

  // Schedule to run every hour
  setInterval(() => {
    scheduleEventNotifications();
    markPastEventsAsAttended();
  }, 60 * 60 * 1000); // 1 hour
};

module.exports = {
  startNotificationScheduler
};
