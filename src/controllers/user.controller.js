import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const generateAccessAndRefreshToken = async (userId, email) => {
    try {
        const accessToken = generateAccessToken(userId, email);
        const refreshToken = generateRefreshToken(userId, email);

        await pool.execute(
            'UPDATE users SET refresh_token = ? WHERE id = ?',
            [refreshToken, userId]
        );

        return { accessToken, refreshToken };
    } catch (error) {
        console.log("Error in generateAccessAndRefreshToken: ", error);
        throw new ApiError(500, "Something went wrong while generating tokens!!");
    }
};

// Register user
export const registerUserViaOTP = asyncHandler(async (req, res) => {
    let { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email, and password are required");
    }

    // Trim whitespace
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email, and password cannot be empty");
    }

    // Validate email format
    if (!String(email).endsWith("@chitkara.edu.in")) {
        throw new ApiError(401, "Invalid Chitkara Id. Please use your Chitkara email.");
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existingUsers.length > 0) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'USER']
    );

    const userId = result.insertId;

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userId, email);

    // Get created user
    const [users] = await pool.execute(
        'SELECT id, name, email, user_type, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    const loggedInUser = users[0];

    // Check if user is admin
    const ADMIN_EMAILS = [
        'pratham1481.becse24@chitkara.edu.in',
        'abhinavpreet0090.becse24@chitkara.edu.in'
    ];
    const isAdmin = ADMIN_EMAILS.includes(email);

    if (isAdmin) {
        await pool.execute(
            'UPDATE users SET user_type = ? WHERE id = ?',
            ['ADMIN', userId]
        );
        loggedInUser.user_type = 'ADMIN';
    }

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User registered successfully"
            )
        );
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user
    const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (users.length === 0) {
        throw new ApiError(404, "User does not exist");
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user.id, user.email);

    // Get user without password
    const [loggedInUsers] = await pool.execute(
        'SELECT id, name, email, user_type, created_at, updated_at FROM users WHERE id = ?',
        [user.id]
    );

    const loggedInUser = loggedInUsers[0];

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 24 * 60 * 60 * 1000
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

// Logout user
export const logoutUser = asyncHandler(async (req, res) => {
    await pool.execute(
        'UPDATE users SET refresh_token = NULL WHERE id = ?',
        [req.user.id]
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = verifyRefreshToken(incomingRefreshToken);

    if (!decodedToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const [users] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [decodedToken.id]
    );

    if (users.length === 0) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = users[0];

    if (incomingRefreshToken !== user.refresh_token) {
        throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(
        user.id,
        user.email
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 24 * 60 * 60 * 1000
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            )
        );
});

// Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Change password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
    );

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, req.user.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Update account details
export const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, "Name is required");
    }

    await pool.execute(
        'UPDATE users SET name = ? WHERE id = ?',
        [name.trim(), req.user.id]
    );

    const [users] = await pool.execute(
        'SELECT id, name, email, user_type, created_at, updated_at FROM users WHERE id = ?',
        [req.user.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, users[0], "Account details updated successfully"));
});

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
    const [users] = await pool.execute(
        'SELECT id, name, email, user_type, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, users, "All users fetched successfully"));
});
