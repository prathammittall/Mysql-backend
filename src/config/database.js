import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'eventix',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
async function connectDB() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully');
        console.log(`📊 Connected to database: ${process.env.DB_NAME || 'eventix'}`);
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    await pool.end();
    console.log('MySQL pool has ended');
});

process.on('SIGINT', async () => {
    await pool.end();
    console.log('MySQL pool has ended');
});

export { pool, connectDB };
