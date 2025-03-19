// src/components/files/FileList.tsx
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Flex,
  Badge,
  Spinner,
  useToast,
  Link,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Collapse,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
  HStack // Add HStack for horizontal layout
} from '@chakra-ui/react';
import { DeleteIcon, InfoIcon, TimeIcon } from '@chakra-ui/icons'; // Import TimeIcon
import { getFiles, processFile, deleteFile } from '../../services/fileService';
import { useNavigate } from 'react-router-dom';

interface FileRecord {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED_WITH_ERRORS' | 'COMPLETED' | 'FAILED';
  recordCount?: number;
  successCount?: number;
  failureCount?: number;
  validationError?: string;
}

interface FileListProps {
  onSwitchToUpload?: () => void;
}

// Export the ref type for use elsewhere
export interface FileListHandle {
  loadFiles: () => Promise<void>;
}

const FileList = forwardRef<FileListHandle, FileListProps>(({ onSwitchToUpload }, ref) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Load files from API
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const data = await getFiles();
      setFiles(data);
    } catch (error) {
      toast({
        title: 'Error loading files',
        description: 'There was an error loading the file list. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the loadFiles method via ref
  useImperativeHandle(ref, () => ({
    loadFiles
  }));

  // Get status badge color based on file status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'gray';
      case 'PROCESSING': return 'blue';
      case 'COMPLETED': return 'green';
      case 'COMPLETED_WITH_ERRORS': return 'yellow'; // Add this line
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  // New function to render status with spinner if processing
  const renderStatus = (file: FileRecord) => {
    if (file.status === 'PROCESSING') {
      return (
        <HStack spacing={2}>
          <Spinner size="sm" color="blue.500" />
          <Badge colorScheme={getStatusColor(file.status)} px={2} py={1} borderRadius="full">
            {file.status}
          </Badge>
        </HStack>
      );
    }
    
    return (
      <Flex align="center">
        <Badge colorScheme={getStatusColor(file.status)} px={2} py={1} borderRadius="full">
          {file.status}
        </Badge>
        {file.status === 'FAILED' && file.validationError && (
          <Tooltip label="View validation error">
            <IconButton
              aria-label="View error"
              icon={<InfoIcon />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              ml={2}
              onClick={() => toggleErrorExpand(file.id)}
            />
          </Tooltip>
        )}
      </Flex>
    );
  };


  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Load files on component mount
  useEffect(() => {
    loadFiles();
    
    // Poll for updates every 5 seconds if files are processing
    const interval = setInterval(() => {
      if (files.some(file => file.status === 'PROCESSING')) {
        loadFiles();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle process file button click
  const handleProcessFile = async (fileId: string) => {
    try {
      setProcessingIds(prev => [...prev, fileId]);
      await processFile(fileId);
      
      // Update file status in the list
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId 
            ? { ...file, status: 'PROCESSING' } 
            : file
        )
      );
      
      toast({
        title: 'Processing started',
        description: 'File processing has been initiated.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Reload files to get updated status
      setTimeout(loadFiles, 1000);
    } catch (error: any) {
      // If there's an error message from the server, show it
      const errorMessage = error.response?.data?.reason || 
                          error.response?.data?.message || 
                          'Failed to start file processing. Please try again.';
      
      // Update file status in the list if validation failed
      if (error.response?.status === 400 && error.response?.data?.reason) {
        setFiles(prevFiles => 
          prevFiles.map(file => 
            file.id === fileId 
              ? { 
                  ...file, 
                  status: 'FAILED',
                  validationError: error.response.data.reason
                } 
              : file
          )
        );
      }
      
      toast({
        title: 'Processing failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== fileId));
    }
  };

  // View processing results
  const viewResults = (fileId: string) => {
    navigate(`/files/${fileId}/results`);
  };

  // Handle click on upload link
  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSwitchToUpload) {
      onSwitchToUpload();
    }
  };

  // Toggle expanded error message
  const toggleErrorExpand = (fileId: string) => {
    setExpandedErrorId(expandedErrorId === fileId ? null : fileId);
  };

  // Confirm file deletion
  const confirmDelete = (file: FileRecord) => {
    setFileToDelete(file);
    onOpen();
  };

  // Delete the file
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteFile(fileToDelete.id);
      
      // Remove the file from the list
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete.id));
      
      toast({
        title: 'File deleted',
        description: `${fileToDelete.filename} has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error deleting file',
        description: error.response?.data?.message || 'Failed to delete the file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  // src/components/files/FileList.tsx
// Complete return statement with processing indicators

return (
  <Box>
    <Flex justify="space-between" align="center" mb={4}>
      <Text fontSize="xl" fontWeight="bold">Uploaded Files</Text>
      <Button 
        colorScheme="blue" 
        size="sm" 
        onClick={loadFiles} 
        isLoading={isLoading}
      >
        Refresh
      </Button>
    </Flex>

    {isLoading && files.length === 0 ? (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    ) : files.length === 0 ? (
      <Box 
        p={6} 
        textAlign="center" 
        borderWidth="1px" 
        borderRadius="lg" 
        bg="gray.50"
      >
        <Text color="gray.500">No files have been uploaded yet.</Text>
        <Link 
          color="blue.500" 
          href="#" 
          fontWeight="medium" 
          mt={2} 
          display="inline-block"
          onClick={handleUploadClick}
        >
          Upload your first file
        </Link>
      </Box>
    ) : (
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead bg="gray.50">
            <Tr>
              <Th>Filename</Th>
              <Th>Upload Date</Th>
              <Th>Status</Th>
              <Th>Records</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {files.map((file) => (
              <React.Fragment key={file.id}>
                <Tr>
                  <Td fontWeight="medium">{file.filename}</Td>
                  <Td>{formatDate(file.uploadDate)}</Td>
                  <Td>
                    {file.status === 'PROCESSING' ? (
                      <HStack spacing={2}>
                        <Spinner size="sm" color="blue.500" />
                        <Badge colorScheme={getStatusColor(file.status)} px={2} py={1} borderRadius="full">
                          {file.status}
                        </Badge>
                      </HStack>
                    ) : (
                      <Flex align="center">
                        <Badge colorScheme={getStatusColor(file.status)} px={2} py={1} borderRadius="full">
                          {file.status}
                        </Badge>
                        {file.status === 'FAILED' && file.validationError && (
                          <Tooltip label="View validation error">
                            <IconButton
                              aria-label="View error"
                              icon={<InfoIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              ml={2}
                              onClick={() => toggleErrorExpand(file.id)}
                            />
                          </Tooltip>
                        )}
                      </Flex>
                    )}
                  </Td>
                  <Td>
                    {file.status === 'COMPLETED' && (
                      <Text fontSize="sm">
                        {file.successCount} / {file.recordCount} successful
                      </Text>
                    )}
                    {file.status === 'FAILED' && (
                      <Text fontSize="sm" color="red.500">
                        Failed
                      </Text>
                    )}
                    {file.status === 'PROCESSING' && (
                      <Text fontSize="sm" color="blue.500">
                        Processing...
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Flex gap={2}>
                      {file.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            onClick={() => handleProcessFile(file.id)}
                            isLoading={processingIds.includes(file.id)}
                            loadingText="Starting"
                          >
                            Process
                          </Button>
                          <IconButton
                            aria-label="Delete file"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => confirmDelete(file)}
                          />
                        </>
                      )}
                      {file.status === 'FAILED' && (
                        <IconButton
                          aria-label="Delete file"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => confirmDelete(file)}
                        />
                      )}
                      {(file.status === 'COMPLETED' || file.status === 'COMPLETED_WITH_ERRORS' || file.status === 'FAILED') && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          colorScheme="blue"
                          onClick={() => viewResults(file.id)}
                        >
                          View Results
                        </Button>
                      )}
                      {file.status === 'PROCESSING' && (
                        <Tooltip label="File is currently being processed">
                          <Box>
                            <Button 
                              size="sm" 
                              variant="outline"
                              isDisabled={true}
                              leftIcon={<TimeIcon />}
                            >
                              Processing
                            </Button>
                          </Box>
                        </Tooltip>
                      )}
                    </Flex>
                  </Td>
                </Tr>
                {file.status === 'FAILED' && file.validationError && expandedErrorId === file.id && (
                  <Tr>
                    <Td colSpan={5} p={0}>
                      <Collapse in={expandedErrorId === file.id} animateOpacity>
                        <Alert status="error" variant="left-accent">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="bold" mb={1}>Validation Error:</Text>
                            <Text whiteSpace="pre-wrap">{file.validationError}</Text>
                          </Box>
                        </Alert>
                      </Collapse>
                    </Td>
                  </Tr>
                )}
              </React.Fragment>
            ))}
          </Tbody>
        </Table>
      </Box>
    )}

    {/* Delete Confirmation Dialog */}
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete File
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete {fileToDelete?.filename}? This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleDeleteFile} 
              ml={3}
              isLoading={isDeleting}
              loadingText="Deleting"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  </Box>
  );
});

// Add display name for better debugging
FileList.displayName = 'FileList';

export default FileList;