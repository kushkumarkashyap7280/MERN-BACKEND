// day_007 ---------------------------------------------------------
import express from "express";
import cookieParser from "cookie-parser";
import serveStaticFiles from "../utils/staticFiles.js";
import cors from "cors";
import fs from "fs";

const app = express();

// Apply CORS middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

serveStaticFiles(app);

app.use(cookieParser());

// day_010 -----------------------------------------------------
import userRouter from "../routes/user.routes.js";
import apiError from "../utils/apiError.js";


// User routes - one flexible endpoint that handles all profile update cases
app.use("/api/v1/users", userRouter);

// Routes will be like:
// http://localhost:3000/api/v1/users/register

// day_010 ----------------------------------------------

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Error encountered:", err);

    // Check if request had files uploaded and clean them up
    if (req.files) {
        const filesToDelete = [];

        // Collect file paths from all files in req.files
        Object.values(req.files).forEach((fileArray) => {
            fileArray.forEach((file) => {
                if (file && file.path) {
                    filesToDelete.push(file.path);
                }
            });
        });

        // Delete all collected files
        if (filesToDelete.length > 0) {
            filesToDelete.forEach((filePath) => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Cleaned up temporary file: ${filePath}`);
                    }
                } catch (unlinkErr) {
                    console.error(`Failed to delete temp file: ${filePath}`, unlinkErr);
                }
            });
            console.log(`Cleaned up ${filesToDelete.length} temporary files after error`);
        }
    }

    // Create standardized error response using apiError class
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    const errors = err.errors || [];

    // If err is already an instance of apiError, use it directly
    if (err instanceof apiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            data: err.data,
            message: err.message,
            success: err.success,
            errors: err.errors,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
    }

    // Otherwise, create a new apiError instance with all parameters
    const errorResponse = new apiError(
        statusCode,
        message,
        errors,
        err.stack // Pass the original error stack if available
    );

    // Send response
    return res.status(statusCode).json({
        statusCode: errorResponse.statusCode,
        data: errorResponse.data,
        message: errorResponse.message,
        success: errorResponse.success,
        errors: errorResponse.errors,
        stack: errorResponse.stack 
    });
});

// -------------------------------------------------------------

export default app;
