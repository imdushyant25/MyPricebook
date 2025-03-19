// src/utils/formatters.ts
/**
 * Format a date string to a human-readable format
 * @param dateString Date string to format
 * @param options Optional format options
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const defaultOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      ...options
    };
    
    return date.toLocaleDateString(undefined, defaultOptions);
  };
  
  /**
   * Format a price/percentage value
   * @param value Number to format
   * @param options Formatter options
   * @returns Formatted string
   */
  export const formatNumber = (
    value: number | null | undefined, 
    options: { 
      style?: 'decimal' | 'percent' | 'currency',
      currency?: string,
      minimumFractionDigits?: number,
      maximumFractionDigits?: number
    } = {}
  ) => {
    if (value === null || value === undefined) return '';
    
    const defaultOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };
    
    return new Intl.NumberFormat(undefined, defaultOptions).format(value);
  };
  
  /**
   * Format currency values
   * @param value Number to format as currency
   * @param currency Currency code (default: USD)
   * @returns Formatted currency string
   */
  export const formatCurrency = (value: number | null | undefined, currency = 'USD') => {
    return formatNumber(value, { style: 'currency', currency });
  };
  
  /**
   * Format percentage values
   * @param value Number to format as percentage (0-100)
   * @returns Formatted percentage string
   */
  export const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '';
    return formatNumber(value / 100, { style: 'percent' });
  };