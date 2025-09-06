import { IUser } from '../../src/models/User';
import { ICompany } from '../../src/models/Company';
import { IItem } from '../../src/models/Item';
import mongoose from 'mongoose';

export interface TestUser extends Partial<IUser> {
  password?: string;
}

export interface TestCompany extends Partial<ICompany> {}

export interface TestItem extends Partial<IItem> {}

export const testUsers: TestUser[] = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN',
    department: 'IT',
    position: 'System Administrator',
    phone: '010-1234-5678',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Manager User',
    email: 'manager@test.com',
    password: 'password123',
    role: 'MANAGER',
    department: 'Production',
    position: 'Production Manager',
    phone: '010-2345-6789',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Regular User',
    email: 'user@test.com',
    password: 'password123',
    role: 'USER',
    department: 'Warehouse',
    position: 'Operator',
    phone: '010-3456-7890',
    isActive: true
  }
];

export const testCompanies: TestCompany[] = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'ABC Supplier',
    businessNumber: '123-45-67890',
    address: 'Seoul, South Korea',
    phone: '02-1234-5678',
    email: 'contact@abc.com',
    ceo: 'John Doe',
    type: 'SUPPLIER',
    contactPerson: 'Jane Smith',
    contactPhone: '02-1234-5679',
    contactEmail: 'jane@abc.com',
    bankAccount: {
      bankName: 'Test Bank',
      accountNumber: '123-456-789',
      accountHolder: 'ABC Company'
    },
    taxInfo: {
      taxType: 'VAT',
      taxNumber: 'TAX123456'
    },
    isActive: true,
    notes: 'Reliable supplier for raw materials',
    createdBy: new mongoose.Types.ObjectId() as any
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'XYZ Customer',
    businessNumber: '987-65-43210',
    address: 'Busan, South Korea',
    phone: '051-9876-5432',
    email: 'order@xyz.com',
    ceo: 'Mike Johnson',
    type: 'CUSTOMER',
    contactPerson: 'Sarah Lee',
    contactPhone: '051-9876-5433',
    contactEmail: 'sarah@xyz.com',
    isActive: true,
    notes: 'Major customer for finished products',
    createdBy: new mongoose.Types.ObjectId() as any
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Universal Corp',
    businessNumber: '555-55-55555',
    address: 'Incheon, South Korea',
    phone: '032-5555-5555',
    email: 'info@universal.com',
    ceo: 'David Park',
    type: 'BOTH',
    contactPerson: 'Lisa Kim',
    contactPhone: '032-5555-5556',
    contactEmail: 'lisa@universal.com',
    isActive: true,
    notes: 'Both supplier and customer',
    createdBy: new mongoose.Types.ObjectId() as any
  }
];

export const testItems: TestItem[] = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    code: 'RAW001',
    name: 'Steel Sheet 10mm',
    category: 'RAW_MATERIAL',
    supplierId: new mongoose.Types.ObjectId() as any,
    unit: 'kg',
    price: 5000,
    cost: 4500,
    minStock: 100,
    maxStock: 1000,
    safetyStock: 50,
    leadTime: 7,
    specification: 'High quality steel sheet 10mm thickness',
    description: 'Premium steel sheet for manufacturing',
    barcode: '1234567890123',
    weight: 78.5,
    dimensions: {
      length: 2000,
      width: 1000,
      height: 10
    },
    storageConditions: 'Dry place, avoid direct sunlight',
    isActive: true,
    images: ['steel_sheet_01.jpg', 'steel_sheet_02.jpg'],
    tags: ['steel', 'raw-material', 'premium'],
    customFields: {
      supplier_code: 'ABC-ST-001',
      grade: 'A',
      certification: 'ISO9001'
    },
    createdBy: new mongoose.Types.ObjectId() as any
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    code: 'COMP001',
    name: 'Motor Assembly',
    category: 'COMPONENT',
    supplierId: new mongoose.Types.ObjectId() as any,
    unit: 'ea',
    price: 150000,
    cost: 120000,
    minStock: 20,
    maxStock: 200,
    safetyStock: 10,
    leadTime: 14,
    specification: '5HP electric motor with controller',
    description: 'High efficiency motor for production line',
    barcode: '2345678901234',
    weight: 25.0,
    dimensions: {
      length: 300,
      width: 200,
      height: 150
    },
    storageConditions: 'Climate controlled warehouse',
    expiryDays: 1825,
    isActive: true,
    tags: ['motor', 'component', 'electric'],
    customFields: {
      voltage: '220V',
      power: '5HP',
      warranty: '2 years'
    },
    createdBy: new mongoose.Types.ObjectId() as any
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    code: 'FIN001',
    name: 'Finished Product A',
    category: 'FINISHED_PRODUCT',
    unit: 'ea',
    price: 500000,
    cost: 350000,
    minStock: 5,
    maxStock: 50,
    safetyStock: 3,
    leadTime: 21,
    specification: 'Complete manufacturing unit ready for sale',
    description: 'High-end manufacturing equipment',
    barcode: '3456789012345',
    weight: 150.0,
    dimensions: {
      length: 1500,
      width: 800,
      height: 1200
    },
    storageConditions: 'Indoor storage, temperature controlled',
    expiryDays: 3650,
    isActive: true,
    tags: ['finished', 'equipment', 'premium'],
    customFields: {
      model: 'MFG-A-2024',
      serial_prefix: 'FPA',
      export_eligible: true
    },
    createdBy: new mongoose.Types.ObjectId() as any
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    code: 'CON001',
    name: 'Lubricant Oil',
    category: 'CONSUMABLE',
    supplierId: new mongoose.Types.ObjectId() as any,
    unit: 'liter',
    price: 25000,
    cost: 20000,
    minStock: 50,
    maxStock: 500,
    safetyStock: 25,
    leadTime: 3,
    specification: 'Industrial grade lubricant oil',
    description: 'High performance lubricant for machinery',
    barcode: '4567890123456',
    weight: 0.9,
    storageConditions: 'Cool, dry place away from heat sources',
    expiryDays: 730,
    isActive: true,
    tags: ['lubricant', 'consumable', 'maintenance'],
    customFields: {
      viscosity: '10W-30',
      flash_point: '220°C',
      msds_available: true
    },
    createdBy: new mongoose.Types.ObjectId() as any
  }
];

export const invalidTestData = {
  company: {
    invalidBusinessNumber: {
      name: 'Invalid Company',
      businessNumber: '123-456-789', // Wrong format
      type: 'SUPPLIER',
      createdBy: new mongoose.Types.ObjectId() as any
    },
    invalidEmail: {
      name: 'Invalid Email Company',
      email: 'invalid-email', // Invalid email
      type: 'CUSTOMER',
      createdBy: new mongoose.Types.ObjectId() as any
    },
    missingRequired: {
      businessNumber: '123-45-67890',
      address: 'Some address'
      // Missing name and type (required fields)
    }
  },
  item: {
    invalidCode: {
      code: '', // Empty code
      name: 'Test Item',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      price: 1000,
      cost: 800,
      createdBy: new mongoose.Types.ObjectId() as any
    },
    invalidCategory: {
      code: 'TEST001',
      name: 'Test Item',
      category: 'INVALID_CATEGORY', // Invalid category
      unit: 'kg',
      price: 1000,
      cost: 800,
      createdBy: new mongoose.Types.ObjectId() as any
    },
    negativePrice: {
      code: 'TEST002',
      name: 'Test Item',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      price: -100, // Negative price
      cost: 800,
      createdBy: new mongoose.Types.ObjectId() as any
    },
    maxStockLessThanMin: {
      code: 'TEST003',
      name: 'Test Item',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      price: 1000,
      cost: 800,
      minStock: 100,
      maxStock: 50, // Max less than min
      createdBy: new mongoose.Types.ObjectId() as any
    }
  }
};