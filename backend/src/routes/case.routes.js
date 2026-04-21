import { Router } from "express";
import { 
    createCaseStudy,
    getCaseStudyById,
    getAllCaseStudies,
    deleteCaseStudy
} from "../controller/case.controller.js";

const router = Router();

router.post("/create", createCaseStudy);
router.get("/:id", getCaseStudyById);
router.get("/owner/getAll", getAllCaseStudies);
router.delete("/delete", deleteCaseStudy);

export default router;