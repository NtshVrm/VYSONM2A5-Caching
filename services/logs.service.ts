import { Request } from "express";
import { AppDataSource } from "../db/db.datasource";
import { Logs } from "../models/logs.model";

class LogService {
  private repository;
  private dataSource;

  constructor() {
    this.dataSource = AppDataSource;
    this.repository = this.dataSource.getRepository(Logs);
  }

  async connectDB() {
    try {
      if (!this.dataSource.isInitialized) {
        console.log("connecting to DB....");
        await this.dataSource.initialize();
      }
      console.log("DB Connected!");
      return this.dataSource;
    } catch (err) {
      console.log("Error connecting to DB", err);
    }
  }

  async getAllLogs(): Promise<Logs[]> {
    try {
      await this.connectDB();

      const urls = await this.repository.find();
      return urls;
    } catch (err) {
      throw new Error(`Error fetching logs's: ${(err as Error).message}`);
    }
  }

  async addNewLog(logObj: {
    timestamp: Date;
    url: string;
    method: string;
    "user-agent": string;
    ip: string;
  }) {
    try {
      await this.connectDB();
      const log = this.repository.create(logObj);

      const saved = await this.repository.save(log);
      return saved;
    } catch (err) {
      throw new Error(`Error writing logs to DB's: ${(err as Error).message}`);
    }
  }
}

const LogManager = new LogService();
export default LogManager;
