// src/components/product-management/ProductDetails.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Spinner, 
  Flex, 
  Divider, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Button,
  useToast,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Tag,
  IconButton,
  Tooltip,
  HStack,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  EditIcon, 
  DownloadIcon, 
  InfoIcon, 
  CalendarIcon,
  StarIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { getProductById } from '../../services/productService';
import { formatDate, formatCurrency, formatPercent } from '../../utils/formatters';

interface ChannelDataProps {
  title: string;
  values: any;
  channelKey: string;
}

const ChannelData: React.FC<ChannelDataProps> = ({ title, values, channelKey }) => {
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const channel = values?.[channelKey];
  
  if (!channel) return null;
  
  // Check if this channel has any non-null values to display
  const hasBrandData = channel.brand && (
    channel.brand.discount !== null || 
    channel.brand.dispensingFee !== null || 
    channel.brand.rebate !== null
  );
  
  const hasGenericData = channel.generic && (
    channel.generic.discount !== null || 
    channel.generic.dispensingFee !== null
  );
  
  if (!hasBrandData && !hasGenericData) return null;
  
  return (
    <Card variant="outline" size="sm" mb={4} shadow="sm">
      <CardHeader bg={cardHeaderBg} py={2} px={4}>
        <Text fontWeight="bold" fontSize="sm">{title}</Text>
      </CardHeader>
      <CardBody p={0}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th isNumeric>Discount</Th>
              <Th isNumeric>Dispensing Fee</Th>
              <Th isNumeric>Rebate</Th>
            </Tr>
          </Thead>
          <Tbody>
            {hasBrandData && (
              <Tr>
                <Td fontWeight="medium">Brand</Td>
                <Td isNumeric>{channel.brand.discount !== null ? formatPercent(channel.brand.discount) : '-'}</Td>
                <Td isNumeric>{channel.brand.dispensingFee !== null ? formatCurrency(channel.brand.dispensingFee) : '-'}</Td>
                <Td isNumeric>{channel.brand.rebate !== null ? formatCurrency(channel.brand.rebate) : '-'}</Td>
              </Tr>
            )}
            {hasGenericData && (
              <Tr>
                <Td fontWeight="medium">Generic</Td>
                <Td isNumeric>{channel.generic.discount !== null ? formatPercent(channel.generic.discount) : '-'}</Td>
                <Td isNumeric>{channel.generic.dispensingFee !== null ? formatCurrency(channel.generic.dispensingFee) : '-'}</Td>
                <Td isNumeric>-</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

// Special component for blended specialty which has a different structure
const BlendedSpecialtyData: React.FC<{ values: any }> = ({ values }) => {
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const blended = values?.blendedSpecialty;
  
  if (!blended) return null;
  
  // Check if there's any data to display
  const hasLddData = blended.ldd && (
    blended.ldd.discount !== null || 
    blended.ldd.dispensingFee !== null || 
    blended.ldd.rebate !== null
  );
  
  const hasNonLddData = blended.nonLdd && (
    blended.nonLdd.discount !== null || 
    blended.nonLdd.dispensingFee !== null || 
    blended.nonLdd.rebate !== null
  );
  
  if (!hasLddData && !hasNonLddData) return null;
  
  return (
    <Card variant="outline" size="sm" mb={4} shadow="sm">
      <CardHeader bg={cardHeaderBg} py={2} px={4}>
        <Text fontWeight="bold" fontSize="sm">Blended Specialty</Text>
      </CardHeader>
      <CardBody p={0}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th isNumeric>Discount</Th>
              <Th isNumeric>Dispensing Fee</Th>
              <Th isNumeric>Rebate</Th>
            </Tr>
          </Thead>
          <Tbody>
            {hasLddData && (
              <Tr>
                <Td fontWeight="medium">LDD</Td>
                <Td isNumeric>{blended.ldd.discount !== null ? formatPercent(blended.ldd.discount) : '-'}</Td>
                <Td isNumeric>{blended.ldd.dispensingFee !== null ? formatCurrency(blended.ldd.dispensingFee) : '-'}</Td>
                <Td isNumeric>{blended.ldd.rebate !== null ? formatCurrency(blended.ldd.rebate) : '-'}</Td>
              </Tr>
            )}
            {hasNonLddData && (
              <Tr>
                <Td fontWeight="medium">Non-LDD</Td>
                <Td isNumeric>{blended.nonLdd.discount !== null ? formatPercent(blended.nonLdd.discount) : '-'}</Td>
                <Td isNumeric>{blended.nonLdd.dispensingFee !== null ? formatCurrency(blended.nonLdd.dispensingFee) : '-'}</Td>
                <Td isNumeric>{blended.nonLdd.rebate !== null ? formatCurrency(blended.nonLdd.rebate) : '-'}</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

// Component for overall fee and credit which has a unique structure
const OverallFeeData: React.FC<{ values: any }> = ({ values }) => {
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const overall = values?.overallFeeAndCredit;
  
  if (!overall) return null;
  
  // Check if there's any data to display
  const hasData = (
    overall.pepmRebateCredit !== null || 
    overall.pricingFee !== null || 
    overall.inHousePharmacyFee !== null
  );
  
  if (!hasData) return null;
  
  return (
    <Card variant="outline" size="sm" mb={4} shadow="sm">
      <CardHeader bg={cardHeaderBg} py={2} px={4}>
        <Text fontWeight="bold" fontSize="sm">Overall Fee & Credit</Text>
      </CardHeader>
      <CardBody p={0}>
        <Table size="sm" variant="simple">
          <Tbody>
            <Tr>
              <Td fontWeight="medium">PEPM Rebate Credit</Td>
              <Td isNumeric>{overall.pepmRebateCredit !== null ? formatCurrency(overall.pepmRebateCredit) : '-'}</Td>
            </Tr>
            <Tr>
              <Td fontWeight="medium">Pricing Fee</Td>
              <Td isNumeric>{overall.pricingFee !== null ? formatCurrency(overall.pricingFee) : '-'}</Td>
            </Tr>
            <Tr>
              <Td fontWeight="medium">In-House Pharmacy Fee</Td>
              <Td isNumeric>{overall.inHousePharmacyFee !== null ? formatCurrency(overall.inHousePharmacyFee) : '-'}</Td>
            </Tr>
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

// Component for rendering a parameter group
interface ParameterGroupProps {
  title: string;
  icon: React.ReactElement;
  parameters: Record<string, any>;
  keys: string[];
  colorScheme?: string;
}

const ParameterGroup: React.FC<ParameterGroupProps> = ({ 
  title, 
  icon, 
  parameters,
  keys,
  colorScheme = "blue" 
}) => {
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.700');
  
  if (!parameters) return null;
  
  // Count how many of our keys have values
  const hasValues = keys.some(key => parameters[key] !== undefined && parameters[key] !== null);
  
  if (!hasValues) return null;
  
  return (
    <Card variant="outline" size="sm" mb={4} shadow="sm">
      <CardHeader bg={cardHeaderBg} py={2} px={4}>
        <Flex align="center">
          <Box mr={2} color={`${colorScheme}.500`}>
            {icon}
          </Box>
          <Text fontWeight="bold" fontSize="sm">{title}</Text>
        </Flex>
      </CardHeader>
      <CardBody py={2}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
          {keys.map(key => {
            if (parameters[key] === undefined || parameters[key] === null) return null;
            
            return (
              <Box key={key}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
                <Text>{String(parameters[key])}</Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  
  // Color mode values - defined at the component level to follow React Hooks rules
  const headerBg = useColorModeValue("blue.50", "blue.900");
  const cardBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('No product ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err: any) {
        console.error('Error fetching product details:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load product details. Please try again.'
        );
        
        toast({
          title: 'Error loading product',
          description: err.response?.data?.message || 'An error occurred while loading product details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px" direction="column">
        <Spinner size="xl" mb={4} color="blue.500" />
        <Heading size="md">Loading product details...</Heading>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
        
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          mt={4} 
          onClick={() => navigate('/products')}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box p={4}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No product found with the specified ID
        </Alert>
        
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          mt={4} 
          onClick={() => navigate('/products')}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  // Extract product name from parameters if available
  const productName = product.parameters.priceRecordName || 
                      "Unnamed Product";
  
  // Extract PBM
  const pbm = product.parameters.pharmacyBenefitsManager;
  
  // Check if product is active
  const isActive = () => {
    const now = new Date();
    const effectiveDate = new Date(product.metadata.effectiveDate);
    const expiryDate = product.metadata.expiryDate ? new Date(product.metadata.expiryDate) : null;
    
    return now >= effectiveDate && (!expiryDate || now <= expiryDate);
  };
  
  // Group parameters for better organization
  const contractParameters = [
    'contractDuration', 
    'timeInContract',
    'clientSize',
    'employerStatusToRxBenefits',
    'employerStatusToPBM',
    'companyHeadQuarterState'
  ];
  
  const networkParameters = [
    'retailNetwork',
    'maintenancePharmacyNetwork',
    'specialtyPharmacyNetwork',
    'specialtyDaysSupply'
  ];
  
  const formularyParameters = [
    'formulary',
    'utilizationManagementBundleSelection',
    'coPayTiers'
  ];
  
  const pricingParameters = [
    'customPricing',
    'customPricingNote',
    'discountAndRebateType',
    'pricingTier',
    'decrementedRate',
    'limitedDistributionRebatesAllocation',
    'hivRebatesAllocation',
    'rebateGuaranteeReconcilationMethod'
  ];
  
  const otherParameters = [
    'confirmedWithPBM',
    'hospitalPricing',
    'employerGroupWaiverPlan',
    'stopLossPricing',
    'inHousePharmacy'
  ];

  return (
    <Box p={4}>
      {/* Header with back button */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button 
          leftIcon={<ChevronLeftIcon />} 
          variant="outline" 
          onClick={() => navigate('/products')}
          size="sm"
        >
          Back to Products
        </Button>
        
        <HStack>
          <Button 
            leftIcon={<EditIcon />}
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/products/${productId}/edit`)}
          >
            Edit
          </Button>
          <Button 
            leftIcon={<DownloadIcon />}
            colorScheme="green"
            variant="outline"
            size="sm"
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Product header card */}
      <Card bg={cardBg} mb={6} variant="outline">
        <Box bg={headerBg} p={5} borderTopRadius="md">
          <Flex justify="space-between" align="flex-start" wrap="wrap">
            <Box>
              <Heading size="lg" mb={1}>{productName}</Heading>
              <HStack spacing={4}>
                <Text fontWeight="bold" color="gray.600">{pbm}</Text>
                <Badge 
                  colorScheme={isActive() ? 'green' : 'red'} 
                  fontSize="md" 
                  px={2} 
                  py={1}
                  borderRadius="full"
                >
                  {isActive() ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
            </Box>
            <Box mt={{ base: 4, md: 0 }}>
              <HStack>
                <CalendarIcon />
                <Text><strong>Effective:</strong> {formatDate(product.metadata.effectiveDate)}</Text>
                {product.metadata.expiryDate && (
                  <>
                    <Text>to</Text>
                    <Text>{formatDate(product.metadata.expiryDate)}</Text>
                  </>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Created: {formatDate(product.metadata.createdAt, { includeTime: true })}
              </Text>
            </Box>
          </Flex>
        </Box>
        
        <CardBody>
          <Tabs variant="enclosed" colorScheme="blue" isFitted>
            <TabList>
              <Tab fontWeight="medium">Parameters</Tab>
              <Tab fontWeight="medium">Values</Tab>
            </TabList>
            <TabPanels>
              {/* Parameters Panel */}
              <TabPanel px={0} pt={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <GridItem>
                    <ParameterGroup
                      title="Contract Information"
                      icon={<InfoIcon />}
                      parameters={product.parameters}
                      keys={contractParameters}
                      colorScheme="blue"
                    />
                    
                    <ParameterGroup
                      title="Formulary & Benefits"
                      icon={<StarIcon />}
                      parameters={product.parameters}
                      keys={formularyParameters}
                      colorScheme="purple"
                    />
                    
                    <ParameterGroup
                      title="Other Settings"
                      icon={<SettingsIcon />}
                      parameters={product.parameters}
                      keys={otherParameters}
                      colorScheme="gray"
                    />
                  </GridItem>
                  
                  <GridItem>
                    <ParameterGroup
                      title="Network Configuration"
                      icon={<InfoIcon />}
                      parameters={product.parameters}
                      keys={networkParameters}
                      colorScheme="teal"
                    />
                    
                    <ParameterGroup
                      title="Pricing Configuration"
                      icon={<InfoIcon />}
                      parameters={product.parameters}
                      keys={pricingParameters}
                      colorScheme="orange"
                    />
                  </GridItem>
                </SimpleGrid>
                
                {/* Show any remaining parameters not covered by groups */}
                {Object.entries(product.parameters).length > 0 && (
                  <Box mt={6}>
                    <Heading size="sm" mb={4}>All Parameters</Heading>
                    <Table variant="simple" size="sm" borderWidth="1px" borderRadius="md">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>Parameter</Th>
                          <Th>Value</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.entries(product.parameters).map(([key, value]) => (
                          <Tr key={key}>
                            <Td fontWeight="medium">
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            </Td>
                            <Td>{String(value)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
              
              {/* Values Panel */}
              <TabPanel px={0} pt={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  <GridItem>
                    <OverallFeeData values={product.values} />
                    <ChannelData title="Retail" values={product.values} channelKey="retail" />
                    <ChannelData title="Retail 90" values={product.values} channelKey="retail90" />
                    <ChannelData title="Maintenance" values={product.values} channelKey="maintenance" />
                    <ChannelData title="Mail" values={product.values} channelKey="mail" />
                  </GridItem>
                  
                  <GridItem>
                    <ChannelData title="Specialty Mail" values={product.values} channelKey="specialtyMail" />
                    <ChannelData title="Specialty Retail" values={product.values} channelKey="specialtyRetail" />
                    <ChannelData title="Limited Distribution Mail" values={product.values} channelKey="limitedDistributionMail" />
                    <ChannelData title="Limited Distribution Retail" values={product.values} channelKey="limitedDistributionRetail" />
                    <BlendedSpecialtyData values={product.values} />
                  </GridItem>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ProductDetails;