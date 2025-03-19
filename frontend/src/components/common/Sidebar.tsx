// src/components/layout/Sidebar.tsx
import React from 'react';
import { Box, VStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <Box
      as="nav"
      w="240px"
      bg="gray.100"
      p={4}
      h="calc(100vh - 116px)" // Adjust based on header and footer height
      overflowY="auto"
    >
      <VStack spacing={3} align="stretch">
        <Text fontWeight="bold" fontSize="sm" color="gray.500" mb={2}>
          MANAGEMENT
        </Text>
        
        <Link as={RouterLink} to="/files" _hover={{ textDecor: 'none' }}>
          <Box p={2} borderRadius="md" _hover={{ bg: 'blue.50' }}>
            File Management
          </Box>
        </Link>
        
        <Link as={RouterLink} to="/products" _hover={{ textDecor: 'none' }}>
          <Box p={2} borderRadius="md" _hover={{ bg: 'blue.50' }}>
            Product Management
          </Box>
        </Link>
        
        <Link as={RouterLink} to="/parameters" _hover={{ textDecor: 'none' }}>
          <Box p={2} borderRadius="md" _hover={{ bg: 'blue.50' }}>
            Parameter Management
          </Box>
        </Link>
      </VStack>
    </Box>
  );
};

export default Sidebar;