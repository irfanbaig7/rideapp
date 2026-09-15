const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const Ride = require('../models/Ride');

router.post('/', protect, requireRole('driver'), async (req, res) => {
    const { fromAddress, toAddress, fromCoords, toCoords, via, date, time, seats, price } = req.body;
    const ride = await Ride.create({
        driver: req.user._id,
        fromAddress, toAddress, fromCoords, toCoords, via, date, time,
        seatsTotal: seats,
        seatsAvailable: seats,
        price,
    });
    const io = req.app.get('io');
    if (io) io.emit('ride:posted', ride);
    res.status(201).json({ ride });
});

router.get('/', async (req, res) => {
    const { from, to, date } = req.query;
    const query = { status: 'active', seatsAvailable: { $gt: 0 } };
    if (from) query.fromAddress = new RegExp(from, 'i');
    if (to) query.toAddress = new RegExp(to, 'i');
    if (date) query.date = date;
    const rides = await Ride.find(query).populate('driver', 'name rating ratingCount verified car');
    res.json({ rides });
});

router.get('/mine', protect, requireRole('driver'), async (req, res) => {
    const rides = await Ride.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json({ rides });
});

router.get('/:id', async (req, res) => {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name rating ratingCount verified car');
    if (!ride) return res.status(404).json({ error: 'Ride not found.' });
    res.json({ ride });
});

module.exports = router;