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

// Middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5002', process.env.FRONTEND_URL].filter(Boolean), // Explicitly whitelist frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
// Enable pre-flight requests for all routes using Regex to avoid PathError, using SAMU options
app.options(/.*/, cors(corsOptions));

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
