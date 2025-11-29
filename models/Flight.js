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

    daysOfWeek: {
        type: [String],
        required: true,
        enum: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ]
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
    },

    availableSeats: {
        type: Number,
        default: function () {
            return this.capacity;
        }
    },
    
    price: {
        type: Number,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Flight', FlightSchema);

