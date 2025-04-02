// src/routes/productRoutes.ts

// Routes for product management operations
import express from 'express';
import * as productController from '../controllers/productController';

const router = express.Router();

// Get all products
router.get('/', productController.getProducts);

// Get product by ID
router.get('/:productId', productController.getProductById);

// Create new product
router.post('/', productController.createProduct);

// Update product
router.put('/:productId', productController.updateProduct);

export default router;