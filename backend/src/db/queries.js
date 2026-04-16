import { db } from "./index.js";
import { eq, and, sum, count } from "drizzle-orm";
import { plans, subscriptions, payments } from "./schema.js";


export const createPlan = async (data) => {
  const [plan] = await db.insert(plans).values(data).returning();
  return plan;
};

export const getAllPlans = async () => {
  return db.select().from(plans);
};

export const getPlanById = async (id) => {
  return db.query.plans.findFirst({
    where: eq(plans.id, id),
  });
};


export const getActiveSubscriptionByUserId = async (userId) => {
  return db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ),
    with: {
      plan: true,
    },
  });
};

export const getUserSubscriptions = async (userId) => {
  return db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
    with: {
      plan: true,
    },
    orderBy: (subscriptions, { desc }) => [
      desc(subscriptions.startDate),
    ],
  });
};


export const getPaymentsBySubscriptionId = async (subscriptionId) => {
  return db.query.payments.findMany({
    where: eq(payments.subscriptionId, subscriptionId),
    orderBy: (payments, { desc }) => [desc(payments.date)],
  });
};

export const getAllUserPayments = async () => {
  return db.query.payments.findMany({
    orderBy: (payments, { desc }) => [desc(payments.date)],
  });
};

export const getTotalRevenue = async () => {
  const [result] = await db
    .select({
      total: sum(payments.amount),
    })
    .from(payments)
    .where(eq(payments.status, "succeeded"));

  return result?.total ?? 0;
};

export const getActiveSubscriptionCount = async () => {
  const [result] = await db
    .select({
      value: count(),
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  return result.value;
};