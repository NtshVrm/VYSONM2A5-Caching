import { createClient } from "redis";

export const redisClient = createClient({
  username: "default",
  password: "mx9vxnDGUEI6fThnoOUFX2JBGhshsZps",
  socket: {
    host: "redis-10153.c305.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 10153,
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
