const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user.toSafeObject() });
});

router.patch('/me', protect, async (req, res) => {
    const allowed = ['name', 'phone', 'email', 'city', 'emergencyContactName', 'emergencyContactPhone'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toSafeObject() });
});

router.patch('/driver-profile', protect, async (req, res) => {
    const { car, city } = req.body;
    const user = await User.findById(req.user._id);
    if (car) user.car = { ...(user.car?.toObject?.() || {}), ...car };
    if (city) user.city = city;
    await user.save();
    res.json({ user: user.toSafeObject() });
});

router.patch('/documents', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    user.documents = { ...(user.documents?.toObject?.() || {}), ...req.body };
    await user.save();
    res.json({ user: user.toSafeObject() });
});

router.post('/become-driver', protect, async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { role: 'driver', isAvailable: true, driverProfileComplete: true },
        { new: true }
    );
    res.json({ user: user.toSafeObject() });
});

router.patch('/availability', protect, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { isAvailable: !!req.body.isAvailable }, { new: true });
    res.json({ user: user.toSafeObject() });
});

// Driver location update — Phase 2 me socket se bhi bhejenge, ye HTTP fallback hai
router.patch('/location', protect, async (req, res) => {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { currentLocation: { lat, lng, updatedAt: new Date() } },
        { new: true }
    );
    res.json({ user: user.toSafeObject() });
});

module.exports = router;