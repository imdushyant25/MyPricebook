// src/pages/NotFound.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      h="60vh" 
      textAlign="center"
    >
      <Heading size="2xl" mb={4}>404</Heading>
      <Heading size="lg" mb={4}>Page Not Found</Heading>
      <Text mb={6}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button colorScheme="blue" onClick={() => navigate('/')}>
        Return to Home
      </Button>
    </Flex>
  );
};

export default NotFound;