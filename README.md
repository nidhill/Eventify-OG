# 🎉 Eventify - Event Management Platform

A comprehensive event management and booking platform built with Node.js, Express, MongoDB, and EJS templating engine. Eventify allows users to create, discover, and book events with features like user authentication, admin panel, payment processing, and email notifications.

## ✨ Features

### 🚀 Core Features
- **Event Management**: Create, edit, and manage events with rich details
- **User Authentication**: Secure login/signup with email verification
- **Google OAuth**: Social login integration
- **Event Booking**: Easy event registration and ticket booking
- **Admin Panel**: Comprehensive admin dashboard for event and user management
- **Payment Processing**: Integrated payment system for event tickets
- **Email Notifications**: Automated email confirmations and tickets
- **Responsive Design**: Mobile-friendly interface

### 👥 User Types
- **Attendees**: Browse and book events
- **Creators**: Create and manage their own events
- **Admins**: Full system administration capabilities

### 🎫 Event Features
- Event categories and pricing
- Private/public event support
- Guest list management
- Image uploads
- Location and date management
- Free and paid event options

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **Nodemailer** - Email functionality
- **bcryptjs** - Password hashing

### Frontend
- **EJS** - Embedded JavaScript templating
- **CSS3** - Styling and responsive design
- **JavaScript** - Client-side functionality

### Authentication & Security
- **Express Session** - Session management
- **Google OAuth 2.0** - Social authentication
- **JWT-like session tokens** - Secure authentication

## 📁 Project Structure

```
Eventify-OG/
├── Backend/                 # Backend application files
├── Frontend/               # Frontend assets and views
├── config/                 # Configuration files
│   └── passport.js        # Passport authentication config
├── controller/             # Route controllers
│   ├── adminController.js  # Admin functionality
│   ├── authController.js   # Authentication logic
│   ├── bookingController.js # Booking management
│   └── eventController.js  # Event operations
├── middlewares/            # Custom middleware
│   └── authmiddleware.js  # Authentication middleware
├── models/                 # Database models
│   ├── bookingModel.js    # Booking schema
│   ├── eventModel.js      # Event schema
│   ├── otpModel.js        # OTP verification
│   └── userModel.js       # User schema
├── routes/                 # API routes
│   ├── adminRoute.js      # Admin endpoints
│   ├── authRoute.js       # Authentication routes
│   ├── bookingRoute.js    # Booking endpoints
│   └── eventRoute.js      # Event routes
├── utils/                  # Utility functions
│   └── sendEmail.js       # Email service
├── views/                  # EJS templates
│   ├── admin/             # Admin panel views
│   ├── partials/          # Reusable components
│   └── *.ejs              # Main page templates
├── public/                 # Static assets
│   ├── *.css              # Stylesheets
│   └── images/            # Image assets
├── main.js                 # Application entry point
├── db.js                   # Database connection
└── package.json            # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eventify-OG
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   secretkey=your_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CALLBACK_URL=your_callback_url
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - Update the connection string in `.env`

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - The application will redirect to the login page

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Update your `.env` file with the credentials

### Email Configuration
1. Configure your email service (Gmail, Outlook, etc.)
2. Update `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. For Gmail, enable 2-factor authentication and use app passwords

## 📱 Usage

### For Users
1. **Registration**: Sign up with email or Google account
2. **Browse Events**: View available events by category
3. **Book Events**: Select events and complete booking process
4. **Manage Profile**: Update personal information and preferences

### For Event Creators
1. **Create Events**: Add event details, images, and pricing
2. **Manage Events**: Edit event information and manage bookings
3. **View Analytics**: Track event performance and attendee data

### For Admins
1. **Dashboard**: Overview of system statistics
2. **User Management**: Monitor and manage user accounts
3. **Event Oversight**: Review and moderate events
4. **System Settings**: Configure platform parameters

## 🔒 Security Features

- **Password Hashing**: bcrypt encryption for user passwords
- **Session Management**: Secure session handling with Express
- **Input Validation**: Comprehensive input sanitization
- **Authentication Middleware**: Protected route access
- **CSRF Protection**: Built-in security measures

## 📧 Email Features

- **Welcome Emails**: New user registration confirmations
- **Event Confirmations**: Booking confirmations with details
- **Ticket Delivery**: Digital tickets via email
- **OTP Verification**: Email-based account verification

## 🎨 Customization

### Styling
- Modify CSS files in the `public/` directory
- Update color schemes and layouts
- Customize responsive breakpoints

### Templates
- Edit EJS files in the `views/` directory
- Modify page layouts and components
- Update email templates

## 🚀 Deployment

### Railway (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Heroku
1. Create Heroku app
2. Set buildpacks and environment variables
3. Deploy using Git

### Vercel/Netlify
1. Configure for Node.js applications
2. Set environment variables
3. Deploy from repository

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Manual testing endpoints
GET /test - Server status
GET /auth/google/status - OAuth configuration status
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Eventify Team**
- Event management platform for modern event organizers

## 🙏 Acknowledgments

- Express.js community for the robust web framework
- MongoDB team for the flexible database solution
- Passport.js for authentication middleware
- All contributors and users of Eventify

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Eventify** - Making event management simple and efficient! 🎉
