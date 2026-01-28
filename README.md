# Digital Student Fees Management System

A comprehensive web-based solution for managing student fees in educational institutions. Built with modern technologies for efficiency, security, and ease of use.

## 🚀 Features

### For Administrators

- **Dashboard**: Real-time overview of collections, pending fees, and analytics
- **Student Management**: Add, edit, delete students; bulk import via CSV
- **Fee Structures**: Define various fee types with late fee policies
- **Fee Assignments**: Assign fees to individual students, classes, or all students
- **Payment Management**: Track all payments, approve manual payments
- **Reports**: Generate daily, monthly, yearly, and custom reports with Excel/PDF export
- **User Management**: Create and manage system users with role-based access
- **Settings**: Configure institution details and system preferences
- **Activity Logs**: Track all system activities for audit purposes

### For Students

- **Dashboard**: View fee summary and pending payments at a glance
- **My Fees**: See all assigned fees with due dates and status
- **Online Payment**: Pay fees securely using Stripe
- **Payment History**: View all past payments with receipt download
- **Notifications**: Receive reminders for upcoming and overdue payments

### Additional Features

- 🔐 Secure authentication with JWT
- 👥 Role-based access control (Admin, Accountant, Student, Parent)
- 📱 Responsive design for all devices
- 📧 Email notifications for payments and reminders
- 📄 PDF receipt generation with QR codes
- 📊 Excel and PDF report exports
- 💳 Stripe payment integration
- 📈 Real-time analytics and charts

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with bcryptjs
- **Payment Processing**: Stripe
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **Excel Export**: ExcelJS

### Frontend

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Heroicons
- **Payments**: Stripe.js

## 📁 Project Structure

```
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth, validation, logging
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Helper functions
│   ├── .env.example       # Environment variables template
│   └── package.json
│
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand store
│   │   └── utils/         # Helper functions
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file from template:

```bash
cp .env.example .env
```

4. Configure your environment variables:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fees_management
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@feespro.com
```

5. Start the server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Students

- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/import` - Bulk import from CSV

### Fees

- `GET /api/fees/structures` - List fee structures
- `POST /api/fees/structures` - Create fee structure
- `GET /api/fees/assignments` - List fee assignments
- `POST /api/fees/assign` - Assign fees to students

### Payments

- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/:id/confirm` - Confirm payment
- `GET /api/payments/:id/receipt` - Download receipt

### Reports

- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/daily` - Daily collection report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/yearly` - Yearly report

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended for production)
- SQL injection prevention via Sequelize ORM

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📦 Deployment

### Backend

1. Set `NODE_ENV=production`
2. Configure production database
3. Use process manager like PM2
4. Set up SSL/HTTPS

### Frontend

1. Build the application:

```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@feespro.com or open an issue in the repository.

---

Built with ❤️ for educational institutions
