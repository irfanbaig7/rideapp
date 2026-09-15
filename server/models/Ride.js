const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    fromCoords: { lat: Number, lng: Number }, // Mapbox se milega
    toCoords: { lat: Number, lng: Number },
    via: String,

    date: { type: String, required: true },
    time: { type: String, required: true },

    seatsTotal: { type: Number, required: true },
    seatsAvailable: { type: Number, required: true },
    price: { type: Number, required: true },

    status: { type: String, enum: ['active', 'ongoing', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);