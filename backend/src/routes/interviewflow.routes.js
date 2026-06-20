import { Router } from "express";
import {
    startInterview,
    getRemainingTime,
    getInterviewByIdAfterStart,
    activeInterView
} from "../controller/interviewflow.controller.js";

const router = Router();

router.get("/active", activeInterView);
router.post("/:id/start", startInterview);
router.get("/:id/time", getRemainingTime);
router.get("/:id", getInterviewByIdAfterStart);


export default router;