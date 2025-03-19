// src/components/layout/Header.tsx
import React from 'react';
import { Box, Flex, Heading, Spacer } from '@chakra-ui/react';

const Header: React.FC = () => {
  return (
    <Box as="header" bg="blue.600" color="white" px={4} py={3}>
      <Flex align="center">
        <Heading size="md">Pharmacy Product Management</Heading>
        <Spacer />
        {/* Add navigation or user menu here */}
      </Flex>
    </Box>
  );
};

export default Header;