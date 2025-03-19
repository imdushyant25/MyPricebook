// src/pages/ProductManagement.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription, 
  Button
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const ProductManagement: React.FC = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Product Management</Heading>
      
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
          Product Management Coming Soon
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          We're currently working on implementing the product management functionality.
        </AlertDescription>
      </Alert>
      
      <Button
        as={Link}
        to="/files"
        colorScheme="blue"
        mt={4}
      >
        Go to File Management
      </Button>
    </Box>
  );
};

export default ProductManagement;