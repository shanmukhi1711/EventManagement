const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'events.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'candidate' CHECK (role IN ('admin', 'candidate')),
        google_id TEXT UNIQUE,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
        reject(err);
        return;
      }
      console.log('Users table ready');
    });

    // Create events table
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        venue TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        organizer TEXT NOT NULL,
        club TEXT NOT NULL,
        rules TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating events table:', err.message);
        reject(err);
        return;
      }
      console.log('Events table ready');
    });

    // Create registrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended')),
        certificate_downloaded BOOLEAN DEFAULT FALSE,
        registration_data TEXT,
        UNIQUE(user_id, event_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating registrations table:', err.message);
        reject(err);
        return;
      }
      console.log('Registrations table ready');
    });

    // Create notifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
        read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating notifications table:', err.message);
        reject(err);
        return;
      }
      console.log('Notifications table ready');
    });

    // Create event_feedback table
    db.run(`
      CREATE TABLE IF NOT EXISTS event_feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating event_feedback table:', err.message);
        reject(err);
        return;
      }
      console.log('Event feedback table ready');
    });

    // Add registration_data column if it doesn't exist
    db.run('ALTER TABLE registrations ADD COLUMN registration_data TEXT', () => {});

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_feedback_user ON event_feedback(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_feedback_event ON event_feedback(event_id)');

    // Insert default admin user if not exists
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@vnrvjiet.in';
    const adminPassword = bcrypt.hashSync('sai@123', 10);

    db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
      if (err) {
        console.error('Error checking admin user:', err.message);
        reject(err);
        return;
      }

      if (!row) {
        db.run(`
          INSERT INTO users (id, email, password, name, role)
          VALUES (?, ?, ?, ?, ?)
        `, [require('uuid').v4(), adminEmail, adminPassword, 'Admin User', 'admin'], (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('Default admin user created');
          }
        });
      }
    });

    // Insert sample events
    insertSampleEvents(db);
    
    // Insert sample registrations and notifications for demo
    insertSampleData(db);

    resolve();
  });
};

const insertSampleEvents = (db) => {
  const sampleEvents = [
    {
      id: '1',
      title: 'CodeSprint 2025',
      category: 'Tech',
      date: 'December 15, 2025',
      venue: 'C Block - Room 317',
      image: '/event-tech.svg',
      description: 'A 24-hour hackathon where innovation meets code. Build solutions for real-world problems.',
      organizer: 'CSE Department',
      club: 'ACM Student Chapter',
      rules: JSON.stringify(['Teams of 2-4 members', 'Bring your own laptop', 'Original code only', 'Judging based on innovation, implementation, and presentation']),
      contact_email: 'rajesh@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43210'
    },
    {
      id: '2',
      title: 'Cultural Fest 2025',
      category: 'Cultural',
      date: 'December 20, 2025',
      venue: 'APJ Audi',
      image: '/event-cultural.svg',
      description: 'Celebrate diversity through music, dance, and art. Showcase your talent!',
      organizer: 'Cultural Committee',
      club: 'Livewire (Dance Club)',
      rules: JSON.stringify(['Open to all students', 'Register your performance in advance', 'Time limit: 10 minutes per performance', 'Props and costumes allowed']),
      contact_email: 'priya@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43211'
    },
    {
      id: '3',
      title: 'Inter-College Sports Meet',
      category: 'Sports',
      date: 'December 25, 2025',
      venue: 'Sports Complex',
      image: '/event-sports.svg',
      description: 'Compete in athletics, cricket, basketball, and more. Show your sporting spirit!',
      organizer: 'Sports Committee',
      club: 'Sports & Athletics Club',
      rules: JSON.stringify(['Valid college ID required', 'Sportswear mandatory', 'Medical certificate needed for participation', 'Follow fair play guidelines']),
      contact_email: 'arun@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43212'
    },
    {
      id: '4',
      title: 'AI & ML Workshop',
      category: 'Tech',
      date: 'December 28, 2025',
      venue: 'PG Block - Room 215',
      image: '/event-tech.jpg',
      description: 'Learn the fundamentals of AI and Machine Learning from industry experts.',
      organizer: 'CSE Department',
      club: 'IEEE Student Chapter',
      rules: JSON.stringify(['Basic programming knowledge required', 'Limited seats - register early', 'Laptops mandatory', 'Certificate of participation provided']),
      contact_email: 'sandeep@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43213'
    },
    {
      id: '5',
      title: 'Battle of Bands',
      category: 'Cultural',
      date: 'April 10, 2025',
      venue: 'KS Audi',
      image: '/event-cultural.jpg',
      description: 'Rock the stage with your band! Original compositions encouraged.',
      organizer: 'Music Club',
      club: 'Crescendo (Music Club)',
      rules: JSON.stringify(['Bands of 3-6 members', '20 minutes performance time', 'Original or cover songs allowed', 'Sound equipment provided']),
      contact_email: 'vikram@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43214'
    },
    {
      id: '6',
      title: 'Marathon for a Cause',
      category: 'Sports',
      date: 'April 15, 2025',
      venue: 'Campus & Surroundings',
      image: '/event-sports.jpg',
      description: 'Run for charity! All proceeds go to local NGOs supporting education.',
      organizer: 'NSS Unit',
      club: 'NSS & Social Welfare',
      rules: JSON.stringify(['Registration fee: ₹200', 'Age limit: 16+', 'Medical checkup recommended', 'T-shirt and certificate for all participants']),
      contact_email: 'anita@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43215'
    },
    {
      id: '7',
      title: 'Robotics Competition',
      category: 'Tech',
      date: 'April 20, 2025',
      venue: 'Innovation Lab',
      image: '/event-tech.jpg',
      description: 'Build and compete with autonomous robots in various challenges.',
      organizer: 'ECE Department',
      club: 'Robotics Club',
      rules: JSON.stringify(['Teams of 3-5 members', 'Arduino/Raspberry Pi based robots', 'Safety guidelines mandatory', 'Innovation and performance judged']),
      contact_email: 'rohit@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43216'
    },
    {
      id: '8',
      title: 'Debate Championship',
      category: 'Cultural',
      date: 'April 25, 2025',
      venue: 'Seminar Hall',
      image: '/event-cultural.jpg',
      description: 'Sharpen your argumentation skills in this prestigious debate competition.',
      organizer: 'English Department',
      club: 'Literary Club',
      rules: JSON.stringify(['Individual or team participation', 'Topics announced on spot', 'Time limits: 5 min speech + 2 min rebuttal', 'Judged on content, delivery, and rebuttal']),
      contact_email: 'meera@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43217'
    },
    {
      id: '9',
      title: 'Basketball Tournament',
      category: 'Sports',
      date: 'May 1, 2025',
      venue: 'Basketball Court',
      image: '/event-sports.jpg',
      description: 'Fast-paced basketball action with teams from various colleges.',
      organizer: 'Sports Committee',
      club: 'Basketball Club',
      rules: JSON.stringify(['5 players per team', 'FIBA rules apply', 'Valid college ID required', 'Knockout format']),
      contact_email: 'karthik@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43218'
    },
    {
      id: '10',
      title: 'Photography Contest',
      category: 'Cultural',
      date: 'May 5, 2025',
      venue: 'Campus Grounds',
      image: '/event-cultural.jpg',
      description: 'Capture the beauty of campus life through your lens.',
      organizer: 'Fine Arts Club',
      club: 'Photography Club',
      rules: JSON.stringify(['Digital or film entries', 'Theme: Campus Life', 'Maximum 5 photos per participant', 'Original work only']),
      contact_email: 'divya@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43219'
    },
    {
      id: '11',
      title: 'Cyber Security Workshop',
      category: 'Tech',
      date: 'May 10, 2025',
      venue: 'Computer Lab 1',
      image: '/event-tech.jpg',
      description: 'Learn ethical hacking and cybersecurity best practices.',
      organizer: 'CSE Department',
      club: 'Cyber Security Club',
      rules: JSON.stringify(['Basic computer knowledge required', 'Laptops mandatory', 'Hands-on sessions included', 'Certificate provided']),
      contact_email: 'rahul@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43220'
    },
    {
      id: '12',
      title: 'Dance Competition',
      category: 'Cultural',
      date: 'May 15, 2025',
      venue: 'Main Auditorium',
      image: '/event-cultural.jpg',
      description: 'Showcase your dance moves in various styles and categories.',
      organizer: 'Cultural Committee',
      club: 'Dance Club',
      rules: JSON.stringify(['Solo, duo, or group performances', 'Time limit: 3-5 minutes', 'Original choreography preferred', 'Professional judges panel']),
      contact_email: 'priya@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43221'
    },
    {
      id: '13',
      title: 'Cricket Tournament',
      category: 'Sports',
      date: 'May 20, 2025',
      venue: 'Cricket Ground',
      image: '/event-sports.jpg',
      description: 'Inter-college cricket championship with exciting matches.',
      organizer: 'Sports Committee',
      club: 'Cricket Club',
      rules: JSON.stringify(['11 players per team', 'Standard cricket rules', 'Valid college ID required', 'League + knockout format']),
      contact_email: 'suresh@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43222'
    },
    {
      id: '14',
      title: 'Startup Pitch Competition',
      category: 'Tech',
      date: 'May 25, 2025',
      venue: 'Conference Room',
      image: '/event-tech.jpg',
      description: 'Pitch your innovative startup ideas to investors and mentors.',
      organizer: 'Entrepreneurship Cell',
      club: 'E-Cell',
      rules: JSON.stringify(['Teams of 2-4 members', '5-minute pitch + 5-minute Q&A', 'Business plan required', 'Cash prizes for winners']),
      contact_email: 'naveen@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43223'
    },
    {
      id: '15',
      title: 'Art Exhibition',
      category: 'Cultural',
      date: 'May 30, 2025',
      venue: 'Art Gallery',
      image: '/event-cultural.jpg',
      description: 'Display your artistic creations and explore others work.',
      organizer: 'Fine Arts Department',
      club: 'Art Club',
      rules: JSON.stringify(['Paintings, sculptures, digital art', 'Theme: Freedom', 'Maximum 3 entries per artist', 'Voting by visitors']),
      contact_email: 'kavya@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43224'
    },
    {
      id: '16',
      title: 'Web Development Bootcamp',
      category: 'Tech',
      date: 'November 15, 2024',
      venue: 'Computer Lab 2',
      image: '/event-tech.jpg',
      description: 'Intensive 3-day bootcamp covering HTML, CSS, JavaScript, and React.',
      organizer: 'CSE Department',
      club: 'Web Development Club',
      rules: JSON.stringify(['Basic computer knowledge required', 'Laptops mandatory', 'Complete all assignments', 'Certificate for completion']),
      contact_email: 'arjun@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43225'
    },
    {
      id: '17',
      title: 'Winter Music Festival',
      category: 'Cultural',
      date: 'December 5, 2024',
      venue: 'Main Auditorium',
      image: '/event-cultural.jpg',
      description: 'Celebrate the season with music performances from various artists.',
      organizer: 'Cultural Committee',
      club: 'Music Club',
      rules: JSON.stringify(['Open to all performers', '15 minutes per performance', 'Sound check mandatory', 'Audience voting for best performance']),
      contact_email: 'sneha@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43226'
    },
    {
      id: '18',
      title: 'Data Science Workshop',
      category: 'Tech',
      date: 'December 10, 2024',
      venue: 'Data Science Lab',
      image: '/event-tech.jpg',
      description: 'Hands-on workshop on data analysis, visualization, and machine learning basics.',
      organizer: 'CSE Department',
      club: 'Data Science Club',
      rules: JSON.stringify(['Python knowledge preferred', 'Bring laptop with required software', 'Group projects included', 'Portfolio-worthy projects']),
      contact_email: 'vikas@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43227'
    },
    {
      id: '19',
      title: 'New Year Sports Challenge',
      category: 'Sports',
      date: 'January 2, 2025',
      venue: 'Sports Complex',
      image: '/event-sports.jpg',
      description: 'Start the new year with exciting sports competitions and fitness challenges.',
      organizer: 'Sports Committee',
      club: 'Fitness Club',
      rules: JSON.stringify(['Multiple sports categories', 'Team and individual events', 'Medical fitness certificate required', 'Prizes for winners']),
      contact_email: 'ravi@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43228'
    },
    {
      id: '20',
      title: 'Blockchain Technology Seminar',
      category: 'Tech',
      date: 'January 15, 2025',
      venue: 'Seminar Hall',
      image: '/event-tech.jpg',
      description: 'Learn about blockchain technology, cryptocurrencies, and decentralized applications.',
      organizer: 'CSE Department',
      club: 'Blockchain Club',
      rules: JSON.stringify(['Open to all branches', 'Basic programming knowledge helpful', 'Q&A session included', 'Resource materials provided']),
      contact_email: 'akash@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43229'
    },
    {
      id: '21',
      title: 'Fashion Show 2025',
      category: 'Cultural',
      date: 'January 20, 2025',
      venue: 'Main Auditorium',
      image: '/event-cultural.jpg',
      description: 'Showcase your fashion sense and creativity in our annual fashion extravaganza.',
      organizer: 'Cultural Committee',
      club: 'Fashion Club',
      rules: JSON.stringify(['Theme: Future Fashion', 'Groups of 4-6 models', 'Original designs encouraged', 'Professional photography included']),
      contact_email: 'priya@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43230'
    },
    {
      id: '22',
      title: 'Mobile App Development Hackathon',
      category: 'Tech',
      date: 'January 25, 2025',
      venue: 'Innovation Hub',
      image: '/event-tech.jpg',
      description: 'Build innovative mobile applications in this 48-hour hackathon.',
      organizer: 'CSE Department',
      club: 'Mobile Dev Club',
      rules: JSON.stringify(['Teams of 2-4 members', 'Android/iOS/React Native', 'Original app ideas', 'Judging on innovation and usability']),
      contact_email: 'suresh@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43231'
    },
    {
      id: '23',
      title: 'Volleyball Championship',
      category: 'Sports',
      date: 'February 5, 2025',
      venue: 'Volleyball Court',
      image: '/event-sports.jpg',
      description: 'Inter-department volleyball tournament with exciting matches.',
      organizer: 'Sports Committee',
      club: 'Volleyball Club',
      rules: JSON.stringify(['6 players per team', 'FIVB rules apply', 'Valid college ID required', 'League format with playoffs']),
      contact_email: 'kumar@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43232'
    },
    {
      id: '24',
      title: 'Theater Workshop',
      category: 'Cultural',
      date: 'February 10, 2025',
      venue: 'Theater Room',
      image: '/event-cultural.jpg',
      description: 'Learn acting, directing, and stage management in this comprehensive workshop.',
      organizer: 'English Department',
      club: 'Drama Club',
      rules: JSON.stringify(['No prior experience needed', 'Script writing included', 'Performance at end of workshop', 'Certificate of participation']),
      contact_email: 'meera@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43233'
    },
    {
      id: '25',
      title: 'IoT and Smart Devices Workshop',
      category: 'Tech',
      date: 'February 15, 2025',
      venue: 'Electronics Lab',
      image: '/event-tech.jpg',
      description: 'Build smart IoT devices and learn about connected technologies.',
      organizer: 'ECE Department',
      club: 'IoT Club',
      rules: JSON.stringify(['Basic electronics knowledge', 'Components provided', 'Team projects', 'Working prototype required']),
      contact_email: 'raj@vnrvjiet.ac.in',
      contact_phone: '+91 98765 43234'
    },
    {
      id: '26',
      title: 'Winter Hackfest 2025',
      category: 'Tech',
      date: 'December 12, 2025',
      venue: 'Innovation Hub',
      image: '/event-tech.jpg',
      description: 'A 36-hour winter hackathon to build impactful solutions.',
      organizer: 'CSE Department',
      club: 'ACM Student Chapter',
      rules: JSON.stringify(['Teams of 3-5', 'Original projects only', 'Demo + Q&A']),
      contact_email: 'acm@vnrvjiet.ac.in',
      contact_phone: '+91 90000 00001'
    },
    {
      id: '27',
      title: 'December Cultural Gala 2025',
      category: 'Cultural',
      date: 'December 22, 2025',
      venue: 'Main Auditorium',
      image: '/event-cultural.jpg',
      description: 'An evening of music, dance, and drama to celebrate the year.',
      organizer: 'Cultural Committee',
      club: 'Cultural Club',
      rules: JSON.stringify(['Solo/Duo/Group entries', 'Max 8 min performance', 'Original or cover acts allowed']),
      contact_email: 'cultural@vnrvjiet.ac.in',
      contact_phone: '+91 90000 00002'
    },
    {
      id: '28',
      title: 'Year-End Sports Carnival 2025',
      category: 'Sports',
      date: 'December 30, 2025',
      venue: 'Sports Complex',
      image: '/event-sports.jpg',
      description: 'Multi-sport fun meet to wrap up the year with fitness and games.',
      organizer: 'Sports Committee',
      club: 'Sports & Athletics Club',
      rules: JSON.stringify(['Open signup', 'Team and individual events', 'Sportsmanship required']),
      contact_email: 'sports@vnrvjiet.ac.in',
      contact_phone: '+91 90000 00003'
    }
  ];

  sampleEvents.forEach(event => {
    db.run(`
      INSERT OR IGNORE INTO events (id, title, category, date, venue, image, description, organizer, club, rules, contact_email, contact_phone, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [event.id, event.title, event.category, event.date, event.venue, event.image, event.description, event.organizer, event.club, event.rules, event.contact_email, event.contact_phone, null], (err) => {
      if (err) {
        console.error('Error inserting sample event:', err.message);
      }
    });
  });

  console.log('Sample events inserted');
};

const insertSampleData = (db) => {
  // Add sample data for all users
  db.all('SELECT id, email FROM users', [], (err, users) => {
    if (err || !users || users.length === 0) return;
    
    users.forEach(user => {
      const userId = user.id;
    
      // Sample registrations: 1 completed with certificate, 1 upcoming registered
      const sampleRegistrations = [
        {
          id: require('uuid').v4(),
          user_id: userId,
          event_id: '16', // Web Development Bootcamp (completed event)
          status: 'attended',
          certificate_downloaded: true,
          registration_data: JSON.stringify({
            name: user.email.split('@')[0],
            email: user.email,
            phone: '+91 98765 43210',
            rollNumber: user.email === 'admin@vnrvjiet.in' ? 'ADMIN001' : '21071A0501',
            branch: 'CSE',
            year: user.email === 'admin@vnrvjiet.in' ? 'Faculty' : '3rd Year',
            additionalInfo: 'Completed successfully with certificate'
          })
        },
        {
          id: require('uuid').v4(),
          user_id: userId,
          event_id: '1', // CodeSprint 2025 (upcoming registered event)
          status: 'registered',
          certificate_downloaded: false,
          registration_data: JSON.stringify({
            name: user.email.split('@')[0],
            email: user.email,
            phone: '+91 98765 43210',
            rollNumber: user.email === 'admin@vnrvjiet.in' ? 'ADMIN001' : '21071A0501',
            branch: 'CSE',
            year: user.email === 'admin@vnrvjiet.in' ? 'Faculty' : '3rd Year',
            additionalInfo: 'Ready to code and innovate!'
          })
        }
      ];
    
      // Insert sample registrations
      sampleRegistrations.forEach(registration => {
        db.run(`
          INSERT OR IGNORE INTO registrations (id, user_id, event_id, status, certificate_downloaded, registration_data)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [registration.id, registration.user_id, registration.event_id, registration.status, registration.certificate_downloaded, registration.registration_data]);
      });
    
      // Sample notifications for each user
      const sampleNotifications = [
        {
          id: require('uuid').v4(),
          title: '🎉 Welcome to Campus Events!',
          message: 'Welcome to our event management platform! You have 1 completed event and 1 upcoming registration.',
          type: 'success'
        },
        {
          id: require('uuid').v4(),
          title: '📜 Certificate Ready!',
          message: 'Your certificate for "Web Development Bootcamp" is ready for download. 100% attendance achieved!',
          type: 'success'
        },
        {
          id: require('uuid').v4(),
          title: '🚀 Upcoming Event Reminder',
          message: 'Don\'t forget about "CodeSprint 2025" happening on December 15, 2025. Get ready to code!',
          type: 'warning'
        },
        {
          id: require('uuid').v4(),
          title: '🎯 Achievement Unlocked',
          message: 'Congratulations! You\'ve unlocked the "Event Attendee" achievement with 100% attendance rate.',
          type: 'success'
        }
      ];
    
      // Insert sample notifications
      sampleNotifications.forEach(notification => {
        db.run(`
          INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, read)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [notification.id, userId, notification.title, notification.message, notification.type, false]);
      });
    });
    
    console.log('Sample user data inserted for all users');
  });
};

module.exports = { db, initDatabase };
