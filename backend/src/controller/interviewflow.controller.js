import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import { LANGUAGE_MAP, INJECTION_MARKER } from "./dsa.controller.js";
import Submission from "../model/submission.model.js";
import dsa from "../model/dsa.model.js";



export const startInterview = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "Id is required"})
        }

        const redisLock = `interview-started-for:${id}`

        const interview = await Interview.findById(id)

        if (!interview){
            return res.status(404).json({ message: "Interview not found"})
        }

        if (interview.status !== "scheduled"){
            return res.status(400).json({ message: "Interview is not scheduled"})
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to start this interview"})
        }

        const locked = await redis.set(
            redisLock,
            Date.now(),
            "EX",
            interview.duration * 60,
            "NX"
        );

        if(!locked){
            const ttl = await redis.ttl(redisLock)
            return res.status(400).json({
                message: `Interview already started. Remaining time ${Math.floor(ttl/60)} mins`
            })
        }
        try {
            await Interview.findByIdAndUpdate(id, { status: "started" })
        } catch (error) {
            await redis.del(redisLock)
            throw error
        }
        

        return res.status(200).json({ message: "Interview started successfully"})   
    } catch (error) {
        next(error)
    }
}

export const getRemainingTime = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "Id is required"})
        }

        const redisLodk = `interview-started-for:${id}`

        const ttl = await redis.ttl(redisLodk)

        if (ttl <= 0){

            const interview = await Interview.findById(id)

            if (!interview){
                return res.status(404).json({ message: "Interview not found"})
            }
            
            if (interview.userId.toString() !== user._id.toString()){
                return res.status(403).json({ message: "You are not authorized to check remaining time for this interview"})
            }

            if (interview.status !== "started"){
                return res.status(400).json({ message: "Interview is not started"})
            }

            await Interview.findByIdAndUpdate(id, { status: "completed" })

            //queue for the 
            
            await interviewQueue.add("rateInterview",{
                userId: interview.userId,
                interviewId: interview._id
            })


            return res.status(200).json({ message: "Interview completed successfully. Your results will be sent to your email"})
        }
    } catch (error) {
        next(error)
    }
}

export const getInterviewByIdAfterStart = async (req, res, next) => { // after the start
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { id } = req.params

        if (!id){
            return res.status(400).json({ message: "id is required"})
        }

        const redisLock = `interview-started-for:${id}`

        const locked = await redis.get(redisLock)

        if (!locked){
            return res.status(400).json({ message: "Please start the interview first"})
        }
            

        const redisKey = `ongoingInterview:${id}`

        const cached = await redis.get(redisKey)

        if (cached){
            return res.status(200).json({ interview: JSON.parse(cached)})
        }

       const interview = await Interview.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    userId: new mongoose.Types.ObjectId(user._id),
                    status: "started"
                }
            },

            {
                $lookup: {
                    from: "dsas",//mongo stores as lowercase plural so this is the collection name
                    localField: "questions.dsa",
                    foreignField: "_id",
                    as: "questions.dsa"
                }
            },
            {
                $addFields: {
                "questions.dsa": {
                    $map: {
                        input: "$questions.dsa",
                        as: "q",
                        in: {
                            _id: "$$q._id",
                            title: "$$q.title",
                            description: "$$q.description",
                            difficulty: "$$q.difficulty",
                            duration: "$$q.duration",
                            topics: "$$q.topics",
                            example: "$$q.example",
                            constraints: "$$q.constraints",
                            followUp: "$$q.followUp",
                            hints: "$$q.hints",
                            availableLanguages: "$$q.availableLanguages",
                            codeInAllLangs: {
                                $map: {
                                    input: "$$q.codeInAllLangs",
                                    as: "c",
                                    in: {
                                        lang: "$$c.lang",
                                        starterCode: "$$c.starterCode"
                                    }
                                }
                            },
                            maxMemory: "$$q.maxMemory",
                            maxTime: "$$q.maxTime",
                            testCases: {
                                $filter: {
                                    input: "$$q.testCases",
                                    as: "tc",
                                    cond: { $eq: ["$$tc.isHidden", false] }
                                }
                            }
                        }
                    }
                },

                }
            }
            ]);

        if (!interview){
            return res.status(404).json({ message: "Interview not found or not started or completed"})
        }

        await redis.set(redisKey, JSON.stringify(interview.toObject()), "EX", 60 * 60)

        return res.status(200).json({ interview })
    } catch (error) {
        next(error)
    }
}

