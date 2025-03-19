// src/components/layout/Layout.tsx
import React, { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Flex flex="1">
        <Sidebar />
        <Box 
          as="main" 
          flex="1" 
          p={4} 
          bg="gray.50"
          overflowY="auto"
        >
          {children}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default Layout;