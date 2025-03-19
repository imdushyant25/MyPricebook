// src/components/file-management/FileUpload.tsx
// Updated to handle successful uploads and tab switching
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Text, 
  useToast, 
  Progress, 
  Alert, 
  AlertIcon,
  FormErrorMessage,
  Flex,
  VStack,
  Heading,
  ListItem,
  UnorderedList,
  Divider
} from '@chakra-ui/react';
import { uploadFile } from '../../services/fileService';

interface FileUploadProps {
  onUploadSuccess?: () => void; // Add this prop for callback after successful upload
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setError(null);
    
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    const file = files[0];
    // Validate file type
    const validTypes = ['.xlsx', '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const isValidType = validTypes.some(type => 
      type.startsWith('.') ? file.name.toLowerCase().endsWith(type) : file.type === type
    );
    
    if (!isValidType) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Track upload progress
      const onUploadProgress = (progressEvent: any) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      };
      
      const response = await uploadFile(formData, onUploadProgress);
      
      toast({
        title: 'File uploaded successfully',
        description: `File "${selectedFile.name}" has been uploaded and is ready for processing.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call the onUploadSuccess callback to switch tabs and refresh the file list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error uploading file. Please try again.');
      toast({
        title: 'Upload failed',
        description: err.response?.data?.message || 'Error uploading file. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Simulate file input change with the dropped file
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        // Manually trigger an onChange event
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };
  
  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      boxShadow="sm"
    >
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Upload Product Excel File
      </Text>
      
      <Alert status="info" mb={4}>
  <AlertIcon />
  <VStack align="start" spacing={2} width="full">
    <Text fontWeight="bold">Excel File Requirements:</Text>
    <Text>Your Excel file must include columns with the following prefixes:</Text>
    <UnorderedList pl={4}>
      <ListItem>
        <Text as="span" fontWeight="medium">Metadata_</Text> - For product metadata fields 
        (e.g., Metadata_EffectiveDate, Metadata_ExpiryDate, Metadata_PriceRecordName)
        <Text fontSize="sm" color="gray.600" mt={1}>
          Note: ExpiryDate values can be empty/null. They will be treated as "never expires".
        </Text>
      </ListItem>
      <ListItem><Text as="span" fontWeight="medium">Parameter_</Text> - For product parameter fields (e.g., Parameter_PharmacyBenefitsManager)</ListItem>
      <ListItem><Text as="span" fontWeight="medium">ProductValue_</Text> - For product value fields (e.g., ProductValue_RetailBrandDiscount)</ListItem>
    </UnorderedList>
  </VStack>
</Alert>
      
      <Box 
        p={6} 
        borderWidth="2px" 
        borderRadius="md" 
        borderStyle="dashed" 
        borderColor="gray.300"
        bg="gray.50"
        mb={4}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        textAlign="center"
      >
        <FormControl isInvalid={!!error}>
          <FormLabel htmlFor="file-upload" cursor="pointer" m={0}>
            <Flex 
              direction="column" 
              align="center" 
              justify="center"
              h="100%"
              py={6}
            >
              <Text mb={2}>Drag and drop your Excel file here, or click to browse</Text>
              <Text fontSize="sm" color="gray.500">
                Accepted formats: .xlsx, .xls
              </Text>
              {selectedFile && (
                <Text mt={4} fontWeight="medium" color="blue.500">
                  Selected: {selectedFile.name}
                </Text>
              )}
            </Flex>
          </FormLabel>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            ref={fileInputRef}
            display="none"
          />
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>
      </Box>
      
      {isUploading && (
        <Progress 
          value={uploadProgress} 
          size="sm" 
          colorScheme="blue" 
          mb={4} 
          borderRadius="md"
        />
      )}
      
      <Button 
        onClick={handleUpload} 
        colorScheme="blue" 
        isLoading={isUploading}
        loadingText="Uploading..."
        isDisabled={!selectedFile || isUploading}
        width="full"
      >
        Upload
      </Button>
    </Box>
  );
};

export default FileUpload;