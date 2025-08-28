// day_009 ================== Multer Configuration ==================

import multer from "multer";
import path from "path";

// Configure simple storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Choose destination based on file type
        let uploadDir = "uploads/files";

        if (file.mimetype.startsWith("image/")) {
            uploadDir = "uploads/images";
        } else if (file.mimetype.startsWith("video/")) {
            uploadDir = "uploads/media";
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp + original name
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    },
});

// Simple file size limits
const limits = {
    fileSize: 50 * 1024 * 1024, // 50MB
};

// Create the multer upload instances
const upload = multer({
    storage,
    limits,
});

// Export specific upload functions
export const uploadSingle = upload.single("file");
export const uploadImage = upload.single("image");
export const uploadVideo = upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);

export default upload;


/*
{
  fieldname: "file",          // name of the input in form
  originalname: "mypic.jpg",  // actual file name on client
  encoding: "7bit",
  mimetype: "image/jpeg",     // type of file
  size: 102400,               // size in bytes
  destination: "uploads/images",
  filename: "1693234323-123456789.jpg", // renamed by multer
  path: "uploads/images/1693234323-123456789.jpg"
}

*/

// ========================================================