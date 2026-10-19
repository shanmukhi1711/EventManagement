const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile with registered events
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log('Profile request for user ID:', userId);

  // Get user info
  db.get('SELECT id, email, name, role, profile_image, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Database error in profile route:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!user) {
      console.error('User not found for ID:', userId);
      // Try to find user by email as fallback
      db.get('SELECT id, email, name, role, profile_image, created_at FROM users WHERE email = ?', [req.user.email], (emailErr, emailUser) => {
        if (emailErr || !emailUser) {
          console.error('User not found by email either:', req.user.email);
          return res.status(404).json({
            success: false,
            message: 'User not found. Please log in again.'
          });
        }
        console.log('Found user by email, updating token user ID');
        // Continue with the found user
        processUserProfile(emailUser, res);
      });
      return;
    }

    console.log('User found:', user.email);
    processUserProfile(user, res);
  });
});

// Helper function to process user profile data
function processUserProfile(user, res) {
  const userId = user.id;

  // Get registered events
  db.all(`
    SELECT e.*, r.status as registration_status, r.certificate_downloaded
    FROM events e
    JOIN registrations r ON e.id = r.event_id
    WHERE r.user_id = ?
    ORDER BY e.date DESC
  `, [userId], (err, events) => {
    if (err) {
      console.error('Error fetching registered events:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch registered events'
      });
    }

    // Get notifications (increased limit and better ordering)
    db.all(`
      SELECT id, title, message, type, read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY read ASC, created_at DESC
      LIMIT 50
    `, [userId], (err, notifications) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch notifications'
        });
      }

      console.log('Profile data fetched successfully for user:', user.email);
      res.json({
        success: true,
        user,
        registeredEvents: events || [],
        notifications: notifications || []
      });
    });
  });
}

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update notification'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    }
  );
});

// Mark all notifications as read
router.put('/notifications/mark-all-read', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.run(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update notifications'
        });
      }

      res.json({
        success: true,
        message: `${this.changes} notifications marked as read`
      });
    }
  );
});

// Delete notification
router.delete('/notifications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  });
});

// Download certificate (only for attended events)
router.get('/certificate/:eventId', authenticateToken, (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Check if user attended the event
  db.get(`
    SELECT r.id, e.title, e.date, e.club, u.name, r.status
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ? AND r.event_id = ? AND r.status = 'attended'
  `, [userId, eventId], (err, data) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!data) {
      return res.status(403).json({
        success: false,
        message: 'Certificate not available. You must have attended this event.'
      });
    }

    // Generate certificate data
    const certificateData = {
      participantName: data.name,
      eventTitle: data.title,
      eventDate: data.date,
      club: data.club,
      certificateId: `CERT-${eventId}-${Date.now().toString().slice(-6)}`
    };

    // Mark certificate as downloaded
    db.run(
      'UPDATE registrations SET certificate_downloaded = 1 WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    res.json({
      success: true,
      certificate: certificateData,
      message: 'Certificate ready for download'
    });
  });
});

// Get unread notification count
router.get('/notifications/unread-count', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch unread count'
        });
      }

      res.json({
        success: true,
        count: result.count || 0
      });
    }
  );
});

// Get user's event statistics
router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Get registration counts
  db.get(`
    SELECT
      COUNT(*) as total_registered,
      COUNT(CASE WHEN status = 'attended' THEN 1 END) as total_attended,
      COUNT(CASE WHEN certificate_downloaded = 1 THEN 1 END) as certificates_downloaded
    FROM registrations
    WHERE user_id = ?
  `, [userId], (err, stats) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }

    // Get upcoming events
    db.all(`
      SELECT e.title, e.date, e.venue
      FROM events e
      JOIN registrations r ON e.id = r.event_id
      WHERE r.user_id = ? AND e.date >= date('now')
      ORDER BY e.date ASC
      LIMIT 5
    `, [userId], (err, upcomingEvents) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch upcoming events'
        });
      }

      res.json({
        success: true,
        stats,
        upcomingEvents
      });
    });
  });
});

// Create sample notifications for testing
router.post('/notifications/create-sample', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { v4: uuidv4 } = require('uuid');
  
  const sampleNotifications = [
    {
      id: uuidv4(),
      title: 'Welcome to VNR VJIET Events!',
      message: 'Thank you for joining our event management platform. Stay tuned for exciting events!',
      type: 'success'
    },
    {
      id: uuidv4(),
      title: 'New Event: CodeSprint 2025',
      message: 'A new tech event has been added. Register now to secure your spot!',
      type: 'info'
    },
    {
      id: uuidv4(),
      title: 'Event Reminder',
      message: 'Don\'t forget about the Cultural Fest happening tomorrow at APJ Audi.',
      type: 'warning'
    }
  ];

  let completed = 0;
  const total = sampleNotifications.length;

  sampleNotifications.forEach(notification => {
    db.run(
      'INSERT INTO notifications (id, user_id, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?)',
      [notification.id, userId, notification.title, notification.message, notification.type, false],
      (err) => {
        completed++;
        if (completed === total) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to create sample notifications'
            });
          }
          res.json({
            success: true,
            message: 'Sample notifications created successfully'
          });
        }
      }
    );
  });
});

module.exports = router;
