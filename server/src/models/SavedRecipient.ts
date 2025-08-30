import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedRecipient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  accountNumber: string;
  bankName?: string;
  category: 'personal' | 'business' | 'family' | 'other';
  isVerified: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedRecipientSchema = new Schema<ISavedRecipient>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  accountNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  bankName: { 
    type: String, 
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['personal', 'business', 'family', 'other'], 
    default: 'other' 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  lastUsed: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Compound index to ensure unique recipients per user
savedRecipientSchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

export default mongoose.model<ISavedRecipient>('SavedRecipient', savedRecipientSchema);
