const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Allowed Origins for CORS
const allowedOrigins = [
    'http://localhost:5173',
    'https://expense-tracker-darsh.vercel.app'
];

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Basic request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Pass io to request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/authRoutes')); // Reusing authRoutes for /users fetch
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/settlements', require('./routes/settlementRoutes'));
app.use('/api/delete-requests', require('./routes/deleteRequestRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic testing route
app.get('/', (req, res) => res.send('Expense Tracker API is running in production mode.'));

// Socket.io Events
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a group room
    socket.on('join_group', (groupId) => {
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
    });

    // Join admin group room
    socket.on('join_admin_group', (groupId) => {
        socket.join(`admin_${groupId}`);
        console.log(`Admin joined group: admin_${groupId}`);
    });

    // Join personal user room based on user ID
    socket.on('join_user', (userId) => {
        socket.join(userId);
        console.log(`User joined personal room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
