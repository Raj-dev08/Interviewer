import { Router } from "express";
import { getDSAfeedback, getSysDesignFeedback, getCaseStudyFeedback, getAllSubmission } from "../controller/feedback.controller.js";

const router = Router()

router.get("/dsa/:interviewId/", getDSAfeedback)
router.get("/case/:interviewId/", getCaseStudyFeedback)
router.get("/sysdes/:interviewId/", getSysDesignFeedback)
router.get("/submission/:interviewId/", getAllSubmission)

export default router;