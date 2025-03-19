// src/components/layout/Footer.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box as="footer" bg="gray.100" px={4} py={3} textAlign="center">
      <Text fontSize="sm" color="gray.500">
        Pharmacy Product Management System &copy; {new Date().getFullYear()}
      </Text>
    </Box>
  );
};

export default Footer;