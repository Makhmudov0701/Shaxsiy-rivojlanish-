import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export function getRequestUserId(req: Parameters<RequestHandler>[0]): string | undefined {
  const auth = getAuth(req);
  return auth?.userId ?? undefined;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getRequestUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.locals.userId = userId;
  next();
};