import mongoose from "mongoose";
import OpenAI from "openai"

import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { connectDB } from "../lib/db.js";
import { emitSocketEvent } from "../lib/socket.publisher.js";
import { getRandomQuestion } from "../helper/getQuestions.js";

import Interview from "../model/interview.model.js";
import dsa from "../model/dsa.model.js";
import SystemDesign from "../model/systemdesign.model.js";
import caseStudy from "../model/case.model.js";
import User from "../model/user.model.js";
import Notification from "../model/notification.model.js";
import SystemdesignChat from "../model/systemdesignchat.model.js";


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
            const interview = await Interview.findById(interviewId);
            const question = await SystemDesign.findById(questionId);

            if (!user || user.isDisabled || !interview || !question ) {
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled or invalid interview type"
                })
                return 
            }

            if (interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
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
            const interview = await Interview.findById(interviewId);
            const question = await SystemDesign.findById(questionId);

            if (!user || user.isDisabled || !interview || !question ) {
                await emitSocketEvent(userId.toString(),"error",{
                    message: "User not found or is disabled or invalid interview type"
                })
                return 
            }

            if (interview.status !== "started" || interview.userId.toString() !== user._id.toString()){
                await emitSocketEvent(userId.toString(),"error",{
                    message: "Interview is not started or is finished or you are not the part of interview"
                })
                return
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
            //todo add states to actually keep track of what do ( rate , update ratings , end etc)

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