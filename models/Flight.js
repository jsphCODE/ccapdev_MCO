const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    origin: {
        type: String,
        required: true,
        trim: true
    },

    destination: {
        type: String,
        required: true,
        trim: true
    },

    //Date of takeoff; no time
    schedule: {
        type: Date, //YYYY-MM-DD
        required: true,
        trim: true
    },

    //Departure and arrival times are included; will be in string for now
    departure: {
        type: String, //##:## (TIMEZONE), in military format
        required: true,
        trim: true
    },

    arrival: {
        type: String, //##:## (TIMEZONE), in military format
        required: true,
        trim: true
    },

    aircraft: {
        type: String,
        required: true,
        trim: true
    },

    capacity: {
        type: Number,
        required: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Flight', FlightSchema);
