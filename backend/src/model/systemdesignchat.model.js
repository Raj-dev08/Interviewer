import mongoose from "mongoose";

const SystemdesignChatSchema = new mongoose.Schema(
    {
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true,
        },
        sentBy:{
            type: String,
            enum: ["user","ai"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },{
        timestamps: true,
    }
)

SystemdesignChatSchema.index({ createdAt: -1 });


const SystemdesignChat = mongoose.model("SystemdesignChat", SystemdesignChatSchema);

export default SystemdesignChat;