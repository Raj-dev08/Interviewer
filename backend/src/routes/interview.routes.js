import { Router } from "express";
import { createInterview, getInterviewByIdAfterStart, getInterviewById, getAllInterviews, cancelInterview } from "../controller/interview.controller.js";

const router = Router()

router.post("/create",createInterview)
router.get("/get/:id",getInterviewById)
router.get("/get-after-start/:id",getInterviewByIdAfterStart)
router.get("/get-all",getAllInterviews)
router.patch("/cancel/:id",cancelInterview)

export default router;
