// src/controllers/productController.ts
// Controller for product management operations
import { Request, Response } from 'express';
import db from '../utils/db';

/**
 * Get list of all products with product values
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.effective_date, 
        p.expiry_date,
        p.parameters,
        pv.values,
        p.created_at
      FROM edpm.products p
      LEFT JOIN edpm.product_values pv ON p.id = pv.product_id
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query);
    
    const products = result.rows.map(row => {
      // Extract product name from parameters if available
      const priceRecordName = row.parameters.priceRecordName || 
                             row.parameters.PriceRecordName || 
                             `Product-${row.id.substring(0, 8)}`;
      
      // Extract PBM
      const pbm = row.parameters.pbm;
      
      // Extract client size
      const clientSize = row.parameters.client_size;
      
      // Extract formulary
      const formulary = row.parameters.formulary;
      
      // Extract discount type
      const discountType = row.parameters.discount_rebate_type;
      
      // Get key pricing values
      const values = row.values || {};
      const retailBrandDiscount = values.retail?.brand?.discount || 0;
      const retailGenericDiscount = values.retail?.generic?.discount || 0;
      const specialtyBrandDiscount = values.specialtyMail?.brand?.discount || 0;
      
      // Determine status
      const now = new Date();
      const effectiveDate = new Date(row.effective_date);
      const expiryDate = row.expiry_date ? new Date(row.expiry_date) : null;
      const isActive = now >= effectiveDate && (!expiryDate || now <= expiryDate);
      
      return {
        id: row.id,
        productName: priceRecordName,
        pbm: pbm,
        effectiveDate: row.effective_date,
        expiryDate: row.expiry_date,
        clientSize: clientSize,
        formulary: formulary, 
        discountType: discountType,
        key_values: {
          retailBrandDiscount: retailBrandDiscount,
          retailGenericDiscount: retailGenericDiscount,
          specialtyBrandDiscount: specialtyBrandDiscount
        },
        status: isActive ? 'ACTIVE' : 'EXPIRED',
        parameters: row.parameters,
        values: row.values,
        createdAt: row.created_at
      };
    });
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ 
      message: 'Error retrieving products',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get product details by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    // Check if product exists
    const productQuery = `
      SELECT 
        p.id, 
        p.effective_date, 
        p.expiry_date,
        p.parameters,
        pv.values,
        p.created_at,
        p.updated_at
      FROM edpm.products p
      LEFT JOIN edpm.product_values pv ON p.id = pv.product_id
      WHERE p.id = $1
    `;
    
    const result = await db.query(productQuery, [productId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = result.rows[0];
    
    // Format response
    const response = {
      metadata: {
        id: product.id,
        effectiveDate: product.effective_date,
        expiryDate: product.expiry_date,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      },
      parameters: product.parameters,
      values: product.values
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving product:', error);
    res.status(500).json({ 
      message: 'Error retrieving product',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Implementation would go here
    res.status(201).json({});
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      message: 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    // Implementation would go here
    res.status(200).json({});
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};