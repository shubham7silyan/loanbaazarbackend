require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000; // Use environment port or fallback to 5000

// CORS Configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://loanbaazar.in',
      'https://www.loanbaazar.in',
      'https://loanbaazarfrontend-production.up.railway.app',
      'https://loanbaazarfrontend-production.up.railway.app/',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Add common Railway app URL patterns
      /^https:\/\/.*\.up\.railway\.app$/,
      // Add Hostinger deployment URLs
      /^https:\/\/.*\.hostinger\..*$/
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/contactDatabase";
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schema and Model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

const Contact = mongoose.model("Contact", contactSchema);

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Routes
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Debug logging
    console.log('Login attempt:');
    console.log('Received username:', username);
    console.log('Expected username:', process.env.ADMIN_USERNAME);
    console.log('Received password:', password);
    console.log('Expected password:', process.env.ADMIN_PASSWORD);

    // Check credentials against environment variables
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      console.log('Credentials mismatch!');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful!');
    // Generate JWT token
    const token = jwt.sign(
      { username: username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token: token,
      admin: { username: username, role: 'admin' }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all contacts (Admin only)
app.get('/api/admin/contacts', authenticateAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Delete contact (Admin only)
app.delete('/api/admin/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndDelete(id);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Mark contact as read (Admin only)
app.put('/api/admin/contacts/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Marking contact as read:', id);
    
    const contact = await Contact.findByIdAndUpdate(
      id, 
      { isRead: true }, 
      { new: true }
    );
    
    if (!contact) {
      console.log('Contact not found:', id);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('Contact marked as read successfully:', contact.name, contact.isRead);
    res.json({ message: 'Contact marked as read', contact });
  } catch (error) {
    console.error('Error marking contact as read:', error);
    res.status(500).json({ error: 'Failed to mark contact as read' });
  }
});

// Mark contact as unread (Admin only)
app.put('/api/admin/contacts/:id/unread', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Marking contact as unread:', id);
    
    const contact = await Contact.findByIdAndUpdate(
      id, 
      { isRead: false }, 
      { new: true }
    );
    
    if (!contact) {
      console.log('Contact not found:', id);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('Contact marked as unread successfully:', contact.name, contact.isRead);
    res.json({ message: 'Contact marked as unread', contact });
  } catch (error) {
    console.error('Error marking contact as unread:', error);
    res.status(500).json({ error: 'Failed to mark contact as unread' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ 
        error: "All fields are required" 
      });
    }

    // Save to database with isRead field explicitly set
    const newContact = new Contact({ 
      name, 
      email, 
      phone, 
      message, 
      isRead: false 
    });
    
    const savedContact = await newContact.save();
    console.log('Contact saved successfully:', savedContact._id);

    // Send success response
    res.status(201).json({ 
      message: "Contact form submitted successfully!",
      contactId: savedContact._id
    });

  } catch (err) {
    console.error('Contact form submission error:', err);
    res.status(500).json({ 
      error: "Failed to submit contact form",
      details: err.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
