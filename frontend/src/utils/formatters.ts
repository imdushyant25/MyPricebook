// src/utils/formatters.ts

/**
 * Format a date string to a human-readable format
 * Handles timezone shifts by forcing date to be interpreted at noon local time
 * to avoid date boundary issues
 * 
 * @param dateString Date string to format
 * @param options Optional format options
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string, 
  options: { 
    includeTime?: boolean, 
    year?: 'numeric' | '2-digit', 
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow', 
    day?: 'numeric' | '2-digit' 
  } = {}
) => {
  if (!dateString) return '';
  
  // Parse the date string
  // This approach ensures the date is interpreted at noon local time
  // to avoid timezone shifts causing the displayed date to be off by one day
  const [datePart] = dateString.split('T'); // Extract just the date part (YYYY-MM-DD)
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create date object at noon on the specified day (to avoid timezone issues)
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  const defaultOptions: Intl.DateTimeFormatOptions = { 
    year: options.year || 'numeric', 
    month: options.month || 'short', 
    day: options.day || 'numeric'
  };
  
  // Add time components if requested
  if (options.includeTime) {
    defaultOptions.hour = 'numeric';
    defaultOptions.minute = 'numeric';
  }
  
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
  
  const defaultOptions: Intl.NumberFormatOptions = {
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
  
  // Ensure value is properly normalized for percentage display
  const normalizedValue = value > 1 ? value / 100 : value;
  
  return formatNumber(normalizedValue, { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
};