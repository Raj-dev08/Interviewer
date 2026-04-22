import { Router } from "express";
import { getNotifications, removeNotifications, readNotifications } from "../controller/notification.controller.js";

const router = Router();

router.get("/notifications", getNotifications);
router.delete("/notifications/:id", removeNotifications);
router.put("/notifications", readNotifications);

export default router;