const express = require("express");
const router = express.Router();

// Initial landing page
router.get("/", (req, res) => {
    res.render("initial", { Title: "Home Page" });
});

module.exports = router;
