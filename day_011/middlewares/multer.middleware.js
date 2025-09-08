import multer from "multer";
import path from "path";
import fs from "fs";
import apiError from "../utils/apiError.js";

// Create uploads/temp directory if it doesn't exist
const uploadDir = path.resolve("uploads/temp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const filename = uniqueSuffix + ext;
        cb(null, filename);
    },
});

const createFileFilter = (allowedTypes) => (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
        // Just throw the error, global error handler will clean up files
        cb(new apiError(400, `Unsupported file format. Allowed: ${allowedTypes.join(", ")}`, ["file_format"]), false);
    } else {
        cb(null, true);
    }
};

export const createUploader = (allowedTypes, maxSizeMB) => {
    return multer({
        storage,
        fileFilter: createFileFilter(allowedTypes),
        limits: { fileSize: maxSizeMB * 1024 * 1024 }, // in bytes
    });
};
