const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/init');
const { authenticateToken, requireRole, getUserFromToken } = require('../middleware/auth');

const router = express.Router();

// Get all events (public)
router.get('/', getUserFromToken, (req, res) => {
  const { category, search, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM events WHERE 1=1';
  let params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR organizer LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, events) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch events'
      });
    }

    // Parse rules (handle both JSON and legacy string formats)
    const parseRules = (rules) => {
      if (!rules) return [];
      if (typeof rules === 'string') {
        try {
          const parsed = JSON.parse(rules);
          return Array.isArray(parsed) ? parsed : [rules];
        } catch {
          return rules.split('\n').filter(r => r.trim());
        }
      }
      return Array.isArray(rules) ? rules : [];
    };

    events = events.map(event => ({
      ...event,
      rules: parseRules(event.rules)
    }));

    // If user is logged in, check registration status
    if (req.user) {
      const eventIds = events.map(e => e.id);
      if (eventIds.length > 0) {
        const placeholders = eventIds.map(() => '?').join(',');
        db.all(
          `SELECT event_id, status FROM registrations WHERE user_id = ? AND event_id IN (${placeholders})`,
          [req.user.id, ...eventIds],
          (err, registrations) => {
            if (!err) {
              const regMap = {};
              registrations.forEach(reg => {
                regMap[reg.event_id] = reg.status;
              });

              events = events.map(event => ({
                ...event,
                isRegistered: !!regMap[event.id],
                registrationStatus: regMap[event.id] || null
              }));
            }

            res.json({
              success: true,
              events
            });
          }
        );
      } else {
        res.json({
          success: true,
          events
        });
      }
    } else {
      res.json({
        success: true,
        events
      });
    }
  });
});

// Get single event (public)
router.get('/:id', getUserFromToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Parse rules (handle both JSON and legacy string formats)
    const parseRules = (rules) => {
      if (!rules) return [];
      if (typeof rules === 'string') {
        try {
          const parsed = JSON.parse(rules);
          return Array.isArray(parsed) ? parsed : [rules];
        } catch {
          return rules.split('\n').filter(r => r.trim());
        }
      }
      return Array.isArray(rules) ? rules : [];
    };

    event.rules = parseRules(event.rules);

    // If user is logged in, check registration and feedback status
    if (req.user) {
      db.get(
        'SELECT status FROM registrations WHERE user_id = ? AND event_id = ?',
        [req.user.id, id],
        (err, registration) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          // Check if user has provided feedback
          db.get(
            'SELECT id FROM event_feedback WHERE user_id = ? AND event_id = ?',
            [req.user.id, id],
            (err, feedback) => {
              const eventWithReg = {
                ...event,
                isRegistered: !!registration,
                registrationStatus: registration ? registration.status : null,
                hasFeedback: !!feedback
              };

              res.json({
                success: true,
                event: eventWithReg
              });
            }
          );
        }
      );
    } else {
      res.json({
        success: true,
        event
      });
    }
  });
});

// Create event (admin only)
router.post('/', authenticateToken, requireRole(['admin']), (req, res) => {
  const {
    title,
    category,
    date,
    venue,
    image,
    description,
    organizer,
    club,
    rules,
    contact_email,
    contact_phone
  } = req.body;

  // Validation
  if (!title || !category || !date || !venue || !description || !organizer || !contact_email) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: title, category, date, venue, description, organizer, contact_email'
    });
  }

  const eventId = uuidv4();
  const rulesJson = Array.isArray(rules) ? JSON.stringify(rules) : (rules ? JSON.stringify(rules.split('\n').filter(r => r.trim())) : '[]');

  db.run(`
    INSERT INTO events (id, title, category, date, venue, image, description, organizer, club, rules, contact_email, contact_phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [eventId, title, category, date, venue, image || '/event-default.svg', description, organizer, club || 'General Club', rulesJson, contact_email, contact_phone || '', req.user.id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create event'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      eventId
    });
  });
});

// Update event (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove id from updates
  delete updates.id;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }

  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(id);

  db.run(
    `UPDATE events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update event'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      res.json({
        success: true,
        message: 'Event updated successfully'
      });
    }
  );
});

// Delete event (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  });
});

// Register for event
router.post('/:id/register', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, email, phone, rollNumber, branch, year, additionalInfo } = req.body;

  // Validate required fields
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and phone are required'
    });
  }

  // Check if event exists and get event details
  db.get('SELECT id, title, date FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event date has passed
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    
    if (eventDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events'
      });
    }

    // Check if already registered
    db.get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [userId, id], (err, registration) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (registration) {
        return res.status(400).json({
          success: false,
          message: 'Already registered for this event'
        });
      }

      // Register user with additional data
      const registrationData = JSON.stringify({
        name,
        email,
        phone,
        rollNumber: rollNumber || '',
        branch: branch || '',
        year: year || '',
        additionalInfo: additionalInfo || ''
      });

      db.run(
        'INSERT INTO registrations (id, user_id, event_id, registration_data) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, id, registrationData],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to register for event'
            });
          }

          // Create multiple notifications
          const notifications = [
            {
              id: uuidv4(),
              title: '🎉 Registration Successful!',
              message: `You've successfully registered for "${event.title}". Get ready for an amazing December event!`,
              type: 'success'
            },
            {
              id: uuidv4(),
              title: '📅 December Event Reminder',
              message: `Don't forget about "${event.title}" on ${new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Mark your calendar!`,
              type: 'info'
            },
            {
              id: uuidv4(),
              title: '🎄 End Year with Impact',
              message: `Make your December memorable with "${event.title}". Bring your enthusiasm and network with fellow students!`,
              type: 'info'
            }
          ];

          notifications.forEach(notification => {
            db.run(
              'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
              [notification.id, userId, notification.title, notification.message, notification.type],
              () => {} // Ignore errors for notifications
            );
          });

          res.json({
            success: true,
            message: 'Successfully registered for event'
          });
        }
      );
    });
  });
});

// Unregister from event
router.delete('/:id/register', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM registrations WHERE user_id = ? AND event_id = ?', [userId, id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to unregister from event'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  });
});

// Get registration status for event
router.get('/:id/registration-status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?', [userId, id], (err, registration) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      isRegistered: !!registration,
      registrationStatus: registration ? registration.status : null
    });
  });
});

// Submit feedback for event
router.post('/:id/feedback', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { rating, feedback } = req.body;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  // Check if user is registered for the event
  db.get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [userId, id], (err, registration) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to provide feedback'
      });
    }

    // Check if feedback already exists
    db.get('SELECT id FROM event_feedback WHERE user_id = ? AND event_id = ?', [userId, id], (err, existingFeedback) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (existingFeedback) {
        return res.status(400).json({
          success: false,
          message: 'You have already provided feedback for this event'
        });
      }

      // Insert feedback
      const feedbackId = uuidv4();
      db.run(
        'INSERT INTO event_feedback (id, user_id, event_id, rating, feedback) VALUES (?, ?, ?, ?, ?)',
        [feedbackId, userId, id, rating, feedback || ''],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to submit feedback'
            });
          }

          res.json({
            success: true,
            message: 'Feedback submitted successfully'
          });
        }
      );
    });
  });
});

// Get event feedback (admin only)
router.get('/:id/feedback', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT ef.rating, ef.feedback, ef.created_at, u.name, u.email
    FROM event_feedback ef
    JOIN users u ON ef.user_id = u.id
    WHERE ef.event_id = ?
    ORDER BY ef.created_at DESC
  `, [id], (err, feedbacks) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }

    // Calculate average rating
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;

    res.json({
      success: true,
      feedback: feedbacks,
      averageRating: Math.round(avgRating * 10) / 10,
      totalFeedback: feedbacks.length
    });
  });
});

module.exports = router;
