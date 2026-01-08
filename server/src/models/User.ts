import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  preferredDisplayName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  profilePicture?: string;
  isAdmin: boolean;
  isActive: boolean;
  transferPin: string;
  securityQuestion: string;
  securityAnswer: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  preferredDisplayName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  transferPin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4
  },
  securityQuestion: {
    type: String,
    required: true,
    default: 'What was the name of your first pet?'
  },
  securityAnswer: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes are already defined in the schema fields above

export default mongoose.model<IUser>('User', userSchema);
