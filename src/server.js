const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db');

const cloudinaryRoutes = require("./cloudinary/routes.js");

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Health check endpoint at the very top to bypass heavy middleware/DB checks if needed
app.get("/api/health", (req, res) => res.status(200).send("OK"));

// 1. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow any origin during development by reflecting it back
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma']
}));

// 2. Handle preflight for all routes - cors() handles this automatically as middleware

app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
console.log("Server starting... (TrustTrade Robust Engine v1.0)");

// Logging incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Cloudinary Routes
app.use("/api/images", cloudinaryRoutes);

app.get('/', (req, res) => {
  res.send('TrustTrade API is running...');
});

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const interestRoutes = require('./routes/interestRoutes');
const businessRoutes = require('./routes/seller/businessRoutes');
const businessDashboardRoutes = require('./routes/seller/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/dashboard/business', businessDashboardRoutes);
app.use('/api/home', require('./routes/homeRoutes'));

const salesRoutes = require('./routes/seller/salesRoutes');
const buyerAnalyticsRoutes = require('./routes/buyer/analyticsRoutes');
const analyticsRoutes = require('./routes/seller/analyticsRoutes');

app.use('/api/sales', salesRoutes);
app.use('/api/analytics/buyer', buyerAnalyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/cron', require('./routes/cronRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/agent', require('./routes/agentRoutes'));


const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Accessible at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
});
