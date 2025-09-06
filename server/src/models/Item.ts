import mongoose, { Document, Schema } from 'mongoose';

interface IItem extends Document {
  _id: string;
  code: string;
  name: string;
  category: 'RAW_MATERIAL' | 'COMPONENT' | 'FINISHED_PRODUCT' | 'CONSUMABLE';
  supplierId?: Schema.Types.ObjectId;
  supplier?: {
    _id: string;
    name: string;
  };
  unit: string;
  price: number;
  cost: number;
  minStock: number;
  maxStock: number;
  safetyStock: number;
  leadTime: number;
  specification?: string;
  description?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  storageConditions?: string;
  expiryDays?: number;
  isActive: boolean;
  images?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema({
  code: {
    type: String,
    required: [true, 'Item code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'Item code cannot exceed 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [255, 'Item name cannot exceed 255 characters']
  },
  category: {
    type: String,
    enum: ['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE'],
    required: [true, 'Category is required']
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v: number) {
        return /^\d+(\.\d{1,2})?$/.test(v.toString());
      },
      message: 'Price should have at most 2 decimal places'
    }
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative'],
    validate: {
      validator: function(v: number) {
        return /^\d+(\.\d{1,2})?$/.test(v.toString());
      },
      message: 'Cost should have at most 2 decimal places'
    }
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock cannot be negative']
  },
  maxStock: {
    type: Number,
    default: 0,
    min: [0, 'Maximum stock cannot be negative'],
    validate: {
      validator: function(this: IItem, v: number) {
        return v >= this.minStock;
      },
      message: 'Maximum stock must be greater than or equal to minimum stock'
    }
  },
  safetyStock: {
    type: Number,
    default: 0,
    min: [0, 'Safety stock cannot be negative']
  },
  leadTime: {
    type: Number,
    default: 0,
    min: [0, 'Lead time cannot be negative']
  },
  specification: {
    type: String,
    trim: true,
    maxlength: [1000, 'Specification cannot exceed 1000 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    }
  },
  storageConditions: {
    type: String,
    trim: true,
    maxlength: [200, 'Storage conditions cannot exceed 200 characters']
  },
  expiryDays: {
    type: Number,
    min: [0, 'Expiry days cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  customFields: {
    type: Schema.Types.Mixed
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ItemSchema.index({ code: 1 });
ItemSchema.index({ name: 'text', specification: 'text', description: 'text' });
ItemSchema.index({ category: 1, isActive: 1 });
ItemSchema.index({ supplierId: 1 });
ItemSchema.index({ barcode: 1 }, { sparse: true });
ItemSchema.index({ createdBy: 1 });

// Virtual populate for supplier information
ItemSchema.virtual('supplier', {
  ref: 'Company',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
ItemSchema.set('toJSON', { virtuals: true });
ItemSchema.set('toObject', { virtuals: true });

const Item = mongoose.model<IItem>('Item', ItemSchema);

export { Item, type IItem };
export default Item;