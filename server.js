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

//Routes
//Inital page for logging in or registering
app.get('/', (req, res) => {
    res.render('Initial', {title: 'Initial Homepage'});
});

//Route for adding registered user to the DB
app.post('/users/register', async (req, res) => {
    const formData = req.body;
    const newUser = new User(formData);

    await newUser.save();

    res.render('', {formData});
});

//Other routes to add as we make the Handlebars pages



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

// Unsure if this is needed: app.use(express.static(__dirname));

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
            }
        ]);
        console.log('Admin users inserted into database.');
    }

});