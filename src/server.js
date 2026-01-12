const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db');

const cloudinaryRoutes = require("./cloudinary/routes.js");

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render/Heroku/Vercel) for Secure cookies to work
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL?.trim()
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));

app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
console.log("Server restarting... (Fix applied)"); // Trigger restart

// Cloudinary Routes
app.use("/api/images", cloudinaryRoutes);

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('AssetDirect API is running...');
});

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const interestRoutes = require('./routes/interestRoutes');
const businessRoutes = require('./routes/seller/businessRoutes');
const businessDashboardRoutes = require('./routes/seller/dashboardRoutes');

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


const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
