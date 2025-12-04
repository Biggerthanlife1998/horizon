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
  userCreationDate?: Date
): GeneratedTransaction[] => {
  // Calculate spending multiplier based on balance size
  const balanceMultiplier = Math.min(Math.max(totalBalance / 10000, 0.5), 3); // 0.5x to 3x multiplier
  const transactions: GeneratedTransaction[] = [];
  
  // Use current date as the reference point to ensure all transactions are in the past
  // Generate transactions going back X months from today, but ensure none are in the future
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Generate transactions going back X months from today
  for (let month = monthsBack; month >= 1; month--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - month, 1);
    
    // Monthly salary deposit to checking (always positive)
    const salaryDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 15), today);
    transactions.push({
      userId,
      accountId: 'checking',
      type: 'salary',
      amount: transactionRules.salaryAmount,
      description: 'Salary Deposit - Direct Deposit',
      category: 'Income',
      status: 'completed',
      transactionDate: salaryDate
    });

    // Monthly interest on savings account
    const interestDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), today);
    const interestAmount = Math.random() * 50 + 10; // $10-60 interest
    transactions.push({
      userId,
      accountId: 'savings',
      type: 'deposit',
      amount: interestAmount,
      description: 'Interest Payment',
      category: 'Interest',
      transactionDate: interestDate,
      status: 'completed'
    });

    // Credit card transactions (if credit limit > 0)
    if (creditLimit > 0) {
      const creditTransactions = Math.floor(Math.random() * 8) + 5; // 5-12 transactions per month
      for (let i = 0; i < creditTransactions; i++) {
        const creditDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 + (i * 2)), today);
        const creditAmount = Math.random() * (creditLimit * 0.1) + 10; // 10% of credit limit max
        
        transactions.push({
          userId,
          accountId: 'credit',
          type: 'payment',
          amount: -creditAmount,
          description: getRandomCreditCardTransaction(),
          category: 'Credit Card',
          transactionDate: creditDate,
          status: 'completed'
        });
      }

      // Monthly credit card payment from checking
      const paymentDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 25), today);
      const paymentAmount = Math.random() * (creditLimit * 0.3) + (creditLimit * 0.1); // 10-40% of credit limit
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'payment',
        amount: -paymentAmount,
        description: 'Credit Card Payment',
        category: 'Credit Card Payment',
              transactionDate: paymentDate,
      status: 'completed'
    });
    }

    // Grocery transactions (weekly or bi-weekly) - scaled by balance
    const groceryFrequency = transactionRules.groceryFrequency === 'weekly' ? 4 : 2;
    for (let week = 0; week < groceryFrequency; week++) {
      const groceryDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 + (week * 7)), today);
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
        transactionDate: groceryDate,
        status: 'completed'
      });
    }

    // Gas transactions (2-3 times per month) - scaled by balance
    const gasCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < gasCount; i++) {
      const gasDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 5 + (i * 10)), today);
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
        transactionDate: gasDate,
        status: 'completed'
      });
    }

    // Restaurant transactions (1-3 times per month) - scaled by balance
    const restaurantCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < restaurantCount; i++) {
      const restaurantDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 8 + (i * 8)), today);
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
        transactionDate: restaurantDate,
        status: 'completed'
      });
    }

    // Online purchases (1-2 times per month) - scaled by balance
    const onlineCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < onlineCount; i++) {
      const onlineDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 12 + (i * 15)), today);
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
        transactionDate: onlineDate,
        status: 'completed'
      });
    }

    // ATM withdrawals (1-2 times per month) - scaled by balance
    const atmCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < atmCount; i++) {
      const atmDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 20 + (i * 5)), today);
      const baseAtmAmount = Math.floor(Math.random() * 200) + 40; // $40-$240
      const atmAmount = baseAtmAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'atm',
        amount: -atmAmount,
        description: 'ATM Withdrawal',
        category: 'Cash',
        transactionDate: atmDate,
        status: 'completed'
      });
    }

    // Donation transactions (1-2 times per month) - scaled by balance
    const donationCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < donationCount; i++) {
      const donationDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 15 + (i * 10)), today);
      const baseDonationAmount = Math.random() * 200 + 25; // $25-$225
      const donationAmount = baseDonationAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'withdrawal',
        amount: -donationAmount,
        description: getRandomDonation(),
        category: 'Charity',
        transactionDate: donationDate,
        status: 'completed'
      });
    }

    // Monthly fees (if balance is low)
    if (totalBalance < 1000) {
      const feeDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 28), today);
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'fee',
        amount: -12.99,
        description: 'Monthly Maintenance Fee',
        category: 'Banking',
        transactionDate: feeDate,
        status: 'completed'
      });
    }

    // Savings transfers (monthly)
    const savingsDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 25), today);
    const savingsAmount = Math.floor(transactionRules.salaryAmount * 0.1); // 10% of salary
    
    transactions.push({
      userId,
      accountId: 'checking',
      type: 'transfer',
      amount: -savingsAmount,
      description: 'Transfer to Savings',
      category: 'Transfer',
      transactionDate: savingsDate,
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
      transactionDate: savingsDate,
      status: 'completed'
    });

    // Interest earned on savings (monthly) - using a fixed amount for simplicity
    const savingsInterestDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), today);
    const savingsInterestAmount = Math.random() * 50 + 10; // $10-60 interest
    
    transactions.push({
      userId,
      accountId: 'savings',
      type: 'deposit',
      amount: savingsInterestAmount,
      description: 'Interest Earned',
      category: 'Interest',
      transactionDate: savingsInterestDate,
      status: 'completed'
    });

    // Additional checking account transactions (more variety) - scaled by balance
    const additionalCheckingTransactions = Math.floor(Math.random() * 8) + 5; // 5-12 additional transactions
    for (let i = 0; i < additionalCheckingTransactions; i++) {
      const additionalDate = ensurePastDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 + (i * 3)), today);
      const baseAdditionalAmount = Math.random() * 150 + 25; // $25-$175
      const additionalAmount = baseAdditionalAmount * balanceMultiplier;
      
      transactions.push({
        userId,
        accountId: 'checking',
        type: 'withdrawal',
        amount: -additionalAmount,
        description: getRandomCheckingTransaction(),
        category: getRandomCategory(),
        transactionDate: additionalDate,
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

  // Sort by transaction date (oldest first)
  return transactionsWithStatus.map(tx => ({
    ...tx,
    userId: tx.userId.toString()
  })).sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
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
    'Nail Salon - Local Nails'
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
