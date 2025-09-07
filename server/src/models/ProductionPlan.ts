import mongoose, { Document, Schema } from 'mongoose';

export interface IProductionPlan extends Document {
  planNumber: string;
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  itemCode: string;
  plannedQuantity: number;
  producedQuantity: number;
  startDate: Date;
  endDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  companyId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionPlanSchema = new Schema<IProductionPlan>({
  planNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemCode: {
    type: String,
    required: true,
    trim: true
  },
  plannedQuantity: {
    type: Number,
    required: true,
    min: [1, 'Planned quantity must be at least 1']
  },
  producedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Produced quantity cannot be negative']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IProductionPlan, endDate: Date) {
        return endDate >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion percentage
ProductionPlanSchema.virtual('completionPercentage').get(function(this: IProductionPlan) {
  if (this.plannedQuantity === 0) return 0;
  return Math.min(Math.round((this.producedQuantity / this.plannedQuantity) * 100), 100);
});

// Virtual for remaining days
ProductionPlanSchema.virtual('remainingDays').get(function(this: IProductionPlan) {
  const now = new Date();
  const timeDiff = this.endDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Indexes for performance
ProductionPlanSchema.index({ companyId: 1, isActive: 1 });
ProductionPlanSchema.index({ planNumber: 1 });
ProductionPlanSchema.index({ status: 1 });
ProductionPlanSchema.index({ startDate: 1, endDate: 1 });
ProductionPlanSchema.index({ itemId: 1 });
ProductionPlanSchema.index({ createdBy: 1 });

// Pre-save middleware to generate plan number
ProductionPlanSchema.pre('save', async function(this: IProductionPlan, next) {
  if (this.isNew && !this.planNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last plan number for this year and month
    const lastPlan = await mongoose.model('ProductionPlan').findOne({
      planNumber: new RegExp(`^PP-${year}${month}`),
      companyId: this.companyId
    }).sort({ planNumber: -1 });

    let sequenceNumber = 1;
    if (lastPlan) {
      const lastSequence = parseInt(lastPlan.planNumber.split('-')[2]);
      sequenceNumber = lastSequence + 1;
    }

    this.planNumber = `PP-${year}${month}-${String(sequenceNumber).padStart(3, '0')}`;
  }
  next();
});

const ProductionPlan = mongoose.model<IProductionPlan>('ProductionPlan', ProductionPlanSchema);

export default ProductionPlan;