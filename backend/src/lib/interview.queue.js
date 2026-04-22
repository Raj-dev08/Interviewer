import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const interviewQueue = new Queue("interview", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete:true,
        removeOnFail:true,
    },
});