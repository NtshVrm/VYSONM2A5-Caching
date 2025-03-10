import { AppDataSource } from "../db/db.datasource";
import { Users } from "../models/users.model";

class UserService {
  private repository;
  private dataSource;

  constructor() {
    this.dataSource = AppDataSource;
    this.repository = this.dataSource.getRepository(Users);
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

  async getAllUsers(): Promise<Users[]> {
    try {
      await this.connectDB();

      const urls = await this.repository.find();
      return urls;
    } catch (err) {
      throw new Error(`Error fetching URL's: ${(err as Error).message}`);
    }
  }

  async getUserByApiKey(api_key: string) {
    try {
      await this.connectDB();

      const userInfo = await this.repository.findOne({
        where: {
          api_key: api_key,
        },
      });
      return userInfo;
    } catch (err) {
      throw new Error(`Error fetching User Info: ${(err as Error).message}`);
    }
  }
}

const UserManager = new UserService();
export default UserManager;
