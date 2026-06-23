import { Router } from "express";
import { getDSAfeedback, getSysDesignFeedback, getCaseStudyFeedback, generateDSAFeedBack } from "../controller/feedback.controller.js";

const router = Router()

router.get("/dsa/:interviewId/:questionId", getDSAfeedback)
router.get("/case/:interviewId/:questionId", getCaseStudyFeedback)
router.get("/sysdes/:interviewId/:questionId", getSysDesignFeedback)
router.post("/generate/:interviewId/:questionId", generateDSAFeedBack)//add the query type with it 


export default router;