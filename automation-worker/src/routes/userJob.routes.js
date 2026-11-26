import { Router } from "express";
import { getUserJobs } from "../controllers/userJob.controller.js";

const router = Router();

router.get("/",getUserJobs)

export default router;