import { Router } from "express";
import { runDSAQuestion, submitDSAQuestion, startSysDes, messageSysDes, getSysDesignMessages} from "../controller/submit.controller.js";

const router = Router();

router.get("/:interviewId/sysdes/:questionId/messages", getSysDesignMessages);
router.post("/:interviewId/dsa/:questionId/submit", submitDSAQuestion);
router.post("/:interviewId/dsa/:questionId/run", runDSAQuestion);
router.post("/:interviewId/sysdes/:questionId/start", startSysDes);
router.post("/:interviewId/sysdes/:questionId/message", messageSysDes);


export default router;