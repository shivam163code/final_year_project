import { MongoClient, type Db } from "mongodb";
import { getRequiredEnv } from "./env";

declare global {
  var __researchLensMongoClient: MongoClient | undefined;
}

export async function getDatabase(): Promise<Db> {
  const uri = getRequiredEnv("MONGODB_URI");
  const databaseName = getRequiredEnv("MONGODB_DB");
  const client = globalThis.__researchLensMongoClient ?? new MongoClient(uri);
  globalThis.__researchLensMongoClient = client;
  if (!globalThis.__researchLensMongoClient) throw new Error("MongoDB client could not be initialized.");
  await client.connect();
  return client.db(databaseName);
}
