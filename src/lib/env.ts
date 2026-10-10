export function getRequiredEnv(name: "MONGODB_URI" | "MONGODB_DB") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
