import mongoose, { Document, Schema } from 'mongoose';

interface IEmployee extends Document {
  _id: string;
  employeeNumber: string;
  name: string;
  nameEng?: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  rank?: string;
  hireDate: Date;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  salary?: {
    baseSalary: number;
    currency: string;
    payType: 'MONTHLY' | 'HOURLY' | 'ANNUAL';
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  workSchedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
    breakTime?: number;
  };
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
  }>;
  notes?: string;
  profileImage?: string;
  managerId?: Schema.Types.ObjectId;
  manager?: {
    _id: string;
    name: string;
    employeeNumber: string;
  };
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Korea' }
}, { _id: false });

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true }
}, { _id: false });

const SalarySchema = new Schema({
  baseSalary: { 
    type: Number, 
    required: true,
    min: [0, 'Base salary cannot be negative']
  },
  currency: { type: String, default: 'KRW' },
  payType: { 
    type: String, 
    enum: ['MONTHLY', 'HOURLY', 'ANNUAL'], 
    default: 'MONTHLY' 
  }
}, { _id: false });

const BankAccountSchema = new Schema({
  bankName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  accountHolder: { type: String, required: true, trim: true }
}, { _id: false });

const WorkScheduleSchema = new Schema({
  workDays: [{ 
    type: String, 
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] 
  }],
  startTime: { type: String, required: true }, // Format: "09:00"
  endTime: { type: String, required: true },   // Format: "18:00"
  breakTime: { type: Number, default: 60 }     // Minutes
}, { _id: false });

const CertificationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date }
}, { _id: false });

const EmployeeSchema = new Schema({
  employeeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^EMP\d{6}$/, 'Employee number must be in format EMP######']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  nameEng: {
    type: String,
    trim: true,
    maxlength: [100, 'English name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\d\-\+\(\)\s]+$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  rank: {
    type: String,
    trim: true,
    maxlength: [50, 'Rank cannot exceed 50 characters']
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  birthDate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  address: AddressSchema,
  emergencyContact: EmergencyContactSchema,
  salary: SalarySchema,
  bankAccount: BankAccountSchema,
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'],
    default: 'ACTIVE'
  },
  workSchedule: WorkScheduleSchema,
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  certifications: [CertificationSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
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
EmployeeSchema.index({ employeeNumber: 1 });
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ position: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ name: 'text', nameEng: 'text' });
EmployeeSchema.index({ hireDate: -1 });
EmployeeSchema.index({ isActive: 1 });

// Virtual populate for manager
EmployeeSchema.virtual('manager', {
  ref: 'Employee',
  localField: 'managerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate employee number
EmployeeSchema.pre('save', async function(this: IEmployee, next) {
  if (this.isNew && !this.employeeNumber) {
    try {
      const count = await mongoose.model('Employee').countDocuments();
      this.employeeNumber = `EMP${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save middleware to validate manager hierarchy
EmployeeSchema.pre('save', async function(this: IEmployee, next) {
  if (this.managerId && this.managerId.toString() === this._id.toString()) {
    return next(new Error('Employee cannot be their own manager'));
  }
  next();
});

// Instance methods
EmployeeSchema.methods.getFullName = function(this: IEmployee): string {
  return this.nameEng ? `${this.name} (${this.nameEng})` : this.name;
};

EmployeeSchema.methods.getAge = function(this: IEmployee): number | null {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

EmployeeSchema.methods.getServiceYears = function(this: IEmployee): number {
  const today = new Date();
  const hireDate = new Date(this.hireDate);
  return Math.floor((today.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// Static methods
EmployeeSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department, isActive: true }).sort({ name: 1 });
};

EmployeeSchema.statics.findActiveEmployees = function() {
  return this.find({ status: 'ACTIVE', isActive: true }).sort({ name: 1 });
};

EmployeeSchema.statics.searchEmployees = function(searchTerm: string) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { nameEng: { $regex: searchTerm, $options: 'i' } },
          { employeeNumber: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  }).sort({ name: 1 });
};

// Ensure virtual fields are serialized
EmployeeSchema.set('toJSON', { virtuals: true });
EmployeeSchema.set('toObject', { virtuals: true });

const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

export { Employee, type IEmployee };