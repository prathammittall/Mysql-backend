import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { sendEmail } from "../utils/emailService.js";

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register/Login staff with OTP
export const sendStaffOTP = asyncHandler(async (req, res) => {
    const { email, name } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Validate Chitkara email
    if (!email.endsWith("@chitkara.edu.in")) {
        throw new ApiError(400, "Only Chitkara email addresses are allowed");
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await pool.execute(
        'INSERT INTO staff_otp_verification (email, name, otp, expires_at) VALUES (?, ?, ?, ?)',
        [email, name || '', otp, expiresAt]
    );

    // Send OTP email
    await sendEmail({
        to: email,
        subject: "Staff Login OTP - Eventix",
        html: `<h2>Your OTP for Staff Login</h2><p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "OTP sent successfully"));
});

// Verify staff OTP and login
export const verifyStaffOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    // Get OTP record
    const [otpRecords] = await pool.execute(
        'SELECT * FROM staff_otp_verification WHERE email = ? AND otp = ? ORDER BY created_at DESC LIMIT 1',
        [email, otp]
    );

    if (otpRecords.length === 0) {
        throw new ApiError(400, "Invalid OTP");
    }

    const otpRecord = otpRecords[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
        throw new ApiError(400, "OTP expired");
    }

    // Check if staff exists
    let [staff] = await pool.execute(
        'SELECT * FROM staff WHERE email = ?',
        [email]
    );

    if (staff.length === 0) {
        // Create new staff member
        const [result] = await pool.execute(
            'INSERT INTO staff (name, email, department, designation) VALUES (?, ?, ?, ?)',
            [otpRecord.name || 'Staff Member', email, 'General', 'Staff']
        );

        [staff] = await pool.execute(
            'SELECT * FROM staff WHERE id = ?',
            [result.insertId]
        );
    }

    const staffMember = staff[0];

    // Generate tokens
    const accessToken = generateAccessToken(staffMember.id, staffMember.email);
    const refreshToken = generateRefreshToken(staffMember.id, staffMember.email);

    await pool.execute(
        'UPDATE staff SET refresh_token = ? WHERE id = ?',
        [refreshToken, staffMember.id]
    );

    // Delete used OTP
    await pool.execute(
        'DELETE FROM staff_otp_verification WHERE email = ?',
        [email]
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
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { staff: staffMember, accessToken, refreshToken }, "Staff logged in successfully"));
});

// Get all staff
export const getAllStaff = asyncHandler(async (req, res) => {
    const [staff] = await pool.execute(
        'SELECT id, name, email, phone, department, designation, bio, avatar, is_active, created_at FROM staff WHERE is_active = true ORDER BY name'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, staff, "Staff fetched successfully"));
});

// Update staff profile
export const updateStaffProfile = asyncHandler(async (req, res) => {
    const updates = req.body;

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'email') {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    updateValues.push(req.staff.id);

    await pool.execute(
        `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    const [staff] = await pool.execute(
        'SELECT id, name, email, phone, department, designation, bio, avatar, is_active FROM staff WHERE id = ?',
        [req.staff.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, staff[0], "Staff profile updated successfully"));
});
