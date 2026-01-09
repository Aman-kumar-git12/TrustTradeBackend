const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const corsOptions = {
    origin: true, // Reflect request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
// Enable pre-flight requests for all routes using Regex to avoid PathError, using SAMU options
app.options(/.*/, cors(corsOptions));

app.use(express.json());
console.log("Server restarting..."); // Trigger restart

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('AssetDirect API is running...');
});

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const interestRoutes = require('./routes/interestRoutes');
const businessRoutes = require('./routes/businessRoutes');
const businessDashboardRoutes = require('./routes/businessDashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/dashboard/business', businessDashboardRoutes);

const salesRoutes = require('./routes/salesRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);


const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
