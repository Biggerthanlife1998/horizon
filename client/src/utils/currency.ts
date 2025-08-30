/**
 * Format amount as USD currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Parse currency string back to number
 * @param currencyString - The formatted currency string
 * @returns Number value
 */
export const parseUSD = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[$,]/g, ''));
};








