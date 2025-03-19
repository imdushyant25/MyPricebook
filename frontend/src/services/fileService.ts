// src/services/fileService.ts
// Service for interacting with the file management API endpoints
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/files`;

/**
 * Upload an Excel file
 * @param formData Form data containing the file
 * @param onUploadProgress Callback for tracking upload progress
 * @returns Promise with server response
 */
export const uploadFile = async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Get list of all uploaded files
 * @returns Promise with array of file records
 */
export const getFiles = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * Trigger processing of an uploaded file
 * @param fileId ID of the file to process
 * @returns Promise with processing response
 */
export const processFile = async (fileId: string) => {
  const response = await axios.post(`${API_URL}/${fileId}/process`);
  return response.data;
};

/**
 * Get processing results for a file
 * @param fileId ID of the file to get results for
 * @returns Promise with processing results
 */
export const getProcessingResults = async (fileId: string) => {
  const response = await axios.get(`${API_URL}/${fileId}/results`);
  return response.data;
};

/**
 * Delete a file
 * @param fileId ID of the file to delete
 * @returns Promise with deletion response
 */
export const deleteFile = async (fileId: string) => {
  const response = await axios.delete(`${API_URL}/${fileId}`);
  return response.data;
};