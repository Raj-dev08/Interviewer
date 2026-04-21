import { Router } from "express"
import { createSystemDesignQuestion, getSystemDesignQuestionById, getAllSystemDesignQuestions, deleteSystemDesignQuestion } from "../controller/sysdes.controller.js"

const router = Router()

router.post("/create",createSystemDesignQuestion)
router.get("/owner/getAll",getAllSystemDesignQuestions)
router.get("/:id",getSystemDesignQuestionById)
router.delete("/delete",deleteSystemDesignQuestion)

export default router