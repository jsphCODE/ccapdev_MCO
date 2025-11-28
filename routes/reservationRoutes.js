const express = require("express");
const router = express.Router();

const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");


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

//booking a flight
router.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});

//make a reservation
router.get("/reservations/create/:flightId", async (req, res) => {
    if (!req.session.user)
        return res.redirect("/login");

    const flight = await Flight.findById(req.params.flightId).lean();
    if (!flight) return res.status(404).send("Flight not found");

    const reservedSeats = await Reservation.find({
        flight: flight._id,
        status: "succeed"
    }).distinct("seat");

    const seatRows = generateSeatMap(flight, reservedSeats);

    res.render("partials/reservations/Reservation_Form", {
        flight,
        seatRows,
        loggedUser: req.session.user
    });
});

//show created reservation
router.post("/reservations/create", async (req, res) => {
    if (!req.session.user)
        return res.redirect("/login");

    const newReservation = await Reservation.create({
        reserveUser: req.session.user.username,
        reserveEmail: req.session.user.email,
        passportNo: req.body.passportNo,

        flight: req.body.flight,
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage,

        status: "succeed"   
    });

    res.redirect(`/reservations/${newReservation._id}/summary`);
});

//view bookings
router.get("/reservations/my-bookings", async (req, res) => {
    if (!req.session.user)
        return res.redirect("/login");

    const reservations = await Reservation.find({
        reserveUser: req.session.user.username
    })
        .populate("flight")
        .lean();

    res.render("partials/reservations/Reservation_List", { reservations });
});

//edit reservation
router.get("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");

    if (reservation.reserveUser !== req.session.user?.username)
        return res.status(403).send("Unauthorized access");

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

//show edited reservation
router.post("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).send("Reservation not found");

    if (reservation.reserveUser !== req.session.user?.username)
        return res.status(403).send("Unauthorized");

    await Reservation.findByIdAndUpdate(req.params.id, {
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage
    });

    res.redirect("/reservations/my-bookings");
});

//cancel reservation
router.post("/reservations/:id/cancel", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).send("Reservation not found");

    if (reservation.reserveUser !== req.session.user?.username)
        return res.status(403).send("Unauthorized");

    await Reservation.findByIdAndUpdate(req.params.id, {
        status: "canceled"   
    });

    res.redirect("/reservations/my-bookings");
});

//summary
router.get("/reservations/:id/summary", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");

    if (reservation.reserveUser !== req.session.user?.username)
        return res.status(403).send("Unauthorized");

    // FEES
    let baseFare = 5000;
    let baggageFee = 0;
    let mealFee = 0;

    if (reservation.baggage === "small") baggageFee = 500;
    if (reservation.baggage === "medium") baggageFee = 1000;
    if (reservation.baggage === "large") baggageFee = 1500;

    if (reservation.meal !== "standard") mealFee = 300;

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
