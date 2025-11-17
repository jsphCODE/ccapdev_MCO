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
        
        inc: function (value) {
            return parseInt(value) + 1;
        },
    }
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set('views', './views');

//Middleware
app.use(express.urlencoded({ extended: true }));

//========

//SeatMap
function generateSeatMap(flight, reservedSeats = []) {
    const rows = 10;
    const seatsPerRow = 4;

    let seatRows = [];

    for (let r = 1; r <= rows; r++) {
        let aisle1 = [];
        let aisle2 = [];

        for (let s = 1; s <= seatsPerRow; s++) {
            const seatId = `${r}${String.fromCharCode(64 + s)}`;
            const isReserved = reservedSeats.includes(seatId);

            if (s <= 2) aisle1.push({ id: seatId, isReserved });
            else aisle2.push({ id: seatId, isReserved });
        }

        seatRows.push({ aisle1, aisle2 });
    }

    return seatRows;
}

//ROUTES

//========

//Route for loading inital page (login or register)
app.get('/', (req, res) => {
    res.render('initial', {Title : 'Home Page'});
});

//========================
//User Managerment Routes
//========================

//Route for loading registration page
app.get('/register', async (req, res) => {
    res.render('partials/users/register' , {Title : 'User Registration'}); // Shows registration form
});

//Route for adding registered user to the DB
app.post('/register', async (req, res) => {
    const formData = req.body;
    const newUser = new User(formData);

    await newUser.save();

    res.render('partials/users/confirmation', {Title: 'Registration Confirmation', formData}); //Renders the confirmaton page upon successful registration
});

//Route for loading the profile page
app.get('/profile/:username', async (req, res) => {
    const user = await User.findOne({username: req.params.username}).lean(); //Finds the user's info based on username
    if (user) {
        res.render('partials/users/profile' , {Title : 'Your Profile Page', user}); // Shows profile page
    }
    else {
        res.status(404).send('User not found.');
    }
    
});

//Initial GET route for redndering the login page
app.get('/login', async (req, res) =>{
  res.render('partials/users/login', {Title : 'User Login'});
});

//POST route to find user in DB (login)
app.post('/login', async (req, res) => {
    const formData = req.body; //formData consists of username, email, and password
    const userCheck = await User.findOne({username : formData.username}).lean(); //Finds user based on inputted username

    //If user is found based on username, check if the inputted email and password matches
    if (userCheck) {
        const emailCheck = (userCheck.email === formData.email); //Checks if email matches
        const passwordMatch = (userCheck.password === formData.password); //Checks if password matches

        //If both email and password match, direct to confimation page for successful login
        if (emailCheck && passwordMatch){
            res.render('partials/users/confirmation', {Title: 'Login Confirmation', formData}); //Renders the confirmaton page upon successful login
        }
        //Otherwise, direct to error page
        else {
            res.render('error', { //Renders error page with title
                Title: 'Login Failed',
                errorCode: 404, //Error code
                errorMsg: "Email and/or Password do not match. Please try again.", //Error message
                errorLink: "/login", //Link for the button
                errorBtnTxt: "Back to Login Page" //Text for the button to display
            }); 
        }
    }
    //Otherwise, direct to error page
    else {
       res.render('error', { //Renders error page with title
            Title: 'User Not Found',
            errorCode: 404, //Error code
            errorMsg: "User not found. Please try again.", //Error message
            errorLink: "/login", //Link for the button
            errorBtnTxt: "Back to Login Page" //Text for the button to display
        }); 
    }
});

//Route for logging out (TO BE IMPLEMENTED PROPERLY IN PHASE 3)
app.get('/logout', async (req, res) => {
    //Code for disconnecting current user from the session
    res.render('initial', {Title : 'Home Page'});
});

//Route for getting one user by username (only works if typed as URL, TO BE IMPLEMENTED PROPERLY IN PHASE 3)
app.get('/edit-profile/:username', async (req, res) =>{
    const findUser = await User.findOne({ username: req.params.username }).lean(); //Searches for a user under the specified username via URL
    //If user if found, display in an 'edit profile' form
    if (findUser) {
      res.render('partials/users/edit-profile', {Title: 'Edit Profile', findUser}); //Provides existing user's info into the form
    }
    //Otherwise, throw 404 error
    else {
        res.render('error', { //Renders error page with title
            Title: 'User Not Found',
            errorCode: 404, //Error code
            errorMsg: "User not found. Please try again.", //Error message
            errorLink: "/", //Link for the button
            errorBtnTxt: "Back to Homepage" //Text for the button to display
        });
    }
});

//Route for updating a user's data (TO BE IMPLEMENTED PROPERLY IN PHASE 3)
app.post('/edit-profile/:username', async (req, res) => {
    const formData = req.body; //Form data with updated user info
    const updatedUser = await User.findOneAndUpdate({ username: req.params.username }, formData); //Updates the user with new info
    //If user is updated in the server, direct to the confirmation page
    if (updatedUser) {
      res.render('partials/users/confirmation', {Title: 'User Edit Confirmation', formData}); //Renders the confirmaton page upon successful edit of profile
    }
    //Otherwise, throw 404 error
    else {
        res.render('error', { //Renders error page with title
            Title: 'User Not Found',
            errorCode: 404, //Error code
            errorMsg: "User not found. Please try again.", //Error message
            errorLink: "/", //Link for the button
            errorBtnTxt: "Back to Homepage" //Text for the button to display
        });
    }
});

//========================
//Flight Search Routes
//========================

// Route to show flight search page
app.get('/searchFlight', async (req, res) => {
  try {
      // Fetch flights from database
      const flights = await Flight.find().lean();

      // Render your Handlebars template
      res.render('partials/flights/search_flight', { 
          Title: 'Flight Search',
          flights
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

//route to get flight search results
 app.get("/search_flight", async (req, res) => {
    try {
         const flights = await Flight.find();
        

         res.render("flights/flight_results", { flights });
     } catch (err) {
         console.error(err);
         res.status(500).send("No flight");
     }
 });

//========================
//Reservation List Routes
//========================

 // RESERVATION ROUTES

app.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});
 
 //Get reservations list loads reservation form
app.get("/reservations/create/:flightId", async (req, res) => {
    const flight = await Flight.findById(req.params.flightId);

    const reservedSeats = await Reservation.find({ 
        flight: flight._id,
        status: "succeed"
    }).distinct("seat");

    const seatRows = generateSeatMap(flight, reservedSeats);

    res.render("partials/reservations/Reservation_Form", {
        flight,
        seatRows
    });
});


 //Saves new reservation
app.post("/reservations/create", async (req, res) => {
    const newReservation = await Reservation.create({
        reserveUser: req.body.reserveUser,
        reserveEmail: req.body.reserveEmail,
        passportNo: req.body.passportNo,
        flight: req.body.flight,
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage,
        status: "succeed"
    });

  res.redirect(`/reservations/${newReservation._id}/summary`);
});


//Show list of all reservations.
app.get("/reservations/my-bookings", async (req, res) => {
    const reservations = await Reservation
        .find()
        .populate("flight");

    res.render("partials/reservations/Reservation_List", { reservations });
});


//Edit Reservations Page
app.get("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).populate("flight");

    const reservedSeats = await Reservation.find({
        flight: reservation.flight._id,
        status: "succeed",
        _id: { $ne: reservation._id }
    }).distinct("seat");

    const seatRows = generateSeatMap(reservation.flight, reservedSeats);

    res.render("partials/reservations/Reservation_Edit", {
        reservation,
        seatRows
    });
});

//Update Reservations Page
app.post("/reservations/:id/edit", async (req, res) => {
    const updated = await Reservation.findByIdAndUpdate(
        req.params.id,
        {
            seat: req.body.seat,
            meal: req.body.meal,
            baggage: req.body.baggage
        },
        { new: true }
    );

    res.redirect(`/reservations/${updated._id}/summary`);
});

//Mark reservation as cancelled.
app.post("/reservations/:id/cancel", async (req, res) => {
    await Reservation.findByIdAndUpdate(req.params.id, {
        status: "cancelled"
    });

    res.redirect("/reservations/my-bookings");
});

//Show reservation summary with fare breakdown.

app.get("/reservations/:id/summary", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).populate("flight");

    let baseFare = 5000;
    let baggageFee = 0;
    let mealFee = 0;

    switch (reservation.baggage) {
        case "small": baggageFee = 500; break;
        case "medium": baggageFee = 1000; break;
        case "large": baggageFee = 1500; break;
    }

    if (reservation.meal !== "standard") {
        mealFee = 300;
    }

    const total = baseFare + baggageFee + mealFee;

    res.render("partials/reservations/Reservation_Summary", {
        reservation,
        flight: reservation.flight,
        baggageFee,
        mealFee,
        total
    });
});

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
            role: 'Admin'
            },

            {username: 'Iv3r', firstName: 'Iverson Paul',
            middleName: 'Ventosa', lastName: 'Alay',
            email: 'iverson_alay@dlsu.edu.ph',
            phone: '09128990723',
            password: 'read4B00k',
            role: 'Admin'
            },

            {username: 'Al', firstName: 'Alpha',
            middleName: 'Beta', lastName: 'Omega',
            email: 'alpha_omega@dlsu.edu.ph',
            phone: '09091223456',
            password: 'HaHatdog',
            role: 'Admin'
            },

            {username: 'Quen', firstName: 'Quentin',
            middleName: 'Jeroma', lastName: 'Tarantino',
            email: 'quentin_tarantino@dlsu.edu.ph',
            phone: '09123456789',
            password: 'iM4kef1lm',
            role: 'Admin'
            }
        ]);
        console.log('Admin users inserted into database.');
    }

    //Inserting dummy flight data if empty
    const flights = await Flight.countDocuments();
    if (flights === 0){
        await Flight.insertMany([
            {flightNumber: 'test',
            origin: 'NAIA',
            destination: 'Tokyo',
            schedule: 2025-11-16,
            departure: '20:00',
            arrival: '23:00',
            aircraft: 'PAL',
            capacity: '256'
            }
        ]);
        console.log('Testing flight data inserted into database.');
    }

});






