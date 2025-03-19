// db-test.js
const { Pool } = require('pg');
require('dotenv').config();

// Log connection parameters for debugging (don't log the password in production)
console.log('Database connection parameters:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || '5432'}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Schema: ${process.env.DB_SCHEMA}`);

// Try connection from .env parameters
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

// Test a direct query
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to the database");
    
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0]);

    // Try to set schema
    if (process.env.DB_SCHEMA) {
      const schemaResult = await client.query(`SET search_path TO ${process.env.DB_SCHEMA}`);
      console.log(`Schema set to ${process.env.DB_SCHEMA}`);
      
      // Test a query with schema
      try {
        const tablesResult = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${process.env.DB_SCHEMA}' LIMIT 5`);
        console.log('Tables in schema:', tablesResult.rows);
      } catch (err) {
        console.log('Error querying schema tables:', err.message);
      }
    }
    
    client.release();
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    pool.end();
  }
}

testConnection();