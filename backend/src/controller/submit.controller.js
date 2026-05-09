import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import { LANGUAGE_MAP, INJECTION_MARKER } from "./dsa.controller.js";
import Submission from "../model/submission.model.js";
import dsa from "../model/dsa.model.js";
import SystemDesign from "../model/systemdesign.model.js";
import SystemdesignChat from "../model/systemdesignchat.model.js";
import CaseChat from "../model/casechat.model.js";
import caseStudy from "../model/case.model.js";

const createSubmission = async ({
    interviewId,
    userId,
    questionId,
    questionType,
    difficulty,
    language,
    isCorrect,
    percentageBeaten,
    totalPoint
}) => {
    const prevAttempt = await Submission.findOne({
        interviewId,
        userId,
        questionId,
        questionType,
        difficulty,
        language
    }).sort({ attemptNumber: -1 });

    return Submission.create({
        interviewId,
        userId,
        questionId,
        questionType,
        difficulty,
        isCorrect,
        attemptNumber: prevAttempt ? prevAttempt.attemptNumber + 1 : 1,
        language,
        percentageBeaten,
        totalPoint
    });
};

const calculatePercentage = async ({
    questionId,
    questionType,
    difficulty,
    language,
    totalPoint
}) => {
    let percentageBeaten = 0

    const result = await Submission.aggregate([
        {
            $match: {
                questionId,
                questionType,
                difficulty,
                language,
                isCorrect: true
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                worseThan: {
                    $sum: {
                        $cond: [{ $gt: ["$totalPoint", totalPoint] }, 1, 0]
                    }
                }
            }
        }
    ]);

    const total = result[0]?.total || 0;
    const worseThan = result[0]?.worseThan || 0;


    if (total === 0 || total - worseThan === 0) {
        percentageBeaten = 100;
    } else {
        percentageBeaten = ((total - worseThan) / total) * 100;
    }
    return percentageBeaten;
}


export const runDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled." });
        }

        const { interviewId, questionId } = req.params;
        const { language, code } = req.body;

        if (!interviewId || !questionId || !language || !code) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        if (code.length > 10000) {
            return res.status(400).json({ message: "Code too large" });
        }

        if (!LANGUAGE_MAP[language] || !INJECTION_MARKER[language]) {
            return res.status(400).json({ message: `Language ${language} is not supported.` });
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

        const dsaQuestion = await dsa.findById(questionId);
        if (!dsaQuestion) {
            return res.status(404).json({ message: "DSA question not found" });
        }

        if (!dsaQuestion.availableLanguages.includes(language)) {
            return res.status(400).json({ message: `${language} is not available for this question.` });
        }

        const redisLockKey = `dsa-run-lock:${user._id}-${interviewId}-${questionId}`
        const locked = await redis.set(redisLockKey,"1","EX",5,"NX")

        if(!locked){
            return res.status(400).json({ message: "running code too fast"})
        }

        await interviewQueue.add("decideNextDecision",{
            interviewId,
            userId: user._id,
            questionId
        })

        const selectedCodeLang = dsaQuestion.codeInAllLangs.find(c => c.lang === language);
        const marker = INJECTION_MARKER[language];
        const finalCode = selectedCodeLang.solutionCode.replace(marker, code);

        const safeParse = (v) => {
            try {
                return typeof v === "string" ? JSON.parse(v) : v;
            } catch { return v; }
        };

        const visibleTestCases = dsaQuestion.testCases.filter(tc => !tc.isHidden);

        const batchedInput = JSON.stringify(
            visibleTestCases.map(tc => safeParse(tc.input))
        );

        const response = await axios.post(
            process.env.RAPID_URL,
            {
                source_code: finalCode,
                language_id: LANGUAGE_MAP[language],
                stdin: batchedInput,
                cpu_time_limit: dsaQuestion.maxTime / 1000,
                memory_limit: dsaQuestion.maxMemory * 1024
            },
            {
                headers: {
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                    "x-rapidapi-host": "judge029.p.rapidapi.com",
                    "Content-Type": "application/json"
                },
                timeout: 15000
            }
        );

        if (!response?.data) {
            return res.status(500).json({ message: "Judge API failed" });
        }

        if (response.data.status.id !== 3) {
            return res.status(200).json({
                passed: false,
                status: response.data.status,
                stderr: response.data.stderr,
                compile_output: response.data.compile_output,
            });
        }

        const actualOutputs = (response.data.stdout || "")
            .split("\n")
            .map(o => o.trim())
            .filter(Boolean);

        if (dsaQuestion.validationType === "custom") {
            const validationInput = {
                testCases: visibleTestCases.map((tc, i) => ({
                    input: safeParse(tc.input),
                    expected: safeParse(tc.output),
                    actual: actualOutputs[i]
                }))
            };

            const validatorRes = await axios.post(
                process.env.RAPID_URL,
                {
                    source_code: dsaQuestion.validationCode.code,
                    language_id: LANGUAGE_MAP[dsaQuestion.validationCode.language],
                    stdin: JSON.stringify(validationInput),
                    cpu_time_limit: dsaQuestion.maxTime / 1000,
                    memory_limit: dsaQuestion.maxMemory * 1024
                },
                {
                    headers: {
                        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                        "x-rapidapi-host": "judge029.p.rapidapi.com",
                        "Content-Type": "application/json"
                    },
                    timeout: 15000
                }
            );

            if (!validatorRes?.data || validatorRes.data.status.id !== 3) {
                return res.status(500).json({ message: "Custom validator failed to execute" });
            }

            const parsed = JSON.parse(validatorRes.data.stdout || "{}");

            return res.status(200).json({
                passed: parsed.allPassed === true,
                results: parsed.results ?? [], //the prints
                validationType: "custom"
            });
        }

        const clean = (s) => (s || "").replace(/\s+/g, "");

        const results = visibleTestCases.map((tc, i) => ({
            input: tc.input,
            expected: tc.output,
            actual: actualOutputs[i] ?? null,
            passed: clean(actualOutputs[i]) === clean(tc.output)
        }));

        return res.status(200).json({
            passed: results.every(r => r.passed),
            results,
            validationType: "exact"
        });

    } catch (error) {
        next(error);
    }
}

export const submitDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params;
        const { language, code } = req.body;

        if (!interviewId || !questionId || !language || !code) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        if (code.length > 10000) {
            return res.status(400).json({ message: "Code too large" });
        }
        if (!LANGUAGE_MAP[language] || !INJECTION_MARKER[language]) {
            return res.status(400).json({ message: `Language ${language} is not supported.` });
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

        const dsaQuestion = await dsa.findById(questionId);

        if(!dsaQuestion){
            return res.status(404).json({ message: "DSA question not found" });
        }

        if (!dsaQuestion.availableLanguages.includes(language)) {
            return res.status(400).json({ message: `${language} is not available for this question.` });
        }

        const redisLockKey = `dsa-submit-lock:${user._id}-${interviewId}-${questionId}`
        const locked = await redis.set(redisLockKey,"1","EX",10,"NX")

        if(!locked){
            return res.status(400).json({ message: "submitting code too fast"})
        }

        await interviewQueue.add("decideNextDecision",{
            interviewId,
            userId: user._id,
            questionId
        })

        const selectedCodeLang = dsaQuestion.codeInAllLangs.find(c => c.lang === language);
        const marker = INJECTION_MARKER[language];
        const finalCode = selectedCodeLang.solutionCode.replace(marker, code);

        const safeParse = (v) => {
            try {
                return typeof v === "string" ? JSON.parse(v) : v;
            } catch { return v; }
        };


        const batchedInput = JSON.stringify(
            dsaQuestion.testCases.map(tc => safeParse(tc.input))
        );

        const response = await axios.post(
            process.env.RAPID_URL,
            {
                source_code: finalCode,
                language_id: LANGUAGE_MAP[language],
                stdin: batchedInput,
                cpu_time_limit: dsaQuestion.maxTime / 1000,
                memory_limit: dsaQuestion.maxMemory * 1024
            },
            {
                headers: {
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                    "x-rapidapi-host": "judge029.p.rapidapi.com",
                    "Content-Type": "application/json"
                },
                timeout: 15000
            }
        );

        if (!response?.data) {
            return res.status(500).json({ message: "Judge API failed" });
        }

        if (response.data.status.id !== 3) {
            const submission = await createSubmission({
                interviewId,
                userId: user._id,
                questionId,
                questionType: "DSA",
                difficulty: dsaQuestion.difficulty,
                language,
                isCorrect: false,
                percentageBeaten:0,
                totalPoint: 0
            })

            return res.status(200).json({
                passed: false,
                status: response.data.status,
                stderr: response.data.stderr,
                compile_output: response.data.compile_output,
                submission
            });
        }

        const actualOutputs = (response.data.stdout || "")
            .split("\n")
            .map(o => o.trim())
            .filter(Boolean);

        if (dsaQuestion.validationType === "custom") {
            const validationInput = {
                testCases: dsaQuestion.testCases.map((tc, i) => ({
                    input: safeParse(tc.input),
                    expected: safeParse(tc.output),
                    actual: actualOutputs[i]
                }))
            };

            const validatorRes = await axios.post(
                process.env.RAPID_URL,
                {
                    source_code: dsaQuestion.validationCode.code,
                    language_id: LANGUAGE_MAP[dsaQuestion.validationCode.language],
                    stdin: JSON.stringify(validationInput),
                    cpu_time_limit: dsaQuestion.maxTime / 1000,
                    memory_limit: dsaQuestion.maxMemory * 1024
                },
                {
                    headers: {
                        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                        "x-rapidapi-host": "judge029.p.rapidapi.com",
                        "Content-Type": "application/json"
                    },
                    timeout: 15000
                }
            );

            if (!validatorRes?.data ) {
                return res.status(500).json({ message: "Custom validator failed to execute" });
            }

            if (validatorRes.data.status.id !== 3){
                const submission = await createSubmission({
                    interviewId,
                    userId: user._id,
                    questionId,
                    questionType: "DSA",
                    difficulty: dsaQuestion.difficulty,
                    language,
                    isCorrect: false,
                    percentageBeaten:0,
                    totalPoint: 0
                })

                return res.status(400).json({
                    message: "Your code failed the custom validator",
                    submission
                })
            }

            const parsed = JSON.parse(validatorRes.data.stdout || "{}");

            let percentageBeaten = 0
            let totalPoint = 0
            if (parsed.allPassed === true ) {
                totalPoint = parseFloat(response.data.time) || 0 + parseFloat(response.data.memory) || 0

                percentageBeaten = await calculatePercentage({
                    questionId,
                    questionType: "DSA",
                    difficulty: dsaQuestion.difficulty,
                    language,
                    totalPoint
                })
            }

            const submission = await createSubmission({
                interviewId,
                userId: user._id,
                questionId,
                questionType: "DSA",
                difficulty: dsaQuestion.difficulty,
                language,
                isCorrect: parsed.allPassed === true,
                percentageBeaten,
                totalPoint
            })

            return res.status(200).json({
                passed: parsed.allPassed === true,
                results: parsed.results ?? [], //the prints
                validationType: "custom",
                submission
            });
        }

        const clean = (s) => (s || "").replace(/\s+/g, "");

        const results = dsaQuestion.testCases.map((tc, i) => ({
            input: tc.input,
            expected: tc.output,
            actual: actualOutputs[i] ?? null,
            passed: clean(actualOutputs[i]) === clean(tc.output)
        }));

        const isCorrect = results.every(r => r.passed);

        let percentageBeaten = 0
        let totalPoint = 0
        if (isCorrect){
            totalPoint = parseFloat(response.data.time) || 0 + parseFloat(response.data.memory) || 0

            percentageBeaten = await calculatePercentage({
                questionId,
                questionType: "DSA",
                difficulty: dsaQuestion.difficulty,
                language,
                totalPoint
            })
        }


        const submission = await createSubmission({
            interviewId,
            userId: user._id,
            questionId,
            questionType: "DSA",
            difficulty: dsaQuestion.difficulty,
            language,
            isCorrect,
            percentageBeaten,
            totalPoint
        })     

        return res.status(200).json({
            passed:isCorrect,
            results,
            validationType: "exact",
            submission
        });

    } catch (error) {
        next(error)
    }
}

export const startSysDes = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params

        if (!interviewId || !questionId){
            return res.status(400).json({ message: "Missing required fields." });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
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

        const belongsToInterview = interview.questions.systemdesign.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const sysDesignQuestion = await SystemDesign.findById(questionId);

        if (!sysDesignQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        await interviewQueue.add("startSysDesign",{
            interviewId,
            userId: user._id,
            questionId
        })

        return res.status(200).json({ message: "Sys design interview started successfully"});
    } catch (error) {
        next(error)
    }
}

export const messageSysDes = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params
        const { message } = req.body

        if (!interviewId || !questionId || !message){
            return res.status(400).json({ message: "Missing required fields." });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
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


        const belongsToInterview = interview.questions.systemdesign.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const sysDesignQuestion = await SystemDesign.findById(questionId);

        if (!sysDesignQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        const newMessage = await SystemDesignChat.create({
            interviewId,
            userId: user._id,
            questionId,
            message,
            sentBy: "user"
        })

        //queue based on redis window so u can spam message and we execute once only
        const redisLockForMessage = `messageLock-${interviewId}-${questionId}-${user._id}`
        const locked = await redis.set(redisLockForMessage,"1","EX",10,"NX")

        if (locked){//only hit it in 10 secs range so that it doesnt reply to everything at once 
            await interviewQueue.add("newMessage",{
                interviewId,
                userId: user._id,
                questionId,
            })
        }
        
        return res.status(200).json({ message: "Message sent successfully", newMessage });
    } catch (error) {
        next(error)
    }
}

export const getSysDesignMessages = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"}) 
        }

        const { interviewId, questionId } = req.params
        const before = req.query.before
        const limit = parseInt(req.query.limit) || 100;

        const beforeDate = before ? new Date(before) : null;

        if (before && isNaN(beforeDate.getTime())) {
            return res.status(400).json({ message: "Invalid before timestamp" });
        }

        if (!interviewId || !questionId ){
            return res.status(400).json({ message: "Missing required fields." });
        }


        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.status !== "started"){
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to message this interview"})
        }


        const belongsToInterview = interview.questions.systemdesign.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const sysDesignQuestion = await SystemDesign.findById(questionId);

        if (!sysDesignQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        const redisCacheKey = `message-for:${interviewId}-${questionId}-${user._id}-bucket-${before}-${limit}`

        const messageCache = await redis.get(redisCacheKey)

        if (messageCache){
            const payload = JSON.parse(messageCache)
            return res.status(200).json({ messages: payload.messages, hasMore: payload.hasMore})
        }

        const messages = await SystemDesignChat.find({
            userId: user._id,
            interviewId,
            questionId,
            createdAt: { $lt: before ? new Date(before) : new Date()}
        }).sort({ createdAt: -1}).limit(limit)

        messages.reverse()

        const hasMore = messages.length == limit;

        const messagePayloadForCache = {
            messages: messages.map(m => m.toObject()),
            hasMore
        }

        await redis.set(redisCacheKey, JSON.stringify(messagePayloadForCache), "EX", 60*60)

        return res.status(200).json({ messages, hasMore})
    } catch (error) {
        next(error)
    }
}

export const startCase = async (req, res, next) => {
    try {
        const { user } = req

        if(user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params

        if (!interviewId || !questionId){
            return res.status(400).json({ message: "Missing required fields." });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
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

        const belongsToInterview = interview.questions.case.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const caseStudyQuestion = await caseStudy.findById(questionId);

        if (!caseStudyQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        await interviewQueue.add("startCaseStudy",{
            interviewId,
            userId: user._id,
            questionId
        })

        return res.status(200).json({ message: "Sys design interview started successfully"});
    } catch (error) {
        next(error)
    }
}

export const messageCase = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }

        const { interviewId, questionId } = req.params
        const { message } = req.body

        if (!interviewId || !questionId || !message){
            return res.status(400).json({ message: "Missing required fields." });
        }

        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
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


        const belongsToInterview = interview.questions.case.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const caseQuestion = await caseStudy.findById(questionId);

        if (!caseQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        const newMessage = await CaseChat.create({
            interviewId,
            userId: user._id,
            questionId,
            message,
            sentBy: "user"
        })

        //queue based on redis window so u can spam message and we execute once only
        const redisLockForMessage = `messageLock-Case-${interviewId}-${questionId}-${user._id}`
        const locked = await redis.set(redisLockForMessage,"1","EX",10,"NX")

        if (locked){//only hit it in 10 secs range so that it doesnt reply to everything at once 
            await interviewQueue.add("newMessageCase",{
                interviewId,
                userId: user._id,
                questionId,
            })
        }
        
        return res.status(200).json({ message: "Message sent successfully", newMessage }); 
    } catch (error) {
        next(error)
    }
}

export const getCaseStudyMessages = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"}) 
        }

        const { interviewId, questionId } = req.params
        const before = req.query.before
        const limit = parseInt(req.query.limit) || 100;

        const beforeDate = before ? new Date(before) : null;

        if (before && isNaN(beforeDate.getTime())) {
            return res.status(400).json({ message: "Invalid before timestamp" });
        }

        if (!interviewId || !questionId ){
            return res.status(400).json({ message: "Missing required fields." });
        }


        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview){
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.status !== "started"){
            return res.status(400).json({ message: "Interview is not started or is finished" });
        }

        if (interview.userId.toString() !== user._id.toString()){
            return res.status(403).json({ message: "You are not authorized to message this interview"})
        }


        const belongsToInterview = interview.questions.case.some(
            q => q._id.toString() === questionId
        );

        if (!belongsToInterview){
            return res.status(404).json({ message: "Question not found in interview" });
        }

        const caseQuestion = await caseStudy.findById(questionId);

        if (!caseQuestion){
            return res.status(404).json({ message: "System Design question not found" });
        }

        const redisCacheKey = `message-for-case:${interviewId}-${questionId}-${user._id}-bucket-${before}-${limit}`

        const messageCache = await redis.get(redisCacheKey)

        if (messageCache){
            const payload = JSON.parse(messageCache)
            return res.status(200).json({ messages: payload.messages, hasMore: payload.hasMore})
        }

        const messages = await CaseChat.find({
            userId: user._id,
            interviewId,
            questionId,
            createdAt: { $lt: before ? new Date(before) : new Date()}
        }).sort({ createdAt: -1}).limit(limit)

        messages.reverse()

        const hasMore = messages.length == limit;

        const messagePayloadForCache = {
            messages: messages.map(m => m.toObject()),
            hasMore
        }

        await redis.set(redisCacheKey, JSON.stringify(messagePayloadForCache), "EX", 60*60)

        return res.status(200).json({ messages, hasMore})
    } catch (error) {
        next(error)
    }
}