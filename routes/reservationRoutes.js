const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");

// Helper (copied)
function generateSeatMap(flight, reservedSeats = []) {
    const ROWS = 15;
    const LETTERS = ["A", "B", "C", "D", "E", "F"];
    const seatRows = [];

    for (let r = 1; r <= ROWS; r++) {
        const aisle1 = [];
        const aisle2 = [];

        LETTERS.forEach((letter, i) => {
            const seatId = `${r}${letter}`;
            const isReserved = reservedSeats.includes(seatId);

            const seatObj = { id: seatId, isReserved };

            if (i < 3) aisle1.push(seatObj);
            else aisle2.push(seatObj);
        });

        seatRows.push({ aisle1, aisle2 });
    }

    return seatRows;
}

// Redirect convenience
router.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});

// Load reservation form
router.get("/reservations/create/:flightId", async (req, res) => {
    const flight = await Flight.findById(req.params.flightId).lean();
    if (!flight) return res.status(404).send("Flight not found");

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

// Create reservation
router.post("/reservations/create", async (req, res) => {
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

// View all reservations
router.get("/reservations/my-bookings", async (req, res) => {
    const reservations = await Reservation.find().populate("flight").lean();
    res.render("partials/reservations/Reservation_List", { reservations });
});

// Edit reservation
router.get("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    const reservedSeats = await Reservation.find({
        flight: reservation.flight._id,
        status: "succeed",
        _id: { $ne: reservation._id }
    }).distinct("seat");

    const seatRows = generateSeatMap(reservation.flight, reservedSeats).map(row => {
        row.aisle1 = row.aisle1.map(s => ({ ...s, isSelected: s.id === reservation.seat }));
        row.aisle2 = row.aisle2.map(s => ({ ...s, isSelected: s.id === reservation.seat }));
        return row;
    });

    res.render("partials/reservations/Reservation_Edit", {
        reservation,
        seatRows
    });
});

// Edit POST
router.post("/reservations/:id/edit", async (req, res) => {
    await Reservation.findByIdAndUpdate(req.params.id, {
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage
    });

    res.redirect("/reservations/my-bookings");
});

// Cancel reservation
router.post("/reservations/:id/cancel", async (req, res) => {
    await Reservation.findByIdAndUpdate(req.params.id, { status: "cancelled" });
    res.redirect("/reservations/my-bookings");
});

// Summary page
router.get("/reservations/:id/summary", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

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
        reservation,
        flight: reservation.flight,
        baggageFee,
        mealFee,
        total
    });
});

module.exports = router;
