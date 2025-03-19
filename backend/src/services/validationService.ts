// src/services/validationService.ts
import db from '../utils/db';
import ExcelJS from 'exceljs';

// Define types for our cache structures
interface ParameterInfo {
  parameterId: string;
  name: string;
  isPbmSpecific: boolean;
  allowsFreeText: boolean; // Determined by absence of valid values
}

interface ValidValue {
  value: string;
  pbmId: string | null; // null means applies to all PBMs
}

// Our cache class for parameter validation
class ParameterValidationCache {
  private parameterMap: Map<string, ParameterInfo> = new Map();
  private validValuesMap: Map<string, Map<string | null, Set<string>>> = new Map();
  private initialized: boolean = false;
  
  // Load all parameter data into memory
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 1. Load all active parameters
      const paramQuery = `
        SELECT parameter_id, name, is_pbm_specific 
        FROM edpm.parameters
        WHERE is_active = TRUE
      `;
      const paramResult = await db.query(paramQuery);
      
      // Populate parameter map with normalized keys
      for (const param of paramResult.rows) {
        const normalizedName = param.name.toUpperCase().replace(/\s+/g, '');
        this.parameterMap.set(normalizedName, {
          parameterId: param.parameter_id,
          name: param.name,
          isPbmSpecific: param.is_pbm_specific,
          allowsFreeText: true // We'll set this to false if we find valid values
        });
      }
      
      // 2. Load all valid values in a single query
      const valuesQuery = `
        SELECT pv.parameter_id, pv.value, pv.pbm_id
        FROM edpm.parameter_valid_values pv
        JOIN edpm.parameters p ON pv.parameter_id = p.parameter_id
        WHERE p.is_active = TRUE
          AND pv.effective_from <= CURRENT_TIMESTAMP
          AND (pv.effective_to IS NULL OR pv.effective_to > CURRENT_TIMESTAMP)
      `;
      const valuesResult = await db.query(valuesQuery);
      
      // Process and store valid values
      for (const row of valuesResult.rows) {
        const parameterId = row.parameter_id;
        const value = row.value;
        const pbmId = row.pbm_id;
        
        // Initialize nested map if needed
        if (!this.validValuesMap.has(parameterId)) {
          this.validValuesMap.set(parameterId, new Map());
        }
        
        const pbmMap = this.validValuesMap.get(parameterId)!;
        
        // Initialize set for this PBM if needed
        if (!pbmMap.has(pbmId)) {
          pbmMap.set(pbmId, new Set());
        }
        
        // Add value to the set
        pbmMap.get(pbmId)!.add(value);
        
        // Mark parameter as not free text since it has valid values
        for (const paramInfo of this.parameterMap.values()) {
          if (paramInfo.parameterId === parameterId) {
            paramInfo.allowsFreeText = false;
          }
        }
      }
      
      this.initialized = true;
      console.log(`Parameter validation cache initialized with ${this.parameterMap.size} parameters and ${valuesResult.rows.length} valid values`);
    } catch (error) {
      console.error('Error initializing parameter validation cache:', error);
      throw error;
    }
  }
  
  // Get parameter info by normalized name
  getParameterInfo(normalizedName: string): ParameterInfo | undefined {
    return this.parameterMap.get(normalizedName);
  }
  
  // Get parameter info by ID
  getParameterInfoById(parameterId: string): ParameterInfo | undefined {
    for (const info of this.parameterMap.values()) {
      if (info.parameterId === parameterId) {
        return info;
      }
    }
    return undefined;
  }
  
  // Check if a value is valid for a parameter (with optional PBM)
  isValidValue(parameterId: string, value: string, pbmId?: string | null): boolean {
    // If no valid values are defined, treat as free text field
    if (!this.validValuesMap.has(parameterId)) {
      return true;
    }
    
    const pbmMap = this.validValuesMap.get(parameterId)!;
    
    // If PBM-specific, check PBM values first, then fall back to non-PBM values
    if (pbmId) {
      // Check PBM-specific values
      if (pbmMap.has(pbmId) && pbmMap.get(pbmId)!.has(value)) {
        return true;
      }
    }
    
    // Check non-PBM-specific values (null key means applies to all PBMs)
    if (pbmMap.has(null) && pbmMap.get(null)!.has(value)) {
      return true;
    }
    
    return false;
  }
  
  // Get all valid values for a parameter (with optional PBM)
  getValidValues(parameterId: string, pbmId?: string | null): string[] {
    const result: Set<string> = new Set();
    
    if (!this.validValuesMap.has(parameterId)) {
      return []; // No valid values defined (free text)
    }
    
    const pbmMap = this.validValuesMap.get(parameterId)!;
    
    // Add non-PBM-specific values (null key)
    if (pbmMap.has(null)) {
      for (const value of pbmMap.get(null)!) {
        result.add(value);
      }
    }
    
    // Add PBM-specific values if PBM is specified
    if (pbmId && pbmMap.has(pbmId)) {
      for (const value of pbmMap.get(pbmId)!) {
        result.add(value);
      }
    }
    
    return Array.from(result);
  }
  
  // Check if this is a free text field (no valid values defined)
  isFreeTextField(parameterId: string): boolean {
    const paramInfo = this.getParameterInfoById(parameterId);
    return paramInfo ? paramInfo.allowsFreeText : true;
  }
}

// Create a singleton instance
const parameterCache = new ParameterValidationCache();

/**
 * Validate an Excel file structure
 * @param workbook - ExcelJS workbook
 * @returns Validation result with success flag and error message if invalid
 */
export const validateFileStructure = async (workbook: ExcelJS.Workbook) => {
  try {
    // Initialize the parameter cache
    await parameterCache.initialize();

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { 
        isValid: false, 
        reason: 'Excel file does not contain any worksheets' 
      };
    }

    // Get all headers from the header row (assumed to be row 3)
    const headers: string[] = [];
    let metadataFields: string[] = [];
    let parameterFields: string[] = [];
    let productValueFields: string[] = [];
    
    worksheet.getRow(3).eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = cell.value?.toString().trim() || '';
      if (header) {
        headers.push(header);
        
        // Categorize headers by prefix - case insensitive
        const headerUpper = header.toUpperCase();
        if (headerUpper.startsWith('METADATA_')) {
          metadataFields.push(header);
        } else if (headerUpper.startsWith('PARAMETER_')) {
          parameterFields.push(header);
        } else if (headerUpper.startsWith('PRODUCTVALUE_')) {
          productValueFields.push(header);
        }
      }
    });

    // Check if file has at least one field of each required type
    const validationErrors = [];
    
    if (metadataFields.length === 0) {
      validationErrors.push('No metadata fields found. Excel file must contain columns with "Metadata_" prefix.');
    }
    
    if (parameterFields.length === 0) {
      validationErrors.push('No parameter fields found. Excel file must contain columns with "Parameter_" prefix.');
    }
    
    if (productValueFields.length === 0) {
      validationErrors.push('No product value fields found. Excel file must contain columns with "ProductValue_" prefix.');
    }
    
    // Check for required metadata fields - ensure fields exist in the file, but don't require values yet
    const requiredMetadataFields = ['METADATA_EFFECTIVEDATE', 'METADATA_EXPIRYDATE', 'METADATA_PRICERECORDNAME'];
    const upperMetadataFields = metadataFields.map(field => field.toUpperCase());
    
    const missingMetadataFields = requiredMetadataFields.filter(
      requiredField => !upperMetadataFields.includes(requiredField)
    );
    
    if (missingMetadataFields.length > 0) {
      validationErrors.push(`Missing required metadata fields: ${missingMetadataFields.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      return {
        isValid: false,
        reason: validationErrors.join(' ')
      };
    }

    // Extract normalized parameter names for storage (remove prefix, convert to uppercase, remove spaces)
    const normalizedParameterNames = parameterFields.map(field => {
      // Remove the 'Parameter_' prefix and normalize - case insensitive
      const prefixMatch = field.match(/parameter_/i);
      if (prefixMatch) {
        return field.substring(prefixMatch[0].length).toUpperCase().replace(/\s+/g, '');
      }
      return field.toUpperCase().replace(/\s+/g, '');
    });

    // Fetch all active parameters from the database
    const activeParamsQuery = `
      SELECT name FROM edpm.parameters WHERE is_active = TRUE
    `;
    
    const activeParamsResult = await db.query(activeParamsQuery);
    const activeParams = activeParamsResult.rows;
    
    // Normalize the database parameter names
    const normalizedDbParams = activeParams.map(param => 
      param.name.toUpperCase().replace(/\s+/g, '')
    );
    
    // Check if all required parameters exist in the file
    const missingParams = [];
    for (const dbParam of normalizedDbParams) {
      if (!normalizedParameterNames.includes(dbParam)) {
        // Find the original name for better error message
        const originalName = activeParams.find(
          p => p.name.toUpperCase().replace(/\s+/g, '') === dbParam
        )?.name || dbParam;
        
        missingParams.push(originalName);
      }
    }
    
    if (missingParams.length > 0) {
      return {
        isValid: false,
        reason: `Missing required parameters: ${missingParams.join(', ')}`
      };
    }

    return { 
      isValid: true, 
      normalizedParameterNames,
      metadataFields,
      parameterFields,
      productValueFields
    };
  } catch (error) {
    console.error('Error validating file structure:', error);
    return { 
      isValid: false, 
      reason: `Error validating file structure: ${(error as Error).message}` 
    };
  }
};

/**
 * Validate a product record against parameter valid values
 * @param record - Product record to validate
 * @param paramIdMap - Mapping from parameter names to parameter_ids
 * @returns Validation result with success flag and error message if invalid
 */
export const validateRecord = async (record: any, normalizedParamMap?: Map<string, string>) => {
  try {
    // Initialize the cache if not already done
    await parameterCache.initialize();
    
    // Check if record has the expected structure
    if (!record.metadata || !record.parameters || !record.values) {
      return { 
        isValid: false, 
        reason: 'Invalid record structure. Record must contain metadata, parameters, and values objects.'
      };
    }
    
    // Check required metadata fields
    if (!record.metadata.EFFECTIVEDATE) {
      return { isValid: false, reason: 'Missing required metadata field: EffectiveDate' };
    }
    
    // Note: ExpiryDate is allowed to be null
    if (!record.metadata.PRICERECORDNAME) {
      return { isValid: false, reason: 'Missing required metadata field: PriceRecordName' };
    }
    
    // Find PharmacyBenefitsManager parameter (case-insensitive)
    let pbmValue = null;
    
    // Iterate through record parameters to find PBM
    for (const [key, value] of Object.entries(record.parameters)) {
      if (key.toUpperCase().replace(/\s+/g, '') === 'PHARMACYBENEFITSMANAGER') {
        pbmValue = value;
        break;
      }
    }
    
    if (!pbmValue) {
      return { isValid: false, reason: 'Missing required parameter: PharmacyBenefitsManager' };
    }
    
    // Prepare parameters object for storage
    const parameters: {[key: string]: any} = {};
    
    // For each parameter in the record, validate its value
    for (const [paramName, paramValue] of Object.entries(record.parameters)) {
      // Skip empty values
      if (paramValue === undefined || paramValue === null || paramValue === '') {
        continue;
      }
      
      // Normalize parameter name
      const normalizedName = paramName.toUpperCase().replace(/\s+/g, '');
      
      // Get parameter info from cache
      const paramInfo = parameterCache.getParameterInfo(normalizedName);
      
      if (!paramInfo) {
        // This is an unexpected parameter (should have been caught in structure validation)
        // But we'll skip it rather than fail
        console.warn(`Unknown parameter in record: ${paramName}`);
        continue;
      }
      
      const parameterId = paramInfo.parameterId;
      
      // Special handling for Decremented Rate - normalize values
      let normalizedValue: string;
  
  if (normalizedName === 'DECREMENTEDRATE') {
    // If value is numeric (like 0, 1, 2), convert to percentage string
    if (typeof paramValue === 'number' || 
        (typeof paramValue === 'string' && !isNaN(Number(paramValue)) && !paramValue.includes('%'))) {
      normalizedValue = `${paramValue}%`;
    } else {
      // Ensure we have a string
      normalizedValue = String(paramValue);
    }
  } else {
    // For all other parameters, ensure the value is converted to string
    normalizedValue = String(paramValue);
  }
      
      // Add to parameters object
      parameters[parameterId] = normalizedValue;
      
      // Check if this parameter is free text
      if (parameterCache.isFreeTextField(parameterId)) {
        // Accept any value for free text fields
        continue;
      }
      
      // Check if value is valid
      const isValid = paramInfo.isPbmSpecific
        ? parameterCache.isValidValue(parameterId, normalizedValue, pbmValue)
        : parameterCache.isValidValue(parameterId, normalizedValue);
      
      if (!isValid) {
        const validValues = parameterCache.getValidValues(parameterId, paramInfo.isPbmSpecific ? pbmValue : null);
        
        // Create friendly error message
        const errorReason = paramInfo.isPbmSpecific
          ? `Invalid value "${normalizedValue}" for parameter ${paramInfo.name} with PBM ${pbmValue}. Valid values are: ${validValues.join(', ')}`
          : `Invalid value "${normalizedValue}" for parameter ${paramInfo.name}. Valid values are: ${validValues.join(', ')}`;
        
        return { isValid: false, reason: errorReason };
      }
    }
    
    // At this point, all parameters have been validated
    // Return the structured record with validated parameters
    return { 
      isValid: true, 
      parameters,
      values: record.values
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, reason: `Validation error: ${(error as Error).message}` };
  }
};

/**
 * Check if a parameter is PBM-specific
 * @param parameterId - Parameter ID
 * @returns Boolean indicating if parameter is PBM-specific
 */
async function isPbmSpecificParameter(parameterId: string): Promise<boolean> {
  const query = `
    SELECT is_pbm_specific FROM edpm.parameters WHERE parameter_id = $1
  `;
  
  const result = await db.query(query, [parameterId]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return result.rows[0].is_pbm_specific === true;
}

/**
 * Get parameter name by ID
 * @param parameterId - Parameter ID
 * @returns Parameter name
 */
async function getParameterNameById(parameterId: string): Promise<string> {
  const query = `
    SELECT name FROM edpm.parameters WHERE parameter_id = $1
  `;
  
  const result = await db.query(query, [parameterId]);
  
  if (result.rows.length === 0) {
    return parameterId; // Return ID if name not found
  }
  
  return result.rows[0].name;
}


/**
 * Determine the section in values object for a given Excel column
 */
function determineValueSection(columnName: string): { category: string, subcategory?: string, field: string } | null {
  // This is a placeholder implementation - you'll need to customize based on your Excel structure
  // Example: "Retail Brand Discount" -> { category: "retail", subcategory: "brand", field: "discount" }
  
  // Simple heuristic based on the sample data you provided
  if (columnName === 'PEPM Rebate Credit' || columnName === 'Pricing Fee' || columnName === 'InHouse Pharmacy Fee') {
    return {
      category: 'overallFeeAndCredit',
      field: columnNameToFieldName(columnName)
    };
  }
  
  // Try to match patterns like "Retail Brand Discount", "Mail Generic Dispensing Fee", etc.
  const categoryMatches = [
    'Retail', 'Retail 90', 'Maintenance', 'Mail', 'Specialty Mail', 
    'Specialty Retail', 'Limited Distribution Mail', 'Limited Distribution Retail',
    'LDD Blended Specialty', 'Non-LDD Blended Specialty'
  ];
  
  const subcategoryMatches = ['Brand', 'Generic', 'LDD', 'Non-LDD'];
  const fieldMatches = ['Discount', 'Dispensing Fee', 'Rebate'];
  
  for (const category of categoryMatches) {
    for (const subcategory of subcategoryMatches) {
      for (const field of fieldMatches) {
        if (columnName.includes(category) && columnName.includes(subcategory) && columnName.includes(field)) {
          return {
            category: categoryToKey(category),
            subcategory: subcategoryToKey(subcategory),
            field: fieldToKey(field)
          };
        }
      }
    }
  }
  
  return null;
}

// Helper functions to convert column names to camelCase for JSON
function columnNameToFieldName(columnName: string): string {
  return columnName
    .replace(/\s+/g, '')
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}

function categoryToKey(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '');
}

function subcategoryToKey(subcategory: string): string {
  return subcategory.toLowerCase();
}

function fieldToKey(field: string): string {
  return field.toLowerCase().replace(/\s+/g, '');
}

/**
 * Generate a price record name if not provided
 * @param pbmName - PBM name
 * @returns Generated price record name
 */
export const generatePriceRecordName = (pbmName: string): string => {
  // Generate a random 5-digit number
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${pbmName} ${randomNum}`;
};

/**
 * Get list of valid values for a parameter
 * @param parameterName - Name of the parameter
 * @returns Array of valid values
 */
export const getValidValuesForParameter = async (parameterName: string) => {
  try {
    const paramQuery = `
      SELECT parameter_id FROM edpm.parameters WHERE name = $1
    `;
    
    const paramResult = await db.query(paramQuery, [parameterName]);
    
    if (paramResult.rows.length === 0) {
      throw new Error(`Parameter not found: ${parameterName}`);
    }
    
    const parameterId = paramResult.rows[0].parameter_id;
    
    const query = `
      SELECT value, pbm_id
      FROM edpm.parameter_valid_values
      WHERE parameter_id = $1
      AND effective_from <= CURRENT_TIMESTAMP
      AND (effective_to IS NULL OR effective_to > CURRENT_TIMESTAMP)
    `;
    
    const result = await db.query(query, [parameterId]);
    return result.rows;
  } catch (error) {
    console.error(`Error getting valid values for parameter ${parameterName}:`, error);
    throw error;
  }
};