import mongoose from 'mongoose';
import { ICard } from '../models/Card';

// Generate a realistic card number based on brand
const generateCardNumber = (brand: string): string => {
  const prefixes = {
    visa: ['4'],
    mastercard: ['5'],
    amex: ['3'],
    discover: ['6']
  };

  const prefix = prefixes[brand as keyof typeof prefixes][0];
  let number = prefix;
  
  // Generate remaining digits (excluding last digit for Luhn algorithm)
  for (let i = 1; i < 15; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  
  // Calculate Luhn check digit
  const luhnCheckDigit = calculateLuhnCheckDigit(number);
  return number + luhnCheckDigit;
};

// Calculate Luhn check digit for valid card numbers
const calculateLuhnCheckDigit = (number: string): string => {
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return ((10 - (sum % 10)) % 10).toString();
};

// Generate masked card number for display
const generateMaskedNumber = (number: string): string => {
  const lastFour = number.slice(-4);
  return `**** **** **** ${lastFour}`;
};

// Generate expiry date (2-5 years from now)
const generateExpiryDate = (): { month: string; year: string } => {
  const now = new Date();
  const monthsFromNow = 24 + Math.floor(Math.random() * 36); // 2-5 years
  const expiryDate = new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1);
  
  return {
    month: (expiryDate.getMonth() + 1).toString().padStart(2, '0'),
    year: expiryDate.getFullYear().toString().slice(-2)
  };
};

// Generate cardholder name from user data
const generateCardholderName = (firstName: string, lastName: string): string => {
  return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
};

// Generate default daily limits based on account type and balance
const generateDailyLimit = (type: 'debit' | 'credit', balance: number): number => {
  if (type === 'debit') {
    // Debit card daily limit: 20-50% of checking balance, min $500, max $5000
    const percentage = 0.2 + Math.random() * 0.3; // 20-50%
    const calculatedLimit = balance * percentage;
    return Math.max(500, Math.min(5000, Math.round(calculatedLimit / 100) * 100));
  } else {
    // Credit card daily limit: 50-100% of credit limit, min $1000, max $10000
    const percentage = 0.5 + Math.random() * 0.5; // 50-100%
    const calculatedLimit = balance * percentage;
    return Math.max(1000, Math.min(10000, Math.round(calculatedLimit / 100) * 100));
  }
};

// Generate cards for a user based on their account distribution
export const generateUserCards = async (
  userId: string,
  firstName: string,
  lastName: string,
  accountDistribution: { checking: number; savings: number; credit: number }
): Promise<ICard[]> => {
  const cards: ICard[] = [];
  const cardholderName = generateCardholderName(firstName, lastName);
  
  // Generate debit card if user has checking account
  if (accountDistribution.checking > 0) {
    const brands = ['visa', 'mastercard', 'amex', 'discover'];
    const brand = brands[Math.floor(Math.random() * brands.length)] as 'visa' | 'mastercard' | 'amex' | 'discover';
    const number = generateCardNumber(brand);
    const maskedNumber = generateMaskedNumber(number);
    const expiry = generateExpiryDate();
    const dailyLimit = generateDailyLimit('debit', accountDistribution.checking);
    
    const debitCard: ICard = {
      userId: new mongoose.Types.ObjectId(userId),
      type: 'debit',
      brand,
      number,
      maskedNumber,
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cardholderName,
      isBlocked: false,
      dailyLimit,
      currentBalance: accountDistribution.checking,
      accountId: 'checking'
    } as ICard;
    
    cards.push(debitCard);
  }
  
  // Generate credit card if user has credit limit
  if (accountDistribution.credit > 0) {
    const brands = ['visa', 'mastercard', 'amex', 'discover'];
    const brand = brands[Math.floor(Math.random() * brands.length)] as 'visa' | 'mastercard' | 'amex' | 'discover';
    const number = generateCardNumber(brand);
    const maskedNumber = generateMaskedNumber(number);
    const expiry = generateExpiryDate();
    const dailyLimit = generateDailyLimit('credit', accountDistribution.credit);
    
    const creditCard: ICard = {
      userId: new mongoose.Types.ObjectId(userId),
      type: 'credit',
      brand,
      number,
      maskedNumber,
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cardholderName,
      isBlocked: false,
      dailyLimit,
      currentBalance: 0, // Start with no debt
      availableCredit: accountDistribution.credit,
      creditLimit: accountDistribution.credit,
      accountId: 'credit'
    } as ICard;
    
    cards.push(creditCard);
  }
  
  return cards;
};
