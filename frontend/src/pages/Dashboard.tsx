// src/pages/Dashboard.tsx
import React from 'react';
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Card, 
  CardHeader, 
  CardBody, 
  Text 
} from '@chakra-ui/react';

const Dashboard: React.FC = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Files Overview</Heading>
          </CardHeader>
          <CardBody>
            <Text>Dashboard coming soon</Text>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Products Overview</Heading>
          </CardHeader>
          <CardBody>
            <Text>Dashboard coming soon</Text>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            <Text>Dashboard coming soon</Text>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;