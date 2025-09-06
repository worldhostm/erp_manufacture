import mongoose, { Document, Schema } from 'mongoose';

interface ICompany extends Document {
  _id: string;
  name: string;
  businessNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  ceo?: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'BOTH';
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  taxInfo?: {
    taxType: string;
    taxNumber: string;
  };
  isActive: boolean;
  notes?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [255, 'Company name cannot exceed 255 characters'],
    set: function(value: string) {
      // Ensure UTF-8 encoding when setting value
      if (typeof value === 'string') {
        return Buffer.from(value, 'utf8').toString('utf8');
      }
      return value;
    }
  },
  businessNumber: {
    type: String,
    trim: true,
    sparse: true, // allows multiple null values
    match: [/^\d{3}-\d{2}-\d{5}$/, 'Business number format should be XXX-XX-XXXXX']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters'],
    set: function(value: string) {
      if (typeof value === 'string') {
        return Buffer.from(value, 'utf8').toString('utf8');
      }
      return value;
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone cannot exceed 20 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  ceo: {
    type: String,
    trim: true,
    maxlength: [100, 'CEO name cannot exceed 100 characters'],
    set: function(value: string) {
      if (typeof value === 'string') {
        return Buffer.from(value, 'utf8').toString('utf8');
      }
      return value;
    }
  },
  type: {
    type: String,
    enum: ['SUPPLIER', 'CUSTOMER', 'BOTH'],
    required: [true, 'Company type is required']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    set: function(value: string) {
      if (typeof value === 'string') {
        return Buffer.from(value, 'utf8').toString('utf8');
      }
      return value;
    }
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Contact phone cannot exceed 20 characters']
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid contact email']
  },
  bankAccount: {
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Account number cannot exceed 50 characters']
    },
    accountHolder: {
      type: String,
      trim: true,
      maxlength: [100, 'Account holder name cannot exceed 100 characters']
    }
  },
  taxInfo: {
    taxType: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax type cannot exceed 50 characters']
    },
    taxNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax number cannot exceed 50 characters']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({ type: 1, isActive: 1 });
CompanySchema.index({ businessNumber: 1 }, { sparse: true });
CompanySchema.index({ createdBy: 1 });

const Company = mongoose.model<ICompany>('Company', CompanySchema);

export { Company, type ICompany };
export default Company;