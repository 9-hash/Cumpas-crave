require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MockPaymentService = require('./services/mockPaymentService');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Safety net: log unexpected async errors
process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled promise rejection:', reason);
});

// ==================== CORS CONFIGURATION ====================
// LOCAL ONLY - No Vercel
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`❌ Blocked CORS request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== REST API ROUTES ====================
app.use('/api', apiRoutes);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        app: 'Campus Crave API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Campus Crave REST API is running',
        api: '/api',
        health: '/health',
        version: '2.0.0'
    });
});

// ==================== MOCK PAYMENT ENDPOINTS ====================
app.post('/api/payment/initiate', async (req, res) => {
    try {
        const { orderId, amount, email, firstName, lastName } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId and amount'
            });
        }

        const txRef = MockPaymentService.generateTxRef(orderId);

        const result = await MockPaymentService.initializePayment({
            amount,
            email,
            firstName,
            lastName,
            txRef,
            orderId
        });

        res.json(result);
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/payment/verify/:txRef', async (req, res) => {
    try {
        const { txRef } = req.params;
        const result = await MockPaymentService.verifyPayment(txRef);
        res.json(result);
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/payment/refund', async (req, res) => {
    try {
        const { txRef, amount, reason } = req.body;

        if (!txRef || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: txRef and amount'
            });
        }

        const result = await MockPaymentService.refundPayment(txRef, amount, reason);
        res.json(result);
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/payment/callback', (req, res) => {
    const { tx_ref, status, order_id } = req.query;
    console.log(`📞 Payment Callback: ${tx_ref} - ${status}`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
${'='.repeat(50)}
🍕 Campus Crave REST API (LOCAL MODE)
${'='.repeat(50)}
📍 API:          http://localhost:${PORT}/api
💚 Health:       http://localhost:${PORT}/health
🔧 Mock Payment: http://localhost:${PORT}/api/payment/initiate
🌐 Environment:  ${process.env.NODE_ENV || 'development'}
🔗 CORS Origins: ${allowedOrigins.join(', ')}
${'='.repeat(50)}
    `);
});
