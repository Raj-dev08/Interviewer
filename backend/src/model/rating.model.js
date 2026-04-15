import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DSA",
            required: true,
        },
        type:{
            type: String,
            enum: ["DSA","SystemDesign"],
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 0,
            max: 5,
        },
    },
    {
        timestamps: true,
    }
);

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;