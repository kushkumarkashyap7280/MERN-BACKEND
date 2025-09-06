// day_010 ---------------------------------------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go from utils/ → project root
const rootDir = path.join(__dirname, "../");

// Upload directories to serve and clean
const uploadDirs = [
    path.join(rootDir, "uploads/images"),
    path.join(rootDir, "uploads/files"),
    path.join(rootDir, "uploads/media"),
    path.join(rootDir, "uploads/temp"),
];

// Files/patterns to preserve (won't be deleted)
const preservePatterns = [".git", ".gitignore", ".gitkeep", "README.md"];

// Function to clear temp uploads
export async function clearTempUploads() {
    const tempDir = path.join(rootDir, "uploads/temp");

    try {
        if (!existsSync(tempDir)) {
            await fs.mkdir(tempDir, { recursive: true });
            console.log(`Created directory: ${tempDir}`);
            return;
        }

        const files = await fs.readdir(tempDir);

        // Skip files that match preserve patterns
        const filesToDelete = files.filter((file) => !preservePatterns.some((pattern) => file.includes(pattern)));

        await Promise.all(
            filesToDelete.map((file) =>
                fs.unlink(path.join(tempDir, file)).catch((err) => console.error(`Failed to delete ${file}:`, err))
            )
        );

        console.log(`Cleared temporary uploads in uploads/temp`);
    } catch (error) {
        console.error("Error clearing temp uploads:", error);
    }
}

// Serve static upload folders
export default function serveStaticFiles(app) {
    // Create directories if they don't exist
    for (const dir of uploadDirs) {
        if (!existsSync(dir)) {
            fs.mkdir(dir, { recursive: true })
                .then(() => console.log(`Created directory: ${dir}`))
                .catch((err) => console.error(`Error creating directory ${dir}:`, err));
        }
    }

    // Serve the static files
    app.use("/uploads/images", express.static(path.join(rootDir, "uploads/images")));
    app.use("/uploads/files", express.static(path.join(rootDir, "uploads/files")));
    app.use("/uploads/media", express.static(path.join(rootDir, "uploads/media")));
    app.use("/uploads/temp", express.static(path.join(rootDir, "uploads/temp")));
}
