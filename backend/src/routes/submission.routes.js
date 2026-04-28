import { Router } from "express";
import { runDSAQuestion, submitDSAQuestion, startSysDes } from "../controller/submit.controller.js";

const router = Router();

router.post("/:interviewId/dsa/:questionId/submit", submitDSAQuestion);
router.post("/:interviewId/dsa/:questionId/run", runDSAQuestion);
router.post("/:interviewId/sysdes/:questionId/start", startSysDes);

export default router;