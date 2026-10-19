const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Email validation for VNR VJIET
const validateEmail = (email) => {
  const adminEmail = 'admin@vnrvjiet.in';
  const candidatePattern = /^2\d070a0\d{3}@vnrvjiet\.in$/i;
  return email === adminEmail || candidatePattern.test(email);
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a valid VNR VJIET email address'
      });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (row) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const role = email === 'admin@vnrvjiet.in' ? 'admin' : 'candidate';

      // Insert user
      db.run(`
        INSERT INTO users (id, email, password, name, role)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, email, hashedPassword, name, role], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Failed to create user'
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: userId, email, role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
          success: true,
          message: `Account created as ${role}`,
          token,
          user: { id: userId, email, name, role }
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({
        success: true,
        message: `Logged in as ${user.role}`,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile_image: user.profile_image
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, role, profile_image, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  });
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, profile_image } = req.body;

  db.run(`
    UPDATE users
    SET name = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, profile_image, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  });
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Firebase login/upsert (for Google sign-in on frontend)
router.post('/firebase', (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // First check by email, then by google_id
    db.get('SELECT * FROM users WHERE email = ? LIMIT 1', [email], (err, user) => {
      if (err) {
        console.error('Database error in firebase auth:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const finish = (u) => {
        const token = jwt.sign(
          { id: u.id, email: u.email, role: u.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );
        console.log('Firebase auth successful for user:', u.email);
        return res.json({ 
          success: true, 
          token, 
          user: { id: u.id, email: u.email, name: u.name, role: u.role, profile_image: u.profile_image } 
        });
      };

      if (user) {
        // Update google_id if not set
        if (!user.google_id && googleId) {
          db.run('UPDATE users SET google_id = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [googleId, name || user.name, user.id], 
            (updateErr) => {
              if (updateErr) {
                console.error('Error updating user google_id:', updateErr);
              }
              finish({ ...user, name: name || user.name, google_id: googleId });
            }
          );
        } else {
          // Update name if provided
          if (name && name !== user.name) {
            db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
              [name, user.id], 
              (updateErr) => {
                if (updateErr) {
                  console.error('Error updating user name:', updateErr);
                }
                finish({ ...user, name });
              }
            );
          } else {
            finish(user);
          }
        }
      } else {
        // Create new user
        const userId = uuidv4();
        const role = email === 'admin@vnrvjiet.in' ? 'admin' : 'candidate';
        const userName = name || email.split('@')[0];
        
        console.log('Creating new user:', { userId, email, userName, role });
        
        db.run(
          'INSERT INTO users (id, email, password, name, role, google_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [userId, email, userName, role, googleId || null],
          function(insertErr) {
            if (insertErr) {
              console.error('Error creating user:', insertErr);
              return res.status(500).json({ success: false, message: 'Failed to create user' });
            }
            console.log('User created successfully:', userId);
            finish({ id: userId, email, name: userName, role, google_id: googleId });
          }
        );
      }
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
