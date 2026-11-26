
import mongoose from "mongoose";

const userJobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },

    status: {
        type: String,
        enum: [
            "saved",
            "reviewing",
            "applied",
            "interviewing",
            "rejected",
            "offer",
            "archived"
        ],
        default: "saved"
    },

    notes: {
        type: String,
        default: null
    },

    appliedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// A user can only have one relationship record per job.
userJobSchema.index(
    { userId: 1, jobId: 1 },
    { unique: true }
);

userJobSchema.index({ userId: 1, status: 1 });

const UserJob = mongoose.model("UserJob", userJobSchema);

export default UserJob;
