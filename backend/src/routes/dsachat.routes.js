import { Router } from "express";
import { startDsa, sendMessage, getMessages} from "../controller/dsachat.controller.js";

const router = Router()

router.post("/start/:interviewId/:questionId",startDsa)
router.post("/send/:interviewId/:questionId",sendMessage)
router.get("/get/:interviewId/:questionId",getMessages)

export default router;