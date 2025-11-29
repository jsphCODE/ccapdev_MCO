const request = require("supertest");
const app = require("../app");
require("../setup");
const Flight = require("../../models/Flight");
const Reservation = require("../../models/Reservation");

describe("Reservation Routes", () => {

    test("Reservation form loads", async () => {
        const flight = await Flight.create({
            origin: "NAIA",
            destination: "Tokyo",
            capacity: 6,
            daysOfWeek: ["Monday"],
            flightNumber: "FL100",
            departure: "10:00",
            arrival: "12:00",
            aircraft: "TestPlane",
            price: 1000
        });

        const agent = request.agent(app);

        // mock session user login
        await agent
            .post("/login")
            .send({ username: "u", email: "u@u.com", password: "123" });

        const res = await agent.get(`/reservations/create/${flight._id}`);
        expect(res.statusCode).toBe(200);
    });

});
