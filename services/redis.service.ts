import { redisClient } from "../db/redis.datasource";

class RedisService {
  async setValue(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await redisClient.connect();
      if (ttl) {
        await redisClient.set(key, value, { EX: ttl });
        console.log(
          `Value set for key "${key}": ${value} with TTL: ${ttl} seconds`
        );
      } else {
        await redisClient.set(key, value);
        console.log(`Value set for key "${key}": ${value}`);
      }
    } catch (err) {
      console.error("Error setting value in Redis:", err);
    } finally {
      await redisClient.quit();
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      await redisClient.connect();
      const result = await redisClient.del(key);
      if (result === 1) {
        console.log(`Key "${key}" deleted successfully.`);
      } else {
        console.log(`Key "${key}" not found.`);
      }
    } catch (err) {
      console.error("Error deleting value from Redis:", err);
    } finally {
      await redisClient.quit();
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      await redisClient.connect();
      const value = await redisClient.get(key);
      if (value) {
        console.log(`Value retrieved for key "${key}": ${value}`);
      } else {
        console.log(`Key "${key}" not found.`);
      }
      return value;
    } catch (err) {
      console.error("Error retrieving value from Redis:", err);
      return null;
    } finally {
      await redisClient.quit();
    }
  }
}

const RedisManager = new RedisService();
export default RedisManager;
