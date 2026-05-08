import { Server } from "socket.io";
import { createClient } from "redis";
import { interviewQueue } from "./interview.queue.js";
import { redis } from "./redis.js";

let io;
export const initSocket = async (server) => {

  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL],
      credentials: true
    }
  });

  const eventSub = createClient({
    url: process.env.REDIS_URL
  });

  await eventSub.connect();

  await eventSub.subscribe("socket-events", (message) => {
    try {
        const { room, event, data } = JSON.parse(message);
        io.to(room).emit(event, data);
    } catch (err) {
        console.error("Socket event parse error", err);
    }
  });

  
  io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;

    if (userId) {
      socket.join(userId);
      console.log("User connected:", userId);
    }

    socket.on("codeChange", async(data) => {
      try {
        const { code, interviewId, userId, questionId } = data

        const redisKeyForInit = `timestamp-to-exec-for-${interviewId}:${userId}:${questionId}`   
        const redisKey = `dsa-data-bucket-for-${interviewId}:${userId}:${questionId}`
        const historyKey = `dsa-code-history-for-${interviewId}:${userId}:${questionId}`;


        const result = await redis.set(redisKey, code, "XX", "EX", 60 * 60); // duration isnt usually more wont trust frontend and searching is a bit heavy

        if (!result) {
          console.log("Key does not exist, not updated");
        }

        await redis.rpush(
          historyKey,
          JSON.stringify({
            code,
            ts: Date.now()
          })
        );

        await redis.ltrim(historyKey, -50, -1);


        const execute = await redis.set(redisKeyForInit,"1","NX","EX", 5 * 60 ) //5 mins for this
        
        if (!execute){
          await interviewQueue.add("decideNextDecision",{
            interviewId,
            userId,
            questionId
          })
        }


      } catch (error) {
        console.log(error);
      }
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });


  });

};

//add socket listening here to list the messages will use socket poling to call for typing events and accumulated ai response with decision

export { io };