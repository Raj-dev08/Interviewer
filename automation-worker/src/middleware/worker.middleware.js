import mongoose from "mongoose";

export const internalAuth = (req, res, next) => {
    const apiKey = req.headers["x-worker-api-key"];
    const userId = req.headers["x-user-id"];

    if (!process.env.WORKER_API_KEY ||
        apiKey !== process.env.WORKER_API_KEY) {
        return res.status(401).json({
            success: false,
            message: "Invalid worker API key"
        });
    }

    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid or missing user ID"
        });
    }

    req.authenticatedUserId = new mongoose.Types.ObjectId(userId);

    next();
};