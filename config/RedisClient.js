const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Error: ", err.message || err);
});

redisClient.on("connect", () => {
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    console.log("Redis connected and ready.");
});

redisClient.on("end", () => {
    console.log("Redis connection disconnected.");
});

redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis on startup:", err.message);
  }
})();

module.exports = redisClient;