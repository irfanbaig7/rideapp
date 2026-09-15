const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

router.post('/', protect, async (req, res) => {
    const { rideId, seats = 1, paymentMethod = 'UPI', razorpayOrderId, razorpayPaymentId } = req.body;

    const rideCheck = await Ride.findById(rideId);
    if (!rideCheck) return res.status(404).json({ error: 'Ride not found.' });
    if (String(rideCheck.driver) === String(req.user._id)) {
        return res.status(400).json({ error: 'You cannot book your own ride.' });
    }

    const ride = await Ride.findOneAndUpdate(
        { _id: rideId, seatsAvailable: { $gte: seats } },
        { $inc: { seatsAvailable: -seats } },
        { new: true }
    );
    if (!ride) return res.status(400).json({ error: 'Not enough seats available.' });

    const platformFee = 20;
    const booking = await Booking.create({
        ride: ride._id,
        passenger: req.user._id,
        driver: ride.driver,
        seats,
        pricePerSeat: ride.price,
        platformFee,
        total: ride.price * seats + platformFee,
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: razorpayPaymentId ? 'paid' : 'pending',
        status: 'upcoming',
        otp: String(Math.floor(1000 + Math.random() * 9000)),
    });

    const populated = await Booking.findById(booking._id)
        .populate('driver', 'name rating car')
        .populate('passenger', 'name rating')
        .populate('ride');

    const io = req.app.get('io');
    if (io) {
        io.to(`user:${ride.driver}`).emit('booking:new', populated);
        io.emit('ride:updated', { rideId: ride._id.toString(), seatsAvailable: ride.seatsAvailable });
    }

    res.status(201).json({ booking: populated });
});

// GET /api/bookings/mine — role se automatically decide karta hai kaunsi list deni hai,
// aur HAR booking me viewerRole batata hai ki tum khud driver ho ya passenger.
router.get('/mine', protect, async (req, res) => {
    const isDriver = req.user.role === 'driver';
    const query = isDriver ? { driver: req.user._id } : { passenger: req.user._id };

    const bookings = await Booking.find(query)
        .populate('driver', 'name rating car')
        .populate('passenger', 'name rating')
        .populate('ride')
        .sort({ createdAt: -1 });

    const withViewerRole = bookings.map((b) => ({ ...b.toObject(), viewerRole: isDriver ? 'driver' : 'passenger' }));
    res.json({ bookings: withViewerRole });
});

router.get('/:id', protect, async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('driver', 'name rating car')
        .populate('passenger', 'name rating')
        .populate('ride');
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const uid = String(req.user._id);
    const isDriver = String(booking.driver._id) === uid;
    const isPassenger = String(booking.passenger._id) === uid;
    if (!isDriver && !isPassenger) return res.status(403).json({ error: 'Not authorized.' });

    res.json({ booking: { ...booking.toObject(), viewerRole: isDriver ? 'driver' : 'passenger' } });
});

router.patch('/:id/accept', protect, async (req, res) => {
    const booking = await Booking.findOneAndUpdate(
        { _id: req.params.id, driver: req.user._id },
        { status: 'upcoming' },
        { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    const io = req.app.get('io');
    if (io) io.to(`user:${booking.passenger}`).emit('booking:updated', booking);
    res.json({ booking });
});

router.patch('/:id/cancel', protect, async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, passenger: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason || '';
    await booking.save();

    const ride = await Ride.findByIdAndUpdate(booking.ride, { $inc: { seatsAvailable: booking.seats } }, { new: true });
    const io = req.app.get('io');
    if (io) {
        io.to(`user:${booking.driver}`).emit('booking:updated', booking);
        io.emit('ride:updated', { rideId: booking.ride.toString(), seatsAvailable: ride.seatsAvailable });
    }
    res.json({ booking });
});

router.patch('/:id/start', protect, requireRoleCheck, async (req, res) => {
    const { otp } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, driver: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (String(otp) !== String(booking.otp)) return res.status(400).json({ error: 'Incorrect OTP.' });

    booking.status = 'ongoing';
    booking.progress = 0.1;
    await booking.save();
    await Ride.findByIdAndUpdate(booking.ride, { status: 'ongoing' });

    const io = req.app.get('io');
    if (io) {
        io.to(`user:${booking.driver}`).emit('booking:updated', booking);
        io.to(`user:${booking.passenger}`).emit('booking:updated', booking);
    }
    res.json({ booking });
});
function requireRoleCheck(req, res, next) { next(); } // placeholder, role already checked by driver match above

router.patch('/:id/complete', protect, async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, driver: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    booking.status = 'completed';
    booking.progress = 1;
    await booking.save();
    await Ride.findByIdAndUpdate(booking.ride, { status: 'completed' });

    const io = req.app.get('io');
    if (io) {
        io.to(`user:${booking.driver}`).emit('booking:updated', booking);
        io.to(`user:${booking.passenger}`).emit('booking:updated', booking);
    }
    res.json({ booking });
});

module.exports = router;