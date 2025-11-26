//=======

//SETUP

//=======

//Prerequisites
const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const path = require('path');
//Importing models
const User = require('./models/User');
const Flight = require('./models/Flight');
const Reservation = require('./models/Reservation');

//Initialising express + port #
const app = express();
const PORT = 1234; //Port number doesn't really matter

//Connecting to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userdb')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

//Setting up Handlebars
const hbs = exphbs.create({
    extname: "hbs",
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/partials"),
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        eq: function (a, b) {
            return a === b;
        },
        ifeq: function(a, b, options) {
            return a === b ? options.fn(this) : options.inverse(this);
        },
        ifneq: function(a, b, options) {
            return a !== b ? options.fn(this) : options.inverse(this);
        },
        inc: function (value) {
            return parseInt(value) + 1;
        },
        
        formatDate: function (date) {
            if (!date) return "";
            const d = new Date(date);
            return d.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        },
        shorten: (id) => id ? id.toString().substring(0,8) : ""
    }
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set('views', './views');

//Middleware
app.use(express.urlencoded({ extended: true }));

//==================
// Helper Functions
//==================

//========

//ROUTES

//========
app.use("/", require("./routes/homeRoutes"));
app.use("/", require("./routes/userRoutes"));
app.use("/", require("./routes/flightRoutes"));
app.use("/", require("./routes/reservationRoutes"));

//====================

//STARTING UP SERVER

//====================

app.use(express.static(__dirname));

app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    //Inserting admin users if database is empty
    const count = await User.countDocuments();
    if (count === 0) {
        await User.insertMany([
            {username: 'jsphAIR', firstName: 'Joshua Samuel',
            middleName: 'Pineda', lastName: 'Habos',
            email: 'joshua_habos@dlsu.edu.ph',
            phone: '09232130974',
            password: 'FlyingIsC00l',
            isAdmin: true
            },

            {username: 'Iv3r', firstName: 'Iverson Paul',
            middleName: 'Ventosa', lastName: 'Alay',
            email: 'iverson_alay@dlsu.edu.ph',
            phone: '09128990723',
            password: 'read4B00k',
            isAdmin: true
            },

            {username: 'Al', firstName: 'Alpha',
            middleName: 'Beta', lastName: 'Omega',
            email: 'alpha_omega@dlsu.edu.ph',
            phone: '09091223456',
            password: 'HaHatdog',
            isAdmin: true
            },

            {username: 'Quen', firstName: 'Quentin',
            middleName: 'Jeroma', lastName: 'Tarantino',
            email: 'quentin_tarantino@dlsu.edu.ph',
            phone: '09123456789',
            password: 'iM4kef1lm',
            isAdmin: true
            }
        ]);
        console.log('Admin users inserted into database.');
    }

    //Inserting dummy flight data if empty
    const flights = await Flight.countDocuments(); 
    if (flights === 0) {
        await Flight.insertMany([
            {
                flightNumber: "PAL123",
                origin: "NAIA",
                destination: "Tokyo",
                daysOfWeek: ["Monday", "Thursday"],
                departure: "20:00",
                arrival: "23:00",
                aircraft: "PAL",
                capacity: 256,
                price: 5000
            },
            {
                flightNumber: "CEB800",
                origin: "Cebu",
                destination: "Seoul",
                daysOfWeek: ["Tuesday", "Friday"],
                departure: "10:00",
                arrival: "14:00",
                aircraft: "Cebu Pacific",
                capacity: 180,
                price: 4500
            },
            {
                flightNumber: "CLK500",
                origin: "Clark",
                destination: "Manila",
                daysOfWeek: ["Tuesday", "Friday"],
                departure: "19:00",
                arrival: "21:00",
                aircraft: "Clark Airlines",
                capacity: 200,
                price: 150
            }
        ]);
        console.log('Initial flights inserted into database.');
    }
});










