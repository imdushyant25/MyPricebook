// src/pages/FileManagement.tsx
// Add proper type definitions to fix the TypeScript error

import React, { useState, useRef, useEffect } from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import FileUpload from '../components/file-management/FileUpload';
import FileList, { FileListHandle } from '../components/file-management/FileList';
import { getFiles } from '../services/fileService';

// Define the file interface
interface FileRecord {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';
  recordCount?: number;
  successCount?: number;
  failureCount?: number;
  validationError?: string;
}

const FileManagement: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const fileListRef = useRef<FileListHandle>(null);
  const [hasProcessingFiles, setHasProcessingFiles] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to switch to the Upload tab
  const switchToUploadTab = () => {
    setTabIndex(1); // Index 1 corresponds to the "Upload New File" tab
  };

  // Function to handle successful file upload
  const handleUploadSuccess = () => {
    // Switch to the File List tab
    setTabIndex(0);
    
    // Refresh the file list after a short delay to allow the server to process
    setTimeout(() => {
      if (fileListRef.current) {
        fileListRef.current.loadFiles();
      }
    }, 500);
  };

  // Check if any files are in processing state and set up auto-refresh
  useEffect(() => {
    const checkProcessingFiles = async () => {
      try {
        const files: FileRecord[] = await getFiles();
        const isProcessing = files.some(file => file.status === 'PROCESSING');
        setHasProcessingFiles(isProcessing);
        
        // If files are processing, set up auto-refresh every 5 seconds
        if (isProcessing && !refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(() => {
            if (fileListRef.current) {
              fileListRef.current.loadFiles();
            }
          }, 5000); // Refresh every 5 seconds
        } 
        // If no files are processing, clear the interval
        else if (!isProcessing && refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } catch (error) {
        console.error('Error checking processing files:', error);
      }
    };

    // Initial check
    checkProcessingFiles();

    // Set up interval to check regularly
    const checkInterval = setInterval(checkProcessingFiles, 10000); // Check every 10 seconds
    
    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <Box p={4}>
      <Tabs variant="enclosed" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>File List {hasProcessingFiles && '(Processing...)'}</Tab>
          <Tab>Upload New File</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <FileList 
              onSwitchToUpload={switchToUploadTab}
              ref={fileListRef}
            />
          </TabPanel>
          <TabPanel>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FileManagement;