import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create event (Admin only)
export const createEvent = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        mode,
        location,
        date,
        start_time,
        end_time,
        registration_link,
        tags,
        category,
        max_participants
    } = req.body;

    if (!title || !description || !mode || !location || !date || !start_time || !end_time || !registration_link || !category) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Check if event already exists
    const [existingEvents] = await pool.execute(
        'SELECT id FROM events WHERE title = ? OR registration_link = ?',
        [title, registration_link]
    );

    if (existingEvents.length > 0) {
        throw new ApiError(409, "Event with this title or registration link already exists");
    }

    let posterUrl = '';
    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (cloudinaryResponse) {
            posterUrl = cloudinaryResponse.secure_url;
        }
    }

    const tagsJson = JSON.stringify(tags || []);
    const registeredUsersJson = JSON.stringify([]);

    const [result] = await pool.execute(
        `INSERT INTO events (title, description, mode, location, date, start_time, end_time, poster, registration_link, tags, category, created_by, max_participants, registered_users)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, mode, location, date, start_time, end_time, posterUrl, registration_link, tagsJson, category, req.user.email, max_participants || 100, registeredUsersJson]
    );

    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [result.insertId]
    );

    const event = events[0];
    event.tags = JSON.parse(event.tags || '[]');
    event.registered_users = JSON.parse(event.registered_users || '[]');

    return res
        .status(201)
        .json(new ApiResponse(201, event, "Event created successfully"));
});

// Get all events
export const getAllEvents = asyncHandler(async (req, res) => {
    const [events] = await pool.execute(
        'SELECT * FROM events ORDER BY created_at DESC'
    );

    const parsedEvents = events.map(event => ({
        ...event,
        tags: JSON.parse(event.tags || '[]'),
        registered_users: JSON.parse(event.registered_users || '[]')
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, parsedEvents, "Events fetched successfully"));
});

// Get event by ID
export const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [id]
    );

    if (events.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    const event = events[0];
    event.tags = JSON.parse(event.tags || '[]');
    event.registered_users = JSON.parse(event.registered_users || '[]');

    return res
        .status(200)
        .json(new ApiResponse(200, event, "Event fetched successfully"));
});

// Update event
export const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const [existingEvents] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [id]
    );

    if (existingEvents.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (cloudinaryResponse) {
            updates.poster = cloudinaryResponse.secure_url;
        }
    }

    if (updates.tags) {
        updates.tags = JSON.stringify(updates.tags);
    }

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    updateValues.push(id);

    await pool.execute(
        `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [id]
    );

    const event = events[0];
    event.tags = JSON.parse(event.tags || '[]');
    event.registered_users = JSON.parse(event.registered_users || '[]');

    return res
        .status(200)
        .json(new ApiResponse(200, event, "Event updated successfully"));
});

// Delete event
export const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existingEvents] = await pool.execute(
        'SELECT id FROM events WHERE id = ?',
        [id]
    );

    if (existingEvents.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    await pool.execute(
        'DELETE FROM events WHERE id = ?',
        [id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

// Search events
export const searchEvents = asyncHandler(async (req, res) => {
    const { query, category, mode } = req.query;

    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (query) {
        sql += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
    }

    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }

    if (mode) {
        sql += ' AND mode = ?';
        params.push(mode);
    }

    sql += ' ORDER BY created_at DESC';

    const [events] = await pool.execute(sql, params);

    const parsedEvents = events.map(event => ({
        ...event,
        tags: JSON.parse(event.tags || '[]'),
        registered_users: JSON.parse(event.registered_users || '[]')
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, parsedEvents, "Search results fetched successfully"));
});
