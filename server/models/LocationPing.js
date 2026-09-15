const mongoose = require('mongoose');

// Har location update yahan store nahi hoti (bahut heavy hota); ye sirf
// "last known location per booking" rakhta hai — Socket.io realtime broadcast
// karta hai, ye sirf reconnect/refresh ke liye fallback hai.
const locationPingSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    heading: Number,
}, { timestamps: true });

module.exports = mongoose.model('LocationPing', locationPingSchema);