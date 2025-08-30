import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  totalBalance: number;
  accountDistribution: {
    checking: number;
    savings: number;
    credit: number;
  };
  creationDate: Date;
  includeTransactionHistory: boolean;
  transactionRules: {
    groceryFrequency: string;
    salaryAmount: number;
    spendingPattern: string;
    groceryAmount: {
      min: number;
      max: number;
    };
    gasAmount: {
      min: number;
      max: number;
    };
    restaurantAmount: {
      min: number;
      max: number;
    };
    onlineAmount: {
      min: number;
      max: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalBalance: {
    type: Number,
    required: true,
    min: 0
  },
  accountDistribution: {
    checking: {
      type: Number,
      required: true,
      min: 0
    },
    savings: {
      type: Number,
      required: true,
      min: 0
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  includeTransactionHistory: {
    type: Boolean,
    default: false
  },
  transactionRules: {
    groceryFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly'],
      default: 'weekly'
    },
    salaryAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spendingPattern: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate'
    },
    groceryAmount: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    },
    gasAmount: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    },
    restaurantAmount: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    },
    onlineAmount: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    }
  }
}, {
  timestamps: true
});

// Index is already defined in the schema field above

export default mongoose.model<IAccount>('Account', accountSchema);
