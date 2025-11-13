const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    //Unique ID for identifying specific reservation
    reserveID: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    //RESERVING USER INFO

    reserveUser: {
        type: String,
        required: true,
        trim: true,
        //Not unique since multiple users can have reservations
    },

    reserveEmail: {
        type: String,
        required: true,
        trim: true
    },

    //For now, will have passport no. ONLY on Reservation (none in User)
    passportNo: {
        type: String,
        required: true,
        trim: true
    },

    //FLIGHT DETAILS

    flight: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Flight",
        required: true,
        trim: true
    },

    //RESERVATION INFO

    seatNo: {
        type: String,
        required: true,
        trim: true
        //Not unique since users can have the same seat on different flights
    },

    extraBaggage: {
        type: String,
        enum: ['none', 'small', 'medium', 'large'], //Changed variable type and Used enum for precise values for the variables
        default:'none'
    },
    

    meal: {
        type: String,
        enum: ['standard', 'vegetarian', 'kosher', 'etc'], //Used enum for precise values for the variables
        default: 'standard'
    },

    status:{
        type: String,
        enum: ['succeed','canceled'],
        default: 'succeed'
    }

}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema); //Makes the model usable 




    // //FLIGHT DETAILS
    
    // origin: {
    //     type: String,
    //     required: true,
    //     trim: true
    // },

    // destination: {
    //     type: String,
    //     required: true,
    //     trim: true
    // },

    // //Date of takeoff; no time
    // schedule: {
    //     type: Date, //YYYY-MM-DD
    //     required: true,
    //     trim: true
    // },

    // //Departure and arrival times are included; will be in string for now
    // departure: {
    //     type: String, //##:## (TIMEZONE), in military format
    //     required: true,
    //     trim: true
    // },

    // arrival: {
    //     type: String, //##:## (TIMEZONE), in military format
    //     required: true,
    //     trim: true
    // },
