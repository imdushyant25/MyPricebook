// src/pages/FileResultsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Flex,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
  Tag,
  HStack,
  useToast
} from '@chakra-ui/react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getProcessingResults } from '../services/fileService';
import ProcessingStatistics from '../components/file-management/ProcessingStatistics';
import RejectionLogs from '../components/file-management/RejectionLogs';
import FileProcessing from '../components/file-management/FileProcessing';
import { ChevronLeftIcon } from '@chakra-ui/icons';

const FileResultsPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      if (!fileId) {
        setError('No file ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getProcessingResults(fileId);
        setResults(data);
      } catch (err: any) {
        console.error('Error fetching file results:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load processing results. Please try again.'
        );
        
        toast({
          title: 'Error loading results',
          description: err.response?.data?.message || 'An error occurred while loading file results.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [fileId, toast]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px" direction="column">
        <Spinner size="xl" mb={4} color="blue.500" />
        <Heading size="md">Loading file results...</Heading>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/files">Files</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Results</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
        
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          mt={4} 
          onClick={() => navigate('/files')}
        >
          Back to Files
        </Button>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box p={4}>
        <Breadcrumb mb={6}>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/files">Files</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Results</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No results found for the specified file
        </Alert>
        
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          mt={4} 
          onClick={() => navigate('/files')}
        >
          Back to Files
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Breadcrumb mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/files">Files</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Results: {results.filename}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justify="space-between" align="center" mb={6}>
        <HStack>
          <Heading size="lg">{results.filename}</Heading>
          <Tag 
            size="md" 
            colorScheme={
              results.status === 'COMPLETED' ? 'green' : 
              results.status === 'COMPLETED_WITH_ERRORS' ? 'yellow' :
              results.status === 'FAILED' ? 'red' : 
              'blue'
            }
          >
            {results.status}
          </Tag>
        </HStack>
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          variant="outline" 
          onClick={() => navigate('/files')}
        >
          Back to Files
        </Button>
      </Flex>

      <FileProcessing />

      <Divider my={6} />

      {(results.status === 'COMPLETED' || results.status === 'COMPLETED_WITH_ERRORS' || results.status === 'FAILED') && (
        <>
          <Box mb={6}>
            <ProcessingStatistics 
              recordCount={results.recordCount || 0}
              successCount={results.successCount || 0}
              failureCount={results.failureCount || 0}
              status={results.status}
            />
          </Box>

          {results.rejectionLogs && results.rejectionLogs.length > 0 && (
            <Box mt={6} bg="white" p={5} borderRadius="md" shadow="sm">
              <RejectionLogs logs={results.rejectionLogs} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default FileResultsPage;