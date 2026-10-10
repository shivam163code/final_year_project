import { getDatabase } from "@/lib/mongodb";
import type { Paper } from "./paper.types";

type SavedPaperDocument = Paper & { userId: string; savedAt: Date };

async function savedCollection() {
  const collection = (await getDatabase()).collection<SavedPaperDocument>("saved_papers");
  await collection.createIndex({ userId: 1, id: 1 }, { unique: true });
  return collection;
}

export async function listSavedPapers(userId: string) {
  const collection = await savedCollection();
  return collection.find({ userId }).sort({ savedAt: -1 }).project({ userId: 0, savedAt: 0 }).toArray();
}

export async function savePaper(userId: string, paper: Paper) {
  const collection = await savedCollection();
  await collection.updateOne(
    { userId, id: paper.id },
    { $setOnInsert: { ...paper, userId, savedAt: new Date() } },
    { upsert: true },
  );
  return paper;
}

export async function unsavePaper(userId: string, id: string) {
  const collection = await savedCollection();
  const result = await collection.deleteOne({ userId, id });
  return result.deletedCount === 1;
}
