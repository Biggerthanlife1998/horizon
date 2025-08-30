import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: string; // 'checking', 'savings', or 'credit'
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'salary' | 'grocery' | 'gas' | 'restaurant' | 'online' | 'atm' | 'fee';
  amount: number;
  description: string;
  category: string;
  status: 'completed' | 'pending' | 'failed';
  transactionDate: Date; // The actual transaction date (can be backdated)
  metadata?: {
    recipientName?: string;
    recipientAccountNumber?: string;
    note?: string;
    kind?: string;
    swiftCode?: string;
    confirmationCode?: string;
    billerId?: string;
    billerName?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accountId: {
    type: String,
    enum: ['checking', 'savings', 'credit'],
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'salary', 'grocery', 'gas', 'restaurant', 'online', 'atm', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
transactionSchema.index({ userId: 1, accountId: 1, transactionDate: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);


