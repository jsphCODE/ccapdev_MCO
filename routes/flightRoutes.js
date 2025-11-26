const express = require("express");
const router = express.Router();
const Flight = require("../models/Flight");

// Search flight page + results
router.get("/search-flight", async (req, res) => {
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

        res.render("partials/flights/search-flight", {
            Title: "Flight Search",
            flights,
            search: { origin, destination, departureDate }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error searching flights");
    }
});

// Admin flight list
router.get("/manage-flights", async (req, res) => {
    const flights = await Flight.find().lean();
    res.render("partials/flights/flight-list", {
        Title: "Manage Flights",
        flights
    });
});

// Add flight form
router.get("/manage-flights/add", (req, res) => {
    const destinations = {
        NAIA: ["Tokyo", "Singapore", "Hong Kong"],
        Clark: ["Manila", "Seoul", "Bangkok"],
        Cebu: ["Manila", "New Zealand", "Beijing"],
        Davao: ["Manila", "Taipei", "Seoul"]
    };

    const aircraftByOrigin = {
        NAIA: ["Airbus A320", "Boeing 737"],
        Clark: ["ATR 72", "Airbus A320"],
        Cebu: ["Lockheed F-22", "Airbus A321"],
        Davao: ["Airbus A320", "Batwing"]
    };

    res.render("partials/flights/add-flight", {
        Title: "Add a Flight",
        origins: Object.keys(destinations),
        destinations,
        aircraftByOrigin
    });
});

// Add flight POST
router.post("/manage-flights/add", async (req, res) => {
    const newFlight = new Flight(req.body);
    await newFlight.save();

    res.render("partials/flights/confirmation", {
        Title: "Confirmation of Added Flight",
        confirmMsg: "added",
        formData: req.body
    });
});

// Edit flight form
router.get("/manage-flights/edit/:flightNumber", async (req, res) => {
    const findFlight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean();

    if (!findFlight) {
        return res.render("error", {
            Title: "Flight Not Found",
            errorCode: 404,
            errorMsg: "Flight not found.",
            errorLink: "/manage-flights",
            errorBtnTxt: "Back to Flight List"
        });
    }

    const destinations = {
        NAIA: ["Tokyo", "Singapore", "Hong Kong"],
        Clark: ["Manila", "Seoul", "Bangkok"],
        Cebu: ["Manila", "New Zealand", "Beijing"],
        Davao: ["Manila", "Taipei", "Seoul"]
    };

    const aircraftByOrigin = {
        NAIA: ["Airbus A320", "Boeing 737"],
        Clark: ["ATR 72", "Airbus A320"],
        Cebu: ["Lockheed F-22", "Airbus A321"],
        Davao: ["Airbus A320", "Batwing"]
    };

    res.render("partials/flights/edit-flight", {
        Title: "Edit Flight",
        findFlight,
        origins: Object.keys(destinations),
        destinations,
        aircraftByOrigin
    });
});

// Edit flight POST
router.post("/manage-flights/edit/:flightNumber", async (req, res) => {
    const updatedFlight = await Flight.findOneAndUpdate(
        { flightNumber: req.params.flightNumber },
        req.body
    );

    if (!updatedFlight) {
        return res.render("error", {
            Title: "Flight Not Found",
            errorCode: 404,
            errorMsg: "Flight not found.",
            errorLink: "/manage-flights",
            errorBtnTxt: "Back to Flight List"
        });
    }

    res.render("partials/flights/confirmation", {
        Title: "Flight Edit Confirmation",
        confirmMsg: "updated",
        formData: req.body
    });
});

// Delete flight
router.get("/manage-flights/delete-:flightNumber", async (req, res) => {
    const deletedFlight = await Flight.findOneAndDelete({
        flightNumber: req.params.flightNumber
    });

    if (!deletedFlight) {
        return res.render("error", {
            Title: "Flight Not Found",
            errorCode: 404,
            errorMsg: "Flight not found.",
            errorLink: "/manage-flights",
            errorBtnTxt: "Back to Flight List"
        });
    }

    res.render("partials/flights/confirmation", {
        Title: "Flight Deletion Confirmation",
        confirmMsg: "deleted",
        flightNo: req.params.flightNumber
    });
});

module.exports = router;
