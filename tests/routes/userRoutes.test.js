const request = require("supertest");
const app = require("../app");
require("../setup");
const User = require("../../models/User");

describe("User Routes", () => {

    test("POST /register creates a user", async () => {
        const res = await request(app)
            .post("/register")
            .send({ username: "test", email: "test@mail.com", password: "1234" });

        const user = await User.findOne({ username: "test" });
        expect(user).not.toBeNull();
    });

    test("POST /login logs in a user", async () => {
        // prepare test user
        await User.create({ username: "test2", email: "test2@mail.com", password: "1234" });

        const res = await request(app)
            .post("/login")
            .send({ username: "test2", email: "test2@mail.com", password: "1234" });

        expect(res.statusCode).toBe(200);
    });

});
