const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpSms } = require('../utils/sms');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

router.post('/signup', async (req, res) => {
    const { name, phone, email, password, city } = req.body;

    if (!name || !phone || !password) return res.status(400).json({ error: 'name, phone and password are required.' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    if (!/^\d{10}$/.test(phone.trim())) return res.status(400).json({ error: 'Phone must be exactly 10 digits.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ error: 'Phone number already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, email, password: hashed, city, role: 'passenger' });

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpSms(phone, otp);

    res.status(201).json({ user: user.toSafeObject(), token: signToken(user._id) });
});

router.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: 'Invalid phone or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid phone or password.' });

    res.json({ user: user.toSafeObject(), token: signToken(user._id) });
});

router.post('/forgot-password', async (req, res) => {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'No account with this phone number.' });

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpSms(phone, otp);

    res.json({ message: 'OTP sent.', ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }) });
});

router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    if (!user || user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }
    res.json({ message: 'OTP verified.' });
});

router.post('/reset-password', async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    const user = await User.findOne({ phone });
    if (!user || user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful.' });
});

module.exports = router;