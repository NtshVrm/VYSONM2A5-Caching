import { AppDataSource } from "../db/db.datasource";
import { URLShortener } from "../models/url-shortener.model";
import { Users } from "../models/users.model";
import UserManager from "./users.service";

class URLShortenerService {
  private repository;
  private dataSource;
  private shortCodeLength = 6;
  private characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  constructor() {
    this.dataSource = AppDataSource;
    this.repository = this.dataSource.getRepository(URLShortener);
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

  generateRandomShortCode() {
    return Array.from(
      { length: this.shortCodeLength },
      () => this.characters[Math.floor(Math.random() * this.characters.length)]
    ).join("");
  }

  async getAllUrls(api_key: string): Promise<URLShortener[]> {
    try {
      await this.connectDB();

      const urls = await this.repository.find({
        where: {
          user: {
            api_key: api_key,
          },
        },
        relations: ["user"],
      });
      return urls;
    } catch (err) {
      throw new Error(`Error fetching URL's: ${(err as Error).message}`);
    }
  }

  async checkShortCodeExists(custom_code: string) {
    try {
      await this.connectDB();
      const existingShortCode = await this.repository.findOne({
        where: { short_code: custom_code },
        select: {
          short_code: true,
        },
      });

      return existingShortCode ? true : false;
    } catch (err) {}
  }

  async checkUrlExists(
    long_url: string
  ): Promise<{ short_code: string | null }> {
    try {
      await this.connectDB();
      const existingUrl = await this.repository.findOne({
        where: {
          original_url: long_url,
        },
        select: {
          short_code: true,
        },
      });

      return {
        short_code: existingUrl ? existingUrl.short_code : null,
      };
    } catch (err) {
      throw new Error(
        `Error checking URL existence: ${(err as Error).message}`
      );
    }
  }

  async generateUniqueShortCode(): Promise<string> {
    let shortcode: string = "";
    let exists = true;

    while (exists) {
      shortcode = this.generateRandomShortCode();
      try {
        await this.connectDB();

        const existingCode = await this.checkShortCodeExists(shortcode);

        exists = !!existingCode;
      } catch (err) {
        throw new Error(
          `Error generating unique short code: ${(err as Error).message}`
        );
      }
    }

    return shortcode;
  }

  async createShortCode(
    dataObj: {
      long_url: string;
      expiry_date: string | null;
      custom_code: string | null;
      password: string | null;
    },
    api_key: string
  ): Promise<string | null> {
    try {
      await this.connectDB();

      const new_short_code = dataObj.custom_code
        ? dataObj.custom_code
        : await this.generateUniqueShortCode();

      const userInfo = (await UserManager.getUserByApiKey(api_key)) as Users;

      await this.repository.upsert(
        {
          original_url: dataObj.long_url,
          expiry_date: dataObj.expiry_date || undefined,
          short_code: new_short_code,
          password: dataObj.password,
          user: userInfo,
        },
        {
          conflictPaths: ["short_code"],
          skipUpdateIfNoValuesChanged: true,
        }
      );

      return new_short_code;
    } catch (err) {
      throw new Error(`Error creating short code: ${(err as Error).message}`);
    }
  }

  async findOneRow(short_code: string, api_key: string) {
    try {
      await this.connectDB();

      const row = await this.repository.findOne({
        where: {
          short_code: short_code,
          user: { api_key: api_key },
        },
        relations: ["user"],
      });

      if (!row) {
        return null;
      }

      return row;
    } catch (err) {
      throw new Error(`Error fetching find by one: ${(err as Error).message}`);
    }
  }

  async handleRedirect(short_code: string, api_key: string) {
    try {
      const row = await this.findOneRow(short_code, api_key);
      if (!row || (row.expiry_date != null && row.expiry_date < new Date())) {
        return {
          original_url: row?.original_url,
          password: row?.password,
          expired: true,
        };
      }

      const res = await this.repository.update(row.id, {
        visit_count: row.visit_count + 1,
        last_accessed_at: new Date(),
      });

      return res.affected && res.affected > 0
        ? {
            original_url: row?.original_url,
            password: row?.password,
            expired: false,
          }
        : { original_url: null, password: null, expired: false };
    } catch (err) {
      throw new Error(`Error redirecting: ${(err as Error).message}`);
    }
  }

  async deleteShortCode(short_code: string, api_key: string) {
    try {
      await this.connectDB();

      const row = await this.findOneRow(short_code, api_key);
      if (!row || (row.expiry_date != null && row.expiry_date < new Date())) {
        return { short_code: row?.short_code, expired: true };
      }

      const res = await this.repository.update(row.id, {
        expiry_date: new Date(),
      });

      return res.affected && res.affected > 0
        ? { short_code: row?.short_code, expired: false }
        : { short_code: null, expired: true };
    } catch (err) {
      throw new Error(`Error deleting short code: ${(err as Error).message}`);
    }
  }
}

const URLShortenerManager = new URLShortenerService();
export default URLShortenerManager;
