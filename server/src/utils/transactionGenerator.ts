import { ITransaction } from '../models/Transaction';
import { TransactionRules } from './transactionRules';
import mongoose from 'mongoose';

export interface GeneratedTransaction {
  userId: string;
  accountId: string;
  type: ITransaction['type'];
  amount: number;
  description: string;
  category: string;
  status: 'completed' | 'pending' | 'failed';
  transactionDate: Date;
}

export interface CustomTransactionConfig {
  enableDebitAlerts: boolean;
  debitAlertAmount: number;
  debitAlertStartDate?: Date;
  debitAlertMaxTransactions: number;
  enableCreditAlerts: boolean;
  creditAlertTotalAmount: number;
  creditAlertTodayAmount: number;
  creditAlertStartDate?: Date;
}

// Helper function to ensure a date is in the past (before today)
const ensurePastDate = (date: Date, today: Date): Date => {
  if (date >= today) {
    // If date is today or in the future, set it to yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  return date;
}

export const generateTransactionHistory = (
  userId: string,
  totalBalance: number,
  transactionRules: TransactionRules,
  monthsBack: number = 6,
  creditLimit: number = 0,
  userCreationDate?: Date,
  customConfig?: CustomTransactionConfig
): GeneratedTransaction[] => {
  // Calculate spending multiplier based on balance size
  const balanceMultiplier = Math.min(Math.max(totalBalance / 10000, 0.5), 3); // 0.5x to 3x multiplier
  const transactions: GeneratedTransaction[] = [];
  
  // Use account creation date as reference point (or a few days after creation)
  // If no creation date provided, use 3 months ago from today as fallback
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let referenceDate: Date;
  if (userCreationDate) {
    // Start transactions a few days after account creation (2-5 days)
    const daysAfterCreation = Math.floor(Math.random() * 4) + 2;
    referenceDate = new Date(userCreationDate);
    referenceDate.setDate(referenceDate.getDate() + daysAfterCreation);
    // Ensure reference date is not in the future
    if (referenceDate > today) {
      referenceDate = new Date(today);
      referenceDate.setDate(referenceDate.getDate() - 1);
    }
  } else {
    // Fallback: use 3 months ago
    referenceDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  }
  
  // Generate transactions going back 2-3 months from account creation (not too far)
  const actualMonthsBack = Math.min(monthsBack, 3); // Cap at 3 months to not go too far back
  for (let month = actualMonthsBack; month >= 1; month--) {
    const monthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - month, 1);
    
    // Monthly salary deposit to checking (always positive)
    // Random day between 10-20 of the month, random time
    const salaryDay = Math.floor(Math.random() * 11) + 10; // 10-20
    const salaryDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), salaryDay);
    salaryDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0); // 8 AM - 8 PM
    const finalSalaryDate = ensurePastDate(salaryDate, today);
    transactions.push({
      userId,
      accountId: 'checking',
      type: 'salary',
      amount: transactionRules.salaryAmount,
      description: 'Salary Deposit - Direct Deposit',
      category: 'Income',
      status: 'completed',
      transactionDate: finalSalaryDate
    });

    // Monthly interest on savings account
    // Random day between 1-5 of the month, random time
    const interestDay = Math.floor(Math.random() * 5) + 1; // 1-5
    const interestDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), interestDay);
    interestDate.setHours(Math.floor(Math.random() * 8) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 5 PM
    const finalInterestDate = ensurePastDate(interestDate, today);
    const interestAmount = Math.random() * 50 + 10; // $10-60 interest
    transactions.push({
      userId,
      accountId: 'savings',
      type: 'deposit',
      amount: interestAmount,
      description: 'Interest Payment',
      category: 'Interest',
      transactionDate: finalInterestDate,
      status: 'completed'
    });

    // Credit card transactions (if credit limit > 0)
    if (creditLimit > 0) {
      const creditTransactions = Math.floor(Math.random() * 8) + 5; // 5-12 transactions per month
      for (let i = 0; i < creditTransactions; i++) {
        // Random day throughout the month, random time
        const creditDay = Math.floor(Math.random() * 28) + 1; // 1-28
        const creditDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), creditDay);
        creditDate.setHours(Math.floor(Math.random() * 16) + 6, Math.floor(Math.random() * 60), 0, 0); // 6 AM - 10 PM
        const finalCreditDate = ensurePastDate(creditDate, today);
        const creditAmount = Math.random() * (creditLimit * 0.1) + 10; // 10% of credit limit max
        
        transactions.push({
          userId,
          accountId: 'credit',
          type: 'payment',
          amount: -creditAmount,
          description: getRandomCreditCardTransaction(),
          category: 'Credit Card',
          transactionDate: finalCreditDate,
          status: 'completed'
        });
      }

      // Monthly credit card payment from checking
      // Random day between 20-28 of the month, random time
      const paymentDay = Math.floor(Math.random() * 9) + 20; // 20-28
      const paymentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), paymentDay);
      paymentDate.setHours(Math.floor(Math.random() * 8) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 5 PM
      const finalPaymentDate = ensurePastDate(paymentDate, today);
      const paymentAmount = Math.random() * (creditLimit * 0.3) + (creditLimit * 0.1); // 10-40% of credit limit
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'payment',
        amount: -paymentAmount,
        description: 'Credit Card Payment',
        category: 'Credit Card Payment',
        transactionDate: finalPaymentDate,
        status: 'completed'
      });
    }

    // Grocery transactions (weekly or bi-weekly) - scaled by balance
    const groceryFrequency = transactionRules.groceryFrequency === 'weekly' ? 4 : 2;
    for (let week = 0; week < groceryFrequency; week++) {
      // Random day within each week, random time
      const weekStartDay = 1 + (week * 7);
      const groceryDay = weekStartDay + Math.floor(Math.random() * 6); // Random day within the week
      const groceryDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), groceryDay);
      groceryDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0); // 8 AM - 8 PM
      const finalGroceryDate = ensurePastDate(groceryDate, today);
      const baseGroceryAmount = Math.random() * 
        (transactionRules.groceryAmount.max - transactionRules.groceryAmount.min) + 
        transactionRules.groceryAmount.min;
      const groceryAmount = baseGroceryAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'grocery',
        amount: -groceryAmount, // Negative for spending
        description: getRandomGroceryStore(),
        category: 'Food & Groceries',
        transactionDate: finalGroceryDate,
        status: 'completed'
      });
    }

    // Gas transactions (2-3 times per month) - scaled by balance
    const gasCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < gasCount; i++) {
      // Random day throughout the month, random time
      const gasDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const gasDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), gasDay);
      gasDate.setHours(Math.floor(Math.random() * 18) + 5, Math.floor(Math.random() * 60), 0, 0); // 5 AM - 11 PM
      const finalGasDate = ensurePastDate(gasDate, today);
      const baseGasAmount = Math.random() * 
        (transactionRules.gasAmount.max - transactionRules.gasAmount.min) + 
        transactionRules.gasAmount.min;
      const gasAmount = baseGasAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'gas',
        amount: -gasAmount,
        description: getRandomGasStation(),
        category: 'Transportation',
        transactionDate: finalGasDate,
        status: 'completed'
      });
    }

    // Restaurant transactions (1-3 times per month) - scaled by balance
    const restaurantCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < restaurantCount; i++) {
      // Random day throughout the month, random time (more likely evening)
      const restaurantDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const restaurantDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), restaurantDay);
      restaurantDate.setHours(Math.floor(Math.random() * 6) + 17, Math.floor(Math.random() * 60), 0, 0); // 5 PM - 11 PM
      const finalRestaurantDate = ensurePastDate(restaurantDate, today);
      const baseRestaurantAmount = Math.random() * 
        (transactionRules.restaurantAmount.max - transactionRules.restaurantAmount.min) + 
        transactionRules.restaurantAmount.min;
      const restaurantAmount = baseRestaurantAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'restaurant',
        amount: -restaurantAmount,
        description: getRandomRestaurant(),
        category: 'Dining',
        transactionDate: finalRestaurantDate,
        status: 'completed'
      });
    }

    // Online purchases (1-2 times per month) - scaled by balance
    const onlineCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < onlineCount; i++) {
      // Random day throughout the month, random time
      const onlineDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const onlineDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), onlineDay);
      onlineDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0); // Any time of day
      const finalOnlineDate = ensurePastDate(onlineDate, today);
      const baseOnlineAmount = Math.random() * 
        (transactionRules.onlineAmount.max - transactionRules.onlineAmount.min) + 
        transactionRules.onlineAmount.min;
      const onlineAmount = baseOnlineAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'online',
        amount: -onlineAmount,
        description: getRandomOnlineStore(),
        category: 'Shopping',
        transactionDate: finalOnlineDate,
        status: 'completed'
      });
    }

    // ATM withdrawals (1-2 times per month) - scaled by balance
    const atmCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < atmCount; i++) {
      // Random day throughout the month, random time
      const atmDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const atmDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), atmDay);
      atmDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0); // Any time
      const finalAtmDate = ensurePastDate(atmDate, today);
      const baseAtmAmount = Math.floor(Math.random() * 200) + 40; // $40-$240
      const atmAmount = baseAtmAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'atm',
        amount: -atmAmount,
        description: 'ATM Withdrawal',
        category: 'Cash',
        transactionDate: finalAtmDate,
        status: 'completed'
      });
    }

    // Donation transactions (1-2 times per month) - scaled by balance
    const donationCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < donationCount; i++) {
      // Random day throughout the month, random time
      const donationDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const donationDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), donationDay);
      donationDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 9 PM
      const finalDonationDate = ensurePastDate(donationDate, today);
      const baseDonationAmount = Math.random() * 200 + 25; // $25-$225
      const donationAmount = baseDonationAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'withdrawal',
        amount: -donationAmount,
        description: getRandomDonation(),
        category: 'Charity',
        transactionDate: finalDonationDate,
        status: 'completed'
      });
    }

    // Monthly fees (if balance is low)
    if (totalBalance < 1000) {
      // Random day between 25-28 of the month, random time
      const feeDay = Math.floor(Math.random() * 4) + 25; // 25-28
      const feeDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), feeDay);
      feeDate.setHours(Math.floor(Math.random() * 8) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 5 PM
      const finalFeeDate = ensurePastDate(feeDate, today);
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'fee',
        amount: -12.99,
        description: 'Monthly Maintenance Fee',
        category: 'Banking',
        transactionDate: finalFeeDate,
        status: 'completed'
      });
    }

    // Savings transfers (monthly)
    // Random day between 20-28 of the month, random time
    const savingsDay = Math.floor(Math.random() * 9) + 20; // 20-28
    const savingsDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), savingsDay);
    savingsDate.setHours(Math.floor(Math.random() * 8) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 5 PM
    const finalSavingsDate = ensurePastDate(savingsDate, today);
    const savingsAmount = Math.floor(transactionRules.salaryAmount * 0.1); // 10% of salary
    
    transactions.push({
      userId,
      accountId: 'checking',
      type: 'transfer',
      amount: -savingsAmount,
      description: 'Transfer to Savings',
      category: 'Transfer',
      transactionDate: finalSavingsDate,
      status: 'completed'
    });

    // Savings account transactions
    transactions.push({
      userId,
      accountId: 'savings',
      type: 'deposit',
      amount: savingsAmount,
      description: 'Transfer from Checking',
      category: 'Transfer',
      transactionDate: finalSavingsDate,
      status: 'completed'
    });

    // Interest earned on savings (monthly) - using a fixed amount for simplicity
    // Random day between 1-5 of the month, random time
    const savingsInterestDay = Math.floor(Math.random() * 5) + 1; // 1-5
    const savingsInterestDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), savingsInterestDay);
    savingsInterestDate.setHours(Math.floor(Math.random() * 8) + 9, Math.floor(Math.random() * 60), 0, 0); // 9 AM - 5 PM
    const finalSavingsInterestDate = ensurePastDate(savingsInterestDate, today);
    const savingsInterestAmount = Math.random() * 50 + 10; // $10-60 interest
    
    transactions.push({
      userId,
      accountId: 'savings',
      type: 'deposit',
      amount: savingsInterestAmount,
      description: 'Interest Earned',
      category: 'Interest',
      transactionDate: finalSavingsInterestDate,
      status: 'completed'
    });

    // Additional checking account transactions (more variety) - scaled by balance
    const additionalCheckingTransactions = Math.floor(Math.random() * 8) + 5; // 5-12 additional transactions
    for (let i = 0; i < additionalCheckingTransactions; i++) {
      // Random day throughout the month, random time
      const additionalDay = Math.floor(Math.random() * 28) + 1; // 1-28
      const additionalDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), additionalDay);
      additionalDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0); // Any time
      const finalAdditionalDate = ensurePastDate(additionalDate, today);
      const baseAdditionalAmount = Math.random() * 150 + 25; // $25-$175
      const additionalAmount = baseAdditionalAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'withdrawal',
        amount: -additionalAmount,
        description: getRandomCheckingTransaction(),
        category: getRandomCategory(),
        transactionDate: finalAdditionalDate,
        status: 'completed'
      });
    }


  }

  // Add status field and convert userId to ObjectId for all transactions
  const transactionsWithStatus = transactions.map(tx => ({
    ...tx,
    userId: new mongoose.Types.ObjectId(tx.userId),
    status: 'completed' as const
  }));

  // Generate custom debit alerts if configured
  if (customConfig?.enableDebitAlerts && customConfig.debitAlertAmount > 0) {
    const debitAmount = customConfig.debitAlertAmount;
    const maxTransactions = customConfig.debitAlertMaxTransactions || 1;
    const startDate = customConfig.debitAlertStartDate || new Date();
    
    // Generate debit transactions (negative amounts)
    const transactionsToGenerate = Math.min(maxTransactions, Math.floor(debitAmount / 10)); // At least $10 per transaction
    const amountPerTransaction = transactionsToGenerate > 0 ? debitAmount / transactionsToGenerate : debitAmount;
    
    for (let i = 0; i < transactionsToGenerate; i++) {
      const transactionDate = new Date(startDate);
      // Spread transactions over a few days if multiple
      if (transactionsToGenerate > 1) {
        transactionDate.setDate(transactionDate.getDate() + i);
      }
      transactionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
      
      // Use checking account for debit alerts
      const finalDate = ensurePastDate(transactionDate, today);
      transactionsWithStatus.push({
        userId: new mongoose.Types.ObjectId(userId),
        accountId: 'checking',
        type: 'withdrawal',
        amount: -Math.abs(amountPerTransaction), // Negative for debit
        description: getRandomCheckingTransaction(),
        category: getRandomCategory(),
        status: 'completed' as const,
        transactionDate: finalDate
      });
    }
  }

  // Generate custom credit alerts if configured
  if (customConfig?.enableCreditAlerts && customConfig.creditAlertTotalAmount > 0) {
    const totalAmount = customConfig.creditAlertTotalAmount;
    const todayAmount = customConfig.creditAlertTodayAmount || 0;
    const remainingAmount = totalAmount - todayAmount;
    const startDate = customConfig.creditAlertStartDate || new Date();
    
    // Add today's credit alert
    if (todayAmount > 0) {
      const todayDate = new Date(today);
      todayDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
      
      transactionsWithStatus.push({
        userId: new mongoose.Types.ObjectId(userId),
        accountId: 'checking', // Credits typically go to checking
        type: 'deposit',
        amount: todayAmount,
        description: 'Credit Alert - Deposit',
        category: 'Income',
        status: 'completed' as const,
        transactionDate: todayDate
      });
    }
    
    // Split remaining amount randomly over dates from startDate
    if (remainingAmount > 0) {
      const daysFromStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const numTransactions = Math.min(Math.max(Math.floor(remainingAmount / 100), 5), daysFromStart || 10); // 5-10 transactions or based on days
      const amountPerTransaction = remainingAmount / numTransactions;
      
      for (let i = 0; i < numTransactions; i++) {
        const transactionDate = new Date(startDate);
        // Spread over available days
        if (daysFromStart > 0) {
          const dayOffset = Math.floor((daysFromStart / numTransactions) * i);
          transactionDate.setDate(transactionDate.getDate() + dayOffset);
        }
        transactionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
        
        const finalDate = ensurePastDate(transactionDate, today);
        transactionsWithStatus.push({
          userId: new mongoose.Types.ObjectId(userId),
          accountId: 'checking',
          type: 'deposit',
          amount: amountPerTransaction,
          description: 'Credit Alert - Deposit',
          category: 'Income',
          status: 'completed' as const,
          transactionDate: finalDate
        });
      }
    }
  }

  // Sort by transaction date (oldest first)
  return transactionsWithStatus.map(tx => ({
    ...tx,
    userId: tx.userId.toString()
  })).sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
};

// Generate only custom alerts (debit/credit) without regular transaction history
export const generateCustomAlertsOnly = (
  userId: string,
  customConfig: CustomTransactionConfig
): GeneratedTransaction[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const transactions: GeneratedTransaction[] = [];

  // Generate custom debit alerts if configured
  if (customConfig.enableDebitAlerts && customConfig.debitAlertAmount > 0) {
    const debitAmount = customConfig.debitAlertAmount;
    const maxTransactions = customConfig.debitAlertMaxTransactions || 1;
    const startDate = customConfig.debitAlertStartDate || new Date();
    
    // Generate debit transactions (negative amounts)
    const transactionsToGenerate = Math.min(maxTransactions, Math.max(1, Math.floor(debitAmount / 10))); // At least 1 transaction, at least $10 per transaction
    const amountPerTransaction = debitAmount / transactionsToGenerate;
    
    for (let i = 0; i < transactionsToGenerate; i++) {
      const transactionDate = new Date(startDate);
      // Spread transactions over a few days if multiple
      if (transactionsToGenerate > 1) {
        transactionDate.setDate(transactionDate.getDate() + i);
      }
      transactionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
      
      // Use checking account for debit alerts
      const finalDate = ensurePastDate(transactionDate, today);
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'withdrawal',
        amount: -Math.abs(amountPerTransaction), // Negative for debit
        description: 'ATM Withdrawal',
        category: 'ATM',
        status: 'completed',
        transactionDate: finalDate
      });
    }
  }

  // Generate custom credit alerts if configured
  if (customConfig.enableCreditAlerts && customConfig.creditAlertTotalAmount > 0) {
    const totalAmount = customConfig.creditAlertTotalAmount;
    const todayAmount = customConfig.creditAlertTodayAmount || 0;
    const remainingAmount = totalAmount - todayAmount;
    const startDate = customConfig.creditAlertStartDate || new Date();
    
    // Add today's credit alert (it should be dated to today - set to morning time)
    if (todayAmount > 0) {
      const todayDate = new Date();
      // Set to morning time (between 8 AM - 11 AM)
      todayDate.setHours(Math.floor(Math.random() * 4) + 8, Math.floor(Math.random() * 60), 0, 0);
      
      transactions.push({
        userId,
        accountId: 'checking', // Credits typically go to checking
        type: 'deposit',
        amount: todayAmount,
        description: 'Credit Alert - Deposit',
        category: 'Income',
        status: 'completed',
        transactionDate: todayDate // Today's date with morning time
      });
    }
    
    // Split remaining amount randomly over dates from startDate
    if (remainingAmount > 0) {
      const daysFromStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const numTransactions = Math.min(Math.max(Math.floor(remainingAmount / 100), 5), Math.max(daysFromStart || 10, 1)); // At least 1 transaction
      const amountPerTransaction = remainingAmount / numTransactions;
      
      for (let i = 0; i < numTransactions; i++) {
        const transactionDate = new Date(startDate);
        // Spread over available days
        if (daysFromStart > 0) {
          const dayOffset = Math.floor((daysFromStart / numTransactions) * i);
          transactionDate.setDate(transactionDate.getDate() + dayOffset);
        }
        transactionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
        
        const finalDate = ensurePastDate(transactionDate, today);
        transactions.push({
          userId,
          accountId: 'checking',
          type: 'deposit',
          amount: amountPerTransaction,
          description: 'Credit Alert - Deposit',
          category: 'Income',
          status: 'completed',
          transactionDate: finalDate
        });
      }
    }
  }

  // Sort by transaction date (oldest first)
  return transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
};

// Helper functions for realistic business names
const getRandomGroceryStore = () => {
  const stores = [
    'Walmart Supercenter',
    'Target',
    'Kroger',
    'Safeway',
    'Whole Foods Market',
    'Trader Joe\'s',
    'Publix',
    'Albertsons',
    'Food Lion',
    'Giant Eagle'
  ];
  return stores[Math.floor(Math.random() * stores.length)];
};

const getRandomGasStation = () => {
  const stations = [
    'Shell',
    'ExxonMobil',
    'BP',
    'Chevron',
    'Texaco',
    'Marathon',
    'Sunoco',
    'Valero',
    'Phillips 66',
    'Circle K'
  ];
  return stations[Math.floor(Math.random() * stations.length)];
};

const getRandomRestaurant = () => {
  const restaurants = [
    'McDonald\'s',
    'Subway',
    'Pizza Hut',
    'Domino\'s',
    'KFC',
    'Burger King',
    'Taco Bell',
    'Wendy\'s',
    'Chick-fil-A',
    'Chipotle'
  ];
  return restaurants[Math.floor(Math.random() * restaurants.length)];
};

const getRandomOnlineStore = () => {
  const stores = [
    'Amazon.com',
    'eBay',
    'Etsy',
    'Walmart.com',
    'Target.com',
    'Best Buy',
    'Newegg',
    'B&H Photo',
    'Overstock',
    'Wayfair'
  ];
  return stores[Math.floor(Math.random() * stores.length)];
};

const getRandomCreditCardTransaction = () => {
  const transactions = [
    'Online Purchase - Amazon',
    'Gas Station - Shell',
    'Restaurant - Downtown Cafe',
    'Grocery Store - Walmart',
    'Department Store - Target',
    'Coffee Shop - Starbucks',
    'Fast Food - McDonald\'s',
    'Pharmacy - CVS',
    'Hardware Store - Home Depot',
    'Electronics - Best Buy',
    'Clothing Store - H&M',
    'Bookstore - Barnes & Noble',
    'Movie Theater - AMC',
    'Gym Membership - Planet Fitness',
    'Subscription - Netflix'
  ];
  return transactions[Math.floor(Math.random() * transactions.length)];
};

const getRandomCheckingTransaction = () => {
  const transactions = [
    'Coffee Shop - Local Brew',
    'Fast Food - Burger Joint',
    'Pharmacy - Local Drugstore',
    'Hardware Store - Local Hardware',
    'Electronics - Local Tech Shop',
    'Clothing Store - Local Boutique',
    'Bookstore - Local Books',
    'Movie Theater - Local Cinema',
    'Gym Membership - Local Gym',
    'Subscription - Local Service',
    'Pet Store - Local Pet Shop',
    'Barber Shop - Local Barber',
    'Dry Cleaner - Local Cleaners',
    'Car Wash - Local Car Wash',
    'Hair Salon - Local Salon',
    'Pharmacy - CVS',
    'Coffee Shop - Local Brew'
  ];
  return transactions[Math.floor(Math.random() * transactions.length)];
};

const getRandomDonation = () => {
  const donations = [
    'Donation - American Red Cross',
    'Donation - United Way',
    'Donation - Salvation Army',
    'Donation - St. Jude Children\'s Hospital',
    'Donation - World Wildlife Fund',
    'Donation - Doctors Without Borders',
    'Donation - Habitat for Humanity',
    'Donation - Feeding America',
    'Donation - Make-A-Wish Foundation',
    'Donation - Local Food Bank',
    'Donation - Animal Shelter',
    'Donation - Local Church',
    'Donation - Community Center',
    'Donation - School Fundraiser',
    'Donation - Disaster Relief Fund'
  ];
  return donations[Math.floor(Math.random() * donations.length)];
};

const getRandomCategory = () => {
  const categories = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Entertainment',
    'Health & Fitness',
    'Personal Care',
    'Home & Garden',
    'Education',
    'Travel',
    'Utilities'
  ];
  return categories[Math.floor(Math.random() * categories.length)];
};
