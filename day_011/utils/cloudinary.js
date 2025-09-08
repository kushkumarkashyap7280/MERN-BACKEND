// day_010 ================== Cloudinary Configuration ==================

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import apiError from "./apiError.js";

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Log Cloudinary configuration for debugging (without revealing the API secret)
console.log("Cloudinary Configuration:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "**set**" : "**missing**",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "**set**" : "**missing**",
});

// Determine resource type based on file extension
const resourceTypeUtility = (filePath) => {
    const extname = path.extname(filePath).toLowerCase();
    if ([".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(extname)) return "video";
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].includes(extname)) return "image";
    if (extname === ".pdf") return "raw"; // PDFs are treated as raw by Cloudinary

    return "raw"; // fallback
};

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local path to the file
 * @param {string} folder - Optional folder name in Cloudinary
 * @param {boolean} autoDelete - Whether to delete local file after upload
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = "", autoDelete = true) => {
    try {
        if (!filePath) throw new apiError(400, "No file path provided", ["filePath"]);

        // Verify the file exists
        if (!fs.existsSync(filePath)) {
            throw new apiError(404, `File not found at path: ${filePath}`, ["filePath"]);
        }

        // Prepare upload options
        const uploadOptions = {
            resource_type: resourceTypeUtility(filePath),
            timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
            use_filename: true,
            unique_filename: true,
        };

        // Add folder if provided
        if (folder) {
            uploadOptions.folder = folder;
        }

        console.log(`Uploading file: ${filePath} to Cloudinary (resource type: ${uploadOptions.resource_type})`);

        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        console.log("Cloudinary upload success:", result.secure_url);
        return result;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);

        // More detailed error logging
        if (error.http_code) {
            console.error(`HTTP Error: ${error.http_code}, Message: ${error.message}`);
        }

        // If error is already an apiError instance, rethrow it
        if (error instanceof apiError) {
            throw error;
        }

        // Otherwise, create a new apiError
        throw new apiError(500, "Failed to upload file to Cloudinary", [error.message || "Unknown error"]);
    } finally {
        // Clean up the local file if autoDelete is true
        if (autoDelete && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log("Local file removed after Cloudinary upload:", filePath);
            } catch (unlinkError) {
                console.error("Failed to delete local file after upload:", filePath, unlinkError);
            }
        }
    }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) throw new apiError(400, "No publicId provided", ["publicId"]);

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        });

        console.log("Cloudinary deletion success for:", publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);

        // If error is already an apiError instance, rethrow it
        if (error instanceof apiError) {
            throw error;
        }

        // Otherwise, create a new apiError
        throw new apiError(500, "Failed to delete file from Cloudinary", [error.message || "Unknown error"]);
    }
};

export { uploadToCloudinary, deleteFromCloudinary };

/*
Example Cloudinary Response:
{
  "public_id": "sample_id",
  "version": 1234567890,
  "signature": "sample_signature",
  "width": 800,
  "height": 600,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2023-01-01T00:00:00Z",
  "url": "http://res.cloudinary.com/demo/image/upload/v1234567890/sample_id.jpg",
  "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_id.jpg",
  "original_filename": "sample"
}
*/

// ========================================================

// ========================================================
