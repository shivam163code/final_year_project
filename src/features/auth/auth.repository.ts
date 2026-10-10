import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { PublicUser } from "./auth.types";

type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type SessionDocument = {
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
};

let indexesReady = false;

async function collections() {
  const database = await getDatabase();
  const users = database.collection<UserDocument>("users");
  const sessions = database.collection<SessionDocument>("sessions");
  if (!indexesReady) {
    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
    indexesReady = true;
  }
  return { users, sessions };
}

function publicUser(user: UserDocument): PublicUser {
  return { id: user._id.toHexString(), name: user.name, email: user.email };
}

export async function findUserByEmail(email: string) {
  const { users } = await collections();
  return users.findOne({ email });
}

export async function createUser(name: string, email: string, passwordHash: string) {
  const { users } = await collections();
  const result = await users.insertOne({ _id: new ObjectId(), name, email, passwordHash, createdAt: new Date() });
  return { id: result.insertedId.toHexString(), name, email };
}

export async function createSession(userId: string, expiresAt: Date) {
  const { sessions } = await collections();
  const token = crypto.randomUUID() + crypto.randomUUID();
  await sessions.insertOne({ _id: token, userId: new ObjectId(userId), expiresAt });
  return token;
}

export async function findUserBySession(token: string) {
  if (!token) return null;
  const { sessions, users } = await collections();
  const session = await sessions.findOne({ _id: token, expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await users.findOne({ _id: session.userId });
  return user ? publicUser(user) : null;
}

export async function deleteSession(token: string) {
  if (!token) return;
  const { sessions } = await collections();
  await sessions.deleteOne({ _id: token });
}

export function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && "code" in error && error.code === 11000;
}
