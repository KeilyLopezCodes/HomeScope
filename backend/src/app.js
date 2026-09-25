const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({ message: "Hola Mundo desde HomeScope"});
});

app.listen(PORT, () => {
    console.log(`HomeScope API corriendo en http://localhost:${PORT}`);
});