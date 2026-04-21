import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http"
import cors from "cors"

import { connectDB } from "./lib/db.js";
import { protectRoute } from "./middleware/auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import dsaRoutes from "./routes/dsa.routes.js"
import sysdesRoutes from "./routes/sysdes.routes.js"
import caseRoutes from "./routes/case.routes.js"



const app = express()
const server = http.createServer(app)




dotenv.config();

const PORT = process.env.PORT;


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    exposedHeaders: ["Authorization"]
  })
);



app.use("/api/auth", authRoutes);
app.use("/api/plans", protectRoute, paymentRoutes);
app.use("/api/dsa", dsaRoutes);
app.use("/api/sysdes", protectRoute, sysdesRoutes);
app.use("/api/case", protectRoute, caseRoutes);



app.get("/api/health", (req, res) => {
  return res.status(200).json({ message: "OK" })
})

app.get("/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok" });
});

app.head("/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).end();
});


app.use(errorHandler)


server.listen(PORT, "0.0.0.0", async () => {
  console.log("server is running on PORT:" + PORT);
  await connectDB();
});