import mongoose, { Document, Schema } from 'mongoose';

interface IPurchaseOrderItem {
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
  receivedQuantity?: number;
  notes?: string;
}

interface IPurchaseOrder extends Document {
  _id: string;
  orderNumber: string;
  supplierId: Schema.Types.ObjectId;
  supplier?: {
    _id: string;
    name: string;
    businessNumber?: string;
  };
  orderDate: Date;
  expectedDeliveryDate?: Date;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  deliveryAddress?: string;
  terms?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IPurchaseReceiptItem {
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  quality: 'GOOD' | 'DAMAGED' | 'DEFECTIVE';
  lotNumber?: string;
  expiryDate?: Date;
  notes?: string;
}

interface IPurchaseReceipt extends Document {
  _id: string;
  receiptNumber: string;
  purchaseOrderId?: Schema.Types.ObjectId;
  supplierId: Schema.Types.ObjectId;
  supplier?: {
    _id: string;
    name: string;
    businessNumber?: string;
  };
  receiptDate: Date;
  deliveryNote?: string;
  items: IPurchaseReceiptItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema({
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
  receivedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Received quantity cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
});

const PurchaseOrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
    default: 'DRAFT'
  },
  items: [PurchaseOrderItemSchema],
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
  terms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Terms cannot exceed 1000 characters']
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

const PurchaseReceiptItemSchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: [0.01, 'Ordered quantity must be positive']
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
  quality: {
    type: String,
    enum: ['GOOD', 'DAMAGED', 'DEFECTIVE'],
    default: 'GOOD'
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
  }
});

const PurchaseReceiptSchema = new Schema({
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
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  receiptDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryNote: {
    type: String,
    trim: true,
    maxlength: [100, 'Delivery note cannot exceed 100 characters']
  },
  items: [PurchaseReceiptItemSchema],
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
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
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
  }
}, {
  timestamps: true
});

// Indexes
PurchaseOrderSchema.index({ orderNumber: 1 });
PurchaseOrderSchema.index({ supplierId: 1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ orderDate: -1 });
PurchaseOrderSchema.index({ createdBy: 1 });

PurchaseReceiptSchema.index({ receiptNumber: 1 });
PurchaseReceiptSchema.index({ supplierId: 1 });
PurchaseReceiptSchema.index({ purchaseOrderId: 1 });
PurchaseReceiptSchema.index({ status: 1 });
PurchaseReceiptSchema.index({ receiptDate: -1 });

// Virtual populate
PurchaseOrderSchema.virtual('supplier', {
  ref: 'Company',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

PurchaseReceiptSchema.virtual('supplier', {
  ref: 'Company',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate totals
PurchaseOrderSchema.pre('save', function(this: IPurchaseOrder, next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount;
  next();
});

PurchaseReceiptSchema.pre('save', function(this: IPurchaseReceipt, next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount;
  next();
});

// Ensure virtual fields are serialized
PurchaseOrderSchema.set('toJSON', { virtuals: true });
PurchaseOrderSchema.set('toObject', { virtuals: true });
PurchaseReceiptSchema.set('toJSON', { virtuals: true });
PurchaseReceiptSchema.set('toObject', { virtuals: true });

const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
const PurchaseReceipt = mongoose.model<IPurchaseReceipt>('PurchaseReceipt', PurchaseReceiptSchema);

export { 
  PurchaseOrder, 
  PurchaseReceipt,
  type IPurchaseOrder, 
  type IPurchaseReceipt,
  type IPurchaseOrderItem,
  type IPurchaseReceiptItem
};