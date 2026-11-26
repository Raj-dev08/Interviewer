
import { Router } from "express";
import { getAutomationProfile, updateAutomationPreferences, getLinkedInStatus } from "../controllers/automation.controller.js";

const router = Router();

router.get("/profile", getAutomationProfile);
router.patch("/preferences", updateAutomationPreferences);
router.get("/linkedin/status", getLinkedInStatus);

export default router;
