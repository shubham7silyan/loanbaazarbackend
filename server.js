require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000; // Use environment port or fallback to 5000

// CORS Configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://loanbaazar.in', 'https://www.loanbaazar.in']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Google Sheets Configuration
const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

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

    // Save to database with isRead field explicitly set
    const newContact = new Contact({ 
      name, 
      email, 
      phone, 
      message, 
      isRead: false 
    });
    await newContact.save();

    // Append to Google Sheets
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = 'Sheet1!A1:D1'; // Change to your sheet range
    const valueInputOption = 'USER_ENTERED';
    const insertDataOption = 'INSERT_ROWS';
    const valueRangeBody = {
      "majorDimension": "ROWS",
      "range": range,
      "values": [[name, email, phone, message]],
    };

    const client = await auth.getClient();
    sheets.spreadsheets.values.append({
      auth: client,
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: valueInputOption,
      insertDataOption: insertDataOption,
      requestBody: valueRangeBody,
    }, (err, response) => {
      if (err) {
        console.error('Error appending to Google Sheets:', err);
      } else {
        console.log('Appended to Google Sheets successfully!');
      }
    });

    // Send confirmation email to user (optional)
    // You can use a library like nodemailer or a service like Sendgrid to send emails
    // For now, this is commented out
    // const userMailOptions = {
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: 'Thank you for contacting LoanBazar',
    //   html: `
    //     <h2>Thank you for your inquiry!</h2>
    //     <p>Dear ${name},</p>
    //     <p>We have received your message and will get back to you within 24 hours.</p>
        
    //     <h3>Your submission details:</h3>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Message:</strong> ${message}</p>
        
    //     <p>Best regards,<br>LoanBazar Team</p>
    //     <hr>
    //     <p><em>This is an automated message. Please do not reply to this email.</em></p>
    //   `
    // };

    res.status(201).json({ 
      message: "Contact form submitted successfully!" 
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      error: "Failed to submit contact form" 
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
