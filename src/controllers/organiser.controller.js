import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create club (pending approval)
export const createClubRequest = asyncHandler(async (req, res) => {
    const { clubName, email, phone, description, password } = req.body;

    if (!clubName || !email || !phone || !description || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if club already exists or pending
    const [existingClubs] = await pool.execute(
        'SELECT id FROM pending_club_approvals WHERE email = ?',
        [email]
    );

    if (existingClubs.length > 0) {
        throw new ApiError(409, "Club approval request already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
        'INSERT INTO pending_club_approvals (club_name, email, phone, description, password) VALUES (?, ?, ?, ?, ?)',
        [clubName, email, phone, description, hashedPassword]
    );

    return res
        .status(201)
        .json(new ApiResponse(201, { id: result.insertId }, "Club approval request submitted"));
});

// Get all pending clubs (Admin only)
export const getPendingClubs = asyncHandler(async (req, res) => {
    const [clubs] = await pool.execute(
        'SELECT id, club_name, email, phone, description, status, created_at FROM pending_club_approvals WHERE status = ?',
        ['pending']
    );

    return res
        .status(200)
        .json(new ApiResponse(200, clubs, "Pending clubs fetched successfully"));
});

// Approve club (Admin only)
export const approveClub = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [pendingClubs] = await pool.execute(
        'SELECT * FROM pending_club_approvals WHERE id = ?',
        [id]
    );

    if (pendingClubs.length === 0) {
        throw new ApiError(404, "Pending club not found");
    }

    const pendingClub = pendingClubs[0];

    // Create user for club
    const [userResult] = await pool.execute(
        'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
        [pendingClub.club_name, pendingClub.email, pendingClub.password, 'CLUB']
    );

    // Create club
    await pool.execute(
        'INSERT INTO clubs (club_name, email, phone, description, is_approved, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [pendingClub.club_name, pendingClub.email, pendingClub.phone, pendingClub.description, true, userResult.insertId]
    );

    // Update pending status
    await pool.execute(
        'UPDATE pending_club_approvals SET status = ? WHERE id = ?',
        ['approved', id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Club approved successfully"));
});

// Reject club (Admin only)
export const rejectClub = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await pool.execute(
        'UPDATE pending_club_approvals SET status = ? WHERE id = ?',
        ['rejected', id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Club rejected"));
});

// Get all clubs
export const getAllClubs = asyncHandler(async (req, res) => {
    const [clubs] = await pool.execute(
        'SELECT * FROM clubs WHERE is_approved = true ORDER BY created_at DESC'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, clubs, "Clubs fetched successfully"));
});
