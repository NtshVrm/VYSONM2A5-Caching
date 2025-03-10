import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: Users; // Add the user property to the Request interface
  }
}
import URLShortenerManager from "./services/url-shortener.service";
import { responseJson } from "./utils/response.util";
import LogManager from "./services/logs.service";

import responseTime from "response-time";
import {
  authenticationMiddleware,
  authorisationMiddleware,
  blacklistMiddleware,
  loggingMiddleware,
} from "./middleware";
import { Users } from "./models/users.model";

const app = express();
app.use(express.json());

app.use(responseTime());

app.use((req: Request, res: Response, next: NextFunction) => {
  blacklistMiddleware(req, res, next);
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await authenticationMiddleware(req, res, next);
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await authorisationMiddleware(req, res, next);
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await loggingMiddleware(req, res, next);
});

app.get("/", (req, res) => {
  res.status(200).json({ status: 200 });
});

app.get("/logs", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const allData = await LogManager.getAllLogs();
      return res.json(allData);
    } catch (err) {
      next(err);
    }
  })();
});

app.get("/list", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const apiKey = req.headers["api-key"] as string;
      const allData = await URLShortenerManager.getAllUrls(apiKey);
      return res.json(allData);
    } catch (err) {
      next(err);
    }
  })();
});

app.get("/redirect", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const shortcode = req.query.code as string | undefined;
      const password = req.query.password as string | undefined;
      if (!shortcode) {
        return res.status(400).json(responseJson.shortCodeRequired);
      }

      const apiKey = req.headers["api-key"] as string;

      let redirectData = await URLShortenerManager.handleRedirect(
        shortcode,
        apiKey
      );

      if (
        redirectData.original_url &&
        redirectData.password &&
        password == undefined
      ) {
        return res.status(403).json(responseJson.needsPassword);
      }

      if (
        redirectData.original_url &&
        redirectData.password &&
        password !== redirectData.password
      ) {
        return res.status(403).json(responseJson.incorrectPassword);
      }

      if (redirectData.original_url && redirectData.expired) {
        return res.status(410).json(responseJson.shortCodeExpired);
      }

      return redirectData.original_url
        ? res.status(302).redirect(redirectData.original_url)
        : res.status(404).json(responseJson.shortCodeNotFound);
    } catch (err) {
      next(err);
    }
  })();
});

app.post("/shorten", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const {
        long_url,
        expiry_date,
        custom_code,
        password,
      }: {
        long_url: string | null;
        expiry_date: string | null;
        custom_code: string | null;
        password: string | null;
      } = req.body
        ? req.body
        : {
            long_url: null,
            expiry_date: null,
            custom_code: null,
            password: null,
          };

      const apiKey = req.headers["api-key"] as string;

      if (!long_url) {
        return res.status(400).json(responseJson.originalUrlRequired);
      }

      if (custom_code != null && custom_code == "") {
        return res.status(400).json(responseJson.customCodeEmpty);
      }

      if (password != null && password == "") {
        return res.status(400).json(responseJson.passwordEmpty);
      }

      if (custom_code) {
        const exists =
          await URLShortenerManager.checkShortCodeExists(custom_code);
        if (exists) {
          return res.status(400).json(responseJson.shortCodeExists);
        }
      }
      const newShortCode = await URLShortenerManager.createShortCode(
        {
          long_url: long_url,
          expiry_date: expiry_date,
          custom_code: custom_code,
          password: password,
        },
        apiKey
      );
      return res.status(201).json({
        statusCode: 201,
        short_code: newShortCode,
        expiry_date: expiry_date || null,
      });
    } catch (err) {
      next(err);
    }
  })();
});

app.put(
  "/code/:shortCode",
  (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      const shortCode = req.params.shortCode;
      const {
        expiry_date,
        password,
      }: {
        expiry_date: string | null;
        password: string | null;
      } = req.body ? req.body : { expiry_date: null };

      if (!shortCode) {
        return res.status(400).json(responseJson.shortCodeRequired);
      }

      if (password != null && password == "") {
        return res.status(400).json(responseJson.passwordEmpty);
      }

      const apiKey = req.headers["api-key"] as string;

      const row = await URLShortenerManager.findOneRow(shortCode, apiKey);

      if (row) {
        const updatedData = await URLShortenerManager.createShortCode(
          {
            long_url: row?.original_url,
            custom_code: row?.short_code,
            expiry_date: expiry_date,
            password: password,
          },
          apiKey
        );

        return res
          .status(201)
          .json({ statusCode: 200, short_code: updatedData });
      } else {
        return res.status(400).json(responseJson.shortCodeNotFound);
      }
    })();
  }
);

app.post("/shorten-bulk", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const {
        long_urls,
        password,
      }: {
        long_urls: string[] | [];
        password: string | null;
      } = req.body ? req.body : { long_urls: [] };

      const apiKey = req.headers["api-key"] as string;

      let batch: { original_url: string; short_code: string | null }[] = [];

      if (!long_urls || long_urls.length == 0) {
        return res.status(400).json(responseJson.originalUrlRequired);
      }

      if (password != null && password == "") {
        return res.status(400).json(responseJson.passwordEmpty);
      }

      batch = await Promise.all(
        long_urls.map(async (long_url) => {
          const newShortCode = await URLShortenerManager.createShortCode(
            {
              long_url,
              expiry_date: null,
              custom_code: null,
              password: password,
            },
            apiKey
          );
          return { original_url: long_url, short_code: newShortCode };
        })
      );

      return res.status(201).json({ statusCode: 201, batch });
    } catch (err) {}
  })();
});

app.delete("/delete", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { short_code } = req.body ? req.body : { short_code: null };
      if (!short_code) {
        return res.status(400).json(responseJson.shortCodeRequired);
      }

      const apiKey = req.headers["api-key"] as string;

      const deletedObj = await URLShortenerManager.deleteShortCode(
        short_code,
        apiKey
      );

      if (deletedObj.short_code && deletedObj.expired) {
        return res.status(410).json(responseJson.shortCodeExpired);
      }

      return short_code == deletedObj.short_code
        ? res.status(200).json(responseJson.deleteSuccess(short_code))
        : res.status(404).json(responseJson.shortCodeNotFound);
    } catch (err) {
      next(err);
    }
  })();
});

export default app;
