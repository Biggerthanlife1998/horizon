import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledTransfer extends Document {
  userId: mongoose.Types.ObjectId;
  fromAccountId: string;
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankName?: string;
  amount: number;
  note?: string;
  kind: 'internal' | 'external' | 'international';
  swiftCode?: string;
  transferSpeed: 'instant' | 'next-day' | 'standard';
  scheduledDate: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  frequency?: 'once' | 'weekly' | 'monthly' | 'yearly';
  endDate?: Date;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionCount: number;
  maxExecutions?: number;
  confirmationCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledTransferSchema = new Schema<IScheduledTransfer>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  fromAccountId: { 
    type: String, 
    required: true 
  },
  recipientName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  recipientAccountNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  recipientBankName: { 
    type: String, 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0.01 
  },
  note: { 
    type: String, 
    trim: true 
  },
  kind: { 
    type: String, 
    enum: ['internal', 'external', 'international'], 
    default: 'internal' 
  },
  swiftCode: { 
    type: String, 
    trim: true 
  },
  transferSpeed: { 
    type: String, 
    enum: ['instant', 'next-day', 'standard'], 
    default: 'next-day' 
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'processing', 'completed', 'failed', 'cancelled'], 
    default: 'scheduled' 
  },
  frequency: { 
    type: String, 
    enum: ['once', 'weekly', 'monthly', 'yearly'], 
    default: 'once' 
  },
  endDate: { 
    type: Date 
  },
  lastExecuted: { 
    type: Date 
  },
  nextExecution: { 
    type: Date 
  },
  executionCount: { 
    type: Number, 
    default: 0 
  },
  maxExecutions: { 
    type: Number 
  },
  confirmationCode: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
scheduledTransferSchema.index({ userId: 1, status: 1 });
scheduledTransferSchema.index({ nextExecution: 1, status: 1 });
scheduledTransferSchema.index({ scheduledDate: 1 });

export default mongoose.model<IScheduledTransfer>('ScheduledTransfer', scheduledTransferSchema);
