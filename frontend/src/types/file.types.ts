// src/types/file.types.ts
export interface File {
    id: string;
    filename: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    uploadDate: string;
    processingDate?: string;
    recordCount?: number;
    successCount?: number;
    failureCount?: number;
  }
  
  export interface RejectionLog {
    id: string;
    rowNumber: number;
    reason: string;
    rawData: string;
    createdAt: string;
  }
  
  export interface FileProcessingResults extends File {
    rejectionLogs?: RejectionLog[];
  }