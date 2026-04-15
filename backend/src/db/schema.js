import { pgTable, text, timestamp, uuid, pgEnum, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "canceled",
  "inactive",
  "pending"
])

export const paymentStatus = pgEnum("payment_status", [
  "succeeded",
  "failed",
  "pending"
])

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatus("status").notNull(),
});

export const payments = pgTable("payments", 
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id")
      .references(() => subscriptions.id, { onDelete: "set null" }),
    amount: integer("amount").notNull(),
    date: timestamp("date").notNull(),
    forMonth: integer("for_month").notNull(),
    forYear: integer("for_year").notNull(),
    status: paymentStatus("status").notNull(),
  },
  (table) => ({
    subscriptionMonthYearIdx: uniqueIndex("payment_subscription_month_year_idx")
      .on(table.subscriptionId, table.forMonth, table.forYear)
      .where(sql`${table.status} = 'succeeded'`)
  })
);


export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));



