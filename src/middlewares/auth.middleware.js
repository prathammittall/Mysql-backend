import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../config/database.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = verifyAccessToken(token);

        if (!decodedToken) {
            throw new ApiError(401, "Invalid Access Token");
        }

        const [rows] = await pool.execute(
            'SELECT id, name, email, user_type, created_at, updated_at FROM users WHERE id = ?',
            [decodedToken.id]
        );

        if (rows.length === 0) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = rows[0];
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.user_type !== 'ADMIN') {
        throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    next();
});

export const isClub = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.user_type !== 'CLUB' && req.user.user_type !== 'ADMIN') {
        throw new ApiError(403, "Access denied. Club privileges required.");
    }

    next();
});

export const isStaff = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = verifyAccessToken(token);

        if (!decodedToken) {
            throw new ApiError(401, "Invalid Access Token");
        }

        const [rows] = await pool.execute(
            'SELECT id, name, email, department, designation, is_active FROM staff WHERE id = ? AND is_active = true',
            [decodedToken.id]
        );

        if (rows.length === 0) {
            throw new ApiError(401, "Invalid Access Token or staff account is inactive");
        }

        req.staff = rows[0];
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
