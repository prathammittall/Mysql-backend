import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to database and start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚡️ Server is running at port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
        });

        app.on("error", (error) => {
            console.log("Express Server Error: ", error);
            throw error;
        });
    })
    .catch((err) => {
        console.log("MySQL connection failed!!", err);
        process.exit(1);
    });
