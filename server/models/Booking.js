const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    seats: { type: Number, required: true, default: 1 },
    pricePerSeat: { type: Number, required: true },
    platformFee: { type: Number, default: 20 },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['UPI', 'Card', 'Wallet'], default: 'UPI' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },

    status: { type: String, enum: ['pending', 'upcoming', 'ongoing', 'completed', 'cancelled'], default: 'pending' },
    cancelReason: String,

    otp: String,
    progress: { type: Number, default: 0 },

    passengerRating: Number,
    passengerReview: String,
    driverRating: Number,
    driverReview: String,
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);