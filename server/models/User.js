const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: String,
    number: String,
    year: String,
    type: { type: String, default: '4 Wheeler' },
    color: String,
    ac: { type: Boolean, default: false },
}, { _id: false });

const documentsSchema = new mongoose.Schema({
    licenseUrl: String,
    rcUrl: String,
    insuranceUrl: String,
    photoUrl: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true },
    city: { type: String, trim: true },

    // Ek user EK role hi hota hai kisi bhi waqt — passenger ya driver.
    // "Become a driver" is field ko badalta hai, dono role ek saath possible nahi.
    role: { type: String, enum: ['passenger', 'driver'], default: 'passenger', required: true },

    isAvailable: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    tripsCount: { type: Number, default: 0 },

    car: carSchema,
    documents: documentsSchema,
    driverProfileComplete: { type: Boolean, default: false },

    // Live location — sirf drivers ke liye meaningful hai, lekin field sabke liye
    // (agar future me passenger location share karna ho to already ready hai)
    currentLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date,
    },

    emergencyContactName: String,
    emergencyContactPhone: String,

    resetOtp: String,
    resetOtpExpires: Date,
}, { timestamps: true });

userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetOtp;
    delete obj.resetOtpExpires;
    return obj;
};

module.exports = mongoose.model('User', userSchema);