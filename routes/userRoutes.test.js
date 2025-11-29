const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
require("../setup");
const User = require("../../models/User");
const bcrypt = require('bcrypt');

describe("User Routes", () => {

    test("GET render user registration page", async () => {
        const res = await request(app).get("/register");
        expect(res.statusCode).toBe(200);
    });
    
    test("POST /register creates a user", async () => {
        let formData = {firstName: 'Testing', middleName: 'The', lastName: 'Test',
                        email: 'test@mail.com', username: 'testingTHEtest',
                        password: 'Testing!@#123'}

        const res = await request(app).post("/register").send(formData);
        expect(res.statusCode).toBe(200);

        const session = mongoose.connection.startSession();
        expect(session).toBeDefined();

        const user = new User(formData);
        expect(user).not.toBeNull();

        await session.endSession(); // End the session after testing
    });

    test("GET render user login page", async () => {
        const res = await request(app).get("/login");
        expect(res.statusCode).toBe(200);
    });

    test("POST /login logs in a user", async () => {
        // prepare test user
        const test = await User.create({ username: "test2", email: "test2@mail.com", password: "1234" });

        const userCheck = await User.findOne({ username: test.username }).lean();

        //User not found
        if (!userCheck) {
            expect(userCheck).toBeNull();
            expect(res.statusCode).toBe(404);
            next()
        }
        
        //Email is incorrect
        if (userCheck.email !== test.email) {
            expect(res.statusCode).toBe(404);
            next()
        }
        
        let passwordCheck = bcrypt.compare(test.password, userCheck.password);
        
        //Password does not match
        if (!passwordCheck) {
            expect(res.statusCode).toBe(404);
            next()
        }
        
        const session = mongoose.connection.startSession();
        expect(session).toBeDefined();
        
        const res = await request(app).post("/login").send({ username: "test2", email: "test2@mail.com", password: "1234" });
        expect(res.statusCode).toBe(200);

        await session.endSession(); // End the session after testing
    });

});
