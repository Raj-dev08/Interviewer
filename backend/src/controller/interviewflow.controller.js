import Interview from "../model/interview.model.js";
import { redis } from "../lib/redis.js";
import { interviewQueue } from "../lib/interview.queue.js";
import { LANGUAGE_MAP, INJECTION_MARKER } from "./dsa.controller.js";
import Submission from "../model/submission.model.js";


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

        if (!ttl){

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

        if (!LANGUAGE_MAP[language] || !INJECTION_MARKER[language]) {
            return res.status(400).json({ message: `Language ${language} is not supported.` });
        }

        
        const redisKey = `ongoingInterview:${interviewId}`;
        const cached = await redis.get(redisKey);

        const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
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
                }
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
                    }
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

//make the submit of code along with the ai analysis of all of that 