
import mongoose from "mongoose";
import UserJob from "../models/userJob.model.js";
import Job from "../models/job.model.js";

const allowedStatuses = [
    "saved",
    "reviewing",
    "applied",
    "interviewing",
    "rejected",
    "offer",
    "archived"
];


// Get current user's jobs
export const getUserJobs = async (req, res) => {
    try {
        const userId = req.authenticatedUserId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { status, page = 1, limit = 20 } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));

        const filter = { userId };

        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status"
                });
            }

            filter.status = status;
        }

        const [jobs, total] = await Promise.all([
            UserJob.find(filter)
                .populate("jobId")
                .sort({ updatedAt: -1 })
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber),

            UserJob.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: jobs,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    } catch (error) {
        console.error("Get user jobs:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get user jobs"
        });
    }
};


