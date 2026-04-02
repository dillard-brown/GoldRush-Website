// ============================================================
//  Gold Rush Hauling — server.js
//  Express backend: static files, contact form, gallery admin
// ============================================================

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const nodemailer = require('nodemailer');
const session  = require('express-session');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  CONFIGURATION
//  Update via .env file — see .env.example
// ============================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GoldRush2024!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'grh-dev-secret-change-in-production';
const EMAIL_USER     = process.env.EMAIL_USER     || 'placeholder@gmail.com';    // CHANGE THIS
const EMAIL_PASS     = process.env.EMAIL_PASS     || 'your-gmail-app-password';  // CHANGE THIS
const EMAIL_TO       = process.env.EMAIL_TO       || 'placeholder@gmail.com';    // CHANGE THIS

// ============================================================
//  PATHS & FILE SETUP
// ============================================================
const PUBLIC_DIR  = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const GALLERY_FILE = path.join(UPLOADS_DIR, 'gallery.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(GALLERY_FILE)) fs.writeFileSync(GALLERY_FILE, '[]');

// ============================================================
//  MULTER — Gallery (disk storage, keeps files permanently)
// ============================================================
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const id  = req.uploadId || (req.uploadId = Date.now().toString());
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${id}-${file.fieldname}${ext}`);
  }
});

// multer 2.x: return true to accept, throw to reject (no callback)
const imageFilter = (req, file) => {
  if (!file.mimetype.startsWith('image/')) {
    throw Object.assign(new Error('Only image files are allowed'), { code: 'INVALID_FILE_TYPE' });
  }
  return true;
};

const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: imageFilter
});

// MULTER — Contact form (memory storage, file is emailed then discarded)
const contactUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter
});

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(PUBLIC_DIR));

// Auth guard for admin API routes
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
}

// ============================================================
//  GALLERY HELPERS
// ============================================================
function readGallery() {
  try { return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf8')); }
  catch { return []; }
}

function writeGallery(data) {
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
//  API ROUTES
// ============================================================

// --- Public: get gallery items ---
app.get('/api/gallery', (req, res) => {
  res.json(readGallery());
});

// --- Public: contact / booking form ---
app.post('/api/contact', contactUpload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, jobType, location, date, message } = req.body;

    if (!name || !phone || !jobType || !location) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    const mailOptions = {
      from: `"Gold Rush Hauling Website" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: `New Booking Request — ${name} (${jobType})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #C9A84C; border-bottom: 2px solid #C9A84C; padding-bottom: 8px;">
            New Booking Request
          </h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight:bold; width:140px;">Name</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight:bold;">Phone</td><td>${phone}</td></tr>
            <tr><td style="padding: 8px 0; font-weight:bold;">Email</td><td>${email || 'Not provided'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight:bold;">Job Type</td><td>${jobType}</td></tr>
            <tr><td style="padding: 8px 0; font-weight:bold;">Location</td><td>${location}</td></tr>
            <tr><td style="padding: 8px 0; font-weight:bold;">Preferred Date</td><td>${date || 'Flexible'}</td></tr>
          </table>
          <h3 style="margin-top: 20px;">Message / Description</h3>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${message || 'No description provided.'}</p>
          ${req.file ? '<p><strong>📸 Photo attached — see attachment below.</strong></p>' : '<p><em>No photo attached.</em></p>'}
        </div>
      `,
      attachments: req.file ? [{
        filename: req.file.originalname || 'photo.jpg',
        content:  req.file.buffer,
        contentType: req.file.mimetype
      }] : []
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Your request has been sent! We'll be in touch within the hour." });

  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send your request. Please call or text us directly.' });
  }
});

// --- Admin: check auth status ---
app.get('/api/admin/status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// --- Admin: login ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect password.' });
  }
});

// --- Admin: logout ---
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// --- Admin: upload before/after photo pair ---
app.post(
  '/api/admin/upload',
  requireAdmin,
  galleryUpload.fields([{ name: 'before', maxCount: 1 }, { name: 'after', maxCount: 1 }]),
  (req, res) => {
    try {
      const { label, category } = req.body;
      if (!req.files?.before || !req.files?.after) {
        return res.status(400).json({ error: 'Both before and after photos are required.' });
      }

      const id        = req.uploadId || Date.now().toString();
      const beforeFile = req.files.before[0];
      const afterFile  = req.files.after[0];

      // Rename to consistent IDs
      const beforeExt  = path.extname(beforeFile.originalname).toLowerCase();
      const afterExt   = path.extname(afterFile.originalname).toLowerCase();
      const beforePath = path.join(UPLOADS_DIR, `${id}-before${beforeExt}`);
      const afterPath  = path.join(UPLOADS_DIR, `${id}-after${afterExt}`);

      if (beforeFile.path !== beforePath) fs.renameSync(beforeFile.path, beforePath);
      if (afterFile.path  !== afterPath)  fs.renameSync(afterFile.path,  afterPath);

      const gallery = readGallery();
      gallery.unshift({
        id,
        label:    label    || 'Cleanout Job',
        category: category || 'general',
        before:   `/uploads/${id}-before${beforeExt}`,
        after:    `/uploads/${id}-after${afterExt}`,
        date:     new Date().toISOString().split('T')[0]
      });
      writeGallery(gallery);

      res.json({ success: true, message: 'Photos uploaded successfully.' });
    } catch (err) {
      console.error('Upload error:', err.message);
      res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  }
);

// --- Admin: delete photo pair ---
app.delete('/api/admin/photo/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const gallery = readGallery();
    const item    = gallery.find(g => g.id === id);

    if (item) {
      [item.before, item.after].forEach(rel => {
        const full = path.join(PUBLIC_DIR, rel);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      });
      writeGallery(gallery.filter(g => g.id !== id));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Delete failed.' });
  }
});

// ============================================================
//  START
// ============================================================
app.listen(PORT, () => {
  console.log(`\n  Gold Rush Hauling running at http://localhost:${PORT}\n`);
});
