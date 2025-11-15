//=======

//SETUP

//=======

//Prerequisites
const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');

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
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');
app.set('views', './views');

//Middleware
app.use(express.urlencoded({ extended: true }));

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

// Route to get reservations list (My Bookings)
app.get('/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('flight').lean();
        res.render('partials/reservations/Reservation_List', {
            Title: 'Your Reservations',
            reservations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Alternative route for My Bookings
app.get('/reservations/my-bookings', async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('flight');
        res.render('Reservation_List', {
            Title: 'Your Reservations',
            reservations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//========================
//Reservation Form Routes
//========================

// Route to get reservation form for a specific flight
app.get('/reservations/book/:flightId', async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.flightId);
        if (!flight) return res.status(404).send("Flight not found");

        // Get reserved seats for this flight
        const existingReservations = await Reservation.find({
            flight: req.params.flightId,
            status: 'succeed'
        });
        const reservedSeats = existingReservations.map(r => r.seatNo);

        const seatRows = [
            {
                aisle1: ["1A", "1B", "1C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                })),
                aisle2: ["1D", "1E", "1F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                }))
            },
            {
                aisle1: ["2A", "2B", "2C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                })),
                aisle2: ["2D", "2E", "2F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                }))
            },
            {
                aisle1: ["3A", "3B", "3C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                })),
                aisle2: ["3D", "3E", "3F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                }))
            },
            {
                aisle1: ["4A", "4B", "4C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                })),
                aisle2: ["4D", "4E", "4F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id)
                }))
            }
        ];

        res.render("Reservation_Form", {
            flight,
            seatRows,
            Title: 'Book Flight'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Route for creating a new reservation
app.post('/reservations', async (req, res) => {
    try {
        const { flight, reserveUser, reserveEmail, passportNo, seatNo, extraBaggage, meal } = req.body;

        const reservation = new Reservation({
            reserveID: `RES-${Date.now()}`,
            reserveUser,
            reserveEmail,
            passportNo,
            flight,
            seatNo,
            extraBaggage,
            meal,
            status: 'succeed'
        });

        await reservation.save();
        res.redirect('/reservations');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Route to edit reservation form
app.get('/reservations/:id/edit', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate("flight");
        if (!reservation) return res.status(404).send("Reservation not found");

        const allReservations = await Reservation.find({
            flight: reservation.flight._id,
            status: 'succeed'
        });

        const reservedSeats = allReservations.map(r => r.seatNo);

        const seatRows = [
            {
                aisle1: ["1A", "1B", "1C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                })),
                aisle2: ["1D", "1E", "1F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                }))
            },
            {
                aisle1: ["2A", "2B", "2C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                })),
                aisle2: ["2D", "2E", "2F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                }))
            },
            {
                aisle1: ["3A", "3B", "3C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                })),
                aisle2: ["3D", "3E", "3F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                }))
            },
            {
                aisle1: ["4A", "4B", "4C"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                })),
                aisle2: ["4D", "4E", "4F"].map(id => ({
                    id,
                    isReserved: reservedSeats.includes(id) && id !== reservation.seatNo
                }))
            }
        ];

        res.render("edit-reservation", {
            reservation,
            seatRows,
            Title: 'Edit Reservation'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Route to update reservation
app.post('/reservations/:id/edit', async (req, res) => {
    try {
        const { seatNo, meal, extraBaggage } = req.body;
        await Reservation.findByIdAndUpdate(req.params.id, {
            seatNo,
            meal,
            extraBaggage
        });
        res.redirect('/reservations');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating reservation");
    }
});

// Route to cancel reservation
app.post('/reservations/:id/cancel', async (req, res) => {
    try {
        await Reservation.findByIdAndUpdate(req.params.id, {
            status: "canceled"
        });
        res.redirect("/reservations");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error cancelling reservation");
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




