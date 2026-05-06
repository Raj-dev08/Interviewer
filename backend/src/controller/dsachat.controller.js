import dsaChat from "../model/dsachat.model.js";
import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import dsa from "../model/dsa.model.js";

export const startDsa = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params

        if (!interviewId || !questionId ){
            return res.status(400).json({ message: "Interview id and question id are required"})
        }


        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        
        const redisTimeLock = `interview-started-for:${interviewId}`

        const timeLockForInterview = await redis.get(redisTimeLock)

        if (!timeLockForInterview){

            if (interview.status !== "started"){
                return res.status(400).json({ message: "Interview is not started or is finished" });
            }
            else{
                await interviewId.add("finishInterview",{
                    interviewId,
                    userId: user._id,
                })
                return res.status(400).json({ message: "Interview has not started yet"})
            }
        }

        if (interview.status !== "started"){
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to message this interview"})
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

        await interviewQueue.add("startAiListeningForDSA",{
            interviewId,
            questionId,
            userId: user._id
        })

        return res.status(200).json({ message: "DSA started successfully"})
    } catch (error) {
        next(error)
    }
}

export const sendMessage = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params
        const { message } = req.body

        if (!interviewId || !questionId || !message ){
            return res.status(400).json({ message: "Interview id, question id and message are required"})
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        
        const redisTimeLock = `interview-started-for:${interviewId}`

        const timeLockForInterview = await redis.get(redisTimeLock)

        if (!timeLockForInterview){

            if (interview.status !== "started"){
                return res.status(400).json({ message: "Interview is not started or is finished" });
            }
            else{
                await interviewId.add("finishInterview",{
                    interviewId,
                    userId: user._id,
                })
                return res.status(400).json({ message: "Interview has not started yet"})
            }
        }

        if (interview.status !== "started"){
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to message this interview"})
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
        if (!await redis.exists(redisKeyBucket)){
            await interviewQueue.add("startAiListeningForDSA",{
                interviewId,
                questionId,
                userId: user._id
            })
        } else {
            await interviewQueue.add("newDSAMessage",{
                interviewId,
                questionId,
                userId: user._id,
                messageId: newMessage._id
            })
        }

        return res.status(200).json({ message: "Message sent successfully", message: newMessage})
    } catch (error) {
        next(error)
    }
}

export const getMessages = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params
        const { before } = req.query
        const limit = parseInt(req.query.limit) || 100

        


        if (!interviewId || !questionId ){
            return res.status(400).json({ message: "Interview id, question id and message are required"})
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

        if (!timeLockForInterview){

            if (interview.status !== "started"){
                return res.status(400).json({ message: "Interview is not started or is finished" });
            }
            else{
                await interviewId.add("finishInterview",{
                    interviewId,
                    userId: user._id,
                })
                return res.status(400).json({ message: "Interview has not started yet"})
            }
        }

        if (interview.status !== "started"){
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to message this interview"})
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

        const redisCacheKey = `message-for-dsa:${interviewId}-${questionId}-${user._id}-bucket-${before}-${limit}`
        
        const messageCache = await redis.get(redisCacheKey)

        if (messageCache){
            const payload = JSON.parse(messageCache)
            return res.status(200).json({ messages: payload.messages, hasMore: payload.hasMore})
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

        const payload = {
            messages: messages.map( m => m.toObject()),
            hasMore
        }

        await redis.set(redisCacheKey,JSON.stringify(payload),"EX",60 * 60)


        return res.status(200).json({ messages, hasMore })
    } catch (error) {
        next(error)
    }
}