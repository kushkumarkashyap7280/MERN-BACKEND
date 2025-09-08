import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    generateNewTokens,
    getUserProfile,
    changePassword,
    updateUserProfile,
    getUserChannel,
    getSubscribedChannels,
} from "../controllers/user.controller.js";
import { createUploader } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

// IMPORTANT: For routes with file uploads, we ONLY use multer
// and DO NOT add any other body parser middleware
router.post(
    "/register",
    createUploader(["image/jpeg", "image/png", "image/gif"], 5).fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

// For routes without file uploads, use normal body parsing
// Example of a route that would use JSON parsing
// router.post("/login", jsonParser, handleLogin);

// http://localhost:3000/api/v1/users/register

// Example of how to use the dynamic uploader if needed:
// const documentUploader = createUploader(['application/pdf', 'application/msword'], 10); // 10MB PDFs and DOCs
// router.post("/upload-documents", documentUploader.array('documents', 5), handleDocumentUpload);

// login route
router.post("/login", loginUser);

// get user profile
router.get("/profile", verifyJWT, getUserProfile);

// change password
router.post("/change-password", verifyJWT, changePassword);

router.post("/logout", verifyJWT, logoutUser);

// update user profile
router.patch(
    "/profile",
    verifyJWT,
    createUploader(["image/jpeg", "image/png", "image/gif"], 5).fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    updateUserProfile
);

// token refresh
router.post("/token", generateNewTokens);

// Get user channel by username
router.get("/channel/:userName", getUserChannel);

// Get all channels that the authenticated user is subscribed to
router.get("/subscriptions", verifyJWT, getSubscribedChannels);

export default router;
