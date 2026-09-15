require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? [process.env.CLIENT_URL] : '*' }));
app.use(express.json({ limit: '2mb' }));

connectDB();

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: process.env.NODE_ENV === 'production' ? [process.env.CLIENT_URL] : '*' },
});
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));