import {Router} from "express";
import {
    startInterview,
    getRemainingTime,
    getInterviewByIdAfterStart,
    runDSAQuestion
} from "../controller/interviewflow.controller.js";

const router = Router();

router.post("/:id/start", startInterview);
router.get("/:id/time", getRemainingTime);
router.get("/:id", getInterviewByIdAfterStart);
router.post("/:interviewId/dsa/:questionId/run", runDSAQuestion);

export default router;