import { redisClient } from "../db/redis.datasource";

class RedisService {
  private isConnected = false;
  
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await redisClient.connect();
        this.isConnected = true;
      } catch (err) {
        if (!(err instanceof Error) || !err.message.includes("Socket already opened")) {
          throw err;
        }
        // If the error is "Socket already opened", we're already connected
        this.isConnected = true;
      }
    }
  }

  async setValue(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
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
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await redisClient.del(key);
      if (result === 1) {
        console.log(`Key "${key}" deleted successfully.`);
      } else {
        console.log(`Key "${key}" not found.`);
      }
    } catch (err) {
      console.error("Error deleting value from Redis:", err);
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
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
    }
  }
  
  async renameKey(oldKey: string, newKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      const value = await redisClient.get(oldKey);
      
      if (value !== null) {
        await redisClient.set(newKey, value);
        console.log(`Key "${oldKey}" renamed to "${newKey}" with value: ${value}`);
        
        // Optionally delete the old key
        await redisClient.del(oldKey);
      } else {
        console.log(`Key "${oldKey}" not found.`);
      }
    } catch (err) {
      console.error("Error renaming key in Redis:", err);
    }
  }
}

const RedisManager = new RedisService();
export default RedisManager;
