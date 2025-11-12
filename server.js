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
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

//Middleware (not really sure but including this)
app.use(express.urlencoded({ extended: true }));

//ROUTES

//Route for loading Inital page (login or register)
app.get('/', (req, res) => {
    res.render('Initial', {title: 'Initial Homepage'});
});

//Route for adding registered user to the DB
app.post('/users/register', async (req, res) => {
    const formData = req.body;
    const newUser = new User(formData);

    await newUser.save();

    res.render('/users/confirmation', {formData});
});

//Route for getting login details (MCO 3)

//Route for checking if user login details are in the DB (MCO 3)

//Route for getting one user by username
app.get('/users/edit-profile/:username', async (req, res) =>{
  try{
    const user = await User.findOne(req.params.username).lean();
    //If user if found by inputted username, display in an 'edit profile' form
    if (user) {
      res.render('/users/edit-profile', {title: 'User Details', user});
    }
    //Otherwise, throw 404 error
    else {
      res.status(404).send('User not found');
    }
  } catch (err){
    res.status(400).send('Invalid username');
  }
});

//Route for updating a user's data
app.post('/users/edit-profile/:username', async (req, res) => {
  try{
    const updatedUser = await User.findOneAndUpdate(req.params.username, req.body).lean();
    //If user is updated in the server, direct to the confirmation page
    if (updatedUser) {
      res.render('/users/confirmation', {title: 'User Edit confirmation', updatedUser});
    }
    //Otherwise, throw 404 error
    else {
      res.status(404).send('User not found');
    }
  } catch (err){
    res.status(400).send('Error updating user');
  }
});

//Other routes to add as we make the Handlebars pages
router.get("/edit-reservation/:id/", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("flight");
    if (!reservation) return res.status(404).send("Reservation not found");

    res.render("edit-reservation", {reservation});
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.post("/edit-reservation/:id/", async (req, res) => {
  try {
    const {seat, meal, baggage} = req.body;

    await Reservation.findByIdAndUpdate(req.params.id, {
      seat,
      meal,
      baggage
    });

    res.redirect(`/reservations_list/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating reservation");
  }
});

router.post("/:id/cancel", async (req, res) => {
  try {
    await Reservation.findByIdAndUpdate(req.params.id, {
      status: "Cancelled"
    });

    res.redirect("/reservations/reservation_list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error cancelling reservation");
  }
});

//Edits/Removes Optional Packages 
app.patch('/api/reservations/:id', async (req, res) =>{
    try{
        const {id} = req.params;

        const updatedReservation = await Reservation.findByIdandUpdate(
            id,
            {$set: req.body},
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedReservation) {
            return res.status(404).json({message:"Reservation not found"});
        }

        res.status(200).json(updatedReservation);

    } catch (error) {
        console.error('Reservation update error:', error);
        res.status(400).json({
            message: "Failed to update reservation packages",
            error: error.message
        });
    }
});


// const users = [
//     { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role:
// 'Admin' },
//     { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' }, 
//     { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role:
// 'Moderator' }
// ];
// // Get all users 
// app.get('/api/users', (req, res) => {
//     res.json(users);
// });
// // Get one specific user by ID 
// app.get('/api/users/:id', (req, res) => {
// const userId = parseInt(req.params.id);
// const user = users.find(u => u.id === userId);
//   if (user) {
//     res.json(user);
// } else {
//     res.status(404).json({ message: `User with ID ${userId} not found` }); }
// });

app.use(express.static(__dirname));

//Starting up the server
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
            role: 'User'
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

});
