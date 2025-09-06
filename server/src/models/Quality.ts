import mongoose, { Document, Schema } from 'mongoose';

interface IQualityCheckItem {
  checkPoint: string;
  specification: string;
  actualValue?: string;
  result: 'PASS' | 'FAIL' | 'WARNING';
  notes?: string;
  inspector?: string;
  timestamp: Date;
}

interface IQualityControl extends Document {
  _id: string;
  qcNumber: string;
  type: 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'CUSTOMER_RETURN';
  itemId?: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    category: string;
  };
  workOrderId?: Schema.Types.ObjectId;
  workOrder?: {
    _id: string;
    workOrderNumber: string;
    productName: string;
  };
  purchaseReceiptId?: Schema.Types.ObjectId;
  lotNumber?: string;
  batchNumber?: string;
  inspectionDate: Date;
  quantity: number;
  unit: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL_PASS';
  overallResult: 'PASS' | 'FAIL' | 'WARNING';
  passedQuantity: number;
  failedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  checkItems: IQualityCheckItem[];
  inspectorId: Schema.Types.ObjectId;
  inspector?: {
    _id: string;
    name: string;
    department: string;
  };
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  nonConformanceReason?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  attachments?: string[];
  notes?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface INonConformance extends Document {
  _id: string;
  ncNumber: string;
  title: string;
  description: string;
  type: 'PRODUCT' | 'PROCESS' | 'DOCUMENTATION' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'INTERNAL' | 'CUSTOMER' | 'SUPPLIER' | 'AUDIT';
  detectedBy: Schema.Types.ObjectId;
  detectedDate: Date;
  itemId?: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
  };
  workOrderId?: Schema.Types.ObjectId;
  supplierId?: Schema.Types.ObjectId;
  supplier?: {
    _id: string;
    name: string;
  };
  customerId?: Schema.Types.ObjectId;
  customer?: {
    _id: string;
    name: string;
  };
  affectedQuantity?: number;
  status: 'OPEN' | 'IN_INVESTIGATION' | 'CORRECTIVE_ACTION' | 'CLOSED' | 'CANCELLED';
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  assignedTo?: Schema.Types.ObjectId;
  assignedAt?: Date;
  targetCloseDate?: Date;
  actualCloseDate?: Date;
  verification?: {
    verifiedBy: Schema.Types.ObjectId;
    verifiedAt: Date;
    verificationNotes: string;
    effective: boolean;
  };
  recurrence?: {
    isRecurrence: boolean;
    previousNCId?: Schema.Types.ObjectId;
    frequency: number;
  };
  cost?: {
    reworkCost?: number;
    replacementCost?: number;
    customerClaimCost?: number;
    totalCost?: number;
  };
  attachments?: string[];
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IQualityMetrics extends Document {
  _id: string;
  period: Date;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  passRate: number;
  firstPassYield: number;
  defectRate: number;
  customerComplaints: number;
  supplierDefects: number;
  reworkCost: number;
  scrapCost: number;
  totalQualityCost: number;
  metrics: {
    [key: string]: number;
  };
  isActive: boolean;
  calculatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QualityCheckItemSchema = new Schema({
  checkPoint: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Check point cannot exceed 200 characters']
  },
  specification: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Specification cannot exceed 500 characters']
  },
  actualValue: {
    type: String,
    trim: true,
    maxlength: [200, 'Actual value cannot exceed 200 characters']
  },
  result: {
    type: String,
    enum: ['PASS', 'FAIL', 'WARNING'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  inspector: {
    type: String,
    trim: true,
    maxlength: [100, 'Inspector name cannot exceed 100 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const QualityControlSchema = new Schema({
  qcNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['INCOMING', 'IN_PROCESS', 'FINAL', 'CUSTOMER_RETURN'],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item'
  },
  workOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  purchaseReceiptId: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseReceipt'
  },
  lotNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Lot number cannot exceed 50 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  inspectionDate: {
    type: Date,
    required: true,
    default: Date.now
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
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL_PASS'],
    default: 'PENDING'
  },
  overallResult: {
    type: String,
    enum: ['PASS', 'FAIL', 'WARNING'],
    required: true
  },
  passedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Passed quantity cannot be negative']
  },
  failedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Failed quantity cannot be negative']
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Rejected quantity cannot be negative']
  },
  reworkQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Rework quantity cannot be negative']
  },
  checkItems: [QualityCheckItemSchema],
  inspectorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  nonConformanceReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Non-conformance reason cannot exceed 1000 characters']
  },
  correctiveAction: {
    type: String,
    trim: true,
    maxlength: [1000, 'Corrective action cannot exceed 1000 characters']
  },
  preventiveAction: {
    type: String,
    trim: true,
    maxlength: [1000, 'Preventive action cannot exceed 1000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const NonConformanceSchema = new Schema({
  ncNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['PRODUCT', 'PROCESS', 'DOCUMENTATION', 'SYSTEM'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  source: {
    type: String,
    enum: ['INTERNAL', 'CUSTOMER', 'SUPPLIER', 'AUDIT'],
    required: true
  },
  detectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  detectedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item'
  },
  workOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  affectedQuantity: {
    type: Number,
    min: [0, 'Affected quantity cannot be negative']
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_INVESTIGATION', 'CORRECTIVE_ACTION', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  rootCause: {
    type: String,
    trim: true,
    maxlength: [2000, 'Root cause cannot exceed 2000 characters']
  },
  correctiveAction: {
    type: String,
    trim: true,
    maxlength: [2000, 'Corrective action cannot exceed 2000 characters']
  },
  preventiveAction: {
    type: String,
    trim: true,
    maxlength: [2000, 'Preventive action cannot exceed 2000 characters']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  targetCloseDate: {
    type: Date
  },
  actualCloseDate: {
    type: Date
  },
  verification: {
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
    },
    effective: {
      type: Boolean,
      default: false
    }
  },
  recurrence: {
    isRecurrence: {
      type: Boolean,
      default: false
    },
    previousNCId: {
      type: Schema.Types.ObjectId,
      ref: 'NonConformance'
    },
    frequency: {
      type: Number,
      default: 1,
      min: [1, 'Frequency must be at least 1']
    }
  },
  cost: {
    reworkCost: {
      type: Number,
      default: 0,
      min: [0, 'Rework cost cannot be negative']
    },
    replacementCost: {
      type: Number,
      default: 0,
      min: [0, 'Replacement cost cannot be negative']
    },
    customerClaimCost: {
      type: Number,
      default: 0,
      min: [0, 'Customer claim cost cannot be negative']
    },
    totalCost: {
      type: Number,
      default: 0,
      min: [0, 'Total cost cannot be negative']
    }
  },
  attachments: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const QualityMetricsSchema = new Schema({
  period: {
    type: Date,
    required: true
  },
  periodType: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true
  },
  totalInspections: {
    type: Number,
    default: 0,
    min: [0, 'Total inspections cannot be negative']
  },
  passedInspections: {
    type: Number,
    default: 0,
    min: [0, 'Passed inspections cannot be negative']
  },
  failedInspections: {
    type: Number,
    default: 0,
    min: [0, 'Failed inspections cannot be negative']
  },
  passRate: {
    type: Number,
    default: 0,
    min: [0, 'Pass rate cannot be negative'],
    max: [100, 'Pass rate cannot exceed 100%']
  },
  firstPassYield: {
    type: Number,
    default: 0,
    min: [0, 'First pass yield cannot be negative'],
    max: [100, 'First pass yield cannot exceed 100%']
  },
  defectRate: {
    type: Number,
    default: 0,
    min: [0, 'Defect rate cannot be negative']
  },
  customerComplaints: {
    type: Number,
    default: 0,
    min: [0, 'Customer complaints cannot be negative']
  },
  supplierDefects: {
    type: Number,
    default: 0,
    min: [0, 'Supplier defects cannot be negative']
  },
  reworkCost: {
    type: Number,
    default: 0,
    min: [0, 'Rework cost cannot be negative']
  },
  scrapCost: {
    type: Number,
    default: 0,
    min: [0, 'Scrap cost cannot be negative']
  },
  totalQualityCost: {
    type: Number,
    default: 0,
    min: [0, 'Total quality cost cannot be negative']
  },
  metrics: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
QualityControlSchema.index({ qcNumber: 1 });
QualityControlSchema.index({ type: 1, status: 1 });
QualityControlSchema.index({ itemId: 1, workOrderId: 1 });
QualityControlSchema.index({ inspectionDate: -1 });
QualityControlSchema.index({ inspectorId: 1 });

NonConformanceSchema.index({ ncNumber: 1 });
NonConformanceSchema.index({ type: 1, severity: 1, status: 1 });
NonConformanceSchema.index({ detectedDate: -1 });
NonConformanceSchema.index({ assignedTo: 1 });
NonConformanceSchema.index({ targetCloseDate: 1 });

QualityMetricsSchema.index({ period: 1, periodType: 1 }, { unique: true });
QualityMetricsSchema.index({ calculatedAt: -1 });

// Virtual populate
QualityControlSchema.virtual('item', {
  ref: 'Item',
  localField: 'itemId',
  foreignField: '_id',
  justOne: true
});

QualityControlSchema.virtual('workOrder', {
  ref: 'WorkOrder',
  localField: 'workOrderId',
  foreignField: '_id',
  justOne: true
});

QualityControlSchema.virtual('inspector', {
  ref: 'User',
  localField: 'inspectorId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
NonConformanceSchema.pre('save', function(this: INonConformance, next) {
  if (this.cost) {
    this.cost.totalCost = (this.cost.reworkCost || 0) + (this.cost.replacementCost || 0) + (this.cost.customerClaimCost || 0);
  }
  next();
});

QualityMetricsSchema.pre('save', function(this: IQualityMetrics, next) {
  if (this.totalInspections > 0) {
    this.passRate = (this.passedInspections / this.totalInspections) * 100;
  }
  this.calculatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
QualityControlSchema.set('toJSON', { virtuals: true });
QualityControlSchema.set('toObject', { virtuals: true });
NonConformanceSchema.set('toJSON', { virtuals: true });
NonConformanceSchema.set('toObject', { virtuals: true });

const QualityControl = mongoose.model<IQualityControl>('QualityControl', QualityControlSchema);
const NonConformance = mongoose.model<INonConformance>('NonConformance', NonConformanceSchema);
const QualityMetrics = mongoose.model<IQualityMetrics>('QualityMetrics', QualityMetricsSchema);

export { 
  QualityControl, 
  NonConformance, 
  QualityMetrics,
  type IQualityControl, 
  type INonConformance, 
  type IQualityMetrics,
  type IQualityCheckItem
};