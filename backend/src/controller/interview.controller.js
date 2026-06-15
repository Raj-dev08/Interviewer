import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import mongoose from "mongoose";

export const createInterview = async (req, res, next) => {
    try {
        const { user } = req
        
        if(user.isDisabled){
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { type } = req.body

        if (!type || !["case","dsa-only","system_design","mixed"].includes(type)){
            return res.status(400).json({ message: "Invalid interview type." });
        }

        const randomUUID = new mongoose.Types.ObjectId()


        await interviewQueue.add("createInterview", {
            userId: user._id,
            requestId: randomUUID,
            type
        })

        await redis.del(`interviewsFor:${user._id}`)

        return res.status(201).json({ message: "Interview creation queued successfully." });
    } catch (error) {
        next(error)
    }
}

export const getInterviewById = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "Id not found"})
        }

        const redisKey = `interview:${id}`

        const cached = await redis.get(redisKey)

        if (cached){
            return res.status(200).json({ interview: JSON.parse(cached)})
        }

        const interview = await Interview.findOne({ _id: id, userId: user._id,status: "scheduled"}).select("type duration")

        if (!interview){
            return res.status(404).json({ message: "Interview not found or not scheduled"})
        }

        await redis.set(redisKey, JSON.stringify(interview), "EX", 60 * 60)

        return res.status(200).json({ interview })
    } catch (error) {
        next(error)
    }
}//after scheduled

export const getAllInterviews = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        } 

        const redisKey = `interviewsFor:${user._id}`
        const cached = await redis.get(redisKey)

        if (cached){
            return res.status(200).json({ interviews: JSON.parse(cached)})
        }


        const interviews = await Interview.find({ userId: user._id }).select("type status duration")

        await redis.set(redisKey, JSON.stringify(interviews), "EX", 60 * 60)

        return res.status(200).json({ interviews })
    } catch (error) {
        next(error)
    }
}

export const cancelInterview = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "Interview id is required"})
        }


        const updatedInterview = await Interview.findOneAndUpdate(
            { _id: id, userId: user._id, status: "scheduled" },
            { status: "cancelled" },
            { new: true }
        )

        if (!updatedInterview){
            return res.status(404).json({ message: "Interview not found or not scheduled"})
        }

        await redis.del(`interviewsFor:${user._id}`)
        await redis.del(`interview:${user._id}:${id}`)

        return res.status(200).json({ message: "Interview cancelled successfully"})
    } catch (error) {
        next(error)
    }
}

//todo:ratings system