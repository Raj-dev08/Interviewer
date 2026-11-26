
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    externalJobId: {
        type: String,
        default: null,
        trim: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    company: {
        type: String,
        required: true,
        trim: true
    },

    link: {
        type: String,
        default: null
    },

    emails: {
        type: [String],
        default: []
    },

    location: {
        type: String,
        default: null
    },

    employmentType: {
        type: String,
        default: null
    },

    experience: {
        type: String,
        default: null
    },

    description: {
        type: String,
        default: null
    },

    source: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

jobSchema.index({ title: "text", company: "text", description: "text" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
