import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'debit' | 'credit';
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  number: string; // Full card number (encrypted in production)
  maskedNumber: string; // Display version (**** **** **** 1234)
  expiryMonth: string; // MM format
  expiryYear: string; // YY format
  cardholderName: string;
  isBlocked: boolean;
  dailyLimit: number; // Daily spending limit
  currentBalance: number; // For debit: checking balance, For credit: current debt
  availableCredit?: number; // Only for credit cards
  creditLimit?: number; // Only for credit cards
  accountId: string; // 'checking' or 'credit' - which account this card is linked to
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  brand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover'],
    required: true
  },
  number: {
    type: String,
    required: true
  },
  maskedNumber: {
    type: String,
    required: true
  },
  expiryMonth: {
    type: String,
    required: true,
    match: /^(0[1-9]|1[0-2])$/
  },
  expiryYear: {
    type: String,
    required: true,
    match: /^[0-9]{2}$/
  },
  cardholderName: {
    type: String,
    required: true,
    uppercase: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  dailyLimit: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  availableCredit: {
    type: Number,
    min: 0
  },
  creditLimit: {
    type: Number,
    min: 0
  },
  accountId: {
    type: String,
    enum: ['checking', 'credit'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
cardSchema.index({ userId: 1, type: 1 });
cardSchema.index({ userId: 1, accountId: 1 });

export default mongoose.model<ICard>('Card', cardSchema);
