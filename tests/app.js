const express = require("express");
const session = require("express-session");

const flightRoutes = require("../flightRoutes");
const reservationRoutes = require("../reservationRoutes");
const userRoutes = require("../userRoutes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "testSecret",
    resave: false,
    saveUninitialized: true
}));

app.use("/flights", flightRoutes);
app.use("/", reservationRoutes);
app.use("/", userRoutes);

module.exports = app;
