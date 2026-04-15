import { db } from "./index";
import { eq, and, sum, count } from "drizzle-orm";
import { plans, subscriptions, payments } from "./schema";


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


export const createSubscription = async (data) => {
  const [subscription] = await db.insert(subscriptions).values(data).returning();
  return subscription;
};

export const getSubscriptionById = async (id) => {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
    with: {
      plan: true,
    },
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

export const updateSubscription = async (id, data) => {
  const [subscription] = await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.id, id))
    .returning();

  return subscription;
};

export const cancelSubscription = async (id) => {
  const [subscription] = await db
    .update(subscriptions)
    .set({ status: "canceled" })
    .where(eq(subscriptions.id, id))
    .returning();

  return subscription;
};


export const createPayment = async (data) => {
  const [payment] = await db.insert(payments).values(data).returning();
  return payment;
};

export const getPaymentsBySubscriptionId = async (subscriptionId) => {
  return db.query.payments.findMany({
    where: eq(payments.subscriptionId, subscriptionId),
    orderBy: (payments, { desc }) => [desc(payments.date)],
  });
};

export const getSuccessfulPayments = async () => {
  return db.query.payments.findMany({
    where: eq(payments.status, "succeeded"),
    orderBy: (payments, { desc }) => [desc(payments.date)],
  });
};

export const getPaymentByMonthYear = async (
  subscriptionId,
  month,
  year
) => {
  return db.query.payments.findFirst({
    where: and(
      eq(payments.subscriptionId, subscriptionId),
      eq(payments.forMonth, month),
      eq(payments.forYear, year),
      eq(payments.status, "succeeded")
    ),
  });
};


export const createPaymentIfNotExists = async (data) => {
  const existing = await getPaymentByMonthYear(
    data.subscriptionId,
    data.forMonth,
    data.forYear
  );

  if (existing) return existing;

  const [payment] = await db.insert(payments).values(data).returning();
  return payment;
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