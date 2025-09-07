import mongoose, { Document, Schema } from 'mongoose';

interface IInspectionStandard {
  dimension: string;
  tolerance: string;
  testMethod: string;
  result?: string;
  status?: 'PASS' | 'FAIL';
}

interface IQualityInspection extends Document {
  _id: string;
  inspectionNumber: string;
  itemId: Schema.Types.ObjectId;
  item?: {
    _id: string;
    code: string;
    name: string;
    unit: string;
  };
  inspectionDate: Date;
  inspectorId: Schema.Types.ObjectId;
  inspector?: {
    _id: string;
    name: string;
    employeeNumber: string;
  };
  result: 'PENDING' | 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  unit: string;
  defectTypes?: string[];
  notes?: string;
  source: 'RECEIPT' | 'PRODUCTION' | 'SHIPMENT' | 'RANDOM';
  sourceNumber?: string;
  sourceId?: Schema.Types.ObjectId;
  standards: IInspectionStandard[];
  inspectionMethod: 'FULL' | 'SAMPLING' | 'STATISTICAL';
  sampleSize?: number;
  temperature?: number;
  humidity?: number;
  equipmentUsed?: string[];
  attachments?: string[];
  reportGenerated?: boolean;
  reportPath?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionStandardSchema = new Schema({
  dimension: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Dimension cannot exceed 100 characters']
  },
  tolerance: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Tolerance cannot exceed 100 characters']
  },
  testMethod: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Test method cannot exceed 200 characters']
  },
  result: {
    type: String,
    trim: true,
    maxlength: [200, 'Result cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['PASS', 'FAIL']
  }
}, { _id: false });

const QualityInspectionSchema = new Schema({
  inspectionNumber: {
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
  inspectionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  inspectorId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  result: {
    type: String,
    enum: ['PENDING', 'PASS', 'FAIL', 'CONDITIONAL_PASS'],
    default: 'PENDING'
  },
  inspectedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Inspected quantity cannot be negative']
  },
  passedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Passed quantity cannot be negative']
  },
  failedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Failed quantity cannot be negative']
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  defectTypes: [{
    type: String,
    trim: true,
    maxlength: [100, 'Defect type cannot exceed 100 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  source: {
    type: String,
    enum: ['RECEIPT', 'PRODUCTION', 'SHIPMENT', 'RANDOM'],
    required: true
  },
  sourceNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Source number cannot exceed 50 characters']
  },
  sourceId: {
    type: Schema.Types.ObjectId
  },
  standards: [InspectionStandardSchema],
  inspectionMethod: {
    type: String,
    enum: ['FULL', 'SAMPLING', 'STATISTICAL'],
    default: 'SAMPLING'
  },
  sampleSize: {
    type: Number,
    min: [1, 'Sample size must be at least 1']
  },
  temperature: {
    type: Number
  },
  humidity: {
    type: Number,
    min: [0, 'Humidity cannot be negative'],
    max: [100, 'Humidity cannot exceed 100%']
  },
  equipmentUsed: [{
    type: String,
    trim: true,
    maxlength: [100, 'Equipment name cannot exceed 100 characters']
  }],
  attachments: [{
    type: String,
    trim: true
  }],
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportPath: {
    type: String,
    trim: true
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
QualityInspectionSchema.index({ inspectionNumber: 1 });
QualityInspectionSchema.index({ itemId: 1 });
QualityInspectionSchema.index({ inspectorId: 1 });
QualityInspectionSchema.index({ inspectionDate: -1 });
QualityInspectionSchema.index({ result: 1 });
QualityInspectionSchema.index({ source: 1 });
QualityInspectionSchema.index({ isActive: 1 });

// Virtual populate
QualityInspectionSchema.virtual('item', {
  ref: 'Item',
  localField: 'itemId',
  foreignField: '_id',
  justOne: true
});

QualityInspectionSchema.virtual('inspector', {
  ref: 'Employee',
  localField: 'inspectorId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate inspection number
QualityInspectionSchema.pre('save', async function(this: IQualityInspection, next) {
  if (this.isNew && !this.inspectionNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('QualityInspection').countDocuments({
        inspectionNumber: new RegExp(`^QI-${currentYear}`)
      });
      this.inspectionNumber = `QI-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save middleware to validate quantities
QualityInspectionSchema.pre('save', function(this: IQualityInspection, next) {
  if (this.passedQuantity + this.failedQuantity > this.inspectedQuantity) {
    return next(new Error('Passed + Failed quantity cannot exceed inspected quantity'));
  }
  next();
});

// Instance methods
QualityInspectionSchema.methods.canComplete = function(this: IQualityInspection): boolean {
  return this.result === 'PENDING';
};

QualityInspectionSchema.methods.complete = function(
  this: IQualityInspection,
  result: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS',
  passedQuantity: number,
  failedQuantity: number,
  notes?: string
): void {
  if (!this.canComplete()) {
    throw new Error('Cannot complete inspection in current status');
  }
  
  if (passedQuantity + failedQuantity > this.inspectedQuantity) {
    throw new Error('Passed + Failed quantity cannot exceed inspected quantity');
  }
  
  this.result = result;
  this.passedQuantity = passedQuantity;
  this.failedQuantity = failedQuantity;
  
  if (notes) {
    this.notes = notes;
  }
};

QualityInspectionSchema.methods.getPassRate = function(this: IQualityInspection): number {
  if (this.inspectedQuantity === 0) return 0;
  return Math.round((this.passedQuantity / this.inspectedQuantity) * 100);
};

QualityInspectionSchema.methods.getFailRate = function(this: IQualityInspection): number {
  if (this.inspectedQuantity === 0) return 0;
  return Math.round((this.failedQuantity / this.inspectedQuantity) * 100);
};

QualityInspectionSchema.methods.addDefectType = function(this: IQualityInspection, defectType: string): void {
  if (!this.defectTypes) {
    this.defectTypes = [];
  }
  if (!this.defectTypes.includes(defectType)) {
    this.defectTypes.push(defectType);
  }
};

// Static methods
QualityInspectionSchema.statics.findByResult = function(result: string) {
  return this.find({ result, isActive: true }).sort({ inspectionDate: -1 });
};

QualityInspectionSchema.statics.findBySource = function(source: string) {
  return this.find({ source, isActive: true }).sort({ inspectionDate: -1 });
};

QualityInspectionSchema.statics.findByInspector = function(inspectorId: mongoose.Types.ObjectId) {
  return this.find({ inspectorId, isActive: true }).sort({ inspectionDate: -1 });
};

QualityInspectionSchema.statics.findPending = function() {
  return this.find({ result: 'PENDING', isActive: true }).sort({ inspectionDate: 1 });
};

QualityInspectionSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 },
        totalInspected: { $sum: '$inspectedQuantity' },
        totalPassed: { $sum: '$passedQuantity' },
        totalFailed: { $sum: '$failedQuantity' }
      }
    }
  ]);
  
  return stats;
};

QualityInspectionSchema.statics.getPassRateByPeriod = async function(startDate: Date, endDate: Date) {
  const stats = await this.aggregate([
    {
      $match: {
        inspectionDate: { $gte: startDate, $lte: endDate },
        result: { $ne: 'PENDING' },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalInspected: { $sum: '$inspectedQuantity' },
        totalPassed: { $sum: '$passedQuantity' },
        totalFailed: { $sum: '$failedQuantity' }
      }
    },
    {
      $addFields: {
        passRate: {
          $cond: [
            { $eq: ['$totalInspected', 0] },
            0,
            { $multiply: [{ $divide: ['$totalPassed', '$totalInspected'] }, 100] }
          ]
        }
      }
    }
  ]);
  
  return stats[0] || { totalInspected: 0, totalPassed: 0, totalFailed: 0, passRate: 0 };
};

// Ensure virtual fields are serialized
QualityInspectionSchema.set('toJSON', { virtuals: true });
QualityInspectionSchema.set('toObject', { virtuals: true });

const QualityInspection = mongoose.model<IQualityInspection>('QualityInspection', QualityInspectionSchema);

export { QualityInspection, type IQualityInspection, type IInspectionStandard };