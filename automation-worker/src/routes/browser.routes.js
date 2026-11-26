
import express from "express";
import {
    openBrowser,
    getBrowserStatus,
    confirmBrowserLogin,
    closeBrowser
} from "../controllers/browser.controller.js";


const router = express.Router();

router.post("/open", openBrowser);
router.get("/status", getBrowserStatus);
router.post("/confirm", confirmBrowserLogin);
router.post("/close", closeBrowser);

export default router;
