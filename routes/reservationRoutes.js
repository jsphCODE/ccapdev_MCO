const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");

// HELPERS

// Generate PNR
function generatePNR() {
    const length = 6;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return result;
  }
  
  // Generate Boarding Pass
  function generateBoardPass() {
    const length = 13;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return result;
  }
  

// Generate Seat Map
function generateSeatMap(flight, reservedSeats = []) {
    const capacity = flight.capacity || 90;
    const LETTERS = ["A", "B", "C", "D", "E", "F"];
    const seatsPerRow = LETTERS.length;
    const rows = Math.ceil(capacity / seatsPerRow);

    const seatRows = [];
    let seatCount = 0;

    for (let r = 1; r <= rows; r++) {
        const aisle1 = [];
        const aisle2 = [];

        for (let i = 0; i < LETTERS.length; i++) {
            seatCount++;
            if (seatCount > capacity) break;

            const seatId = `${r}${LETTERS[i]}`;
            const isReserved = reservedSeats.includes(seatId);
            const seat = { id: seatId, isReserved };

            if (i < 3) aisle1.push(seat);
            else aisle2.push(seat);
        }

        seatRows.push({ aisle1, aisle2 });
    }

    return seatRows;
}

// CREATE

// Redirect shortcut
router.get("/reservations/create", (req, res) => {
    res.redirect("/flights/Flights");
});

// Load Reservation Form
router.get("/reservations/create/:flightId", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const flight = await Flight.findById(req.params.flightId).lean();
    if (!flight) return res.status(404).send("Flight not found");

    const reservedSeats = await Reservation.find({
        flight: flight._id,
        status: "succeed"
    }).distinct("seat");

    const booked = reservedSeats.length;

    if (booked >= flight.capacity) {
        return res.send("This flight is FULL.");
    }

    const seatRows = generateSeatMap(flight, reservedSeats);
    const remaining = flight.capacity - booked;

    res.render("partials/reservations/Reservation_Form", {
        flight,
        seatRows,
        remaining,
        loggedUser: req.session.user
    });
});

// Create Reservation
router.post("/reservations/create", async (req, res) => {
    if (!req.session.user) {
        return res.render("error", {
            Title: "User Not Found",
            errorCode: 404,
            errorMsg: "Please login or register before booking.",
            errorLink: "/",
            errorBtnTxt: "Back to Home"
        });
    }

    // Seat already taken?
    const taken = await Reservation.findOne({
        flight: req.body.flight,
        seat: req.body.seat,
        status: "succeed"
    });

    if (taken) return res.send("Seat already taken.");

    // Capacity check
    const flight = await Flight.findById(req.body.flight);
    const count = await Reservation.countDocuments({
        flight: req.body.flight,
        status: "succeed"
    });

    if (count >= flight.capacity) {
        return res.send("Flight is FULL.");
    }

    // Create reservation
    const newReservation = await Reservation.create({
        reserveUser: req.session.user.username,
        reserveEmail: req.session.user.email,
        passportNo: req.body.passportNo,
        flight: req.body.flight,
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage,
        status: "succeed",
        pnr: generatePNR()
    });

    res.redirect(`/reservations/${newReservation._id}/summary`);
});

// LIST

router.get("/reservations/my-bookings", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const isAdmin = req.session.user.isAdmin;

    const query = isAdmin ? {} : { reserveUser: req.session.user.username };

    const reservations = await Reservation.find(query)
        .populate("flight")
        .lean();

    res.render("partials/reservations/Reservation_List", {
        reservations,
        isAdmin
    });
});

// EDIT

router.get("/reservations/:id/edit", async (req, res) => {

    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");

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

// Update
router.post("/reservations/:id/edit", async (req, res) => {

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) return res.status(404).send("Reservation not found");

    // Seat change check
    if (reservation.seat !== req.body.seat) {

        const clash = await Reservation.findOne({
            flight: reservation.flight,
            seat: req.body.seat,
            status: "succeed"
        });

        if (clash) return res.send("Seat already booked.");
    }

    await Reservation.findByIdAndUpdate(req.params.id, {
        seat: req.body.seat,
        meal: req.body.meal,
        baggage: req.body.baggage
    });

    res.redirect("/reservations/my-bookings");
});

// DELETE & CANCEL

router.post("/reservations/:id/delete", async (req, res) => {
    await Reservation.findByIdAndDelete(req.params.id);
    res.redirect("/reservations/my-bookings");
});

router.post("/reservations/:id/cancel", async (req, res) => {
    await Reservation.findByIdAndUpdate(req.params.id, { status: "canceled" });
    res.redirect("/reservations/my-bookings");
});

// CHECK-IN

router.get('/reservations/:id/checkin', async (req, res) => {
    res.render('partials/reservations/Reservation_CheckIn_Form', {
        Title: "Check-In",
        id: req.params.id
    });
});

router.post('/reservations/:id/checkin', async (req, res) => {

    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");

    const boardPassNum = generateBoardPass();

    await Reservation.findByIdAndUpdate(req.params.id, {
        status: 'checked-in',
        boardingPass: boardPassNum
    });

    res.render("partials/reservations/Reservation_CheckIn_Confirm", {
        flightNumber: reservation.flight.flightNumber,
        pnr: reservation.pnr,
        boardPassNum
    });
});

// SUMMARY

router.get("/reservations/:id/summary", async (req, res) => {

    const reservation = await Reservation.findById(req.params.id)
        .populate("flight")
        .lean();

    if (!reservation) return res.status(404).send("Reservation not found");

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
