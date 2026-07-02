import dsaChat from "../model/dsachat.model.js";
import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import dsa from "../model/dsa.model.js";

export const startDsa = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" });
        }

        const { interviewId, questionId } = req.params;

        if (!interviewId || !questionId) {
            return res.status(400).json({ message: "Interview id and question id are required" });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        let interview;

        if (cached) {
            interview = JSON.parse(cached);
        } else {
            const result = await Interview.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(interviewId),
                        userId: new mongoose.Types.ObjectId(user._id),
                        status: "started",
                    },
                },
                {
                    $lookup: {
                        from: "dsas",
                        localField: "questions.dsa",
                        foreignField: "_id",
                        as: "questions.dsa",
                    },
                },
                {
                    $lookup: {
                        from: "systemdesigns",
                        localField: "questions.sysDes",
                        foreignField: "_id",
                        as: "questions.sysDes",
                    },
                },
                {
                    $lookup: {
                        from: "casestudies",
                        localField: "questions.case",
                        foreignField: "_id",
                        as: "questions.case",
                    },
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
                                                starterCode: "$$c.starterCode",
                                            },
                                        },
                                    },
                                    maxMemory: "$$q.maxMemory",
                                    maxTime: "$$q.maxTime",
                                    testCases: {
                                        $filter: {
                                            input: "$$q.testCases",
                                            as: "tc",
                                            cond: {
                                                $eq: ["$$tc.isHidden", false],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "questions.sysDes": {
                            $map: {
                                input: "$questions.sysDes",
                                as: "q",
                                in: {
                                    _id: "$$q._id",
                                },
                            },
                        },
                        "questions.case": {
                            $map: {
                                input: "$questions.case",
                                as: "q",
                                in: {
                                    _id: "$$q._id",
                                },
                            },
                        },
                    },
                },
            ]);

            interview = result[0];

            if (interview) {
                await redis.set(
                    redisKey,
                    JSON.stringify(interview),
                    "EX",
                    60 * 60
                );
            }
        }

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        const redisTimeLock = `interview-started-for:${interviewId}`;
        const timeLockForInterview = await redis.get(redisTimeLock);

        if (!timeLockForInterview) {
            if (interview.status !== "started") {
                return res.status(400).json({
                    message: "Interview is not started or is finished",
                });
            } else {
                await interviewQueue.add("finishInterview", {
                    interviewId,
                    userId: user._id,
                });

                return res.status(400).json({
                    message: "Interview has not started yet",
                });
            }
        }

        if (interview.status !== "started") {
            return res.status(400).json({
                message: "Interview is not started or is finished",
            });
        }

        if (interview.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to message this interview",
            });
        }

        const dsaQuestions = interview.questions.dsa;

        const allIds = dsaQuestions.map((q) => q._id.toString());

        if (!allIds.includes(questionId)) {
            return res.status(400).json({
                message: "DSA question not found in interview",
            });
        }

        const redisDSAKey = `DSA:start:${questionId}:${interviewId}:${user._id}`;

        const startLock = await redis.set(
            redisDSAKey,
            user._id,
            "EX",
            interview.duration * 60 + 300,
            "NX"
        );

        if (!startLock) {
            return res.status(400).json({
                message: "You are already in a DSA interview",
            });
        }

        const question = await dsa.findById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "DSA question not found",
            });
        }

        await interviewQueue.add("startAiListeningForDSA", {
            interviewId,
            questionId,
            userId: user._id,
        });

        return res.status(200).json({
            message: "DSA started successfully",
        });
    } catch (error) {
        next(error);
    }
};


export const sendMessage = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { interviewId, questionId } = req.params
        const { message } = req.body

        if (!interviewId || !questionId || !message) {
            return res.status(400).json({ message: "Interview id, question id and message are required" })
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }


        const redisTimeLock = `interview-started-for:${interviewId}`

        const timeLockForInterview = await redis.get(redisTimeLock)

        if (!timeLockForInterview) {

            if (interview.status !== "started") {
                return res.status(400).json({ message: "Interview is not started or is finished" });
            }
            else {
                await interviewId.add("finishInterview", {
                    interviewId,
                    userId: user._id,
                })
                return res.status(400).json({ message: "Interview has not started yet" })
            }
        }

        if (interview.status !== "started") {
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to message this interview" })
        }

        const belongsToInterview = interview.questions.dsa.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview) {
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const question = await dsa.findById(questionId);

        if (!question) {
            return res.status(404).json({ message: "DSA question not found" });
        }

        const redisKeyBucket = `dsa-data-bucket-for-${interviewId}:${user._id}:${questionId}`

        const newMessage = await dsaChat.create({
            interviewId,
            userId: user._id,
            questionId,
            sentBy: "user",
            message
        })

        //start the message if user does this we validate at the end 
        if (!await redis.exists(redisKeyBucket)) {
            await interviewQueue.add("startAiListeningForDSA", {
                interviewId,
                questionId,
                userId: user._id
            })
        } else {
            await interviewQueue.add("newDSAMessage", {
                interviewId,
                questionId,
                userId: user._id,
                messageId: newMessage._id
            })
        }

        return res.status(200).json({ message: "Message sent successfully", message: newMessage })
    } catch (error) {
        next(error)
    }
}

export const getMessages = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { interviewId, questionId } = req.params
        const { before } = req.query
        const limit = parseInt(req.query.limit) || 100




        if (!interviewId || !questionId) {
            return res.status(400).json({ message: "Interview id, question id and message are required" })
        }

        const beforeDate = before ? new Date(before) : new Date();

        if (before && isNaN(beforeDate.getTime())) {
            return res.status(400).json({ message: "Invalid before timestamp" });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }


        const redisTimeLock = `interview-started-for:${interviewId}`

        const timeLockForInterview = await redis.get(redisTimeLock)

        if (!timeLockForInterview) {

            if (interview.status !== "started") {
                return res.status(400).json({ message: "Interview is not started or is finished" });
            }
            else {
                await interviewId.add("finishInterview", {
                    interviewId,
                    userId: user._id,
                })
                return res.status(400).json({ message: "Interview has not started yet" })
            }
        }

        if (interview.status !== "started") {
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to message this interview" })
        }

        const belongsToInterview = interview.questions.dsa.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview) {
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const question = await dsa.findById(questionId);

        if (!question) {
            return res.status(404).json({ message: "DSA question not found" });
        }

        const messages = await dsaChat.find({
            interviewId,
            userId: user._id,
            questionId,
            createdAt: { $lt: beforeDate },
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        messages.reverse()


        const hasMore = messages.length === limit;

        return res.status(200).json({ messages, hasMore })
    } catch (error) {
        next(error)
    }
}

export const getStartStatusDSA = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled" })
        }

        const { interviewId, questionId } = req.params

        if (!interviewId || !questionId) {
            return res.status(400).json({ message: "Interview id and question id are required" })
        }

        const redisDSAKey = `DSA:start:${questionId}:${interviewId}:${user._id}`

        const startLock = await redis.get(redisDSAKey)

        if (!startLock) {
            return res.status(200).json({ started: false })
        }

        return res.status(200).json({ started: true });
    } catch (error) {
        next(error)
    }
}