import { Router } from "express";
import { 
    createPlan, 
    getAllPlans, 
    subscribeToPlan, 
    payForSubscription, 
    cancelSubscription, 
    getUserSubscriptions, 
    getActiveSubscription, 
    getAllPayments, 
    getTotalRevenue, 
    activeSubscriptionsReport  
} from "../controller/plan.controller.js";

const router = Router();

router.post("/", createPlan);
router.get("/", getAllPlans);
router.post("/subscribe/:planId", subscribeToPlan);
router.post("/pay/:subscriptionId", payForSubscription);
router.delete("/cancel/:subscriptionId", cancelSubscription);
router.get("/user", getUserSubscriptions);
router.get("/active", getActiveSubscription);
router.get("/payments", getAllPayments);
router.get("/revenue", getTotalRevenue);
router.get("/report", activeSubscriptionsReport);


export default router;