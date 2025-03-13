import { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { responseJson } from "./utils/response.util";
import UserManager from "./services/users.service";
import LogManager from "./services/logs.service";
import redisService from "./services/redis.service";
import RedisManager from "./services/redis.service";

export const blacklistMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  (() => {
    const blacklistPath = path.join(__dirname, "blacklist.json");
    let blacklistedKeys;

    try {
      const data = fs.readFileSync(blacklistPath, "utf8");
      blacklistedKeys = JSON.parse(data).blacklistedKeys;

      const apiKey = req.headers["api-key"];

      if (blacklistedKeys.includes(apiKey)) {
        return res.status(403).json({
          status: 403,
          error: "Access denied: API key is blacklisted.",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: error ? (error as Error).message : "BL: Internal Server Error",
      });
    }
  })();
};
export const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["api-key"] as string;

  if (!apiKey) {
    return res.status(403).json(responseJson.apiKeyRequired);
  }

  try {
    const userInfo = await UserManager.getUserByApiKey(apiKey);

    if (!userInfo) {
      console.log("not found user:", apiKey);
      return res.status(404).json(responseJson.userNotFound);
    }

    // setting user to req
    req.user = userInfo;

    next();
  } catch (error) {
    return res.status(500).json({
      error: error ? (error as Error).message : "Auth: Internal Server Error",
    });
  }
};

export const authorisationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // reading user info from request
    const { user } = req;

    if (req.url == "/shorten-bulk" && user?.tier != "enterprise") {
      return res.status(403).json(responseJson.accessDenied);
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: error ? (error as Error).message : "Auth: Internal Server Error",
    });
  }
};

export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.ip || req.ips.join(", ") || req.socket.remoteAddress || "";
  const logObj = {
    timestamp: new Date(),
    method: req.method || "",
    url: req.url || "",
    "user-agent": req.headers["user-agent"] || "",
    ip: ip,
  };

  try {
    const savedLog = await LogManager.addNewLog(logObj);
    console.log(savedLog);
  } catch (err) {
    console.error("could not save log", err);
  }

  next();
};
