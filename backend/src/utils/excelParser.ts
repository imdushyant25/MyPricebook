// src/utils/excelParser.ts
import ExcelJS from 'exceljs';

/**
 * Parse Excel file buffer into structured data with support for prefixed fields
 * @param buffer - File buffer from S3 or upload
 * @returns Promise with array of records
 */
export const parseExcelBuffer = async (buffer: Buffer | any): Promise<any[]> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    // Assume data is in the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel file does not contain any worksheets');
    }

    // This Excel has a complex header structure:
    // Row 1: Overall categories (Overall Fee & Credit, Retail, etc.)
    // Row 2: Subcategories (Brand, Generic)
    // Row 3: Actual value types (Discount, Dispensing Fee, Rebate)
    
    // Get category headers (row 1)
    const categoryHeaders: { [key: number]: string } = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const headerText = cell.value?.toString().trim() || '';
      if (headerText) {
        categoryHeaders[colNumber] = headerText;
      }
    });
    
    // Get subcategory headers (row 2)
    const subcategoryHeaders: { [key: number]: string } = {};
    worksheet.getRow(2).eachCell((cell, colNumber) => {
      const headerText = cell.value?.toString().trim() || '';
      if (headerText) {
        subcategoryHeaders[colNumber] = headerText;
      }
    });

    // Get field headers (row 3) and categorize by prefix
    const headers: { [key: number]: string } = {};
    const metadataFields: { [key: number]: string } = {};
    const parameterFields: { [key: number]: string } = {};
    const productValueFields: { [key: number]: { 
      category: string, 
      subcategory: string, 
      fieldType: string 
    } } = {};
    
    worksheet.getRow(3).eachCell((cell, colNumber) => {
      const headerText = cell.value?.toString().trim() || '';
      if (headerText) {
        headers[colNumber] = headerText;
        
        // Categorize by prefix - case insensitive
        const headerUpper = headerText.toUpperCase();
        if (headerUpper.startsWith('METADATA_')) {
          metadataFields[colNumber] = headerUpper.substring(9); // Remove 'METADATA_' prefix
        } else if (headerUpper.startsWith('PARAMETER_')) {
          parameterFields[colNumber] = headerUpper.substring(10); // Remove 'PARAMETER_' prefix
        } else if (headerUpper.startsWith('PRODUCTVALUE_')) {
          // For product values, keep track of category and subcategory
          const fieldType = headerUpper.substring(13); // Remove 'PRODUCTVALUE_' prefix
          const category = categoryHeaders[colNumber] || '';
          const subcategory = subcategoryHeaders[colNumber] || '';
          
          productValueFields[colNumber] = {
            category,
            subcategory,
            fieldType
          };
          
          console.log(`Mapped ProductValue column ${colNumber}: ${category} > ${subcategory} > ${fieldType}`);
        }
      }
    });
    
    // Parse rows into objects (start from row 4, as row 3 contains headers)
    const records: any[] = [];
    
    // Determine the last row with data
    let lastRowNum = worksheet.rowCount;
    
    // Process each data row
    for (let rowNumber = 4; rowNumber <= lastRowNum; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Create structured record with separate objects for each category
      const record: any = {
        metadata: {},
        parameters: {},
        values: {}
      };
      
      let hasData = false;
      
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        // Get the original header for this column
        const originalHeader = headers[colNumber];
        
        if (originalHeader) {
          // Convert cell value to appropriate type
          let value: any = cell.value;
          
          // Handle date cells
          if (cell.type === ExcelJS.ValueType.Date && value instanceof Date) {
            value = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
          
          // Add value to the appropriate category based on the header prefix
          const headerUpper = originalHeader.toUpperCase();
          
          if (headerUpper.startsWith('METADATA_')) {
            // Use the uppercase normalized field name without prefix
            const fieldName = metadataFields[colNumber];
            record.metadata[fieldName] = value;
            hasData = true;
          } else if (headerUpper.startsWith('PARAMETER_')) {
            // For parameters, use the original field name without prefix (case preserved)
            const fieldName = originalHeader.substring(originalHeader.indexOf('_') + 1);
            record.parameters[fieldName] = value;
            hasData = true;
          } else if (headerUpper.startsWith('PRODUCTVALUE_')) {
            // For product values, use the complex header mapping
            const valueInfo = productValueFields[colNumber];
            
            // Process numeric values
            if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
              // Convert to number
              value = typeof value === 'string' ? parseFloat(value) : value;
            }
            
            // Handle percentage values (convert "10%" to 0.1)
            if (typeof value === 'string' && value.toString().endsWith('%')) {
              value = parseFloat(value.toString().replace('%', '')) / 100;
            }
            
            // Create a structured key based on category, subcategory, and field type
            const structuredKey = `${valueInfo.category}|${valueInfo.subcategory}|${valueInfo.fieldType}`;
            record.values[structuredKey] = value;
            hasData = true;
            
            console.log(`Row ${rowNumber} - Added product value: ${structuredKey} = ${value}`);
          }
        }
      });
      
      // Only add non-empty rows
      if (hasData) {
        records.push(record);
      }
    }
    
    return records;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file: ' + (error as Error).message);
  }
};