import mongoose, { Document, Schema } from 'mongoose';

interface IReceiptItem {
  itemId: Schema.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  qualityStatus?: 'PENDING' | 'PASSED' | 'FAILED';
  defectQuantity?: number;
  defectReason?: string;
}

interface IReceipt extends Document {
  _id: string;
  receiptNumber: string;
  purchaseOrderId?: Schema.Types.ObjectId;
  purchaseOrderNumber?: string;
  supplierId: Schema.Types.ObjectId;
  supplierName: string;
  receiptDate: Date;
  expectedDeliveryDate?: Date;
  warehouseId: Schema.Types.ObjectId;
  warehouseName: string;
  status: 'RECEIVED' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: IReceiptItem[];
  totalAmount: number;
  totalQuantity: number;
  receivedBy: Schema.Types.ObjectId;
  inspectedBy?: Schema.Types.ObjectId;
  inspectionDate?: Date;
  inspectionNotes?: string;
  remarks?: string;
  attachments?: string[];
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
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
  orderedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Ordered quantity cannot be negative']
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Received quantity cannot be negative']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  qualityStatus: {
    type: String,
    enum: ['PENDING', 'PASSED', 'FAILED'],
    default: 'PENDING'
  },
  defectQuantity: {
    type: Number,
    min: [0, 'Defect quantity cannot be negative'],
    default: 0
  },
  defectReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Defect reason cannot exceed 500 characters']
  }
}, { _id: false });

const ReceiptSchema = new Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  purchaseOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  purchaseOrderNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  receiptDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  warehouseName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['RECEIVED', 'INSPECTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
    default: 'RECEIVED'
  },
  items: [ReceiptItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
    default: 0
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: [0, 'Total quantity cannot be negative'],
    default: 0
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inspectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  inspectionDate: {
    type: Date
  },
  inspectionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Inspection notes cannot exceed 1000 characters']
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters']
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
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
ReceiptSchema.index({ receiptNumber: 1 });
ReceiptSchema.index({ supplierId: 1 });
ReceiptSchema.index({ warehouseId: 1 });
ReceiptSchema.index({ status: 1 });
ReceiptSchema.index({ receiptDate: -1 });
ReceiptSchema.index({ isActive: 1 });
ReceiptSchema.index({ purchaseOrderId: 1 });

// Pre-save middleware to calculate totals
ReceiptSchema.pre('save', function(this: IReceipt, next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  next();
});

// Pre-save middleware to generate receipt number
ReceiptSchema.pre('save', async function(this: IReceipt, next) {
  if (this.isNew && !this.receiptNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('Receipt').countDocuments({
        receiptNumber: new RegExp(`^RCP-${currentYear}`)
      });
      this.receiptNumber = `RCP-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance methods
ReceiptSchema.methods.canBeInspected = function(this: IReceipt): boolean {
  return this.status === 'RECEIVED';
};

ReceiptSchema.methods.canBeApproved = function(this: IReceipt): boolean {
  return this.status === 'INSPECTED';
};

ReceiptSchema.methods.inspect = function(
  this: IReceipt, 
  inspector: mongoose.Types.ObjectId, 
  notes?: string
): void {
  this.inspectedBy = inspector;
  this.inspectionDate = new Date();
  this.inspectionNotes = notes;
  this.status = 'INSPECTED';
};

ReceiptSchema.methods.approve = function(this: IReceipt): void {
  this.status = 'APPROVED';
};

ReceiptSchema.methods.reject = function(this: IReceipt, reason?: string): void {
  this.status = 'REJECTED';
  this.inspectionNotes = reason;
};

// Static methods
ReceiptSchema.statics.findBySupplier = function(supplierId: mongoose.Types.ObjectId) {
  return this.find({ supplierId, isActive: true }).sort({ createdAt: -1 });
};

ReceiptSchema.statics.findByWarehouse = function(warehouseId: mongoose.Types.ObjectId) {
  return this.find({ warehouseId, isActive: true }).sort({ createdAt: -1 });
};

ReceiptSchema.statics.findPendingInspection = function() {
  return this.find({ 
    status: 'RECEIVED', 
    isActive: true 
  }).sort({ receiptDate: 1 });
};

ReceiptSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$totalQuantity' }
      }
    }
  ]);
  
  return stats;
};

const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export { Receipt, type IReceipt, type IReceiptItem };