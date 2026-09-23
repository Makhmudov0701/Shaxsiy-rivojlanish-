import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { logger } from "../lib/logger";

export function getRequestUserId(req: Parameters<RequestHandler>[0]): string | undefined {
  const auth = getAuth(req);
  return auth?.userId ?? undefined;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getRequestUserId(req);
  if (!userId) {
    logger.warn(
      {
        method: req.method,
        url: req.originalUrl,
      },
      "Unauthenticated API request",
    );
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.locals.userId = userId;
  next();
};