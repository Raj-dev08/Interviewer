import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import mongoose from "mongoose";



export const startInterview = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: "Id is required" })
        }

        const redisLock = `interview-started-for:${id}`// the absolute lock
        const redisKeyForInterView = `User-current-interview:${user._id}`



        const interview = await Interview.findById(id)

        const interviewingForOther = await redis.set(
            redisKeyForInterView,
            id,
            "EX",
            interview.duration * 60 + 30, // 30 seconds cooldown time just in case the user close the browser
            "NX"
        );

        if (!interviewingForOther) {
            return res.status(400).json({ message: "You are already in an interview" })
        }

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" })
        }

        if (interview.status !== "scheduled") {
            return res.status(400).json({ message: "Interview is not scheduled" })
        }

        if (interview.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to start this interview" })
        }

        const locked = await redis.set(
            redisLock,
            Date.now(),
            "EX",
            interview.duration * 60,
            "NX"
        );

        if (!locked) {
            const ttl = await redis.ttl(redisLock)
            return res.status(400).json({
                message: `Interview already started. Remaining time ${Math.floor(ttl / 60)} mins`
            })
        }
        try {
            await Interview.findByIdAndUpdate(id, { status: "started" })
        } catch (error) {
            await redis.del(redisLock)
            throw error
        }


        return res.status(200).json({ message: "Interview started successfully" })
    } catch (error) {
        next(error)
    }
}

export const getRemainingTime = async (req, res, next) => { //only for checking and rating will use the other one as that is cheaper
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: "Id is required" })
        }

        const redisLodk = `interview-started-for:${id}`

        const ttl = await redis.ttl(redisLodk)

        if (ttl <= 0) {

            const interview = await Interview.findById(id)

            if (!interview) {
                return res.status(404).json({ message: "Interview not found" })
            }

            if (interview.userId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You are not authorized to check remaining time for this interview" })
            }

            if (interview.status !== "started") {
                return res.status(400).json({ message: "Interview is not started" })
            }

            await Interview.findByIdAndUpdate(id, { status: "completed" })

            //queue for the 

            await interviewQueue.add("rateInterview", {
                userId: interview.userId,
                interviewId: interview._id
            })


            return res.status(200).json({ message: "Interview completed successfully. Your results will be sent to your email" })
        }

        return res.status(200).json({ remainingTime: ttl })
    } catch (error) {
        next(error)
    }
}

export const getInterviewByIdAfterStart = async (req, res, next) => { // after the start
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: "id is required" })
        }

        const redisLock = `interview-started-for:${id}`

        const locked = await redis.get(redisLock)

        if (!locked) {
            return res.status(400).json({ message: "Please start the interview first" })
        }


        const redisKey = `ongoingInterview:${id}`

        const cached = await redis.get(redisKey)

        if (cached) {
            return res.status(200).json({ interview: JSON.parse(cached) })
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
                $lookup: {
                    from: "systemdesigns",//mongo stores as lowercase plural so this is the collection name
                    localField: "questions.sysDes",
                    foreignField: "_id",
                    as: "questions.sysDes"
                }
            },
            {
                $lookup: {
                    from: "casestudies",//mongo stores as lowercase plural so this is the collection name
                    localField: "questions.case",
                    foreignField: "_id",
                    as: "questions.case"
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

                    "questions.sysDes": {
                        $map: {
                            input: "$questions.sysDes",
                            as: "q",
                            in: {
                                _id: "$$q._id",
                                question: "$$q.question",
                                description: "$$q.description",
                                constraints: "$$q.constraints",
                                difficulty: "$$q.difficulty",
                                duration: "$$q.duration",
                                topics: "$$q.topics",
                                companyTags: "$$q.companyTags",
                                followUp: "$$q.followUp",
                                hints: "$$q.hints",
                            }
                        }
                    },

                    "questions.case": {
                        $map: {
                            input: "$questions.case",
                            as: "q",
                            in: {
                                _id: "$$q._id",
                                title: "$$q.title",
                                description: "$$q.description",
                                difficulty: "$$q.difficulty",
                                duration: "$$q.duration",
                                domain: "$$q.domain",
                                type: "$$q.type",
                                previousContext: "$$q.previousContext",
                                goal: "$$q.goal",
                                data: "$$q.data",
                                hints: "$$q.hints",
                                followUps: "$$q.followUps",
                                constraints: "$$q.constraints",
                                answerFormat: "$$q.answerFormat"
                            }
                        }
                    }
                }
            }
        ]);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found or not started or completed" })
        }

        await redis.set(redisKey, JSON.stringify(interview[0]), "EX", 60 * 60)

        return res.status(200).json({ interview: interview[0] })
    } catch (error) {
        next(error)
    }
}

//unnecessary remove it later use the previous set time to the fullest effect
//it is basically there so in future if multiple interview at a time we can but like basically 
//the interview id one is for the main thing like interview time and this is for which interview user has
//so without user interview it wont work
export const activeInterView = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const redisKeyForInterView = `User-current-interview:${user._id}`

        const interview = await redis.get(redisKeyForInterView)

        if (!interview) {
            return res.status(200).json({ message: "No active interview found" })
        }

        const ttl = await redis.ttl(redisKeyForInterView)

        return res.status(200).json({ interviewId: interview, remainingTime: Math.floor(ttl - 30) })
    } catch (error) {
        next(error)
    }
}

export const finishInterview = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { id } = req.params

        //end logic
        const interview = await Interview.findByIdAndUpdate(
            id,
            { status: "completed" },
            { new: true }
        )

        return res.status(200).json({ message: "Interview ended succesfully" })
    } catch (error) {
        next(error)
    }
}