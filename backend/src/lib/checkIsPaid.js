import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import User from "../model/user.model.js";
import { redis } from "../lib/redis.js";

export const verifyAndSyncSubscription = async (userId) => {
    const lockKey = `sub_check:${userId}`;

    try {
        const lock = await redis.get(lockKey);
        if (lock) return true;

        const result = await db.transaction(async (tx) => {

            const { rows } = await tx.execute(sql`
                SELECT *
                FROM subscriptions
                WHERE user_id = ${userId} AND status = 'active'
                FOR UPDATE
            `);

            const pgSub = rows[0] || null;

            const user = await User.findById(userId).select("currentSubscription isPaid");

            if (!user) return false;

            const now = new Date();

            if (!pgSub) {
                if (user.currentSubscription) {
                    await User.findByIdAndUpdate(userId, {
                        $set: { currentSubscription: "", isPaid: false }
                    });
                }
                return false;
            }

            if (pgSub.end_date < now) {
                await tx.update(subscriptions)
                    .set({ status: "inactive" })
                    .where(eq(subscriptions.id, pgSub.id));

                await User.findByIdAndUpdate(userId, {
                    $set: { currentSubscription: "", isPaid: false }
                });

                return false;
            }


            if (user.currentSubscription !== pgSub.id) {
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        currentSubscription: pgSub.id,
                        isPaid: true
                    }
                });
            }

            return true;
        });

        // ✅ Set Redis lock AFTER success
        await redis.set(lockKey, "1", "EX", 24 * 60 * 60); // 24h

        return result;

    } catch (err) {
        console.log("Subscription check failed:", err.message);
        return false;
    }
};