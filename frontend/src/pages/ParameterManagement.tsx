// src/pages/ParameterManagement.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription 
} from '@chakra-ui/react';

const ParameterManagement: React.FC = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Parameter Management</Heading>
      
      <Alert 
        status="info" 
        variant="subtle" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        textAlign="center" 
        height="200px" 
        borderRadius="md"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Parameter Management Coming Soon
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          We're currently working on implementing the parameter management functionality.
        </AlertDescription>
      </Alert>
    </Box>
  );
};

export default ParameterManagement;