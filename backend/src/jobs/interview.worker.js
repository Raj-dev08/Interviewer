import mongoose from "mongoose";
import OpenAI from "openai"

import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { connectDB } from "../lib/db.js";
import { emitSocketEvent } from "../lib/socket.publisher.js";
import { getRandomQuestion } from "../helper/getQuestions.js";
import { interviewQueue } from "../lib/interview.queue.js";
import getPromptByType from "../helper/promptGen.js";
import getCasePromptByType from "../helper/promptGenCase.js";

import Interview from "../model/interview.model.js";
import dsa from "../model/dsa.model.js";
import SystemDesign from "../model/systemdesign.model.js";
import caseStudy from "../model/case.model.js";
import User from "../model/user.model.js";
import Notification from "../model/notification.model.js";
import SystemdesignChat from "../model/systemdesignchat.model.js";
import Submission from "../model/submission.model.js";
import SysdesFeedback from "../model/sysdesfeedback.js";
import CaseChat from "../model/casechat.model.js";
import CaseFeedback from "../model/caseStudyFeedback.model.js";
import dsaChat from "../model/dsachat.model.js";


await connectDB();


const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_URL
});

const interviewWorker = new Worker("interview", async (job) => {
    try {
        if (job.name === "createInterview"){
            const { userId, type } = job.data;

            const user = await User.findById(userId);

            if (!user || user.isDisabled || !type || !["case","dsa-only","system_design","mixed"].includes(type)) {
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled or invalid interview type"
                })
                return
            }

            const allPreviousInterViews = await Interview.find({ userId , type , status: "completed"}).select("questions")


            let completedQuestions = {
                case: [],
                dsa: [],
                system_design: []
            };

            if (allPreviousInterViews.length > 0 ){
                for (const interview of allPreviousInterViews) {
                    if (interview.questions?.case) {
                        completedQuestions.case.push(...interview.questions.case);
                    }
                    if (interview.questions?.dsa) {
                        completedQuestions.dsa.push(...interview.questions.dsa);
                    }
                    if (interview.questions?.sysDes) {
                        completedQuestions.system_design.push(...interview.questions.sysDes);
                    }
                }
            }

            const combos = [
                {
                    "easy":3,
                    "medium":1
                },
                {
                    "easy":2,
                    "hard":1
                },
                {
                    "easy":1,
                    "medium":2
                },
                {
                    "medium":1,
                    "hard":1
                },
            ]

            const selectedCombo = combos[Math.floor(Math.random() * combos.length)];

            let selectedQuestions = {
                case:[],
                dsa:[],
                sysDes:[]
            }

            let duration = 0

            for(const [key,val] of Object.entries(selectedCombo)){
                if ( type === "case"){
                    const { ids, totalDuration } = await getRandomQuestion(caseStudy,key,completedQuestions.case,val)
                    selectedQuestions.case = [...(selectedQuestions.case || []), ...ids];
                    duration += totalDuration
                }
                else if ( type === "dsa-only"){
                    const { ids, totalDuration } = await getRandomQuestion(dsa,key,completedQuestions.dsa,val)
                    selectedQuestions.dsa = [...(selectedQuestions.dsa || []), ...ids]
                    duration += totalDuration
                }
                else if ( type === "system_design"){
                    const { ids, totalDuration } = await getRandomQuestion(SystemDesign,key,completedQuestions.system_design,val)
                    selectedQuestions.sysDes = [...(selectedQuestions.sysDes || []), ...ids]
                    duration += totalDuration
                }
                else if ( type === "mixed"){
                    const { ids, totalDuration } = await getRandomQuestion(dsa, key, completedQuestions.dsa, val)
                    selectedQuestions.dsa = [...(selectedQuestions.dsa || [] ), ...ids ]
                    duration += totalDuration

                }

            }

            if (type === "mixed"){
                const random = Math.random()

                if (random <= 0.33 ){
                    const { ids, totalDuration } = await getRandomQuestion(SystemDesign,"easy",completedQuestions.system_design,1)
                    selectedQuestions.sysDes = [ ...(selectedQuestions.sysDes || []), ...ids ]
                    duration += totalDuration
                } 
                else if ( random <= 0.66 ){
                    const { ids, totalDuration } = await getRandomQuestion(SystemDesign,"medium",completedQuestions.system_design,1)
                    selectedQuestions.sysDes = [ ...(selectedQuestions.sysDes || []), ...ids ]
                    duration += totalDuration
                }
                else{
                    const { ids, totalDuration } = await getRandomQuestion(SystemDesign,"hard",completedQuestions.system_design,1)
                    selectedQuestions.sysDes = [ ...(selectedQuestions.sysDes || []), ...ids ]
                    duration += totalDuration
                }
            }

            selectedQuestions.dsa = [...new Set(selectedQuestions.dsa.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id))
            selectedQuestions.sysDes = [...new Set(selectedQuestions.sysDes.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id))
            selectedQuestions.case = [...new Set(selectedQuestions.case.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id))

            if (
                !selectedQuestions.case.length &&
                !selectedQuestions.dsa.length &&
                !selectedQuestions.sysDes.length
            ) {
                throw new Error("Failed to generate interview");
            }
            const newInterview = await Interview.create({ //No need for status that is default
                userId,
                type,
                questions: selectedQuestions,
                duration
            })

            const notification = await Notification.create({
                userId,
                title: "Interview created",
                message: `Interview creation completed successfully for ${type} interview`,
                link: `/interview/${newInterview._id}`,//wip
                meta:{
                    interviewId: newInterview._id
                }
            })

            const redisKey = `notificationsFor:${user._id}`

            await redis.lpush(redisKey,JSON.stringify(notification))

            await emitSocketEvent(userId.toString(),"interview_created",{
                interview: newInterview
            })

            await emitSocketEvent(userId.toString(),"interview_created",{
                notification
            })
        }  
        else if (job.name === "startSysDesign"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await SystemDesign.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }
            const systemPrompt = `
                You are a senior software engineer conducting a system design interview.

                Present the following problem clearly and professionally:

                "${question.question}"

                Do NOT provide a solution.

                You may slightly elaborate the problem if needed for clarity, but do not reveal hints, constraints, or internal solution.

                Keep the tone natural and interview-like, not instructional or overly verbose.
            `

            const decision = await openai.chat.completions.create({
                model: "meta/llama3-70b-instruct",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    }
                ]
            });

            const output = decision.choices[0].message.content;

            const newMessage = await SystemdesignChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: output
            })

            await emitSocketEvent(userId.toString(),"newMessage",{
                newMessage
            })
        }
        else if (job.name === "newMessage"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await SystemDesign.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }

            const redisKeyForEnd = `end-interview-chat:${interviewId}:${userId}:${questionId}`

            if (await redis.exists(redisKeyForEnd)){
                const sysGeneratedMsg = await SystemdesignChat.create({
                    interviewId,
                    userId,
                    questionId,
                    sentBy: "ai",
                    message: "The conversation is finished please move to the next question or topic"
                })

                await emitSocketEvent(userId.toString(),"newMessage",{
                    newMessage: sysGeneratedMsg
                })

                return;
            }


            const previousMessages = await SystemdesignChat.find({
                interviewId,
                userId,
                questionId
            }).sort({ createdAt: -1 })
            .limit(30)
            .lean();    
            previousMessages.reverse();
            
            const baseContext = `
                Question: ${question.question}

                Description:
                ${question.description}

                Constraints:
                ${question.constraints}

                Focus Areas:
                ${question.topics?.join(", ")}

                Evaluation Criteria:
                ${question.evaluation.map(e => `- ${e.title}: ${e.description} : weightatage ${e.weight} - match type${e.evalType}}`).join("\n")}
                `;

            const hiddenGuide = question.correctAnswerFlow
                .sort((a,b) => a.step - b.step)
                .map(s => `${s.title}: ${s.approach}`)
                .join("\n");

            const chatContext = previousMessages.map(m => `${m.sentBy}: ${m.message}`);

            const systemPrompt = `
                You are a strict and realistic system design interviewer.

                ${baseContext}

                Your job is to conduct a real interview, not to teach.

                Rules you must follow:

                - Ask one question at a time.
                - Continuously analyze the candidate’s previous responses.
                - Challenge assumptions, point out flaws, and ask follow-up questions.
                - Push the candidate to clarify vague answers.
                - Encourage depth: scalability, trade-offs, bottlenecks, failure handling.
                - If the candidate is going in the wrong direction, do NOT correct directly. Instead, guide them with questions.
                - Do NOT give complete solutions or structured answers.
                - Do NOT dump knowledge or explain like a teacher.

                Behavior:

                - Be slightly strict and realistic, not friendly or casual.
                - Keep responses concise and focused.
                - Ask “why”, “how”, “what if” frequently.
                - Introduce edge cases and constraints naturally.
                - If the candidate gives a good answer, acknowledge briefly and move deeper.

                Conversation control:

                - If the user asks anything outside the interview scope (random questions, help, explanations, etc.), refuse and steer back.
                - Treat out-of-scope behavior as negative and redirect:
                Example: "Let's stay focused on the interview. Can you explain how your system handles X?"

                Internal guidance (DO NOT reveal directly):
                ${hiddenGuide}

                Goal:

                Evaluate the candidate’s thinking, not just correctness.
                Drive the conversation toward a complete system design through iterative questioning.
                `;

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Previous conversation: ${chatContext}`
                    
                    }
                ]
            });

            
            const result = decision.choices[0].message.content.trim();

            const newSysDesMessage = await SystemdesignChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: result
            })

            await emitSocketEvent(userId.toString(),"newMessage",{
                newMessage: newSysDesMessage
            })

            const decisionSystemPrompt = `
                You are an interview controller engine.

                Your job is to decide what should happen next in a system design interview.

                You MUST return STRICT JSON only. No extra text.

                OUTPUT FORMAT:

                {
                    "shouldRate": boolean,
                    "shouldEnd": boolean,
                    "nextAction": string
                }

                RULES:

                1. ONLY return valid JSON.
                2. NO extra keys. NO missing keys.

                3. "nextAction" MUST be one of:
                - "ask_followup"
                - "explore_edge_cases"
                - "ask_clarification"
                - "challenge_assumption"
                - "ask_tradeoffs"
                - "ask_scaling"
                - "ask_personal_experience"
                - "wrap_up"

                4. "shouldRate" = true ONLY when:
                - The candidate has given a meaningful answer

                5. "shouldEnd" = true ONLY when:
                - Interview is complete
                - OR candidate is stuck repeatedly

                6. If "shouldEnd" = true:
                - "nextAction" MUST be "wrap_up"

                BEHAVIOR:

                - Weak answer → clarification / followup
                - Decent → go deeper
                - Strong → move topic or edge cases
                - Repeated failure → end

                IMPORTANT:

                - Never output invalid JSON
                - Never invent new actions
                `;
            const judgeRes = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: decisionSystemPrompt   
                    },
                    {
                        role: "user",
                        content: `Previous conversation: ${chatContext}`
                    
                    }
                ]
            });

            const outputRaw = judgeRes.choices[0].message.content.trim();
            const output = JSON.parse(outputRaw);

            if (output.shouldEnd ) {
                await redis.set(redisKeyForEnd,"1","NX","EX",interview.duration * 60)
            }

            if (output.shouldRate) {
                await interviewQueue.add("rateForMessage",{
                    interviewId,
                    userId,
                    questionId
                })
            }

            await interviewQueue.add("nextDecision",{
                interviewId,
                userId,
                questionId,
                type: output.nextAction
            })
           
        }
        else if ( job.name === "nextDecision"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await SystemDesign.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }

            let previousMessages;

            if (type === "ask_followup"){
                previousMessages = await SystemdesignChat.find({
                    interviewId,
                    userId,
                    questionId
                }).sort({ createdAt: -1 })
                .lean()
            } else {
                previousMessages = await SystemdesignChat.find({
                    interviewId,
                    userId,
                    questionId
                }).sort({ createdAt: -1 })
                .limit(30)
                .lean()
            }
            previousMessages.reverse();

            const chatContext = previousMessages.map(m => `${m.sentBy}: ${m.message}`);

            const baseContext = `
                Question: ${question.question}

                Description:
                ${question.description}

                Constraints:
                ${question.constraints}

                Focus Areas:
                ${question.topics?.join(", ")}

                Evaluation Criteria:
                ${question.evaluation.map(e => `- ${e.title}: ${e.description} : weightatage ${e.weight} - match type${e.evalType}}`).join("\n")}
                `;

            const hiddenGuide = question.correctAnswerFlow
                .sort((a,b) => a.step - b.step)
                .map(s => `${s.title}: ${s.approach}`)
                .join("\n");

            const systemPrompt = getPromptByType(type,{
                baseContext,
                hiddenGuide,
                chatContext
            });

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: "complete the task given in the system prompt"             
                    }
                ]
            });

            const output = decision.choices[0].message.content.trim();

            const newMessage = await SystemdesignChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: output
            })

            await emitSocketEvent(userId.toString(),"newMessage",{
                newMessage
            })

            //dont need anything like rate or finish cuz it is the exec layer all is either question or wrap up
        }
        else if ( job.name === "rateForMessage"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await SystemDesign.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }

            const prevSubmission = await Submission.findOne({
                interviewId,
                userId,
                questionId,
                questionType:"SystemDesign",
                difficulty: question.difficulty
            }).sort({ attemptNumber: -1 })

            const previousMessages = await SystemdesignChat.find({
                interviewId,
                userId,
                questionId
            }).sort({ createdAt: -1 })
            .limit(30)
            .lean();

            previousMessages.reverse()

            const chatContext = previousMessages.map((m) => `${m.sentBy}:${m.message}`).join("\n");

            const lastUser = previousMessages
            .filter(m => m.sentBy === "user")
            .slice(-1)[0]?.message;


            const ratingSystemPrompt = `
                You are a strict system design interview scoring engine.

                Your job is to adjust the candidate’s score based on their latest answer.

                OUTPUT RULES:

                - Return ONLY a number.
                - No JSON.
                - No text.
                - No explanation.
                - No symbols.
                - No formatting.

                The number must be between -1.0 and +1.0

                SCORING GUIDE:

                +1.0 → excellent deep system thinking, strong tradeoffs, scalable design  
                +0.5 → good answer with some depth  
                +0.2 → minor improvement  

                -0.2 → shallow or incomplete  
                -0.5 → incorrect reasoning  
                -1.0 → completely wrong or irrelevant  

                IMPORTANT:

                - Focus on the LAST user answer
                - Use recent conversation for context
                - Reward depth, tradeoffs, scalability
                - Penalize vague, generic, repeated, or contradictory answers
                - Do NOT average or normalize
                `;

            const baseContext = `
                Question: ${question.question}

                Description:
                ${question.description}

                Constraints:
                ${question.constraints}

                Focus Areas:
                ${question.topics?.join(", ")}

                Evaluation Criteria:
                ${question.evaluation.map(e => `- ${e.title}: ${e.description} : weightatage ${e.weight} - match type${e.evalType}}`).join("\n")}
                `;

            const hiddenGuide = question.correctAnswerFlow
                .sort((a,b) => a.step - b.step)
                .map(s => `${s.title}: ${s.approach}`)
                .join("\n");

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: ratingSystemPrompt   
                    },
                    {
                        role: "user",
                        content: `
                            Base context of question: ${baseContext}
                            hidden guide: ${hiddenGuide}
                            
                            lastest user answer: ${lastUser}   
                            
                            Previous conversation: ${chatContext}
                           
                            Previous Score: ${prevSubmission ? prevSubmission.totalPoint : 5 }
                        `
                    
                    }
                ]
            }); 
            
            const raw = decision.choices[0].message.content.trim();

            // extract number safely
            const match = raw.match(/-?\d+(\.\d+)?/);
            let delta = match ? parseFloat(match[0]) : 0;
            delta = Math.max(-1, Math.min(1, delta));
            if (prevSubmission){
                const current = prevSubmission ? prevSubmission.totalPoint : 5;

                // dynamic scaling
                const gainFactor = (10 - current) / 10;   // harder to grow near 10
                const lossFactor = current / 10;          // harsher penalty near top

                let adjustedDelta;

                if (delta > 0) {
                    adjustedDelta = delta * ( gainFactor * 1.2 );
                } else {
                    adjustedDelta = delta * ( lossFactor * 1.5 );
                }


                let newScore = current + adjustedDelta;

                newScore = Math.max(0, Math.min(10, newScore));

                await Submission.findOneAndUpdate({
                    interviewId,
                    userId,
                    questionId,
                    questionType: "SystemDesign",
                    difficulty: question.difficulty
                },{
                    totalPoint: newScore ,
                    percentageBeaten: Math.round((newScore/10) * 100)
                })
            } else {
                const baseScore = 5;

                const newScore = Math.max(0, Math.min(10, baseScore + delta));

                const newSubmission = await Submission.create({
                    interviewId,
                    userId,
                    questionId,
                    questionType: "SystemDesign",
                    difficulty: question.difficulty,
                    attemptNumber: 1,//one attempt per sysdes not making new  stuff
                    totalPoint: newScore,
                    percentageBeaten: Math.round((newScore/10)*100)
                })
            }

            const prevFeedBack = await SysdesFeedback.findOne({
                interviewId,
                userId,
                questionId
            })

            const feedbackPrompt = `
                You are a strict system design interviewer giving feedback.

                Your job is to evaluate the candidate’s latest answer and provide actionable feedback.

                You MUST return STRICT JSON only. No extra text.

                OUTPUT FORMAT:

                {
                    "strengths": [string],
                    "weaknesses": [string],
                    "improvements": [string]
                }

                RULES:

                - Be concise
                - No fluff
                - No generic praise
                - Focus on system design thinking
                - Mention scalability, tradeoffs, clarity, depth
                - Call out vague or incorrect reasoning

                IMPORTANT:

                - Focus primarily on the LAST user answer
                - Use recent conversation for context
                - Do NOT explain full solutions
                - Do NOT teach step-by-step
                `;

            const feedbackdecision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: feedbackPrompt   
                    },
                    {
                        role: "user",
                        content: `
                            Base context of question: ${baseContext}
                            hidden guide: ${hiddenGuide}
                            lastest user answer: ${lastUser}   
                            
                            Previous conversation: ${chatContext}
                           
                            ${prevFeedBack ? `Prev feedback : 
                            Strength: ${prevFeedBack.strength.join("; ")} , 
                            weakness: ${prevFeedBack.weakness.jon("; ")} , 
                            improvement: ${prevFeedBack.improvement.join("; ")}` : ""}
                        `
                    
                    }
                ]
            }); 

            const outputForFeedback = feedbackdecision.choices[0].message.content.trim();

            const parsed = JSON.parse(outputForFeedback);

            await SysdesFeedback.findOneAndUpdate({
                interviewId,
                userId,
                questionId,
            },{
                strength: parsed.strengths,
                weakness: parsed.weaknesses,
                improvement: parsed.improvements
            },{
                upsert: true,
                new: true
            })
            
            

        }
        else if ( job.name === "startCaseStudy"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await caseStudy.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }

            const caseContext = `
                TITLE: ${question.title}

                DESCRIPTION:
                ${question.description}

                CONTEXT:
                ${question.previousContext}

                GOAL:
                ${question.goal}
                `;

            const systemPrompt = `
                You are starting a case interview.

                Your job is to introduce the case naturally, like a real interviewer.

                STRICT RULES (do not break):

                - Do NOT change any facts.
                - Do NOT add new information.
                - Do NOT invent data, hints, or constraints.
                - Do NOT reveal solution, approach, or evaluation criteria.
                - Do NOT explain how to solve the case.
                - Do NOT be overly long.

                STYLE RULES:

                - Sound like a human interviewer, not robotic.
                - Slight variation in phrasing is allowed.
                - Keep it concise and professional.
                - 5–8 sentences max.

                STRUCTURE (must follow):

                1. Brief intro line (e.g. "Let's begin", "Here's your case")
                2. Present the case (use given content only)
                3. End with a prompt asking for the candidate's approach

                CASE CONTENT (use exactly, no modification of meaning):

                ${caseContext}

                FINAL INSTRUCTION:

                Generate ONLY the interviewer message.
                Do not include explanations or metadata.
                `;

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt   
                    },
                    {
                        role: "user",
                        content: "start the interview"                 
                    }
                ]
            }); 
            
            const raw = decision.choices[0].message.content.trim();

            const newMessage = await CaseChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: raw
            })

            await emitSocketEvent(userId.toString(),"newMessageCaseStudy",{
                newMessage
            })

        }
        else if ( job.name === "newMessageCase") {
            const { interviewId, userId, questionId } = job.data;

            const user = await User.findById(userId); 
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }

            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);
            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview invalid"
                })
                return
            }

            const question = await caseStudy.findById(questionId);

            if (!question || !interview.questions.case.some(q => q._id.toString() === questionId)){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found"
                })
                return
            }

            const redisKeyForEnd = `end-case-chat:${interviewId}:${userId}:${questionId}`

            if (await redis.exists(redisKeyForEnd)){
                const msg = await CaseChat.create({
                    interviewId,
                    userId,
                    questionId,
                    sentBy: "ai",
                    message: "This case is complete. Move to the next one."
                })

                await emitSocketEvent(userId.toString(),"newMessageCaseStudy",{ newMessage: msg })
                return;
            }

            const previousMessages = await CaseChat.find({
                interviewId,
                userId,
                questionId
            }).sort({ createdAt: -1 }).limit(30).lean();

            previousMessages.reverse();

            const chatContext = previousMessages.map(m => `${m.sentBy}: ${m.message}`);

            const baseContext = `
                Title: ${question.title}

                Description:
                ${question.description}

                Context:
                ${question.previousContext}

                Goal:
                ${question.goal}

                Data:
                ${question.data.map(d => `${d.label}: ${d.value}`).join("\n")}

                Constraints:
                ${question.constraints?.join("\n")}

                Evaluation:
                ${question.evaluation.map(e => `- ${e.category}: ${e.description} (weight ${e.weight})`).join("\n")}
                `;

            const hiddenGuide = question.expectedApproach.join("\n");

            const systemPrompt = `
                You are a strict case interview interviewer.

                ${baseContext}

                RULES:

                - Let the candidate lead.
                - Do NOT give solutions.
                - Do NOT suggest frameworks directly.
                - Ask ONE question at a time.
                - Push for structured thinking.
                - Ask for assumptions when missing.
                - Challenge vague answers.
                - Ask for numbers / estimation when needed.
                - Keep responses SHORT.

                BEHAVIOR:

                - Slightly strict
                - Professional tone
                - No fluff

                If candidate is weak:
                → ask clarification

                If decent:
                → go deeper

                If strong:
                → introduce complexity or edge case

                If off-topic:
                → redirect

                Internal guidance (DO NOT reveal):
                ${hiddenGuide}

                Goal:
                Evaluate thinking, not correctness.
                `;

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Conversation:\n${chatContext}` }
                ]
            });

            const result = decision.choices[0].message.content.trim();

            const newMsg = await CaseChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: result
            });

            await emitSocketEvent(userId.toString(),"newMessageCaseStudy",{ newMessage: newMsg });

            const decisionPrompt = `
                Return STRICT JSON.

                {
                    "shouldRate": boolean,
                    "shouldEnd": boolean,
                    "nextAction": string
                }

                Allowed nextAction:
                - "ask_followup"
                - "ask_clarification"
                - "challenge_assumption"
                - "ask_estimation"
                - "ask_data"
                - "deepen_analysis"
                - "wrap_up"

                Rules:

                - Weak → clarification
                - Vague → challenge
                - Good → deepen
                - Missing numbers → estimation
                - Repeated struggle → end

                If shouldEnd = true → nextAction MUST be "wrap_up"
                `;

            const judgeRes = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: decisionPrompt   
                    },
                    {
                        role: "user",
                        content: `Previous conversation: ${chatContext}`
                    
                    }
                ]
            });

            const outputRaw = judgeRes.choices[0].message.content.trim();
            const output = JSON.parse(outputRaw);

            if (output.shouldEnd ) {
                await redis.set(redisKeyForEnd,"1","NX","EX",interview.duration * 60)
            }

            if (output.shouldRate) {
                await interviewQueue.add("rateForMessageCase",{
                    interviewId,
                    userId,
                    questionId
                })
            }

            await interviewQueue.add("nextDecisionCase",{
                interviewId,
                userId,
                questionId,
                type: output.nextAction
            })
        }
        else if ( job.name === "nextDecisionCase"){
            const { interviewId, userId, questionId } = job.data;

            const user = await User.findById(userId); 
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }

            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);
            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview invalid"
                })
                return
            }

            const question = await caseStudy.findById(questionId);

            if (!question || !interview.questions.case.some(q => q._id.toString() === questionId)){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found"
                })
                return
            }

            let prevQuestions;

            if ( type === "ask_followup"){
                prevQuestions = await CaseChat.find({
                    interviewId,
                    userId,
                    questionId
                }).sort({ createdAt: -1 }).lean();
            } else { 
                prevQuestions = await CaseChat.find({
                    interviewId,
                    userId,
                    questionId
                }).sort({ createdAt: -1 }).limit(30).lean();
            }

            prevQuestions.reverse();

            const chatContext = prevQuestions.map(m => `${m.sentBy}: ${m.message}`);

            const baseContext = `
                Title: ${question.title}

                Description:
                ${question.description}

                Context:
                ${question.previousContext}

                Goal:
                ${question.goal}

                Data:
                ${question.data.map(d => `${d.label}: ${d.value}`).join("\n")}

                Constraints:
                ${question.constraints?.join("\n")}

                Evaluation:
                ${question.evaluation.map(e => `- ${e.category}: ${e.description} (weight ${e.weight})`).join("\n")}
                `;

            const hiddenGuide = question.expectedApproach.join("\n");

            const systempPrompt = getCasePromptByType(type,{
                baseContext,
                hiddenGuide,
                chatContext
            });

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: "complete the task given in the system prompt"             
                    }
                ]
            });

            const output = decision.choices[0].message.content.trim();

            const newMessage = await CaseChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: output
            })

            await emitSocketEvent(userId.toString(),"newMessageCaseStudy",{
                newMessage
            })

        }
        else if ( job.name === "rateForMessageCase"){
            const { interviewId, userId, questionId } = job.data;

            const user = await User.findById(userId); 
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }

            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);
            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview invalid"
                })
                return
            }

            const question = await caseStudy.findById(questionId);

            if (!question || !interview.questions.case.some(q => q._id.toString() === questionId)){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found"
                })
                return
            }

            const prevSubmission = await Submission.findOne({
                interviewId,
                userId,
                questionId,
                questionType: "CaseStudy",
                difficulty: question.difficulty
            }).sort({ attemptNumber: -1 })


            const previousMessages = await CaseChat.find({
                interviewId,
                userId,
                questionId
            }).sort({ createdAt: -1 }).limit(30).lean();

            previousMessages.reverse();

            const chatContext = previousMessages.map((m) => `${m.sentBy}:${m.message}`).join("\n");

            const lastUser = previousMessages
            .filter(m => m.sentBy === "user")
            .slice(-1)[0]?.message;

            const ratingSystemPrompt = `
                You are a strict case interview scoring engine.

                Your job is to evaluate ONLY the candidate's LAST answer and return a score delta.

                OUTPUT RULES:

                - Return ONLY a number
                - No JSON
                - No text
                - No explanation
                - No symbols
                - No formatting

                The number must be between -1.0 and +1.0

                SCORING GUIDE:

                +1.0 → Excellent structured thinking, clear logic, strong assumptions, good prioritization  
                +0.5 → Good answer with reasonable structure and logic  
                +0.2 → Slight improvement or partially correct  

                -0.2 → Vague, unclear, weak structure  
                -0.5 → Poor reasoning, missing assumptions, confused thinking  
                -1.0 → Completely wrong, random, or irrelevant  

                WHAT TO EVALUATE (VERY IMPORTANT):

                1. Structure:
                - Did the candidate break the problem into clear steps?
                - Or are they jumping randomly?

                2. Assumptions:
                - Did they state assumptions clearly?
                - Or are they hand-waving?

                3. Logic:
                - Does the reasoning make sense?
                - Any contradictions?

                4. Prioritization:
                - Are they focusing on important factors?
                - Or wasting time on irrelevant details?

                5. Quantitative thinking:
                - Did they use numbers / estimates when needed?

                IMPORTANT RULES:

                - Focus ONLY on the LAST user answer
                - Use recent conversation only for context
                - Do NOT average scores
                - Do NOT normalize
                - Do NOT be lenient

                - Penalize:
                - vague answers
                - no structure
                - no assumptions
                - generic frameworks without thinking

                - Reward:
                - clear structured breakdown
                - explicit assumptions
                - logical flow
                - practical thinking

                If unsure → give a small negative score (-0.2)

                Return ONLY the number.
                `;

             const baseContext = `
                Title: ${question.title}

                Description:
                ${question.description}

                Context:
                ${question.previousContext}

                Goal:
                ${question.goal}

                Data:
                ${question.data.map(d => `${d.label}: ${d.value}`).join("\n")}

                Constraints:
                ${question.constraints?.join("\n")}

                Evaluation:
                ${question.evaluation.map(e => `- ${e.category}: ${e.description} (weight ${e.weight})`).join("\n")}
                `;

            const hiddenGuide = question.expectedApproach.join("\n");

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: ratingSystemPrompt   
                    },
                    {
                        role: "user",
                        content: `
                            Base question context: ${baseContext}
                            Hidden guide: ${hiddenGuide}
                            lastest user answer: ${lastUser}   
                            
                            Previous conversation: ${chatContext}
                           
                            Previous Score: ${prevSubmission ? prevSubmission.totalPoint : 5 }
                        `
                    
                    }
                ]
            }); 

            const raw = decision.choices[0].message.content.trim();

            const match = raw.match(/-?\d+(\.\d+)?/);
            let delta = match ? parseFloat(match[0]) : 0;
            delta = Math.max(-1, Math.min(1, delta));

            if (prevSubmission){
                const current = prevSubmission ? prevSubmission.totalPoint : 5;

                const gain = ( 10 - current ) / 10
                const loss = current / 10

                let newDelta;

                if (delta > 0 ){
                    newDelta = delta * ( gain * 1.2 );
                } else {
                    newDelta = delta * ( loss * 1.5 );
                }

                let newScore = current + newDelta;

                newScore = Math.max(0, Math.min(10, newScore));

                await Submission.findOneAndUpdate({
                    interviewId,
                    userId,
                    questionId,
                    questionType: "CaseStudy",
                    difficulty: question.difficulty
                },{
                    totalPoint: newScore ,
                    percentageBeaten: Math.round((newScore/10) * 100)
                })
            } else {
                const baseScore = 5;

                const newScore = Math.max(0, Math.min(10, baseScore + delta));

                const newSubmission = await Submission.create({
                    interviewId,
                    userId,
                    questionId,
                    questionType: "CaseStudy",
                    difficulty: question.difficulty,
                    attemptNumber: 1,
                    totalPoint: newScore,
                    percentageBeaten: Math.round((newScore/10)*100)
                })
            }

            const prevFeedBack = await CaseFeedback.findOne({
                interviewId,
                userId,
                questionId
            })

            

            const feedbackPrompt = `
                You are a strict case interview evaluator giving feedback.

                Your job is to evaluate the candidate’s latest answer and provide sharp, actionable feedback.

                You MUST return STRICT JSON only. No extra text.

                OUTPUT FORMAT:

                {
                    "strengths": [string],
                    "weaknesses": [string],
                    "improvements": [string]
                }

                RULES:

                - Be concise
                - No fluff
                - No generic praise
                - No repetition
                - Each point must be specific and tied to the answer

                WHAT TO FOCUS ON:

                1. Structure:
                - Did the candidate break the problem into clear steps?

                2. Assumptions:
                - Did they state assumptions clearly?
                - Or skip them?

                3. Logic:
                - Is the reasoning sound?
                - Any contradictions?

                4. Prioritization:
                - Are they focusing on the right things?

                5. Quantitative thinking:
                - Did they use numbers or estimates when needed?

                IMPORTANT:

                - Focus primarily on the LAST user answer
                - Use recent conversation only for context
                - Do NOT explain full solutions
                - Do NOT teach step-by-step
                - Do NOT suggest exact frameworks (like "use XYZ framework")

                GUIDELINES:

                Strengths:
                - Only include if real (no fake praise)
                - Example: "Clear step-by-step breakdown of the problem"

                Weaknesses:
                - Be direct
                - Example: "No clear assumptions stated"

                Improvements:
                - Actionable next step
                - Example: "Start by outlining 2–3 clear buckets before diving deeper"

                If the answer is weak:
                - More weaknesses than strengths

                If the answer is strong:
                - Still include at least 1 improvement

                Return ONLY valid JSON.
                `;

            const feedbackdecision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: feedbackPrompt   
                    },
                    {
                        role: "user",
                        content: `
                            Base question context: ${baseContext}
                            Hidden guide: ${hiddenGuide}

                            lastest user answer: ${lastUser}   
                            
                            Previous conversation: ${chatContext}
                           
                            ${prevFeedBack ? ` Prev feedback: 
                            Strength: ${prevFeedBack.strength.join("; ")} , 
                            weakness: ${prevFeedBack.weakness.join("; ")} , 
                            improvement: ${prevFeedBack.improvement.join("; ")}` : ""}
                        `
                    
                    }
                ]
            }); 

            const outputForFeedback = feedbackdecision.choices[0].message.content.trim();

            const parsed = JSON.parse(outputForFeedback);

            await CaseFeedback.findOneAndUpdate({
                interviewId,
                userId,
                questionId
            },{
                strength: parsed.strengths,
                weakness: parsed.weaknesses,
                improvement: parsed.improvements
            },{
                upsert: true,
                new: true
            })
        }
        else if ( job.name === "finishInterview"){
            const { interviewId, userId } = job.data
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }

            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);
            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview invalid"
                })
                return
            }

            await Interview.findOneAndUpdate({
                _id: interviewId
            },{
                status: "finished"
            })

            await redis.del(redisKey);

            //TO_DO : make full analysis report with ai like how he performed what can be done better where he messed up 
            
        }
        else if ( job.name === "startAiListeningForDSA"){
            const { interviewId, userId, questionId } = job.data;
            const user = await User.findById(userId); 
            
            if (!user || user.isDisabled){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled"
                })
                return
            }
            const redisKey = `ongoingInterview:${interviewId}`;
            const cached = await redis.get(redisKey);

            const interview = cached ? JSON.parse(cached) : await Interview.findById(interviewId);

            if (!interview || interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
            }
            const question = await dsa.findById(questionId);

            if (!question || !interview.case.includes(questionId.toString())){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Question not found in interview"
                })
                return
            }

            const redisKeyForDataBucket = `dsa-data-bucket-for-${interviewId}:${userId}:${questionId}`

            const lockedBucket = await redis.set(redisKeyForDataBucket,"1","NX","EX",interview.duration * 60)

            if (!lockedBucket){
                return;
            }

            const baseContextForQuestion = `
                Question Title: ${question.title}

                Description: ${question.description}

                example: 
                ${question.example.map((t) => 
                    `input: ${t.input} ,
                    output: ${t.output} , 
                    ${t.explanation ? 
                    `explanation: ${t.explanation}` : 
                    ""}
                    `).join("\n")}
            `

            const systemPromt = `
                You are an AI DSA interview assistant inside a live coding interview system.

                Your role is ONLY to introduce the problem at the start of the interview.

                You will receive a DSA problem object containing:
                - title
                - description
                - examples

                TASK:
                1. Greet the candidate in a natural, professional tone (no fluff, no emojis).
                2. Briefly introduce the problem.
                3. If needed, explain the problem in simple terms using the given examples.
                4. Clearly state what the user needs to solve (input → output behavior).
                5. Do NOT give hints, approaches, optimizations, or solutions.
                6. Do NOT continue the conversation beyond this message.

                STYLE:
                - Interview-style (FAANG interviewer tone)
                - Concise and direct
                - No motivational content

                OUTPUT FORMAT:
                Start with:
                "Hi, let's begin the interview."

                Then:
                - Problem introduction
                - Simple explanation (only if needed)
                - Example explanation (only if needed)

                END WITH EXACT LINE:
                "Let me know if you have any queries, if not start the coding."

                Return only the final message. No extra text.
                `;

            const decision = await openai.chat.completions.create({
                model: "nvidia/nemotron-3-super-120b-a12b",
                messages: [
                    {
                        role: "system",
                        content: systemPromt
                    },
                    {
                        role: "user",
                        content: baseContextForQuestion
                    }
                ]
            })

            const output = decision.choices[0].message.content.trim();


            const newMessage = await dsaChat.create({
                interviewId,
                userId,
                questionId,
                sentBy: "ai",
                message: output
            })

            await emitSocketEvent(userId.toString(),"newMessageDSA",{
                newMessage
            })

            
        }
        else if (job.name === "newDSAMessage"){
            //TO_DO
        }
    } catch (error) {
        throw error;
    }
},{
    concurrency: 10,
    connection: redis
})

interviewWorker.on("completed",(job) => {
    console.log(`Job ${job.id} completed`)
})

interviewWorker.on("failed",(job,err) => {
    console.log(`Job ${job.id} failed with error : ${err}`)
})