import { z } from "zod/v4";

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_TOO_SHORT_MESSAGE = "Parol kamida 8 ta belgidan iborat bo‘lishi kerak.";

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE);