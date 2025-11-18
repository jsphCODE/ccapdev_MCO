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

//SeatMap
function generateSeatMap(flight, reservedSeats = []) {
  const ROWS = 15;  
  const LETTERS = ["A", "B", "C", "D", "E", "F"];  

  const seatRows = [];

  for (let r = 1; r <= ROWS; r++) {

    const aisle1 = []; 
    const aisle2 = []; 

    for (let i = 0; i < LETTERS.length; i++) {
      const seatId = `${r}${LETTERS[i]}`;
      const isReserved = reservedSeats.includes(seatId);
      const seatObj = { id: seatId, isReserved };

      if (i < 3) aisle1.push(seatObj);     
      else aisle2.push(seatObj);          
    }

    seatRows.push({ aisle1, aisle2 });
  }

  return seatRows;
}

//========

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
        res.render('error', { //Renders error page with title
            Title: 'User Not Found',
            errorCode: 404, //Error code
            errorMsg: "User not found. It seems that you are a new user. Please register for an account!", //Error message
            errorLink: "/register", //Link for the button
            errorBtnTxt: "Register Here" //Text for the button to display
        });
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

//Route for getting one user by username (TO BE IMPLEMENTED PROPERLY IN PHASE 3)
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
app.get('/searchFlight', (req, res) => {
    res.render('partials/flights/search_flight', { 
        Title: 'Flight Search',
        flights: [],
        search: {}
    });
});

//route to get flight search results
app.get("/search_flight", async (req, res) => {
    try {
        const { origin, destination, departureDate } = req.query;

        let flights = [];

        if (origin && destination && departureDate) {
            const dayOfWeek = new Date(departureDate)
                .toLocaleDateString("en-US", { weekday: "long" });

            flights = await Flight.find({
                origin,
                destination,
                daysOfWeek: dayOfWeek
            }).lean();
        }

        res.render("partials/flights/search_flight", { 
            Title: "Flight Search",
            flights,
            search: { origin, destination, departureDate }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error searching flights");
    }
});

// Route to the flight list (FOR ADMINS)
app.get('/manage-flights', async (req, res) => {
    const flights = await Flight.find().lean() //Find all flights in the DB
    //Renders flight list, regardless if there are any flights or not
    res.render('partials/flights/flight-list', { 
        Title: 'Manage Flights',
        flights
        //Below are needed for creating flights
        // origins: Object.keys(destinations),
        // destinations,
        // aircraftByOrigin
    });
    // const destinations = { //Dictionary for origin and destinations
    //     "NAIA": ["Tokyo", "Singapore", "Hong Kong"],
    //     "Clark": ["Manila", "Seoul", "Bangkok"],
    //     "Cebu": ["Manila", "New Zealand", "Beijing"],
    //     "Davao": ["Manila", "Taipei", "Seoul"]
    // };

    // const aircraftByOrigin = { //Dictionary for aircrafts, by origin
    //     "NAIA": ["Airbus A320", "Boeing 737"],
    //     "Clark": ["ATR 72", "Airbus A320"],
    //     "Cebu": ["Lockheed F-22", "Airbus A321"],
    //     "Davao": ["Airbus A320", "Batwing"]
    // };
});

//Route for loading registration page
app.get('/manage-flights/add', async (req, res) => {
    const destinations = { //Dictionary for origin and destinations
        "NAIA": ["Tokyo", "Singapore", "Hong Kong"],
        "Clark": ["Manila", "Seoul", "Bangkok"],
        "Cebu": ["Manila", "New Zealand", "Beijing"],
        "Davao": ["Manila", "Taipei", "Seoul"]
        };

    const aircrafts = ["Airbus A320", "Airbus A321", "Boeing 737", "ATR 72", "Lockheed F-22"]

    res.render('partials/flights/add-flight' , {Title : 'Add a Flight' // Shows registration form
        , destinations, aircrafts
    }); 
});

//Route for adding registered flight to the DB
app.post('/manage-flights/add', async (req, res) => {
    const formData = req.body;
    const newFlight = new Flight(formData);

    await newFlight.save();

    res.render('partials/flights/confirmation', {Title: 'Confirmation of Added Flight', 
        confirmMsg: "added", formData}); //Renders the confirmaton page upon successful registration
});

// Route for getting a flight TO EDIT in the flight list (FOR ADMINS)
app.get('/manage-flights/edit/:flightNumber', async (req, res) => {
    const findFlight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean(); //Searches for the flight under the specified flight number
    //If flight is found in the server, direct in an 'edit-flight' form
    if (findFlight) {
        const destinations = { //Dictionary for origin and destinations
        "NAIA": ["Tokyo", "Singapore", "Hong Kong"],
        "Clark": ["Manila", "Seoul", "Bangkok"],
        "Cebu": ["Manila", "New Zealand", "Beijing"],
        "Davao": ["Manila", "Taipei", "Seoul"]
        };
        const chosenOrigin = destinations;
        delete chosenOrigin[findFlight.origin];

        // const aircraftByOrigin = { //Dictionary for aircrafts, by origin
        // "NAIA": ["Airbus A320", "Boeing 737"],
        // "Clark": ["ATR 72", "Airbus A320"],
        // "Cebu": ["Lockheed F-22", "Airbus A321"],
        // "Davao": ["Airbus A320", "Batwing"]
        // };
        // const chosenAircraft = aircraftByOrigin;
        // delete chosenAircraft.findFlight.origin;

        const aircrafts = ["Airbus A320", "Airbus A321", "Boeing 737", "ATR 72", "Lockheed F-22"]

      res.render('partials/flights/edit-flight', {Title: 'Edit Flight', findFlight  //Provides existing flight's info into the form
        , origins: Object.keys(destinations), destinations, chosenOrigin, aircrafts
        // , aircraftByOrigin, chosenAircraft
    });
    }
    //Otherwise, throw 404 error
    else {
        res.render('error', { //Renders error page with title
            Title: 'Flight Not Found',
            errorCode: 404, //Error code
            errorMsg: "Flight not found. Perhaps you mean to add this flight to the flight list?", //Error message
            errorLink: "partials/flights/flight-list", //Link for the button
            errorBtnTxt: "Back to Flight List" //Text for the button to display
        });
    }
});

// Route for updating a flight in the flight list (FOR ADMINS)
app.post('/manage-flights/edit/:flightNumber', async (req, res) => {
    const formData = req.body; //Form data with updated flight info
    const updatedFlight = await Flight.findOneAndUpdate({ flightNumber: req.params.flightNumber }, formData); //Updates the flight with new info
    //If flight is updated in the server, direct to the confirmation page
    if (updatedFlight) {
      res.render('partials/flights/confirmation', {Title: 'Flight Edit Confirmation', 
        confirmMsg: "updated", formData}); //Renders the confirmaton page with corresponding message upon successful edit of flight
    }
    //Otherwise, throw 404 error
    else {
        res.render('error', { //Renders error page with title
            Title: 'Flight Not Found',
            errorCode: 404, //Error code
            errorMsg: "Flight not found. Perhaps you mean to add this flight to the flight list?", //Error message
            errorLink: "partials/flights/flight-list", //Link for the button
            errorBtnTxt: "Back to Flight List" //Text for the button to display
        });
    }
});

// Route for deleting a flight in the flight list

//========================
//Reservation List Routes
//========================

app.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});
 
 //Get reservations list loads reservation form
app.get("/reservations/create/:flightId", async (req, res) => {
    try{
    const flight = await Flight.findById(req.params.flightId).lean();
    if (!flight) return res.status(404).send("Flight not found");

    const reservedSeats = await Reservation.find({ 
        flight: flight._id,
        status: "succeed"
    }).distinct("seat");

    const seatRows = generateSeatMap(flight, reservedSeats);

    res.render("partials/reservations/Reservation_Form", {
        flight,
        seatRows});
    } catch (err) {
    console.error(err);
    res.status(500).send("Error loading form");
  }
});


 //Saves new reservation
 app.post("/reservations/create", async (req, res) => {
    try{
    if (!req.body.flight || !req.body.seat) {
      return res.status(400).send("Flight and seat required");
    }

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
    } catch (err) {
    console.error(err);
    res.status(500).send("Error creating reservation");
  }
});


//Show list of all reservations.
app.get("/reservations/my-bookings", async (req, res) => {
    try{
    const reservations = await Reservation
        .find()
        .populate("flight")
        .lean();

    res.render("partials/reservations/Reservation_List", { reservations });
    } catch (err) {
    console.error(err); res.status(500).send("Error loading reservations");
  }
});


//Edit Reservations Page
app.get("/reservations/:id/edit", async (req, res) => {
    try{
    const reservation = await Reservation.findById(req.params.id).populate("flight").lean();

    const reservedSeats = await Reservation.find({
        flight: reservation.flight._id,
        status: "succeed",
        _id: { $ne: reservation._id }
    }).distinct("seat");

    const seatRows = generateSeatMap(reservation.flight, reservedSeats).map(row => {
      row.aisle1 = row.aisle1.map(s => ({ ...s, isSelected: s.id === reservation.seat }));
      row.aisle2 = row.aisle2.map(s => ({ ...s, isSelected: s.id === reservation.seat }));
      return row;});

    res.render("partials/reservations/Reservation_Edit", {
        reservation,
        seatRows
    });} catch (err) {
    console.error(err); res.status(500).send("Error loading edit form");
  }
});

//Update Reservations Page
app.post("/reservations/:id/edit", async (req, res) => {
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id, 
      {
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage
      },
      { new: true, runValidators: true } // Return updated doc and validate
    );

    if (!updatedReservation) {
      return res.status(404).send("Reservation not found");
    }

    // Redirect to the reservations list instead of summary
    res.redirect("/reservations/my-bookings");
  } catch (err) {
    console.error(err); 
    res.status(500).send("Error updating reservation");
  }
});

//Mark reservation as cancelled.
app.post("/reservations/:id/cancel", async (req, res) => {
  try {
    await Reservation.findByIdAndUpdate(req.params.id, { status: "cancelled" });
    res.redirect("/reservations/my-bookings");
  } catch (err) {
    console.error(err); res.status(500).send("Error cancelling");
  }
});

//Show reservation summary with fare breakdown.

app.get("/reservations/:id/summary", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("flight").lean();
    if (!reservation) return res.status(404).send("Reservation not found");

    // Price logic (your preserved computation)
    let baseFare = 5000;
    let baggageFee = 0;
    let mealFee = 0;

    switch (reservation.baggage) {
      case "small": baggageFee = 500; break;
      case "medium": baggageFee = 1000; break;
      case "large": baggageFee = 1500; break;
    }
    if (reservation.meal && reservation.meal !== "standard") mealFee = 300;

    const total = baseFare + baggageFee + mealFee;

    res.render("partials/reservations/Reservation_Summary", {
      reservation, flight: reservation.flight, baggageFee, mealFee, total
    });

  } catch (err) {
    console.error(err); res.status(500).send("Error loading summary");
  }
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









