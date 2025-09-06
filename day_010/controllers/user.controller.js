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
  return res
    .status(200)
    .json(new apiRes(200, { user: userData }, "User logged in successfully"));
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

        return res.status(200).json(
            new apiRes(200, { user: userData }, "Tokens refreshed successfully")
        );
    } catch (error) {
        throw new apiError(401, "Invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, generateNewTokens };
