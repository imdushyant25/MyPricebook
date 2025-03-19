// src/components/file-management/ProcessingStatistics.tsx
import React from 'react';
import { 
  Box, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  StatGroup, 
  Progress, 
  Text,
  Divider,
  Heading,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

interface ProcessingStatsProps {
  recordCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}

const ProcessingStatistics: React.FC<ProcessingStatsProps> = ({
  recordCount,
  successCount,
  failureCount,
  status
}) => {
  const successRate = recordCount > 0 ? (successCount / recordCount) * 100 : 0;
  const failureRate = recordCount > 0 ? (failureCount / recordCount) * 100 : 0;
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Get the appropriate icon based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon color="green.500" boxSize={8} />;
      case 'COMPLETED_WITH_ERRORS':
        return <WarningIcon color="yellow.500" boxSize={8} />; // Add this case
      case 'FAILED':
        return <WarningIcon color="red.500" boxSize={8} />;
      default:
        return <InfoIcon color="blue.500" boxSize={8} />;
    }
  };
  
  return (
    <Box bg={bgColor} p={5} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Processing Statistics</Heading>
        {getStatusIcon()}
      </Flex>
      
      <StatGroup mb={4}>
        <Stat>
          <StatLabel>Total Records</StatLabel>
          <StatNumber>{recordCount.toLocaleString()}</StatNumber>
          <StatHelpText>File records processed</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel color="green.500">Success</StatLabel>
          <StatNumber color="green.500">{successCount.toLocaleString()}</StatNumber>
          <StatHelpText>{successRate.toFixed(1)}% of total</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel color="red.500">Failures</StatLabel>
          <StatNumber color="red.500">{failureCount.toLocaleString()}</StatNumber>
          <StatHelpText>{failureRate.toFixed(1)}% of total</StatHelpText>
        </Stat>
      </StatGroup>
      
      <Divider my={4} />
      
      <Box mt={4}>
        <Text mb={2} fontSize="sm">Success Rate</Text>
        <Progress 
          value={successRate} 
          size="md" 
          colorScheme={
            status === 'COMPLETED' ? 'green' : 
            status === 'COMPLETED_WITH_ERRORS' ? 'yellow' : 
            status === 'FAILED' ? 'red' : 'blue'
          } 
          borderRadius="md"
        />        
        <Flex justify="space-between" mt={1}>
          <Text fontSize="xs">0%</Text>
          <Text fontSize="xs" fontWeight="bold">
            {successRate.toFixed(1)}%
          </Text>
          <Text fontSize="xs">100%</Text>
        </Flex>
        <Text fontSize="xs" mt={2} textAlign="right" fontStyle="italic">
          {status === 'COMPLETED' ? 'File processing completed successfully' : 
          status === 'COMPLETED_WITH_ERRORS' ? 'File processing completed with some errors' :
          status === 'FAILED' ? 'File processing failed' : 'File processing in progress'}
        </Text>
      </Box>
    </Box>
  );
};

export default ProcessingStatistics;