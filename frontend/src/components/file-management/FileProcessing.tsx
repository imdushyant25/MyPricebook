// src/components/file-management/FileProcessing.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Alert, 
  AlertIcon, 
  Progress, 
  Flex,
  Badge,
  Stack,
  Collapse,
  Button,
  VStack,
  Divider,
  useDisclosure
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

interface FileProcessingProps {
  file?: {
    id: string;
    filename: string;
    status: string;
    uploadDate: string;
    processingDate?: string;
    recordCount?: number;
    successCount?: number;
    failureCount?: number;
    validationError?: string;
  };
}

const FileProcessing: React.FC<FileProcessingProps> = ({ file }) => {
  const { fileId } = useParams<{ fileId: string }>();
  const { isOpen, onToggle } = useDisclosure();
  
  if (!file && !fileId) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        No file information available
      </Alert>
    );
  }
  
  const getStatusBadge = (status: string) => {
    const colorScheme = {
      'PENDING': 'gray',
      'PROCESSING': 'blue',
      'COMPLETED': 'green',
      'FAILED': 'red',
      'COMPLETED_WITH_ERRORS': 'yellow'
    }[status] || 'gray';
    
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };
  
  const getProgressPercentage = () => {
    if (!file?.recordCount) return 0;
    return Math.round((file.successCount || 0) / file.recordCount * 100);
  };
  
  return (
    <Box bg="white" p={5} borderRadius="md" shadow="sm">
      <Heading size="md" mb={4}>File Processing Details</Heading>
      
      {file?.status === 'FAILED' && file.validationError && (
  <Box mt={4}>
    <Divider my={3} />
    <Heading size="sm" mb={3}>File Format Requirements</Heading>
    <VStack align="start" spacing={3}>
      <Box>
        <Text fontWeight="bold">Required Metadata Fields:</Text>
        <Text>The following metadata fields must be present in your file:</Text>
        <Text as="code" bg="gray.100" p={1} borderRadius="md">Metadata_EffectiveDate, Metadata_ExpiryDate, Metadata_PriceRecordName</Text>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Note: ExpiryDate field must be present but can contain null/empty values.
        </Text>
      </Box>
      
      <Box>
        <Text fontWeight="bold">Required Parameter Fields:</Text>
        <Text>Your file must include all active parameters with the prefix "Parameter_"</Text>
      </Box>
      
      <Box>
        <Text fontWeight="bold">Required Product Value Fields:</Text>
        <Text>Your file must include product value fields with the prefix "ProductValue_"</Text>
      </Box>
    </VStack>
  </Box>
)}
      
      <Stack spacing={4}>
        <Flex justify="space-between">
          <Text fontWeight="bold">Status:</Text>
          {file && getStatusBadge(file.status)}
        </Flex>
        
        {file?.uploadDate && (
          <Flex justify="space-between">
            <Text fontWeight="bold">Uploaded:</Text>
            <Text>{new Date(file.uploadDate).toLocaleString()}</Text>
          </Flex>
        )}
        
        {file?.processingDate && (
          <Flex justify="space-between">
            <Text fontWeight="bold">Processed:</Text>
            <Text>{new Date(file.processingDate).toLocaleString()}</Text>
          </Flex>
        )}
        
        {file?.recordCount !== undefined && (
          <>
            <Flex justify="space-between">
              <Text fontWeight="bold">Records:</Text>
              <Text>{file.recordCount}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Successful:</Text>
              <Text color="green.500">{file.successCount || 0}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Failed:</Text>
              <Text color="red.500">{file.failureCount || 0}</Text>
            </Flex>
            
            <Box mt={2}>
              <Text mb={1} fontSize="sm">Processing Success Rate</Text>
              <Progress 
                value={getProgressPercentage()} 
                colorScheme={file.status === 'FAILED' ? 'red' : 'green'} 
                size="sm" 
                borderRadius="md"
              />
              <Text mt={1} fontSize="sm" textAlign="right">
                {getProgressPercentage()}%
              </Text>
            </Box>
          </>
        )}
      </Stack>
      
      {/* Display validation requirements if file failed validation */}
      {file?.status === 'FAILED' && file.validationError && (
        <Box mt={4}>
          <Divider my={3} />
          <Heading size="sm" mb={3}>File Format Requirements</Heading>
          <VStack align="start" spacing={3}>
            <Box>
              <Text fontWeight="bold">Required Metadata Fields:</Text>
              <Text>The following metadata fields must be present in your file:</Text>
              <Text as="code" bg="gray.100" p={1} borderRadius="md">Metadata_EffectiveDate, Metadata_ExpiryDate, Metadata_PriceRecordName</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Required Parameter Fields:</Text>
              <Text>Your file must include all active parameters with the prefix "Parameter_"</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Required Product Value Fields:</Text>
              <Text>Your file must include product value fields with the prefix "ProductValue_"</Text>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default FileProcessing;