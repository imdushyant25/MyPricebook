// src/services/s3Service.ts
// Service for interacting with AWS S3 for file storage and retrieval
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mscallbucket';

/**
 * Upload a file to S3
 * @param fileBuffer - The file content as a buffer
 * @param key - The S3 object key
 * @param contentType - The file's MIME type
 * @returns Promise with upload result
 */
export const uploadFile = async (
  fileBuffer: Buffer, 
  key: string, 
  contentType: string
): Promise<AWS.S3.ManagedUpload.SendData> => {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  };

  return s3.upload(params).promise();
};

/**
 * Download a file from S3
 * @param key - The S3 object key
 * @returns Promise with file data
 */
export const downloadFile = async (key: string): Promise<AWS.S3.GetObjectOutput> => {
  const params: AWS.S3.GetObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  return s3.getObject(params).promise();
};

/**
 * Delete a file from S3
 * @param key - The S3 object key
 * @returns Promise with delete result
 */
export const deleteFile = async (key: string): Promise<AWS.S3.DeleteObjectOutput> => {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  return s3.deleteObject(params).promise();
};