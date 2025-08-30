export interface User {
  id: string;
  firstName: string;
  lastName: string;
  preferredDisplayName?: string;
  address?: string;
  phoneNumber?: string;
  email: string;
  profilePicture?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Card {
  id: string;
  cardNumber: string;
  cardType: 'debit' | 'credit';
  status: 'active' | 'blocked' | 'expired';
  expiryDate: string;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}








