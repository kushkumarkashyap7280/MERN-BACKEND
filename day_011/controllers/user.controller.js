import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiRes from "../utils/apiRes.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ValidateUser } from "../utils/validation.js";

/**
 * Register a new user with profile image uploads
 */
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, userName, email, password } = req.body;

    // Check for required fields for registration
    if (!fullName || !password || (!userName && !email)) {
        throw new apiError(400, "Please provide all required fields", [
            ...(!fullName ? ["fullName"] : []),
            ...(!userName ? ["userName"] : []),
            ...(!email ? ["email"] : []),
            ...(!password ? ["password"] : []),
        ]);
    }

    // Validate the fields that are provided
    ValidateUser(req.body);

    console.log("Extracted data:", { fullName, userName, email, password: "***" });

    // Check if files were uploaded
    if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
        throw new apiError(400, "Avatar is required", ["avatar"]);
    }

    // Check if user exists
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (existingUser) {
        throw new apiError(400, "User already exists", [existingUser.userName === userName ? "userName" : "email"]);
    }

    // Upload avatar to Cloudinary
    const avatarLocalPath = req.files.avatar[0].path;
    const avatar = await uploadToCloudinary(
        avatarLocalPath,
        "mern-backend/avatars",
        true // Auto-delete the local file after successful upload
    );

    if (!avatar) {
        throw new apiError(500, "Avatar upload failed", ["avatar"]);
    }

    // Upload cover image if provided
    let coverImage = null;
    if (req.files.coverImage && req.files.coverImage[0]) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        coverImage = await uploadToCloudinary(
            coverImageLocalPath,
            "mern-backend/covers",
            true // Auto-delete the local file after successful upload
        );
    }

    // Create user in database
    const user = await User.create({
        fullName,
        userName,
        email,
        password,
        avatar: avatar.secure_url,
        avatarId: avatar.public_id,
        ...(coverImage && {
            coverImage: coverImage.secure_url,
            coverImageId: coverImage.public_id,
        }),
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    // Send success response using apiRes
    return res.status(201).json(new apiRes(201, { user: userResponse }, "User registered successfully"));
});

// login user
const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    // Check for required fields
    if ((!userName && !email) || !password) {
        throw new apiError(400, "Please provide all required fields", [
            ...(!userName && !email ? ["userName or email"] : []),
            ...(!password ? ["password"] : []),
        ]);
    }

    // Find user by username or email
    const user = await User.findOne({
        ...(userName ? { userName } : {}),
        ...(email ? { email } : {}),
    });

    if (!user || !(await user.isPasswordMatch(password))) {
        throw new apiError(401, "Invalid credentials", [
            ...(!user ? ["userName or email"] : []),
            ...(user && !(await user.isPasswordMatch(password)) ? ["password"] : []),
        ]);
    }

    // Generate tokens
    const accessToken = user.generateJwtToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set both tokens in cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes for access token
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });

    // Remove sensitive fields before sending response
    const { password: _, refreshToken: __, ...userData } = user.toObject();

    // Send only user info in response body
    return res.status(200).json(new apiRes(200, { user: userData }, "User logged in successfully"));
});

// logout user
const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Invalidate refresh token
    await User.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });

    // Clear cookies
    res.cookie("accessToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 0,
    });

    res.cookie("refreshToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 0,
    });

    return res.status(200).json(new apiRes(200, null, "User logged out successfully"));
});

// generate new access and refresh tokens
// purporse: when access token expires, we can use refresh token to get new access token
const generateNewTokens = asyncHandler(async (req, res) => {
    const { refreshToken: refreshTokenFromCookie } = req.cookies;

    if (!refreshTokenFromCookie) {
        throw new apiError(401, "Refresh token is missing");
    }

    try {
        // Verify refresh token with correct secret
        const decoded = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshTokenFromCookie) {
            throw new apiError(401, "Invalid refresh token");
        }

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        // Save new refresh token in DB
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Set cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return minimal user info
        const { password: _, refreshToken: __, ...userData } = user.toObject();

        return res.status(200).json(new apiRes(200, { user: userData }, "Tokens refreshed successfully"));
    } catch (error) {
        throw new apiError(401, "Invalid refresh token");
    }
});

// change the password of user

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
        throw new apiError(400, "Old password and new password are required");
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    // Check if old password is correct
    const isMatch = await user.isPasswordMatch(oldPassword);
    if (!isMatch) {
        throw new apiError(401, "Old password is incorrect");
    }

    // Change password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new apiRes(200, null, "Password changed successfully"));
});

// get user profile
const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    // Return user profile
    const { password: _, refreshToken: __, ...userData } = user.toObject();
    return res.status(200).json(new apiRes(200, { user: userData }, "User profile fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    ValidateUser(req.body);

    const { fullName, userName, email } = req.body;

    // find user from db
    const user = await User.findById(userId);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    if (req.files) {
        if (req.files.avatar && req.files.avatar[0]) {
            // delete old avatar from cloudinary
            if (user.avatarId) {
                await deleteFromCloudinary(user.avatarId);
            }
            // upload new avatar
            const avatar = await uploadToCloudinary(req.files.avatar[0].path);
            user.avatar = avatar.secure_url;
            user.avatarId = avatar.public_id;
        }

        if (req.files.coverImage && req.files.coverImage[0]) {
            // delete old cover image from cloudinary
            if (user.coverImageId) {
                await deleteFromCloudinary(user.coverImageId);
            }
            // upload new cover image
            const coverImage = await uploadToCloudinary(req.files.coverImage[0].path);
            user.coverImage = coverImage.secure_url;
            user.coverImageId = coverImage.public_id;
        }
    }

    // Update user profile
    user.fullName = fullName || user.fullName;
    user.userName = userName || user.userName;
    user.email = email || user.email;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new apiRes(200, { user }, "User profile updated successfully"));
});

// get user channel by unsername in params

const getUserChannel = asyncHandler(async (req, res) => {
    const { userName } = req.params;
    if (!userName) {
        throw new apiError(400, "Username is required", ["userName"]);
    }

    // Use aggregation to get user info along with subscriber and subscription counts
    const channel = await User.aggregate([
        // Match the user by username
        {
            $match: {
                userName: userName.toLowerCase(),
            },
        },
        // Remove sensitive fields
        {
            $project: {
                password: 0,
                refreshToken: 0,
            },
        },
        // Lookup to count subscribers (users who have subscribed to this channel)
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        // Lookup to count subscriptions (channels this user has subscribed to)
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        // Add fields for subscriber and subscription counts
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        // Lookup to get videos published by this user
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    // Only include published videos
                    {
                        $match: {
                            isPublished: true,
                        },
                    },
                    // Project only needed fields from videos
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        // Add field for video count
        {
            $addFields: {
                videoCount: { $size: "$videos" },
                // Calculate total views across all videos
                totalViews: { $sum: "$videos.views" },
            },
        },
        // Project final fields to return
        {
            $project: {
                _id: 1,
                userName: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                videoCount: 1,
                totalViews: 1,
                createdAt: 1,
                videos: {
                    $slice: ["$videos", 0, 6], // Return only first 6 videos
                },
            },
        },
    ]);

    if (!channel || channel.length === 0) {
        throw new apiError(404, "Channel not found");
    }

    return res.status(200).json(new apiRes(200, { channel: channel[0] }, "User channel fetched successfully"));
});

// Get all channels that a user is subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    // Find all channels the user is subscribed to with detailed information
    const subscribedChannels = await User.aggregate([
        // First get all subscriptions of the user
        {
            $lookup: {
                from: "subscriptions",
                let: { userId: userId },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$subscriber", "$$userId"],
                            },
                        },
                    },
                ],
                as: "userSubscriptions",
            },
        },
        // Unwind the subscriptions to process each individually
        {
            $unwind: "$userSubscriptions",
        },
        // Now get each channel's information
        {
            $lookup: {
                from: "users",
                localField: "userSubscriptions.channel",
                foreignField: "_id",
                as: "channelInfo",
            },
        },
        // Unwind the channel info
        {
            $unwind: "$channelInfo",
        },
        // For each channel, get their video count and latest videos
        {
            $lookup: {
                from: "videos",
                let: { channelId: "$channelInfo._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$owner", "$$channelId"],
                            },
                            isPublished: true,
                        },
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                    {
                        $limit: 3, // Get only the 3 latest videos
                    },
                ],
                as: "latestVideos",
            },
        },
        // Get subscriber count for each channel
        {
            $lookup: {
                from: "subscriptions",
                let: { channelId: "$channelInfo._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$channel", "$$channelId"],
                            },
                        },
                    },
                    {
                        $count: "total",
                    },
                ],
                as: "subscriberCount",
            },
        },
        // Add computed fields
        {
            $addFields: {
                videoCount: { $size: "$latestVideos" },
                subscribedSince: "$userSubscriptions.createdAt",
                subscriberCount: {
                    $cond: {
                        if: { $gt: [{ $size: "$subscriberCount" }, 0] },
                        then: { $arrayElemAt: ["$subscriberCount.total", 0] },
                        else: 0,
                    },
                },
            },
        },
        // Project only needed fields
        {
            $project: {
                _id: "$channelInfo._id",
                userName: "$channelInfo.userName",
                fullName: "$channelInfo.fullName",
                avatar: "$channelInfo.avatar",
                coverImage: "$channelInfo.coverImage",
                subscribedSince: 1,
                subscriberCount: 1,
                videoCount: 1,
                latestVideos: {
                    $map: {
                        input: "$latestVideos",
                        as: "video",
                        in: {
                            _id: "$$video._id",
                            title: "$$video.title",
                            thumbnail: "$$video.thumbnail",
                            duration: "$$video.duration",
                            views: "$$video.views",
                            createdAt: "$$video.createdAt",
                        },
                    },
                },
            },
        },
        // Sort by subscription date (newest first)
        {
            $sort: {
                subscribedSince: -1,
            },
        },
    ]);

    return res.status(200).json(new apiRes(200, { subscribedChannels }, "Subscribed channels fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    generateNewTokens,
    changePassword,
    getUserProfile,
    updateUserProfile,
    getUserChannel,
    getSubscribedChannels,
};
