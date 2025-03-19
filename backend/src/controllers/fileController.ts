// src/controllers/fileController.ts
// Controller for handling file upload, listing, and processing operations
import { Request, Response } from 'express';
import * as s3Service from '../services/s3Service';
import * as fileProcessingService from '../services/fileProcessingService';
import * as validationService from '../services/validationService';
import db from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
//import AWS from 'aws-sdk';

/**
 * Upload a new Excel file to S3 and register in the database
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    
    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' });
    }
    
    // Generate unique file key for S3
    const fileId = uuidv4();
    const fileKey = `uploads/${fileId}-${originalname}`;
    
    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(buffer, fileKey, mimetype);
    
    // Create database record - Updated to match the actual table schema and use edpm schema
    const query = `
      INSERT INTO edpm.files (
        id, 
        filename, 
        original_name, 
        file_size, 
        s3_key, 
        status, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING id, filename, status, created_at as upload_date
    `;
    
    const now = new Date();
    const values = [fileId, originalname, originalname, size, fileKey, 'PENDING', now];
    
    const result = await db.query(query, values);
    const fileRecord = result.rows[0];

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        status: fileRecord.status,
        uploadDate: fileRecord.upload_date
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      message: 'Error uploading file',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get list of all uploaded files with their status
 */
export const getFiles = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id, 
        filename, 
        status, 
        created_at as "uploadDate", 
        records_processed as "recordCount", 
        (records_processed - records_rejected) as "successCount", 
        records_rejected as "failureCount"
      FROM edpm.files
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ 
      message: 'Error retrieving files',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Process an uploaded file
 */
export const processFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Check if file exists
    const fileCheckResult = await db.query(
      'SELECT id, status, s3_key FROM edpm.files WHERE id = $1',
      [fileId]
    );
    
    if (fileCheckResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = fileCheckResult.rows[0];
    
    // Check if file is already being processed
    if (file.status === 'PROCESSING') {
      return res.status(400).json({ message: 'File is already being processed' });
    }
    
    // Check if file has already failed validation
    if (file.status === 'FAILED') {
      // Get the validation error
      const validationResult = await db.query(
        'SELECT validation_error FROM edpm.files WHERE id = $1',
        [fileId]
      );
      
      if (validationResult.rows[0].validation_error) {
        return res.status(400).json({ 
          message: 'File validation previously failed',
          reason: validationResult.rows[0].validation_error
        });
      }
    }
    
    // Retrieve file from S3 to validate structure before processing
    const s3File = await s3Service.downloadFile(file.s3_key);
    
    // Convert S3 response to buffer
    let fileBuffer: Buffer;
    if (s3File.Body instanceof Buffer) {
      fileBuffer = s3File.Body;
    } else if (s3File.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      // Handle stream properly with proper type checking
      for await (const chunk of s3File.Body as unknown as AsyncIterable<Buffer | string>) {
        chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
      }
      fileBuffer = Buffer.concat(chunks);
    } else if (typeof s3File.Body === 'string') {
      fileBuffer = Buffer.from(s3File.Body);
    } else if (s3File.Body instanceof Blob) {
      // Handle Blob by converting to ArrayBuffer and then to Buffer
      const arrayBuffer = await (s3File.Body as Blob).arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('Unsupported S3 response body type');
    }
    
    // Validate file structure
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const structureValidation = await validationService.validateFileStructure(workbook);
    
    if (!structureValidation.isValid) {
      // Update file status to FAILED with detailed validation error
      await db.query(
        'UPDATE edpm.files SET status = $1, processing_started_at = $2, processing_completed_at = $2, updated_at = $2, validation_error = $3 WHERE id = $4',
        ['FAILED', new Date(), structureValidation.reason, fileId]
      );
      
      return res.status(400).json({ 
        message: 'File validation failed',
        reason: structureValidation.reason
      });
    }
    
    // Update file status to PROCESSING and store normalized parameter names
    await db.query(
      `UPDATE edpm.files 
       SET status = $1, 
           processing_started_at = $2, 
           updated_at = $2, 
           parameter_names = $3,
           records_processed = 0,
           records_rejected = 0 
       WHERE id = $4`,
      ['PROCESSING', new Date(), JSON.stringify(structureValidation.normalizedParameterNames), fileId]
    );
    
    // Trigger file processing (asynchronously)
    fileProcessingService.processFile(fileId).catch(async (err) => {
      console.error(`Error processing file ${fileId}:`, err);
      // Update file status to FAILED in case of error
      try {
        await db.query(
          'UPDATE edpm.files SET status = $1, updated_at = $2, validation_error = $3 WHERE id = $4',
          ['FAILED', new Date(), err.message, fileId]
        );
      } catch (updateErr) {
        console.error(`Error updating file status for ${fileId}:`, updateErr);
      }
    });
    
    res.status(200).json({ 
      message: 'File validation passed and processing started',
      fileId
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      message: 'Error processing file',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Check if file exists
    const fileResult = await db.query(
      'SELECT id, s3_key, status FROM edpm.files WHERE id = $1',
      [fileId]
    );
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Check if file can be deleted (only PENDING or FAILED)
    if (file.status !== 'PENDING' && file.status !== 'FAILED') {
      return res.status(400).json({ 
        message: 'Cannot delete file', 
        reason: 'Only files with PENDING or FAILED status can be deleted'
      });
    }
    
    // Delete file from S3
    await s3Service.deleteFile(file.s3_key);
    
    // Delete any associated rejection logs
    await db.query(
      'DELETE FROM edpm.rejection_logs WHERE file_id = $1',
      [fileId]
    );
    
    // Delete file record from database
    await db.query(
      'DELETE FROM edpm.files WHERE id = $1',
      [fileId]
    );
    
    res.status(200).json({ 
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      message: 'Error deleting file',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
};

/**
 * Get processing results including rejection logs
 */
export const getProcessingResults = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Get file details - updated to use edpm schema and include validation_error
    const fileQuery = `
      SELECT 
        id, 
        filename, 
        status, 
        created_at as "uploadDate", 
        processing_completed_at as "processingDate", 
        records_processed as "recordCount", 
        (records_processed - records_rejected) as "successCount", 
        records_rejected as "failureCount",
        validation_error as "validationError",
        parameter_names as "parameterNames"
      FROM edpm.files
      WHERE id = $1
    `;
    
    const fileResult = await db.query(fileQuery, [fileId]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Get rejection logs
    const logsQuery = `
      SELECT 
        id, 
        row_number as "rowNumber", 
        reason_code as "reasonCode",
        reason_description as "reasonDescription",
        rejected_data as "rawData", 
        created_at as "createdAt"
      FROM edpm.rejection_logs
      WHERE file_id = $1
      ORDER BY row_number
    `;
    
    const logsResult = await db.query(logsQuery, [fileId]);
    
    // Return combined data
    res.status(200).json({
      ...file,
      rejectionLogs: logsResult.rows
    });
  } catch (error) {
    console.error('Error retrieving processing results:', error);
    res.status(500).json({ 
      message: 'Error retrieving processing results',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};