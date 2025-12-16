import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Register user for event
export const registerForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.body;
    const userId = req.user.id;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Get event
    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
    );

    if (events.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    const event = events[0];
    const registeredUsers = JSON.parse(event.registered_users || '[]');

    // Check if user already registered
    if (registeredUsers.includes(userId.toString())) {
        throw new ApiError(400, "User already registered for this event");
    }

    // Check max participants
    if (registeredUsers.length >= event.max_participants) {
        throw new ApiError(400, "Event is full");
    }

    // Add user to registered users
    registeredUsers.push(userId.toString());

    await pool.execute(
        'UPDATE events SET registered_users = ? WHERE id = ?',
        [JSON.stringify(registeredUsers), eventId]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully registered for event"));
});

// Get registered events for user
export const getRegisteredEvents = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [events] = await pool.execute(
        'SELECT * FROM events WHERE JSON_CONTAINS(registered_users, ?)',
        [JSON.stringify(userId.toString())]
    );

    const parsedEvents = events.map(event => ({
        ...event,
        tags: JSON.parse(event.tags || '[]'),
        registered_users: JSON.parse(event.registered_users || '[]')
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, parsedEvents, "Registered events fetched successfully"));
});

// Unregister from event
export const unregisterFromEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
    );

    if (events.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    const event = events[0];
    const registeredUsers = JSON.parse(event.registered_users || '[]');

    // Check if user is registered
    const userIndex = registeredUsers.indexOf(userId.toString());
    if (userIndex === -1) {
        throw new ApiError(400, "User not registered for this event");
    }

    // Remove user from registered users
    registeredUsers.splice(userIndex, 1);

    await pool.execute(
        'UPDATE events SET registered_users = ? WHERE id = ?',
        [JSON.stringify(registeredUsers), eventId]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully unregistered from event"));
});
