import mongoose, { Document, Schema } from 'mongoose';

interface IBOMItem {
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
    category: string;
  };
  quantity: number;
  unit: string;
  cost?: number;
  notes?: string;
}

interface IBOM extends Document {
  _id: string;
  bomNumber: string;
  productId: Schema.Types.ObjectId;
  product?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  version: number;
  outputQuantity: number;
  items: IBOMItem[];
  totalCost: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string;
  isActive: boolean;
  effectiveDate: Date;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IWorkOrderItem {
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  requiredQuantity: number;
  allocatedQuantity: number;
  consumedQuantity: number;
  unitCost?: number;
  totalCost?: number;
  status: 'PENDING' | 'ALLOCATED' | 'CONSUMED';
  notes?: string;
}

interface IWorkOrder extends Document {
  _id: string;
  workOrderNumber: string;
  productId: Schema.Types.ObjectId;
  product?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  bomId: Schema.Types.ObjectId;
  plannedQuantity: number;
  completedQuantity: number;
  scrapQuantity: number;
  status: 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: Date;
  endDate?: Date;
  plannedStartDate: Date;
  plannedEndDate: Date;
  items: IWorkOrderItem[];
  totalMaterialCost: number;
  laborCost?: number;
  overheadCost?: number;
  totalCost: number;
  notes?: string;
  qualityChecked: boolean;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  assignedTo?: Schema.Types.ObjectId;
  completedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IProductionLogEntry {
  timestamp: Date;
  operatorId: Schema.Types.ObjectId;
  operator?: {
    _id: string;
    name: string;
  };
  action: 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'STOP' | 'MATERIAL_CONSUMED' | 'QUALITY_CHECK';
  quantity?: number;
  notes?: string;
}

interface IProductionLog extends Document {
  _id: string;
  workOrderId: Schema.Types.ObjectId;
  workOrder?: {
    _id: string;
    workOrderNumber: string;
    productName: string;
  };
  productionDate: Date;
  shiftInfo?: {
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    supervisor: string;
  };
  entries: IProductionLogEntry[];
  totalDuration?: number;
  efficiency?: number;
  yield?: number;
  notes?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BOMItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
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
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
});

const BOMSchema = new Schema({
  bomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  outputQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Output quantity must be positive']
  },
  items: [BOMItemSchema],
  totalCost: {
    type: Number,
    default: 0,
    min: [0, 'Total cost cannot be negative']
  },
  laborCost: {
    type: Number,
    default: 0,
    min: [0, 'Labor cost cannot be negative']
  },
  overheadCost: {
    type: Number,
    default: 0,
    min: [0, 'Overhead cost cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
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

const WorkOrderItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  requiredQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Required quantity must be positive']
  },
  allocatedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Allocated quantity cannot be negative']
  },
  consumedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Consumed quantity cannot be negative']
  },
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  },
  status: {
    type: String,
    enum: ['PENDING', 'ALLOCATED', 'CONSUMED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
});

const WorkOrderSchema = new Schema({
  workOrderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  bomId: {
    type: Schema.Types.ObjectId,
    ref: 'BOM',
    required: true
  },
  plannedQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Planned quantity must be positive']
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Completed quantity cannot be negative']
  },
  scrapQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Scrap quantity cannot be negative']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  plannedStartDate: {
    type: Date,
    required: true
  },
  plannedEndDate: {
    type: Date,
    required: true
  },
  items: [WorkOrderItemSchema],
  totalMaterialCost: {
    type: Number,
    default: 0,
    min: [0, 'Total material cost cannot be negative']
  },
  laborCost: {
    type: Number,
    default: 0,
    min: [0, 'Labor cost cannot be negative']
  },
  overheadCost: {
    type: Number,
    default: 0,
    min: [0, 'Overhead cost cannot be negative']
  },
  totalCost: {
    type: Number,
    default: 0,
    min: [0, 'Total cost cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  qualityChecked: {
    type: Boolean,
    default: false
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
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const ProductionLogEntrySchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  operatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['START', 'PAUSE', 'RESUME', 'COMPLETE', 'STOP', 'MATERIAL_CONSUMED', 'QUALITY_CHECK'],
    required: true
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
});

const ProductionLogSchema = new Schema({
  workOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  productionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  shiftInfo: {
    shift: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'NIGHT']
    },
    supervisor: {
      type: String,
      trim: true,
      maxlength: [100, 'Supervisor name cannot exceed 100 characters']
    }
  },
  entries: [ProductionLogEntrySchema],
  totalDuration: {
    type: Number,
    min: [0, 'Total duration cannot be negative']
  },
  efficiency: {
    type: Number,
    min: [0, 'Efficiency cannot be negative'],
    max: [200, 'Efficiency cannot exceed 200%']
  },
  yield: {
    type: Number,
    min: [0, 'Yield cannot be negative'],
    max: [100, 'Yield cannot exceed 100%']
  },
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

// Indexes
BOMSchema.index({ bomNumber: 1 });
BOMSchema.index({ productId: 1 });
BOMSchema.index({ isActive: 1, effectiveDate: -1 });

WorkOrderSchema.index({ workOrderNumber: 1 });
WorkOrderSchema.index({ productId: 1 });
WorkOrderSchema.index({ status: 1, priority: 1 });
WorkOrderSchema.index({ plannedStartDate: 1, plannedEndDate: 1 });
WorkOrderSchema.index({ createdBy: 1, assignedTo: 1 });

ProductionLogSchema.index({ workOrderId: 1 });
ProductionLogSchema.index({ productionDate: -1 });
ProductionLogSchema.index({ 'shiftInfo.shift': 1 });

// Virtual populate
BOMSchema.virtual('product', {
  ref: 'Item',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

WorkOrderSchema.virtual('product', {
  ref: 'Item',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

WorkOrderSchema.virtual('bom', {
  ref: 'BOM',
  localField: 'bomId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
BOMSchema.pre('save', function(this: IBOM, next) {
  this.totalCost = this.items.reduce((sum, item) => sum + (item.cost || 0), 0) + (this.laborCost || 0) + (this.overheadCost || 0);
  next();
});

WorkOrderSchema.pre('save', function(this: IWorkOrder, next) {
  this.totalMaterialCost = this.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  this.totalCost = this.totalMaterialCost + (this.laborCost || 0) + (this.overheadCost || 0);
  next();
});

// Ensure virtual fields are serialized
BOMSchema.set('toJSON', { virtuals: true });
BOMSchema.set('toObject', { virtuals: true });
WorkOrderSchema.set('toJSON', { virtuals: true });
WorkOrderSchema.set('toObject', { virtuals: true });
ProductionLogSchema.set('toJSON', { virtuals: true });
ProductionLogSchema.set('toObject', { virtuals: true });

const BOM = mongoose.model<IBOM>('BOM', BOMSchema);
const WorkOrder = mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);
const ProductionLog = mongoose.model<IProductionLog>('ProductionLog', ProductionLogSchema);

export { 
  BOM, 
  WorkOrder, 
  ProductionLog,
  type IBOM, 
  type IWorkOrder, 
  type IProductionLog,
  type IBOMItem,
  type IWorkOrderItem,
  type IProductionLogEntry
};