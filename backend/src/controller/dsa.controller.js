import dsa from "../model/dsa.model.js";
import axios from "axios";
import { redis } from "../lib/redis.js";


export const LANGUAGE_MAP = {
  python: 71,        // Python 3
  cpp: 54,           // C++ GCC 9
  c: 50,             // C GCC 9
  java: 62,
  javascript: 63,
  typescript: 74,
  go: 60,
  rust: 73,
  ruby: 72,
  kotlin: 78,
  swift: 83,
  php: 68
};

export const createDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can create DSA questions." });
        }

        const { 
            title,
            description,
            difficulty,
            duration,
            topics,
            companyTags,
            isPremium,
            example,
            testCases,
            availableLanguages,
            maxMemory,
            maxTime,
            constraints,
            followUp,
            hints,
            correctAnswer,
            validationType,
            validationCode,
            codeInAllLangs
        } = req.body

        if (!title || !description || 
            !difficulty || !duration || 
            !example || !testCases ||  
            !topics || !availableLanguages || 
            !maxMemory || !maxTime || 
            !correctAnswer || !validationType || 
            !codeInAllLangs) 
        {
            return res.status(400).json({ message: "Please provide all required fields." });
        }

        if(example.length === 0){
            return res.status(400).json({ message: "Please provide at least one example." });
        }

        if(testCases.length === 0){
            return res.status(400).json({ message: "Please provide at least one test case." });
        }

        if(availableLanguages.length === 0){
            return res.status(400).json({ message: "Please provide at least one available language." });
        }

        if(example.some(e => !e.input || !e.output)){
            return res.status(400).json({ message: "Please provide input and output for all examples." });
        }

        if(testCases.some(e => !e.input || !e.output)){
            return res.status(400).json({ message: "Please provide input and output for all test cases." });
        }

        if(codeInAllLangs.some(c => !c.lang || !c.starterCode || !c.solutionCode)){
            return res.status(400).json({ message: "Please provide lang, starterCode and solutionCode for all codeInAllLangs." });
        }

        if(!correctAnswer.language || !correctAnswer.code){
            return res.status(400).json({ message: "Please provide language and code for correctAnswer." });
        }

        if (!LANGUAGE_MAP[correctAnswer.language]) {
            return res.status(400).json({ message: `Language ${correctAnswer.language} is not supported for correctAnswer.` });
        }

        if(!["exact","custom"].includes(validationType)){
            return res.status(400).json({ message: "validationType must be either 'exact' or 'custom'." });
        }

        if(validationType === "custom"){
            if(!validationCode || !validationCode.language || !validationCode.code){
                return res.status(400).json({ message: "Please provide validationCode with language and code for custom validation." });
            }
            if(!LANGUAGE_MAP[validationCode.language]){
                return res.status(400).json({ message: `Language ${validationCode.language} is not supported for validationCode.` });
            }
            if(validationCode.language !== correctAnswer.language){
                return res.status(400).json({ message: "validationCode language must be the same as correctAnswer language." });
            }
            if(!availableLanguages.includes(validationCode.language)){
                return res.status(400).json({ message: `Please provide starter and solution code for ${validationCode.language} as it's used in validationCode.` });
            }
        }

        const unique = new Set(availableLanguages);
        if (unique.size !== availableLanguages.length) {
            return res.status(400).json({
                message: "Duplicate languages not allowed"
            });
        }

        for (const lang of availableLanguages) {
            if (!LANGUAGE_MAP[lang]) {
                return res.status(400).json({
                    message: `Language ${lang} is not supported`
                });
            }

            const isThere = codeInAllLangs.find(c => c.lang === lang);
            if (!isThere) {
                return res.status(400).json({
                    message: `Provide code for ${lang}`
                });
            }
        }

        if(!availableLanguages.includes(correctAnswer.language)){
            return res.status(400).json({ message: `Please provide starter and solution code for ${correctAnswer.language}.` });
        }

        const safeParse = (v) => {
                try {
                    return typeof v === "string" ? JSON.parse(v) : v;
                } catch {
                    return v;
                }
            };

        const batchedInput = JSON.stringify(
            testCases.map(tc => safeParse(tc.input))
        );


        let response = await axios.post(
            process.env.RAPID_URL,
            {
                source_code: correctAnswer.code, // FULL code from frontend
                language_id: LANGUAGE_MAP[correctAnswer.language],
                stdin: batchedInput,
                cpu_time_limit: maxTime / 1000,
                memory_limit: maxMemory * 1024
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

        if( response.data.status.id !== 3){
            return res.status(400).json({ message: "Correct answer code did not pass validation. Please check your correct answer code and try again.", ans: response.data });
        }

        

        let validationResult = true;
        
        if(validationType === "custom"){
            const out = (response.data.stdout || "")
            .split("\n")
            .map(o => o.trim())
            .filter(Boolean);

            
            const validationInput = {
                testCases: testCases.map((tc, i) => ({
                    input: safeParse(tc.input),
                    expected: safeParse(tc.output),
                    actual: out[i]
                }))
            };
            const validatorRes = await axios.post(
                process.env.RAPID_URL,
                {
                    source_code: validationCode.code,
                    language_id: LANGUAGE_MAP[validationCode.language],

                    stdin: JSON.stringify(validationInput),

                    cpu_time_limit: maxTime / 1000,
                    memory_limit: maxMemory * 1024
                },
                {
                    headers: {
                        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                        "x-rapidapi-host": "judge029.p.rapidapi.com",
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!validatorRes?.data) {
                return res.status(500).json({ message: "Validator Judge API failed" });
            }

            if(validatorRes.data.status.id !== 3){
                return res.status(400).json({ message: "validationCode did not pass validation. Please check your validation code and try again.", ans: validatorRes.data });
            }
            const parsed = JSON.parse(validatorRes.data.stdout || "{}");

            validationResult = parsed.allPassed === true;

            if (!validationResult) {
                return res.status(400).json({
                    message: "Custom validation failed",
                    debug: validatorRes.data
                });
            }
        }

        const clean = (s) => (s || "").replace(/\s+/g, "");

        const outputs = (response.data.stdout || "")
            .split("\n")
            .map(o => clean(o))
            .filter(Boolean);

        const expectedOutputs = testCases.map(tc => clean(tc.output));

        // console.log("Outputs:", outputs);
        // console.log("Expected outputs:", expectedOutputs);

        if (
            validationType === "exact" &&
            (
                outputs.length !== expectedOutputs.length ||
                !outputs.every((o, i) => o === expectedOutputs[i])
            )
        ) {
            return res.status(400).json({
                message: "Correct answer code did not produce expected outputs for all test cases.",
                ans: response.data
            });
        }

        const question = await dsa.create({
            title,
            description,
            difficulty,
            duration,
            topics,
            companyTags,
            isPremium: isPremium || false,
            example,
            testCases,
            availableLanguages,
            maxMemory,
            maxTime,
            constraints,
            followUp,
            hints,
            correctAnswer,
            validationType,
            validationCode,
            codeInAllLangs,
            addedBy: user._id
        });

        return res.status(201).json({ message: "DSA question created successfully." , responseData: response.data , question: req.body });
    } catch (error) {
        next(error);
    }
}

export const getDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { id } = req.params;

        const redisKey = `dsa_question_${id}`;

        const cachedQuestion = await redis.get(redisKey);

        if (cachedQuestion) {
            return res.status(200).json({ question: JSON.parse(cachedQuestion) });
        }


        const question = await dsa.findById(id).select("-correctAnswer -validationCode ");

        if (!question) {
            return res.status(404).json({ message: "DSA question not found." });
        }

        await redis.set(redisKey, JSON.stringify(question), "EX", 60 * 60); // Cache for 1 hour

        return res.status(200).json({ question });
    } catch (error) {
        next(error);
    }
}

export const addTestCases = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can add test cases." });
        }

        const { id } = req.params;

        const redisKey = `dsa_question_admin:${id}`;
        let question = await redis.get(redisKey);

        if (question) {
            question = JSON.parse(question);
        } else {
            question = await dsa.findById(id);
        }

        if (!question) {
            return res.status(404).json({ message: "DSA question not found." });
        }

        const { testCases } = req.body;

        if (!testCases || testCases.length === 0) {
            return res.status(400).json({ message: "Please provide at least one test case." });
        }

        if(testCases.some(e => !e.input || !e.output)){
            return res.status(400).json({ message: "Please provide input and output for all test cases." });
        }

        const safeParse = (v) => {
            try {
                return typeof v === "string" ? JSON.parse(v) : v;
            } catch {
                return v;
            }
        };


        const batchedInput = JSON.stringify(
            testCases.map(tc => safeParse(tc.input))
        );

        const response = await axios.post(
            process.env.RAPID_URL,
            {
                source_code: question.correctAnswer.code,
                language_id: LANGUAGE_MAP[question.correctAnswer.language],
                stdin: batchedInput,
                cpu_time_limit: question.maxTime / 1000,
                memory_limit: question.maxMemory * 1024
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
            return res.status(500).json({ message: "Failed to validate test cases." });
        }

        if (response.data.status.id !== 3) {
            return res.status(400).json({ message: "One or more test cases did not pass validation. Please check your test cases and try again.", ans: response.data });
        }

        let validationResult = true;

        if(question.validationType === "custom"){
            const output = (response.data.stdout || "")            
                .split("\n")
                .map(o => o.trim())
                .filter(Boolean);

            const validationInput = {
                testCases: testCases.map((tc, i) => ({
                    input: safeParse(tc.input),
                    expected: safeParse(tc.output),
                    actual: output[i]
                }))
            };

            const validatorRes = await axios.post(
                process.env.RAPID_URL,
                {
                    source_code: question.validationCode.code,
                    language_id: LANGUAGE_MAP[question.validationCode.language],
                    stdin: JSON.stringify(validationInput),
                    cpu_time_limit: question.maxTime / 1000,
                    memory_limit: question.maxMemory * 1024
                },
                {
                    headers: {
                        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                        "x-rapidapi-host": "judge029.p.rapidapi.com",
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!validatorRes?.data) {
                return res.status(500).json({ message: "Failed to validate test cases with custom validator." });
            }

            if (validatorRes.data.status.id !== 3) {
                return res.status(400).json({
                    message: "validationCode failed",
                    ans: validatorRes.data
                });
            }

            const parsed = JSON.parse(validatorRes.data.stdout || "{}");
            validationResult = parsed.allPassed === true;

            if (!validationResult) {
                return res.status(400).json({
                    message: "Custom validation failed",
                    debug: validatorRes.data
                });
            }
        }

        if (question.validationType === "exact") {
            const clean = (s) => (s || "").replace(/\s+/g, "");

            const outputs = (response.data.stdout || "")
                .split("\n")
                .map(o => clean(o))
                .filter(Boolean);

            const expectedOutputs = testCases.map(tc => clean(tc.output));

            if (
                outputs.length !== expectedOutputs.length ||
                !outputs.every((o, i) => o === expectedOutputs[i])
            ) {
                return res.status(400).json({
                    message: "Outputs do not match expected results.",
                    ans: response.data
                });
            }
        }


        await dsa.findOneAndUpdate(
            { _id: id },
            { $push: { testCases: { $each: testCases } } } //push all one each is to ensure that if we have multiple test cases, they all get pushed and not just the whole obj    
        )

        await redis.del(redisKey); // Invalidate admin cache
        await redis.del(`dsa_question_${id}`); // Invalidate public cache

        return res.status(200).json({ message: "Test cases added successfully." });
    } catch (error) {
        next(error);
    }
}

export const getDsaQuestionForAdmin = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }   

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can access this endpoint." });
        }

        const { id } = req.params;

        const redisKey = `dsa_question_admin:${id}`;

        const cachedQuestion = await redis.get(redisKey);

        if (cachedQuestion) {
            return res.status(200).json({ question: JSON.parse(cachedQuestion) });
        }

        const question = await dsa.findById(id);

        if (!question) {
            return res.status(404).json({ message: "DSA question not found." });
        }
        await redis.set(redisKey, JSON.stringify(question), "EX", 60 * 60); // Cache for 1 hour
        return res.status(200).json({ question });
    } catch (error) {
        next(error);
    }
}

//no get all questions endpoint because we wont give users the access to all questions
//it is to ensure that they just dont memorise and cheat type thing

export const deleteDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can delete DSA questions." });
        }

        const { id } = req.params;

        const question = await dsa.findById(id);

        if (!question) {
            return res.status(404).json({ message: "DSA question not found." });
        }


        await dsa.deleteOne({ _id: id });

        await redis.del(`dsa_question_${id}`);
        await redis.del(`dsa_question_admin:${id}`);

        return res.status(200).json({ message: "DSA question deleted successfully." });
    } catch (error) {
        next(error);
    }
}

export const getAllDSAQuestionsForAdmin = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can access this endpoint." });
        }

        const questions = await dsa.find({}).populate("addedBy", "name email");

        return res.status(200).json({ questions });
    } catch (error) {
        next(error);
    }
}
//maybe we can add pagination but for small under 10k its fine to just return will handle that in frontend with cache and pages