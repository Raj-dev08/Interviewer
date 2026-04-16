import * as queries from '../db/queries.js';
import { db } from '../db/index.js';
import { subscriptions, payments } from '../db/schema.js';
import User from '../model/user.model.js';
import { eq, sql } from 'drizzle-orm';

export const createPlan = async(req, res, next) =>{
    try {
        const  { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can create plans." });
        }

        const { name, description, price, durationDays } = req.body;

        if (!name || !description || price === undefined || durationDays === undefined) {
            return res.status(400).json({ message: "Name, description, price, and duration are required." });
        }

        const newPlan = await queries.createPlan({ name, description, price, durationDays });

        if (!newPlan) {
            return res.status(500).json({ message: "Failed to create plan." });
        }

        return res.status(201).json(newPlan);
    } catch (error) {
        next(error);
    }
}

export const getAllPlans = async(req, res, next) =>{
    try {
        const plans = await queries.getAllPlans();
        return res.status(200).json(plans);
    } catch (error) {
        next(error);
    }
}

export const subscribeToPlan = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { planId } = req.params;

        if(!planId) {
            return res.status(400).json({ message: "Plan ID is required." });
        }

        const plan = await queries.getPlanById(planId);

        if (!plan) {
            return res.status(404).json({ message: "Plan not found." });
        }

        const result = await db.transaction(async (tx) => {
            const createdSubscription = await tx.insert(subscriptions).values({
                userId: user._id,
                planId,
                startDate: new Date(),
                endDate: new Date(), // place holder, will be updated upon successful payment
                status: "pending",
            }).returning();

            if (!createdSubscription || createdSubscription.length === 0) {
                throw new Error("Failed to create subscription.");
            }

            const subscription = createdSubscription[0];

            const payment = await tx.insert(payments).values({
                subscriptionId: subscription.id,
                amount: plan.price,
                date: new Date(),
                forMonth: subscription.startDate.getMonth() + 1,//will be updated to actual month and year of subscription start date upon successful payment, for now just set to current month and year
                forYear: subscription.startDate.getFullYear(),
                status: "pending",
            }).returning();

            if(!payment || payment.length === 0) {
                throw new Error("Failed to create payment.");
            }

            return { subscription, payment: payment[0] };
        })

        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export const payForSubscription = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({ message: "Payment ID is required." });
        }

        const result = await db.transaction(async (tx) => {

            const { rows } = await tx.execute(sql`
                SELECT p.*, s.user_id , s.status as subscription_status, pl.duration_days
                FROM payments p
                JOIN subscriptions s ON p.subscription_id = s.id
                JOIN plans pl ON s.plan_id = pl.id
                WHERE p.id = ${paymentId}
                FOR UPDATE
            `);

            const payment = rows[0];

            if (!payment) {
                throw new Error("Payment not found.");
            }

            if (payment.user_id !== user._id) {
               throw new Error("You are not authorized to pay for this subscription.");
            }

            if (payment.subscription_status !== "pending") {
                throw new Error("Subscription is not in a pending state.");
            }

            if (payment.status === "succeeded") {
                return {
                    payment,
                    subscription: await tx.query.subscriptions.findFirst({
                        where: eq(subscriptions.id, payment.subscription_id)
                    })
                };
            }

            const now = new Date();

            const updatedPayment = await tx.update(payments)
                .set({ 
                    status: "succeeded",
                    forMonth: now.getMonth() + 1,
                    forYear: now.getFullYear(),
                }).where(eq(payments.id, paymentId)).returning();
            
                            
            if (!updatedPayment || updatedPayment.length === 0) {
                throw new Error("Failed to update payment status.");
            }

            await tx.execute(sql`
                UPDATE subscriptions
                SET status = 'inactive'
                WHERE user_id = ${user._id}
                    AND status = 'active'
            `);

            const endDate = new Date(now.getTime() + payment.duration_days * 24 * 60 * 60 * 1000); 

            const updatedSubscription = await tx.update(subscriptions)
                .set({ 
                    status: "active" ,
                    startDate: now,
                    endDate: endDate
                }).where(eq(subscriptions.id, payment.subscription_id)).returning();

            if (!updatedSubscription || updatedSubscription.length === 0) {
                throw new Error("Failed to update subscription status.");
            }

            
            return { payment: updatedPayment[0], subscription: updatedSubscription[0] };
        })

        if (!result) {
            return res.status(500).json({ message: "Failed to process payment." });
        }

        await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { isPaid: true , currentSubscription: result.subscription.id} }
        )

        //history of all subscriptions can be fetched by user id when needed, no need to store in user model

        return res.status(200).json(result);
    } catch (error) {
        if (err.code === "23505") {
            throw new Error("Active subscription already exists");
        }
        next(error);
    }
}

export const cancelSubscription = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const { subscriptionId } = req.params;

        if (!subscriptionId) {
            return res.status(400).json({ message: "Subscription ID is required." });
        }

        const result = await db.transaction(async (tx) => {

            const { rows } = await tx.execute(sql`
                SELECT *
                FROM subscriptions
                WHERE id = ${subscriptionId}
                FOR UPDATE
            `);

            const subscription = rows[0];

            if (!subscription) {
                throw new Error("Subscription not found.");
            }

            if (subscription.user_id !== user._id) {
                throw new Error("You are not authorized to cancel this subscription.");
            }

            if (subscription.status !== "active") {
                throw new Error("Only active subscriptions can be canceled.");
            }

            const updated = await tx.update(subscriptions)
                .set({ status: "canceled" })
                .where(eq(subscriptions.id, subscriptionId))
                .returning();

            if (!updated || updated.length === 0) {
                throw new Error("Failed to cancel subscription.");
            }

            return updated[0];
        });

        return res.status(200).json({ message: "Subscription canceled successfully." , subscription: result});

    } catch (error) {
        next(error);
    }
};

export const getUserSubscriptions = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const subscriptions = await queries.getUserSubscriptions(user._id);

        return res.status(200).json(subscriptions);
    } catch (error) {
        next(error);
    }
}

export const getActiveSubscription = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        const subscription = await queries.getActiveSubscriptionByUserId(user._id);

        if (!subscription) {
            return res.status(404).json({ message: "No active subscription found." });
        }

        return res.status(200).json(subscription);
    } catch (error) {
        next(error);
    }
}

export const getAllPayments = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can view all payments." });
        }

        const payments = await queries.getAllUserPayments(user._id);

        return res.status(200).json(payments);
    } catch (error) {
        next(error);
    }
}

export const getTotalRevenue = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can view total revenue." });
        }

        const totalRevenue = await queries.getTotalRevenue();

        return res.status(200).json({ totalRevenue });
    } catch (error) {
        next(error);
    }
}

export const activeSubscriptionsReport = async(req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can view the active subscriptions report." });
        }

        const activeSubscriptions = await queries.getActiveSubscriptionCount();

        return res.status(200).json({ activeSubscriptions });
    } catch (error) {
        next(error);
    }
}

