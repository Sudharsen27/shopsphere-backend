/**
 * MongoDB backup script
 * Exports all collections to JSON files in backups/<timestamp>/
 *
 * Run: node src/scripts/backupDb.js
 * Requires: MONGO_URI in .env
 *
 * Store the backups/ folder elsewhere (Google Drive, OneDrive, USB) so if
 * MongoDB is deleted you can restore with: node src/scripts/restoreDb.js backups/2025-02-17_12-30-00
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const BACKUPS_DIR = path.join(__dirname, "../../backups");

async function backupDb() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupDir = path.join(BACKUPS_DIR, timestamp);

    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    fs.mkdirSync(backupDir, { recursive: true });

    const collections = await db.listCollections().toArray();
    let totalDocs = 0;
    const counts = [];

    for (const { name } of collections) {
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      const filePath = path.join(backupDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf8");
      const n = docs.length;
      totalDocs += n;
      counts.push({ name, count: n });
      console.log(`  ✓ ${name}: ${n} documents`);
    }

    const meta = {
      database: dbName,
      backupAt: new Date().toISOString(),
      collections: collections.map((c) => c.name),
      totalDocuments: totalDocs,
    };
    fs.writeFileSync(path.join(backupDir, "_meta.json"), JSON.stringify(meta, null, 2), "utf8");

    // Notepad-friendly summary so you can check "all data backed up"
    const summaryLines = [
      "============================================",
      "  SHOPSPHERE DATABASE BACKUP SUMMARY",
      "============================================",
      "",
      "Backup date & time: " + new Date().toISOString(),
      "Database name:      " + dbName,
      "",
      "--------------------------------------------",
      "  WHAT WAS BACKED UP (check these counts)",
      "--------------------------------------------",
      "",
    ];
    for (const { name, count } of counts) {
      summaryLines.push("  " + name + ": " + count + " documents  --> file: " + name + ".json");
    }
    summaryLines.push("");
    summaryLines.push("  TOTAL: " + totalDocs + " documents in " + collections.length + " collections");
    summaryLines.push("");
    summaryLines.push("--------------------------------------------");
    summaryLines.push("  HOW TO CHECK ALL DATA IS HERE");
    summaryLines.push("--------------------------------------------");
    summaryLines.push("  1. Open this folder - you should see one .json file per line above.");
    summaryLines.push("  2. Each .json file should exist and not be empty (open in Notepad to peek).");
    summaryLines.push("  3. Compare document counts above with what you expect (e.g. number of users, products).");
    summaryLines.push("");
    summaryLines.push("--------------------------------------------");
    summaryLines.push("  HOW TO RESTORE LATER");
    summaryLines.push("--------------------------------------------");
    summaryLines.push("  From shopsphere-backend folder run:");
    summaryLines.push("  node src/scripts/restoreDb.js backups/" + timestamp);
    summaryLines.push("");
    summaryLines.push("  (Replace the folder name with this backup's folder name.)");
    summaryLines.push("============================================");
    fs.writeFileSync(path.join(backupDir, "BACKUP_SUMMARY.txt"), summaryLines.join("\r\n"), "utf8");

    console.log("\n✅ Backup done:", backupDir);
    console.log(`   ${collections.length} collections, ${totalDocs} documents`);
    console.log("\n💡 Copy the backups/ folder to Google Drive, OneDrive, or USB so you can restore later.");
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

backupDb();
