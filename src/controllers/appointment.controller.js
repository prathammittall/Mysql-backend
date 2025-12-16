import { pool } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create time slot (Staff only)
export const createTimeSlot = asyncHandler(async (req, res) => {
    const { date, startTime, endTime, location, notes, maxBookings } = req.body;

    if (!date || !startTime || !endTime) {
        throw new ApiError(400, "Date, start time, and end time are required");
    }

    const [result] = await pool.execute(
        'INSERT INTO time_slots (staff_id, date, start_time, end_time, location, notes, max_bookings) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.staff.id, date, startTime, endTime, location || '', notes || '', maxBookings || 1]
    );

    const [slots] = await pool.execute(
        'SELECT * FROM time_slots WHERE id = ?',
        [result.insertId]
    );

    return res
        .status(201)
        .json(new ApiResponse(201, slots[0], "Time slot created successfully"));
});

// Get time slots for staff
export const getStaffTimeSlots = asyncHandler(async (req, res) => {
    const { staffId } = req.params;

    const [slots] = await pool.execute(
        'SELECT * FROM time_slots WHERE staff_id = ? ORDER BY date, start_time',
        [staffId]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, slots, "Time slots fetched successfully"));
});

// Get available time slots
export const getAvailableTimeSlots = asyncHandler(async (req, res) => {
    const { staffId, date } = req.query;

    let sql = 'SELECT * FROM time_slots WHERE status = ?';
    const params = ['AVAILABLE'];

    if (staffId) {
        sql += ' AND staff_id = ?';
        params.push(staffId);
    }

    if (date) {
        sql += ' AND date = ?';
        params.push(date);
    }

    sql += ' ORDER BY date, start_time';

    const [slots] = await pool.execute(sql, params);

    return res
        .status(200)
        .json(new ApiResponse(200, slots, "Available time slots fetched successfully"));
});

// Book appointment
export const bookAppointment = asyncHandler(async (req, res) => {
    const { timeSlotId, staffId, userName, userEmail, userPhone, purpose } = req.body;

    if (!timeSlotId || !staffId || !userName || !userEmail || !purpose) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Check time slot availability
    const [slots] = await pool.execute(
        'SELECT * FROM time_slots WHERE id = ? AND status = ?',
        [timeSlotId, 'AVAILABLE']
    );

    if (slots.length === 0) {
        throw new ApiError(400, "Time slot not available");
    }

    const slot = slots[0];

    if (slot.current_bookings >= slot.max_bookings) {
        throw new ApiError(400, "Time slot is full");
    }

    // Create appointment
    const [result] = await pool.execute(
        'INSERT INTO appointments (time_slot_id, staff_id, user_id, user_name, user_email, user_phone, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [timeSlotId, staffId, req.user.id, userName, userEmail, userPhone || '', purpose]
    );

    // Update slot booking count
    await pool.execute(
        'UPDATE time_slots SET current_bookings = current_bookings + 1 WHERE id = ?',
        [timeSlotId]
    );

    // Update slot status if full
    if (slot.current_bookings + 1 >= slot.max_bookings) {
        await pool.execute(
            'UPDATE time_slots SET status = ? WHERE id = ?',
            ['BOOKED', timeSlotId]
        );
    }

    const [appointments] = await pool.execute(
        'SELECT * FROM appointments WHERE id = ?',
        [result.insertId]
    );

    return res
        .status(201)
        .json(new ApiResponse(201, appointments[0], "Appointment booked successfully"));
});

// Get user appointments
export const getUserAppointments = asyncHandler(async (req, res) => {
    const [appointments] = await pool.execute(
        `SELECT a.*, s.name as staff_name, s.email as staff_email, s.department, t.date, t.start_time, t.end_time, t.location
         FROM appointments a
         JOIN staff s ON a.staff_id = s.id
         JOIN time_slots t ON a.time_slot_id = t.id
         WHERE a.user_id = ?
         ORDER BY t.date DESC, t.start_time DESC`,
        [req.user.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, appointments, "Appointments fetched successfully"));
});

// Get staff appointments
export const getStaffAppointments = asyncHandler(async (req, res) => {
    const [appointments] = await pool.execute(
        `SELECT a.*, t.date, t.start_time, t.end_time, t.location
         FROM appointments a
         JOIN time_slots t ON a.time_slot_id = t.id
         WHERE a.staff_id = ?
         ORDER BY t.date DESC, t.start_time DESC`,
        [req.staff.id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, appointments, "Appointments fetched successfully"));
});

// Cancel appointment
export const cancelAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [appointments] = await pool.execute(
        'SELECT * FROM appointments WHERE id = ?',
        [id]
    );

    if (appointments.length === 0) {
        throw new ApiError(404, "Appointment not found");
    }

    const appointment = appointments[0];

    // Update appointment status
    await pool.execute(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['CANCELLED', id]
    );

    // Update time slot
    await pool.execute(
        'UPDATE time_slots SET current_bookings = current_bookings - 1, status = ? WHERE id = ?',
        ['AVAILABLE', appointment.time_slot_id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Appointment cancelled successfully"));
});

// Update appointment status (Staff only)
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    await pool.execute(
        'UPDATE appointments SET status = ?, notes = ? WHERE id = ?',
        [status, notes || '', id]
    );

    const [appointments] = await pool.execute(
        'SELECT * FROM appointments WHERE id = ?',
        [id]
    );

    return res
        .status(200)
        .json(new ApiResponse(200, appointments[0], "Appointment status updated successfully"));
});
