/**
 * MongoDB restore script
 * Imports JSON files from a backup folder into the database.
 *
 * Run: node src/scripts/restoreDb.js <backup-folder>
 * Example: node src/scripts/restoreDb.js backups/2025-02-17_12-30-00
 *
 * WARNING: By default this ADDS to existing data. To replace the DB,
 * delete collections first or use a fresh database.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const backupFolder = process.argv[2];
if (!backupFolder) {
  console.error("Usage: node src/scripts/restoreDb.js <backup-folder>");
  console.error("Example: node src/scripts/restoreDb.js backups/2025-02-17_12-30-00");
  process.exit(1);
}

const backupPath = path.isAbsolute(backupFolder)
  ? backupFolder
  : path.join(__dirname, "../..", backupFolder);

if (!fs.existsSync(backupPath)) {
  console.error("❌ Backup folder not found:", backupPath);
  process.exit(1);
}

async function restoreDb() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const files = fs.readdirSync(backupPath).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
    let totalRestored = 0;

    for (const file of files) {
      const colName = path.basename(file, ".json");
      const filePath = path.join(backupPath, file);
      const content = fs.readFileSync(filePath, "utf8");
      const docs = JSON.parse(content);
      if (!Array.isArray(docs) || docs.length === 0) {
        console.log(`  ⏭ ${colName}: no documents`);
        continue;
      }
      const col = db.collection(colName);
      await col.insertMany(docs);
      totalRestored += docs.length;
      console.log(`  ✓ ${colName}: ${docs.length} documents restored`);
    }

    console.log("\n✅ Restore done. Total documents:", totalRestored);
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

restoreDb();
