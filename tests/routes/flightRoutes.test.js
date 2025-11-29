const request = require("supertest");
const app = require("../app");
require("../setup");

describe("Flight Routes", () => {

    test("GET /flights/search-flight should load page", async () => {
        const res = await request(app).get("/search-flight");
        expect(res.statusCode).toBe(200);
    });

});
