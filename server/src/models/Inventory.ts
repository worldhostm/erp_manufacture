import mongoose, { Document, Schema } from 'mongoose';

interface IInventoryTransaction {
  transactionId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitPrice?: number;
  reason: 'PURCHASE' | 'PRODUCTION' | 'SALE' | 'TRANSFER' | 'ADJUSTMENT' | 'WASTE' | 'RETURN';
  reference?: string;
  referenceId?: Schema.Types.ObjectId;
  lotNumber?: string;
  expiryDate?: Date;
  notes?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

interface IInventory extends Document {
  _id: string;
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    minStock: number;
    maxStock: number;
    safetyStock: number;
  };
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  averageCost: number;
  totalValue: number;
  lastStockUpdate: Date;
  transactions: IInventoryTransaction[];
  location?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IStockMovement extends Document {
  _id: string;
  movementNumber: string;
  type: 'TRANSFER' | 'ADJUSTMENT' | 'COUNT';
  fromLocation?: string;
  toLocation?: string;
  items: {
    itemId: Schema.Types.ObjectId;
    item?: {
      _id: string;
      code: string;
      name: string;
      unit: string;
    };
    quantity: number;
    unitCost?: number;
    fromStock?: number;
    toStock?: number;
    notes?: string;
  }[];
  reason?: string;
  status: 'DRAFT' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema({
  transactionId: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    min: [0, 'Unit price cannot be negative']
  },
  reason: {
    type: String,
    enum: ['PURCHASE', 'PRODUCTION', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'WASTE', 'RETURN'],
    required: true
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  referenceId: {
    type: Schema.Types.ObjectId
  },
  lotNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Lot number cannot exceed 50 characters']
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const InventorySchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    unique: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Current stock cannot be negative']
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: [0, 'Reserved stock cannot be negative']
  },
  averageCost: {
    type: Number,
    default: 0,
    min: [0, 'Average cost cannot be negative']
  },
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'Total value cannot be negative']
  },
  lastStockUpdate: {
    type: Date,
    default: Date.now
  },
  transactions: [InventoryTransactionSchema],
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: 'MAIN_WAREHOUSE'
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

const StockMovementItemSchema = new Schema({
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
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  fromStock: {
    type: Number,
    min: [0, 'From stock cannot be negative']
  },
  toStock: {
    type: Number,
    min: [0, 'To stock cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
});

const StockMovementSchema = new Schema({
  movementNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['TRANSFER', 'ADJUSTMENT', 'COUNT'],
    required: true
  },
  fromLocation: {
    type: String,
    trim: true,
    maxlength: [100, 'From location cannot exceed 100 characters']
  },
  toLocation: {
    type: String,
    trim: true,
    maxlength: [100, 'To location cannot exceed 100 characters']
  },
  items: [StockMovementItemSchema],
  reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
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
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for available stock
InventorySchema.virtual('availableStock').get(function(this: IInventory) {
  return this.currentStock - this.reservedStock;
});

// Virtual populate for item information
InventorySchema.virtual('item', {
  ref: 'Item',
  localField: 'itemId',
  foreignField: '_id',
  justOne: true
});

StockMovementSchema.virtual('totalValue').get(function(this: IStockMovement) {
  return this.items.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0);
});

// Indexes for better performance
InventorySchema.index({ itemId: 1 });
InventorySchema.index({ currentStock: 1 });
InventorySchema.index({ location: 1 });
InventorySchema.index({ 'transactions.createdAt': -1 });
InventorySchema.index({ lastStockUpdate: -1 });

StockMovementSchema.index({ movementNumber: 1 });
StockMovementSchema.index({ type: 1, status: 1 });
StockMovementSchema.index({ fromLocation: 1, toLocation: 1 });
StockMovementSchema.index({ createdAt: -1 });

// Pre-save middleware to update calculations
InventorySchema.pre('save', function(this: IInventory, next) {
  this.totalValue = this.currentStock * this.averageCost;
  this.lastStockUpdate = new Date();
  next();
});

// Ensure virtual fields are serialized
InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });
StockMovementSchema.set('toJSON', { virtuals: true });
StockMovementSchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);

export { 
  Inventory, 
  StockMovement,
  type IInventory, 
  type IStockMovement,
  type IInventoryTransaction
};