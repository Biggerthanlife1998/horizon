// Common utility functions
export const generateConfirmationCode = (prefix: string = 'TXN') => {
  return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
};

export const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getExpectedAvailability = (days: number = 2) => {
  const today = new Date();
  const availability = new Date(today);
  availability.setDate(today.getDate() + days);
  
  return availability.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Common icons and styling
export const TRANSACTION_ICONS = {
  deposit: 'ArrowDownLeft',
  withdrawal: 'ArrowUpRight',
  transfer: 'TrendingUp',
  payment: 'CreditCard'
} as const;

export const TRANSACTION_BADGE_CLASSES = {
  deposit: 'bg-success-100 text-success-800',
  withdrawal: 'bg-error-100 text-error-800',
  transfer: 'bg-primary-100 text-primary-800',
  payment: 'bg-warning-100 text-warning-800'
} as const;








