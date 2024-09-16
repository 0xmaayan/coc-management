import dotenv from "dotenv";
import express from "express";
import { publish } from "./scripts/publish.js";
const app = express();
const port = 3000;
dotenv.config();
https: app.get("/", async (req, res) => {
    console.log("starting....");
    await publish();
    console.log("finished.");
    res.send("Hello World!");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=app.js.map