export interface TransactionRules {
  groceryFrequency: 'weekly' | 'bi-weekly';
  salaryAmount: number;
  spendingPattern: 'low' | 'moderate' | 'high';
  groceryAmount: { min: number; max: number };
  gasAmount: { min: number; max: number };
  restaurantAmount: { min: number; max: number };
  onlineAmount: { min: number; max: number };
}

export const generateTransactionRules = (totalBalance: number): TransactionRules => {
  // Determine spending pattern based on balance
  let spendingPattern: 'low' | 'moderate' | 'high';
  if (totalBalance < 5000) {
    spendingPattern = 'low';
  } else if (totalBalance < 25000) {
    spendingPattern = 'moderate';
  } else {
    spendingPattern = 'high';
  }

  // Calculate salary amount (roughly 1/3 of total balance for demo)
  const salaryAmount = Math.round(totalBalance / 3);

  // Set spending amounts based on pattern
  let groceryAmount, gasAmount, restaurantAmount, onlineAmount;

  switch (spendingPattern) {
    case 'low':
      groceryAmount = { min: 30, max: 80 };
      gasAmount = { min: 25, max: 50 };
      restaurantAmount = { min: 15, max: 40 };
      onlineAmount = { min: 20, max: 100 };
      break;
    case 'moderate':
      groceryAmount = { min: 50, max: 150 };
      gasAmount = { min: 35, max: 70 };
      restaurantAmount = { min: 25, max: 80 };
      onlineAmount = { min: 40, max: 200 };
      break;
    case 'high':
      groceryAmount = { min: 80, max: 250 };
      gasAmount = { min: 50, max: 100 };
      restaurantAmount = { min: 40, max: 150 };
      onlineAmount = { min: 60, max: 400 };
      break;
  }

  return {
    groceryFrequency: 'weekly',
    salaryAmount,
    spendingPattern,
    groceryAmount,
    gasAmount,
    restaurantAmount,
    onlineAmount
  };
};

export const calculateAccountDistribution = (totalBalance: number) => {
  // 60% checking, 40% savings
  const checking = Math.round(totalBalance * 0.6);
  const savings = totalBalance - checking; // Ensure exact total

  return {
    checking,
    savings
  };
};






