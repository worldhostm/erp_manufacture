import mongoose, { Document, Schema } from 'mongoose';

interface IInventoryTransaction extends Document {
  _id: string;
  transactionNumber: string;
  itemId: Schema.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  warehouseId: Schema.Types.ObjectId;
  warehouseName: string;
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  previousQuantity: number;
  currentQuantity: number;
  referenceId?: Schema.Types.ObjectId; // Receipt, Issue, Transfer 등의 ID
  referenceType?: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  referenceNumber?: string;
  transactionDate: Date;
  reason?: string;
  notes?: string;
  batchNumber?: string;
  expirationDate?: Date;
  location?: string;
  userId: Schema.Types.ObjectId;
  userName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema({
  transactionNumber: {
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
  transactionType: {
    type: String,
    enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: function(value: number) {
        return value !== 0;
      },
      message: 'Quantity cannot be zero'
    }
  },
  unitPrice: {
    type: Number,
    min: [0, 'Unit price cannot be negative']
  },
  totalValue: {
    type: Number,
    min: [0, 'Total value cannot be negative']
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: [0, 'Previous quantity cannot be negative']
  },
  currentQuantity: {
    type: Number,
    required: true,
    min: [0, 'Current quantity cannot be negative']
  },
  referenceId: {
    type: Schema.Types.ObjectId
  },
  referenceType: {
    type: String,
    enum: ['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN']
  },
  referenceNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  expirationDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'User name cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
InventoryTransactionSchema.index({ transactionNumber: 1 });
InventoryTransactionSchema.index({ itemId: 1 });
InventoryTransactionSchema.index({ warehouseId: 1 });
InventoryTransactionSchema.index({ transactionType: 1 });
InventoryTransactionSchema.index({ transactionDate: -1 });
InventoryTransactionSchema.index({ referenceId: 1, referenceType: 1 });
InventoryTransactionSchema.index({ isActive: 1 });
InventoryTransactionSchema.index({ itemId: 1, warehouseId: 1, transactionDate: -1 });

// Pre-save middleware to calculate total value
InventoryTransactionSchema.pre('save', function(this: IInventoryTransaction, next) {
  if (this.unitPrice && this.quantity) {
    this.totalValue = Math.abs(this.quantity) * this.unitPrice;
  }
  next();
});

// Pre-save middleware to generate transaction number
InventoryTransactionSchema.pre('save', async function(this: IInventoryTransaction, next) {
  if (this.isNew && !this.transactionNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await mongoose.model('InventoryTransaction').countDocuments({
        transactionNumber: new RegExp(`^TXN-${currentYear}${currentMonth}`)
      });
      this.transactionNumber = `TXN-${currentYear}${currentMonth}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Static methods
InventoryTransactionSchema.statics.findByItem = function(itemId: mongoose.Types.ObjectId) {
  return this.find({ itemId, isActive: true }).sort({ transactionDate: -1 });
};

InventoryTransactionSchema.statics.findByWarehouse = function(warehouseId: mongoose.Types.ObjectId) {
  return this.find({ warehouseId, isActive: true }).sort({ transactionDate: -1 });
};

InventoryTransactionSchema.statics.findByItemAndWarehouse = function(
  itemId: mongoose.Types.ObjectId, 
  warehouseId: mongoose.Types.ObjectId
) {
  return this.find({ 
    itemId, 
    warehouseId, 
    isActive: true 
  }).sort({ transactionDate: -1 });
};

InventoryTransactionSchema.statics.getInventoryMovement = async function(
  itemId?: mongoose.Types.ObjectId,
  warehouseId?: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = { isActive: true };
  
  if (itemId) match.itemId = itemId;
  if (warehouseId) match.warehouseId = warehouseId;
  if (startDate || endDate) {
    match.transactionDate = {};
    if (startDate) match.transactionDate.$gte = startDate;
    if (endDate) match.transactionDate.$lte = endDate;
  }

  const movement = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          itemId: '$itemId',
          warehouseId: '$warehouseId',
          transactionType: '$transactionType'
        },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        transactionCount: { $sum: 1 },
        lastTransactionDate: { $max: '$transactionDate' }
      }
    },
    {
      $group: {
        _id: {
          itemId: '$_id.itemId',
          warehouseId: '$_id.warehouseId'
        },
        movements: {
          $push: {
            type: '$_id.transactionType',
            quantity: '$totalQuantity',
            value: '$totalValue',
            count: '$transactionCount',
            lastDate: '$lastTransactionDate'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'items',
        localField: '_id.itemId',
        foreignField: '_id',
        as: 'item'
      }
    },
    {
      $lookup: {
        from: 'warehouses',
        localField: '_id.warehouseId',
        foreignField: '_id',
        as: 'warehouse'
      }
    }
  ]);

  return movement;
};

const InventoryTransaction = mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);

export { InventoryTransaction, type IInventoryTransaction };