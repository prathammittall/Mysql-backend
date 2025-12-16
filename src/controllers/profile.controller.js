import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create profile
export const createProfile = asyncHandler(async (req, res) => {
    const {
        name,
        username,
        roll_no,
        email_personal,
        email_chitkara,
        phone,
        university,
        location,
        course,
        year_of_study,
        skill,
        education
    } = req.body;

    if (!name || !username || !roll_no || !email_chitkara) {
        throw new ApiError(400, "Name, username, roll number, and chitkara email are required");
    }

    // Check if profile already exists for this user
    const [existingProfiles] = await pool.execute(
        'SELECT id FROM profiles WHERE user_id = ? OR username = ?',
        [req.user.id, username]
    );

    if (existingProfiles.length > 0) {
        throw new ApiError(409, "Profile already exists for this user or username is taken");
    }

    let logoUrl = '';
    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (cloudinaryResponse) {
            logoUrl = cloudinaryResponse.secure_url;
        }
    }

    const skillJson = JSON.stringify(skill || []);
    const educationJson = JSON.stringify(education || {});
    const eventsAddedJson = JSON.stringify([]);

    const [result] = await pool.execute(
        `INSERT INTO profiles (name, username, roll_no, email_personal, email_chitkara, logo, phone, university, location, course, year_of_study, skill, education, events_added, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, username, roll_no, email_personal, email_chitkara, logoUrl, phone, university, location, course, year_of_study, skillJson, educationJson, eventsAddedJson, req.user.id]
    );

    const [profiles] = await pool.execute(
        'SELECT * FROM profiles WHERE id = ?',
        [result.insertId]
    );

    const profile = profiles[0];
    profile.skill = JSON.parse(profile.skill || '[]');
    profile.education = JSON.parse(profile.education || '{}');
    profile.events_added = JSON.parse(profile.events_added || '[]');

    return res
        .status(201)
        .json(new ApiResponse(201, profile, "Profile created successfully"));
});

// Get profile by user ID
export const getProfile = asyncHandler(async (req, res) => {
    const [profiles] = await pool.execute(
        'SELECT * FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    if (profiles.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    const profile = profiles[0];
    profile.skill = JSON.parse(profile.skill || '[]');
    profile.education = JSON.parse(profile.education || '{}');
    profile.events_added = JSON.parse(profile.events_added || '[]');

    return res
        .status(200)
        .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

// Get profile by username
export const getProfileByUsername = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [profiles] = await pool.execute(
        'SELECT * FROM profiles WHERE username = ?',
        [username]
    );

    if (profiles.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    const profile = profiles[0];
    profile.skill = JSON.parse(profile.skill || '[]');
    profile.education = JSON.parse(profile.education || '{}');
    profile.events_added = JSON.parse(profile.events_added || '[]');

    return res
        .status(200)
        .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

// Update profile
export const updateProfile = asyncHandler(async (req, res) => {
    const updates = req.body;

    const [existingProfiles] = await pool.execute(
        'SELECT * FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    if (existingProfiles.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (cloudinaryResponse) {
            updates.logo = cloudinaryResponse.secure_url;
        }
    }

    if (updates.skill) {
        updates.skill = JSON.stringify(updates.skill);
    }

    if (updates.education) {
        updates.education = JSON.stringify(updates.education);
    }

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'user_id') {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    updateValues.push(req.user.id);

    await pool.execute(
        `UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
        updateValues
    );

    const [profiles] = await pool.execute(
        'SELECT * FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    const profile = profiles[0];
    profile.skill = JSON.parse(profile.skill || '[]');
    profile.education = JSON.parse(profile.education || '{}');
    profile.events_added = JSON.parse(profile.events_added || '[]');

    return res
        .status(200)
        .json(new ApiResponse(200, profile, "Profile updated successfully"));
});

// Delete profile
export const deleteProfile = asyncHandler(async (req, res) => {
    const [existingProfiles] = await pool.execute(
        'SELECT id FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    if (existingProfiles.length === 0) {
        throw new ApiError(404, "Profile not found");
    }

    await pool.execute(
        'DELETE FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Profile deleted successfully"));
});

// Get all profiles (Admin only)
export const getAllProfiles = asyncHandler(async (req, res) => {
    const [profiles] = await pool.execute(
        'SELECT * FROM profiles ORDER BY created_at DESC'
    );

    const parsedProfiles = profiles.map(profile => ({
        ...profile,
        skill: JSON.parse(profile.skill || '[]'),
        education: JSON.parse(profile.education || '{}'),
        events_added: JSON.parse(profile.events_added || '[]')
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, parsedProfiles, "All profiles fetched successfully"));
});
