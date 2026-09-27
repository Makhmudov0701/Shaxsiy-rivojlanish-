export function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.EXTERNAL_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "Set EXTERNAL_DATABASE_URL for an external PostgreSQL database or DATABASE_URL for the managed database.",
    );
  }

  return databaseUrl;
}