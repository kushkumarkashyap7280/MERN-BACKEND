// =============== auth middleware ===============

import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";

const verifyJWT  = asyncHandler(async(req, res, next)=>{
      const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
      if (!token) {
          throw new apiError(401, "Access token is missing");
      }

      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = await User.findById(decoded.id).select("-password -refreshToken");
          next();
      } catch (error) {
          throw new apiError(401, "Invalid access token");
      }
});

export default verifyJWT;