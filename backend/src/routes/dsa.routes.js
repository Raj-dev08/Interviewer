// routes/dsa.routes.js

import { Router } from "express";

import {
  createDSAQuestion,
  getDSAQuestion,
  addTestCases,
  getDsaQuestionForAdmin,
  deleteDSAQuestion,
  getAllDSAQuestionsForAdmin,
} from "../controller/dsa.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/question/:id",protectRoute,getDSAQuestion);
router.post("/create",protectRoute,createDSAQuestion);
router.post("/:id/testcases",protectRoute,addTestCases);
router.get("/admin/question/:id", protectRoute,getDsaQuestionForAdmin);
router.get("/admin/questions", protectRoute, getAllDSAQuestionsForAdmin);
router.delete("/:id", protectRoute, deleteDSAQuestion);

export default router;