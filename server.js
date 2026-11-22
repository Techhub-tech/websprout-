require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_EMAIL = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@websprouthub.org').toLowerCase();
const ADMIN_PASS = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMeBeforeGoingLive123!';
const SUPPORT_PHONE = process.env.SUPPORT_WHATSAPP || '07049111844';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'websprouthub.team@gmail.com';

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const db = new sqlite3.Database(path.join(__dirname, 'websprout_v1.db'), (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
  } else {
    console.log('Connected to WebSprout Hub V1 SQLite database.');
    initDatabase();
  }
});

function generatePortalCode() {
  return 'WSH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateLoginPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function ensureColumn(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, cols) => {
    if (err || !Array.isArray(cols)) return;
    const exists = cols.some((c) => c.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  });
}

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      state TEXT,
      country TEXT DEFAULT 'Nigeria',
      role TEXT DEFAULT 'student',
      age_tier TEXT DEFAULT '18_plus_diploma',
      track_section TEXT DEFAULT 'digital_skills',
      selected_course TEXT DEFAULT 'Web Development',
      portal_code TEXT UNIQUE,
      login_pin_plain TEXT,
      password_hash TEXT NOT NULL,
      stage_unlocked INTEGER DEFAULT 1,
      daily_streak INTEGER DEFAULT 0,
      last_checkin_date TEXT,
      preferred_study_time TEXT DEFAULT '18:00',
      avatar_data TEXT,
      subscription_status TEXT DEFAULT 'trial',
      trial_expires_at TEXT,
      subscription_expires_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ensure columns exist if upgrading an older sqlite table
    ensureColumn('users', 'preferred_study_time', "TEXT DEFAULT '18:00'");
    ensureColumn('users', 'avatar_data', 'TEXT');
    ensureColumn('users', 'subscription_status', "TEXT DEFAULT 'trial'");
    ensureColumn('users', 'trial_expires_at', 'TEXT');
    ensureColumn('users', 'subscription_expires_at', 'TEXT');

    db.run(`CREATE TABLE IF NOT EXISTS tutoring_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      guardian_or_email TEXT NOT NULL,
      phone TEXT NOT NULL,
      state TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      subjects TEXT NOT NULL,
      schedule_note TEXT,
      status TEXT DEFAULT 'Pending Tutor Match',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS community_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_label TEXT DEFAULT 'Anonymous Learner',
      age_group TEXT DEFAULT 'Youth',
      topic TEXT DEFAULT 'Study & Growth',
      message TEXT NOT NULL,
      approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS learn_ease_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      term_or_topic TEXT NOT NULL,
      explanation TEXT NOT NULL,
      source_area TEXT DEFAULT 'General Study',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS call_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      student_name TEXT NOT NULL,
      course TEXT NOT NULL,
      department_or_track TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferred_slot TEXT,
      reason_note TEXT,
      status TEXT DEFAULT 'Requested',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL], async (err, row) => {
      if (!err && !row) {
        const hash = await bcrypt.hash(ADMIN_PASS, 10);
        const code = 'WSH-ADMIN01';
        db.run(
          `INSERT INTO users (full_name, email, phone, state, country, role, age_tier, track_section, selected_course, portal_code, login_pin_plain, password_hash, stage_unlocked, subscription_status, trial_expires_at, subscription_expires_at)
           VALUES (?, ?, ?, ?, ?, 'admin', '18_plus_diploma', 'admin_oversight', 'Hub Administration', ?, '000000', ?, 2, 'active', ?, ?)`,
          [
            'WebSprout Hub Admin',
            ADMIN_EMAIL,
            SUPPORT_PHONE,
            'FCT Abuja',
            'Nigeria',
            code,
            hash,
            addDaysIso(365),
            addDaysIso(365)
          ]
        );
      }
    });
  });
}

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication token required.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session.' });
    req.user = decoded;
    next();
  });
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin oversight access required.' });
  }
  next();
}

function computeAccessState(row) {
  if (row.role === 'admin') {
    return { access_active: true, billing_label: 'Admin Access' };
  }
  const now = Date.now();
  const subExp = row.subscription_expires_at ? Date.parse(row.subscription_expires_at) : 0;
  const trialExp = row.trial_expires_at ? Date.parse(row.trial_expires_at) : 0;

  if (row.subscription_status === 'active' && subExp > now) {
    return { access_active: true, billing_label: 'Active (₦500/mo)' };
  }
  if (trialExp > now) {
    return { access_active: true, billing_label: '7-Day Free Trial Active' };
  }
  return { access_active: false, billing_label: 'Renewal Required (₦500/mo)' };
}

function sanitizeUser(row) {
  if (!row) return null;
  const access = computeAccessState(row);
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    state: row.state,
    country: row.country || 'Nigeria',
    role: row.role,
    age_tier: row.age_tier,
    track_section: row.track_section,
    selected_course: row.selected_course,
    portal_code: row.portal_code,
    login_pin: row.login_pin_plain,
    stage_unlocked: row.stage_unlocked || 1,
    daily_streak: row.daily_streak || 0,
    last_checkin_date: row.last_checkin_date || null,
    preferred_study_time: row.preferred_study_time || '18:00',
    avatar_data: row.avatar_data || null,
    subscription_status: row.subscription_status || 'trial',
    trial_expires_at: row.trial_expires_at || null,
    subscription_expires_at: row.subscription_expires_at || null,
    access_active: access.access_active,
    billing_label: access.billing_label,
    created_at: row.created_at
  };
}

app.get('/api/hub/config', (req, res) => {
  res.json({
    support_phone: SUPPORT_PHONE,
    support_email: SUPPORT_EMAIL,
    monthly_fee_ngn: 500,
    trial_days: 7
  });
});

// Safe Portal ID lookup (returns only existence/portal_code without exposing PII)
app.get('/api/portal/lookup', (req, res) => {
  const rawCode = String(req.query.code || '').trim().toUpperCase();
  if (!rawCode) {
    return res.status(400).json({ error: 'Enter a Portal ID or Code to search.' });
  }
  db.get(`SELECT portal_code, role FROM users WHERE UPPER(portal_code) = ?`, [rawCode], (err, row) => {
    if (err) return res.status(500).json({ error: 'Lookup error.' });
    if (!row) {
      return res.status(404).json({ found: false, error: 'No registered portal found with that ID.' });
    }
    res.json({
      found: true,
      portal_code: row.portal_code,
      role: row.role,
      message: 'Portal ID verified. Enter your email and PIN/password to open your portal.'
    });
  });
});

// Register / Create Portal (starts 7-day free trial)
app.post('/api/auth/register', async (req, res) => {
  const {
    full_name,
    email,
    phone,
    state,
    country,
    role,
    age_tier,
    track_section,
    selected_course,
    password,
    preferred_study_time
  } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: 'Full name and email address are required.' });
  }

  const secretToUse = password && String(password).length >= 6 ? String(password) : generateLoginPin();
  const normalizedEmail = String(email).trim().toLowerCase();
  const safeRole = role === 'teacher' ? 'teacher' : 'student';
  const safeAgeTier = age_tier === '16_under_foundation' ? '16_under_foundation' : '18_plus_diploma';
  const safeSection = ['digital_skills', 'pre_university', 'home_tutoring'].includes(track_section)
    ? track_section
    : 'digital_skills';
  const trialExpires = addDaysIso(7);

  try {
    const hash = await bcrypt.hash(secretToUse, 10);
    const portalCode = generatePortalCode();

    db.run(
      `INSERT INTO users (full_name, email, phone, state, country, role, age_tier, track_section, selected_course, portal_code, login_pin_plain, password_hash, preferred_study_time, subscription_status, trial_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?)`,
      [
        String(full_name).trim(),
        normalizedEmail,
        String(phone || '').trim(),
        String(state || '').trim(),
        String(country || 'Nigeria').trim(),
        safeRole,
        safeAgeTier,
        safeSection,
        String(selected_course || 'Web Development').trim(),
        portalCode,
        secretToUse,
        hash,
        String(preferred_study_time || '18:00').trim(),
        trialExpires
      ],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
          }
          return res.status(500).json({ error: 'Could not create portal account.' });
        }

        db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (err2, row) => {
          const created = sanitizeUser(row);
          const token = jwt.sign({ id: created.id, email: created.email, role: created.role }, JWT_SECRET, {
            expiresIn: '7d'
          });
          res.status(201).json({
            token,
            user: created,
            portal_link: `/portal?code=${portalCode}`,
            login_pin: secretToUse
          });
        });
      }
    );
  } catch {
    res.status(500).json({ error: 'Server error while creating portal.' });
  }
});

// Login via Email + Password or PIN (and optional portal_code)
app.post('/api/auth/login', (req, res) => {
  const { email, password, portal_code } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password/PIN are required.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [String(email).trim().toLowerCase()], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!row) return res.status(401).json({ error: 'No account found with that email.' });

    if (portal_code && row.portal_code && String(portal_code).trim().toUpperCase() !== row.portal_code.toUpperCase()) {
      return res.status(401).json({ error: 'Portal code does not match this account.' });
    }

    const match = await bcrypt.compare(String(password), row.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password or login PIN.' });

    const safeUser = sanitizeUser(row);
    const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, {
      expiresIn: '7d'
    });
    res.json({ token, user: safeUser, portal_link: `/portal?code=${safeUser.portal_code}` });
  });
});

// Forgot Password -> issues a fresh PIN / temporary password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, phone } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your registered email address.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [String(email).trim().toLowerCase()], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!row) return res.status(404).json({ error: 'No account found with that email address.' });
    if (phone && row.phone && String(phone).trim() !== row.phone.trim()) {
      return res.status(400).json({ error: 'Phone number does not match the registered account.' });
    }

    const newPin = generateLoginPin();
    const newHash = await bcrypt.hash(newPin, 10);

    db.run(`UPDATE users SET password_hash = ?, login_pin_plain = ? WHERE id = ?`, [newHash, newPin, row.id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Could not reset password/PIN.' });
      res.json({
        message: 'A fresh Login PIN has been generated for your account.',
        email: row.email,
        portal_code: row.portal_code,
        new_pin: newPin
      });
    });
  });
});

// Forgot Email -> lookup by phone or portal code
app.post('/api/auth/forgot-email', (req, res) => {
  const { phone, portal_code } = req.body;
  if (!phone && !portal_code) {
    return res.status(400).json({ error: 'Enter your registered phone number or portal code.' });
  }

  const query = portal_code
    ? `SELECT full_name, email, portal_code FROM users WHERE UPPER(portal_code) = ?`
    : `SELECT full_name, email, portal_code FROM users WHERE phone = ?`;
  const param = portal_code ? String(portal_code).trim().toUpperCase() : String(phone).trim();

  db.get(query, [param], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!row) return res.status(404).json({ error: 'No matching account found for those details.' });
    res.json({
      message: 'Account email retrieved.',
      full_name: row.full_name,
      email: row.email,
      portal_code: row.portal_code
    });
  });
});

// Current profile
app.get('/api/me', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: sanitizeUser(row) });
  });
});

// Editable Profile (name, phone, state, country, preferred_study_time, avatar_data)
app.put('/api/portal/profile', authMiddleware, (req, res) => {
  const { full_name, phone, state, country, preferred_study_time, avatar_data } = req.body;
  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ error: 'Full name cannot be empty.' });
  }

  const safeAvatar =
    typeof avatar_data === 'string' && avatar_data.startsWith('data:image/') && avatar_data.length < 1500000
      ? avatar_data
      : undefined;

  db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, current) => {
    if (err || !current) return res.status(404).json({ error: 'Account not found.' });

    const nextAvatar = safeAvatar !== undefined ? safeAvatar : current.avatar_data;
    db.run(
      `UPDATE users
       SET full_name = ?, phone = ?, state = ?, country = ?, preferred_study_time = ?, avatar_data = ?
       WHERE id = ?`,
      [
        String(full_name).trim(),
        String(phone ?? current.phone ?? '').trim(),
        String(state ?? current.state ?? '').trim(),
        String(country ?? current.country ?? 'Nigeria').trim(),
        String(preferred_study_time ?? current.preferred_study_time ?? '18:00').trim(),
        nextAvatar,
        req.user.id
      ],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Could not update profile.' });
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err3, updated) => {
          res.json({ message: 'Profile details updated.', user: sanitizeUser(updated) });
        });
      }
    );
  });
});

// Daily check-in (one step per day + enforces trial/subscription window for paid learning access)
app.post('/api/portal/daily-checkin', authMiddleware, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Account not found.' });

    const access = computeAccessState(row);
    if (!access.access_active) {
      return res.status(402).json({
        error: 'Your 7-day starter access has ended. Activate the ₦500/month subscription to continue daily lessons.'
      });
    }

    if (row.last_checkin_date === today) {
      return res.json({
        alreadyCheckedIn: true,
        message: 'Today’s lesson & check-in is already recorded! Your next daily lesson unlocks tomorrow.',
        user: sanitizeUser(row)
      });
    }

    const nextStreak = (row.daily_streak || 0) + 1;
    db.run(
      `UPDATE users SET daily_streak = ?, last_checkin_date = ? WHERE id = ?`,
      [nextStreak, today, row.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to record daily check-in.' });
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err3, updated) => {
          res.json({
            alreadyCheckedIn: false,
            celebrate: true,
            message: `Congratulations! Today’s lesson is complete (${nextStreak}-day streak). Next lesson unlocks tomorrow at your chosen study time (${updated.preferred_study_time}).`,
            user: sanitizeUser(updated)
          });
        });
      }
    );
  });
});

// Update track / age tier
app.put('/api/portal/preferences', authMiddleware, (req, res) => {
  const { age_tier, track_section, selected_course } = req.body;
  const safeAge = age_tier === '16_under_foundation' ? '16_under_foundation' : '18_plus_diploma';
  const safeSection = ['digital_skills', 'pre_university', 'home_tutoring'].includes(track_section)
    ? track_section
    : 'digital_skills';

  db.run(
    `UPDATE users SET age_tier = ?, track_section = ?, selected_course = ? WHERE id = ?`,
    [safeAge, safeSection, String(selected_course || 'Web Development').trim(), req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update learning preferences.' });
      db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err2, updated) => {
        res.json({ message: 'Learning preferences updated.', user: sanitizeUser(updated) });
      });
    }
  );
});

// In-portal "Book a Call" request (stays on site, notifies Admin Oversight & links to 07049111844)
app.post('/api/portal/book-call', authMiddleware, (req, res) => {
  const { student_name, course, department_or_track, phone, preferred_slot, reason_note } = req.body;
  if (!student_name || !course || !department_or_track || !phone) {
    return res.status(400).json({ error: 'Name, course, department/track, and phone number are required.' });
  }

  db.run(
    `INSERT INTO call_requests (user_id, student_name, course, department_or_track, phone, preferred_slot, reason_note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      String(student_name).trim(),
      String(course).trim(),
      String(department_or_track).trim(),
      String(phone).trim(),
      String(preferred_slot || '').trim(),
      String(reason_note || '').trim()
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not log your call request.' });
      res.status(201).json({
        id: this.lastID,
        support_phone: SUPPORT_PHONE,
        message: 'Call request sent right inside your portal! WebSprout Hub has received your details.'
      });
    }
  );
});

// Free LearnEase library endpoints
app.get('/api/learnease/notes', authMiddleware, (req, res) => {
  db.all(
    `SELECT id, term_or_topic, explanation, source_area, created_at
     FROM learn_ease_notes
     WHERE user_id = ?
     ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to load LearnEase library.' });
      res.json({ notes: rows || [] });
    }
  );
});

app.post('/api/learnease/notes', authMiddleware, (req, res) => {
  const { term_or_topic, explanation, source_area } = req.body;
  if (!term_or_topic || !explanation) {
    return res.status(400).json({ error: 'Term/topic and explanation are required.' });
  }

  db.run(
    `INSERT INTO learn_ease_notes (user_id, term_or_topic, explanation, source_area)
     VALUES (?, ?, ?, ?)`,
    [
      req.user.id,
      String(term_or_topic).trim().slice(0, 140),
      String(explanation).trim().slice(0, 2000),
      String(source_area || 'LearnEase Library').trim().slice(0, 80)
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not save to LearnEase library.' });
      res.status(201).json({
        id: this.lastID,
        message: 'Saved to your free LearnEase library.'
      });
    }
  );
});

app.delete('/api/learnease/notes/:id', authMiddleware, (req, res) => {
  db.run(`DELETE FROM learn_ease_notes WHERE id = ? AND user_id = ?`, [Number(req.params.id), req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Could not delete note.' });
    res.json({ message: 'Removed from LearnEase library.' });
  });
});

// Nationwide Tutoring booking (WAEC, NECO, JAMB)
app.post('/api/tutoring/book', (req, res) => {
  const { student_name, guardian_or_email, phone, state, exam_type, subjects, schedule_note } = req.body;
  if (!student_name || !guardian_or_email || !phone || !state || !exam_type || !subjects) {
    return res.status(400).json({ error: 'Please fill all required tutoring booking fields.' });
  }

  db.run(
    `INSERT INTO tutoring_requests (student_name, guardian_or_email, phone, state, exam_type, subjects, schedule_note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      String(student_name).trim(),
      String(guardian_or_email).trim(),
      String(phone).trim(),
      String(state).trim(),
      String(exam_type).trim(),
      String(subjects).trim(),
      String(schedule_note || '').trim()
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not submit tutoring request.' });
      res.status(201).json({
        id: this.lastID,
        message: `Nationwide ${exam_type} online tutoring request received for ${String(student_name).trim()} in ${String(state).trim()}.`
      });
    }
  );
});

// "We Listen, We Don't Judge" community space
app.get('/api/community/checkins', (req, res) => {
  db.all(
    `SELECT id, author_label, age_group, topic, message, created_at
     FROM community_checkins
     WHERE approved = 1
     ORDER BY id DESC
     LIMIT 30`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to load community check-ins.' });
      res.json({ checkins: rows || [] });
    }
  );
});

app.post('/api/community/checkins', (req, res) => {
  const { author_label, age_group, topic, message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Please share what is on your mind before posting.' });
  }

  const safeLabel =
    author_label && String(author_label).trim() ? String(author_label).trim().slice(0, 40) : 'Anonymous Learner';
  const safeAge = age_group && String(age_group).trim() ? String(age_group).trim().slice(0, 30) : 'Youth';
  const safeTopic = topic && String(topic).trim() ? String(topic).trim().slice(0, 50) : 'Encouragement & Growth';

  db.run(
    `INSERT INTO community_checkins (author_label, age_group, topic, message, approved)
     VALUES (?, ?, ?, ?, 1)`,
    [safeLabel, safeAge, safeTopic, String(message).trim().slice(0, 600)],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not post check-in.' });
      res.status(201).json({
        id: this.lastID,
        message: 'Shared safely in We Listen, We Don’t Judge.'
      });
    }
  );
});

// Admin Oversight endpoints
app.get('/api/admin/overview', authMiddleware, adminOnly, (req, res) => {
  db.all(`SELECT * FROM users ORDER BY id DESC`, [], (err, users) => {
    if (err) return res.status(500).json({ error: 'Failed to load users.' });

    db.all(`SELECT * FROM tutoring_requests ORDER BY id DESC`, [], (err2, tutoring) => {
      if (err2) return res.status(500).json({ error: 'Failed to load tutoring requests.' });

      db.all(`SELECT * FROM community_checkins ORDER BY id DESC`, [], (err3, checkins) => {
        if (err3) return res.status(500).json({ error: 'Failed to load community entries.' });

        db.all(`SELECT * FROM call_requests ORDER BY id DESC`, [], (err4, calls) => {
          if (err4) return res.status(500).json({ error: 'Failed to load call requests.' });

          res.json({
            users: (users || []).map(sanitizeUser),
            tutoringRequests: tutoring || [],
            communityCheckins: checkins || [],
            callRequests: calls || []
          });
        });
      });
    });
  });
});

app.post('/api/admin/create-portal', authMiddleware, adminOnly, async (req, res) => {
  const { full_name, email, phone, state, country, role, age_tier, track_section, selected_course } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ error: 'Full name and email are required to open a portal.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const pin = generateLoginPin();
  const portalCode = generatePortalCode();
  const safeRole = role === 'teacher' ? 'teacher' : 'student';
  const safeAge = age_tier === '16_under_foundation' ? '16_under_foundation' : '18_plus_diploma';
  const safeSection = ['digital_skills', 'pre_university', 'home_tutoring'].includes(track_section)
    ? track_section
    : 'digital_skills';
  const trialExpires = addDaysIso(7);

  try {
    const hash = await bcrypt.hash(pin, 10);
    db.run(
      `INSERT INTO users (full_name, email, phone, state, country, role, age_tier, track_section, selected_course, portal_code, login_pin_plain, password_hash, subscription_status, trial_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?)`,
      [
        String(full_name).trim(),
        normalizedEmail,
        String(phone || '').trim(),
        String(state || '').trim(),
        String(country || 'Nigeria').trim(),
        safeRole,
        safeAge,
        safeSection,
        String(selected_course || 'Web Development').trim(),
        portalCode,
        pin,
        hash,
        trialExpires
      ],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'That email already has a portal on WebSprout Hub.' });
          }
          return res.status(500).json({ error: 'Could not generate portal.' });
        }

        res.status(201).json({
          message: `Portal created for ${String(full_name).trim()}.`,
          portal_code: portalCode,
          portal_link: `/portal?code=${portalCode}`,
          login_pin: pin,
          email: normalizedEmail
        });
      }
    );
  } catch {
    res.status(500).json({ error: 'Server error creating portal.' });
  }
});

// Activate or renew 30-day ₦500/month subscription
app.patch('/api/admin/users/:id/subscription', authMiddleware, adminOnly, (req, res) => {
  const targetId = Number(req.params.id);
  const expiresAt = addDaysIso(30);

  db.run(
    `UPDATE users SET subscription_status = 'active', subscription_expires_at = ? WHERE id = ?`,
    [expiresAt, targetId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to activate ₦500/month plan.' });
      res.json({ message: '30-day ₦500/month subscription activated.' });
    }
  );
});

app.patch('/api/admin/users/:id/stage', authMiddleware, adminOnly, (req, res) => {
  const targetId = Number(req.params.id);
  const nextStage = Number(req.body.stage_unlocked) === 2 ? 2 : 1;

  db.run(`UPDATE users SET stage_unlocked = ? WHERE id = ?`, [nextStage, targetId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update stage access.' });
    res.json({ message: `User updated to Stage/Semester ${nextStage}.`, stage_unlocked: nextStage });
  });
});

app.patch('/api/admin/tutoring/:id/status', authMiddleware, adminOnly, (req, res) => {
  const targetId = Number(req.params.id);
  const status = String(req.body.status || 'Tutor Assigned').trim();

  db.run(`UPDATE tutoring_requests SET status = ? WHERE id = ?`, [status, targetId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update tutoring status.' });
    res.json({ message: `Tutoring status set to "${status}".` });
  });
});

app.patch('/api/admin/calls/:id/status', authMiddleware, adminOnly, (req, res) => {
  const targetId = Number(req.params.id);
  const status = String(req.body.status || 'Follow-Up Scheduled').trim();

  db.run(`UPDATE call_requests SET status = ? WHERE id = ?`, [status, targetId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update call request.' });
    res.json({ message: `Call request updated to "${status}".` });
  });
});

app.patch('/api/admin/community/:id/moderate', authMiddleware, adminOnly, (req, res) => {
  const targetId = Number(req.params.id);
  const approved = req.body.approved ? 1 : 0;

  db.run(`UPDATE community_checkins SET approved = ? WHERE id = ?`, [approved, targetId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to moderate entry.' });
    res.json({ message: approved ? 'Entry visible in community.' : 'Entry hidden from public view.' });
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hub: 'WebSprout Hub V1' });
});

app.listen(PORT, () => {
  console.log(`WebSprout Hub V1 backend running on http://localhost:${PORT}`);
});
