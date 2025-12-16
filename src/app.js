import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://eventix-rust.vercel.app',
            'https://eventix360.app',
            'https://www.eventix360.app',
        ];
        
        // Check if the origin is in the allowed list or matches the Vercel pattern
        if (allowedOrigins.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            origin.includes('localhost') ||
            origin.includes('devtunnels.ms')) {
            callback(null, true);
        } else {
            console.log('⚠️ Origin not allowed:', origin);
            callback(null, true); // Allow all origins in production for now
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from "./routes/user.route.js";
import eventRouter from "./routes/event.route.js";
import organiserRouter from "./routes/organiser.route.js";
import profileRouter from "./routes/profile.route.js";
import registerEventRouter from "./routes/registerEvents.route.js";
import teamRouter from "./routes/team.route.js";
import posterRouter from "./routes/poster.route.js";
import emailRouter from "./routes/email.route.js";
import staffRouter from "./routes/staff.route.js";
import appointmentRouter from "./routes/appointment.route.js";

// Register routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", eventRouter);
app.use("/api/v1/organiser", organiserRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/registerEvent", registerEventRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/poster", posterRouter);
app.use("/api/v1/email", emailRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/appointments", appointmentRouter);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    console.error("Error:", err);

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export { app };
