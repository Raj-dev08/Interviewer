import dotenv from "dotenv";
dotenv.config();

import express from "express";

import { connectDB } from "./lib/db.js";
import { internalAuth } from "./middleware/worker.middleware.js";
import automationRoutes from "./routes/automation.routes.js";
import browserRoutes from "./routes/browser.routes.js";
import userJobRoutes from "./routes/userJob.routes.js"


const app = express();

const PORT = process.env.PORT || 8001;

app.use(express.json({ limit: "5mb" }));

// Public health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "automation-worker",
        status: "running",
        timestamp: new Date().toISOString()
    });
});


app.use("/api/automation/browser", internalAuth, browserRoutes);
app.use("/api/automation", internalAuth, automationRoutes);
app.use("/api/userjob", internalAuth, userJobRoutes)


const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`[AUTOMATION] Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("[AUTOMATION] Startup failed:", error);
        process.exit(1);
    }
};

startServer();
