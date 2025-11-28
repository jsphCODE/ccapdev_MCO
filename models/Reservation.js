const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
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

    seat: {
        type: String,
        required: true,
        trim: true
        //Not unique since users can have the same seat on different flights
    },

    baggage: {
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
        enum: ['succeed','canceled', 'checked-in'],
        default: 'succeed'
    },

    boardingPass:{
        type: String,
        required: true,
        default: ''
    },

    //PNR Number (to be randomly generated for every reservation made)
    pnr:{
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema); //Makes the model usable 

