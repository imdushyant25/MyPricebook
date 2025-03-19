// src/components/product-management/ProductCreate.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Alert, 
  AlertIcon
} from '@chakra-ui/react';

const ProductCreate: React.FC = () => {
  return (
    <Box p={4}>
      <Heading size="md" mb={4}>Create New Product</Heading>
      <Alert status="info">
        <AlertIcon />
        <Text>This feature is under development. Please check back later.</Text>
      </Alert>
    </Box>
  );
};

export default ProductCreate;