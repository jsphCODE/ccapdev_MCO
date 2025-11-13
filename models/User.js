const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    //Not required since some people may not have middle names
    middleName: {
        type: String,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    //Phone number is not required to create a user account
    phone: {
        type: String,
        //match: '^(09|\+639)\d{9}$',
        trim: true,
        unique: true
    },
    
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    role: {
        type: String,
        default: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
