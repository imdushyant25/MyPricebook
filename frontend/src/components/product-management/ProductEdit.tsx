// src/components/product-management/ProductEdit.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  SimpleGrid,
  Text,
  FormErrorMessage,
  VStack,
  HStack,
  InputGroup,
  InputRightAddon,
  Divider,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  useToast,
  Skeleton,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Tooltip,
  Flex,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { getProductById, updateProduct } from '../../services/productService';
import { formatDate } from '../../utils/formatters';
import { Product, ProductValues, PricingValues } from '../../types/product.types';
import { isNumberInRange } from '../../utils/validators';

interface ChannelSection {
  name: string;
  key: string;
  hasBrand: boolean;
  hasGeneric: boolean;
  hasRebate?: boolean;
}

// Organize channel sections for the form
const CHANNEL_SECTIONS: ChannelSection[] = [
  { key: 'retail', name: 'Retail', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'retail90', name: 'Retail 90', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'maintenance', name: 'Maintenance', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'mail', name: 'Mail', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'specialtyMail', name: 'Specialty Mail', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'specialtyRetail', name: 'Specialty Retail', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'limitedDistributionMail', name: 'Limited Distribution Mail', hasBrand: true, hasGeneric: true, hasRebate: true },
  { key: 'limitedDistributionRetail', name: 'Limited Distribution Retail', hasBrand: true, hasGeneric: true, hasRebate: true },
];

// Pricing component for each channel and drug type
interface PricingFieldProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  includeRebate?: boolean;
  error?: string;
  isReadOnly?: boolean;
}

const PricingField: React.FC<PricingFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  includeRebate = false,
  error,
  isReadOnly = false
}) => {
  const handleDiscountChange = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString === '') {
      onChange(null);
    } else {
      // Convert from percentage to decimal if needed
      const normalizedValue = valueAsNumber > 1 ? valueAsNumber / 100 : valueAsNumber;
      onChange(normalizedValue);
    }
  };

  const handleFeeChange = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString === '') {
      onChange(null);
    } else {
      onChange(valueAsNumber);
    }
  };

  // Convert decimal to percentage for display
  const displayDiscount = value !== null && value !== undefined 
    ? (value <= 1 ? value * 100 : value) 
    : '';

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <VStack spacing={3} align="start">
        <InputGroup size="sm">
          <NumberInput
            min={0}
            max={100}
            value={displayDiscount}
            onChange={handleDiscountChange}
            isReadOnly={isReadOnly}
          >
            <NumberInputField />
            <InputRightAddon>%</InputRightAddon>
          </NumberInput>
        </InputGroup>
        
        <InputGroup size="sm">
          <NumberInput
            precision={2}
            onChange={handleFeeChange}
            isReadOnly={isReadOnly}
          >
            <NumberInputField placeholder="Dispensing Fee" />
            <InputRightAddon>$</InputRightAddon>
          </NumberInput>
        </InputGroup>
        
        {includeRebate && (
          <InputGroup size="sm">
            <NumberInput
              min={0}
              max={100}
              onChange={handleDiscountChange}
              isReadOnly={isReadOnly}
            >
              <NumberInputField placeholder="Rebate" />
              <InputRightAddon>%</InputRightAddon>
            </NumberInput>
          </InputGroup>
        )}
      </VStack>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};

const ProductEdit: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [productValues, setProductValues] = useState<ProductValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(0);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setIsLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
        setProductValues(JSON.parse(JSON.stringify(data.values)));
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || 'Failed to load product details');
        
        toast({
          title: 'Error loading product',
          description: err.response?.data?.message || 'An error occurred while loading product.',
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

  // Handle form field changes for pricing values
  const handlePricingChange = (
    channel: string, 
    drugType: 'brand' | 'generic', 
    field: 'discount' | 'dispensingFee' | 'rebate', 
    value: number | null
  ) => {
    if (!productValues) return;
    
    setProductValues(prevValues => {
      if (!prevValues) return null;
      
      const updatedValues = { ...prevValues };
      
      // Ensure the channel exists
      if (!updatedValues[channel]) {
        updatedValues[channel] = {
          brand: { discount: 0, dispensingFee: null, rebate: null },
          generic: { discount: 0, dispensingFee: null }
        };
      }
      
      // Update the specific field
      if (updatedValues[channel] && updatedValues[channel][drugType]) {
        updatedValues[channel][drugType] = {
          ...updatedValues[channel][drugType],
          [field]: value
        };
      }
      
      return updatedValues;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !product || !productValues) {
      toast({
        title: 'Error',
        description: 'Missing product information',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    // Form validation
    const validationErrors: Record<string, string> = {};
    
    // Add validation here if needed
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    // Prepare update data
    // Get current date - ensure we're working with noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Set yesterday as expiry date for the current version
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    
    const updateData = {
      // Expire the current version as of yesterday
      expiryDate: yesterday.toISOString().split('T')[0],
      
      // Create a new version with the updated values
      newVersion: {
        effectiveDate: today.toISOString().split('T')[0],
        values: productValues,
        // Keep the same parameters
        parameters: product.parameters
      }
    };
    
    try {
      setIsSaving(true);
      await updateProduct(productId, updateData);
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Navigate back to product details
      navigate(`/products/${productId}`);
    } catch (err: any) {
      console.error('Error updating product:', err);
      
      toast({
        title: 'Error updating product',
        description: err.response?.data?.message || 'An error occurred while updating product.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <Skeleton height="40px" mb={6} />
        <Skeleton height="200px" mb={6} />
        <Skeleton height="300px" />
      </Box>
    );
  }

  if (error || !product || !productValues) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error || 'Failed to load product details'}
      </Alert>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <Heading size="lg" mb={6}>Edit Product</Heading>
      
      {/* Product Information Card */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Product Information</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">PRODUCT NAME</Text>
              <Text fontWeight="medium">{product.parameters.priceRecordName || 'Unnamed Product'}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">PBM</Text>
              <Text>{product.parameters.pharmacyBenefitsManager}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">EFFECTIVE DATES</Text>
              <Text>{formatDate(product.metadata.effectiveDate)} - {product.metadata.expiryDate ? formatDate(product.metadata.expiryDate) : 'Present'}</Text>
              <Tooltip label="A new version will be created with today's date as the effective date">
                <Badge colorScheme="blue" mt={1} variant="outline">
                  <HStack spacing={1}>
                    <InfoIcon boxSize={3} />
                    <Text fontSize="xs">Will create new version</Text>
                  </HStack>
                </Badge>
              </Tooltip>
            </Box>
            
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">DISCOUNT TYPE</Text>
              <Text>{product.parameters.discountAndRebateType}</Text>
            </Box>
          </SimpleGrid>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mt={4}>
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">CLIENT SIZE</Text>
              <Text>{product.parameters.clientSize}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">FORMULARY</Text>
              <Text>{product.parameters.formulary}</Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
      
      {/* Values Editing Section */}
      <Card>
        <CardHeader>
          <Heading size="md">Product Values</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Edit the product values below. The parameters are shown for reference but cannot be edited.
          </Text>
        </CardHeader>
        <CardBody>
          <Tabs isLazy index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Retail</Tab>
              <Tab>Mail</Tab>
              <Tab>Specialty</Tab>
              <Tab>Fees & Credits</Tab>
            </TabList>
            
            <TabPanels>
              {/* Retail Tab */}
              <TabPanel>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  {CHANNEL_SECTIONS.slice(0, 3).map(channel => (
                    <GridItem key={channel.key}>
                      <Box borderWidth="1px" borderRadius="md" p={4}>
                        <Heading size="sm" mb={4}>{channel.name}</Heading>
                        
                        <SimpleGrid columns={2} spacing={4}>
                          {channel.hasBrand && (
                            <PricingField
                              label="Brand"
                              value={productValues[channel.key]?.brand?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'brand', 'discount', value)}
                              includeRebate={channel.hasRebate}
                              error={errors[`${channel.key}.brand.discount`]}
                            />
                          )}
                          
                          {channel.hasGeneric && (
                            <PricingField
                              label="Generic"
                              value={productValues[channel.key]?.generic?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'generic', 'discount', value)}
                              error={errors[`${channel.key}.generic.discount`]}
                            />
                          )}
                        </SimpleGrid>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              </TabPanel>
              
              {/* Mail Tab */}
              <TabPanel>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  {CHANNEL_SECTIONS.slice(3, 4).map(channel => (
                    <GridItem key={channel.key}>
                      <Box borderWidth="1px" borderRadius="md" p={4}>
                        <Heading size="sm" mb={4}>{channel.name}</Heading>
                        
                        <SimpleGrid columns={2} spacing={4}>
                          {channel.hasBrand && (
                            <PricingField
                              label="Brand"
                              value={productValues[channel.key]?.brand?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'brand', 'discount', value)}
                              includeRebate={channel.hasRebate}
                              error={errors[`${channel.key}.brand.discount`]}
                            />
                          )}
                          
                          {channel.hasGeneric && (
                            <PricingField
                              label="Generic"
                              value={productValues[channel.key]?.generic?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'generic', 'discount', value)}
                              error={errors[`${channel.key}.generic.discount`]}
                            />
                          )}
                        </SimpleGrid>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              </TabPanel>
              
              {/* Specialty Tab */}
              <TabPanel>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  {CHANNEL_SECTIONS.slice(4, 8).map(channel => (
                    <GridItem key={channel.key}>
                      <Box borderWidth="1px" borderRadius="md" p={4}>
                        <Heading size="sm" mb={4}>{channel.name}</Heading>
                        
                        <SimpleGrid columns={2} spacing={4}>
                          {channel.hasBrand && (
                            <PricingField
                              label="Brand"
                              value={productValues[channel.key]?.brand?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'brand', 'discount', value)}
                              includeRebate={channel.hasRebate}
                              error={errors[`${channel.key}.brand.discount`]}
                            />
                          )}
                          
                          {channel.hasGeneric && (
                            <PricingField
                              label="Generic"
                              value={productValues[channel.key]?.generic?.discount}
                              onChange={(value) => handlePricingChange(channel.key, 'generic', 'discount', value)}
                              error={errors[`${channel.key}.generic.discount`]}
                            />
                          )}
                        </SimpleGrid>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              </TabPanel>
              
              {/* Fees & Credits Tab */}
              <TabPanel>
                <Box borderWidth="1px" borderRadius="md" p={4}>
                  <Heading size="sm" mb={4}>Overall Fee and Credit</Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">PEPM Rebate Credit</FormLabel>
                      <InputGroup>
                        <NumberInput
                          min={0}
                          precision={2}
                          value={productValues.overallFeeAndCredit?.pepmRebateCredit ?? undefined}
                          onChange={(valueAsString, valueAsNumber) => {
                            setProductValues(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                overallFeeAndCredit: {
                                  ...prev.overallFeeAndCredit,
                                  pepmRebateCredit: valueAsNumber
                                }
                              };
                            });
                          }}
                        >
                          <NumberInputField />
                          <InputRightAddon>$</InputRightAddon>
                        </NumberInput>
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Pricing Fee</FormLabel>
                      <InputGroup>
                        <NumberInput
                          min={0}
                          precision={2}
                          value={productValues.overallFeeAndCredit?.pricingFee ?? undefined}
                          onChange={(valueAsString, valueAsNumber) => {
                            setProductValues(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                overallFeeAndCredit: {
                                  ...prev.overallFeeAndCredit,
                                  pricingFee: valueAsNumber
                                }
                              };
                            });
                          }}
                        >
                          <NumberInputField />
                          <InputRightAddon>$</InputRightAddon>
                        </NumberInput>
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">In-House Pharmacy Fee</FormLabel>
                      <InputGroup>
                        <NumberInput
                          min={0}
                          precision={2}
                          value={productValues.overallFeeAndCredit?.inHousePharmacyFee ?? undefined}
                          onChange={(valueAsString, valueAsNumber) => {
                            setProductValues(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                overallFeeAndCredit: {
                                  ...prev.overallFeeAndCredit,
                                  inHousePharmacyFee: valueAsNumber || null
                                }
                              };
                            });
                          }}
                        >
                          <NumberInputField />
                          <InputRightAddon>$</InputRightAddon>
                        </NumberInput>
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
      
      {/* Form Actions */}
      <Flex justify="flex-end" mt={6} gap={4}>
        <Button
          variant="outline"
          onClick={() => navigate(`/products/${productId}`)}
          isDisabled={isSaving}
        >
          Cancel
        </Button>
        
        <Button
          colorScheme="blue"
          type="submit"
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save Changes
        </Button>
      </Flex>
    </Box>
  );
};

export default ProductEdit;