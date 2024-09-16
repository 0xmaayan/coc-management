"use strict";
require("dotenv").config();
const express = require("express");
const { publish } = require("../scripts/publish.js");
const app = express();
const port = 3001;
https: app.get("/", async (req, res) => {
    res.send("Hello World!");
});
https: app.get("/publish", async (req, res) => {
    console.log("starting module publishing....");
    await publish();
    console.log("finished module publishing.");
    res.send("Published");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
module.exports = app;
//# sourceMappingURL=index.js.map