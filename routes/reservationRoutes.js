const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");

// Generate seat map based on flight capacity
function generateSeatMap(flight, reservedSeats = []) {
    const capacity = flight.capacity || 90; // default to 90
    const LETTERS = ["A", "B", "C", "D", "E", "F"];
    const seatsPerRow = LETTERS.length;
    const ROWS = Math.ceil(capacity / seatsPerRow);

    const seatRows = [];

    let seatCount = 0;
    for (let r = 1; r <= ROWS; r++) {
        const aisle1 = [];
        const aisle2 = [];

        for (let i = 0; i < LETTERS.length; i++) {
            seatCount++;
            if (seatCount > capacity) break; // stop if max capacity reached

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

// BOOKING FLIGHT 
router.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});

// LOAD RESERVATION FORM 
router.get("/reservations/create/:flightId", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const flight = await Flight.findById(req.params.flightId).lean();
    if (!flight) return res.status(404).send("Flight not found");

    const reservedSeats = await Reservation.find({
        flight: flight._id,
        status: "succeed"
    }).distinct("seat");

    const bookedCount = reservedSeats.length;
    if (bookedCount >= flight.capacity) {
        return res.send("This flight is FULL.");
    }

    const seatRows = generateSeatMap(flight, reservedSeats);
    const remainingSeats = flight.capacity - bookedCount;

    res.render("partials/reservations/Reservation_Form", {
        flight,
        seatRows,
        remainingSeats,
        loggedUser: req.session.user
    });
});

// CREATE RESERVATION 
router.post("/reservations/create", async (req, res) => {
    if (!req.session.user) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "You are creating a reservation for no user. Please register or login!",
            errorLink: "/",
            errorBtnTxt: "Back to Home Page"
        });
    } 

    // Check if seat is already taken
    const seatTaken = await Reservation.findOne({
        flight: req.body.flight,
        seat: req.body.seat,
        status: "succeed"
    });

    if (seatTaken) return res.send("Seat already taken.");

    // Check flight capacity
    const flight = await Flight.findById(req.body.flight);
    const bookedCount = await Reservation.countDocuments({
        flight: req.body.flight,
        status: "succeed"
    });

    if (bookedCount >= flight.capacity) {
        return res.send("Flight is FULL.");
    }

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

// VIEW BOOKINGS
router.get("/reservations/my-bookings", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    let isAdmin = req.session.user.isAdmin;

    //If the current user is an Admin, show ALL reservations
    if (isAdmin) {
        const reservations = await Reservation.find({}).populate("flight").lean();
        res.render("partials/reservations/Reservation_List", { reservations, isAdmin: true });
    }
    //Otherwise, show reservations of current user ONLY
    else {
        const reservations = await Reservation.find({
            reserveUser: req.session.user.username
            }).populate("flight").lean();
            res.render("partials/reservations/Reservation_List", { reservations, isAdmin: false});
    }
});

// EDIT RESERVATION
router.get("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");
    // if (reservation.reserveUser !== req.session.user?.username)
    //     return res.status(403).send("Unauthorized access");

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

// UPDATE RESERVATION
router.post("/reservations/:id/edit", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).send("Reservation not found");
    // if (reservation.reserveUser !== req.session.user?.username)
    //     return res.status(403).send("Unauthorized");

    // Check for seat change conflict
    if (reservation.seat !== req.body.seat) {
        const seatConflict = await Reservation.findOne({
            flight: reservation.flight,
            seat: req.body.seat,
            status: "succeed"
        });

        if (seatConflict) return res.send("Seat already booked.");
    }

    await Reservation.findByIdAndUpdate(req.params.id, {
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage
    });

    res.redirect("/reservations/my-bookings");
});

//DELETE RESEVATION (admins only)
router.post('/reservations/:id/delete', async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).send("Reservation not found");
    // if (reservation.reserveUser !== req.session.user?.username)
    //     return res.status(403).send("Unauthorized");

    await Reservation.findByIdAndDelete(req.params.id);
    res.redirect("/reservations/my-bookings");
});

// CANCEL RESERVATION
router.post("/reservations/:id/cancel", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).send("Reservation not found");
    // if (reservation.reserveUser !== req.session.user?.username)
    //     return res.status(403).send("Unauthorized");

    await Reservation.findByIdAndUpdate(req.params.id, { status: "canceled" });
    res.redirect("/reservations/my-bookings");
});

// RESERVATION SUMMARY
router.get("/reservations/:id/summary", async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");
    // if (reservation.reserveUser !== req.session.user?.username)
    //     return res.status(403).send("Unauthorized");

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