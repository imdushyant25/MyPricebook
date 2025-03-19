// src/routes/fileRoutes.ts
// Routes for file management operations
import express from 'express';
import multer from 'multer';
import * as fileController from '../controllers/fileController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

// Route for uploading files
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Route for getting all files
router.get('/', fileController.getFiles);

// Route for processing a file
router.post('/:fileId/process', fileController.processFile);

// Route for getting processing results
router.get('/:fileId/results', fileController.getProcessingResults);

// Route for deleting a file
router.delete('/:fileId', fileController.deleteFile);

export default router;