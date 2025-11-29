const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require('bcrypt');

// Register page
router.get("/register", (req, res) => {
    res.render("partials/users/register", { Title: "User Registration" });
});

// Register user
router.post("/register", async (req, res) => {
    const newUser = new User(req.body);
    await newUser.save();

    //Save registered user's info into the session
    req.session.user = newUser;

    res.render("partials/users/confirmation", {
        Title: "Registration Confirmation",
        formData: req.body
    });
});

// Profile page
router.get("/profile", async (req, res) => {
    const user = await User.findOne({ username: req.session.user?.username }).lean();
    if (!user) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "User not found. Please register or login!",
            errorLink: "/",
            errorBtnTxt: "Back to Home Page"
        });
    }
    res.render("partials/users/profile", { Title: "Your Profile Page", user });
});

// Login page
router.get("/login", (req, res) => {
    res.render("partials/users/login", { Title: "User Login" });
});

// Login user
router.post("/login", async (req, res) => {
    const userCheck = await User.findOne({ username: req.body.username }).lean();

    if (!userCheck) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "User not found.",
            errorLink: "/login",
            errorBtnTxt: "Back to Login Page"
        });
    }

    if (userCheck.email !== req.body.email) {
        return res.render("error", {
            Title: "Login Failed",
            errorCode: 404,
            errorMsg: "Email is incorrect.",
            errorLink: "/login",
            errorBtnTxt: "Back to Login Page"
        });
    }

    let passwordCheck = await bcrypt.compare(req.body.password, userCheck.password);

    if (!passwordCheck) {
        return res.render("error", {
            Title: "Login Failed",
            errorCode: 404,
            errorMsg: "Password is incorrect.",
            errorLink: "/login",
            errorBtnTxt: "Back to Login Page"
        });
    }

    //Save logged-in user's info into the session
    req.session.user = userCheck;

    res.render("partials/users/confirmation", {
        Title: "Login Confirmation",
        formData: req.body
    });
});

// Edit profile
router.get("/edit-profile/:username", async (req, res) => {
    const findUser = await User.findOne({ username: req.params.username }).lean();

    if (!findUser) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "User not found.",
            errorLink: "/",
            errorBtnTxt: "Back to Homepage"
        });
    }

    res.render("partials/users/edit-profile", {
        Title: "Edit Profile",
        findUser
    });
});

// Edit POST
router.post("/edit-profile/:username", async (req, res) => {
    const updatedUser = await User.findOneAndUpdate(
        { username: req.params.username },
        req.body
    );

    if (!updatedUser) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "User not found.",
            errorLink: "/",
            errorBtnTxt: "Back to Homepage"
        });
    }

    //Updates session user
    req.session.user = updatedUser;

    res.render("partials/users/confirmation", {
        Title: "User Edit Confirmation",
        formData: req.body
    });
});

// Logout (destroys session user)
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.render("initial", { Title: "Home Page" });
    });
    
});

module.exports = router;
