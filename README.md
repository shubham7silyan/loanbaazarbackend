# 🚀 LoanBazar Backend API

A robust Node.js/Express backend API for the LoanBazar loan comparison platform.

## 🚀 Features

- **Contact Management:** Form submissions with MongoDB storage
- **Admin Authentication:** JWT-based admin panel access
- **Email Integration:** Gmail SMTP for notifications
- **Google Sheets:** Optional data backup to Google Sheets
- **CORS Configuration:** Production-ready cross-origin settings
- **Health Monitoring:** API health check endpoints

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Gmail SMTP
- **External APIs:** Google Sheets API
- **Security:** bcryptjs, CORS

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/loanbazar-backend.git

# Navigate to project directory
cd loanbazar-backend

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/contactDatabase

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@example.com

# Admin Authentication
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
JWT_SECRET=your-jwt-secret-key

# Google Sheets (Optional)
GOOGLE_SHEETS_ID=your-google-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
```

## 🌐 API Endpoints

### Public Endpoints

#### Health Check
```
GET /api/health
```
Returns server status and uptime information.

#### Contact Form Submission
```
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "message": "I need a personal loan"
}
```

### Admin Endpoints (Requires Authentication)

#### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin-username",
  "password": "admin-password"
}
```

#### Get All Contacts
```
GET /api/admin/contacts
Authorization: Bearer <jwt-token>
```

#### Mark Contact as Read/Unread
```
PUT /api/admin/contacts/:id/read
PUT /api/admin/contacts/:id/unread
Authorization: Bearer <jwt-token>
```

#### Delete Contact
```
DELETE /api/admin/contacts/:id
Authorization: Bearer <jwt-token>
```

## 🗄️ Database Schema

### Contact Model
```javascript
{
  name: String (required),
  email: String (required),
  phone: String (required),
  message: String (required),
  isRead: Boolean (default: false),
  submittedAt: Date (default: Date.now),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## 🚀 Production Deployment

### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create cluster and database
3. Get connection string
4. Update `MONGO_URI` in production environment

### Environment Variables
Set these in your production environment:
- `NODE_ENV=production`
- `PORT=3000` (or your hosting provider's port)
- `MONGO_URI=mongodb+srv://...` (Atlas connection string)
- All other environment variables from `.env`

### CORS Configuration
The server automatically configures CORS based on environment:
- **Development:** `http://localhost:3000`
- **Production:** `https://loanbaazar.in`, `https://www.loanbaazar.in`

## 📁 Project Structure

```
├── server.js          # Main application file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in repo)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🔒 Security Features

- **JWT Authentication:** Secure admin access
- **CORS Protection:** Environment-based origin control
- **Input Validation:** Required field validation
- **Environment Variables:** Sensitive data protection

## 📧 Email Integration

The system sends emails for:
- Contact form confirmations (optional)
- Admin notifications
- Error reporting

Configure Gmail App Password for EMAIL_PASS in production.

## 📊 Google Sheets Integration

Optional feature to backup contact submissions to Google Sheets:
1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Download credentials
5. Configure environment variables

## 🔍 Monitoring & Logging

- Health check endpoint for uptime monitoring
- Console logging for debugging
- Error handling with appropriate HTTP status codes

## 🚀 Deployment Platforms

This backend is configured for deployment on:
- **Hostinger** (Primary)
- **Heroku**
- **Vercel**
- **Railway**
- **DigitalOcean**

## 📞 Support

For technical support or questions:
- **Email:** loanbazar76@gmail.com
- **Phone:** +91 7678507025

## 👨‍💻 Author

**Shubham Silyan**
- Email: loanbazar76@gmail.com
- GitHub: [Your GitHub Profile]

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
