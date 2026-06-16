import { Router } from "express";
import { getNotifications, removeNotifications, readNotifications, getUnreadNotificationCount } from "../controller/notification.controller.js";

const router = Router();

router.get("/notifications", getNotifications);
router.get("/unread-notification/count",getUnreadNotificationCount)
router.delete("/notifications/:id", removeNotifications);
router.put("/notifications", readNotifications);

export default router;