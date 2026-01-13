// const express = require("express");
// const cors = require("cors");

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use("/api/products", require("./routes/productRoutes"));


// app.get("/", (req, res) => {
//   res.send("ShopSphere API running");
// });

// module.exports = app;


// const express = require("express");
// const cors = require("cors");

// const app = express();

// app.use(cors());
// app.use(express.json());

// // 🔹 ADD THIS LINE (VERY IMPORTANT)
// app.use("/api/users", require("./routes/userRoutes"));

// // 🔹 Products
// app.use("/api/products", require("./routes/productRoutes"));

// app.get("/", (req, res) => {
//   res.send("ShopSphere API running");
// });

// module.exports = app;


import express from "express";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔴 THIS LINE WAS MISSING OR WRONG
app.use("/api/users", userRoutes);

// Products
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("ShopSphere API running");
});

export default app;
