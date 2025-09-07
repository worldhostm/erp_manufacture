import mongoose, { Document, Schema } from 'mongoose';

interface IPurchaseRequestItem {
  itemId?: Schema.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  category?: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
  requiredDate?: Date;
  purpose: string;
  specification?: string;
  notes?: string;
  approvedQuantity?: number;
  rejectionReason?: string;
}

interface IPurchaseRequest extends Document {
  _id: string;
  requestNumber: string;
  requesterId: Schema.Types.ObjectId;
  requester?: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  department: string;
  requestDate: Date;
  requiredDate?: Date;
  purpose: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'ORDERED' | 'CANCELLED';
  items: IPurchaseRequestItem[];
  totalAmount: number;
  justification?: string;
  attachments?: string[];
  
  // Approval workflow
  approvalHistory: Array<{
    approvedBy: Schema.Types.ObjectId;
    approver?: {
      _id: string;
      name: string;
      email: string;
    };
    approvedAt: Date;
    action: 'APPROVED' | 'REJECTED' | 'RETURNED';
    comments?: string;
    level: number;
  }>;
  currentApprovalLevel: number;
  maxApprovalLevel: number;
  
  // Final approval details
  finalApprovedBy?: Schema.Types.ObjectId;
  finalApprovedAt?: Date;
  finalApprovalComments?: string;
  
  // Purchase order reference
  purchaseOrderId?: Schema.Types.ObjectId;
  
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequestItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item'
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  itemCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Item code cannot exceed 50 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  estimatedPrice: {
    type: Number,
    required: true,
    min: [0, 'Estimated price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  requiredDate: {
    type: Date
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  specification: {
    type: String,
    trim: true,
    maxlength: [1000, 'Specification cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  approvedQuantity: {
    type: Number,
    min: [0, 'Approved quantity cannot be negative']
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  }
}, { _id: false });

const ApprovalHistorySchema = new Schema({
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  action: {
    type: String,
    enum: ['APPROVED', 'REJECTED', 'RETURNED'],
    required: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  level: {
    type: Number,
    required: true,
    min: [1, 'Approval level must be at least 1']
  }
}, { _id: false });

const PurchaseRequestSchema = new Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  requestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  requiredDate: {
    type: Date
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Purpose cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'ORDERED', 'CANCELLED'],
    default: 'DRAFT'
  },
  items: [PurchaseRequestItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
    default: 0
  },
  justification: {
    type: String,
    trim: true,
    maxlength: [2000, 'Justification cannot exceed 2000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  
  approvalHistory: [ApprovalHistorySchema],
  currentApprovalLevel: {
    type: Number,
    default: 0,
    min: [0, 'Current approval level cannot be negative']
  },
  maxApprovalLevel: {
    type: Number,
    default: 1,
    min: [1, 'Max approval level must be at least 1']
  },
  
  finalApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  finalApprovedAt: {
    type: Date
  },
  finalApprovalComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Final approval comments cannot exceed 1000 characters']
  },
  
  purchaseOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
PurchaseRequestSchema.index({ requestNumber: 1 });
PurchaseRequestSchema.index({ requesterId: 1 });
PurchaseRequestSchema.index({ department: 1 });
PurchaseRequestSchema.index({ status: 1 });
PurchaseRequestSchema.index({ priority: 1 });
PurchaseRequestSchema.index({ requestDate: -1 });
PurchaseRequestSchema.index({ isActive: 1 });
PurchaseRequestSchema.index({ totalAmount: -1 });

// Virtual populate
PurchaseRequestSchema.virtual('requester', {
  ref: 'User',
  localField: 'requesterId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate total amount
PurchaseRequestSchema.pre('save', function(this: IPurchaseRequest, next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  next();
});

// Pre-save middleware to generate request number
PurchaseRequestSchema.pre('save', async function(this: IPurchaseRequest, next) {
  if (this.isNew && !this.requestNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('PurchaseRequest').countDocuments({
        requestNumber: new RegExp(`^PR-${currentYear}`)
      });
      this.requestNumber = `PR-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance methods
PurchaseRequestSchema.methods.canBeApproved = function(this: IPurchaseRequest): boolean {
  return this.status === 'SUBMITTED' || this.status === 'UNDER_REVIEW';
};

PurchaseRequestSchema.methods.canBeEdited = function(this: IPurchaseRequest): boolean {
  return this.status === 'DRAFT' || this.status === 'RETURNED';
};

PurchaseRequestSchema.methods.approve = function(
  this: IPurchaseRequest, 
  approver: mongoose.Types.ObjectId, 
  comments?: string
): void {
  this.approvalHistory.push({
    approvedBy: approver,
    approvedAt: new Date(),
    action: 'APPROVED',
    comments,
    level: this.currentApprovalLevel + 1
  });
  
  this.currentApprovalLevel += 1;
  
  if (this.currentApprovalLevel >= this.maxApprovalLevel) {
    this.status = 'APPROVED';
    this.finalApprovedBy = approver;
    this.finalApprovedAt = new Date();
    this.finalApprovalComments = comments;
  } else {
    this.status = 'UNDER_REVIEW';
  }
};

PurchaseRequestSchema.methods.reject = function(
  this: IPurchaseRequest, 
  approver: mongoose.Types.ObjectId, 
  comments?: string
): void {
  this.approvalHistory.push({
    approvedBy: approver,
    approvedAt: new Date(),
    action: 'REJECTED',
    comments,
    level: this.currentApprovalLevel + 1
  });
  
  this.status = 'REJECTED';
  this.finalApprovalComments = comments;
};

// Static methods
PurchaseRequestSchema.statics.findByRequester = function(requesterId: mongoose.Types.ObjectId) {
  return this.find({ requesterId, isActive: true }).sort({ createdAt: -1 });
};

PurchaseRequestSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department, isActive: true }).sort({ createdAt: -1 });
};

PurchaseRequestSchema.statics.findPendingApproval = function(level?: number) {
  const query: any = { 
    status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] }, 
    isActive: true 
  };
  
  if (level !== undefined) {
    query.currentApprovalLevel = level - 1;
  }
  
  return this.find(query).sort({ priority: -1, requestDate: 1 });
};

PurchaseRequestSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  return stats;
};

// Ensure virtual fields are serialized
PurchaseRequestSchema.set('toJSON', { virtuals: true });
PurchaseRequestSchema.set('toObject', { virtuals: true });

const PurchaseRequest = mongoose.model<IPurchaseRequest>('PurchaseRequest', PurchaseRequestSchema);

export { PurchaseRequest, type IPurchaseRequest, type IPurchaseRequestItem };