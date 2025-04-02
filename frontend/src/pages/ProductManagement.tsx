// src/pages/ProductManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  Text,
  Tag,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Grid,
  Card,
  CardBody,
  Stack,
  Divider,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  ViewIcon, 
  EditIcon, 
  ChevronDownIcon, 
  RepeatIcon, 
  DownloadIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { searchProducts } from '../services/productService';
import { formatDate, formatPercent } from '../utils/formatters';

interface Channel {
  name: string;
  key: string;
  label: string;
}

interface Product {
  id: string;
  productName: string;
  pbm: string;
  effectiveDate: string;
  expiryDate: string | null;
  clientSize: string;
  formulary: string;
  discountType: string;
  key_values: any;
  status: 'ACTIVE' | 'EXPIRED';
  parameters: any;
  values: any;
  createdAt: string;
}

const CHANNELS: Channel[] = [
  { key: 'retail', name: 'Retail', label: 'RT' },
  { key: 'retail90', name: 'Retail 90', label: 'R90' },
  { key: 'maintenance', name: 'Maintenance', label: 'MN' },
  { key: 'mail', name: 'Mail', label: 'ML' },
  { key: 'specialtyMail', name: 'Specialty Mail', label: 'SM' },
  { key: 'specialtyRetail', name: 'Specialty Retail', label: 'SR' },
  { key: 'limitedDistributionMail', name: 'Limited Distribution Mail', label: 'LDM' },
  { key: 'limitedDistributionRetail', name: 'Limited Distribution Retail', label: 'LDR' },
];

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCardView, setIsCardView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pbmFilter, setPbmFilter] = useState('');
  const [formularyFilter, setFormularyFilter] = useState('');
  const [clientSizeFilter, setClientSizeFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const toast = useToast();

  // Background colors for status badges
  const activeBg = useColorModeValue('green.100', 'green.700');
  const expiredBg = useColorModeValue('red.100', 'red.700');
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, pbmFilter, formularyFilter, clientSizeFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await searchProducts();
      console.log("Products fetched:", data);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load products. Please try again.'
      );
      
      toast({
        title: 'Error loading products',
        description: err.response?.data?.message || 'An error occurred while loading products.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    const activeFilterList: string[] = [];
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(
        product => 
          product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.pbm.toLowerCase().includes(searchTerm.toLowerCase())
      );
      activeFilterList.push(`Search: ${searchTerm}`);
    }
    
    // Apply PBM filter
    if (pbmFilter) {
      filtered = filtered.filter(product => product.pbm === pbmFilter);
      activeFilterList.push(`PBM: ${pbmFilter}`);
    }
    
    // Apply formulary filter
    if (formularyFilter) {
      filtered = filtered.filter(product => product.formulary === formularyFilter);
      activeFilterList.push(`Formulary: ${formularyFilter}`);
    }
    
    // Apply client size filter
    if (clientSizeFilter) {
      filtered = filtered.filter(product => product.clientSize === clientSizeFilter);
      activeFilterList.push(`Client Size: ${clientSizeFilter}`);
    }
    
    setFilteredProducts(filtered);
    setActiveFilters(activeFilterList);
  };

  // Get unique values for filter dropdowns
  const uniquePbms = useMemo(() => {
    const set = new Set(products.map(product => product.pbm));
    return Array.from(set).sort();
  }, [products]);
  
  const uniqueFormularies = useMemo(() => {
    const set = new Set(products.map(product => product.formulary));
    return Array.from(set).sort();
  }, [products]);
  
  const uniqueClientSizes = useMemo(() => {
    const set = new Set(products.map(product => product.clientSize));
    return Array.from(set).sort();
  }, [products]);

  const clearFilters = () => {
    setSearchTerm('');
    setPbmFilter('');
    setFormularyFilter('');
    setClientSizeFilter('');
  };

  const handleExport = () => {
    toast({
      title: 'Export functionality',
      description: 'This feature is not yet implemented.',
      status: 'info',
      duration: 3000,
    });
  };

  // Get discount values from product for a specific channel
  const getChannelDiscounts = (product: Product, channelKey: string) => {
    if (!product.values || !product.values[channelKey]) return { brand: null, generic: null };
    
    const channel = product.values[channelKey];
    return {
      brand: channel.brand?.discount,
      generic: channel.generic?.discount,
    };
  };

  // Return all discount pairs for various channels
  const getDiscountsByChannel = (product: Product) => {
    // Start with blended specialty as a special case
    const discounts: Record<string, {name: string, label: string, brand: number | null, generic: number | null}> = {};
    
    // Handle regular channels
    CHANNELS.forEach(channel => {
      const { brand, generic } = getChannelDiscounts(product, channel.key);
      discounts[channel.key] = {
        name: channel.name,
        label: channel.label,
        brand,
        generic,
      };
    });
    
    // Handle blended specialty as a special case if it exists
    if (product.values?.blendedSpecialty) {
      discounts.blendedSpecialty = {
        name: 'Blended Specialty',
        label: 'BS',
        brand: product.values.blendedSpecialty.nonLdd?.discount || null,
        generic: product.values.blendedSpecialty.ldd?.discount || null,
      };
    }
    
    return discounts;
  };

  // Format detail information
  const formatProductInfo = (product: Product) => {
    return (
      <VStack align="start" spacing={1}>
        <Text fontWeight="bold">{product.productName}</Text>
        <Text fontSize="sm" color="gray.600">
          <Text as="span" fontWeight="medium">PBM:</Text> {product.pbm}
        </Text>
        <Text fontSize="sm" color="gray.600">
          <Text as="span" fontWeight="medium">Effective:</Text> {formatDate(product.effectiveDate)}
          {product.expiryDate && ` to ${formatDate(product.expiryDate)}`}
        </Text>
        <Badge 
          colorScheme={product.status === 'ACTIVE' ? 'green' : 'red'} 
          fontSize="xs" 
          mt={1}
        >
          {product.status}
        </Badge>
      </VStack>
    );
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Products</Heading>
      
      {/* Filters and Search */}
      <Box p={5} borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
          <InputGroup flex="1">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search by product name, PBM, etc." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            placeholder="Filter by PBM"
            value={pbmFilter}
            onChange={e => setPbmFilter(e.target.value)}
            width={{ base: 'full', md: '300px' }}
          >
            {uniquePbms.map(pbm => (
              <option key={pbm} value={pbm}>{pbm}</option>
            ))}
          </Select>

          <HStack spacing={2} ml="auto">
            <Button 
              leftIcon={isCardView ? <ViewIcon /> : <ViewIcon />}
              onClick={() => setIsCardView(!isCardView)}
              variant="outline"
            >
              {isCardView ? "Table View" : "Card View"}
            </Button>
            
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline">
                Export
              </MenuButton>
              <MenuList>
                <MenuItem icon={<DownloadIcon />} onClick={handleExport}>
                  Export as Excel
                </MenuItem>
                <MenuItem icon={<DownloadIcon />} onClick={handleExport}>
                  Export as CSV
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
        
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <Select 
            placeholder="Filter by Formulary"
            value={formularyFilter}
            onChange={e => setFormularyFilter(e.target.value)}
            flex="1"
          >
            {uniqueFormularies.map(formulary => (
              <option key={formulary} value={formulary}>{formulary}</option>
            ))}
          </Select>
          
          <Select 
            placeholder="Filter by Client Size"
            value={clientSizeFilter}
            onChange={e => setClientSizeFilter(e.target.value)}
            flex="1"
          >
            {uniqueClientSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Select>
          
          <Button colorScheme="blue" onClick={applyFilters}>
            Apply Filters
          </Button>
          
          {activeFilters.length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Flex>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Flex mt={4} align="center">
            <Text fontWeight="bold" mr={2}>Active Filters:</Text>
            <Flex gap={2} flexWrap="wrap">
              {activeFilters.map((filter, index) => (
                <Tag key={index} size="md" colorScheme="blue" borderRadius="full">
                  {filter}
                </Tag>
              ))}
            </Flex>
          </Flex>
        )}
      </Box>
      
      {/* Results Count and Refresh */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="medium">
          Showing {filteredProducts.length} of {products.length} products
        </Text>
        <Button 
          leftIcon={<RepeatIcon />} 
          size="sm" 
          variant="outline"
          onClick={fetchProducts}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </Flex>
      
      {/* Loading Spinner */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      ) : filteredProducts.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No products found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : isCardView ? (
        /* Card View */
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {filteredProducts.map(product => {
            const discounts = getDiscountsByChannel(product);
            
            return (
              <Card key={product.id} borderRadius="lg" overflow="hidden" variant="outline">
                <CardBody>
                  <Stack spacing={4}>
                    <Flex justify="space-between" align="flex-start">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{product.productName}</Heading>
                        <Text color="blue.600" fontWeight="medium">{product.pbm}</Text>
                        <Text fontSize="sm">
                          {formatDate(product.effectiveDate)}
                          {product.expiryDate && ` - ${formatDate(product.expiryDate)}`}
                        </Text>
                      </VStack>
                      <Badge colorScheme={product.status === 'ACTIVE' ? 'green' : 'red'} mt={1}>
                        {product.status}
                      </Badge>
                    </Flex>
                    
                    <Divider />
                    
                    <Box>
                      <Heading size="sm" mb={2}>Key Parameters</Heading>
                      <Flex wrap="wrap" gap={2}>
                        <Tooltip label="Formulary" placement="top">
                          <Tag colorScheme="purple">{product.formulary}</Tag>
                        </Tooltip>
                        <Tooltip label="Client Size" placement="top">
                          <Tag colorScheme="teal">{product.clientSize}</Tag>
                        </Tooltip>
                        <Tooltip label="Discount Type" placement="top">
                          <Tag colorScheme="orange">{product.discountType}</Tag>
                        </Tooltip>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Heading size="sm" mb={2}>Channel Discounts</Heading>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th pl={0}>Channel</Th>
                            <Th isNumeric>Brand</Th>
                            <Th isNumeric>Generic</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.values(discounts)
                            .filter(d => d.brand !== null || d.generic !== null)
                            .slice(0, 5) // Limit rows for card view
                            .map((discount, idx) => (
                              <Tr key={idx}>
                                <Td pl={0}>
                                  <Tooltip label={discount.name}>
                                    <Text>{discount.label}</Text>
                                  </Tooltip>
                                </Td>
                                <Td isNumeric>{discount.brand !== null ? formatPercent(discount.brand) : '-'}</Td>
                                <Td isNumeric>{discount.generic !== null ? formatPercent(discount.generic) : '-'}</Td>
                              </Tr>
                            ))}
                        </Tbody>
                      </Table>
                      {Object.values(discounts).filter(d => d.brand !== null || d.generic !== null).length > 5 && (
                        <Text fontSize="xs" textAlign="right" mt={1} fontStyle="italic">
                          + {Object.values(discounts).filter(d => d.brand !== null || d.generic !== null).length - 5} more channels
                        </Text>
                      )}
                    </Box>
                    
                    <Flex justify="flex-end" mt={2}>
                      <IconButton
                        as={Link}
                        to={`/products/${product.id}`}
                        icon={<ViewIcon />}
                        aria-label="View"
                        mr={2}
                        colorScheme="blue"
                        variant="outline"
                      />
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit"
                        colorScheme="green"
                        variant="outline"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                      />
                    </Flex>
                  </Stack>
                </CardBody>
              </Card>
            );
          })}
        </Grid>
      ) : (
        /* Table View */
        <Box overflowX="auto">
          <Table variant="simple" borderWidth="1px" borderRadius="lg">
            <Thead bg="gray.50">
              <Tr>
                <Th>PRODUCT INFO</Th>
                <Th>KEY PARAMETERS</Th>
                <Th>DISCOUNTS BY CHANNEL</Th>
                <Th width="100px">ACTIONS</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProducts.map((product) => {
                const discounts = getDiscountsByChannel(product);
                
                return (
                  <Tr key={product.id}>
                    <Td>
                      {formatProductInfo(product)}
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Tooltip label="Formulary" placement="top">
                          <Tag colorScheme="purple" size="sm">{product.formulary}</Tag>
                        </Tooltip>
                        <Tooltip label="Client Size" placement="top">
                          <Tag colorScheme="teal" size="sm">{product.clientSize}</Tag>
                        </Tooltip>
                        <Tooltip label="Discount Type" placement="top">
                          <Tag colorScheme="orange" size="sm">{product.discountType}</Tag>
                        </Tooltip>
                      </VStack>
                    </Td>
                    <Td>
                      <Table size="sm" variant="unstyled">
                        <Thead>
                          <Tr>
                            <Th pl={0} fontSize="xs" width="40px">Type</Th>
                            <Th fontSize="xs" isNumeric width="60px">Brand</Th>
                            <Th fontSize="xs" isNumeric width="60px">Generic</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Object.values(discounts)
                            .filter(d => d.brand !== null || d.generic !== null)
                            .map((discount, idx) => (
                              <Tr key={idx}>
                                <Td pl={0} py={1}>
                                  <Tooltip label={discount.name} placement="left">
                                    <Text fontSize="xs" fontWeight="medium">{discount.label}</Text>
                                  </Tooltip>
                                </Td>
                                <Td py={1} isNumeric>
                                  <Text fontSize="xs">
                                    {discount.brand !== null ? formatPercent(discount.brand) : '-'}
                                  </Text>
                                </Td>
                                <Td py={1} isNumeric>
                                  <Text fontSize="xs">
                                    {discount.generic !== null ? formatPercent(discount.generic) : '-'}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          {Object.values(discounts).filter(d => d.brand !== null || d.generic !== null).length === 0 && (
                            <Tr>
                              <Td colSpan={3} py={1} textAlign="center">
                                <Text fontSize="xs" fontStyle="italic">No discount data</Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View Details">
                          <IconButton
                            as={Link}
                            to={`/products/${product.id}`}
                            icon={<ViewIcon />}
                            aria-label="View"
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                          />
                        </Tooltip>
                        <Tooltip label="Edit Product">
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Edit"
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Add Product Button */}
      <Flex justify="center" mt={6}>
        <Button 
          colorScheme="blue" 
          size="lg"
          onClick={() => navigate('/products/create')}
        >
          Create New Product
        </Button>
      </Flex>
    </Box>
  );
};

export default ProductManagement;