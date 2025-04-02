// src/services/fileProcessingService.ts
// Complete update to handle the new validation structure

import * as excelParser from '../utils/excelParser';
import * as validationService from './validationService';
import * as s3Service from './s3Service';
import db from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

/**
 * Process an Excel file and validate its content
 */
export const processFile = async (fileId: string) => {
  let client;
  try {
    // Get file information from database
    const fileResult = await db.query(
      'SELECT id, s3_key, parameter_names FROM edpm.files WHERE id = $1',
      [fileId]
    );
    
    if (fileResult.rows.length === 0) {
      throw new Error(`File with ID ${fileId} not found`);
    }
    
    const fileRecord = fileResult.rows[0];
    
    // Parse the stored normalized parameter names
    let normalizedParameterNames = [];
    try {
      normalizedParameterNames = JSON.parse(fileRecord.parameter_names || '[]');
    } catch (e) {
      console.warn('Failed to parse parameter_names JSON:', e);
    }
    
    // Create a parameter map for efficient validation
    const paramMap = await createParameterMap(normalizedParameterNames);
    
    // Retrieve file from S3
    const s3File = await s3Service.downloadFile(fileRecord.s3_key);
    
    // Handle different types of S3 response body
    let fileBuffer: Buffer;
    
    if (s3File.Body instanceof Buffer) {
      fileBuffer = s3File.Body;
    } else if (s3File.Body instanceof Readable) {
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of s3File.Body) {
        chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
      }
      fileBuffer = Buffer.concat(chunks);
    } else if (typeof s3File.Body === 'string') {
      fileBuffer = Buffer.from(s3File.Body);
    } else {
      throw new Error('Unsupported S3 response body type');
    }
    
    // Parse Excel file to data rows
    const excelData = await excelParser.parseExcelBuffer(fileBuffer);
    
    // Initialize counters
    let totalRecords = excelData.length;
    let successCount = 0;
    let failureCount = 0;
    
    console.log(`Parsed ${excelData.length} records from Excel file`);

    // Store rejection logs outside of transaction
    const rejectionLogs: Array<{
      rowNumber: number;
      reasonCode: string;
      reasonDescription: string;
      rejectedData: any;
    }> = [];
    
    // Process each record, but store valid records in transaction
    for (const [index, record] of excelData.entries()) {
      try {
        // Validate record against parameter valid values, using the parameter map
        const validationResult = await validationService.validateRecord(record, paramMap);
        
        if (validationResult.isValid && validationResult.parameters && validationResult.values) {
          // Store valid records in a separate step
          client = await db.getClient();
          
          try {
            await client.query('BEGIN');
            await storeValidRecord(client, record, validationResult.parameters, validationResult.values);
            await client.query('COMMIT');
            successCount++;
          } catch (storeError) {
            if (client) {
              await client.query('ROLLBACK');
            }
            console.error(`Error storing valid record at row ${index + 4}:`, storeError); // +4 because headers are in row 3
            rejectionLogs.push({
              rowNumber: index + 4,
              reasonCode: 'DATABASE_ERROR',
              reasonDescription: `Error storing valid record: ${(storeError as Error).message}`,
              rejectedData: record
            });
            failureCount++;
          } finally {
            if (client) {
              client.release();
              client = null;
            }
          }
        } else {
          // Track rejection for invalid records
          const reason = validationResult.reason || 'Unknown validation error';
          rejectionLogs.push({
            rowNumber: index + 4,
            reasonCode: 'VALIDATION_ERROR',
            reasonDescription: reason,
            rejectedData: record
          });
          failureCount++;
        }
      } catch (recordError) {
        console.error(`Error processing record at row ${index + 4}:`, recordError);
        rejectionLogs.push({
          rowNumber: index + 4,
          reasonCode: 'PROCESSING_ERROR',
          reasonDescription: `Internal processing error: ${(recordError as Error).message}`,
          rejectedData: record
        });
        failureCount++;
      }
    }
    
    // After all records are processed, store rejection logs outside of transaction
    for (const log of rejectionLogs) {
      try {
        await storeRejectionLog(
          null, 
          fileId, 
          log.rowNumber, 
          log.reasonCode, 
          log.reasonDescription, 
          log.rejectedData
        );
      } catch (logError) {
        console.error(`Failed to store rejection log for row ${log.rowNumber}:`, logError);
      }
    }
    
    // Determine file status based on processing results
    // UPDATED LOGIC: 
    // - If no records are processed successfully, status = FAILED
    // - If all records are processed successfully, status = COMPLETED
    // - If some records processed successfully but some failed, status = COMPLETED_WITH_ERRORS
    let status;
    if (totalRecords === 0) {
      status = 'FAILED'; // No records to process
    } else if (successCount === 0) {
      status = 'FAILED'; // No records were successfully processed
    } else if (failureCount === 0) {
      status = 'COMPLETED'; // All records processed successfully
    } else {
      status = 'COMPLETED_WITH_ERRORS'; // Some records successful, some failed
    }

    console.log('Processing complete. Final counts:');
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Success Count: ${successCount}`);
    console.log(`Failure Count: ${failureCount}`);
    console.log(`Determined Status: ${status}`);
                  
    await updateFileStatus(fileId, status, totalRecords, successCount, failureCount);
    
    return { success: true, totalRecords, successCount, failureCount };
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Update file status to FAILED
    try {
      await updateFileStatus(fileId, 'FAILED', 0, 0, 0);
    } catch (updateError) {
      console.error(`Error updating file status for ${fileId}:`, updateError);
    }
    
    throw error;
  } finally {
    // Ensure client is released if something unexpected happened
    if (client) {
      client.release();
    }
  }
};

/**
 * Create a parameter map from normalized parameter names
 * @param normalizedNames - Array of normalized parameter names from file
 * @returns Map of normalized parameter names to parameter IDs
 */
async function createParameterMap(normalizedNames: string[]): Promise<Map<string, string>> {
  const paramMap = new Map<string, string>();
  
  // Fetch all parameters from database
  const paramQuery = `
    SELECT parameter_id, name 
    FROM edpm.parameters
    WHERE is_active = TRUE
  `;
  
  const paramResult = await db.query(paramQuery);
  
  // Create mapping from normalized names to parameter IDs
  for (const param of paramResult.rows) {
    const normalizedName = param.name.toUpperCase().replace(/\s+/g, '');
    paramMap.set(normalizedName, param.parameter_id);
  }
  
  return paramMap;
}

/**
 * Store a valid record in the database
 */
const storeValidRecord = async (
  client: any, 
  record: any, 
  parameters: {[key: string]: any},
  values: {[key: string]: any}
) => {
  // Extract metadata from the record's metadata object
  const effectiveDate = new Date(record.metadata.EFFECTIVEDATE);
  
  // Handle ExpiryDate - if null/undefined, use PostgreSQL 'infinity' date
  // Otherwise, use the provided date
  let expiryDate = null;
  if (record.metadata.EXPIRYDATE) {
    expiryDate = new Date(record.metadata.EXPIRYDATE);
  }
  
  // Transform flat values into hierarchical structure
  const structuredValues = structureProductValues(values);
  
  // Insert into products table
  const productQuery = `
    INSERT INTO edpm.products (
      effective_date, 
      expiry_date, 
      parameters, 
      created_at, 
      updated_at
    ) VALUES ($1, $2, $3, $4, $4)
    RETURNING id
  `;
  
  const now = new Date();
  const productResult = await client.query(productQuery, [
    effectiveDate,
    expiryDate,  // This can be null
    JSON.stringify(parameters),
    now
  ]);
  
  const productId = productResult.rows[0].id;
  
  // Insert structured values into product_values table
  const valuesQuery = `
    INSERT INTO edpm.product_values (
      product_id,
      values,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $3)
    RETURNING id
  `;
  
  await client.query(valuesQuery, [
    productId,
    JSON.stringify(structuredValues),
    now
  ]);
  
  return productId;
};

/**
 * Transform flat product values into a hierarchical structure
 * @param flatValues Object with flat value keys like "Retail|Brand|Discount"
 * @returns Hierarchical structure matching the expected JSON format
 */
function structureProductValues(flatValues: {[key: string]: any}) {
  console.log("Structuring product values from:", JSON.stringify(flatValues, null, 2));
  
  // Initialize the structure based on the expected JSON format
  const structuredValues: any = {
    overallFeeAndCredit: {
      pepmRebateCredit: null,
      pricingFee: null,
      inHousePharmacyFee: null
    },
    retail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    retail90: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    maintenance: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    mail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    specialtyMail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    specialtyRetail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    limitedDistributionMail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    limitedDistributionRetail: {
      brand: { discount: null, dispensingFee: null, rebate: null },
      generic: { discount: null, dispensingFee: null }
    },
    blendedSpecialty: {
      ldd: { discount: null, dispensingFee: null, rebate: null },
      nonLdd: { discount: null, dispensingFee: null, rebate: null }
    }
  };

  // Handle flat structure first (legacy support)
  if (flatValues.DISCOUNT !== undefined) {
    console.log("Found generic DISCOUNT field:", flatValues.DISCOUNT);
    structuredValues.retail.brand.discount = flatValues.DISCOUNT;
  }
  
  if (flatValues.REBATE !== undefined) {
    console.log("Found generic REBATE field:", flatValues.REBATE);
    structuredValues.retail.brand.rebate = flatValues.REBATE;
  }
  
  if (flatValues["DISPENSING FEE"] !== undefined) {
    console.log("Found generic DISPENSING FEE field:", flatValues["DISPENSING FEE"]);
    structuredValues.retail.brand.dispensingFee = flatValues["DISPENSING FEE"];
  }

  // Map for category names to structure keys
  const categoryMapping: {[key: string]: string} = {
    'Overall Fee & Credit': 'overallFeeAndCredit',
    'Retail': 'retail',
    'Retail 90': 'retail90',
    'Maintenance': 'maintenance',
    'Mail': 'mail',
    'Specialty Mail': 'specialtyMail',
    'Specialty Retail': 'specialtyRetail',
    'Limited Distribution Mail': 'limitedDistributionMail',
    'Limited Distribution Retail': 'limitedDistributionRetail',
    'LDD Blended Specialty': 'blendedSpecialty.ldd',
    'Non-LDD Blended Specialty': 'blendedSpecialty.nonLdd'
  };

  // Map for field types to structure properties
  const fieldTypeMapping: {[key: string]: string} = {
    'DISCOUNT': 'discount',
    'DISPENSING FEE': 'dispensingFee',
    'REBATE': 'rebate',
    'PEPM REBATE CREDIT': 'pepmRebateCredit',
    'PRICING FEE': 'pricingFee',
    'INHOUSE PHARMACY FEE': 'inHousePharmacyFee'
  };

  // Process structured keys like "Retail|Brand|Discount"
  for (const [key, value] of Object.entries(flatValues)) {
    // Skip null or empty values
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Handle structured keys
    if (key.includes('|')) {
      const [category, subcategory, fieldType] = key.split('|');
      console.log(`Processing structured key: ${category} | ${subcategory} | ${fieldType} = ${value}`);

      const categoryKey = categoryMapping[category.trim()];
      if (!categoryKey) {
        console.warn(`Unknown category: ${category}`);
        continue;
      }

      const fieldTypeKey = fieldTypeMapping[fieldType.trim().toUpperCase()];
      if (!fieldTypeKey) {
        console.warn(`Unknown field type: ${fieldType}`);
        continue;
      }

      // Handle special case of blended specialty which has a dot in the path
      if (categoryKey.includes('.')) {
        const [mainCategory, subCategory] = categoryKey.split('.');
        structuredValues[mainCategory][subCategory][fieldTypeKey] = value;
        console.log(`Set ${mainCategory}.${subCategory}.${fieldTypeKey} = ${value}`);
      } 
      // Handle special case of overall fees which don't have subcategories
      else if (category.trim() === 'Overall Fee & Credit') {
        structuredValues[categoryKey][fieldTypeKey] = value;
        console.log(`Set ${categoryKey}.${fieldTypeKey} = ${value}`);
      }
      // Normal case with subcategory
      else {
        const subcategoryKey = subcategory.trim().toLowerCase();
        structuredValues[categoryKey][subcategoryKey][fieldTypeKey] = value;
        console.log(`Set ${categoryKey}.${subcategoryKey}.${fieldTypeKey} = ${value}`);
      }
    }
  }

  console.log("Final structured values:", JSON.stringify(structuredValues, null, 2));
  return structuredValues;
}

/**
 * Store rejection log for an invalid record
 */
const storeRejectionLog = async (
  client: any | null, 
  fileId: string, 
  rowNumber: number, 
  reasonCode: string,
  reasonDescription: string, 
  rejectedData: any
) => {
  try {
    // Make sure we're explicitly using the edpm schema for both tables
    const query = `
      INSERT INTO edpm.rejection_logs (
        id, 
        file_id, 
        row_number, 
        reason_code, 
        reason_description, 
        rejected_data, 
        created_at
      )
      SELECT 
        $1, 
        f.id, 
        $3, 
        $4, 
        $5, 
        $6, 
        $7
      FROM edpm.files f
      WHERE f.id = $2
    `;
    
    const values = [
      uuidv4(), 
      fileId, 
      rowNumber, 
      reasonCode,
      reasonDescription, 
      JSON.stringify(rejectedData), 
      new Date()
    ];
    
    if (client) {
      await client.query(query, values);
    } else {
      await db.query(query, values);
    }
  } catch (error) {
    console.error('Error storing rejection log:', error);
    console.error('Attempted to store:', {
      fileId,
      rowNumber,
      reasonCode,
      reasonDescription,
      rejectedData: typeof rejectedData === 'object' ? 'Object data' : rejectedData
    });
    // Don't throw here - we don't want to fail the entire process if we can't store a rejection log
  }
};

/**
 * Update file status and processing statistics
 */
const updateFileStatus = async (
  fileId: string,
  status: string,
  recordCount: number,
  successCount: number,
  failureCount: number
) => {
  // Log values for debugging
  console.log('Updating file status with the following values:');
  console.log(`File ID: ${fileId}`);
  console.log(`Status: ${status}`);
  console.log(`Record Count: ${recordCount}`);
  console.log(`Success Count: ${successCount}`);
  console.log(`Failure Count: ${failureCount}`);
  
  const now = new Date();
  const query = `
    UPDATE edpm.files 
    SET status = $1, 
        processing_completed_at = $2, 
        records_processed = $3, 
        records_rejected = $4,
        updated_at = $2
    WHERE id = $5
  `;
  
  try {
    const result = await db.query(query, [
      status,
      now,
      recordCount,
      failureCount,
      fileId
    ]);
    
    // Log query result
    console.log(`Update complete. Rows affected: ${result.rowCount}`);
    
    // Verify the update by querying the file
    const verifyQuery = `
      SELECT status, records_processed, records_rejected
      FROM edpm.files
      WHERE id = $1
    `;
    
    const verifyResult = await db.query(verifyQuery, [fileId]);
    if (verifyResult.rows.length > 0) {
      console.log('Updated file values in database:');
      console.log(verifyResult.rows[0]);
    } else {
      console.log('Warning: Could not verify update - file not found after update');
    }
  } catch (error) {
    console.error('Error updating file status:', error);
    throw error;
  }
};
/**
 * Get processing statistics for a file
 */
export const getProcessingStats = async (fileId: string) => {
  const query = `
    SELECT status, records_processed as "totalRecords", 
           (records_processed - records_rejected) as "successCount", 
           records_rejected as "failureCount"
    FROM edpm.files
    WHERE id = $1
  `;
  
  const result = await db.query(query, [fileId]);
  
  if (result.rows.length === 0) {
    throw new Error(`File with ID ${fileId} not found`);
  }
  
  return result.rows[0];
};

/**
 * Get rejection logs for a processed file
 */
export const getRejectionLogs = async (fileId: string) => {
  const query = `
    SELECT 
      id, 
      row_number as "rowNumber", 
      reason_code as "reasonCode", 
      reason_description as "reasonDescription", 
      rejected_data as "rawData", 
      created_at as "createdAt"
    FROM edpm.rejection_logs
    WHERE file_id = $1
    ORDER BY row_number
  `;
  
  const result = await db.query(query, [fileId]);
  return result.rows;
};