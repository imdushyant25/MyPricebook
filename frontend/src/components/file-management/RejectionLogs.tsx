// src/components/file-management/RejectionLogs.tsx
import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Button,
  Collapse,
  Flex,
  Tag,
  IconButton,
  Input,
  Select,
  HStack,
  useDisclosure,
  Tooltip,
  Heading,
  Divider
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, SearchIcon } from '@chakra-ui/icons';

interface RejectionLog {
  id: string;
  rowNumber: number;
  reasonCode: string;
  reasonDescription: string;
  rawData: string | object;
  createdAt: string;
}

interface RejectionLogsProps {
  logs: RejectionLog[];
  isLoading?: boolean;
}

const RejectionLogs: React.FC<RejectionLogsProps> = ({ logs, isLoading = false }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  
  const toggleRow = (logId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  // Get unique reason codes for filter dropdown
  const uniqueReasonCodes = Array.from(new Set(logs.map(log => log.reasonCode)));
  
  // Filter logs based on search term and reason filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.reasonDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.rowNumber).includes(searchTerm);
    
    const matchesReason = reasonFilter === '' || log.reasonCode === reasonFilter;
    
    return matchesSearch && matchesReason;
  });
  
  // Generate CSV download of rejection logs
  const downloadRejectionLogs = () => {
    // Create CSV content
    const headers = ['Row Number', 'Reason Code', 'Reason Description', 'Raw Data', 'Created At'];
    const csvContent = logs.map(log => {
      return [
        log.rowNumber,
        log.reasonCode,
        log.reasonDescription,
        typeof log.rawData === 'string' ? log.rawData : JSON.stringify(log.rawData),
        new Date(log.createdAt).toLocaleString()
      ].join(',');
    });
    
    const csvString = [
      headers.join(','),
      ...csvContent
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rejection-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }
  
  if (!logs || logs.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        No rejection logs found
      </Alert>
    );
  }
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Heading size="md">Rejection Logs</Heading>
          <Tag colorScheme="red" size="md">{logs.length}</Tag>
        </HStack>
        <Button 
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />} 
          onClick={onToggle} 
          size="sm"
        >
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        <Flex mb={4} gap={4} flexDir={["column", "row"]}>
          <HStack flex="1">
            <Input
              placeholder="Search by row number or reason"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="md"
            />
            <IconButton
              aria-label="Search"
              icon={<SearchIcon />}
              variant="outline"
            />
          </HStack>
          
          <Select 
            placeholder="Filter by reason code" 
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            maxW="250px"
          >
            <option value="">All reason codes</option>
            {uniqueReasonCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </Select>
          
          <Tooltip label="Download rejection logs as CSV">
            <IconButton
              aria-label="Download"
              icon={<DownloadIcon />}
              variant="outline"
              onClick={downloadRejectionLogs}
            />
          </Tooltip>
        </Flex>
        
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th width="100px">Row</Th>
                <Th width="150px">Code</Th>
                <Th>Reason</Th>
                <Th width="150px">Date</Th>
                <Th width="80px" textAlign="center">Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <Tr 
                    _hover={{ bg: 'gray.50' }}
                    cursor="pointer"
                    onClick={() => toggleRow(log.id)}
                  >
                    <Td><Badge colorScheme="red">Row {log.rowNumber}</Badge></Td>
                    <Td><Badge>{log.reasonCode}</Badge></Td>
                    <Td>{log.reasonDescription}</Td>
                    <Td>{new Date(log.createdAt).toLocaleString()}</Td>
                    <Td textAlign="center">
                      <IconButton
                        aria-label={expandedRows[log.id] ? "Hide details" : "Show details"}
                        icon={expandedRows[log.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(log.id);
                        }}
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td colSpan={5} p={0}>
                      <Collapse in={expandedRows[log.id]}>
                        <Box p={4} bg="gray.50">
                          <Text fontWeight="bold" mb={2}>Raw Data:</Text>
                          <Box 
                            p={3} 
                            bg="gray.100" 
                            borderRadius="md" 
                            fontFamily="monospace" 
                            fontSize="sm"
                            overflowX="auto"
                          >
                            <pre>
                              {typeof log.rawData === 'string' 
                                ? JSON.stringify(JSON.parse(log.rawData), null, 2) 
                                : JSON.stringify(log.rawData, null, 2)}
                            </pre>
                          </Box>
                        </Box>
                      </Collapse>
                    </Td>
                  </Tr>
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {filteredLogs.length === 0 && searchTerm !== '' && (
          <Alert status="info" mt={2}>
            <AlertIcon />
            No rejection logs matching your search criteria
          </Alert>
        )}
      </Collapse>
    </Box>
  );
};

export default RejectionLogs;