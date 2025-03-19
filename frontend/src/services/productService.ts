// src/services/productService.ts
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/products`;

/**
 * Search products with filters
 * @param filters Object containing filter parameters
 * @returns Promise with array of product results
 */
export const searchProducts = async (filters: any = {}) => {
  try {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 * @param productId Product ID to retrieve
 * @returns Promise with product data
 */
export const getProductById = async (productId: string) => {
  try {
    const response = await axios.get(`${API_URL}/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

/**
 * Create a new product
 * @param productData Product data to create
 * @returns Promise with created product
 */
export const createProduct = async (productData: any) => {
  try {
    const response = await axios.post(API_URL, productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 * @param productId Product ID to update
 * @param productData Updated product data
 * @returns Promise with updated product
 */
export const updateProduct = async (productId: string, productData: any) => {
  try {
    const response = await axios.put(`${API_URL}/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Get product version history
 * @param productId Product ID to get history for
 * @returns Promise with product history
 */
export const getProductHistory = async (productId: string) => {
  try {
    const response = await axios.get(`${API_URL}/${productId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error getting product history:', error);
    throw error;
  }
};

/**
 * Export products to Excel
 * @param filters Filters to apply before export
 * @returns Promise with file data
 */
export const exportProducts = async (filters: any = {}) => {
  try {
    const response = await axios.get(`${API_URL}/export`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
};