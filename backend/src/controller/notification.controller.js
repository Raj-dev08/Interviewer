import Notification from "../model/notification.model.js";
import { redis } from "../lib/redis.js";
import { io } from "../lib/socket.js";

export const getNotifications = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const redisKey = `notificationsFor:${user._id}`

        const cached = await redis.lrange(redisKey,0,-1)

        if ( cached && cached.length > 0){
            const notifications = cached.map(n => JSON.parse(n))
            return res.status(200).json({ notifications})
        }

        const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });

        await redis.lpush(
            redisKey,
            ...notifications.map(n => JSON.stringify(n)).reverse()
        );

        await redis.expire(redisKey, 60 * 60)

        return res.status(200).json({ notifications })
    } catch (error) {
        next(error)
    }
}

export const removeNotifications = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "Id is required"})
        }

        const notification = await Notification.findOneAndDelete({ _id: id, userId: user._id })

        if(notification){
            return res.status(200).json({ message: "Notification removed successfully"})
        }

        await redis.del(`notificationsFor:${user._id}`) // can do remove but document matching isnt reliable

        return res.status(404).json({ message: "Notification not found"})
    } catch (error) {
        next(error)
    }
}

export const readNotifications = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const ids = req.body

        if(!ids || !Array.isArray(ids) || ids.length === 0){
            return res.status(400).json({ message: "Ids are required"})
        }

        const notifications = await Notification.updateMany(
            { _id: { $in: ids }, userId: user._id },
            { $set: { read: true } }
        )

        io.to(user._id.toString()).emit("notifications_read", notifications )

        await redis.del(`notificationsFor:${user._id}`)

        return res.status(200).json({ message: "Notifications marked as read successfully"})
    } catch (error) {
        next(error)
    }
}