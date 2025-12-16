import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/emailService.js";
import crypto from "crypto";

// Create team registration
export const createTeamRegistration = asyncHandler(async (req, res) => {
    const { eventId, eventTitle, teamSize, members } = req.body;

    if (!eventId || !eventTitle || !teamSize || !members || members.length === 0) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Check if event exists
    const [events] = await pool.execute(
        'SELECT id FROM events WHERE id = ?',
        [eventId]
    );

    if (events.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    // Create team registration
    const [result] = await pool.execute(
        'INSERT INTO team_registrations (event_id, event_title, leader_id, leader_email, leader_name, team_size) VALUES (?, ?, ?, ?, ?, ?)',
        [eventId, eventTitle, req.user.id, req.user.email, req.user.name, teamSize]
    );

    const teamRegistrationId = result.insertId;

    // Add team members
    for (const member of members) {
        const [memberResult] = await pool.execute(
            'INSERT INTO team_members (team_registration_id, email, name) VALUES (?, ?, ?)',
            [teamRegistrationId, member.email, member.name || '']
        );

        // Generate confirmation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await pool.execute(
            'INSERT INTO confirmation_tokens (token, team_member_id, expires_at) VALUES (?, ?, ?)',
            [token, memberResult.insertId, expiresAt]
        );

        // Send confirmation email
        const confirmationLink = `${process.env.FRONTEND_URL}/team/confirm/${token}`;
        await sendEmail({
            to: member.email,
            subject: `Team Registration Confirmation - ${eventTitle}`,
            html: `
                <h2>Team Registration</h2>
                <p>You have been added to a team for ${eventTitle}</p>
                <p>Please confirm your participation:</p>
                <a href="${confirmationLink}">Confirm Registration</a>
                <p>This link expires in 7 days.</p>
            `
        });
    }

    const [registrations] = await pool.execute(
        'SELECT * FROM team_registrations WHERE id = ?',
        [teamRegistrationId]
    );

    return res
        .status(201)
        .json(new ApiResponse(201, registrations[0], "Team registration created successfully"));
});

// Confirm team member
export const confirmTeamMember = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Get confirmation token
    const [tokens] = await pool.execute(
        'SELECT * FROM confirmation_tokens WHERE token = ? AND used_at IS NULL',
        [token]
    );

    if (tokens.length === 0) {
        throw new ApiError(400, "Invalid or expired token");
    }

    const tokenRecord = tokens[0];

    if (new Date() > new Date(tokenRecord.expires_at)) {
        throw new ApiError(400, "Token expired");
    }

    // Update team member status
    await pool.execute(
        'UPDATE team_members SET status = ?, confirmed_at = ? WHERE id = ?',
        ['CONFIRMED', new Date(), tokenRecord.team_member_id]
    );

    // Mark token as used
    await pool.execute(
        'UPDATE confirmation_tokens SET used_at = ? WHERE id = ?',
        [new Date(), tokenRecord.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Team member confirmed successfully"));
});

// Get team registration by ID
export const getTeamRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [registrations] = await pool.execute(
        'SELECT * FROM team_registrations WHERE id = ?',
        [id]
    );

    if (registrations.length === 0) {
        throw new ApiError(404, "Team registration not found");
    }

    const [members] = await pool.execute(
        'SELECT * FROM team_members WHERE team_registration_id = ?',
        [id]
    );

    const registration = registrations[0];
    registration.members = members;

    return res
        .status(200)
        .json(new ApiResponse(200, registration, "Team registration fetched successfully"));
});

// Get user's team registrations
export const getUserTeamRegistrations = asyncHandler(async (req, res) => {
    const [registrations] = await pool.execute(
        'SELECT * FROM team_registrations WHERE leader_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, registrations, "Team registrations fetched successfully"));
});

// Cancel team registration
export const cancelTeamRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [registrations] = await pool.execute(
        'SELECT * FROM team_registrations WHERE id = ? AND leader_id = ?',
        [id, req.user.id]
    );

    if (registrations.length === 0) {
        throw new ApiError(404, "Team registration not found or unauthorized");
    }

    await pool.execute(
        'UPDATE team_registrations SET status = ? WHERE id = ?',
        ['CANCELLED', id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Team registration cancelled successfully"));
});
