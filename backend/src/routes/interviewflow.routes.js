import {Router} from "express";
import {
    startInterview,
    getRemainingTime,
    getInterviewByIdAfterStart,
} from "../controller/interviewflow.controller.js";

const router = Router();

router.post("/:id/start", startInterview);
router.get("/:id/time", getRemainingTime);
router.get("/:id", getInterviewByIdAfterStart);

export default router;