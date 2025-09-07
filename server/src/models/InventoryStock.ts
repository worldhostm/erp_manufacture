import mongoose, { Document, Schema } from 'mongoose';

interface IInventoryStock extends Document {
  _id: string;
  itemId: Schema.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  itemCategory?: string;
  warehouseId: Schema.Types.ObjectId;
  warehouseName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  reorderPoint: number;
  averageUnitCost: number;
  totalValue: number;
  lastInDate?: Date;
  lastOutDate?: Date;
  lastTransactionDate?: Date;
  batchNumbers?: Array<{
    batchNumber: string;
    quantity: number;
    expirationDate?: Date;
    receivedDate: Date;
  }>;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isActive: boolean;
  lastUpdatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema({
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Batch quantity cannot be negative']
  },
  expirationDate: {
    type: Date
  },
  receivedDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

const InventoryStockSchema = new Schema({
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
  itemCategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Item category cannot exceed 100 characters']
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
  currentQuantity: {
    type: Number,
    required: true,
    min: [0, 'Current quantity cannot be negative'],
    default: 0
  },
  reservedQuantity: {
    type: Number,
    min: [0, 'Reserved quantity cannot be negative'],
    default: 0
  },
  availableQuantity: {
    type: Number,
    min: [0, 'Available quantity cannot be negative'],
    default: 0
  },
  minimumQuantity: {
    type: Number,
    min: [0, 'Minimum quantity cannot be negative'],
    default: 0
  },
  maximumQuantity: {
    type: Number,
    min: [0, 'Maximum quantity cannot be negative']
  },
  reorderPoint: {
    type: Number,
    min: [0, 'Reorder point cannot be negative'],
    default: 0
  },
  averageUnitCost: {
    type: Number,
    min: [0, 'Average unit cost cannot be negative'],
    default: 0
  },
  totalValue: {
    type: Number,
    min: [0, 'Total value cannot be negative'],
    default: 0
  },
  lastInDate: {
    type: Date
  },
  lastOutDate: {
    type: Date
  },
  lastTransactionDate: {
    type: Date
  },
  batchNumbers: [BatchSchema],
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
    default: 'ACTIVE'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index
InventoryStockSchema.index({ itemId: 1, warehouseId: 1 }, { unique: true });

// Other indexes
InventoryStockSchema.index({ itemId: 1 });
InventoryStockSchema.index({ warehouseId: 1 });
InventoryStockSchema.index({ currentQuantity: 1 });
InventoryStockSchema.index({ availableQuantity: 1 });
InventoryStockSchema.index({ status: 1 });
InventoryStockSchema.index({ isActive: 1 });
InventoryStockSchema.index({ lastTransactionDate: -1 });

// Pre-save middleware to calculate available quantity and total value
InventoryStockSchema.pre('save', function(this: IInventoryStock, next) {
  // Calculate available quantity
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  
  // Calculate total value
  this.totalValue = this.currentQuantity * this.averageUnitCost;
  
  next();
});

// Instance methods
InventoryStockSchema.methods.isLowStock = function(this: IInventoryStock): boolean {
  return this.availableQuantity <= this.reorderPoint;
};

InventoryStockSchema.methods.isCriticalStock = function(this: IInventoryStock): boolean {
  return this.availableQuantity <= this.minimumQuantity;
};

InventoryStockSchema.methods.isOverStock = function(this: IInventoryStock): boolean {
  return this.maximumQuantity ? this.currentQuantity > this.maximumQuantity : false;
};

InventoryStockSchema.methods.canReserve = function(this: IInventoryStock, quantity: number): boolean {
  return this.availableQuantity >= quantity;
};

InventoryStockSchema.methods.reserve = function(this: IInventoryStock, quantity: number): boolean {
  if (!this.canReserve(quantity)) {
    return false;
  }
  this.reservedQuantity += quantity;
  return true;
};

InventoryStockSchema.methods.unreserve = function(this: IInventoryStock, quantity: number): void {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
};

InventoryStockSchema.methods.addStock = function(
  this: IInventoryStock, 
  quantity: number, 
  unitCost?: number,
  batchNumber?: string,
  expirationDate?: Date
): void {
  const previousTotal = this.currentQuantity * this.averageUnitCost;
  this.currentQuantity += quantity;
  
  // Update average unit cost using weighted average
  if (unitCost && unitCost > 0) {
    const newTotal = previousTotal + (quantity * unitCost);
    this.averageUnitCost = this.currentQuantity > 0 ? newTotal / this.currentQuantity : 0;
  }
  
  // Add batch information if provided
  if (batchNumber) {
    const existingBatch = this.batchNumbers?.find(b => b.batchNumber === batchNumber);
    if (existingBatch) {
      existingBatch.quantity += quantity;
    } else {
      this.batchNumbers = this.batchNumbers || [];
      this.batchNumbers.push({
        batchNumber,
        quantity,
        expirationDate,
        receivedDate: new Date()
      });
    }
  }
  
  this.lastInDate = new Date();
  this.lastTransactionDate = new Date();
};

InventoryStockSchema.methods.removeStock = function(
  this: IInventoryStock, 
  quantity: number,
  batchNumber?: string
): boolean {
  if (this.availableQuantity < quantity) {
    return false;
  }
  
  // Remove from specific batch if specified
  if (batchNumber && this.batchNumbers) {
    const batch = this.batchNumbers.find(b => b.batchNumber === batchNumber);
    if (!batch || batch.quantity < quantity) {
      return false;
    }
    batch.quantity -= quantity;
    if (batch.quantity === 0) {
      this.batchNumbers = this.batchNumbers.filter(b => b.batchNumber !== batchNumber);
    }
  }
  
  this.currentQuantity -= quantity;
  this.lastOutDate = new Date();
  this.lastTransactionDate = new Date();
  return true;
};

// Static methods
InventoryStockSchema.statics.findByItem = function(itemId: mongoose.Types.ObjectId) {
  return this.find({ itemId, isActive: true }).populate('warehouseId');
};

InventoryStockSchema.statics.findByWarehouse = function(warehouseId: mongoose.Types.ObjectId) {
  return this.find({ warehouseId, isActive: true }).populate('itemId');
};

InventoryStockSchema.statics.findLowStock = function(warehouseId?: mongoose.Types.ObjectId) {
  const query: any = { 
    isActive: true,
    $expr: { $lte: ['$availableQuantity', '$reorderPoint'] }
  };
  
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  
  return this.find(query).populate('itemId warehouseId');
};

InventoryStockSchema.statics.findCriticalStock = function(warehouseId?: mongoose.Types.ObjectId) {
  const query: any = { 
    isActive: true,
    $expr: { $lte: ['$availableQuantity', '$minimumQuantity'] }
  };
  
  if (warehouseId) {
    query.warehouseId = warehouseId;
  }
  
  return this.find(query).populate('itemId warehouseId');
};

InventoryStockSchema.statics.getStockSummary = async function(warehouseId?: mongoose.Types.ObjectId) {
  const match: any = { isActive: true };
  if (warehouseId) match.warehouseId = warehouseId;

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$currentQuantity' },
        totalValue: { $sum: '$totalValue' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$availableQuantity', '$reorderPoint'] }, 1, 0]
          }
        },
        criticalStockItems: {
          $sum: {
            $cond: [{ $lte: ['$availableQuantity', '$minimumQuantity'] }, 1, 0]
          }
        },
        overStockItems: {
          $sum: {
            $cond: [
              { $and: [
                { $ne: ['$maximumQuantity', null] },
                { $gt: ['$currentQuantity', '$maximumQuantity'] }
              ]},
              1, 
              0
            ]
          }
        }
      }
    }
  ]);

  return summary[0] || {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockItems: 0,
    criticalStockItems: 0,
    overStockItems: 0
  };
};

const InventoryStock = mongoose.model<IInventoryStock>('InventoryStock', InventoryStockSchema);

export { InventoryStock, type IInventoryStock };