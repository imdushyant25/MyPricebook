// src/utils/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Log connection parameters (without password) for debugging
console.log('Database connection parameters:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || '5432'}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Schema: ${process.env.DB_SCHEMA || 'public'}`);

// Create database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // For development; consider making this more secure in production
  },
  // Set search_path to your schema
  ...(process.env.DB_SCHEMA && { 
    options: `-c search_path=${process.env.DB_SCHEMA}` 
  })
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Connection events
pool.on('connect', () => {
  console.log(`Connected to PostgreSQL at ${process.env.DB_HOST}`);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the server on connection errors
  // process.exit(-1);
});

// Make sure initial query sets schema
const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    // Set schema for this connection session if specified
    if (process.env.DB_SCHEMA) {
      await client.query(`SET search_path TO ${process.env.DB_SCHEMA};`);
    }
    return client.query(text, params);
  } finally {
    client.release();
  }
};

// Export database interface
export default {
  query,
  getClient: () => pool.connect()
};