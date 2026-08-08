require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'admin123';
const adminPassHash = process.env.ADMIN_PASS_HASH || '';
const adminSalt = process.env.ADMIN_SALT || '';
const sessionCookieName = 'blusky_admin_token';
let emailRecipient = process.env.CONTACT_RECIPIENT;
const emailSender = process.env.FROM_EMAIL || 'no-reply@bluskyfincorp.com';

let mailTransporter = null;
let usingTestMailer = false;
const activeSessions = new Map();

async function createMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await mailTransporter.verify();
      console.log('SMTP transporter is ready.');
    } catch (verifyError) {
      console.warn('SMTP verification failed:', verifyError.message);
      mailTransporter = null;
    }
  }

  if (!mailTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    mailTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingTestMailer = true;
    emailRecipient = emailRecipient || testAccount.user;
    console.log('No working SMTP configuration detected. Using Ethereal test email account for development.');
    console.log('Preview messages at https://ethereal.email/messages');
  }
}

function getActiveSessions() {
  const filePath = path.join(__dirname, 'contact-inquiries.json');
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
}

function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, { user, createdAt: new Date().toISOString() });
  return token;
}

function getSession(req) {
  const token = req.cookies?.[sessionCookieName];
  return token ? activeSessions.get(token) : null;
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in at /admin.' });
  }
  req.admin = session;
  next();
}

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(express.static(path.join(__dirname)));

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required.' });
  }

  const inquiry = {
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, 'contact-inquiries.json');
  const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
  existing.push(inquiry);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

  if (mailTransporter && emailRecipient) {
    try {
      const info = await mailTransporter.sendMail({
        from: emailSender,
        to: emailRecipient,
        subject: `New BluSkyFinCorp inquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
      });

      if (usingTestMailer) {
        console.log(`Ethereal preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (mailError) {
      console.error('Email send failed:', mailError);
      return res.status(500).json({ error: 'Inquiry saved, but email notification failed. Please check server email settings.' });
    }
  }

  res.status(201).json({ message: 'Inquiry received successfully.' });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username !== adminUser) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const checkPassword = () => {
    if (adminPassHash && adminSalt) {
      try {
        const derived = crypto.pbkdf2Sync(password, adminSalt, 100000, 64, 'sha512').toString('hex');
        const a = Buffer.from(derived, 'hex');
        const b = Buffer.from(adminPassHash, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
      } catch (e) {
        return false;
      }
    }
    return password === adminPass;
  };

  try {
    const valid = checkPassword();
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = createSession(username);
    res.cookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
    });
    res.json({ message: 'Login successful.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/admin/logout', (req, res) => {
  const token = req.cookies?.[sessionCookieName];
  if (token) {
    activeSessions.delete(token);
  }

  res.clearCookie(sessionCookieName);
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/inquiries', requireAdmin, (req, res) => {
  const inquiries = getActiveSessions();
  res.json({ inquiries, admin: req.admin.user });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  await createMailer();

  const sslKey = process.env.SSL_KEY;
  const sslCert = process.env.SSL_CERT;
  if (sslKey && sslCert && fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
    const key = fs.readFileSync(sslKey, 'utf8');
    const cert = fs.readFileSync(sslCert, 'utf8');
    https.createServer({ key, cert }, app).listen(port, () => {
      console.log(`BluSkyFinCorp site listening securely at https://localhost:${port}`);
    });
    return;
  }

  app.listen(port, () => {
    console.log(`BluSkyFinCorp site listening at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start BluSkyFinCorp:', error);
  process.exit(1);
});
