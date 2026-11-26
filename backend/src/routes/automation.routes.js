
import { Router } from "express";

import {
    getAutomationProfile,
    updateAutomationPreferences,
    getLinkedInStatus,
    openBrowser,
    getBrowserStatus,
    confirmBrowserLogin,
    closeBrowser,
    getUserJobs
} from "../controller/automation.controller.js";

const router = Router();

// Profile and preferences
router.get("/profile", getAutomationProfile);
router.patch("/preferences", updateAutomationPreferences);
router.get("/linkedin/status", getLinkedInStatus);

// Browser
router.post("/browser/open", openBrowser);
router.get("/browser/status", getBrowserStatus);
router.post("/browser/confirm", confirmBrowserLogin);
router.post("/browser/close", closeBrowser);

// Jobs
router.get("/jobs", getUserJobs);

export default router;
