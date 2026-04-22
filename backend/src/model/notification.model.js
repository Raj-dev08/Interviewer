import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title:{
            type: String,
            required: true,
        },
        message:{
            type: String,
            required: true,
        },
        link:{
            type: String,
        },
        read:{
            type: Boolean,
            default: false,
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },{
        timestamps: true,
    }
)

notificationSchema.index({ createdAt: -1 })

const Notification = mongoose.model("Notification",notificationSchema)

export default Notification;