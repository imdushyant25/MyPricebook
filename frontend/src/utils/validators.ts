// src/utils/validators.ts
/**
 * Validate that a value is not empty
 * @param value Value to check
 * @returns True if value is not empty
 */
export const isNotEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };
  
  /**
   * Validate that a value is a valid date
   * @param value Date string to validate
   * @returns True if value is a valid date
   */
  export const isValidDate = (value: string): boolean => {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  };
  
  /**
   * Validate that a value is a number within range
   * @param value Number to validate
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @returns True if value is a number within range
   */
  export const isNumberInRange = (
    value: any, 
    min: number = -Infinity, 
    max: number = Infinity
  ): boolean => {
    if (value === null || value === undefined) return false;
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
  };
  
  /**
   * Validate that a date range is valid (start before end)
   * @param startDate Start date string
   * @param endDate End date string
   * @returns True if date range is valid
   */
  export const isValidDateRange = (startDate: string, endDate: string): boolean => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
    return new Date(startDate) <= new Date(endDate);
  };