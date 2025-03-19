// src/components/product-management/ProductCard.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Stack, 
  Flex, 
  Button, 
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: {
    id: string;
    priceRecordName: string;
    effectiveDate: string;
    expiryDate: string;
    parameters: {
      pharmacyBenefitsManager: string;
      confirmWithPBM?: string;
      clientSize?: string;
      [key: string]: any;
    };
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Check if product is active (current date falls between effective and expiry dates)
  const isActive = () => {
    const now = new Date();
    const effectiveDate = new Date(product.effectiveDate);
    const expiryDate = new Date(product.expiryDate);
    
    return now >= effectiveDate && now <= expiryDate;
  };
  
  const viewDetails = () => {
    navigate(`/products/${product.id}`);
  };
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg={cardBg}
      p={4}
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="box-shadow 0.2s"
    >
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Heading size="md" isTruncated title={product.priceRecordName}>
          {product.priceRecordName}
        </Heading>
        <Badge colorScheme={isActive() ? 'green' : 'red'}>
          {isActive() ? 'Active' : 'Inactive'}
        </Badge>
      </Flex>
      
      <Text color="gray.500" fontSize="sm">
        {formatDate(product.effectiveDate)} - {formatDate(product.expiryDate)}
      </Text>
      
      <Divider my={3} />
      
      <Stack spacing={2} mt={3}>
        <Flex justify="space-between">
          <Text fontWeight="bold" fontSize="sm">PBM:</Text>
          <Text fontSize="sm">{product.parameters.pharmacyBenefitsManager}</Text>
        </Flex>
        
        {product.parameters.clientSize && (
          <Flex justify="space-between">
            <Text fontWeight="bold" fontSize="sm">Client Size:</Text>
            <Text fontSize="sm">{product.parameters.clientSize}</Text>
          </Flex>
        )}
        
        {product.parameters.confirmWithPBM && (
          <Flex justify="space-between">
            <Text fontWeight="bold" fontSize="sm">PBM Status:</Text>
            <Text fontSize="sm">{product.parameters.confirmWithPBM}</Text>
          </Flex>
        )}
      </Stack>
      
      <Button 
        mt={4} 
        size="sm" 
        colorScheme="blue" 
        onClick={viewDetails} 
        width="full" 
        variant="outline"
      >
        View Details
      </Button>
    </Box>
  );
};

export default ProductCard;