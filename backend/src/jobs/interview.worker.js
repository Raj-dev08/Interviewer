import mongoose from "mongoose";

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


await connectDB();

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

            await emitSocketEvent(userId.toString(),"interview_created",{
                interview: newInterview
            })

            await emitSocketEvent(userId.toString(),"interview_created",{
                notification
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