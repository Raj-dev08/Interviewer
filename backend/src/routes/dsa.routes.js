import Router from "express";
import { createDSAQuestion } from "../controller/dsa.controller.js";

const router = Router();

router.post("/create", createDSAQuestion);

export default router;

