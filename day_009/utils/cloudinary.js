// day_009 ================== Cloudinary Configuration ==================


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const resourceTypeUtility = (filePath) => {
    const extname = path.extname(filePath).toLowerCase();
    if ([".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(extname)) return "video";
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].includes(extname)) return "image";
    if (extname === ".pdf") return "raw"; // PDFs are treated as raw by Cloudinary

    return "raw"; // fallback
};

const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) throw new Error("No file path provided");
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: resourceTypeUtility(filePath),
        });
        return result;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

const deleteToCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) throw new Error("No publicId provided");
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
    }
};

export { uploadToCloudinary, deleteToCloudinary };

// console.log(result);

// output :

/*
{
  "public_id": "sample_id",
  "version": 1234567890,
  "signature": "sample_signature",
  "width": 800,
  "height": 600,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2023-01-01T00:00:00Z",
  "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_id.jpg",
  "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_id.jpg",
  "original_filename": "sample"
}
*/


// ========================================================