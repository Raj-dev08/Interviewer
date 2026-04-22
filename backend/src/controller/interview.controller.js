import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";


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

        await interviewQueue.add("createInterview", {
            userId: user._id,
            type
        })

        await redis.del(`interviewsFor:${user._id}`)

        return res.status(201).json({ message: "Interview creation queued successfully." });
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
                $lookup: {
                    from: "systemdesigns",
                    localField: "questions.sysDes",
                    foreignField: "_id",
                    as: "questions.sysDes"
                }
            },
            {
                $lookup: {
                    from: "casestudies",
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
                            followUp: "$$q.followUp",
                            hints: "$$q.hints"
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
                            difficulity: "$$q.difficulity",
                            duration: "$$q.duration",
                            domain: "$$q.domain",
                            type: "$$q.type",
                            previousContext: "$$q.previousContext",
                            goal: "$$q.goal",
                            data: "$$q.data",
                            hints: "$$q.hints",
                            followUps: "$$q.followUps",
                            constraints: "$$q.constraints"
                        }
                    }
                }
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

        await redis.set(redisKey, JSON.stringify(interview.toObject()), "EX", 60 * 60)

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

        await redis.set(redisKey, JSON.stringify(interviews.toObject()), "EX", 60 * 60)

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

        return res.status(200).json({ message: "Interview cancelled successfully"})
    } catch (error) {
        next(error)
    }
}

//todo:ratings system