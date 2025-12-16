import { Resend } from "resend";
import { pool } from "../config/database.js";
import { sendEmail } from "../utils/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Send custom email
export const sendCustomEmail = asyncHandler(async (req, res) => {
    const { to, subject, htmlContent, textContent } = req.body;

    if (!to || !subject || (!htmlContent && !textContent)) {
        throw new ApiError(400, "Recipient, subject, and content are required");
    }

    try {
        const result = await sendEmail({
            to,
            subject,
            html: htmlContent,
            text: textContent
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { messageId: result.messageId }, "Email sent successfully"));
    } catch (error) {
        console.error("Error sending email:", error);
        throw new ApiError(500, "Failed to send email");
    }
});

// Send event reminder
export const sendEventReminder = asyncHandler(async (req, res) => {
    const { eventId, recipients } = req.body;

    if (!eventId || !recipients || recipients.length === 0) {
        throw new ApiError(400, "Event ID and recipients are required");
    }

    // Get event details from database
    const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
    );

    if (events.length === 0) {
        throw new ApiError(404, "Event not found");
    }

    const event = events[0];

    const subject = `Reminder: ${event.title}`;
    const htmlContent = `
        <h2>Event Reminder</h2>
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Time:</strong> ${event.start_time} - ${event.end_time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Mode:</strong> ${event.mode}</p>
    `;

    try {
        const emailPromises = recipients.map(email =>
            sendEmail({
                to: email,
                subject,
                html: htmlContent
            })
        );

        await Promise.all(emailPromises);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Event reminders sent successfully"));
    } catch (error) {
        console.error("Error sending event reminders:", error);
        throw new ApiError(500, "Failed to send event reminders");
    }
});
