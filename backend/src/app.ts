// src/app.ts
// Express application setup
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileRoutes from './routes/fileRoutes';
import productRoutes from './routes/productRoutes';
import parameterRoutes from './routes/parameterRoutes';
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/parameters', parameterRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use(errorHandler);

export default app;