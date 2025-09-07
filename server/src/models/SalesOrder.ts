import mongoose, { Document, Schema } from 'mongoose';

interface ISalesOrderItem {
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shippedQuantity?: number;
  notes?: string;
}

interface ISalesOrder extends Document {
  _id: string;
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  customer?: {
    _id: string;
    name: string;
    businessNumber?: string;
  };
  orderDate: Date;
  requestedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: ISalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderItemSchema = new Schema({
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
  shippedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Shipped quantity cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { _id: false });

const SalesOrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  requestedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'DRAFT'
  },
  items: [SalesOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  deliveryAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Delivery address cannot exceed 500 characters']
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment terms cannot exceed 500 characters']
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'PENDING'
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
  }
}, {
  timestamps: true
});

// Indexes
SalesOrderSchema.index({ orderNumber: 1 });
SalesOrderSchema.index({ customerId: 1 });
SalesOrderSchema.index({ status: 1 });
SalesOrderSchema.index({ orderDate: -1 });
SalesOrderSchema.index({ paymentStatus: 1 });
SalesOrderSchema.index({ createdBy: 1 });

// Virtual populate
SalesOrderSchema.virtual('customer', {
  ref: 'Company',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate totals
SalesOrderSchema.pre('save', function(this: ISalesOrder, next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  next();
});

// Pre-save middleware to generate order number
SalesOrderSchema.pre('save', async function(this: ISalesOrder, next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('SalesOrder').countDocuments({
        orderNumber: new RegExp(`^SO-${currentYear}`)
      });
      this.orderNumber = `SO-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance methods
SalesOrderSchema.methods.canConfirm = function(this: ISalesOrder): boolean {
  return this.status === 'DRAFT';
};

SalesOrderSchema.methods.canCancel = function(this: ISalesOrder): boolean {
  return ['DRAFT', 'CONFIRMED'].includes(this.status);
};

SalesOrderSchema.methods.canShip = function(this: ISalesOrder): boolean {
  return this.status === 'READY_TO_SHIP';
};

SalesOrderSchema.methods.confirm = function(this: ISalesOrder, approver: mongoose.Types.ObjectId): void {
  if (!this.canConfirm()) {
    throw new Error('Cannot confirm order in current status');
  }
  this.status = 'CONFIRMED';
  this.approvedBy = approver;
  this.approvedAt = new Date();
};

SalesOrderSchema.methods.cancel = function(this: ISalesOrder, reason?: string): void {
  if (!this.canCancel()) {
    throw new Error('Cannot cancel order in current status');
  }
  this.status = 'CANCELLED';
  if (reason) {
    this.notes = (this.notes || '') + `\n[${new Date().toISOString()}] Cancelled: ${reason}`;
  }
};

SalesOrderSchema.methods.ship = function(this: ISalesOrder, shipDate?: Date): void {
  if (!this.canShip()) {
    throw new Error('Cannot ship order in current status');
  }
  this.status = 'SHIPPED';
  this.actualDeliveryDate = shipDate || new Date();
};

SalesOrderSchema.methods.deliver = function(this: ISalesOrder, deliveryDate?: Date): void {
  if (this.status !== 'SHIPPED') {
    throw new Error('Cannot deliver order that has not been shipped');
  }
  this.status = 'DELIVERED';
  this.actualDeliveryDate = deliveryDate || new Date();
};

SalesOrderSchema.methods.getTotalQuantity = function(this: ISalesOrder): number {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

SalesOrderSchema.methods.getShippedQuantity = function(this: ISalesOrder): number {
  return this.items.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0);
};

SalesOrderSchema.methods.isFullyShipped = function(this: ISalesOrder): boolean {
  return this.getTotalQuantity() === this.getShippedQuantity();
};

// Static methods
SalesOrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status, isActive: true }).sort({ orderDate: -1 });
};

SalesOrderSchema.statics.findByCustomer = function(customerId: mongoose.Types.ObjectId) {
  return this.find({ customerId, isActive: true }).sort({ orderDate: -1 });
};

SalesOrderSchema.statics.findOverdue = function() {
  const today = new Date();
  return this.find({
    requestedDeliveryDate: { $lt: today },
    status: { $in: ['CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP'] },
    isActive: true
  }).sort({ requestedDeliveryDate: 1 });
};

SalesOrderSchema.statics.getStatistics = async function() {
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

SalesOrderSchema.statics.getRevenueByPeriod = async function(startDate: Date, endDate: Date) {
  const revenue = await this.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'CANCELLED' },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    }
  ]);
  
  return revenue[0] || { totalRevenue: 0, orderCount: 0 };
};

// Ensure virtual fields are serialized
SalesOrderSchema.set('toJSON', { virtuals: true });
SalesOrderSchema.set('toObject', { virtuals: true });

const SalesOrder = mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);

export { SalesOrder, type ISalesOrder, type ISalesOrderItem };