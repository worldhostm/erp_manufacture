import mongoose, { Document, Schema } from 'mongoose';

interface IWorkOrderMaterial {
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  requiredQuantity: number;
  issuedQuantity?: number;
  unit: string;
}

interface IWorkOrder extends Document {
  _id: string;
  orderNumber: string;
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  quantity: number;
  unit: string;
  workCenter: string;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  completedQuantity: number;
  defectQuantity: number;
  assignedTo?: string;
  supervisorId?: Schema.Types.ObjectId;
  supervisor?: {
    _id: string;
    name: string;
    employeeNumber: string;
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  materials: IWorkOrderMaterial[];
  instructions?: string;
  notes?: string;
  qualityStandards?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkOrderMaterialSchema = new Schema({
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
  issuedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Issued quantity cannot be negative']
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  }
}, { _id: false });

const WorkOrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
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
  workCenter: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Work center cannot exceed 100 characters']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  actualStartDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED'],
    default: 'PENDING'
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Completed quantity cannot be negative']
  },
  defectQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Defect quantity cannot be negative']
  },
  assignedTo: {
    type: String,
    trim: true,
    maxlength: [100, 'Assigned to cannot exceed 100 characters']
  },
  supervisorId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  materials: [WorkOrderMaterialSchema],
  instructions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  qualityStandards: {
    type: String,
    trim: true,
    maxlength: [1000, 'Quality standards cannot exceed 1000 characters']
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
WorkOrderSchema.index({ orderNumber: 1 });
WorkOrderSchema.index({ itemId: 1 });
WorkOrderSchema.index({ status: 1 });
WorkOrderSchema.index({ workCenter: 1 });
WorkOrderSchema.index({ startDate: -1 });
WorkOrderSchema.index({ priority: 1 });
WorkOrderSchema.index({ isActive: 1 });

// Virtual populate
WorkOrderSchema.virtual('item', {
  ref: 'Item',
  localField: 'itemId',
  foreignField: '_id',
  justOne: true
});

WorkOrderSchema.virtual('supervisor', {
  ref: 'Employee',
  localField: 'supervisorId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate order number
WorkOrderSchema.pre('save', async function(this: IWorkOrder, next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('WorkOrder').countDocuments({
        orderNumber: new RegExp(`^WO-${currentYear}`)
      });
      this.orderNumber = `WO-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance methods
WorkOrderSchema.methods.canStart = function(this: IWorkOrder): boolean {
  return this.status === 'PENDING';
};

WorkOrderSchema.methods.canComplete = function(this: IWorkOrder): boolean {
  return this.status === 'IN_PROGRESS';
};

WorkOrderSchema.methods.canPause = function(this: IWorkOrder): boolean {
  return this.status === 'IN_PROGRESS';
};

WorkOrderSchema.methods.canResume = function(this: IWorkOrder): boolean {
  return this.status === 'PAUSED';
};

WorkOrderSchema.methods.start = function(this: IWorkOrder, startDate?: Date): void {
  if (!this.canStart()) {
    throw new Error('Cannot start work order in current status');
  }
  this.status = 'IN_PROGRESS';
  this.actualStartDate = startDate || new Date();
};

WorkOrderSchema.methods.complete = function(this: IWorkOrder, completedQuantity: number, endDate?: Date): void {
  if (!this.canComplete()) {
    throw new Error('Cannot complete work order in current status');
  }
  this.status = 'COMPLETED';
  this.completedQuantity = completedQuantity;
  this.actualEndDate = endDate || new Date();
};

WorkOrderSchema.methods.pause = function(this: IWorkOrder, reason?: string): void {
  if (!this.canPause()) {
    throw new Error('Cannot pause work order in current status');
  }
  this.status = 'PAUSED';
  if (reason) {
    this.notes = (this.notes || '') + `\n[${new Date().toISOString()}] Paused: ${reason}`;
  }
};

WorkOrderSchema.methods.resume = function(this: IWorkOrder): void {
  if (!this.canResume()) {
    throw new Error('Cannot resume work order in current status');
  }
  this.status = 'IN_PROGRESS';
};

WorkOrderSchema.methods.cancel = function(this: IWorkOrder, reason?: string): void {
  if (this.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed work order');
  }
  this.status = 'CANCELLED';
  if (reason) {
    this.notes = (this.notes || '') + `\n[${new Date().toISOString()}] Cancelled: ${reason}`;
  }
};

WorkOrderSchema.methods.getProgress = function(this: IWorkOrder): number {
  if (this.quantity === 0) return 0;
  return Math.round((this.completedQuantity / this.quantity) * 100);
};

// Static methods
WorkOrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status, isActive: true }).sort({ priority: -1, startDate: 1 });
};

WorkOrderSchema.statics.findByWorkCenter = function(workCenter: string) {
  return this.find({ workCenter, isActive: true }).sort({ startDate: 1 });
};

WorkOrderSchema.statics.findOverdue = function() {
  const today = new Date();
  return this.find({
    endDate: { $lt: today },
    status: { $in: ['PENDING', 'IN_PROGRESS', 'PAUSED'] },
    isActive: true
  }).sort({ endDate: 1 });
};

WorkOrderSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        completedQuantity: { $sum: '$completedQuantity' }
      }
    }
  ]);
  
  return stats;
};

// Ensure virtual fields are serialized
WorkOrderSchema.set('toJSON', { virtuals: true });
WorkOrderSchema.set('toObject', { virtuals: true });

const WorkOrder = mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);

export { WorkOrder, type IWorkOrder, type IWorkOrderMaterial };