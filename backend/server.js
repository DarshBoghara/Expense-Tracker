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

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*', // For development
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Basic testing route
app.get('/', (req, res) => res.send('API is running'));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
